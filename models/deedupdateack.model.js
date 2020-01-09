const {TE, to}  = require('../services/util.service');
const Sequelize = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  var Model = sequelize.define('DeedUpdateAck', {
    deed_update_id: DataTypes.INTEGER,
    stackholder_id: DataTypes.INTEGER,
  });

  Model.associate = function (models) {
    this.DeedUpdate  = this.belongsTo(models.DeedUpdate, { foreignKey: 'deed_update_id', onDelete: 'CASCADE' });
    this.User        = this.belongsTo(models.User, { foreignKey: 'stackholder_id', onDelete: 'CASCADE' });  
  };
  
  Model.prototype.toWeb = function (pw) {
      let json = this.toJSON();
      return json;
  };
  return Model;
};
