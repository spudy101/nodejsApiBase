'use strict';

const cron = require('node-cron');
const { sequelize } = require('../shared/models');
const identityValidationRepository = require('../modules/client/repositories/identityValidation.repository');
const userRepository = require('../shared/repositories/user.repository');
const NotificationUtil = require('../shared/utils/notification.util');
const ZapSignUtil = require('../modules/client/utils/kycZapSign.util');
const { logger } = require('../shared/utils/logger.util');

class KycValidationWorker {
  
  /**
   * Inicia todos los workers de validación KYC
   */
  static iniciar() {
    // Expirar validaciones pendientes cada 15 minutos
    cron.schedule('*/15 * * * *', async () => {
      try {
        logger.info('Ejecutando worker: expirar validaciones ZapSign pendientes');
        await this.expirarValidacionesPendientes();
      } catch (error) {
        logger.error('Error en worker de expiración de validaciones', { 
          error: error.message,
          stack: error.stack
        });
      }
    });

    logger.info('Workers de validación KYC iniciados exitosamente');
  }

  /**
   * Expira validaciones que llevan más de 1 hora en estado pendiente
   */
  static async expirarValidacionesPendientes() {
    const transaction = await sequelize.transaction();
    
    try {
      // Tiempo límite: 1 hora (configurable con variable de entorno)
      const timeoutMinutes = parseInt(process.env.ZAPSIGN_VALIDATION_TIMEOUT_MINUTES || '60', 10);
      const timeoutDate = new Date(Date.now() - timeoutMinutes * 60 * 1000);

      // ✅ Usar el método del repositorio que trae person y contact incluidos
      const expiredValidations = await identityValidationRepository.findPendingBeforeDate(timeoutDate);

      if (expiredValidations.length === 0) {
        logger.info('No hay validaciones pendientes para expirar');
        await transaction.commit();
        return { expired: 0 };
      }

      logger.info(`Se encontraron ${expiredValidations.length} validaciones para expirar`);

      let successCount = 0;
      let errorCount = 0;

      // Procesar cada validación expirada
      for (const validation of expiredValidations) {
        try {
          // 1. Cancelar documento en ZapSign
          try {
            await ZapSignUtil.refuseDocument(
              validation.zapsign_document_id,
              `Validación expirada por inactividad (timeout: ${timeoutMinutes} minutos)`,
              false
            );
            logger.info('Documento cancelado en ZapSign por timeout', {
              validationId: validation.validation_id,
              zapSignDocId: validation.zapsign_document_id
            });
          } catch (zapSignError) {
            logger.warn('No se pudo cancelar en ZapSign (puede estar ya procesado)', {
              validationId: validation.validation_id,
              error: zapSignError.message
            });
          }

          // 2. Actualizar estado a expirado
          await identityValidationRepository.update(
            validation.validation_id,
            {
              status: 'expired',
              completed_at: new Date(),
              webhook_data: {
                expired_by: 'system_worker',
                expired_at: new Date().toISOString(),
                reason: `Validación expirada por inactividad (timeout: ${timeoutMinutes} minutos)`,
              }
            },
            { transaction }
          );

          // 3. ✅ Enviar notificación usando los datos ya incluidos (person y contact)
          if (validation.person?.contact?.email) {
            const user = await userRepository.findByUsernameAndNationalId(validation.person.national_id);

            if (user) {
              // Enviar notificación de forma asíncrona
              setImmediate(() => {
                NotificationUtil.crearNotificacion({
                  tipo_notificacion: 'ZAPSIGN_LINK_EXPIRED',
                  user_id: user.user_id,
                  email: validation.person.contact.email,
                  metadata: {
                    nombre: validation.person?.first_name || 'Usuario',
                    tiempoLimite: timeoutMinutes,
                  }
                }).catch(err => 
                  logger.error('Error enviando notificación de expiración', {
                    validationId: validation.validation_id,
                    personId: validation.person_id,
                    error: err.message
                  })
                );
              });
            }
          }

          successCount++;

          logger.info('Validación expirada exitosamente', {
            validationId: validation.validation_id,
            personId: validation.person_id,
            initiatedAt: validation.initiated_at,
            minutesPending: Math.floor((Date.now() - new Date(validation.initiated_at).getTime()) / 60000)
          });

        } catch (error) {
          errorCount++;
          logger.error('Error expirando validación individual', {
            validationId: validation.validation_id,
            personId: validation.person_id,
            error: error.message
          });
        }
      }

      await transaction.commit();

      logger.info('Worker de expiración completado', {
        total: expiredValidations.length,
        success: successCount,
        errors: errorCount
      });

      return {
        expired: successCount,
        errors: errorCount,
        total: expiredValidations.length
      };

    } catch (error) {
      await transaction.rollback();
      logger.error('Error en worker de expiración de validaciones', {
        error: error.message,
        stack: error.stack
      });
      throw error;
    }
  }

  /**
   * Método manual para expirar una validación específica (útil para testing)
   */
  static async expirarValidacionManual(validationId) {
    const transaction = await sequelize.transaction();
    
    try {
      const validation = await identityValidationRepository.findById(validationId);

      if (!validation) {
        throw new Error('Validación no encontrada');
      }

      if (validation.status !== 'pending') {
        throw new Error(`La validación no está en estado pendiente (estado actual: ${validation.status})`);
      }

      // 1. Cancelar en ZapSign
      try {
        await ZapSignUtil.refuseDocument(
          validation.zapsign_document_id,
          'Expiración manual',
          false
        );
      } catch (zapSignError) {
        logger.warn('No se pudo cancelar en ZapSign', {
          validationId,
          error: zapSignError.message
        });
      }

      // 2. Actualizar estado local
      await identityValidationRepository.update(
        validationId,
        {
          status: 'expired',
          completed_at: new Date(),
          webhook_data: {
            expired_by: 'manual_trigger',
            expired_at: new Date().toISOString(),
            reason: 'Expiración manual',
          }
        },
        { transaction }
      );

      // 3. Obtener datos de la persona para enviar notificación
      const person = await personRepository.findById(validation.person_id);
      const user = await userRepository.findByUsernameAndNationalId(person.national_id);

      if (user?.person?.contact?.email) {
        await NotificationUtil.crearNotificacion({
          tipo_notificacion: 'ZAPSIGN_LINK_EXPIRED',
          user_id: user.user_id,
          email: user.person.contact.email,
          metadata: {
            nombre: person?.first_name || 'Usuario',
            tiempoLimite: parseInt(process.env.ZAPSIGN_VALIDATION_TIMEOUT_MINUTES || '60', 10),
          }
        });
      }

      await transaction.commit();

      logger.info('Validación expirada manualmente', {
        validationId,
        personId: validation.person_id
      });

      return { success: true, validationId };

    } catch (error) {
      await transaction.rollback();
      logger.error('Error en expiración manual de validación', {
        validationId,
        error: error.message
      });
      throw error;
    }
  }
}

module.exports = KycValidationWorker;