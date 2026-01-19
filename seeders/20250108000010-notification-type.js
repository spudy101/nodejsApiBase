'use strict';
require('dotenv').config();

const SCHEMA = process.env.DB_SCHEMA;
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
                <img src="${process.env.LOGO_URL || 'https://via.placeholder.com/150'}" alt="Logo" style="width: 150px; margin-bottom: 20px;">
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
                <img src="${process.env.LOGO_URL || 'https://via.placeholder.com/150'}" alt="Logo" style="width: 150px; margin-bottom: 20px;">
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
        code: 'NUEVA_VOTACION',
        name: 'Nueva Votación Disponible',
        description: 'Notifica cuando hay una nueva votación disponible',
        supports_push: true,
        supports_email: true,
        priority: 'high',
        title_template: 'Nueva votación: {{titulo_votacion}}',
        body_template: 'Hay una nueva votación disponible sobre {{titulo_votacion}}. Tu voz es importante, ¡participa ahora!',
        email_subject_template: 'Nueva votación disponible: {{titulo_votacion}}',
        email_body_template: `
          <html>
            <body style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px;">
              <div style="text-align: center;">
                <img src="${process.env.LOGO_URL || 'https://via.placeholder.com/150'}" alt="Logo" style="width: 150px; margin-bottom: 20px;">
                <h2 style="color: #007bff;">Nueva votación disponible</h2>
              </div>
              <div style="font-size: 16px; color: #333; line-height: 1.6; margin: 20px 0;">
                <p>Hola,</p>
                <p>Hay una nueva votación disponible:</p>
                <h3 style="color: #007bff;">{{titulo_votacion}}</h3>
                <p>{{descripcion_votacion}}</p>
                <p>Tu participación es importante. Ingresa a la plataforma para ejercer tu voto.</p>
                <div style="text-align: center; margin: 30px 0;">
                  <a href="{{url_votacion}}" style="background-color: #007bff; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">Ver votación</a>
                </div>
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
        code: 'VOTACION_PRONTA_A_CERRAR',
        name: 'Votación Próxima a Cerrar',
        description: 'Recordatorio cuando una votación está por finalizar',
        supports_push: true,
        supports_email: true,
        priority: 'high',
        title_template: 'Última oportunidad: {{titulo_votacion}}',
        body_template: 'La votación {{titulo_votacion}} cierra en {{tiempo_restante}}. ¡No pierdas la oportunidad de participar!',
        email_subject_template: 'Última oportunidad para votar: {{titulo_votacion}}',
        email_body_template: `
          <html>
            <body style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px;">
              <div style="text-align: center;">
                <img src="${process.env.LOGO_URL || 'https://via.placeholder.com/150'}" alt="Logo" style="width: 150px; margin-bottom: 20px;">
                <h2 style="color: #dc3545;">⏰ Votación próxima a cerrar</h2>
              </div>
              <div style="font-size: 16px; color: #333; line-height: 1.6; margin: 20px 0;">
                <p>Hola,</p>
                <p>Te recordamos que la votación <strong>{{titulo_votacion}}</strong> cerrará en <strong style="color: #dc3545;">{{tiempo_restante}}</strong>.</p>
                <p>Esta es tu última oportunidad para hacer escuchar tu voz en este tema importante.</p>
                <div style="text-align: center; margin: 30px 0;">
                  <a href="{{url_votacion}}" style="background-color: #dc3545; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">Votar ahora</a>
                </div>
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
        code: 'RESULTADOS_VOTACION',
        name: 'Resultados de Votación',
        description: 'Notifica los resultados de una votación finalizada',
        supports_push: true,
        supports_email: true,
        priority: 'normal',
        title_template: 'Resultados: {{titulo_votacion}}',
        body_template: 'Ya están disponibles los resultados de la votación {{titulo_votacion}}. {{resultado_resumen}}',
        email_subject_template: 'Resultados disponibles: {{titulo_votacion}}',
        email_body_template: `
          <html>
            <body style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px;">
              <div style="text-align: center;">
                <img src="${process.env.LOGO_URL || 'https://via.placeholder.com/150'}" alt="Logo" style="width: 150px; margin-bottom: 20px;">
                <h2 style="color: #28a745;">📊 Resultados de votación</h2>
              </div>
              <div style="font-size: 16px; color: #333; line-height: 1.6; margin: 20px 0;">
                <p>Hola,</p>
                <p>Ya están disponibles los resultados de la votación:</p>
                <h3 style="color: #007bff;">{{titulo_votacion}}</h3>
                <p>{{resultado_resumen}}</p>
                <div style="text-align: center; margin: 30px 0;">
                  <a href="{{url_resultados}}" style="background-color: #28a745; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">Ver resultados completos</a>
                </div>
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
                <img src="${process.env.LOGO_URL || 'https://via.placeholder.com/150'}" alt="Logo" style="width: 150px; margin-bottom: 20px;">
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
                <img src="${process.env.LOGO_URL || 'https://via.placeholder.com/150'}" alt="Logo" style="width: 150px; margin-bottom: 20px;">
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
                <img src="${process.env.LOGO_URL || 'https://via.placeholder.com/150'}" alt="Logo" style="width: 150px; margin-bottom: 20px;">
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
                <img src="${process.env.LOGO_URL || 'https://via.placeholder.com/150'}" alt="Logo" style="width: 150px; margin-bottom: 20px;">
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