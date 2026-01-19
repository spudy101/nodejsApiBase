'use strict';

const SESUtil = require('../../../shared/utils/ses.util');
const { logger } = require('../../../shared/utils/logger.util');

/**
 * Utility para envío de emails relacionados con operaciones de admin
 * ✨ NUEVO: Centraliza todos los templates de emails
 * 
 * Beneficios:
 * - Un solo lugar para mantener templates
 * - Estilos consistentes en todos los emails
 * - Fácil de testear y modificar
 */
class EmailUtil {

  /**
   * Envía email de bienvenida con contraseña temporal
   */
  static async sendWelcomeEmail(email, firstName, temporaryPassword) {
    const subject = 'Bienvenido a Democracia Líquida';
    
    const htmlBody = this._buildEmailTemplate({
      title: 'Bienvenido',
      greeting: `Hola ${firstName},`,
      mainMessage: 'Tu cuenta ha sido creada exitosamente por un administrador.',
      sections: [
        {
          type: 'info',
          title: 'Tus credenciales de acceso son:',
          content: `
            <strong>Email:</strong> ${email}<br>
            <strong>Contraseña temporal:</strong>
            <span style="background-color: #f4f4f4; padding: 8px 15px; border-radius: 3px; font-family: monospace; font-size: 18px; display: inline-block; margin-top: 5px;">
              ${temporaryPassword}
            </span>
          `
        },
        {
          type: 'warning',
          title: '⚠️ IMPORTANTE:',
          content: 'Por seguridad, te recomendamos cambiar tu contraseña cuando ingreses por primera vez.'
        }
      ]
    });

    const textBody = `
      Hola ${firstName},

      Tu cuenta ha sido creada exitosamente por un administrador.

      Tus credenciales de acceso son:
      - Email: ${email}
      - Contraseña temporal: ${temporaryPassword}

      IMPORTANTE: Por seguridad, te recomendamos cambiar tu contraseña cuando ingreses por primera vez.

      Saludos,
      Equipo de Democracia Líquida
    `;

    await SESUtil.enviarEmail(email, subject, htmlBody, textBody);
    logger.info('Welcome email sent', { email });
  }

  /**
   * Envía email con nueva contraseña después de reset
   */
  static async sendPasswordResetEmail(email, firstName, newPassword) {
    const subject = 'Contraseña Reseteada - Democracia Líquida';
    
    const htmlBody = this._buildEmailTemplate({
      title: 'Contraseña Reseteada',
      greeting: `Hola ${firstName},`,
      mainMessage: 'Tu contraseña ha sido reseteada por un administrador.',
      sections: [
        {
          type: 'info',
          title: 'Tu nueva contraseña temporal es:',
          content: `
            <span style="background-color: #f4f4f4; padding: 8px 15px; border-radius: 3px; font-family: monospace; font-size: 18px; display: inline-block;">
              ${newPassword}
            </span>
          `
        },
        {
          type: 'warning',
          title: '⚠️ IMPORTANTE:',
          content: 'Por seguridad, te recomendamos cambiar tu contraseña cuando ingreses.'
        }
      ]
    });

    const textBody = `
      Hola ${firstName},

      Tu contraseña ha sido reseteada por un administrador.

      Tu nueva contraseña temporal es: ${newPassword}

      IMPORTANTE: Por seguridad, te recomendamos cambiar tu contraseña cuando ingreses.

      Saludos,
      Equipo de Democracia Líquida
    `;

    await SESUtil.enviarEmail(email, subject, htmlBody, textBody);
    logger.info('Password reset email sent', { email });
  }

  /**
   * Envía email notificando desactivación de MFA
   */
  static async sendMFADisabledEmail(email, firstName) {
    const subject = 'MFA Desactivado - Democracia Líquida';
    
    const htmlBody = this._buildEmailTemplate({
      title: 'MFA Desactivado',
      greeting: `Hola ${firstName},`,
      mainMessage: 'Te informamos que la autenticación de dos factores (MFA) ha sido desactivada en tu cuenta por un administrador.',
      sections: [
        {
          type: 'danger',
          title: '⚠️ ATENCIÓN:',
          content: 'Si tú no solicitaste este cambio, por favor contacta inmediatamente con soporte.'
        }
      ]
    });

    const textBody = `
      Hola ${firstName},

      Te informamos que la autenticación de dos factores (MFA) ha sido desactivada en tu cuenta por un administrador.

      Si tú no solicitaste este cambio, por favor contacta inmediatamente con soporte.

      Saludos,
      Equipo de Democracia Líquida
    `;

    await SESUtil.enviarEmail(email, subject, htmlBody, textBody);
    logger.info('MFA disabled email sent', { email });
  }

  /**
   * Envía email notificando cambio de email (al email antiguo)
   */
  static async sendEmailChangeNotification(oldEmail, firstName, newEmail) {
    const subject = 'Cambio de Email en tu Cuenta - Democracia Líquida';
    
    const htmlBody = this._buildEmailTemplate({
      title: 'Cambio de Email',
      greeting: `Hola ${firstName},`,
      mainMessage: 'Te informamos que el email asociado a tu cuenta ha sido actualizado por un administrador.',
      sections: [
        {
          type: 'info',
          title: 'Información del cambio:',
          content: `
            <strong>Email anterior:</strong> ${oldEmail}<br>
            <strong>Email nuevo:</strong> ${newEmail}
          `
        },
        {
          type: 'warning',
          title: '⚠️ IMPORTANTE:',
          content: `Este email (${oldEmail}) ya no estará asociado a tu cuenta. A partir de ahora deberás usar ${newEmail} para acceder.`
        },
        {
          type: 'danger',
          title: '¿No reconoces este cambio?',
          content: 'Si tú no solicitaste este cambio, por favor contacta inmediatamente con soporte.'
        }
      ]
    });

    const textBody = `
      Hola ${firstName},

      Te informamos que el email asociado a tu cuenta ha sido actualizado por un administrador.

      Información del cambio:
      - Email anterior: ${oldEmail}
      - Email nuevo: ${newEmail}

      IMPORTANTE: Este email (${oldEmail}) ya no estará asociado a tu cuenta. A partir de ahora deberás usar ${newEmail} para acceder.

      ¿No reconoces este cambio? Si tú no solicitaste este cambio, por favor contacta inmediatamente con soporte.

      Saludos,
      Equipo de Democracia Líquida
    `;

    await SESUtil.enviarEmail(oldEmail, subject, htmlBody, textBody);
    logger.info('Email change notification sent to old email', { oldEmail, newEmail });
  }

  /**
   * Envía email de confirmación de cambio de email (al email nuevo)
   */
  static async sendEmailChangeConfirmation(newEmail, firstName) {
    const subject = 'Email Actualizado Exitosamente - Democracia Líquida';
    
    const htmlBody = this._buildEmailTemplate({
      title: 'Email Actualizado',
      greeting: `Hola ${firstName},`,
      mainMessage: 'Te confirmamos que este email ha sido asociado exitosamente a tu cuenta por un administrador.',
      sections: [
        {
          type: 'success',
          title: '✅ Confirmación:',
          content: `
            Tu cuenta de Democracia Líquida ahora está asociada a este email: <strong>${newEmail}</strong>
          `
        },
        {
          type: 'info',
          title: 'A partir de ahora:',
          content: 'Usa este email para iniciar sesión y recibir todas las notificaciones de tu cuenta.'
        },
        {
          type: 'warning',
          title: '⚠️ ¿No reconoces este cambio?',
          content: 'Si tú no solicitaste este cambio, por favor contacta inmediatamente con soporte.'
        }
      ]
    });

    const textBody = `
      Hola ${firstName},

      Te confirmamos que este email ha sido asociado exitosamente a tu cuenta por un administrador.

      Confirmación:
      Tu cuenta de Democracia Líquida ahora está asociada a este email: ${newEmail}

      A partir de ahora:
      Usa este email para iniciar sesión y recibir todas las notificaciones de tu cuenta.

      ¿No reconoces este cambio? Si tú no solicitaste este cambio, por favor contacta inmediatamente con soporte.

      Saludos,
      Equipo de Democracia Líquida
    `;

    await SESUtil.enviarEmail(newEmail, subject, htmlBody, textBody);
    logger.info('Email change confirmation sent to new email', { newEmail });
  }

  /**
   * Envía email notificando cambio de national_id (SIN contraseña temporal)
   */
  static async sendNationalIdChangedEmail(email, firstName, oldNationalId, newNationalId) {
    const subject = 'National ID Actualizado - Democracia Líquida';
    
    const htmlBody = this._buildEmailTemplate({
      title: 'National ID Actualizado',
      greeting: `Hola ${firstName},`,
      mainMessage: 'Tu identificación nacional (National ID) ha sido actualizada por un administrador.',
      sections: [
        {
          type: 'info',
          title: 'Cambios realizados:',
          content: `
            <strong>National ID anterior:</strong> ${oldNationalId}<br>
            <strong>National ID nuevo:</strong> ${newNationalId}
          `
        },
        {
          type: 'success',
          title: 'Inicio de sesión:',
          content: `A partir de ahora, debes usar tu nuevo National ID (<strong>${newNationalId}</strong>) para iniciar sesión en el sistema.`
        },
        {
          type: 'warning',
          title: '⚠️ ¿No reconoces este cambio?',
          content: 'Si tú no solicitaste este cambio, por favor contacta inmediatamente con soporte.'
        }
      ]
    });

    const textBody = `
      Hola ${firstName},

      Tu identificación nacional (National ID) ha sido actualizada por un administrador.

      Cambios realizados:
      - National ID anterior: ${oldNationalId}
      - National ID nuevo: ${newNationalId}

      Inicio de sesión:
      A partir de ahora, debes usar tu nuevo National ID (${newNationalId}) para iniciar sesión en el sistema.

      ¿No reconoces este cambio? Si tú no solicitaste este cambio, por favor contacta inmediatamente con soporte.

      Saludos,
      Equipo de Democracia Líquida
    `;

    await SESUtil.enviarEmail(email, subject, htmlBody, textBody);
    logger.info('National ID changed email sent', { email });
  }

  /**
   * Envía email notificando eliminación de cuenta por administrador
   */
  static async sendAccountDeletionEmail(email, firstName) {
    const subject = 'Cuenta Eliminada - Democracia Líquida';
    
    const htmlBody = this._buildEmailTemplate({
      title: 'Cuenta Eliminada',
      greeting: `Hola ${firstName},`,
      mainMessage: 'Te informamos que tu cuenta en Democracia Líquida ha sido eliminada por un administrador.',
      sections: [
        {
          type: 'danger',
          title: 'ℹ️ Información importante:',
          content: 'Tu información personal ha sido marcada como eliminada y ya no podrás acceder a tu cuenta.'
        },
        {
          type: 'warning',
          title: '⚠️ ¿No reconoces esta acción?',
          content: 'Si consideras que esta eliminación fue un error o no la solicitaste, por favor contacta inmediatamente con nuestro equipo de soporte.'
        }
      ]
    });

    const textBody = `
      Hola ${firstName},

      Te informamos que tu cuenta en Democracia Líquida ha sido eliminada por un administrador.

      Tu información personal ha sido marcada como eliminada y ya no podrás acceder a tu cuenta.

      Si consideras que esta eliminación fue un error o no la solicitaste, por favor contacta inmediatamente con nuestro equipo de soporte.

      Saludos,
      Equipo de Democracia Líquida
    `;

    await SESUtil.enviarEmail(email, subject, htmlBody, textBody);
    logger.info('Account deletion by admin email sent', { email });
  }

  // ==================== MÉTODOS PRIVADOS - TEMPLATES ====================

  /**
   * Construye un email HTML con template consistente
   * @private
   */
  static _buildEmailTemplate({ title, greeting, mainMessage, sections = [] }) {
    const sectionsHtml = sections.map(section => this._buildSection(section)).join('\n');

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
      </head>
      <body style="font-family: Arial, sans-serif; padding: 20px; background-color: #f5f5f5;">
        <div style="max-width: 600px; margin: 0 auto; background-color: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          <h2 style="color: #333; margin-bottom: 20px;">${greeting}</h2>
          
          <p style="color: #555; line-height: 1.6;">
            ${mainMessage}
          </p>
          
          ${sectionsHtml}
          
          <p style="color: #555; line-height: 1.6; margin-top: 30px;">
            Saludos,<br>
            <strong>Equipo de Democracia Líquida</strong>
          </p>
        </div>
      </body>
      </html>
    `;
  }

  /**
   * Construye una sección del email según su tipo
   * @private
   */
  static _buildSection(section) {
    const styles = {
      info: {
        bg: '#e7f3ff',
        border: '#007bff',
        text: '#004085'
      },
      warning: {
        bg: '#fff3cd',
        border: '#ffc107',
        text: '#856404'
      },
      danger: {
        bg: '#f8d7da',
        border: '#dc3545',
        text: '#721c24'
      },
      success: {
        bg: '#d4edda',
        border: '#28a745',
        text: '#155724'
      }
    };

    const style = styles[section.type] || styles.info;

    return `
      <div style="background-color: ${style.bg}; border-left: 4px solid ${style.border}; padding: 15px; margin: 20px 0;">
        <p style="margin: 0; color: ${style.text}; font-weight: bold;">${section.title}</p>
        <p style="margin: 10px 0 0 0; color: ${style.text};">
          ${section.content}
        </p>
      </div>
    `;
  }
}

module.exports = EmailUtil;