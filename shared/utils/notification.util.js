// src/utils/notification.util.js
'use strict';

const SESUtil = require('./SES.util');
const SNSUtil = require('./SNS.util');
const SessionCacheUtil = require('./sessionCache.util');
const notificationTypeRepo = require('../repositories/notificationType.repository');
const globalNotificationRepo = require('../repositories/globalNotification.repository');
const userNotificationPreferenceRepo = require('../repositories/userNotificationPreference.repository');
const notificationRepo = require('../repositories/notification.repository');
const userPushTokenRepo = require('../repositories/userPushToken.repository');
const notificationEmitter = require('./notificationEmitter.util');
const { logger } = require('./logger.util');
const AppError = require('./appError.util');

class NotificationUtil {

    /**
     * Crea y envía una notificación directa por email sin guardarla en BD
     * @param {Object} data - Datos de la notificación
     * @param {string} data.tipo_notificacion - Código del tipo de notificación (requerido)
     * @param {string} data.email - Email del destinatario (requerido)
     * @param {Object} [data.metadata] - Datos adicionales para reemplazar en templates
     */
    static async crearNotificacionDirecta(data) {
        try {
            const {
                tipo_notificacion,
                email,
                metadata = {},
            } = data;

            // Validaciones
            if (!tipo_notificacion) {
                throw AppError.badRequest('tipo_notificacion es requerido');
            }

            if (!email) {
                throw AppError.badRequest('email es requerido');
            }

            // Obtener tipo de notificación de BD
            const notificationType = await notificationTypeRepo.findByCode(tipo_notificacion);
            if (!notificationType) {
                throw AppError.notFound(`Tipo de notificación no encontrado: ${tipo_notificacion}`);
            }

            // Enviar email directamente
            await SESUtil.enviarNotificacion(email, notificationType, metadata);

            logger.info('Notificación directa enviada exitosamente', {
                tipo: tipo_notificacion,
                email
            });

            return {
                estado_solicitud: 1,
                message: 'Notificación enviada exitosamente por email.'
            };
        } catch (error) {
            logger.error('Error al enviar notificación directa', { 
                error: error.message, 
                stack: error.stack 
            });
            throw error;
        }
    }

    /**
     * Crea y envía una notificación (individual o global)
     * @param {Object} data - Datos de la notificación
     * @param {string} data.tipo_notificacion - Código del tipo de notificación (requerido)
     * @param {string|null} data.user_id - ID del usuario (null para notificaciones globales)
     * @param {Object} [data.related_entity] - Entidad relacionada { type, id }
     * @param {Object} [data.metadata] - Datos adicionales para reemplazar en templates
     * @param {Object} transaction - Transacción de Sequelize
     */
    static async crearNotificacion(data, transaction = null) {
        try {
            const {
                tipo_notificacion,
                user_id = null,
                related_entity = {},
                metadata = {},
            } = data;

            // Validar que venga el tipo de notificación
            if (!tipo_notificacion) {
                throw AppError.badRequest('tipo_notificacion es requerido');
            }

            // 1. Obtener tipo de notificación de BD
            const notificationType = await notificationTypeRepo.findByCode(tipo_notificacion);
            if (!notificationType) {
                throw AppError.notFound(`Tipo de notificación no encontrado: ${tipo_notificacion}`);
            }

            // 2. Generar contenido desde templates usando metadata
            const generated = this._generarContenido(notificationType, metadata);
            const title = generated.title;
            const body = generated.body;
            const emailSubject = generated.emailSubject;
            const emailBody = generated.emailBody;

            // 3. Crear notificación según el tipo (individual o global)
            let result;
            if (user_id) {
                result = await this._crearNotificacionIndividual(
                    user_id,
                    notificationType,
                    title,
                    body,
                    related_entity,
                    metadata,
                    transaction
                );
            } else {
                result = await this._crearNotificacionGlobal(
                    notificationType,
                    title,
                    body,
                    metadata,
                    transaction,
                    emailSubject,
                    emailBody
                );
            }

            logger.info('Notificación creada exitosamente', {
                notification_id: result.notification_id || result.global_notification_id,
                tipo: tipo_notificacion,
                user_id,
                is_global: !user_id
            });

            // 4. Emitir evento SSE si es notificación individual
            if (user_id) {
                try {
                    const notificationRepo = require('../repositories/notification.repository');
                    const globalNotificationRepo = require('../repositories/globalNotification.repository');
                    
                    const personalCount = await notificationRepo.countUnreadByUser(user_id);
                    const globalUnread = await globalNotificationRepo.findUnreadByUser(user_id);
                    const globalCount = globalUnread.length;
                    const newCount = personalCount + globalCount;

                    notificationEmitter.emit('count-updated', {
                        userId: user_id,
                        count: newCount
                    });

                    logger.debug('SSE event emitted from NotificationUtil', { user_id, count: newCount });
                } catch (sseError) {
                    logger.error('Error emitting SSE event', {
                        user_id,
                        error: sseError.message
                    });
                }
            }

            return {
                estado_solicitud: 1,
                message: 'Notificación creada exitosamente.',
                ...result
            };
        } catch (error) {
            logger.error('Error al crear notificación', { error: error.message, stack: error.stack });
            throw error;
        }
    }

    /**
     * MÉTODO PRIVADO: Crea notificación individual y programa envíos
     */
    static async _crearNotificacionIndividual(userId, notificationType, title, body, related_entity, metadata, transaction) {
        // 1. SIEMPRE crear notificación in-app
        const notification = await notificationRepo.create({
            user_id: userId,
            notification_type_id: notificationType.notification_type_id,
            title,
            body,
            related_entity_type: related_entity?.type || null,
            related_entity_id: related_entity?.id || null,
            metadata,
            processing_status: 'pending',
            priority: this._mapPriority(notificationType.priority)
        }, { transaction });

        // 2. Obtener preferencias del usuario
        const userPreference = await userNotificationPreferenceRepo.findByUserAndType(
            userId,
            notificationType.code
        );

        // 3. Verificar quiet hours
        const isQuietHours = this._isInQuietHours(userPreference);
        const isHighPriority = notificationType.priority === 'high';

        // 4. Programar envíos en background (no bloquear respuesta)
        setImmediate(() => {
            this._procesarEnviosIndividuales(
                notification.notification_id,
                userId,
                notificationType,
                title,
                body,
                metadata,
                userPreference,
                isQuietHours,
                isHighPriority
            ).catch(err => {
                logger.error('Error procesando envíos individuales', {
                    error: err.message,
                    notification_id: notification.notification_id
                });
            });
        });

        return { notification_id: notification.notification_id };
    }

    /**
     * MÉTODO PRIVADO: Crea notificación global y programa envíos masivos
     */
    static async _crearNotificacionGlobal(notificationType, title, body, metadata, transaction) {
        // 1. Crear notificación global
        const globalNotification = await globalNotificationRepo.create({
            notification_type_id: notificationType.notification_type_id,
            title,
            body,
            metadata,
            send_push: notificationType.supports_push,
            send_email: notificationType.supports_email,
            send_in_app: true,
            batch_size: 100,
            is_active: true
        }, { transaction });

        // 2. Programar procesamiento en background
        setImmediate(() => {
            this._procesarNotificacionGlobal(
                globalNotification.global_notification_id,
                notificationType,
                title,
                body,
                metadata
            ).catch(err => {
                logger.error('Error procesando notificación global', {
                    error: err.message,
                    global_notification_id: globalNotification.global_notification_id
                });
            });
        });

        return {
            global_notification_id: globalNotification.global_notification_id
        };
    }

    /**
     * MÉTODO PRIVADO: Procesa envíos individuales (push/email)
     */
    static async _procesarEnviosIndividuales(notificationId, userId, notificationType, title, body, metadata, userPreference, isQuietHours, isHighPriority) {
        try {
            // PUSH
            if (notificationType.supports_push) {
                const allowPush = userPreference?.allow_push ?? true;

                if (allowPush) {
                    if (isQuietHours && !isHighPriority) {
                        // Programar para después de quiet hours
                        await this._programarEnvioPush(notificationId, userPreference);
                    } else {
                        // Enviar inmediatamente
                        await this._enviarPushIndividual(userId, title, body, metadata, notificationId);
                    }
                }
            }

            // EMAIL - CORREGIDO: pasar notificationType y metadata
            if (notificationType.supports_email) {
                const allowEmail = userPreference?.allow_email ?? true;

                if (allowEmail) {
                    if (isQuietHours && !isHighPriority) {
                        // Programar para después de quiet hours
                        await this._programarEnvioEmail(notificationId, userPreference);
                    } else {
                        // Enviar inmediatamente - PASAR notificationType y metadata
                        await this._enviarEmailIndividual(userId, notificationType, metadata, notificationId);
                    }
                }
            }

            // Actualizar estado
            await notificationRepo.updateProcessingStatus(notificationId, 'completed');

        } catch (error) {
            logger.error('Error en procesamiento individual', {
                error: error.message,
                notificationId
            });
            await notificationRepo.updateProcessingStatus(notificationId, 'failed');
        }
    }

    /**
     * MÉTODO PRIVADO: Procesa notificación global por lotes
     */
    static async _procesarNotificacionGlobal(globalNotificationId, notificationType, title, body, metadata) {
        try {
            const cache = SessionCacheUtil.getCache();

            // Obtener usuarios elegibles (aquí deberías filtrar según target_user_role, etc)
            const userRepository = require('../repositories/user.repository');

            const allUsers = await userRepository.findAll(
            { is_active: true },
            {
                attributes: ['user_id'],
                include: userRepository.INCLUDES.basic
            }
            );

            const totalUsers = allUsers.length;
            const batchSize = 100;
            const totalBatches = Math.ceil(totalUsers / batchSize);

            // Actualizar totales
            await globalNotificationRepo.update(globalNotificationId, {
                total_target_users: totalUsers,
                processing_started_at: new Date()
            });

            // Guardar estado en Redis
            await cache.set(
                `global_notif:${globalNotificationId}:batch_state`,
                JSON.stringify({
                    total_users: totalUsers,
                    processed_users: 0,
                    current_batch: 0,
                    batch_size: batchSize,
                    status: 'processing',
                    started_at: new Date().toISOString()
                }),
                24 * 60 * 60 // TTL: 24 horas
            );

            // Procesar PUSH por lotes
            if (notificationType.supports_push) {
                await globalNotificationRepo.updatePushProcessingStatus(
                    globalNotificationId,
                    'processing'
                );

                await this._enviarPushGlobalPorLotes(
                    globalNotificationId,
                    allUsers,
                    title,
                    body,
                    metadata,
                    notificationType.code,
                    cache
                );

                await globalNotificationRepo.updatePushProcessingStatus(
                    globalNotificationId,
                    'completed'
                );
            }

            // Procesar EMAIL por lotes
            if (notificationType.supports_email) {
                await globalNotificationRepo.updateEmailProcessingStatus(
                    globalNotificationId,
                    'processing'
                );

                await this._enviarEmailGlobalPorLotes(
                    globalNotificationId,
                    allUsers,
                    notificationType,  // PASAR EL OBJETO COMPLETO
                    metadata,          // PASAR METADATA
                    notificationType.code,
                    cache
                );

                await globalNotificationRepo.updateEmailProcessingStatus(
                    globalNotificationId,
                    'completed'
                );
            }

            // Actualizar completado
            await globalNotificationRepo.update(globalNotificationId, {
                processing_completed_at: new Date()
            });

            // Limpiar estado de Redis después de 1 hora
            setTimeout(async () => {
                await cache.del(`global_notif:${globalNotificationId}:batch_state`);
            }, 60 * 60 * 1000);

        } catch (error) {
            logger.error('Error en procesamiento global', {
                error: error.message,
                globalNotificationId
            });

            await globalNotificationRepo.update(globalNotificationId, {
                push_processing_status: 'failed',
                email_processing_status: 'failed'
            });
        }
    }

    /**
     * MÉTODO PRIVADO: Envía push individual con manejo de errores
     */
    static async _enviarPushIndividual(userId, title, body, metadata, notificationId) {
        try {
            const tokens = await userPushTokenRepo.findActiveByUser(userId);

            if (tokens.length === 0) {
                logger.warn('Usuario sin tokens push activos', { userId });
                return;
            }

            const promises = tokens.map(tokenData =>
                SNSUtil.enviarPushIndividual(tokenData.token, title, body, metadata)
                    .catch(err => {
                        logger.error('Error enviando a token específico', {
                            error: err.message,
                            token: tokenData.token.substring(0, 20) + '...'
                        });
                        return { success: false, error: err.message };
                    })
            );

            const results = await Promise.allSettled(promises);
            const successCount = results.filter(r => r.status === 'fulfilled' && r.value.success !== false).length;

            if (successCount > 0) {
                await notificationRepo.markPushSent(notificationId);
                logger.info('Push individual enviado', { userId, successCount, totalTokens: tokens.length });
            } else {
                await notificationRepo.recordPushError(notificationId, 'Todos los envíos fallaron');
            }

        } catch (error) {
            logger.error('Error al enviar push individual', { error: error.message, userId });
            await notificationRepo.recordPushError(notificationId, error.message);
        }
    }

    /**
     * MÉTODO PRIVADO: Envía push global por lotes con rate limiting
     */
    static async _enviarPushGlobalPorLotes(globalNotificationId, users, title, body, metadata, notificationTypeCode, cache) {
        try {
            // Filtrar usuarios que permiten push
            const usersAllowingPush = [];

            for (const user of users) {
                const allowsPush = await userNotificationPreferenceRepo.userAllowsPush(
                    user.user_id,
                    notificationTypeCode
                );
                if (allowsPush) {
                    usersAllowingPush.push(user);
                }
            }

            logger.info('Usuarios que permiten push', {
                total: users.length,
                allowing: usersAllowingPush.length
            });

            // Obtener todos los tokens activos de usuarios elegibles
            const userIds = usersAllowingPush.map(u => u.user_id);
            const allTokens = await userPushTokenRepo.findActiveByUsers(userIds);

            if (allTokens.length === 0) {
                logger.warn('No hay tokens activos para push global');
                return;
            }

            const batchSize = 100;
            const totalBatches = Math.ceil(allTokens.length / batchSize);

            logger.info('Iniciando envío push global por lotes', {
                globalNotificationId,
                totalTokens: allTokens.length,
                batchSize,
                totalBatches
            });

            let totalSuccess = 0;
            let totalFailed = 0;

            for (let i = 0; i < totalBatches; i++) {
                const start = i * batchSize;
                const end = start + batchSize;
                const batch = allTokens.slice(start, end);
                const endpointArns = batch.map(t => t.token);

                // Rate limiting: verificar límite de SNS
                await this._checkSNSRateLimit(cache);

                logger.info(`Procesando lote push ${i + 1}/${totalBatches}`, {
                    globalNotificationId,
                    tokensEnLote: endpointArns.length
                });

                // Enviar lote
                const stats = await SNSUtil.enviarPushMasivo(endpointArns, title, body, metadata);

                totalSuccess += stats.success;
                totalFailed += stats.failed;

                // Actualizar contador en DB
                await globalNotificationRepo.incrementPushSentCount(globalNotificationId, stats.success);

                // Actualizar estado en Redis
                await this._actualizarEstadoLote(cache, globalNotificationId, i + 1, batch.length);

                // Pausa entre lotes
                if (i < totalBatches - 1) {
                    await this._sleep(1000); // 1 segundo
                }
            }

            logger.info('Push global completado', {
                globalNotificationId,
                totalTokens: allTokens.length,
                success: totalSuccess,
                failed: totalFailed
            });

        } catch (error) {
            logger.error('Error al enviar push global', {
                error: error.message,
                globalNotificationId
            });
            throw error;
        }
    }

    /**
     * MÉTODO PRIVADO: Envía email individual con manejo de errores
     */
    static async _enviarEmailIndividual(userId, notificationType, metadata, notificationId) {
        try {
            const userRepo = require('../repositories/user.repository');
            
            const user = await userRepo.findById(userId, {
                include: [
                    {
                        association: 'person',
                        include: [{ association: 'contact' }]
                    }
                ]
            });

            if (!user || !user.person?.contact?.email) {
                logger.warn('Usuario sin email', { userId });
                return;
            }

            const email = user.person.contact.email;

            // Usar el nuevo método que aplica templates
            await SESUtil.enviarNotificacion(email, notificationType, metadata);
            await notificationRepo.markEmailSent(notificationId);

            logger.info('Email individual enviado', { userId, email });

        } catch (error) {
            logger.error('Error al enviar email individual', { error: error.message, userId });
            await notificationRepo.recordEmailError(notificationId, error.message);
        }
    }

    /**
     * MÉTODO PRIVADO: Envía email global por lotes con rate limiting
     */
    static async _enviarEmailGlobalPorLotes(globalNotificationId, users, notificationType, metadata, notificationTypeCode, cache) {
        try {
            // Filtrar usuarios que permiten email
            const usersAllowingEmail = [];

            for (const user of users) {
                const allowsEmail = await userNotificationPreferenceRepo.userAllowsEmail(
                    user.user_id,
                    notificationTypeCode
                );
                if (allowsEmail && user.person.contact.email) {
                    usersAllowingEmail.push(user);
                }
            }

            logger.info('Usuarios que permiten email', {
                total: users.length,
                allowing: usersAllowingEmail.length
            });

            if (usersAllowingEmail.length === 0) {
                logger.warn('No hay usuarios con email habilitado');
                return;
            }

            const batchSize = 50;
            const totalBatches = Math.ceil(usersAllowingEmail.length / batchSize);

            logger.info('Iniciando envío email global por lotes', {
                globalNotificationId,
                totalEmails: usersAllowingEmail.length,
                batchSize,
                totalBatches
            });

            let totalSuccess = 0;
            let totalFailed = 0;

            for (let i = 0; i < totalBatches; i++) {
                const start = i * batchSize;
                const end = start + batchSize;
                const batch = usersAllowingEmail.slice(start, end);

                // Rate limiting
                await this._checkSESRateLimit(cache);

                logger.info(`Procesando lote email ${i + 1}/${totalBatches}`, {
                    globalNotificationId,
                    emailsEnLote: batch.length
                });

                // Enviar emails del lote usando templates
                const promises = batch.map(user =>
                    SESUtil.enviarNotificacion(user.person.contact.email, notificationType, metadata)
                        .then(() => ({ success: true }))
                        .catch(err => {
                            logger.error('Error enviando email', {
                                error: err.message,
                                email: user.person.contact.email
                            });
                            return { success: false };
                        })
                );

                const results = await Promise.allSettled(promises);
                const successCount = results.filter(r => r.status === 'fulfilled' && r.value.success).length;
                const failedCount = batch.length - successCount;

                totalSuccess += successCount;
                totalFailed += failedCount;

                // Actualizar contador en DB
                await globalNotificationRepo.incrementEmailSentCount(globalNotificationId, successCount);

                // Pausa entre lotes
                if (i < totalBatches - 1) {
                    await this._sleep(1000);
                }
            }

            logger.info('Email global completado', {
                globalNotificationId,
                totalEmails: usersAllowingEmail.length,
                success: totalSuccess,
                failed: totalFailed
            });

        } catch (error) {
            logger.error('Error al enviar email global', {
                error: error.message,
                globalNotificationId
            });
            throw error;
        }
    }

    /**
     * MÉTODO PRIVADO: Genera título y cuerpo usando templates
     */
    static _generarContenido(notificationType, metadata) {
        let title = notificationType.title_template;
        let body = notificationType.body_template;

        // Reemplazar variables {{variable}} con valores de metadata
        Object.keys(metadata).forEach(key => {
            const regex = new RegExp(`{{${key}}}`, 'g');
            title = title.replace(regex, metadata[key]);
            body = body.replace(regex, metadata[key]);
        });

        return { title, body };
    }

    /**
     * MÉTODO PRIVADO: Verifica si estamos en quiet hours
     */
    static _isInQuietHours(userPreference) {
        if (!userPreference?.quiet_hours_start || !userPreference?.quiet_hours_end) {
            return false;
        }

        const now = new Date();
        const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:00`;

        const start = userPreference.quiet_hours_start;
        const end = userPreference.quiet_hours_end;

        // Quiet hours dentro del mismo día (ej: 22:00 - 23:59)
        if (start < end) {
            return currentTime >= start && currentTime < end;
        }

        // Quiet hours cruzan medianoche (ej: 22:00 - 08:00)
        return currentTime >= start || currentTime < end;
    }

    /**
     * MÉTODO PRIVADO: Calcula cuándo termina el quiet hours
     */
    static _calcularFinQuietHours(userPreference) {
        if (!userPreference?.quiet_hours_end) {
            return new Date(Date.now() + 15 * 60 * 1000); // +15 min por defecto
        }

        const now = new Date();
        const [hours, minutes] = userPreference.quiet_hours_end.split(':');

        const endTime = new Date(now);
        endTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);

        // Si la hora ya pasó hoy, programar para mañana
        if (endTime <= now) {
            endTime.setDate(endTime.getDate() + 1);
        }

        return endTime;
    }

    /**
     * MÉTODO PRIVADO: Mapea prioridad de string a número
     */
    static _mapPriority(priority) {
        const priorityMap = {
            low: 3,
            normal: 5,
            high: 8,
            urgent: 10
        };
        return priorityMap[priority] || 5;
    }

    /**
     * MÉTODO PRIVADO: Programa envío de push
     */
    static async _programarEnvioPush(notificationId, userPreference) {
        const nextRetryAt = this._calcularFinQuietHours(userPreference);

        await notificationRepo.update(notificationId, {
            scheduled_for: nextRetryAt,
            push_next_retry_at: nextRetryAt
        });

        logger.info('Push programado para después de quiet hours', {
            notificationId,
            nextRetryAt
        });
    }

    /**
     * MÉTODO PRIVADO: Programa envío de email
     */
    static async _programarEnvioEmail(notificationId, userPreference) {
        const nextRetryAt = this._calcularFinQuietHours(userPreference);

        await notificationRepo.update(notificationId, {
            scheduled_for: nextRetryAt,
            email_next_retry_at: nextRetryAt
        });

        logger.info('Email programado para después de quiet hours', {
            notificationId,
            nextRetryAt
        });
    }

    /**
     * MÉTODO PRIVADO: Actualiza estado de lote en Redis
     */
    static async _actualizarEstadoLote(cache, globalNotificationId, batchNumber, batchSize) {
        try {
            const stateKey = `global_notif:${globalNotificationId}:batch_state`;
            const stateStr = await cache.get(stateKey);

            if (stateStr) {
                const state = JSON.parse(stateStr);
                state.processed_users += batchSize;
                state.current_batch = batchNumber;
                state.last_batch_at = new Date().toISOString();

                await cache.set(stateKey, JSON.stringify(state), 24 * 60 * 60);
            }
        } catch (error) {
            logger.error('Error actualizando estado de lote en Redis', { error: error.message });
        }
    }

    /**
     * MÉTODO PRIVADO: Rate limiting para SNS
     */
    static async _checkSNSRateLimit(cache) {
        const now = Date.now();
        const minute = Math.floor(now / 60000);
        const key = `aws_sns_rate:${minute}`;

        const current = await cache.get(key);
        const count = current ? parseInt(current) : 0;

        // Límite ejemplo: 300 mensajes por minuto
        if (count >= 300) {
            const waitTime = 60000 - (now % 60000);
            logger.warn(`Rate limit SNS alcanzado, esperando ${waitTime}ms`);
            await this._sleep(waitTime);
        }

        await cache.set(key, count + 100, 120); // TTL 2 minutos
    }

    /**
     * MÉTODO PRIVADO: Rate limiting para SES
     */
    static async _checkSESRateLimit(cache) {
        const now = Date.now();
        const minute = Math.floor(now / 60000);
        const key = `aws_ses_rate:${minute}`;

        const current = await cache.get(key);
        const count = current ? parseInt(current) : 0;

        // Límite ejemplo: 200 emails por minuto
        if (count >= 200) {
            const waitTime = 60000 - (now % 60000);
            logger.warn(`Rate limit SES alcanzado, esperando ${waitTime}ms`);
            await this._sleep(waitTime);
        }

        await cache.set(key, count + 50, 120); // TTL 2 minutos
    }

    /**
     * MÉTODO PRIVADO: Sleep helper
     */
    static _sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * UTILIDAD: Procesa notificaciones programadas (ejecutar en cron)
     */
    static async procesarNotificacionesProgramadas() {
        try {
            const scheduled = await notificationRepo.findScheduledReady();

            logger.info('Procesando notificaciones programadas', { count: scheduled.length });

            for (const notification of scheduled) {
                await notificationRepo.updateProcessingStatus(
                    notification.notification_id,
                    'processing'
                );

                // Obtener el notification_type completo
                const notificationType = await notificationTypeRepo.findById(
                    notification.notification_type_id
                );

                if (notificationType) {
                    const metadata = notification.metadata || {};

                    // Push
                    if (notificationType.supports_push && !notification.push_sent) {
                        await this._enviarPushIndividual(
                            notification.user_id,
                            notification.title,
                            notification.body,
                            metadata,
                            notification.notification_id
                        );
                    }

                    // Email - CORREGIDO: usar método con templates
                    if (notificationType.supports_email && !notification.email_sent) {
                        await this._enviarEmailIndividual(
                            notification.user_id,
                            notificationType,  // PASAR OBJETO COMPLETO
                            metadata,          // PASAR METADATA
                            notification.notification_id
                        );
                    }
                }

                await notificationRepo.updateProcessingStatus(
                    notification.notification_id,
                    'completed'
                );
            }

            logger.info('Notificaciones programadas procesadas', { count: scheduled.length });

        } catch (error) {
            logger.error('Error procesando notificaciones programadas', { error: error.message });
        }
    }

    /**
     * UTILIDAD: Reintentar envíos fallidos de push (ejecutar en cron)
     */
    static async reintentarEnviosPush() {
        try {
            const pending = await notificationRepo.findPendingPushRetries();

            logger.info('Reintentando envíos de push pendientes', { count: pending.length });

            for (const notification of pending) {
                await this._enviarPushIndividual(
                    notification.user_id,
                    notification.title,
                    notification.body,
                    notification.metadata || {},
                    notification.notification_id
                );
            }

            logger.info('Reintentos de push completados', { count: pending.length });

        } catch (error) {
            logger.error('Error al reintentar push', { error: error.message });
        }
    }

    /**
     * UTILIDAD: Reintentar envíos fallidos de email (ejecutar en cron)
     */
    static async reintentarEnviosEmail() {
        try {
            const pending = await notificationRepo.findPendingEmailRetries();

            logger.info('Reintentando envíos de email pendientes', { count: pending.length });

            for (const notification of pending) {
                await this._enviarEmailIndividual(
                    notification.user_id,
                    notification.title,
                    notification.body,
                    notification.notification_id
                );
            }

            logger.info('Reintentos de email completados', { count: pending.length });

        } catch (error) {
            logger.error('Error al reintentar email', { error: error.message });
        }
    }

    /**
     * UTILIDAD: Limpieza de notificaciones antiguas (ejecutar en cron diario)
     */
    static async limpiarNotificacionesAntiguas() {
        try {
            const deletedNotifications = await notificationRepo.deleteOldRead(90);
            const deletedTokens = await userPushTokenRepo.deleteOldInactive(90);

            logger.info('Limpieza completada', {
                notificaciones_eliminadas: deletedNotifications,
                tokens_eliminados: deletedTokens
            });

        } catch (error) {
            logger.error('Error en limpieza', { error: error.message });
        }
    }
}

module.exports = NotificationUtil;