const {TE, to}              = require('../services/util.service');

module.exports = (sequelize, DataTypes) => {
  var Model = sequelize.define('DeedAttachments', {
    deed_id: DataTypes.INTEGER,
    attachment: DataTypes.STRING, 
    name: DataTypes.STRING,    
    posted_by: DataTypes.INTEGER
  });
  
  Model.associate = function (models) {
    this.Deeds  = this.belongsTo(models.Deeds, { foreignKey: 'deed_id', onDelete: 'CASCADE' });
    this.User   = this.belongsTo(models.User, { foreignKey: 'posted_by', onDelete: 'CASCADE' });
  };

  Model.prototype.toWeb = function (pw) {
      let json = this.toJSON();
      return json;
  }; 

  return Model;
};
 