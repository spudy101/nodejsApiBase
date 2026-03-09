'use strict';
const { database, notifications } = require('../shared/constants');

const SCHEMA = database.schema_notification;
const { v4: uuidv4 } = require('uuid');

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Verificar cuales ya existen para no duplicar
    const existing = await queryInterface.sequelize.query(
      `SELECT code FROM "${SCHEMA}"."notification_types" WHERE code IN (
        'BIENVENIDA', 'PROFILE_COMPLETED', 'TOTP_ACTIVADO', 'TOTP_ELIMINADO',
        'RESET_MFA', 'SOLICITUD_RESET_MFA', 'SOLICITUD_RESET_PASSWORD',
        'RESET_PASSWORD', 'CODIGO_VERIFICACION', 'NUEVO_DISPOSITIVO_DETECTADO',
        'PROFILE_UPDATED', 'EMAIL_UPDATED', 'PHONE_UPDATED',
        'PASSWORD_UPDATED', 'NATIONAL_ID_UPDATED'
      )`,
      { type: Sequelize.QueryTypes.SELECT }
    );

    const existingCodes = new Set(existing.map(row => row.code));

    const allTypes = [
      // ========================================
      // BIENVENIDA Y REGISTRO
      // ========================================
      {
        id: uuidv4(),
        code: 'BIENVENIDA',
        name: 'Email de Bienvenida',
        description: 'Email enviado cuando un usuario se registra exitosamente en la plataforma',
        supports_push: false,
        supports_email: true,
        priority: 'high',
        title_template: 'Bienvenido a Democracia Líquida',
        body_template: 'Hola {{nombre}}, te has registrado exitosamente. Ahora puedes participar en votaciones y publicaciones.',
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
        updated_at: new Date(),
      },
      {
        id: uuidv4(),
        code: 'PROFILE_COMPLETED',
        name: 'Perfil Completado',
        description: 'Notificación cuando un usuario completa su perfil',
        supports_push: true,
        supports_email: false,
        priority: 'normal',
        title_template: '¡Perfil completado!',
        body_template: 'Has completado tu perfil exitosamente. Ahora tienes acceso completo a todas las funcionalidades.',
        email_subject_template: null,
        email_body_template: null,
        is_active: true,
        created_at: new Date(),
        updated_at: new Date(),
      },

      // ========================================
      // MFA Y AUTENTICACIÓN
      // ========================================
      {
        id: uuidv4(),
        code: 'TOTP_ACTIVADO',
        name: 'TOTP Activado',
        // ✅ CORREGIDO: Acción iniciada por el usuario — sin canales (solo audit trail interno)
        // El usuario ya sabe lo que hizo; no necesita confirmación por email ni push.
        description: 'Registro interno cuando el usuario activa el TOTP (MFA)',
        supports_push: false,
        supports_email: false,
        priority: 'low',
        title_template: 'TOTP activado',
        body_template: 'Has activado la autenticación de dos factores (TOTP) en tu cuenta.',
        email_subject_template: null,
        email_body_template: null,
        is_active: true,
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        id: uuidv4(),
        code: 'TOTP_ELIMINADO',
        name: 'TOTP Eliminado',
        // ✅ CORREGIDO: Acción iniciada por el usuario — sin canales (solo audit trail interno)
        // El usuario ya sabe lo que hizo; no necesita confirmación por email ni push.
        // Cuando es el ADMIN quien lo desactiva, se usa RESET_MFA (que sí tiene email).
        description: 'Registro interno cuando el usuario desactiva su propio TOTP (MFA)',
        supports_push: false,
        supports_email: false,
        priority: 'low',
        title_template: 'TOTP desactivado',
        body_template: 'Has desactivado la autenticación de dos factores (TOTP) de tu cuenta.',
        email_subject_template: null,
        email_body_template: null,
        is_active: true,
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        id: uuidv4(),
        code: 'RESET_MFA',
        name: 'MFA Reiniciado',
        description: 'Notifica al usuario que un administrador reinició su MFA',
        supports_push: false,
        supports_email: true,
        priority: 'high',
        title_template: 'Aviso de seguridad crítico',
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
                <p>Hola <strong>{{nombre}}</strong>,</p>
                <p>Te informamos que todos los métodos de <strong>autenticación multifactor (MFA)</strong> de tu cuenta fueron reiniciados.</p>
                <p>Si <strong>no reconoces esta acción</strong>, contacta a soporte de inmediato.</p>
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
        code: 'SOLICITUD_RESET_MFA',
        name: 'Solicitud de Reset de MFA',
        description: 'Email enviado cuando un usuario solicita desactivar su MFA',
        supports_push: false,
        supports_email: true,
        priority: 'high',
        title_template: 'Desactivación de MFA',
        body_template: 'Haz clic en el enlace para desactivar tu autenticación de dos factores.',
        email_subject_template: 'Desactivación de MFA - Confirma tu solicitud',
        email_body_template: `
          <html>
            <body style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px;">
              <div style="text-align: center;">
                <img src="${notifications.logoUrl || 'https://via.placeholder.com/150'}" alt="Logo" style="width: 150px; margin-bottom: 20px;">
                <h2 style="color: #dc3545;">🔓 Desactivación de MFA</h2>
              </div>
              <div style="font-size: 16px; color: #333; line-height: 1.6; margin: 20px 0;">
                <p>Hola <strong>{{nombre}}</strong>,</p>
                <p>Has solicitado desactivar tu autenticación de dos factores (MFA).</p>
                <div style="text-align: center; margin: 30px 0;">
                  <a href="{{resetUrl}}" style="background-color: #dc3545; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
                    Desactivar MFA
                  </a>
                </div>
                <p>Este enlace expirará en <strong>{{minutosExpiracion}} minutos</strong>.</p>
                <p><strong>⚠️ Advertencia:</strong> Desactivar el MFA reducirá la seguridad de tu cuenta.</p>
              </div>
            </body>
          </html>
        `,
        is_active: true,
        created_at: new Date(),
        updated_at: new Date(),
      },

      // ========================================
      // CONTRASEÑAS Y RECUPERACIÓN
      // ========================================
      {
        id: uuidv4(),
        code: 'SOLICITUD_RESET_PASSWORD',
        name: 'Solicitud de Reset de Contraseña',
        description: 'Email enviado cuando un usuario solicita restablecer su contraseña',
        supports_push: false,
        supports_email: true,
        priority: 'high',
        title_template: 'Recuperación de Contraseña',
        body_template: 'Haz clic en el enlace para restablecer tu contraseña.',
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
                <p>Has solicitado restablecer tu contraseña. Haz clic en el siguiente enlace:</p>
                <div style="text-align: center; margin: 30px 0;">
                  <a href="{{resetUrl}}" style="background-color: #007bff; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
                    Restablecer Contraseña
                  </a>
                </div>
                <p>Este enlace expirará en <strong>{{minutosExpiracion}} minutos</strong>.</p>
                <p>Si no solicitaste este cambio, ignora este correo.</p>
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
        code: 'RESET_PASSWORD',
        name: 'Contraseña Restablecida',
        description: 'Notifica al usuario que su contraseña fue restablecida',
        supports_push: false,
        supports_email: true,
        priority: 'high',
        title_template: 'Contraseña restablecida',
        body_template: 'Tu contraseña fue restablecida correctamente.',
        email_subject_template: 'Contraseña restablecida exitosamente',
        email_body_template: `
          <html>
            <body style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px;">
              <div style="text-align: center;">
                <img src="${notifications.logoUrl || 'https://via.placeholder.com/150'}" alt="Logo" style="width: 150px; margin-bottom: 20px;">
                <h2 style="color: #198754;">🔑 Contraseña restablecida</h2>
              </div>
              <div style="font-size: 16px; color: #333; line-height: 1.6; margin: 20px 0;">
                <p>Hola,</p>
                <p>Te confirmamos que tu <strong>contraseña fue restablecida correctamente</strong>.</p>
                <p>Si <strong>no reconoces esta acción</strong>, cambia tu contraseña inmediatamente y contacta a soporte.</p>
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
        code: 'CODIGO_VERIFICACION',
        name: 'Código de Verificación',
        description: 'Email con código de verificación de 6 dígitos',
        supports_push: false,
        supports_email: true,
        priority: 'high',
        title_template: 'Código de verificación',
        body_template: 'Tu código de verificación es: {{codigo}}. Expira en {{minutosExpiracion}} minutos.',
        email_subject_template: 'Código de verificación',
        email_body_template: `
          <html>
          <body style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px;">
            <div style="text-align: center;">
              <img src="${notifications.logoUrl || 'https://via.placeholder.com/150'}" alt="Logo" style="width: 150px; margin-bottom: 20px;">
              <h2 style="color: #007bff;">Código de verificación</h2>
            </div>
            <div style="font-size: 16px; color: #333; line-height: 1.6; margin: 20px 0;">
              <p>Tu código de verificación es:</p>
              <div style="background-color: #f4f4f4; padding: 20px; margin: 25px 0; text-align: center; border-radius: 8px; border: 2px dashed #007bff;">
                <span style="font-size: 32px; font-weight: bold; color: #007bff; letter-spacing: 8px; font-family: 'Courier New', monospace;">
                  {{codigo}}
                </span>
              </div>
              <p style="color: #d9534f; padding: 15px; background-color: #fff3cd; border-radius: 4px;">
                ⏱️ Este código expira en <strong>{{minutosExpiracion}} minutos</strong>.
              </p>
            </div>
          </body>
          </html>
        `,
        is_active: true,
        created_at: new Date(),
        updated_at: new Date(),
      },

      // ========================================
      // SEGURIDAD — DISPOSITIVOS
      // ========================================
      {
        id: uuidv4(),
        code: 'NUEVO_DISPOSITIVO_DETECTADO',
        name: 'Nuevo Dispositivo Detectado',
        description: 'Notificacion al usuario cuando inicia sesion desde un dispositivo no reconocido',
        supports_push: true,
        supports_email: true,
        priority: 'high',
        title_template: 'Nuevo acceso desde un dispositivo desconocido',
        body_template: 'Hola {{nombre}}, detectamos un acceso a tu cuenta desde un nuevo dispositivo. Si no fuiste tu, cambia tu contrasena de inmediato.',
        email_subject_template: 'Alerta de seguridad: nuevo dispositivo detectado',
        email_body_template: `
          <html>
            <body style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px;">
              <div style="text-align: center;">
                <img src="${notifications.logoUrl || 'https://via.placeholder.com/150'}" alt="Logo" style="width: 150px; margin-bottom: 20px;">
                <h2 style="color: #dc3545;">⚠️ Nuevo dispositivo detectado</h2>
              </div>
              <div style="font-size: 16px; color: #333; line-height: 1.6; margin: 20px 0;">
                <p>Hola <strong>{{nombre}}</strong>,</p>
                <p>Detectamos un inicio de sesión en tu cuenta desde un <strong>dispositivo no reconocido</strong>.</p>
                <div style="background-color: #f8f9fa; border-left: 4px solid #dc3545; padding: 15px; margin: 20px 0; border-radius: 4px;">
                  <p style="margin: 4px 0;"><strong>Fecha:</strong> {{fechaAcceso}}</p>
                  <p style="margin: 4px 0;"><strong>IP:</strong> {{ip}}</p>
                  <p style="margin: 4px 0;"><strong>Dispositivo:</strong> {{userAgent}}</p>
                </div>
                <p>Si <strong>fuiste tú</strong>, puedes ignorar este mensaje. Tu dispositivo ha sido registrado.</p>
                <p>Si <strong>no reconoces esta actividad</strong>, cambia tu contraseña de inmediato y contacta a soporte.</p>
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

      // ========================================
      // ACTUALIZACIONES DE PERFIL (acciones del usuario — sin canales)
      // Audit trail interno: el usuario ya sabe lo que hizo.
      // ========================================
      {
        id: uuidv4(),
        code: 'PROFILE_UPDATED',
        name: 'Perfil Actualizado',
        description: 'Registro interno cuando el usuario actualiza datos de su perfil (username, avatar, género, ubicación)',
        supports_push: false,
        supports_email: false,
        priority: 'low',
        title_template: 'Perfil actualizado',
        body_template: 'Has actualizado tu perfil exitosamente.',
        email_subject_template: null,
        email_body_template: null,
        is_active: true,
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        id: uuidv4(),
        code: 'EMAIL_UPDATED',
        name: 'Email Actualizado',
        description: 'Registro interno cuando el usuario actualiza su email',
        supports_push: false,
        supports_email: false,
        priority: 'low',
        title_template: 'Email actualizado',
        body_template: 'Has actualizado tu email exitosamente.',
        email_subject_template: null,
        email_body_template: null,
        is_active: true,
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        id: uuidv4(),
        code: 'PHONE_UPDATED',
        name: 'Teléfono Actualizado',
        description: 'Registro interno cuando el usuario actualiza su número de teléfono',
        supports_push: false,
        supports_email: false,
        priority: 'low',
        title_template: 'Teléfono actualizado',
        body_template: 'Has actualizado tu número de teléfono exitosamente.',
        email_subject_template: null,
        email_body_template: null,
        is_active: true,
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        id: uuidv4(),
        code: 'PASSWORD_UPDATED',
        name: 'Contraseña Actualizada',
        description: 'Registro interno cuando el usuario cambia su propia contraseña',
        supports_push: false,
        supports_email: false,
        priority: 'low',
        title_template: 'Contraseña actualizada',
        body_template: 'Has actualizado tu contraseña exitosamente.',
        email_subject_template: null,
        email_body_template: null,
        is_active: true,
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        id: uuidv4(),
        code: 'NATIONAL_ID_UPDATED',
        name: 'RUT/ID Nacional Actualizado',
        description: 'Registro interno cuando el usuario actualiza su propio RUT/ID nacional',
        supports_push: false,
        supports_email: false,
        priority: 'low',
        title_template: 'RUT/ID nacional actualizado',
        body_template: 'Has actualizado tu RUT/ID nacional exitosamente.',
        email_subject_template: null,
        email_body_template: null,
        is_active: true,
        created_at: new Date(),
        updated_at: new Date(),
      },
    ];

    // Insertar solo los que no existen todavia
    const toInsert = allTypes.filter(t => !existingCodes.has(t.code));

    if (toInsert.length === 0) {
      console.log('⚠️  Todos los tipos ya existen, saltando seed...');
      return;
    }

    await queryInterface.bulkInsert(
      { tableName: 'notification_types', schema: SCHEMA },
      toInsert
    );

    console.log(`✅ ${toInsert.length} tipo(s) de notificacion auth/seguridad insertados:`, toInsert.map(t => t.code));
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete(
      { tableName: 'notification_types', schema: SCHEMA },
      {
        code: [
          'BIENVENIDA', 'PROFILE_COMPLETED', 'TOTP_ACTIVADO', 'TOTP_ELIMINADO',
          'RESET_MFA', 'SOLICITUD_RESET_MFA', 'SOLICITUD_RESET_PASSWORD',
          'RESET_PASSWORD', 'CODIGO_VERIFICACION', 'NUEVO_DISPOSITIVO_DETECTADO',
          'PROFILE_UPDATED', 'EMAIL_UPDATED', 'PHONE_UPDATED',
          'PASSWORD_UPDATED', 'NATIONAL_ID_UPDATED',
        ],
      },
      {}
    );
  },
};