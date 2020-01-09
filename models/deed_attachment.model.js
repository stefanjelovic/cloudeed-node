const {TE, to}              = require('../services/util.service'); 

module.exports = (sequelize, DataTypes) => {
  var Model = sequelize.define('DeedAttachment', {
    deed_id: DataTypes.INTEGER,
    attachment_name : DataTypes.STRING,    
    updated_by: DataTypes.INTEGER 
  }); 
  
  Model.associate = function (models) {
    this.Deeds = this.belongsTo(models.Deeds, { foreignKey: 'deed_id', onDelete: 'CASCADE' });
    this.User = this.belongsTo(models.User, { foreignKey: 'updated_by', onDelete: 'CASCADE' });  
  };

  Model.prototype.toWeb = function (pw) {
      let json = this.toJSON();
      return json;
  }; 
  return Model;
};
 