const {TE, to}              = require('../services/util.service');
const Sequelize = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  var Model = sequelize.define('FeatureUpdate', {
    title: DataTypes.STRING,
    assign: DataTypes.STRING, 
    image_video: DataTypes.STRING,
    discription: DataTypes.STRING,
    start_date: DataTypes.DATE,
    end_date: DataTypes.DATE,
    status:DataTypes.STRING, 
    created_by: DataTypes.INTEGER,
  });
  
 
  Model.prototype.toWeb = function (pw) {
      let json = this.toJSON();
      return json;
  };

  return Model;
};