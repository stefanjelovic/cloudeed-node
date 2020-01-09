const {TE, to}              = require('../services/util.service');
const Sequelize = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  var Model = sequelize.define('MinuteSection', {
    minute_id: DataTypes.INTEGER,   
    parent_id: { type: Sequelize.INTEGER, defaultValue: 0 },   
    order: DataTypes.INTEGER,     
    level: DataTypes.STRING,     
    content: DataTypes.TEXT,     
  });

  Model.associate = function (models) { 
    this.MinuteTemplate = this.belongsTo(models.MinuteTemplate, { foreignKey: 'minute_id', onDelete: 'CASCADE' }); 
  };
    
  Model.prototype.toWeb = function (pw) {
      let json = this.toJSON();
      return json;
  };

  return Model;
};
 