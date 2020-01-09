const {TE, to}              = require('../services/util.service');
const Sequelize = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  var Model = sequelize.define('TermAndClauseSection', { 
    parent_id: DataTypes.INTEGER,
    type: DataTypes.INTEGER, // 1 for term and 2 for clauses
    level: DataTypes.STRING,
    heading: DataTypes.TEXT,
    content: DataTypes.TEXT,
    ordering: DataTypes.INTEGER,
    created_by: DataTypes.INTEGER, 
    status: { type: Sequelize.INTEGER, defaultValue: 0 }
  }); 
 
  Model.prototype.toWeb = function (pw) {
      let json = this.toJSON();
      return json;
  };

  return Model;
};