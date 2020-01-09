const {TE, to}  = require('../services/util.service');
const Sequelize = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  var Model = sequelize.define('Deedhistory', {
    deed_id: DataTypes.INTEGER,
    type: DataTypes.STRING,    
    title: DataTypes.STRING,    
    old: DataTypes.STRING,  
    new: DataTypes.STRING,
    note: DataTypes.TEXT,
    minute_id: { type: Sequelize.INTEGER, defaultValue: 0 },
    updated_by: DataTypes.INTEGER,
    deed_update_id: { type: Sequelize.INTEGER, defaultValue: 1 },
    
  });

  Model.associate = function (models) {
    this.Deeds = this.belongsTo(models.Deeds, { foreignKey: 'deed_id', onDelete: 'CASCADE' });
    this.User = this.belongsTo(models.User, { foreignKey: 'updated_by', onDelete: 'CASCADE' });  
    //this.MinuteTemplate = this.belongsTo(models.MinuteTemplate, { foreignKey: 'minute_id', onDelete: 'CASCADE' });  
  };
  
  Model.prototype.toWeb = function (pw) {
      let json = this.toJSON();
      return json;
  };
  return Model;
};
