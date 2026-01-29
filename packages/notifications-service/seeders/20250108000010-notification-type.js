'use strict';
const { v4: uuidv4 } = require('uuid');
const { ses } = require('../src/config');

const SCHEMA = 'notifications';

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
      // ========================================
      // NOTIFICACIONES DE BIENVENIDA Y REGISTRO
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
                <img src="${ses.logoUrl}" alt="Logo" style="width: 150px; margin-bottom: 20px;">
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
        id: uuidv4(),
        code: 'PROFILE_COMPLETED',
        name: 'Perfil Completado',
        description: 'Notificación cuando un usuario completa su perfil',
        supports_push: true,
        supports_email: false, // Solo in-app, no necesita email
        priority: 'normal',
        title_template: '¡Perfil completado!',
        body_template: 'Has completado tu perfil exitosamente. Ahora tienes acceso completo a todas las funcionalidades.',
        email_subject_template: null,
        email_body_template: null,
        is_active: true,
        created_at: new Date(),
        updated_at: new Date()
      },

      // ========================================
      // SEGURIDAD - MFA Y AUTENTICACIÓN
      // ========================================
      {
        id: uuidv4(),
        code: 'TOTP_ACTIVADO',
        name: 'TOTP Activado',
        description: 'Notifica que el usuario activó correctamente el TOTP (MFA)',
        supports_push: false,
        supports_email: true,
        priority: 'high',
        title_template: '¡Seguridad activada!',
        body_template: 'Tu autenticación de dos factores (TOTP) fue activada correctamente.',
        email_subject_template: 'TOTP activado correctamente',
        email_body_template: `
          <html>
            <body style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px;">
              <div style="text-align: center;">
                <img src="${ses.logoUrl}" alt="Logo" style="width: 150px; margin-bottom: 20px;">
                <h2 style="color: #28a745;">🔐 ¡Seguridad activada!</h2>
              </div>
              <div style="font-size: 16px; color: #333; line-height: 1.6; margin: 20px 0;">
                <p>Hola,</p>
                <p>
                  ¡Felicitaciones! Has activado correctamente la
                  <strong>autenticación de dos factores (TOTP)</strong> en tu cuenta.
                </p>
                <p>
                  A partir de ahora, tu cuenta cuenta con una capa adicional de seguridad.
                </p>
              </div>
              <div style="font-size: 12px; color: #555; margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; text-align: center;">
                <p>Si no realizaste esta acción, contacta soporte de inmediato.</p>
              </div>
            </body>
          </html>
        `,
        is_active: true,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: uuidv4(),
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
                <img src="${ses.logoUrl}" alt="Logo" style="width: 150px; margin-bottom: 20px;">
                <h2 style="color: #dc3545;">⚠️ Advertencia de seguridad</h2>
              </div>
              <div style="font-size: 16px; color: #333; line-height: 1.6; margin: 20px 0;">
                <p>Hola,</p>
                <p>
                  Te informamos que la <strong>autenticación de dos factores (TOTP)</strong>
                  fue eliminada de tu cuenta.
                </p>
                <p>
                  Si <strong>no realizaste esta acción</strong>, contacta a soporte inmediatamente.
                </p>
              </div>
            </body>
          </html>
        `,
        is_active: true,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: uuidv4(),
        code: 'RESET_MFA',
        name: 'MFA Reiniciado',
        description: 'Notifica al usuario que todos sus métodos MFA fueron reiniciados',
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
                <img src="${ses.logoUrl}" alt="Logo" style="width: 150px; margin-bottom: 20px;">
                <h2 style="color: #dc3545;">🔐 Aviso de seguridad</h2>
              </div>
              <div style="font-size: 16px; color: #333; line-height: 1.6; margin: 20px 0;">
                <p>Hola,</p>
                <p>
                  Te informamos que <strong>todos los métodos de autenticación multifactor (MFA)</strong>
                  asociados a tu cuenta fueron reiniciados.
                </p>
                <p>
                  Si <strong>no realizaste esta acción</strong>, contacta a soporte de inmediato.
                </p>
              </div>
            </body>
          </html>
        `,
        is_active: true,
        created_at: new Date(),
        updated_at: new Date()
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
                <img src="${ses.logoUrl}" alt="Logo" style="width: 150px; margin-bottom: 20px;">
                <h2 style="color: #dc3545;">🔓 Desactivación de MFA</h2>
              </div>
              <div style="font-size: 16px; color: #333; line-height: 1.6; margin: 20px 0;">
                <p>Hola <strong>{{nombre}}</strong>,</p>
                <p>
                  Has solicitado desactivar tu autenticación de dos factores (MFA). 
                </p>
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
        updated_at: new Date()
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
                <img src="${ses.logoUrl}" alt="Logo" style="width: 150px; margin-bottom: 20px;">
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
        updated_at: new Date()
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
                <img src="${ses.logoUrl}" alt="Logo" style="width: 150px; margin-bottom: 20px;">
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
        updated_at: new Date()
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
              <img src="${ses.logoUrl}" alt="Logo" style="width: 150px; margin-bottom: 20px;">
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
        updated_at: new Date()
      },

      // ========================================
      // VALIDACIÓN DE IDENTIDAD - ZAPSIGN
      // ========================================
      {
        id: uuidv4(),
        code: 'ZAPSIGN_LINK_GENERATED',
        name: 'Link ZapSign Generado',
        description: 'Notifica que el link de ZapSign para validación fue generado',
        supports_push: false,
        supports_email: true,
        priority: 'high',
        title_template: 'Link de validación generado',
        body_template: 'Tu link de ZapSign para validación de identidad ha sido generado.',
        email_subject_template: 'Valida tu identidad - Link ZapSign',
        email_body_template: `
          <html>
            <body style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px;">
              <div style="text-align: center;">
                <img src="${ses.logoUrl}" alt="Logo" style="width: 150px; margin-bottom: 20px;">
                <h2 style="color: #0d6efd;">🔗 Link de validación generado</h2>
              </div>
              <div style="font-size: 16px; color: #333; line-height: 1.6; margin: 20px 0;">
                <p>Hola <strong>{{nombre}}</strong>,</p>
                <p>Tu link de <strong>ZapSign</strong> para la validación de identidad ha sido generado.</p>
                <div style="text-align: center; margin: 30px 0;">
                  <a href="{{linkZapSign}}" 
                    style="display: inline-block; background-color: #0d6efd; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-weight: bold;">
                    Validar mi identidad
                  </a>
                </div>
                <div style="background-color: #fff3cd; padding: 15px; margin: 20px 0; border-radius: 4px;">
                  <p style="margin: 0; color: #856404;">
                    <strong>⏱️ Importante:</strong> Este enlace expirará en <strong>{{tiempoLimite}} minutos</strong>.
                  </p>
                </div>
              </div>
            </body>
          </html>
        `,
        is_active: true,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: uuidv4(),
        code: 'IDENTITY_VERIFIED',
        name: 'Identidad Verificada',
        description: 'Notifica que su identidad fue verificada exitosamente',
        supports_push: true,
        supports_email: true,
        priority: 'high',
        title_template: 'Identidad verificada',
        body_template: '¡Tu identidad ha sido verificada correctamente!',
        email_subject_template: 'Verificación de identidad exitosa',
        email_body_template: `
          <html>
            <body style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px;">
              <div style="text-align: center;">
                <img src="${ses.logoUrl}" alt="Logo" style="width: 150px; margin-bottom: 20px;">
                <h2 style="color: #198754;">✅ Identidad verificada</h2>
              </div>
              <div style="font-size: 16px; color: #333; line-height: 1.6; margin: 20px 0;">
                <p>Hola <strong>{{nombre}}</strong>,</p>
                <p>¡Excelentes noticias! Tu <strong>identidad ha sido verificada correctamente</strong>.</p>
                <p>Ya puedes continuar con el proceso sin problemas.</p>
              </div>
            </body>
          </html>
        `,
        is_active: true,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: uuidv4(),
        code: 'IDENTITY_VALIDATION_FAILED',
        name: 'Validación de Identidad Fallida',
        description: 'Notifica que su validación biométrica de identidad falló',
        supports_push: true,
        supports_email: true,
        priority: 'high',
        title_template: 'Validación de identidad fallida',
        body_template: 'Tu validación de identidad no pudo ser completada. Intenta nuevamente.',
        email_subject_template: 'Validación de identidad fallida',
        email_body_template: `
          <html>
            <body style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px;">
              <div style="text-align: center;">
                <img src="${ses.logoUrl}" alt="Logo" style="width: 150px; margin-bottom: 20px;">
                <h2 style="color: #dc3545;">⚠️ Validación fallida</h2>
              </div>
              <div style="font-size: 16px; color: #333; line-height: 1.6; margin: 20px 0;">
                <p>Hola <strong>{{nombre}}</strong>,</p>
                <p>Tu <strong>validación de identidad</strong> no pudo ser completada exitosamente.</p>
                <p><strong>Posibles causas:</strong> Imagen borrosa, reconocimiento facial no coincide, datos ilegibles.</p>
                <p>Te recomendamos intentar nuevamente con buena iluminación.</p>
              </div>
            </body>
          </html>
        `,
        is_active: true,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: uuidv4(),
        code: 'ZAPSIGN_LINK_EXPIRED',
        name: 'Link ZapSign Expirado',
        description: 'Notifica que su link de ZapSign expiró',
        supports_push: true,
        supports_email: false, // Solo in-app
        priority: 'normal',
        title_template: 'Link de validación expirado',
        body_template: 'Tu link de validación ha expirado. Solicita uno nuevo.',
        email_subject_template: null,
        email_body_template: null,
        is_active: true,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: uuidv4(),
        code: 'ZAPSIGN_CONTRACT_DELETED',
        name: 'Contrato ZapSign Eliminado',
        description: 'Notifica que su contrato de ZapSign fue eliminado',
        supports_push: true,
        supports_email: false, // Solo in-app
        priority: 'normal',
        title_template: 'Proceso de validación cancelado',
        body_template: 'Tu proceso de validación fue cancelado.',
        email_subject_template: null,
        email_body_template: null,
        is_active: true,
        created_at: new Date(),
        updated_at: new Date()
      },

      // ========================================
      // DOCUMENTOS LABORALES (NUEVAS)
      // ========================================
      {
        id: uuidv4(),
        code: 'DOCUMENTOS_LABORALES_SUBIDOS',
        name: 'Documentos Laborales Subidos',
        description: 'Notifica que los documentos laborales fueron subidos exitosamente',
        supports_push: true,
        supports_email: false, // Solo in-app
        priority: 'normal',
        title_template: 'Documentos subidos exitosamente',
        body_template: 'Tus documentos laborales han sido subidos correctamente y están en revisión.',
        email_subject_template: null,
        email_body_template: null,
        is_active: true,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: uuidv4(),
        code: 'DOCUMENTOS_LABORALES_ACEPTADOS',
        name: 'Documentos Laborales Aceptados',
        description: 'Notifica que los documentos laborales fueron aceptados',
        supports_push: true,
        supports_email: true,
        priority: 'high',
        title_template: 'Documentos aceptados',
        body_template: '¡Tus documentos laborales han sido aceptados!',
        email_subject_template: 'Documentos Laborales Aceptados',
        email_body_template: `
          <html>
            <body style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px;">
              <div style="text-align: center;">
                <img src="${ses.logoUrl}" alt="Logo" style="width: 150px; margin-bottom: 20px;">
                <h2 style="color: #198754;">✅ Documentos Aceptados</h2>
              </div>
              <div style="font-size: 16px; color: #333; line-height: 1.6; margin: 20px 0;">
                <p>Hola <strong>{{nombre}}</strong>,</p>
                <p>¡Excelentes noticias! Tus <strong>documentos laborales han sido aceptados</strong>.</p>
                <p>Ya puedes continuar con el siguiente paso del proceso.</p>
              </div>
            </body>
          </html>
        `,
        is_active: true,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: uuidv4(),
        code: 'DOCUMENTOS_LABORALES_RECHAZADOS',
        name: 'Documentos Laborales Rechazados',
        description: 'Notifica que los documentos laborales fueron rechazados',
        supports_push: true,
        supports_email: true,
        priority: 'high',
        title_template: 'Documentos rechazados',
        body_template: 'Tus documentos laborales fueron rechazados. Revisa los comentarios y vuelve a subirlos.',
        email_subject_template: 'Documentos Laborales Rechazados',
        email_body_template: `
          <html>
            <body style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px;">
              <div style="text-align: center;">
                <img src="${ses.logoUrl}" alt="Logo" style="width: 150px; margin-bottom: 20px;">
                <h2 style="color: #dc3545;">❌ Documentos Rechazados</h2>
              </div>
              <div style="font-size: 16px; color: #333; line-height: 1.6; margin: 20px 0;">
                <p>Hola <strong>{{nombre}}</strong>,</p>
                <p>Lamentamos informarte que tus <strong>documentos laborales fueron rechazados</strong>.</p>
                <div style="background-color: #fff3cd; padding: 15px; margin: 20px 0; border-radius: 4px;">
                  <p style="margin: 0; color: #856404;">
                    <strong>Motivo:</strong> {{motivo_rechazo}}
                  </p>
                </div>
                <p>Por favor, revisa los comentarios y vuelve a subir tus documentos corregidos.</p>
              </div>
            </body>
          </html>
        `,
        is_active: true,
        created_at: new Date(),
        updated_at: new Date()
      },

      // ========================================
      // SCREENING Y REVISIÓN (NUEVA)
      // ========================================
      {
        id: uuidv4(),
        code: 'PERFIL_BAJO_REVISION_SCREENING',
        name: 'Perfil Bajo Revisión por Screening',
        description: 'Notifica que el perfil está bajo revisión por temas de screening',
        supports_push: true,
        supports_email: true,
        priority: 'high',
        title_template: 'Perfil bajo revisión',
        body_template: 'Tu perfil está siendo revisado por nuestro equipo de seguridad. Te notificaremos una vez completado el proceso.',
        email_subject_template: 'Perfil en Revisión - Proceso de Seguridad',
        email_body_template: `
          <html>
            <body style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px;">
              <div style="text-align: center;">
                <img src="${ses.logoUrl}" alt="Logo" style="width: 150px; margin-bottom: 20px;">
                <h2 style="color: #ffc107;">⚠️ Perfil Bajo Revisión</h2>
              </div>
              <div style="font-size: 16px; color: #333; line-height: 1.6; margin: 20px 0;">
                <p>Hola <strong>{{nombre}}</strong>,</p>
                <p>
                  Tu perfil se encuentra actualmente <strong>bajo revisión</strong> por nuestro equipo de seguridad 
                  como parte de nuestro proceso de screening estándar.
                </p>
                <div style="background-color: #d1ecf1; padding: 15px; margin: 20px 0; border-radius: 4px;">
                  <p style="margin: 0; color: #055160;">
                    <strong>¿Qué significa esto?</strong><br>
                    Este es un proceso de seguridad rutinario. Te notificaremos una vez que la revisión esté completa.
                  </p>
                </div>
                <p>
                  Si tienes alguna pregunta o inquietud, no dudes en contactar a nuestro equipo de soporte.
                </p>
              </div>
            </body>
          </html>
        `,
        is_active: true,
        created_at: new Date(),
        updated_at: new Date()
      },

      // ========================================
      // CAMBIOS ADMINISTRATIVOS
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
                <img src="${ses.logoUrl}" alt="Logo" style="width: 150px; margin-bottom: 20px;">
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
        updated_at: new Date()
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
                <img src="${ses.logoUrl}" alt="Logo" style="width: 150px; margin-bottom: 20px;">
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
        updated_at: new Date()
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
                <img src="${ses.logoUrl}" alt="Logo" style="width: 150px; margin-bottom: 20px;">
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
        updated_at: new Date()
      },

      // ========================================
      // NOTIFICACIÓN GENERAL (COMODÍN)
      // ========================================
      {
        id: uuidv4(),
        code: 'NOTIFICACION_GENERAL',
        name: 'Notificación General',
        description: 'Notificación genérica para diferentes eventos del sistema',
        supports_push: true,
        supports_email: false, // Solo in-app por defecto
        priority: 'normal',
        title_template: '{{titulo}}',
        body_template: '{{contenido}}',
        email_subject_template: null,
        email_body_template: null,
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