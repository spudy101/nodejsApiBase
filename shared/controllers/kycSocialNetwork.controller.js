'use strict';

const KycSocialNetworkService = require('../services/kycSocialNetwork.service');
const ApiResponse = require('../utils/response.util');

class KycSocialNetworkController {
  /**
   * Get all social networks
   * GET /<admin>o<client>/api/kyc/social-networks
   */
  async getSocialNetworks(req, res, next) {
    try {
      const result = await KycSocialNetworkService.getSocialNetworks(req.user);
      return ApiResponse.success(res, 'Redes sociales obtenidas exitosamente', result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Add a new social network
   * POST /<admin>o<client>/api/kyc/social-networks
   */
  async addSocialNetwork(req, res, next) {
    try {
      const result = await KycSocialNetworkService.addSocialNetwork(req.body, req.user);
      return ApiResponse.success(res, 'Red social agregada exitosamente', result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update an existing social network
   * PUT /<admin>o<client>/api/kyc/social-networks
   */
  async updateSocialNetwork(req, res, next) {
    try {
      const result = await KycSocialNetworkService.updateSocialNetwork(req.body, req.user);
      return ApiResponse.success(res, 'Red social actualizada exitosamente', result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Delete a social network
   * DELETE /<admin>o<client>/api/kyc/social-networks
   */
  async deleteSocialNetwork(req, res, next) {
    try {
      await KycSocialNetworkService.deleteSocialNetwork(req.body, req.user);
      return ApiResponse.success(res, 'Red social eliminada exitosamente');
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new KycSocialNetworkController();