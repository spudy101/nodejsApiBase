'use strict';

const BaseRepository = require('./base.repository');
const { PersonSocialNetwork } = require('../models');

class PersonSocialNetworkRepository extends BaseRepository {
  constructor() {
    super(PersonSocialNetwork);
  }

  /**
   * Busca todas las redes sociales de una persona
   */
  async findByPersonId(personId) {
    return await this.findAll(
      { person_id: personId },
      {
        include: [{ association: 'provider' }],
        order: [['created_at', 'DESC']]
      }
    );
  }

  /**
   * Busca red social específica por persona y proveedor
   */
  async findByPersonAndProvider(personId, socialNetworkProviderId) {
    return await this.findOne({
      person_id: personId,
      social_network_provider_id: socialNetworkProviderId
    });
  }

  /**
   * Verifica si un username ya está en uso para un proveedor
   */
  async existsByUsernameAndProvider(usernameHandle, socialNetworkProviderId, excludePersonId = null) {
    const criteria = {
      username_handle: usernameHandle,
      social_network_provider_id: socialNetworkProviderId
    };

    if (excludePersonId) {
      criteria.person_id = { [require('sequelize').Op.ne]: excludePersonId };
    }

    return await this.exists(criteria);
  }

  /**
   * Marca una red social como verificada
   */
  async markAsVerified(personSocialNetworkId, options = {}) {
    return await this.update(personSocialNetworkId, { is_verified: true }, options);
  }

  // Override para usar person_social_network_id
  async findById(personSocialNetworkId, options = {}) {
    return await this.model.findByPk(personSocialNetworkId, options);
  }

  // Override delete para usar person_social_network_id
  async delete(personSocialNetworkId) {
    return await this.model.destroy({ where: { person_social_network_id: personSocialNetworkId } });
  }

  /**
   * Busca todas las redes sociales de una persona con información completa del proveedor
   */
  async findByPersonIdWithProvider(personId) {
    return await this.findAll(
      { person_id: personId },
      {
        include: [
          {
            association: 'provider',
            attributes: [
              'social_network_provider_id',
              'name',
              'icon_url',
              'base_url',
              'is_active'
            ]
          }
        ],
        order: [['created_at', 'DESC']]
      }
    );
  }
}

module.exports = new PersonSocialNetworkRepository();