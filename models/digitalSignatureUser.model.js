const {TE, to}              = require('../services/util.service');
const Sequelize = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  var Model = sequelize.define('DigitalSignatureUser', {
    user_id: DataTypes.INTEGER,
    minute_id: DataTypes.INTEGER,   
    user_type: { type: Sequelize.INTEGER, defaultValue: 0 },     
  });

  Model.associate = function (models) { 
    this.MinuteTemplate = this.belongsTo(models.MinuteTemplate, { foreignKey: 'minute_id', onDelete: 'CASCADE' });
    this.User = this.belongsTo(models.User, { foreignKey: 'user_id', onDelete: 'CASCADE' });
  };
    
  Model.prototype.toWeb = function (pw) {
      let json = this.toJSON();
      return json;
  };

  return Model;
};
 