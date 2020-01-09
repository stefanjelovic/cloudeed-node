const {TE, to}  = require('../services/util.service');
const Sequelize = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  var Model = sequelize.define('DeedUpdate', {
    deed_id: DataTypes.INTEGER,
  });

  Model.associate = function (models) {
    this.Deeds = this.belongsTo(models.Deeds, { foreignKey: 'deed_id', onDelete: 'CASCADE' });
  };
  
  Model.prototype.toWeb = function (pw) {
      let json = this.toJSON();
      return json;
  };
  return Model;
};
