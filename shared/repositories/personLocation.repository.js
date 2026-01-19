'use strict';

const BaseRepository = require('./base.repository');
const { PersonLocation } = require('../models');

class PersonLocationRepository extends BaseRepository {
  constructor() {
    super(PersonLocation);
  }

  /**
   * Busca ubicación por person_id con todas las relaciones
   */
  async findByPersonId(personId) {
    return await this.findOne({ 
      person_id: personId 
    }, {
      include: [
        { association: 'country' },
        { association: 'city' },
        { association: 'department' }
      ]
    });
  }

  /**
   * Busca ubicación por person_id sin relaciones (para operaciones que no las necesitan)
   */
  async findByPersonIdMinimal(personId) {
    return await this.findOne({ person_id: personId });
  }

  /**
   * Crea o actualiza ubicación de persona
   */
  async upsertByPersonId(personId, locationData, options = {}) {
    const existing = await this.findByPersonIdMinimal(personId);

    if (existing) {
      return await existing.update(locationData, options);
    }

    return await this.create({
      person_id: personId,
      ...locationData
    }, options);
  }

  // Override para usar person_location_id con relaciones
  async findById(personLocationId, options = {}) {
    const defaultOptions = {
      include: [
        { association: 'country' },
        { association: 'city' },
        { association: 'department' }
      ]
    };
    
    return await this.model.findByPk(personLocationId, { ...defaultOptions, ...options });
  }

  // Override delete para usar person_location_id
  async delete(personLocationId) {
    return await this.model.destroy({ where: { person_location_id: personLocationId } });
  }
}

module.exports = new PersonLocationRepository();