'use strict';

const BaseRepository = require('./base.repository');
const { Person } = require('../models');

class PersonRepository extends BaseRepository {
  constructor() {
    super(Person);
  }

  async findByNationalId(nationalId) {
    return await this.findOne({ national_id: nationalId });
  }

  async delete(personId) {
    return await this.model.destroy({ where: { person_id: personId } });
  }
}

module.exports = new PersonRepository();