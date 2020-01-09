const { FeatureUpdate } = require("../models");
var base64ToImage = require('base64-to-image');
const authService = require("../services/auth.service");
const { to, ReE, ReS, encrypt, decrypt, emailUtil } = require("../services/util.service");
const userService = require("../services/user.service");
const Sequelize = require('sequelize');
const Op = Sequelize.Op
const WEB_URL = "https://test-cd.outsourcedglobal.com";


const getAll = async function (req, res) {
  /* Code for Pagination */
  let limit = 5;   // number of records per page
  let offset = 0;
  let countallFeature = await userService.countAllFeatures();
  let page = req.body.page;      // page number
  let order_by = req.body.order_by;
  let order_by_ASC_DESC = req.body.order_by_ASC_DESC;
  let totalCount = countallFeature.count;
  let pages = Math.ceil(totalCount / limit);
  offset = limit * (page - 1);
  /* End code for Pagination */
  let query = req.body.q;
  // let query = "t";

  let user = req.user;
  let err, features;
  if (query.trim() != "") {

    [err, features] = await to(FeatureUpdate.findAll({

      where: { title: { [Op.like]: '%' + query.trim() + '%' } },
      limit: limit,
      offset: offset,
      order: [[order_by, order_by_ASC_DESC]]

    }));

    //pages = (features.length > 0) ? Math.ceil(features.length / limit) : 1;
    //totalCount = (features.length > 0) ? features.length : 1;
  } else {
    [err, features] = await to(FeatureUpdate.findAll({
      limit: limit,
      offset: offset,
      order: [[order_by, order_by_ASC_DESC]]
    }));
  }
  return ReS(res, { feature: features, 'count': totalCount, 'pages': pages });
}
module.exports.getAll = getAll;

const getFeatureById = async function (req, res) {
  let feature, err;
  // [err, record] = await to(Record.findById(req.params.id));
  [err, feature] = await to(FeatureUpdate.findById(req.body.id));
  if (!feature) return ReE(res, "Feature not found with id: " + req.body.id, 200);
  let featureData = feature.toWeb();
  if (err) return ReS(res, 'Error occured trying to get feature');
  return ReS(res, { feature: featureData }, 200);
}
module.exports.getFeatureById = getFeatureById;


const deleteFeatureUpdate = async function (req, res) {
  let featureupdate, err;
  [err, featureupdate] = await to(FeatureUpdate.findById(req.params.id));
  [err, featureupdate] = await to(featureupdate.destroy());
  if (err) return ReE(res, 'Error occured trying to delete feature update');
  return ReS(res, { message: 'Deleted Feature Update', deletedfeatureupdate: featureupdate }, 200);
}
module.exports.deleteFeatureUpdate = deleteFeatureUpdate;


const activeDeactive = async function (req, res) {
  let err, featureupdate, data;
  data = req.body;
  [err, featureupdate] = await to(FeatureUpdate.findById(req.body.id));
  if (err) return ReE(res, err, 422);
  featureupdate.set(data);
  [err, featureupdate] = await to(featureupdate.save());
  if (err) {
    if (err.message == "Validation error")
      err = "Error in updating feature !";
    return ReE(res, err);
  }
  return ReS(res, { message: "Feature updated successfully.", featureupdate: featureupdate.toWeb() });
};
module.exports.activeDeactive = activeDeactive;


const addFeature = async function (req, res) {
  let err, feature;
  let feature_info = req.body.feature;
  [err, feature] = await to(FeatureUpdate.create(feature_info));
  if (err) return ReE(res, err, 422);
  [err, feature] = await to(feature.save());
  if (err) return ReE(res, err, 422);
  return ReS(res, { feature: feature }, 201);
}
module.exports.addFeature = addFeature;


const EditFeature = async function (req, res) {
  [err, feature] = await to(FeatureUpdate.findById(req.body.feature.id));
  if (!feature) return ReE(res, "Feature not found with id: " + req.body.feature.id, 200);
  if (err) return ReE(res, "Error finding feature");
  [err, feature] = await to(feature.update({
    title: req.body.feature.title || feature.title,
    assign: req.body.feature.assign || feature.assign,
    image_video: req.body.feature.image_video || feature.image_video,
    discription: req.body.feature.discription || feature.discription,
    start_date: req.body.feature.start_date || feature.start_date,
    end_date: req.body.feature.end_date || feature.end_date,
    status: req.body.feature.status || feature.status,
    created_by: req.body.feature.created_by || feature.created_by

  }));
  if (err) return ReE(res, "Error while updating feature");
  return ReS(res, { feature: feature });
}
module.exports.EditFeature = EditFeature;

const viewFeature = async function (req, res) {
  let feature, err;

  if (req.user.user_type == 1) {
    [err, feature] = await to(FeatureUpdate.findById(req.body.id));
    if (!feature) return ReE(res, "Feature not found with id: " + req.body.id, 200);
    let featureData = feature.toWeb();
    if (err) return ReS(res, 'Error occured trying to get feature');
    return ReS(res, { feature: featureData }, 200);
  }
}
module.exports.viewFeature = viewFeature;


// const fetchDataDeedpandStackh = async function (req, res) {
//   let feature, err;
//   let date =new Date();
//   [err, feature] = await to(FeatureUpdate.findAll({where: {assign: req.user.user_type}}));
//   return ReS(res, { feature: feature }, 200);
// }
// module.exports.fetchDataDeedpandStackh = fetchDataDeedpandStackh;


const fetchDataDeedpandStackh = async function (req, res) {
  let err, feature;
  let date = new Date();
  [err, feature] = await to(FeatureUpdate.findAll({ where: { assign: req.user.user_type } }));
  return ReS(res, { feature: feature }, 200);
}
module.exports.fetchDataDeedpandStackh = fetchDataDeedpandStackh;

const getGiftList = async function (req, res) {
  let err, feature;
  let limit = 5;   // number of records per page
  let offset = 0;
  [err, feature] = await to(FeatureUpdate.findAll({
    limit: limit,
    offset: offset,
    order: [['updatedAt', 'DESC']]
  }));
  return ReS(res, { feature: feature }, 200);
}
module.exports.getGiftList = getGiftList;


const getFeatureGiftList = async function (req, res) {
  let err, feature;
  let date = new Date();
  [err, feature] = await to(FeatureUpdate.findAll({
    where: {
      assign: req.user.user_type
    }
  }));
  return ReS(res, { feature: feature }, 200);
}
module.exports.getFeatureGiftList = getFeatureGiftList;