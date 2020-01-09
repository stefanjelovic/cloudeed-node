const {TE, to}              = require('../services/util.service');

module.exports = (sequelize, DataTypes) => {
  var Model = sequelize.define('CompanyDirector', {
    company_id: DataTypes.INTEGER,
    user_id: DataTypes.INTEGER,
    is_authorized: DataTypes.INTEGER,
    created_by: DataTypes.INTEGER,
  });

  Model.associate = function (models) {
    this.User = this.belongsTo(models.User, { foreignKey: 'user_id', onDelete: 'CASCADE' });  
    this.User = this.belongsTo(models.User, { foreignKey: 'created_by', onDelete: 'CASCADE' });  
    this.Company = this.belongsTo(models.Company, { foreignKey: 'company_id', onDelete: 'CASCADE' });
  };
  

  Model.prototype.toWeb = function (pw) {
    let json = this.toJSON();
    return json;
  };

return Model;
};