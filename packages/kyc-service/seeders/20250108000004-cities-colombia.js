// seeders/20250108000004-cities-colombia.js
'use strict';
const { v4: uuidv4 } = require('uuid');

const SCHEMA = 'kyc';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Obtener departamentos
    const departments = await queryInterface.sequelize.query(
      `SELECT d.id, d.name 
       FROM "${SCHEMA}"."departments" d
       INNER JOIN "${SCHEMA}"."countries" c ON d.country_id = c.id
       WHERE c.code = 'COL'`,
      { type: Sequelize.QueryTypes.SELECT }
    );

    if (departments.length === 0) {
      console.log('⚠️  Departamentos de Colombia no encontrados, ejecuta primero el seeder de departamentos');
      return;
    }

    const departmentMap = {};
    departments.forEach(d => departmentMap[d.name] = d.id);

    const existingCities = await queryInterface.sequelize.query(
      `SELECT COUNT(*) as count FROM "${SCHEMA}"."cities" WHERE department_id IN (:ids)`,
      {
        replacements: { ids: departments.map(d => d.id) },
        type: Sequelize.QueryTypes.SELECT
      }
    );

    if (existingCities[0].count > 0) {
      console.log('⚠️  Las ciudades de Colombia ya existen, saltando seed...');
      return;
    }

    // Ciudades principales por departamento
    const cities = [
      // Antioquia
      { name: 'Medellín', department: 'Antioquia' },
      { name: 'Bello', department: 'Antioquia' },
      { name: 'Itagüí', department: 'Antioquia' },
      { name: 'Envigado', department: 'Antioquia' },
      { name: 'Rionegro', department: 'Antioquia' },
      
      // Atlántico
      { name: 'Barranquilla', department: 'Atlántico' },
      { name: 'Soledad', department: 'Atlántico' },
      { name: 'Malambo', department: 'Atlántico' },
      
      // Bolívar
      { name: 'Cartagena', department: 'Bolívar' },
      { name: 'Magangué', department: 'Bolívar' },
      
      // Boyacá
      { name: 'Tunja', department: 'Boyacá' },
      { name: 'Duitama', department: 'Boyacá' },
      { name: 'Sogamoso', department: 'Boyacá' },
      
      // Caldas
      { name: 'Manizales', department: 'Caldas' },
      { name: 'Villamaría', department: 'Caldas' },
      
      // Caquetá
      { name: 'Florencia', department: 'Caquetá' },
      
      // Cauca
      { name: 'Popayán', department: 'Cauca' },
      { name: 'Santander de Quilichao', department: 'Cauca' },
      
      // Cesar
      { name: 'Valledupar', department: 'Cesar' },
      { name: 'Aguachica', department: 'Cesar' },
      
      // Córdoba
      { name: 'Montería', department: 'Córdoba' },
      { name: 'Cereté', department: 'Córdoba' },
      
      // Cundinamarca
      { name: 'Soacha', department: 'Cundinamarca' },
      { name: 'Facatativá', department: 'Cundinamarca' },
      { name: 'Zipaquirá', department: 'Cundinamarca' },
      { name: 'Chía', department: 'Cundinamarca' },
      { name: 'Mosquera', department: 'Cundinamarca' },
      { name: 'Fusagasugá', department: 'Cundinamarca' },
      
      // Bogotá D.C.
      { name: 'Bogotá', department: 'Bogotá D.C.' },
      
      // Huila
      { name: 'Neiva', department: 'Huila' },
      { name: 'Pitalito', department: 'Huila' },
      
      // La Guajira
      { name: 'Riohacha', department: 'La Guajira' },
      { name: 'Maicao', department: 'La Guajira' },
      
      // Magdalena
      { name: 'Santa Marta', department: 'Magdalena' },
      { name: 'Ciénaga', department: 'Magdalena' },
      
      // Meta
      { name: 'Villavicencio', department: 'Meta' },
      { name: 'Acacías', department: 'Meta' },
      
      // Nariño
      { name: 'Pasto', department: 'Nariño' },
      { name: 'Tumaco', department: 'Nariño' },
      { name: 'Ipiales', department: 'Nariño' },
      
      // Norte de Santander
      { name: 'Cúcuta', department: 'Norte de Santander' },
      { name: 'Ocaña', department: 'Norte de Santander' },
      { name: 'Pamplona', department: 'Norte de Santander' },
      
      // Quindío
      { name: 'Armenia', department: 'Quindío' },
      { name: 'Calarcá', department: 'Quindío' },
      
      // Risaralda
      { name: 'Pereira', department: 'Risaralda' },
      { name: 'Dosquebradas', department: 'Risaralda' },
      { name: 'Santa Rosa de Cabal', department: 'Risaralda' },
      
      // Santander
      { name: 'Bucaramanga', department: 'Santander' },
      { name: 'Floridablanca', department: 'Santander' },
      { name: 'Girón', department: 'Santander' },
      { name: 'Piedecuesta', department: 'Santander' },
      { name: 'Barrancabermeja', department: 'Santander' },
      
      // Sucre
      { name: 'Sincelejo', department: 'Sucre' },
      
      // Tolima
      { name: 'Ibagué', department: 'Tolima' },
      { name: 'Espinal', department: 'Tolima' },
      
      // Valle del Cauca
      { name: 'Cali', department: 'Valle del Cauca' },
      { name: 'Palmira', department: 'Valle del Cauca' },
      { name: 'Buenaventura', department: 'Valle del Cauca' },
      { name: 'Tuluá', department: 'Valle del Cauca' },
      { name: 'Cartago', department: 'Valle del Cauca' },
      { name: 'Buga', department: 'Valle del Cauca' },
      
      // San Andrés y Providencia
      { name: 'San Andrés', department: 'San Andrés y Providencia' }
    ];

    await queryInterface.bulkInsert(
      { tableName: 'cities', schema: SCHEMA },
      cities.map(city => ({
        id: uuidv4(),
        name: city.name,
        department_id: departmentMap[city.department],
        is_active: true,
        created_at: new Date(),
        updated_at: new Date()
      })),
      {}
    );

    console.log('✅ Ciudades de Colombia creadas exitosamente');
  },

  down: async (queryInterface, Sequelize) => {
    const departments = await queryInterface.sequelize.query(
      `SELECT d.id
       FROM "${SCHEMA}"."departments" d
       INNER JOIN "${SCHEMA}"."countries" c ON d.country_id = c.id
       WHERE c.code = 'COL'`,
      { type: Sequelize.QueryTypes.SELECT }
    );

    if (departments.length > 0) {
      await queryInterface.bulkDelete(
        { tableName: 'cities', schema: SCHEMA },
        { department_id: departments.map(d => d.id) },
        {}
      );
    }
  }
};