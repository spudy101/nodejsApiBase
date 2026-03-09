'use strict';

const BaseRepository = require('../../../shared/repositories/base.repository');
const { PersonContact } = require('../../../shared/models');

class PersonContactRepository extends BaseRepository {
  constructor() {
    super(PersonContact);
  }

  async findByEmail(email, options = {}) {
    return await this.findOne(
      { email },
      options
    );
  }

  async findByPhone(phone) {
    return await this.findOne({ phone_primary: phone });
  }

  async findByPersonId(personId) {
    return await this.findOne({ person_id: personId });
  }

  async markEmailVerified(personContactId, verifiedAt = new Date(), options = {}) {
    return await this._markVerified(personContactId, 'email_verified_at', verifiedAt, options);
  }

  async markPhoneVerified(personContactId, verifiedAt = new Date(), options = {}) {
    return await this._markVerified(personContactId, 'phone_primary_verified_at', verifiedAt, options);
  }

  // Override para usar person_contact_id
  async delete(personContactId) {
    return await this.model.destroy({ where: { person_contact_id: personContactId } });
  }

  // Override findById para usar person_contact_id
  async findById(personContactId, options = {}) {
    return await this.model.findByPk(personContactId, options);
  }

  // Método privado reutilizable
  async _markVerified(personContactId, field, verifiedAt, options) {
    return await this.update(personContactId, { [field]: verifiedAt }, options);
  }

  /**
   * Busca contacto por teléfono secundario
   */
  async findByPrimaryPhone(phone) {
    return await this.findOne({ phone_primary: phone });
  }

  /**
   * Busca contacto por teléfono secundario
   */
  async findBySecondaryPhone(phone) {
    return await this.findOne({ phone_secondary: phone });
  }

  /**
   * Busca contacto por person_id con todas las relaciones de prefijos telefónicos
   */
  async findByPersonIdWithPrefixes(personId) {
    return await this.findOne({ 
      person_id: personId 
    }, {
      include: [
        {
          association: 'phone_primary_prefix',
          attributes: ['phone_prefix_id', 'prefix']
        },
        {
          association: 'phone_secondary_prefix',
          attributes: ['phone_prefix_id', 'prefix']
        }
      ]
    });
  }

}

module.exports = new PersonContactRepository();