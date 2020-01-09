const {TE, to}    = require('../services/util.service');
const Sequelize   = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  var Model = sequelize.define('Terms', {
    title: DataTypes.STRING,
    description: DataTypes.TEXT,
    version: DataTypes.INTEGER, 
    sub_version :{ type: Sequelize.STRING, defaultValue: "0" },
    created_by: DataTypes.INTEGER, 
    updated_by: DataTypes.INTEGER, 
    status:DataTypes.INTEGER 
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