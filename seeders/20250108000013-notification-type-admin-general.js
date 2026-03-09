'use strict';
const { database, notifications } = require('../shared/constants');

const SCHEMA = database.schema_notification;
const { v4: uuidv4 } = require('uuid');

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const existing = await queryInterface.sequelize.query(
      `SELECT code FROM "${SCHEMA}"."notification_types" WHERE code IN (
        'ROL_CHANGE', 'USUARIO_CREADO_ADMIN', 'CUENTA_ELIMINADA', 'NOTIFICACION_GENERAL',
        'PERSON_ADMIN_ACTION',
        'ACCOUNT_ACTIVATED', 'ACCOUNT_DEACTIVATED',
        'PASSWORD_RESET_ADMIN',
        'EMAIL_CHANGED_OLD', 'EMAIL_CHANGED_NEW',
        'NATIONAL_ID_CHANGED'
      )`,
      { type: Sequelize.QueryTypes.SELECT }
    );

    // ✅ Patrón moderno: filtrar por código individual, no saltar todo si alguno existe
    const existingCodes = new Set(existing.map(row => row.code));

    const allTypes = [

      // ========================================
      // ADMINISTRACIÓN DE USUARIOS
      // ========================================
      {
        id: uuidv4(),
        code: 'ROL_CHANGE',
        name: 'Cambio de Rol',
        description: 'Notifica cuando se modifica el rol de un usuario',
        supports_push: true,
        supports_email: true,
        priority: 'high',
        title_template: 'Tu rol ha sido actualizado',
        body_template: 'Tu rol ha sido cambiado a {{nuevo_rol}}.',
        email_subject_template: 'Tu rol ha sido actualizado',
        email_body_template: `
          <html>
            <body style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px;">
              <div style="text-align: center;">
                <img src="${notifications.logoUrl || 'https://via.placeholder.com/150'}" alt="Logo" style="width: 150px; margin-bottom: 20px;">
                <h2 style="color: #007bff;">Tu rol ha sido actualizado</h2>
              </div>
              <div style="font-size: 16px; color: #333; line-height: 1.6; margin: 20px 0;">
                <p>Hola <strong>{{nombre}}</strong>,</p>
                <p>Te informamos que tu rol ha sido actualizado.</p>
                <div style="background-color: #f8f9fa; padding: 15px; margin: 20px 0; border-radius: 4px;">
                  <p style="margin: 0;"><strong>Nuevo rol:</strong> {{nuevo_rol}}</p>
                  <p style="margin: 10px 0 0 0;"><strong>Permisos:</strong> {{permisos_descripcion}}</p>
                </div>
              </div>
            </body>
          </html>
        `,
        is_active: true,
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        id: uuidv4(),
        code: 'USUARIO_CREADO_ADMIN',
        name: 'Usuario Creado por Admin',
        description: 'Email cuando un administrador crea una cuenta de usuario',
        supports_push: false,
        supports_email: true,
        priority: 'high',
        title_template: 'Bienvenido a la plataforma',
        body_template: 'Tu cuenta ha sido creada por un administrador.',
        email_subject_template: 'Bienvenido - Cuenta creada',
        email_body_template: `
          <html>
            <body style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px;">
              <div style="text-align: center;">
                <img src="${notifications.logoUrl || 'https://via.placeholder.com/150'}" alt="Logo" style="width: 150px; margin-bottom: 20px;">
                <h2 style="color: #007bff;">¡Bienvenido!</h2>
              </div>
              <div style="font-size: 16px; color: #333; line-height: 1.6; margin: 20px 0;">
                <p>Hola <strong>{{nombre}}</strong>,</p>
                <p>Un administrador ha creado tu cuenta en la plataforma.</p>
                <p><strong>Email:</strong> {{email}}</p>
                <p><strong>Contraseña temporal:</strong> <code>{{passwordTemporal}}</code></p>
                <p><strong>⚠️ Importante:</strong> Cambia tu contraseña al iniciar sesión.</p>
              </div>
            </body>
          </html>
        `,
        is_active: true,
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        id: uuidv4(),
        code: 'CUENTA_ELIMINADA',
        name: 'Cuenta Eliminada',
        description: 'Email cuando se elimina una cuenta de usuario',
        supports_push: false,
        supports_email: true,
        priority: 'high',
        title_template: 'Cuenta eliminada',
        body_template: 'Tu cuenta ha sido eliminada.',
        email_subject_template: 'Cuenta Eliminada',
        email_body_template: `
          <html>
            <body style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px;">
              <div style="text-align: center;">
                <img src="${notifications.logoUrl || 'https://via.placeholder.com/150'}" alt="Logo" style="width: 150px; margin-bottom: 20px;">
                <h2 style="color: #dc3545;">❌ Cuenta eliminada</h2>
              </div>
              <div style="font-size: 16px; color: #333; line-height: 1.6; margin: 20px 0;">
                <p>Hola <strong>{{nombre}}</strong>,</p>
                <p>Te informamos que tu cuenta ha sido <strong>eliminada</strong>.</p>
                <p>Si crees que esto es un error, contacta con soporte.</p>
              </div>
            </body>
          </html>
        `,
        is_active: true,
        created_at: new Date(),
        updated_at: new Date(),
      },

      // ========================================
      // ACCIONES DEL ADMIN SOBRE PERSONAS (registro interno — sin canales)
      // Audit trail del admin: quién hizo qué sobre qué usuario.
      // ========================================
      {
        id: uuidv4(),
        code: 'PERSON_ADMIN_ACTION',
        name: 'Persona: Acción de Admin',
        description: 'Registro interno de la acción ejecutada por el admin sobre un usuario (crear, activar, desactivar, reset password, cambiar email, national id, rol, eliminar cuenta)',
        supports_push: false,
        supports_email: false,
        priority: 'low',
        title_template: 'Acción de admin registrada',
        body_template: '{{nombre}} ha ejecutado la acción "{{accion}}" sobre el usuario {{user_id}}.',
        email_subject_template: null,
        email_body_template: null,
        is_active: true,
        created_at: new Date(),
        updated_at: new Date(),
      },

      // ========================================
      // ACTIVACIÓN / DESACTIVACIÓN DE CUENTA (admin → usuario — email + push)
      // ========================================
      {
        id: uuidv4(),
        code: 'ACCOUNT_ACTIVATED',
        name: 'Cuenta Activada',
        description: 'Notifica al usuario que su cuenta fue activada por un administrador',
        supports_push: true,
        supports_email: true,
        priority: 'high',
        title_template: 'Tu cuenta ha sido activada',
        body_template: 'Hola {{nombre}}, tu cuenta ha sido activada. Ya puedes ingresar a la plataforma.',
        email_subject_template: 'Tu cuenta ha sido activada',
        email_body_template: `
          <html>
            <body style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px;">
              <div style="text-align: center;">
                <img src="${notifications.logoUrl || 'https://via.placeholder.com/150'}" alt="Logo" style="width: 150px; margin-bottom: 20px;">
                <h2 style="color: #198754;">✅ Tu cuenta ha sido activada</h2>
              </div>
              <div style="font-size: 16px; color: #333; line-height: 1.6; margin: 20px 0;">
                <p>Hola <strong>{{nombre}}</strong>,</p>
                <p>Tu cuenta ha sido <strong>activada</strong> por un administrador. Ya puedes ingresar a la plataforma con normalidad.</p>
                <p>Si tienes dudas, contáctanos.</p>
              </div>
            </body>
          </html>
        `,
        is_active: true,
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        id: uuidv4(),
        code: 'ACCOUNT_DEACTIVATED',
        name: 'Cuenta Desactivada',
        description: 'Notifica al usuario que su cuenta fue desactivada por un administrador',
        supports_push: true,
        supports_email: true,
        priority: 'high',
        title_template: 'Tu cuenta ha sido desactivada',
        body_template: 'Hola {{nombre}}, tu cuenta ha sido desactivada temporalmente. Contáctanos para más información.',
        email_subject_template: 'Tu cuenta ha sido desactivada',
        email_body_template: `
          <html>
            <body style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px;">
              <div style="text-align: center;">
                <img src="${notifications.logoUrl || 'https://via.placeholder.com/150'}" alt="Logo" style="width: 150px; margin-bottom: 20px;">
                <h2 style="color: #dc3545;">⚠️ Tu cuenta ha sido desactivada</h2>
              </div>
              <div style="font-size: 16px; color: #333; line-height: 1.6; margin: 20px 0;">
                <p>Hola <strong>{{nombre}}</strong>,</p>
                <p>Tu cuenta ha sido <strong>desactivada</strong> por un administrador.</p>
                <p>Si crees que esto es un error o necesitas más información, contáctanos a través de soporte.</p>
              </div>
            </body>
          </html>
        `,
        is_active: true,
        created_at: new Date(),
        updated_at: new Date(),
      },

      // ========================================
      // RESET DE CONTRASEÑA POR ADMIN (admin → usuario — email + push)
      // ========================================
      {
        id: uuidv4(),
        code: 'PASSWORD_RESET_ADMIN',
        name: 'Contraseña Reseteada por Admin',
        description: 'Notifica al usuario que un administrador reseteó su contraseña y le envía la temporal',
        supports_push: true,
        supports_email: true,
        priority: 'high',
        title_template: 'Tu contraseña fue reseteada',
        body_template: 'Hola {{nombre}}, un administrador ha reseteado tu contraseña. Revisa tu correo para obtener tu contraseña temporal.',
        email_subject_template: 'Tu contraseña ha sido reseteada por un administrador',
        email_body_template: `
          <html>
            <body style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px;">
              <div style="text-align: center;">
                <img src="${notifications.logoUrl || 'https://via.placeholder.com/150'}" alt="Logo" style="width: 150px; margin-bottom: 20px;">
                <h2 style="color: #007bff;">🔑 Contraseña reseteada</h2>
              </div>
              <div style="font-size: 16px; color: #333; line-height: 1.6; margin: 20px 0;">
                <p>Hola <strong>{{nombre}}</strong>,</p>
                <p>Un administrador ha reseteado tu contraseña.</p>
                <div style="background-color: #f8f9fa; padding: 15px; margin: 20px 0; border-radius: 4px;">
                  <p style="margin: 0;"><strong>Contraseña temporal:</strong> <code>{{passwordTemporal}}</code></p>
                </div>
                <p><strong>⚠️ Importante:</strong> Cambia tu contraseña inmediatamente al ingresar.</p>
                <p>Si no reconoces esta acción, contacta a soporte de inmediato.</p>
              </div>
            </body>
          </html>
        `,
        is_active: true,
        created_at: new Date(),
        updated_at: new Date(),
      },

      // ========================================
      // CAMBIO DE EMAIL POR ADMIN (admin → usuario — email)
      // Dos notificaciones: al email antiguo y al email nuevo.
      // ========================================
      {
        id: uuidv4(),
        code: 'EMAIL_CHANGED_OLD',
        name: 'Email Cambiado — Notificación al Email Antiguo',
        description: 'Notifica al email anterior del usuario que su email fue cambiado por un administrador',
        supports_push: false,
        supports_email: true,
        priority: 'high',
        title_template: 'Tu email ha sido modificado',
        body_template: 'El email asociado a tu cuenta ha sido cambiado.',
        email_subject_template: 'Aviso: tu email fue modificado',
        email_body_template: `
          <html>
            <body style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px;">
              <div style="text-align: center;">
                <img src="${notifications.logoUrl || 'https://via.placeholder.com/150'}" alt="Logo" style="width: 150px; margin-bottom: 20px;">
                <h2 style="color: #ffc107;">⚠️ Tu email fue modificado</h2>
              </div>
              <div style="font-size: 16px; color: #333; line-height: 1.6; margin: 20px 0;">
                <p>Hola <strong>{{nombre}}</strong>,</p>
                <p>Te informamos que el email de tu cuenta ha sido <strong>modificado por un administrador</strong>.</p>
                <div style="background-color: #f8f9fa; padding: 15px; margin: 20px 0; border-radius: 4px;">
                  <p style="margin: 0;"><strong>Email anterior:</strong> {{email}}</p>
                </div>
                <p>Si no reconoces esta acción, contacta a soporte de inmediato.</p>
              </div>
            </body>
          </html>
        `,
        is_active: true,
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        id: uuidv4(),
        code: 'EMAIL_CHANGED_NEW',
        name: 'Email Cambiado — Confirmación al Email Nuevo',
        description: 'Confirma al nuevo email del usuario que el cambio fue aplicado correctamente',
        supports_push: true,
        supports_email: true,
        priority: 'high',
        title_template: 'Email actualizado correctamente',
        body_template: 'Hola {{nombre}}, tu nuevo email ha sido registrado correctamente.',
        email_subject_template: 'Tu email ha sido actualizado',
        email_body_template: `
          <html>
            <body style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px;">
              <div style="text-align: center;">
                <img src="${notifications.logoUrl || 'https://via.placeholder.com/150'}" alt="Logo" style="width: 150px; margin-bottom: 20px;">
                <h2 style="color: #198754;">✅ Email actualizado</h2>
              </div>
              <div style="font-size: 16px; color: #333; line-height: 1.6; margin: 20px 0;">
                <p>Hola <strong>{{nombre}}</strong>,</p>
                <p>Tu email ha sido <strong>actualizado correctamente</strong>. A partir de ahora este será el email asociado a tu cuenta.</p>
                <div style="background-color: #f8f9fa; padding: 15px; margin: 20px 0; border-radius: 4px;">
                  <p style="margin: 0;"><strong>Nuevo email:</strong> {{email}}</p>
                </div>
              </div>
            </body>
          </html>
        `,
        is_active: true,
        created_at: new Date(),
        updated_at: new Date(),
      },

      // ========================================
      // CAMBIO DE RUT/ID NACIONAL POR ADMIN (admin → usuario — email + push)
      // ========================================
      {
        id: uuidv4(),
        code: 'NATIONAL_ID_CHANGED',
        name: 'RUT/ID Nacional Cambiado por Admin',
        description: 'Notifica al usuario que un administrador cambió su RUT/ID nacional',
        supports_push: true,
        supports_email: true,
        priority: 'high',
        title_template: 'Tu RUT/ID nacional fue modificado',
        body_template: 'Hola {{nombre}}, tu RUT/ID nacional ha sido actualizado por un administrador.',
        email_subject_template: 'Tu RUT/ID nacional fue modificado',
        email_body_template: `
          <html>
            <body style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px;">
              <div style="text-align: center;">
                <img src="${notifications.logoUrl || 'https://via.placeholder.com/150'}" alt="Logo" style="width: 150px; margin-bottom: 20px;">
                <h2 style="color: #007bff;">📋 RUT/ID nacional actualizado</h2>
              </div>
              <div style="font-size: 16px; color: #333; line-height: 1.6; margin: 20px 0;">
                <p>Hola <strong>{{nombre}}</strong>,</p>
                <p>Un administrador ha actualizado tu <strong>RUT/ID nacional</strong> en la plataforma.</p>
                <p>Si no reconoces esta acción, contacta a soporte de inmediato.</p>
              </div>
            </body>
          </html>
        `,
        is_active: true,
        created_at: new Date(),
        updated_at: new Date(),
      },

      // ========================================
      // GENERAL (COMODÍN)
      // ========================================
      {
        id: uuidv4(),
        code: 'NOTIFICACION_GENERAL',
        name: 'Notificación General',
        description: 'Notificación genérica para diferentes eventos del sistema',
        supports_push: true,
        supports_email: true,
        priority: 'normal',
        title_template: '{{titulo}}',
        body_template: '{{contenido}}',
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
        updated_at: new Date(),
      },
    ];

    // ✅ Patrón moderno: insertar solo los que no existen todavía
    const toInsert = allTypes.filter(t => !existingCodes.has(t.code));

    if (toInsert.length === 0) {
      console.log('⚠️  Todos los tipos ya existen, saltando seed...');
      return;
    }

    await queryInterface.bulkInsert(
      { tableName: 'notification_types', schema: SCHEMA },
      toInsert
    );

    console.log(`✅ ${toInsert.length} tipo(s) de notificacion admin/general insertados:`, toInsert.map(t => t.code));
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete(
      { tableName: 'notification_types', schema: SCHEMA },
      {
        code: [
          'ROL_CHANGE', 'USUARIO_CREADO_ADMIN', 'CUENTA_ELIMINADA', 'NOTIFICACION_GENERAL',
          'PERSON_ADMIN_ACTION',
          'ACCOUNT_ACTIVATED', 'ACCOUNT_DEACTIVATED',
          'PASSWORD_RESET_ADMIN',
          'EMAIL_CHANGED_OLD', 'EMAIL_CHANGED_NEW',
          'NATIONAL_ID_CHANGED',
        ],
      },
      {}
    );
  },
};