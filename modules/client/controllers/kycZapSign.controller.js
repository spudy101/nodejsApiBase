'use strict';

const KycZapSignService = require('../services/kycZapSign.service');
const ApiResponse = require('../../../shared/utils/response.util');
const { AppError } = require('../../../shared/utils/appError.util');

class KycZapSignController {
  /**
   * Generate validation URL
   * POST /client/api/kyc/zapsign/generate-url
   * @access Protected (authenticated users)
   */
  async generateUrl(req, res, next) {
    try {
      const metadata = {
        personId: req.user.personId,
        userId: req.user.userId,
      };

      const result = await KycZapSignService.generateValidationUrl(req.body, metadata);

      return ApiResponse.success(res, 'URL de validación generada exitosamente', result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Process webhook from ZapSign
   * POST /client/api/kyc/zapsign/webhook
   * @access Public (external service with API Key)
   */
  async processWebhook(req, res, next) {
    try {

      const result = await KycZapSignService.processWebhook(req.body);

      return ApiResponse.success(res, 'Webhook procesado exitosamente', result);
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new KycZapSignController();