const {TE, to}              = require('../services/util.service');
const Sequelize = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  var Model = sequelize.define('Deeds', {
    trust_name: DataTypes.STRING,
    trust_type: DataTypes.INTEGER,   // 1 for unit 2 for family
    is_trustee: DataTypes.INTEGER,   //  1 for individual 2 for company
    refrence_number: DataTypes.STRING, 
    status:{ type: Sequelize.INTEGER, defaultValue: 3 }, // 1 for active 2 for review 3 for draft 
    special_clause:{ type: Sequelize.INTEGER, defaultValue: 0 },
    created_by:DataTypes.INTEGER,
    updated_by:DataTypes.INTEGER,
    pdf_name:{ type: Sequelize.STRING, defaultValue: '' },
    pdf_generate:{ type: Sequelize.INTEGER, defaultValue: 0 },
    term_version:{ type: Sequelize.INTEGER, defaultValue: 0 },
    clause_version:{ type: Sequelize.INTEGER, defaultValue: 0 },
    trust_vest_date:DataTypes.DATE
  });

  Model.associate = function (models) {
    this.User = this.belongsTo(models.User, { foreignKey: 'created_by', onDelete: 'CASCADE' }); 
    this.User = this.belongsTo(models.User, { foreignKey: 'updated_by', onDelete: 'CASCADE' });  
  };
  
    
  Model.prototype.toWeb = function (pw) {
      let json = this.toJSON();
      return json;
  };

  return Model;
};
 