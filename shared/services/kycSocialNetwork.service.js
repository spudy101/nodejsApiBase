'use strict';

const personSocialNetworkRepository = require('../repositories/personSocialNetwork.repository');
const AppError = require('../utils/appError.util');
const { logger } = require('../utils/logger.util');
const { sequelize } = require('../models');
const { SocialNetworkListDTO, AddSocialNetworkResponseDTO, DeleteSocialNetworkResponseDTO, UpdateSocialNetworkResponseDTO } = require('../dtos/personSocialNetwork.dto');

class KycSocialNetwork {

  /**
   * Obtiene solo las redes sociales del usuario
   */
  async getSocialNetworks(metadata) {
    const { userId, personId } = metadata;

    const socialNetworks = await personSocialNetworkRepository.findByPersonIdWithProvider(personId);

    logger.info('Social networks retrieved', { userId, count: socialNetworks.length });

    return new SocialNetworkListDTO(socialNetworks);
  }

  /**
   * Agrega una red social al perfil del usuario
   * ✅ CORREGIDO: Ahora usa transacción
   */
  async addSocialNetwork(data, metadata) {
    const { userId, personId } = metadata;
    const { social_network_provider_id, username_handle, profile_url } = data;

    const transaction = await sequelize.transaction();

    try {
      // Verificar si ya existe esta red social para el usuario
      const existing = await personSocialNetworkRepository.findByPersonAndProvider(
        personId,
        social_network_provider_id,
        { transaction }
      );

      if (existing) {
        throw AppError.conflict('Ya tienes esta red social agregada');
      }

      // Crear red social
      const socialNetwork = await personSocialNetworkRepository.create({
        person_id: personId,
        social_network_provider_id,
        username_handle,
        profile_url: profile_url || null,
        is_verified: false
      }, { transaction });

      await transaction.commit();

      // Obtener con el include del provider para el DTO (fuera de transacción, solo lectura)
      const socialNetworkWithProvider = await personSocialNetworkRepository.findById(
        socialNetwork.person_social_network_id,
        { include: [{ association: 'provider' }] }
      );

      logger.info('Social network added', { userId, providerId: social_network_provider_id });

      return new AddSocialNetworkResponseDTO(socialNetworkWithProvider);

    } catch (error) {
      await transaction.rollback();
      logger.error('Error adding social network', { userId, error: error.message });
      throw error;
    }
  }

  /**
   * Actualiza una red social existente
   * ✅ CORREGIDO: Ahora usa transacción
   */
  async updateSocialNetwork(data, metadata) {
    const { userId, personId } = metadata;
    const { person_social_network_id, username_handle, profile_url } = data;

    const transaction = await sequelize.transaction();

    try {
      const socialNetwork = await personSocialNetworkRepository.findById(
        person_social_network_id,
        { 
          include: [{ association: 'provider' }],
          transaction 
        }
      );

      if (!socialNetwork) {
        throw AppError.notFound('Red social no encontrada');
      }

      if (socialNetwork.person_id !== personId) {
        throw AppError.forbidden('No tienes permiso para actualizar esta red social');
      }

      const updated = await socialNetwork.update({
        username_handle: username_handle || socialNetwork.username_handle,
        profile_url: profile_url !== undefined ? profile_url : socialNetwork.profile_url
      }, { transaction });

      await transaction.commit();

      logger.info('Social network updated', { userId, socialNetworkId: person_social_network_id });

      return new UpdateSocialNetworkResponseDTO(updated);

    } catch (error) {
      await transaction.rollback();
      logger.error('Error updating social network', { userId, error: error.message });
      throw error;
    }
  }

  /**
   * Elimina una red social del perfil
   * ✅ Ya estaba bien, pero agregamos transacción para consistencia
   */
  async deleteSocialNetwork(data, metadata) {
    const { userId, personId } = metadata;
    const { person_social_network_id } = data;

    const transaction = await sequelize.transaction();

    try {
      const socialNetwork = await personSocialNetworkRepository.findById(
        person_social_network_id,
        { transaction }
      );

      if (!socialNetwork) {
        throw AppError.notFound('Red social no encontrada');
      }

      if (socialNetwork.person_id !== personId) {
        throw AppError.forbidden('No tienes permiso para eliminar esta red social');
      }

      await personSocialNetworkRepository.delete(person_social_network_id, { transaction });

      await transaction.commit();

      logger.info('Social network deleted', { userId, socialNetworkId: person_social_network_id });

      return new DeleteSocialNetworkResponseDTO(person_social_network_id);

    } catch (error) {
      await transaction.rollback();
      logger.error('Error deleting social network', { userId, error: error.message });
      throw error;
    }
  }

}

module.exports = new KycSocialNetwork();