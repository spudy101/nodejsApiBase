'use strict';

const axios = require('axios');
const { logger } = require('../../../shared/utils/logger.util');
const AppError = require('../../../shared/utils/appError.util');

/**
 * Utilidad para interactuar con la API de ZapSign
 */
class ZapSignUtil {
  constructor() {
    this.apiKey = process.env.ZAPSIGN_API_KEY;
    this.baseUrl = process.env.ZAPSIGN_BASE_URL;
    this.templateId = process.env.ZAPSIGN_TEMPLATE_ID;
    this.redirectUrlWeb = process.env.ZAPSIGN_REDIRECT_URL_WEB;
    this.redirectUrlMovil = process.env.ZAPSIGN_REDIRECT_URL_MOVIL;
  }

  /**
   * Crea un documento desde una plantilla en ZapSign
   * @param {string} fullName - Nombre completo del firmante
   * @param {string} nationalId - Número de documento de identidad
   * @returns {Promise<Object>} Datos del documento creado
   */
  async createDocumentFromTemplate(fullName, nationalId, email) {
    try {
      const templateData = {
        NOMBRE_COMPLETO: fullName,
        NUMERO_DOCUMENTO: nationalId || '',
        CORREO: email || '',
      };

      const dataArray = Object.entries(templateData).map(([key, value]) => ({
        de: `{{${key}}}`,
        para: String(value || ''),
      }));

      const payload = {
        template_id: this.templateId,
        signer_name: fullName,
        name: `Validación de identidad - ${fullName}`,
        email: email,
        data: dataArray,
        lang: 'es',
        disable_signer_emails: true,
        send_automatic_email: false,
      };

      logger.info('Creando documento en ZapSign', { fullName });

      const response = await axios.post(
        `${this.baseUrl}/models/create-doc/`,
        payload,
        {
          headers: {
            Authorization: `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json',
          },
        }
      );

      logger.info('Documento creado exitosamente en ZapSign', { 
        docToken: response.data.token 
      });

      return response.data;
    } catch (error) {
      logger.error('Error creando documento en ZapSign', {
        error: error.response?.data || error.message,
        fullName,
      });
      throw AppError.internal('Error al crear documento en ZapSign. Intenta nuevamente.');
    }
  }

  /**
   * Actualiza el firmante con configuración de validación biométrica
   * @param {string} signerToken - Token del firmante
   * @param {string} fullName - Nombre completo
   * @param {string} nationalId - Número de documento
   * @param {string} channel - Canal de origen (web o mobile)
   * @returns {Promise<Object>} Datos del firmante actualizado
   */
  async updateSignerWithBiometrics(signerToken, fullName, nationalId, channel = 'web', email) {
    try {
      const redirectUrl = channel === 'mobile' ? this.redirectUrlMovil : this.redirectUrlWeb;

      const payload = {
        name: fullName,
        email: email,
        qualification: 'Verifica que tu nombre coincida con tu cédula de identidad',
        lock_name: false,
        selfie_validation_type: 'identity-verification',
        require_document_photo: true,
        require_selfie_photo: true,
        auth_mode: 'assinaturaTela',
        redirect_link: redirectUrl,
        require_document_data: {
          document_country: 'cl', // Chile
          document_type: 'national_id',
          document_number: nationalId || '',
        },
      };

      logger.info('Actualizando firmante con validación biométrica', { 
        signerToken,
        channel 
      });

      const response = await axios.post(
        `${this.baseUrl}/signers/${signerToken}/`,
        payload,
        {
          headers: {
            Authorization: `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json',
          },
        }
      );

      logger.info('Firmante actualizado exitosamente', { 
        signerToken,
        signUrl: response.data.sign_url 
      });

      return response.data;
    } catch (error) {
      logger.error('Error actualizando firmante en ZapSign', {
        error: error.response?.data || error.message,
        signerToken,
      });
      throw AppError.internal('Error al configurar validación biométrica. Intenta nuevamente.');
    }
  }

  /**
   * Crea documento completo con validación biométrica
   * @param {string} fullName - Nombre completo
   * @param {string} nationalId - Número de documento
   * @param {string} channel - Canal (web o mobile)
   * @returns {Promise<Object>} Objeto con datos del documento y firmante
   */
  async createDocumentWithBiometrics(fullName, nationalId, channel = 'web', email) {
    // 1. Crear documento desde plantilla
    const docData = await this.createDocumentFromTemplate(fullName, nationalId, email);

    const signerToken = docData.signers?.[0]?.token;

    if (!signerToken) {
      logger.error('No se encontró el token del firmante', { docData });
      throw AppError.internal('Error en la configuración del documento');
    }

    // 2. Actualizar firmante con validación biométrica
    const updatedSigner = await this.updateSignerWithBiometrics(
      signerToken,
      fullName,
      nationalId,
      channel,
      email
    );

    // 3. Retornar datos completos
    return {
      token: docData.token,
      open_id: docData.open_id,
      status: docData.status,
      name: docData.name,
      original_file: docData.original_file,
      signed_file: docData.signed_file,
      signer: {
        token: updatedSigner.token,
        name: updatedSigner.name,
        sign_url: updatedSigner.sign_url,
        status: updatedSigner.status,
      },
    };
  }

  /**
   * Obtiene información de un documento
   * @param {string} docToken - Token del documento
   * @returns {Promise<Object>} Datos del documento
   */
  async getDocument(docToken) {
    try {
      const response = await axios.get(
        `${this.baseUrl}/docs/${docToken}/`,
        {
          headers: {
            Authorization: `Bearer ${this.apiKey}`,
          },
        }
      );

      return response.data;
    } catch (error) {
      logger.error('Error obteniendo documento de ZapSign', {
        error: error.response?.data || error.message,
        docToken,
      });
      throw AppError.internal('Error al obtener información del documento');
    }
  }

  /**
   * Obtiene información de un firmante
   * @param {string} signerToken - Token del firmante
   * @returns {Promise<Object>} Datos del firmante
   */
  async getSigner(signerToken) {
    try {
      const response = await axios.get(
        `${this.baseUrl}/signers/${signerToken}/`,
        {
          headers: {
            Authorization: `Bearer ${this.apiKey}`,
          },
        }
      );

      return response.data;
    } catch (error) {
      logger.error('Error obteniendo firmante de ZapSign', {
        error: error.response?.data || error.message,
        signerToken,
      });
      throw AppError.internal('Error al obtener información del firmante');
    }
  }

  /**
   * Cancela/rechaza un documento en ZapSign
   * @param {string} docToken - Token del documento
   * @param {string} reason - Motivo de cancelación
   * @param {boolean} notifySigner - Si notificar al firmante
   * @returns {Promise<Object>} Respuesta de ZapSign
   */
  async refuseDocument(docToken, reason, notifySigner = false) {
    try {
      const payload = {
        doc_token: docToken,
        rejected_reason: reason,
        notify_signer: notifySigner,
      };

      logger.info('Cancelando documento en ZapSign', { docToken, reason });

      const response = await axios.post(
        `${this.baseUrl}/refuse/`,
        payload,
        {
          headers: {
            Authorization: `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json',
          },
        }
      );

      logger.info('Documento cancelado exitosamente en ZapSign', { 
        docToken,
        message: response.data.message 
      });

      return response.data;
    } catch (error) {
      logger.error('Error cancelando documento en ZapSign', {
        error: error.response?.data || error.message,
        docToken,
      });
      throw AppError.internal('Error al cancelar documento en ZapSign');
    }
  }
}

module.exports = new ZapSignUtil();