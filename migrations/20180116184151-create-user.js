'use strict';
module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.createTable('Users', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      username: {
        type: Sequelize.STRING
      },
      password: {
        type: Sequelize.STRING
      },
      email: {
        type: Sequelize.STRING,
        unique:true
      },
      user_type: {
        type: Sequelize.INTEGER
      },
      is_trustee: {
        type: Sequelize.INTEGER
      },
      is_settlor: {
        type: Sequelize.INTEGER
      },
      is_beneficiary: {
        type: Sequelize.INTEGER
      },
      is_guardian: {
        type: Sequelize.INTEGER
      },
      is_appointer: {
        type: Sequelize.INTEGER
      }, 
      provider_type: {
        type: Sequelize.INTEGER
      }, 
      abn_number: {
        type: Sequelize.STRING
      }, 
      first_name: {
        type: Sequelize.STRING
      },
      last_name: {
        type: Sequelize.STRING
      },
      profile_image: {
        type: Sequelize.STRING
      },
      is_active: {
        type: Sequelize.INTEGER
      },
      isArchived:{
        type: Sequelize.INTEGER
      },
      forget_password: {
        type: Sequelize.STRING,
        allowNull:true
      },  
      remove_by_admin: {
        type: Sequelize.INTEGER
      },
      address: {
        type: Sequelize.STRING
      },
      latitude: {
        type: Sequelize.STRING
      },
      longitude: {
        type: Sequelize.STRING
      },  
      phone_number: {
        type: Sequelize.STRING
      }, 
      added_by: {
        type: Sequelize.INTEGER
      }, 
      company_id: {
        type: Sequelize.INTEGER
      },    
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE
      }
    });
  },
  down: (queryInterface, Sequelize) => {
    return queryInterface.dropTable('Users');
  }
};