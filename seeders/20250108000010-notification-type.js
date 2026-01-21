'use strict';
const { database, notifications } = require('../shared/constants');

const SCHEMA = database.schema;
const { v4: uuidv4 } = require('uuid');

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Verificar si ya existen notification_types
    const existingTypes = await queryInterface.sequelize.query(
      `SELECT COUNT(*) as count FROM "${SCHEMA}"."notification_types"`,
      { type: Sequelize.QueryTypes.SELECT }
    );

    if (existingTypes[0].count > 0) {
      console.log('⚠️  Los tipos de notificación ya existen, saltando seed...');
      return;
    }

    const notificationTypes = [
      {
        notification_type_id: uuidv4(),
        code: 'BIENVENIDA',
        name: 'Email de Bienvenida',
        description: 'Email enviado cuando un usuario se registra exitosamente en la plataforma',
        supports_push: false,
        supports_email: true,
        priority: 'high',
        // Templates para notificación push/in-app
        title_template: 'Bienvenido a Democracia Líquida',
        body_template: 'Hola {{nombre}}, te has registrado exitosamente. Ahora puedes participar en votaciones y publicaciones.',
        // Templates para email
        email_subject_template: 'Bienvenido a Democracia Líquida',
        email_body_template: `
          <html>
            <body style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px;">
              <div style="text-align: center;">
                <img src="${notifications.logoUrl || 'https://via.placeholder.com/150'}" alt="Logo" style="width: 150px; margin-bottom: 20px;">
                <h2 style="color: #007bff;">¡Bienvenido a Democracia Líquida!</h2>
              </div>
              <div style="font-size: 16px; color: #333; line-height: 1.6; margin: 20px 0;">
                <p>Hola <strong>{{nombre}}</strong>,</p>
                <p>Te has registrado exitosamente en <strong>Democracia Líquida</strong>.</p>
                <p>Ahora puedes acceder a la plataforma y comenzar a participar en las votaciones y publicaciones.</p>
                <p>Gracias por ser parte de nuestra comunidad.</p>
                <p>Saludos,<br><strong>El equipo de Democracia Líquida</strong></p>
              </div>
              <div style="font-size: 12px; color: #555; margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; text-align: center;">
                <p>Este es un correo automático, por favor no respondas a este mensaje.</p>
              </div>
            </body>
          </html>
        `,
        is_active: true,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        notification_type_id: uuidv4(),
        code: 'NOTIFICACION_GENERAL',
        name: 'Notificación General',
        description: 'Notificación genérica para diferentes eventos del sistema',
        supports_push: true,
        supports_email: true,
        priority: 'normal',
        // Templates para notificación push/in-app
        title_template: '{{titulo}}',
        body_template: '{{contenido}}',
        // Templates para email
        email_subject_template: '{{asunto}}',
        email_body_template: `
          <html>
            <body style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px;">
              <div style="text-align: center;">
                <img src="${notifications.logoUrl || 'https://via.placeholder.com/150'}" alt="Logo" style="width: 150px; margin-bottom: 20px;">
                <h2 style="color: #007bff;">{{titulo}}</h2>
              </div>
              <div style="font-size: 16px; color: #333; line-height: 1.6; margin: 20px 0;">
                <p>{{contenido}}</p>
              </div>
              <div style="font-size: 12px; color: #555; margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; text-align: center;">
                <p>Este es un correo automático, por favor no respondas a este mensaje.</p>
              </div>
            </body>
          </html>
        `,
        is_active: true,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        notification_type_id: uuidv4(),
        code: 'TOTP_ACTIVADO',
        name: 'TOTP Activado',
        description: 'Notifica que el usuario activó correctamente el TOTP (MFA)',
        supports_push: false,
        supports_email: true,
        priority: 'normal',
        title_template: '¡Felicidades! Activaste tu seguridad',
        body_template: 'Tu autenticación de dos factores (TOTP) fue creada y activada correctamente.',
        email_subject_template: 'TOTP activado correctamente',
        email_body_template: `
          <html>
            <body style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px;">
              <div style="text-align: center;">
                <img src="${notifications.logoUrl || 'https://via.placeholder.com/150'}" alt="Logo" style="width: 150px; margin-bottom: 20px;">
                <h2 style="color: #28a745;">🔐 ¡Seguridad activada!</h2>
              </div>
              <div style="font-size: 16px; color: #333; line-height: 1.6; margin: 20px 0;">
                <p>Hola,</p>
                <p>
                  ¡Felicitaciones! Has creado y activado correctamente la
                  <strong>autenticación de dos factores (TOTP)</strong> en tu cuenta.
                </p>
                <p>
                  A partir de ahora, tu cuenta cuenta con una capa adicional de seguridad.
                </p>
              </div>
              <div style="font-size: 12px; color: #555; margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; text-align: center;">
                <p>Si no realizaste esta acción, te recomendamos contactar soporte de inmediato.</p>
                <p>Este es un correo automático, por favor no respondas a este mensaje.</p>
              </div>
            </body>
          </html>
        `,
        is_active: true,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        notification_type_id: uuidv4(),
        code: 'TOTP_ELIMINADO',
        name: 'TOTP Eliminado',
        description: 'Advierte al usuario que su autenticación TOTP (MFA) fue eliminada',
        supports_push: false,
        supports_email: true,
        priority: 'high',
        title_template: 'Advertencia de seguridad',
        body_template: 'La autenticación de dos factores (TOTP) fue eliminada de tu cuenta.',
        email_subject_template: 'Advertencia: TOTP eliminado de tu cuenta',
        email_body_template: `
          <html>
            <body style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px;">
              <div style="text-align: center;">
                <img src="${notifications.logoUrl || 'https://via.placeholder.com/150'}" alt="Logo" style="width: 150px; margin-bottom: 20px;">
                <h2 style="color: #dc3545;">⚠️ Advertencia de seguridad</h2>
              </div>
              <div style="font-size: 16px; color: #333; line-height: 1.6; margin: 20px 0;">
                <p>Hola,</p>
                <p>
                  Te informamos que la <strong>autenticación de dos factores (TOTP)</strong>
                  fue eliminada de tu cuenta.
                </p>
                <p>
                  Esto reduce el nivel de seguridad de tu acceso. Te recomendamos
                  volver a activarla lo antes posible.
                </p>
                <p>
                  Si <strong>no realizaste esta acción</strong>, contacta a soporte inmediatamente.
                </p>
              </div>
              <div style="font-size: 12px; color: #555; margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; text-align: center;">
                <p>Este es un correo automático, por favor no respondas a este mensaje.</p>
              </div>
            </body>
          </html>
        `,
        is_active: true,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        notification_type_id: uuidv4(),
        code: 'RESET_MFA',
        name: 'MFA Reiniciado',
        description: 'Notifica al usuario que todos sus métodos de autenticación multifactor fueron reiniciados',
        supports_push: false,
        supports_email: true,
        priority: 'high',
        title_template: 'Aviso de seguridad',
        body_template: 'Los métodos de autenticación multifactor (MFA) de tu cuenta fueron reiniciados.',
        email_subject_template: 'Aviso de seguridad: MFA reiniciado',
        email_body_template: `
          <html>
            <body style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px;">
              <div style="text-align: center;">
                <img src="${notifications.logoUrl || 'https://via.placeholder.com/150'}" alt="Logo" style="width: 150px; margin-bottom: 20px;">
                <h2 style="color: #dc3545;">🔐 Aviso de seguridad</h2>
              </div>
              <div style="font-size: 16px; color: #333; line-height: 1.6; margin: 20px 0;">
                <p>Hola,</p>
                <p>
                  Te informamos que <strong>todos los métodos de autenticación multifactor (MFA)</strong>
                  asociados a tu cuenta fueron reiniciados.
                </p>
                <p>
                  Será necesario que vuelvas a configurar tus métodos de seguridad
                  para proteger tu acceso.
                </p>
                <p>
                  Si <strong>no realizaste esta acción</strong>, por favor contacta a soporte de inmediato.
                </p>
              </div>
              <div style="font-size: 12px; color: #555; margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; text-align: center;">
                <p>Este es un correo automático, por favor no respondas a este mensaje.</p>
              </div>
            </body>
          </html>
        `,
        is_active: true,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        notification_type_id: uuidv4(),
        code: 'RESET_PASSWORD',
        name: 'Contraseña Reiniciada',
        description: 'Notifica al usuario que su contraseña fue restablecida',
        supports_push: false,
        supports_email: true,
        priority: 'high',
        title_template: 'Cambio de contraseña',
        body_template: 'Tu contraseña fue restablecida correctamente.',
        email_subject_template: 'Aviso de seguridad: contraseña restablecida',
        email_body_template: `
          <html>
            <body style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px;">
              <div style="text-align: center;">
                <img src="${notifications.logoUrl || 'https://via.placeholder.com/150'}" alt="Logo" style="width: 150px; margin-bottom: 20px;">
                <h2 style="color: #198754;">🔑 Cambio de contraseña</h2>
              </div>
              <div style="font-size: 16px; color: #333; line-height: 1.6; margin: 20px 0;">
                <p>Hola,</p>
                <p>
                  Te confirmamos que tu <strong>contraseña fue restablecida correctamente</strong>.
                </p>
                <p>
                  Si realizaste este cambio, no es necesario realizar ninguna acción adicional.
                </p>
                <p>
                  Si <strong>no reconoces esta acción</strong>, te recomendamos cambiar tu contraseña
                  inmediatamente y contactar a soporte.
                </p>
              </div>
              <div style="font-size: 12px; color: #555; margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; text-align: center;">
                <p>Este es un correo automático, por favor no respondas a este mensaje.</p>
              </div>
            </body>
          </html>
        `,
        is_active: true,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        notification_type_id: uuidv4(),
        code: 'ZAPSIGN_LINK_GENERATED',
        name: 'Link ZapSign Generado',
        description: 'Notifica al usuario que su link de ZapSign para validación de identidad fue generado',
        supports_push: false,
        supports_email: true,
        priority: 'high',
        title_template: 'Link de validación generado',
        body_template: 'Tu link de ZapSign para validación de identidad ha sido generado correctamente.',
        email_subject_template: 'Valida tu identidad - Link ZapSign',
        email_body_template: `
          <html>
            <body style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px;">
              <div style="text-align: center;">
                <img src="${notifications.logoUrl || 'https://via.placeholder.com/150'}" alt="Logo" style="width: 150px; margin-bottom: 20px;">
                <h2 style="color: #0d6efd;">🔗 Link de validación generado</h2>
              </div>
              <div style="font-size: 16px; color: #333; line-height: 1.6; margin: 20px 0;">
                <p>Hola <strong>{{nombre}}</strong>,</p>
                <p>
                  Tu link de <strong>ZapSign</strong> para la validación de identidad ha sido generado correctamente.
                </p>
                <p>
                  Para continuar con el proceso, por favor accede al siguiente enlace:
                </p>
                <div style="text-align: center; margin: 30px 0;">
                  <a href="{{linkZapSign}}" 
                    style="display: inline-block; background-color: #0d6efd; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-weight: bold;">
                    Validar mi identidad
                  </a>
                </div>
                <p style="font-size: 14px; color: #666;">
                  O copia y pega el siguiente enlace en tu navegador:<br>
                  <a href="{{linkZapSign}}" style="color: #0d6efd; word-break: break-all;">{{linkZapSign}}</a>
                </p>
                <div style="background-color: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0;">
                  <p style="margin: 0; color: #856404;">
                    <strong>⏱️ Importante:</strong> Este enlace expirará en <strong>{{tiempoLimite}} minutos</strong> por seguridad. Completa tu validación lo antes posible.
                  </p>
                </div>
                <p>
                  <strong>Recuerda:</strong> Este enlace es personal e intransferible. Por tu seguridad, no lo compartas con nadie.
                </p>
              </div>
              <div style="font-size: 12px; color: #555; margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; text-align: center;">
                <p>Este es un correo automático, por favor no respondas a este mensaje.</p>
              </div>
            </body>
          </html>
        `,
        is_active: true,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        notification_type_id: uuidv4(),
        code: 'IDENTITY_VERIFIED',
        name: 'Identidad Verificada',
        description: 'Notifica al usuario que su identidad fue verificada exitosamente',
        supports_push: true,
        supports_email: true,
        priority: 'high',
        title_template: 'Identidad verificada',
        body_template: '¡Tu identidad ha sido verificada correctamente! Ya puedes continuar con el proceso.',
        email_subject_template: 'Verificación de identidad exitosa',
        email_body_template: `
          <html>
            <body style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px;">
              <div style="text-align: center;">
                <img src="${notifications.logoUrl || 'https://via.placeholder.com/150'}" alt="Logo" style="width: 150px; margin-bottom: 20px;">
                <h2 style="color: #198754;">✅ Identidad verificada</h2>
              </div>
              <div style="font-size: 16px; color: #333; line-height: 1.6; margin: 20px 0;">
                <p>Hola <strong>{{nombre}}</strong>,</p>
                <p>
                  ¡Excelentes noticias! Tu <strong>identidad ha sido verificada correctamente</strong>.
                </p>
                <p>
                  Ya puedes continuar con el proceso de solicitud sin problemas.
                </p>
                <p>
                  Si tienes alguna duda o necesitas asistencia, no dudes en contactar a nuestro equipo de soporte.
                </p>
              </div>
              <div style="font-size: 12px; color: #555; margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; text-align: center;">
                <p>Este es un correo automático, por favor no respondas a este mensaje.</p>
              </div>
            </body>
          </html>
        `,
        is_active: true,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        notification_type_id: uuidv4(),
        code: 'ZAPSIGN_LINK_EXPIRED',
        name: 'Link ZapSign Expirado',
        description: 'Notifica al usuario que su link de ZapSign expiró por inactividad',
        supports_push: false,
        supports_email: true,
        priority: 'medium',
        title_template: 'Link de validación expirado',
        body_template: 'Tu link de ZapSign para validación de identidad ha expirado. Solicita uno nuevo.',
        email_subject_template: 'Link de validación expirado - Solicita uno nuevo',
        email_body_template: `
          <html>
            <body style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px;">
              <div style="text-align: center;">
                <img src="${notifications.logoUrl || 'https://via.placeholder.com/150'}" alt="Logo" style="width: 150px; margin-bottom: 20px;">
                <h2 style="color: #dc3545;">⏱️ Link de validación expirado</h2>
              </div>
              <div style="font-size: 16px; color: #333; line-height: 1.6; margin: 20px 0;">
                <p>Hola <strong>{{nombre}}</strong>,</p>
                <p>
                  Te informamos que tu <strong>link de validación de identidad</strong> ha expirado por inactividad.
                </p>
                <p>
                  Los links de validación tienen una vigencia de <strong>{{tiempoLimite}} minutos</strong> para garantizar tu seguridad.
                </p>
                <div style="background-color: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0;">
                  <p style="margin: 0; color: #856404;">
                    <strong>¿Qué hacer ahora?</strong><br>
                    Para continuar con el proceso de validación, deberás solicitar un nuevo link desde tu cuenta.
                  </p>
                </div>
                <p>
                  Si tienes alguna duda o necesitas ayuda, no dudes en contactar a nuestro equipo de soporte.
                </p>
              </div>
              <div style="font-size: 12px; color: #555; margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; text-align: center;">
                <p>Este es un correo automático, por favor no respondas a este mensaje.</p>
              </div>
            </body>
          </html>
        `,
        is_active: true,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        notification_type_id: uuidv4(),
        code: 'ZAPSIGN_CONTRACT_DELETED',
        name: 'Contrato ZapSign Eliminado',
        description: 'Notifica al usuario que su contrato de ZapSign fue eliminado o cancelado',
        supports_push: false,
        supports_email: true,
        priority: 'medium',
        title_template: 'Proceso de validación cancelado',
        body_template: 'Tu proceso de validación de identidad ha sido cancelado.',
        email_subject_template: 'Proceso de validación cancelado',
        email_body_template: `
          <html>
            <body style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px;">
              <div style="text-align: center;">
                <img src="${notifications.logoUrl || 'https://via.placeholder.com/150'}" alt="Logo" style="width: 150px; margin-bottom: 20px;">
                <h2 style="color: #dc3545;">❌ Proceso de validación cancelado</h2>
              </div>
              <div style="font-size: 16px; color: #333; line-height: 1.6; margin: 20px 0;">
                <p>Hola <strong>{{nombre}}</strong>,</p>
                <p>
                  Te informamos que tu <strong>proceso de validación de identidad</strong> ha sido cancelado.
                </p>
                <div style="background-color: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0;">
                  <p style="margin: 0; color: #856404;">
                    <strong>¿Qué hacer ahora?</strong><br>
                    Si deseas continuar con el proceso de validación, deberás solicitar un nuevo link desde tu cuenta.
                  </p>
                </div>
                <p>
                  Si tienes alguna duda o necesitas ayuda, no dudes en contactar a nuestro equipo de soporte.
                </p>
              </div>
              <div style="font-size: 12px; color: #555; margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; text-align: center;">
                <p>Este es un correo automático, por favor no respondas a este mensaje.</p>
              </div>
            </body>
          </html>
        `,
        is_active: true,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        notification_type_id: uuidv4(),
        code: 'IDENTITY_VALIDATION_FAILED',
        name: 'Validación de Identidad Fallida',
        description: 'Notifica al usuario que su validación biométrica de identidad falló',
        supports_push: false,
        supports_email: true,
        priority: 'high',
        title_template: 'Validación de identidad fallida',
        body_template: 'Tu validación de identidad no pudo ser completada. Intenta nuevamente.',
        email_subject_template: 'Validación de identidad fallida - Intenta nuevamente',
        email_body_template: `
          <html>
            <body style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px;">
              <div style="text-align: center;">
                <img src="${notifications.logoUrl || 'https://via.placeholder.com/150'}" alt="Logo" style="width: 150px; margin-bottom: 20px;">
                <h2 style="color: #dc3545;">⚠️ Validación de identidad fallida</h2>
              </div>
              <div style="font-size: 16px; color: #333; line-height: 1.6; margin: 20px 0;">
                <p>Hola <strong>{{nombre}}</strong>,</p>
                <p>
                  Lamentamos informarte que tu <strong>validación de identidad</strong> no pudo ser completada exitosamente.
                </p>
                <div style="background-color: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0;">
                  <p style="margin: 0; color: #856404;">
                    <strong>Posibles causas:</strong><br>
                    • La imagen del documento no es clara o está borrosa<br>
                    • El reconocimiento facial no coincide con el documento<br>
                    • Los datos del documento no son legibles<br>
                    • Problemas técnicos durante el proceso
                  </p>
                </div>
                <div style="background-color: #d1ecf1; border-left: 4px solid #0dcaf0; padding: 15px; margin: 20px 0;">
                  <p style="margin: 0; color: #055160;">
                    <strong>¿Qué hacer ahora?</strong><br>
                    Te recomendamos intentar nuevamente el proceso de validación. Asegúrate de:<br>
                    • Tener buena iluminación<br>
                    • Usar una imagen clara de tu documento<br>
                    • Seguir las instrucciones cuidadosamente
                  </p>
                </div>
                <p>
                  Si continúas teniendo problemas, no dudes en contactar a nuestro equipo de soporte.
                </p>
              </div>
              <div style="font-size: 12px; color: #555; margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; text-align: center;">
                <p>Este es un correo automático, por favor no respondas a este mensaje.</p>
              </div>
            </body>
          </html>
        `,
        is_active: true,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        notification_type_id: uuidv4(),
        code: 'SOLICITUD_RESET_PASSWORD',
        name: 'Solicitud de Reset de Contraseña',
        description: 'Email enviado cuando un usuario solicita restablecer su contraseña',
        supports_push: false,
        supports_email: true,
        priority: 'high',
        title_template: 'Recuperación de Contraseña',
        body_template: 'Haz clic en el enlace para restablecer tu contraseña. Este enlace expirará en {{minutosExpiracion}} minutos.',
        email_subject_template: 'Recuperación de Contraseña',
        email_body_template: `
          <html>
            <body style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px;">
              <div style="text-align: center;">
                <img src="${notifications.logoUrl || 'https://via.placeholder.com/150'}" alt="Logo" style="width: 150px; margin-bottom: 20px;">
                <h2 style="color: #007bff;">🔑 Recuperación de Contraseña</h2>
              </div>
              <div style="font-size: 16px; color: #333; line-height: 1.6; margin: 20px 0;">
                <p>Hola <strong>{{nombre}}</strong>,</p>
                <p>
                  Has solicitado restablecer tu contraseña. Haz clic en el siguiente enlace para continuar:
                </p>
                <div style="text-align: center; margin: 30px 0;">
                  <a href="{{resetUrl}}" style="background-color: #007bff; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
                    Restablecer Contraseña
                  </a>
                </div>
                <p>
                  Este enlace expirará en <strong>{{minutosExpiracion}} minutos</strong>.
                </p>
                <p>
                  Si no solicitaste este cambio, puedes ignorar este correo de forma segura.
                </p>
              </div>
              <div style="font-size: 12px; color: #555; margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; text-align: center;">
                <p>Este es un correo automático, por favor no respondas a este mensaje.</p>
              </div>
            </body>
          </html>
        `,
        is_active: true,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        notification_type_id: uuidv4(),
        code: 'SOLICITUD_RESET_MFA',
        name: 'Solicitud de Reset de MFA',
        description: 'Email enviado cuando un usuario solicita desactivar su autenticación multifactor',
        supports_push: false,
        supports_email: true,
        priority: 'high',
        title_template: 'Desactivación de MFA',
        body_template: 'Haz clic en el enlace para desactivar tu autenticación de dos factores. Este enlace expirará en {{minutosExpiracion}} minutos.',
        email_subject_template: 'Desactivación de MFA',
        email_body_template: `
          <html>
            <body style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px;">
              <div style="text-align: center;">
                <img src="${notifications.logoUrl || 'https://via.placeholder.com/150'}" alt="Logo" style="width: 150px; margin-bottom: 20px;">
                <h2 style="color: #dc3545;">🔓 Desactivación de MFA</h2>
              </div>
              <div style="font-size: 16px; color: #333; line-height: 1.6; margin: 20px 0;">
                <p>Hola <strong>{{nombre}}</strong>,</p>
                <p>
                  Has solicitado desactivar tu autenticación de dos factores (MFA). Haz clic en el siguiente enlace para continuar:
                </p>
                <div style="text-align: center; margin: 30px 0;">
                  <a href="{{resetUrl}}" style="background-color: #dc3545; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
                    Desactivar MFA
                  </a>
                </div>
                <p>
                  Este enlace expirará en <strong>{{minutosExpiracion}} minutos</strong>.
                </p>
                <p>
                  <strong>⚠️ Advertencia:</strong> Desactivar el MFA reducirá la seguridad de tu cuenta.
                </p>
                <p>
                  Si no solicitaste este cambio, te recomendamos contactar a soporte inmediatamente.
                </p>
              </div>
              <div style="font-size: 12px; color: #555; margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; text-align: center;">
                <p>Este es un correo automático, por favor no respondas a este mensaje.</p>
              </div>
            </body>
          </html>
        `,
        is_active: true,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        notification_type_id: uuidv4(),
        code: 'USUARIO_CREADO_ADMIN',
        name: 'Usuario Creado por Admin',
        description: 'Email enviado cuando un administrador crea una cuenta de usuario',
        supports_push: false,
        supports_email: true,
        priority: 'high',
        title_template: 'Bienvenido a la plataforma',
        body_template: 'Tu cuenta ha sido creada por un administrador. Usa tu contraseña temporal para acceder.',
        email_subject_template: 'Bienvenido - Cuenta creada',
        email_body_template: `
          <html>
            <body style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px;">
              <div style="text-align: center;">
                <img src="${notifications.logoUrl || 'https://via.placeholder.com/150'}" alt="Logo" style="width: 150px; margin-bottom: 20px;">
                <h2 style="color: #007bff;">¡Bienvenido a la plataforma!</h2>
              </div>
              <div style="font-size: 16px; color: #333; line-height: 1.6; margin: 20px 0;">
                <p>Hola <strong>{{nombre}}</strong>,</p>
                <p>
                  Un administrador ha creado tu cuenta en la plataforma.
                </p>
                <p><strong>Email:</strong> {{email}}</p>
                <p><strong>Contraseña temporal:</strong> <code style="background-color: #f4f4f4; padding: 5px 10px; border-radius: 4px;">{{passwordTemporal}}</code></p>
                <p>
                  <strong>⚠️ Importante:</strong> Por favor, cambia tu contraseña la primera vez que inicies sesión.
                </p>
              </div>
              <div style="font-size: 12px; color: #555; margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; text-align: center;">
                <p>Este es un correo automático, por favor no respondas a este mensaje.</p>
              </div>
            </body>
          </html>
        `,
        is_active: true,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        notification_type_id: uuidv4(),
        code: 'PASSWORD_RESET_ADMIN',
        name: 'Contraseña Reseteada por Admin',
        description: 'Email enviado cuando un administrador resetea la contraseña de un usuario',
        supports_push: false,
        supports_email: true,
        priority: 'high',
        title_template: 'Contraseña reseteada',
        body_template: 'Un administrador ha reseteado tu contraseña.',
        email_subject_template: 'Contraseña reseteada por administrador',
        email_body_template: `
          <html>
            <body style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px;">
              <div style="text-align: center;">
                <img src="${notifications.logoUrl || 'https://via.placeholder.com/150'}" alt="Logo" style="width: 150px; margin-bottom: 20px;">
                <h2 style="color: #dc3545;">🔑 Contraseña reseteada</h2>
              </div>
              <div style="font-size: 16px; color: #333; line-height: 1.6; margin: 20px 0;">
                <p>Hola <strong>{{nombre}}</strong>,</p>
                <p>
                  Un administrador ha reseteado tu contraseña.
                </p>
                <p><strong>Nueva contraseña temporal:</strong> <code style="background-color: #f4f4f4; padding: 5px 10px; border-radius: 4px;">{{passwordTemporal}}</code></p>
                <p>
                  <strong>⚠️ Importante:</strong> Por favor, cambia esta contraseña temporal lo antes posible.
                </p>
                <p>
                  Si no solicitaste este cambio, contacta inmediatamente con soporte.
                </p>
              </div>
              <div style="font-size: 12px; color: #555; margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; text-align: center;">
                <p>Este es un correo automático, por favor no respondas a este mensaje.</p>
              </div>
            </body>
          </html>
        `,
        is_active: true,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        notification_type_id: uuidv4(),
        code: 'EMAIL_CAMBIADO_NOTIFICACION',
        name: 'Email Cambiado - Notificación',
        description: 'Email de notificación enviado al email antiguo cuando se cambia el email de un usuario',
        supports_push: false,
        supports_email: true,
        priority: 'high',
        title_template: 'Cambio de email detectado',
        body_template: 'Se ha cambiado el email asociado a tu cuenta.',
        email_subject_template: 'Notificación de cambio de email',
        email_body_template: `
          <html>
            <body style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px;">
              <div style="text-align: center;">
                <img src="${notifications.logoUrl || 'https://via.placeholder.com/150'}" alt="Logo" style="width: 150px; margin-bottom: 20px;">
                <h2 style="color: #ffc107;">⚠️ Cambio de email detectado</h2>
              </div>
              <div style="font-size: 16px; color: #333; line-height: 1.6; margin: 20px 0;">
                <p>Hola <strong>{{nombre}}</strong>,</p>
                <p>
                  Te informamos que el email asociado a tu cuenta ha sido cambiado.
                </p>
                <p><strong>Email anterior:</strong> {{emailAntiguo}}</p>
                <p><strong>Email nuevo:</strong> {{emailNuevo}}</p>
                <p>
                  A partir de ahora, todas las notificaciones se enviarán al nuevo email.
                </p>
                <p>
                  Si <strong>no realizaste este cambio</strong>, contacta inmediatamente con soporte.
                </p>
              </div>
              <div style="font-size: 12px; color: #555; margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; text-align: center;">
                <p>Este es un correo automático, por favor no respondas a este mensaje.</p>
              </div>
            </body>
          </html>
        `,
        is_active: true,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        notification_type_id: uuidv4(),
        code: 'EMAIL_CAMBIADO_CONFIRMACION',
        name: 'Email Cambiado - Confirmación',
        description: 'Email de confirmación enviado al nuevo email cuando se cambia el email de un usuario',
        supports_push: false,
        supports_email: true,
        priority: 'normal',
        title_template: 'Email actualizado correctamente',
        body_template: 'Tu email ha sido actualizado exitosamente.',
        email_subject_template: 'Confirmación de cambio de email',
        email_body_template: `
          <html>
            <body style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px;">
              <div style="text-align: center;">
                <img src="${notifications.logoUrl || 'https://via.placeholder.com/150'}" alt="Logo" style="width: 150px; margin-bottom: 20px;">
                <h2 style="color: #28a745;">✅ Email actualizado correctamente</h2>
              </div>
              <div style="font-size: 16px; color: #333; line-height: 1.6; margin: 20px 0;">
                <p>Hola <strong>{{nombre}}</strong>,</p>
                <p>
                  Te confirmamos que tu email ha sido actualizado exitosamente.
                </p>
                <p><strong>Nuevo email:</strong> {{emailNuevo}}</p>
                <p>
                  A partir de ahora recibirás todas las notificaciones en esta dirección.
                </p>
              </div>
              <div style="font-size: 12px; color: #555; margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; text-align: center;">
                <p>Este es un correo automático, por favor no respondas a este mensaje.</p>
              </div>
            </body>
          </html>
        `,
        is_active: true,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        notification_type_id: uuidv4(),
        code: 'NATIONAL_ID_CAMBIADO',
        name: 'National ID Cambiado',
        description: 'Email enviado cuando se cambia el national ID de un usuario',
        supports_push: false,
        supports_email: true,
        priority: 'high',
        title_template: 'National ID actualizado',
        body_template: 'Tu National ID ha sido actualizado por un administrador.',
        email_subject_template: 'National ID actualizado',
        email_body_template: `
          <html>
            <body style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px;">
              <div style="text-align: center;">
                <img src="${notifications.logoUrl || 'https://via.placeholder.com/150'}" alt="Logo" style="width: 150px; margin-bottom: 20px;">
                <h2 style="color: #007bff;">📋 National ID actualizado</h2>
              </div>
              <div style="font-size: 16px; color: #333; line-height: 1.6; margin: 20px 0;">
                <p>Hola <strong>{{nombre}}</strong>,</p>
                <p>
                  Te informamos que tu National ID ha sido actualizado por un administrador.
                </p>
                <p><strong>National ID anterior:</strong> {{nationalIdAntiguo}}</p>
                <p><strong>National ID nuevo:</strong> {{nationalIdNuevo}}</p>
                <p>
                  Si <strong>no reconoces este cambio</strong>, contacta inmediatamente con soporte.
                </p>
              </div>
              <div style="font-size: 12px; color: #555; margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; text-align: center;">
                <p>Este es un correo automático, por favor no respondas a este mensaje.</p>
              </div>
            </body>
          </html>
        `,
        is_active: true,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        notification_type_id: uuidv4(),
        code: 'CUENTA_ELIMINADA',
        name: 'Cuenta Eliminada',
        description: 'Email enviado cuando se elimina una cuenta de usuario',
        supports_push: false,
        supports_email: true,
        priority: 'high',
        title_template: 'Cuenta eliminada',
        body_template: 'Tu cuenta ha sido eliminada por un administrador.',
        email_subject_template: 'Cuenta eliminada',
        email_body_template: `
          <html>
            <body style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px;">
              <div style="text-align: center;">
                <img src="${notifications.logoUrl || 'https://via.placeholder.com/150'}" alt="Logo" style="width: 150px; margin-bottom: 20px;">
                <h2 style="color: #dc3545;">❌ Cuenta eliminada</h2>
              </div>
              <div style="font-size: 16px; color: #333; line-height: 1.6; margin: 20px 0;">
                <p>Hola <strong>{{nombre}}</strong>,</p>
                <p>
                  Te informamos que tu cuenta ha sido <strong>eliminada</strong> por un administrador.
                </p>
                <p>
                  Ya no podrás acceder a la plataforma con tus credenciales anteriores.
                </p>
                <p>
                  Si crees que esto es un error o necesitas más información, por favor contacta con soporte.
                </p>
              </div>
              <div style="font-size: 12px; color: #555; margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; text-align: center;">
                <p>Este es un correo automático, por favor no respondas a este mensaje.</p>
              </div>
            </body>
          </html>
        `,
        is_active: true,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        notification_type_id: uuidv4(),
        code: 'CODIGO_VERIFICACION',
        name: 'Código de Verificación',
        description: 'Email con código de verificación de 6 dígitos',
        supports_push: false,
        supports_email: true,
        priority: 'high',
        title_template: 'Código de verificación',
        body_template: 'Tu código de verificación es: {{codigo}}. Expira en {{minutosExpiracion}} minutos.',
        email_subject_template: 'Código de verificación - Democracia Líquida',
        email_body_template: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="UTF-8">
          </head>
          <body style="font-family: Arial, sans-serif; padding: 20px; background-color: #f9f9f9;">
            <div style="max-width: 600px; margin: 0 auto; background-color: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
              <h2 style="color: #333; margin-bottom: 20px;">Código de verificación</h2>
              
              <p style="color: #555; line-height: 1.6;">
                Tu código de verificación es:
              </p>
              
              <div style="background-color: #f4f4f4; padding: 20px; margin: 25px 0; text-align: center; border-radius: 8px; border: 2px dashed #007bff;">
                <span style="font-size: 32px; font-weight: bold; color: #007bff; letter-spacing: 8px; font-family: 'Courier New', monospace;">
                  {{codigo}}
                </span>
              </div>
              
              <p style="color: #d9534f; padding: 15px; background-color: #fff3cd; border-left: 4px solid #ffc107; border-radius: 4px; margin-top: 20px;">
                ⏱️ Este código expira en <strong>{{minutosExpiracion}} minutos</strong>.
              </p>
              
              <p style="color: #999; font-size: 12px; margin-top: 30px;">
                Si no solicitaste este código, puedes ignorar este mensaje de forma segura.
              </p>
              
              <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
              
              <p style="color: #999; font-size: 12px; text-align: center;">
                © ${new Date().getFullYear()} Democracia Líquida. Todos los derechos reservados.
              </p>
            </div>
          </body>
          </html>
        `,
        is_active: true,
        created_at: new Date(),
        updated_at: new Date()
      }
    ];

    await queryInterface.bulkInsert(
      { tableName: 'notification_types', schema: SCHEMA },
      notificationTypes
    );

    console.log('✅ Tipos de notificación creados exitosamente');
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete(
      { tableName: 'notification_types', schema: SCHEMA },
      null,
      {}
    );
  }
};