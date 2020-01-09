const {TE, to}              = require('../services/util.service');
const Sequelize = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  var Model = sequelize.define('MinuteTemplate', {
    title: DataTypes.STRING, 
    status:{ type: Sequelize.INTEGER, defaultValue: 3 }, // 1 for active 2 for review 3 for draft 
    version :{ type: Sequelize.STRING, defaultValue: 1 },
    sub_version :{ type: Sequelize.STRING, defaultValue: 0 },
    listing:{ type: Sequelize.INTEGER, defaultValue: 0 },
    deed_id:{ type: Sequelize.INTEGER, defaultValue: 0 },
    type:{ type: Sequelize.INTEGER, defaultValue: 1 }, // 1 for template and 2 for minutes
    created_by:DataTypes.INTEGER,
    updated_by:DataTypes.INTEGER,     
  });

  Model.associate = function (models) {
    this.User = this.belongsTo(models.User, { foreignKey: 'created_by', onDelete: 'CASCADE' });
    this.User = this.belongsTo(models.User, { foreignKey: 'updated_by', onDelete: 'CASCADE' });
  };
    
  Model.prototype.toWeb = function (pw) {
      let json = this.toJSON();
      return json;
  };

  return Model;
};
 