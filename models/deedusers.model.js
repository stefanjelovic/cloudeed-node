const {TE, to}              = require('../services/util.service');

module.exports = (sequelize, DataTypes) => {
  var Model = sequelize.define('Deedusers', {
    deed_id: DataTypes.INTEGER,
    user_id: DataTypes.INTEGER,    
    user_type: DataTypes.INTEGER,  
    acknowledgement: DataTypes.INTEGER,
    is_approve: DataTypes.INTEGER
  });
 
  Model.associate = function (models) {
    this.Deeds = this.belongsTo(models.Deeds, { foreignKey: 'deed_id', onDelete: 'CASCADE' });
    this.User = this.belongsTo(models.User, { foreignKey: 'user_id', onDelete: 'CASCADE' });  
  };
  
  Model.prototype.toWeb = function (pw) {
      let json = this.toJSON();
      return json;
  };

  return Model;
};
 