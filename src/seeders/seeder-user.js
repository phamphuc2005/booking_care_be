'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    return queryInterface.bulkInsert('Users', [{
      email: 'admin@gmail.com.com',
      password: '0',
      firstName: 'Pham',
      lastName: 'Phuc',
      address: 'Ha Noi',
      gender: 1,
      typeRole: 'ROLE',
      keyRole: 'R0',
      createdAt: new Date(),
      updatedAt: new Date()
    }]);
  },

  down: async (queryInterface, Sequelize) => {
    /**
     * Add commands to revert seed here.
     *
     * Example:
     * await queryInterface.bulkDelete('People', null, {});
     */
  }
};
