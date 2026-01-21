'use strict';

/**
 * DTO para respuesta de generación de URL de validación
 */
class GenerateUrlResponseDTO {
  constructor(validation, zapSignDoc) {
    this.validation = {
      id: validation.validation_id,
      status: validation.status,
      documentUrl: validation.document_url,
      initiatedAt: validation.initiated_at,
    };

    this.zapSign = {
      documentId: zapSignDoc.token,
      signerToken: zapSignDoc.signer.token,
      signUrl: zapSignDoc.signer.sign_url,
    };
  }
}

/**
 * DTO para respuesta de procesamiento de webhook
 */
class WebhookResponseDTO {
  constructor({ success, message, event_type, validation_id, previous_status, new_status }) {
    this.success = success;
    this.message = message;
    this.eventType = event_type;
    this.validationId = validation_id;

    if (previous_status) {
      this.previousStatus = previous_status;
    }

    if (new_status) {
      this.newStatus = new_status;
    }
  }
}

module.exports = {
  GenerateUrlResponseDTO,
  WebhookResponseDTO,
};