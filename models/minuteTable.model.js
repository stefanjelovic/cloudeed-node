const {TE, to}              = require('../services/util.service');
const Sequelize = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  var Model = sequelize.define('MinuteTable', {
    minute_id: DataTypes.INTEGER,   
    table_row: DataTypes.INTEGER,     
    table_column: DataTypes.INTEGER,    
    table_title:DataTypes.STRING, 
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
 