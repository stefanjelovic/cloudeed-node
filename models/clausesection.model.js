const {TE, to}              = require('../services/util.service');

module.exports = (sequelize, DataTypes) => {
  var Model = sequelize.define('ClauseSections', {
    parent: DataTypes.INTEGER,
    title: DataTypes.STRING,
    level : DataTypes.INTEGER,
    ordering:DataTypes.INTEGER
  });

  Model.associate = function (models) {
    this.Clauses = this.belongsTo(models.Clauses, { foreignKey: 'clause_id', onDelete: 'CASCADE' });
  };

 
  Model.prototype.toWeb = function (pw) {
      let json = this.toJSON();
      return json;
  };

  return Model;
};