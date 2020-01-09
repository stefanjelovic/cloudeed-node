const {TE, to}              = require('../services/util.service');
const Sequelize = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  var Model = sequelize.define('Company', {
    company_name: DataTypes.STRING,
    company_number: DataTypes.STRING, 
    logo: DataTypes.STRING,
    address: DataTypes.STRING,
    latitude:DataTypes.STRING, 
    longitude:DataTypes.STRING, 
    is_active:DataTypes.INTEGER,
    company_type:DataTypes.INTEGER, // 1 for DP and 2 for Customer
    remove_by_admin: DataTypes.INTEGER,
    isArchived: { type: Sequelize.INTEGER, defaultValue: 0 },
  });
  
 
  Model.prototype.toWeb = function (pw) {
      let json = this.toJSON();
      return json;
  };

  return Model;
};