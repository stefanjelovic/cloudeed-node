const { User,CompanyAdmin,Deedusers } = require("../models");  
var base64ToImage = require('base64-to-image'); 
const authService = require("../services/auth.service");
const {to,ReE,ReS,encrypt,decrypt, emailUtil} = require("../services/util.service");
const userService = require("../services/user.service");
const Sequelize = require('sequelize');
const Op = Sequelize.Op
const WEB_URL = "https://test-cd.outsourcedglobal.com";

const signup = async function(req, res) {
  const body = req.body;
  if (!body.unique_key && !body.email && !body.phone) {
    return ReE(res, "Please enter an email or phone number to register.");
  } else if (!body.password) {
    return ReE(res, "Please enter a password to register.");
  } else {
    let err, user;

    [err, user] = await to(authService.createUser(body));

    if (err) return ReE(res, err, 422);

    //var activeuserkey = encrypt('ABC_'+user.id);
    var emailBody = '<table width="100%">';
    emailBody += "<tr>";
    emailBody +="<td>Hello " + body.first_name + " " + body.last_name + "</td>";
    emailBody += "</tr>";
    emailBody += "<tr>";
    emailBody += "<td>Thank you for register on our application.Please click on below link and active your account.</td>";
    emailBody += "</tr>";
    emailBody += "<tr>";
    emailBody += '<td><a href="https://test-cd.outsourcedglobal.com/activateuser/">Click here</a></td>';
    emailBody += "</tr>";
    emailBody += "</table>";
    emailUtil(body.email, emailBody, "Registation Invitation.", req, res);
    return ReS(
      res,
      {
        message: "Successfully created new user.",
        user: user.toWeb(),
        token: user.getJWT()
      },
      201
    );
  }
};
module.exports.signup = signup;

const getUserDetail = async function(req, res) { 
  let err, user;
  [err, user] = await to(User.findById(req.body.id));
  if (err) {
    return ReE(res, err);
  }
  // let company = req.company;
  return ReS(res, { user: user.toWeb() });
};
module.exports.getUserDetail = getUserDetail;

const update = async function(req, res) {
  let err, user, data; 
  data = req.body.user;   
  // if(data.is_profile_image_update > 0){  
  //   var base64Str = data.profile_image;
  //   // var path = '/var/www/html/cloud_deed/be/public/uploads/';
  //   var path=' /home/cdeed/cd/public/uploads' ;
  //   var optionalObj = {'fileName': Date.now()};
  //   let imageUpload = base64ToImage(base64Str,path,optionalObj);
  //   data.profile_image = imageUpload.fileName;
  // } 
  [err, user] = await to(userService.getUserById(data.id));
  if (err) return ReE(res, err, 422);
  user.set(data);
  [err, user] = await to(user.save());
  if (err) {
    if (err.message == "Validation error")
      err = "Error in updating user !";
    return ReE(res, err);
  }
  return ReS(res, { message: "User details updated successfully.", user:user.toWeb()});
};
module.exports.update = update;

const remove = async function(req, res) {
  let user, err;
  user = req.user;
  user.remove_by_admin = 1;

  [err, user] = await to(user.save());
  if (err) return ReE(res, "error occured trying to delete user");

  return ReS(res, { message: "Deleted successfully." }, 204);
};
module.exports.remove = remove;


const changeStatus = async function(req, res) {
  let user, err;
  user = req.user;
  let data = req.body;
  if(user.user_type == 1){  
    [err, user] = await to(userService.getUserById(data.id));
    if (err) return ReE(res, err, 422);
    data.is_active = 1
    user.set(data);
    [err, user] = await to(user.save());
    if (err) {
      if (err.message == "Validation error")
        err = "Error in updating user !";
      return ReE(res, err);
    }
    return ReS(res, { message: "Change Status Successfully." }); 
  } else {
    return ReE(res, "Only Admin can change status");
  }
  
};
module.exports.changeStatus = changeStatus;

const login = async function(req, res) {
  const body = req.body;

  let err, user;
  [err, user] = await to(authService.authUser(req.body));
  if (err) return ReE(res, err, 422);
  if (user.remove_by_admin == 1) return ReE(res, "Your account is deleted by admin");
  if (user.active == 0) return ReE(res, "Your account is not verfied.");
  let flag = false;
  if(user.user_type != 1){
    let admin , stackholder ;
    [err, admin] = await to(CompanyAdmin.findOne({where:{user_id:user.id}}));    
    [err, stackholder] = await to(Deedusers.findOne({where:{user_id:user.id}}));
    
    if(admin == null && stackholder == null) return ReE(res, {message:'You are not authorised currently',success:false});
    if(stackholder != null) { user.user_type = 4;}
  } 
  return ReS(res, { token: user.getJWT(), user: user.toWeb() });
};
module.exports.login = login;

const forgetPassword = async function(req, res) {
  const body = req.body; 

  if (!body.email) {
    return ReE(res, "Please enter an email.");
  } else {
    let err, user;
    [err, user] = await to(userService.authUserByEmail(body));
    if (err) return ReE(res, err, 422);
    var resetpasskey = encrypt(body.email);
    user.forget_password = resetpasskey;
    [err, user] = await to(user.save());

    // outputs hello world 

    var emailBody = '<table width="100%">';
    emailBody += "<tr>";
    emailBody += "<td>Please click on below link and reset your password.</td>";
    emailBody += "</tr>";
    emailBody += "<tr>";
    emailBody += "<td>Your Token : " + resetpasskey + "</td>";
    emailBody += "</tr>";
    emailBody += "<tr>";
    emailBody += '<td><a href="' + WEB_URL + '/resettoken">Click here</a></td>';
    emailBody += "</tr>";
    emailBody += "</table>";
    emailUtil(body.email, emailBody, "Reset Password.", req, res);
    return ReS(res, { message: "send password to mail" });
  }
};
module.exports.forgetPassword = forgetPassword;

const getPasswordApplied = async function(req, res) { 
  var body = req.body;
  let err, user;
  [err, user] = await to(userService.checkByTokenAndUpdtPass(body));
  if (err) return ReE(res, err, 422);
  return ReS(res, {
    message: "Successfully changed your password.",
    data: req.body
  });
};
module.exports.getPasswordApplied = getPasswordApplied;

const activeRegisteredUser = async function(req, res) {
  var activeuserkey = req.body.email;
  let err, user;
  console.log("------------", activeuserkey);
  [err, user] = await to(userService.activeUserById(activeuserkey));
  return ReS(res, { message: "Your account successfully activated." },201);
};
module.exports.activeRegisteredUser = activeRegisteredUser;

const setProfile = async function(req, res) {
  var activeuserkey = req.params.activeuserkey;
  let err, user;
  [err, user] = await to(userService.activeUserById(activeuserkey));
  return ReS(res, { message: "Your account successfully activated." },201);
};
module.exports.setProfile = setProfile;

//********* Change Password **********
const changePassword = async function(req, res) {
  let body = req.body.changePasswordInfo; 
  let newPassword = body.newPassword;
  let confirmPassword = body.confirmPassword;

  if (newPassword != confirmPassword) {
    return ReE(res, {message: "New password and repeat password does not match."},422);
  } else {
    [err, user] = await to(userService.changePassword(req.body.id, body));
    if (err) return ReE(res, err, 422);
    return ReS(res, { message: "Password change successfully." });
  }
};
module.exports.changePassword = changePassword;

const getAllUsers = async function(req, res) {
  let err, user,users,company_admin, deedproviders;
  user = req.user ;

  /* Code for Pagination */
  let limit = 10;   // number of records per page
  let offset = 0;
  let countallUsers = await User.findAndCountAll({where:{added_by:user.id}}); 
  let page = req.body.page;      // page number
  let order_by = req.body.order_by;  
  let order_by_ASC_DESC = req.body.order_by_ASC_DESC;
  let totalCount = countallUsers.count;
  let pages = Math.ceil(totalCount / limit);
  offset = limit * (page - 1); 
  let query = req.body.q; 
  /* End code for Pagination */

  // if(user.user_type==1){
    if(query.trim() != "") { 
      [err, users] = await to(User.findAll({
        where:{
          added_by:user.id,
          [Op.or] : { 
            email:{ [Op.like]: '%'+query.trim()+'%' },
            first_name:{ [Op.like]: '%'+query.trim()+'%' },
            last_name:{ [Op.like]: '%'+query.trim()+'%' },
            phone_number:{ [Op.like]: '%'+query.trim()+'%' }
          },isArchived:0
        },
        limit: limit,
        offset: offset,
        order: [[order_by, order_by_ASC_DESC]]
      })); 
    } else {
      [err, users] = await to(User.findAll({
        where:{added_by:user.id,isArchived:0},
        limit: limit,
        offset: offset,
        order: [[order_by, order_by_ASC_DESC]]
      })); 
    }  
  let userArr = [];
  for(let k in users){
    let userObj = users[k].toWeb();
    [err, company_admin] = await to(CompanyAdmin.findOne({where:{user_id:userObj.id}}));
    userObj.user_type = (company_admin != null) ? 2 : 4; 
    if (company_admin != null) {
      [err, company] = await to(Company.findOne({where: {id:company_admin.company_id} }));
      userObj.company = company;
    } else {
      userObj.company = {};
    }
    userArr.push(userObj);

  }
  

  // }else if(user.user_type==2){
  //   [err, users] = await to(User.findAll({where:{isArchived:0}})); 
  //   users.splice(users.findIndex(obj=>obj.id==req.user.id),1);
    // [err, company_admin] = await to(CompanyAdmin.findOne({where:{user_id:user.id}}));
    // let company_id = company_admin.toWeb().company_id ;
    // [err, deedproviders] = await to(CompanyAdmin.findAll({where:{company_id:company_id}}));
    // let deedprovidersIds =[];
    // for(var k in deedproviders){
    //   [err, userdata] = await to(User.findAll({ where: {added_by: deedproviders[k].user_id,isArchived: 0}}));
    //   for(var i in userdata){
    //     deedprovidersIds.push(userdata[i].toWeb());
    //   }
    // };

    // users = deedprovidersIds;
   
  if (err) {return ReE(res, 'Unable to found any user.');}
  return ReS(res, { message: "Found all users ", users: userArr ,'count': totalCount, 'pages': pages});
};
module.exports.getAllUsers = getAllUsers;

const getAllSystemUsers = async function(req, res) {

  let err, user,users,company_admin, deedproviders;
  user = req.user ;  
  [err, users] = await to(User.findAll({where:{ added_by:user.id}}));     
  let userArr = [];
  for(let k in users){
    let userObj = users[k].toWeb();
    [err, company_admin] = await to(CompanyAdmin.findOne({where:{user_id:userObj.id}}));
    userObj.user_type = (company_admin != null) ? 2 : 4;
    userObj.company_admin = company_admin;
    userArr.push(userObj);
  } 
  if (err) {return ReE(res, 'Unable to found any user.');}
  return ReS(res, { message: "Found all users ", users: userArr });

};
module.exports.getAllSystemUsers = getAllSystemUsers;

const createUser = async function(req, res) {
  const body = req.body.user;
  if (!body.unique_key && !body.email && !body.phone) {
    return ReE(res, "Please enter an email or phone number to register.");
  } else if (!body.password) {
    return ReE(res, "Please enter a password to register.");
  } else {

    let err, user;
    [err, user] = await to(authService.createUser(body)); 
    if (err) return ReE(res, err, 422);
    //var activeuserkey = encrypt('ABC_'+user.id);
    var emailBody = '<table width="100%">';
    emailBody += "<tr>";
    emailBody +=
      "<td>Hello " + body.first_name + " " + body.last_name + "</td>";
    emailBody += "</tr>";
    emailBody += "<tr>";
    emailBody +=
      "<td>Admin created your account.Please click on below link and active your account.</td>";
    emailBody += "</tr>";
    emailBody += "<tr>";
    emailBody += '<td><a href="https://test-cd.outsourcedglobal.com/activateuser">Click here</a></td>';
    // emailBody +=
      // '<td><a href="https://test-api-cd.outsourcedglobal.com/api/user/active/' +user.id +'">Click here</a></td>';
    emailBody += "</tr>";
    emailBody += "</table>";
    emailUtil(body.email, emailBody, "Registation Invitation.", req, res);
    return ReS(
      res,
      {
        message: "Successfully created new user.",
        user: user.toWeb(),
        token: user.getJWT()
      },
      201
    );
  }
};
module.exports.createUser = createUser;

const listOfDeedProvidersUsers = async function(req, res) {
  let err, user;
  [err, user] = await to(User.findAll({where:{added_by:req.user.id}}));
  if (err) {
    if (err.message == "Validation error") err = "Unable to found any user.";
    return ReE(res, err);
  } 
  return ReS(res, { message: "Found all users ", users: user });
};
module.exports.listOfDeedProvidersUsers = listOfDeedProvidersUsers;
 
const archiveUsers = async function (req, res) {
  let err;
  let userIds = req.body.userIds;
  let unarchivedusers = []; 
  for (var index in userIds) {
      [err, company] = await to(User.findById(userIds[index]));
      [err, company] = await to(User.update({
          isArchived: true || user.isArchived
      }
      ));
  }
  [err, unarchivedusers] = await to(User.findAll({
      where: { isArchived: false }
  }));
  return ReS(res, { users: unarchivedusers });
}
module.exports.archiveUsers = archiveUsers;

const uploadCommonAttachemnt = async function(req, res, next) {
  console.log("---------------test tes ", req.files );
  return ReS(res, { message: "Upload your image.", deedattachment: req.files });
};
module.exports.uploadCommonAttachemnt = uploadCommonAttachemnt;

const makeUnarchivedUsers = async function(req, res){ 
  let err, user;
  let body = req.body.userIds;
  for(let i in body){
      [err, user] = await to(User.update({ isArchived:0 },{ where: {id: body[i]}}));
  }
  return ReS(res, {message:'Done'});    
}
module.exports.makeUnarchivedUsers = makeUnarchivedUsers;

const makeArchivedUsers = async function(req, res){ 
  let err, user;
  let body = req.body.userIds;
  for(let i in body){
      [err, user] = await to(User.update({ isArchived:1 },{ where: {id: body[i]}}));
  }
  return ReS(res, {message:'Done'});    
}
module.exports.makeArchivedUsers = makeArchivedUsers;

const getListOfArchivedUsers = async function(req, res) {


  let err, user,users,company_admin, deedproviders;
  user = req.user ;

  /* Code for Pagination */
  let limit = 10;   // number of records per page
  let offset = 0;
  let countallUsers = await User.findAndCountAll({where:{added_by:user.id,isArchived:1}}); 
  let page = req.body.page;      // page number
  let order_by = req.body.order_by;  
  let order_by_ASC_DESC = req.body.order_by_ASC_DESC;
  let totalCount = countallUsers.count;
  let pages = Math.ceil(totalCount / limit);
  offset = limit * (page - 1); 
  let query = req.body.q; 
  /* End code for Pagination */

  // if(user.user_type==1){
    if(query.trim() != "") { 
      [err, users] = await to(User.findAll({
        where:{
          added_by:user.id,
          [Op.or] : {
            email:{ [Op.like]: '%'+query.trim()+'%' },
            first_name:{ [Op.like]: '%'+query.trim()+'%' },
            last_name:{ [Op.like]: '%'+query.trim()+'%' },
            phone_number:{ [Op.like]: '%'+query.trim()+'%' }
          },isArchived:1
        },
        limit: limit,
        offset: offset,
        order: [[order_by, order_by_ASC_DESC]]
      })); 
    } else {
      [err, users] = await to(User.findAll({
        where:{added_by:user.id,isArchived:1},
        limit: limit,
        offset: offset,
        order: [[order_by, order_by_ASC_DESC]]
      })); 
    }  
  let userArr = [];
  for(let k in users){
    let userObj = users[k].toWeb();
    [err, company_admin] = await to(CompanyAdmin.findOne({where:{user_id:userObj.id}}));
    userObj.user_type = (company_admin != null) ? 2 : 4; 
    userArr.push(userObj);

  } 
  if (err) {return ReE(res, 'Unable to found any user.');}
  return ReS(res, { message: "Found all users ", users: userArr ,'count': totalCount, 'pages': pages}); 
};
module.exports.getListOfArchivedUsers = getListOfArchivedUsers;


