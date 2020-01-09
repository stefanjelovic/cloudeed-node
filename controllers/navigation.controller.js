const { to, ReE, ReS } = require('../services/util.service');

const Dashboard = function(req, res){
	let user = req.user.id;
	return res.json({success:true, message:'it worked', data:'user name is :'});
}
module.exports.Dashboard = Dashboard

const { User }          = require('../models');
const authService       = require('../services/auth.service');
const { to, ReE, ReS, encrypt, decrypt, emailUtil }  = require('../services/util.service');
const userService       = require('../services/user.service');
const WEB_URL = 'http://localhost:8080';

const create = async function(req, res){ 
    const body = req.body.user; 
    if(!body.unique_key && !body.email && !body.phone){
        return ReE(res, 'Please enter an email or phone number to register.');
    } else if(!body.password){
        return ReE(res, 'Please enter a password to register.');
    }else{
        let err, user;

        [err, user] = await to(authService.createUser(body));

        if(err) return ReE(res, err, 422); 
        //var activeuserkey = encrypt('ABC_'+user.id); 
        var emailBody = '<table width="100%">';
        emailBody += '<tr>';
        emailBody += '<td>Hello '+body.first_name+' '+body.last_name+'</td>';
        emailBody += '</tr>';
        emailBody += '<tr>';
        emailBody += '<td>Thank you for register on our application.Please click on below link and active your account.</td>';
        emailBody += '</tr>';
        emailBody += '<tr>';
        emailBody += '<td><a href="http://localhost:8080/api/user/active/'+user.id+'">Click here</a></td>';
        emailBody += '</tr>';
        emailBody += '</table>';
        emailUtil(body.email,emailBody,'Registation Invitation.',req, res);
        return ReS(res, {message:'Successfully created new user.', user:user.toWeb(), token:user.getJWT()}, 201);
    }
}
module.exports.create = create;

const getUserDetail = async function(req, res){
    console.log('POPOPOPOPOPO');
    let err, user;
    [err, user] = await to(User.findById(req.body.id));  
    if(err){
        return ReE(res, err);
    } 
    // let company = req.company;
    return ReS(res, {user:user.toWeb()});
}
module.exports.getUserDetail = getUserDetail;

const update = async function(req, res){
    let err, user, data
    user = req.user;
    data = req.body.allUserInfo;
    user.set(data);
    [err, user] = await to(user.save());
    if(err){
        if(err.message=='Validation error') err = 'The email address or phone number is already in use';
        return ReE(res, err);
    }
    return ReS(res, {message :'Updated User: '+user.email});
}
module.exports.update = update;

const remove = async function(req, res){
    let user, err;
    user = req.user;
    user.remove_by_admin = 1;
 
    [err, user] = await to(user.save()); 
    if(err) return ReE(res, 'error occured trying to delete user');
   
    return ReS(res, {message:'Deleted successfully.'}, 204);
}
module.exports.remove = remove;

const login = async function(req, res){0
    const body = req.body; 
    let err, user;
    [err, user] = await to(authService.authUser(req.body));
    if(err) return ReE(res, err, 422);
    if(user.remove_by_admin == 1) return ReE(res, 'Your account is deleted by admin');
    if(user.active == 0) return ReE(res, 'Your account is not verfied.');
    return ReS(res, {token:user.getJWT(), user:user.toWeb()});
}
module.exports.login = login;

const resetPassword = async function(req, res){
    
    const body = req.body.user;
    
    if(!body.email){
        return ReE(res, 'Please enter an email.');
    } else { 
        let err, user;
        [err, user] = await to(userService.authUserByEmail(req.body.user));
        if(err) return ReE(res, err, 422); 

        //console.log(user);

        var resetpasskey = encrypt(req.body.user.email);
        console.log(resetpasskey);
        user.forget_password = resetpasskey;
        [err, user] = await to(user.save());
        
        // outputs hello world
        console.log(decrypt(resetpasskey));
        
        var emailBody = '<table width="100%">';
        emailBody += '<tr>';
        emailBody += '<td>Please click on below link and reset your password.</td>';
        emailBody += '</tr>';
        emailBody += '<tr>';
        emailBody += '<td>Your Token : '+resetpasskey+'</td>';
        emailBody += '</tr>';
        emailBody += '<tr>';
        emailBody += '<td><a href="'+WEB_URL+'/resettoken">Click here</a></td>';
        emailBody += '</tr>';
        emailBody += '</table>';
        emailUtil(body.email,emailBody,'Reset Password.',req, res);
        return ReS(res,{message:"send password to mail"});
    }
}
module.exports.resetPassword = resetPassword;
    
const getPasswordApplied = async function(req, res){
    console.log(req.body);
    var body = req.body.passwordInfo;
    let err, user;
    [err, user] = await to(userService.checkByTokenAndUpdtPass(body)); 
    if(err) return ReE(res, err, 422);     
    return ReS(res, {message:"send password to mail",data:req.body.passwordInfo});
}
module.exports.getPasswordApplied = getPasswordApplied;

const activeRegisteredUser = async function(req, res){
    
    var activeuserkey = req.params.activeuserkey; 
    //console.log(decrypt(activeuserkey));
    let err, user;
    [err, user] = await to(userService.activeUserById(activeuserkey));     
    return ReS(res, {message:"Your account successfully activated."});
}
module.exports.activeRegisteredUser = activeRegisteredUser;

const setProfile = async function(req, res){
    
    var activeuserkey = req.params.activeuserkey; 
    //console.log(decrypt(activeuserkey));
    let err, user;
    [err, user] = await to(userService.activeUserById(activeuserkey));     
    return ReS(res, {message:"Your account successfully activated."});
}
module.exports.setProfile = setProfile;


//********* Change Password **********
const changePassword = async function (req, res) {

    let body = req.body;
    let newPassword = body.newPassword;
    let confirmPassword = body.confirmPassword;

    if (newPassword != confirmPassword) {
        return ReS(res, { message: "New password and repeat password does not match." });
    } else {
        [err, user] = await to(userService.changePassword(req.user, body));
        if (err) return ReE(res, err, 422);
        return ReS(res, { message: "Password change successfully." });
    }
}
module.exports.changePassword = changePassword;

const getAllUsers = async function (req, res) {

    let err, user 
    [err, user] = await to(User.findAll());
    if(err){
        if(err.message=='Validation error') err = 'Unable to found any user.';
        return ReE(res, err);
    }
    return ReS(res, {message :'Found all users ',users:user});
}
module.exports.getAllUsers = getAllUsers;


const createUser = async function(req, res){ 
    console.log(req.body.user);
    const body = req.body.user; 
    if(!body.unique_key && !body.email && !body.phone){
        return ReE(res, 'Please enter an email or phone number to register.');
    } else if(!body.password){
        return ReE(res, 'Please enter a password to register.');
    }else{
        let err, user;

        [err, user] = await to(authService.createUser(body));

        if(err) return ReE(res, err, 422); 
        //var activeuserkey = encrypt('ABC_'+user.id); 
        var emailBody = '<table width="100%">';
        emailBody += '<tr>';
        emailBody += '<td>Hello '+body.first_name+' '+body.last_name+'</td>';
        emailBody += '</tr>';
        emailBody += '<tr>';
        emailBody += '<td>Admin created your account.Please click on below link and active your account.</td>';
        emailBody += '</tr>';
        emailBody += '<tr>';
        emailBody += '<td><a href="http://localhost:8080/api/user/active/'+user.id+'">Click here</a></td>';
        emailBody += '</tr>';
        emailBody += '</table>';
        emailUtil(body.email,emailBody,'Registation Invitation.',req, res);

        return ReS(res, {message:'Successfully created new user.', user:user.toWeb(), token:user.getJWT()}, 201);
    }
}
module.exports.createUser = createUser;


import config from 'config';
import { authHeader } from '../_helpers';
import axios from 'axios';
var Usertoken = localStorage.getItem('user'); 
var tokenObj = JSON.parse(Usertoken); 

 

export const userService = {
    login,
    logout,
    register,
    getAll,
    getById,
    update,
    delete: _delete,
    forgetpassword,
    resettoken,
    dashboard,
    profile,
    getAllCompanies,
    addCompany,
    getCompaniesDetails,
    changePassword,
    getAllUsers,
    getUserDetails,
    updateUserDetails,
    addUser
};

function login(email, password) { 
    const userInfo = {
        email: email,
        password: password 
    };   
    return axios.post(`${config.apiUrl}/api/users/login`, userInfo)
        //.then(handleResponse)
        .then(function(response){
            if (response.data.token) { 
                localStorage.setItem('user', JSON.stringify(response.data));               
            }
        });
}

function logout() {
    // remove user from local storage to log user out
    //localStorage.removeItem('user');
}

function getAll() {
    const requestOptions = {
        method: 'GET',
        headers: authHeader()
    };

    return fetch(`${config.apiUrl}/users`, requestOptions).then(handleResponse);
}

function getById(id) {
    const requestOptions = {
        method: 'GET',
        headers: authHeader()
    };

    return fetch(`${config.apiUrl}/users/${id}`, requestOptions).then(handleResponse);
}

function register(user) { 

    return axios({
        method: 'POST',
        url: `${config.apiUrl}/api/users`,
        headers: { 'Content-Type': 'application/json'},
        data: {user:user}
    }).then(handleResponse);   
}

function update(user) {
    const requestOptions = {
        method: 'PUT',
        headers: { ...authHeader(), 'Content-Type': 'application/json' },
        body: JSON.stringify(user)
    };

    return fetch(`${config.apiUrl}/users/${user.id}`, requestOptions).then(handleResponse);;
}

// prefixed function name with underscore because delete is a reserved word in javascript
function _delete(id) {
    const requestOptions = {
        method: 'DELETE',
        headers: authHeader()
    };

    return fetch(`${config.apiUrl}/users/${id}`, requestOptions).then(handleResponse);
}

function forgetpassword(user) { 
    return axios({
        method: 'POST',
        url: `${config.apiUrl}/api/resetpassword`,
        headers: { 'Content-Type': 'application/json'},
        data: {user:user}
    }).then(handleResponse);  
}

function resettoken(passwordInfo) {      
    return axios({
        method: 'POST',
        url: `${config.apiUrl}/api/resetpasswordapplied`,
        headers: { 'Content-Type': 'application/json'},
        data: {passwordInfo:passwordInfo}
    }).then(handleResponse);  
}

function dashboard(loggedInUserInfo) { 
    const requestOptions = {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(loggedInUserInfo)
    };
     
    return fetch(`${config.apiUrl}/api/dashboard`, requestOptions).then(handleResponse);
}

function profile(loggedInUserInfo) { 
    const requestOptions = {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(loggedInUserInfo)
    };
     
    return fetch(`${config.apiUrl}/api/profile`, requestOptions).then(handleResponse);
}

function getAllCompanies() { 
    return axios({
        method: 'POST',
        url: `${config.apiUrl}/api/companies/all`,
        headers: { 'Content-Type': 'application/json', 'Authorization' : tokenObj.token },
    }).then(handleResponse); 
}

function addCompany(companyInfo) {
    const requestOptions = {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization' : tokenObj.token },
        body: JSON.stringify(companyInfo)
    };     
    return fetch(`${config.apiUrl}/api/companies`, requestOptions).then(handleResponse);
}

function getCompaniesDetails(id) {
    return axios({
        method: 'POST',
        url: `${config.apiUrl}/api/companiesdetail`,
        headers: { 'Content-Type': 'application/json', 'Authorization' : tokenObj.token },
        data: {id:id}
    }).then(handleResponse);     
}

function changePassword(changePasswordInfo) {
    const requestOptions = {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization' : tokenObj.token },
        body: JSON.stringify(changePasswordInfo)
    };   
    return fetch(`${config.apiUrl}/api/users/changepassword`, requestOptions).then(handleResponse);
}

function getAllUsers() { 
    return axios({
        method: 'POST',
        url: `${config.apiUrl}/api/users/all`,
        headers: { 'Content-Type': 'application/json', 'Authorization' : tokenObj.token },
    }).then(handleResponse); 
}

function getUserDetails(id) {
    return axios({
        method: 'POST',
        url: `${config.apiUrl}/api/users/userdetail`,
        headers: { 'Content-Type': 'application/json', 'Authorization' : tokenObj.token },
        data: {id:id}
    }).then(handleResponse);     
}

function updateUserDetails(allUserInfo) {
    return axios({
        method: 'POST',
        url: `${config.apiUrl}/api/users/updateuserdetail`,
        headers: { 'Content-Type': 'application/json', 'Authorization' : tokenObj.token },
        data: {allUserInfo:allUserInfo}
    }).then(handleResponse);     
}

function addUser(user) {
    return axios({
        method: 'POST',
        url: `${config.apiUrl}/api/users/adduserbyadmin`,
        headers: { 'Content-Type': 'application/json', 'Authorization' : tokenObj.token },
        data: {user:user}
    }).then(handleResponse);     
} 

function handleResponse(response) { 
    if(response.status = 200){
        return response;
    } else {
        const error = (data && data.message) || response.statusText;
        return Promise.reject(error);
    }

    // return response.text().then(text => {
    //     const data = text && JSON.parse(text);
    //     console.log('data',data);
    // console.log('<<<<<<<<<<<<<<<<<<<<<');
    //     if (!response.ok) {
    //         if (response.status === 401) {
    //             // auto logout if 401 response 00returned from api
    //             logout();
    //             location.reload(true);
    //         }
    //         const error = (data && data.message) || response.statusText;
    //         return Promise.reject(error);
    //     }

    //     console.log('data',data);
    //     return data;
    // });
}

const { User }          = require('../models');
const authService       = require('../services/auth.service');
const { to, ReE, ReS, encrypt, decrypt, emailUtil }  = require('../services/util.service');
const userService       = require('../services/user.service');
const WEB_URL = 'http://localhost:8080';


const create = async function(req, res){ 
    const body = req.body.user; 
    if(!body.unique_key && !body.email && !body.phone){
        return ReE(res, 'Please enter an email or phone number to register.');
    } else if(!body.password){
        return ReE(res, 'Please enter a password to register.');
    }else{
        let err, user;

        [err, user] = await to(authService.createUser(body));

        if(err) return ReE(res, err, 422); 
        //var activeuserkey = encrypt('ABC_'+user.id); 
        var emailBody = '<table width="100%">';
        emailBody += '<tr>';
        emailBody += '<td>Hello '+body.first_name+' '+body.last_name+'</td>';
        emailBody += '</tr>';
        emailBody += '<tr>';
        emailBody += '<td>Thank you for register on our application.Please click on below link and active your account.</td>';
        emailBody += '</tr>';
        emailBody += '<tr>';
        emailBody += '<td><a href="http://localhost:8080/api/user/active/'+user.id+'">Click here</a></td>';
        emailBody += '</tr>';
        emailBody += '</table>';
        emailUtil(body.email,emailBody,'Registation Invitation.',req, res);
        return ReS(res, {message:'Successfully created new user.', user:user.toWeb(), token:user.getJWT()}, 201);
    }
}
module.exports.create = create;

const getUserDetail = async function(req, res){
    console.log('POPOPOPOPOPO');
    let err, user;
    [err, user] = await to(User.findById(req.body.id));  
    if(err){
        return ReE(res, err);
    } 
    // let company = req.company;
    return ReS(res, {user:user.toWeb()});
}
module.exports.getUserDetail = getUserDetail;

const update = async function(req, res){
    let err, user, data
    user = req.user;
    data = req.body.allUserInfo;
    user.set(data);
    [err, user] = await to(user.save());
    if(err){
        if(err.message=='Validation error') err = 'The email address or phone number is already in use';
        return ReE(res, err);
    }
    return ReS(res, {message :'Updated User: '+user.email});
}
module.exports.update = update;

const remove = async function(req, res){
    let user, err;
    user = req.user;
    user.remove_by_admin = 1;
 
    [err, user] = await to(user.save()); 
    if(err) return ReE(res, 'error occured trying to delete user');
   
    return ReS(res, {message:'Deleted successfully.'}, 204);
}
module.exports.remove = remove;

const login = async function(req, res){
    const body = req.body; 
    let err, user;
    [err, user] = await to(authService.authUser(req.body));
    if(err) return ReE(res, err, 422);
    if(user.remove_by_admin == 1) return ReE(res, 'Your account is deleted by admin');
    if(user.active == 0) return ReE(res, 'Your account is not verfied.');
    return ReS(res, {token:user.getJWT(), user:user.toWeb()});
}
module.exports.login = login;

const resetPassword = async function(req, res){
    
    const body = req.body.user;
    
    if(!body.email){
        return ReE(res, 'Please enter an email.');
    } else { 
        let err, user;
        [err, user] = await to(userService.authUserByEmail(req.body.user));
        if(err) return ReE(res, err, 422); 

        //console.log(user);

        var resetpasskey = encrypt(req.body.user.email);
        console.log(resetpasskey);
        user.forget_password = resetpasskey;
        [err, user] = await to(user.save());
        
        // outputs hello world
        console.log(decrypt(resetpasskey));
        
        var emailBody = '<table width="100%">';
        emailBody += '<tr>';
        emailBody += '<td>Please click on below link and reset your password.</td>';
        emailBody += '</tr>';
        emailBody += '<tr>';
        emailBody += '<td>Your Token : '+resetpasskey+'</td>';
        emailBody += '</tr>';
        emailBody += '<tr>';
        emailBody += '<td><a href="'+WEB_URL+'/resettoken">Click here</a></td>';
        emailBody += '</tr>';
        emailBody += '</table>';
        emailUtil(body.email,emailBody,'Reset Password.',req, res);
        return ReS(res, {message:"send password to mail"});
    }
}
module.exports.resetPassword = resetPassword;
    
const getPasswordApplied = async function(req, res){
    console.log(req.body);
    var body = req.body.passwordInfo;
    let err, user;
    [err, user] = await to(userService.checkByTokenAndUpdtPass(body)); 
    if(err) return ReE(res, err, 422);     
    return ReS(res, {message:"send password to mail",data:req.body.passwordInfo});
}
module.exports.getPasswordApplied = getPasswordApplied;

const activeRegisteredUser = async function(req, res){
    
    var activeuserkey = req.params.activeuserkey; 
    //console.log(decrypt(activeuserkey));
    let err, user;
    [err, user] = await to(userService.activeUserById(activeuserkey));     
    return ReS(res, {message:"Your account successfully activated."});
}
module.exports.activeRegisteredUser = activeRegisteredUser;

const setProfile = async function(req, res){
    
    var activeuserkey = req.params.activeuserkey; 
    //console.log(decrypt(activeuserkey));
    let err, user;
    [err, user] = await to(userService.activeUserById(activeuserkey));     
    return ReS(res, {message:"Your account successfully activated."});
}
module.exports.setProfile = setProfile;


//********* Change Password **********
const changePassword = async function (req, res) {

    let body = req.body;
    let newPassword = body.newPassword;
    let confirmPassword = body.confirmPassword;

    if (newPassword != confirmPassword) {
        return ReS(res, { message: "New password and repeat password does not match." });
    } else {
        [err, user] = await to(userService.changePassword(req.user, body));
        if (err) return ReE(res, err, 422);
        return ReS(res, { message: "Password change successfully." });
    }
}
module.exports.changePassword = changePassword;

const getAllUsers = async function (req, res) {

    let err, user 
    [err, user] = await to(User.findAll());
    if(err){
        if(err.message=='Validation error') err = 'Unable to found any user.';
        return ReE(res, err);
    }
    return ReS(res, {message :'Found all users ',users:user});
}
module.exports.getAllUsers = getAllUsers;


const createUser = async function(req, res){ 
    console.log(req.body.user);
    const body = req.body.user; 
    if(!body.unique_key && !body.email && !body.phone){
        return ReE(res, 'Please enter an email or phone number to register.');
    } else if(!body.password){
        return ReE(res, 'Please enter a password to register.');
    }else{
        let err, user;

        [err, user] = await to(authService.createUser(body));

        if(err) return ReE(res, err, 422); 
        //var activeuserkey = encrypt('ABC_'+user.id); 
        var emailBody = '<table width="100%">';
        emailBody += '<tr>';
        emailBody += '<td>Hello '+body.first_name+' '+body.last_name+'</td>';
        emailBody += '</tr>';
        emailBody += '<tr>';
        emailBody += '<td>Admin created your account.Please click on below link and active your account.</td>';
        emailBody += '</tr>';
        emailBody += '<tr>';
        emailBody += '<td><a href="http://localhost:8080/api/user/active/'+user.id+'">Click here</a></td>';
        emailBody += '</tr>';
        emailBody += '</table>';
        emailUtil(body.email,emailBody,'Registation Invitation.',req, res);

        return ReS(res, {message:'Successfully created new user.', user:user.toWeb(), token:user.getJWT()}, 201);
    }
}
module.exports.createUser = createUser;

const { to, ReE, ReS } = require('../services/util.service');

const Dashboard = function(req, res){
	let user = req.user.id;
	return res.json({success:true, message:'it worked', data:'user name is :'});
}
module.exports.Dashboard = Dashboard


const { User }          = require('../models');
const authService       = require('../services/auth.service');
const { to, ReE, ReS, encrypt, decrypt, emailUtil }  = require('../services/util.service');
const userService       = require('../services/user.service');
const WEB_URL = 'http://localhost:8080';


const create = async function(req, res){ 
    const body = req.body.user; 
    if(!body.unique_key && !body.email && !body.phone){
        return ReE(res, 'Please enter an email or phone number to register.');
    } else if(!body.password){
        return ReE(res, 'Please enter a password to register.');
    }else{
        let err, user;

        [err, user] = await to(authService.createUser(body));

        if(err) return ReE(res, err, 422); 
        //var activeuserkey = encrypt('ABC_'+user.id); 
        var emailBody = '<table width="100%">';
        emailBody += '<tr>';
        emailBody += '<td>Hello '+body.first_name+' '+body.last_name+'</td>';
        emailBody += '</tr>';
        emailBody += '<tr>';
        emailBody += '<td>Thank you for register on our application.Please click on below link and active your account.</td>';
        emailBody += '</tr>';
        emailBody += '<tr>';
        emailBody += '<td><a href="http://localhost:8080/api/user/active/'+user.id+'">Click here</a></td>';
        emailBody += '</tr>';
        emailBody += '</table>';
        emailUtil(body.email,emailBody,'Registation Invitation.',req, res);
        return ReS(res, {message:'Successfully created new user.', user:user.toWeb(), token:user.getJWT()}, 201);
    }
}
module.exports.create = create;

const getUserDetail = async function(req, res){
    console.log('POPOPOPOPOPO');
    let err, user;
    [err, user] = await to(User.findById(req.body.id));  
    if(err){
        return ReE(res, err);
    } 
    // let company = req.company;
    return ReS(res, {user:user.toWeb()});
}
module.exports.getUserDetail = getUserDetail;

const update = async function(req, res){
    let err, user, data
    user = req.user;
    data = req.body.allUserInfo;
    user.set(data);
    [err, user] = await to(user.save());
    if(err){
        if(err.message=='Validation error') err = 'The email address or phone number is already in use';
        return ReE(res, err);
    }
    return ReS(res, {message :'Updated User: '+user.email});
}
module.exports.update = update;

const remove = async function(req, res){
    let user, err;
    user = req.user;
    user.remove_by_admin = 1;
 
    [err, user] = await to(user.save()); 
    if(err) return ReE(res, 'error occured trying to delete user');
   
    return ReS(res, {message:'Deleted successfully.'}, 204);
}
module.exports.remove = remove;

const login = async function(req, res){
    const body = req.body; 
    let err, user;
    [err, user] = await to(authService.authUser(req.body));
    if(err) return ReE(res, err, 422);
    if(user.remove_by_admin == 1) return ReE(res, 'Your account is deleted by admin');
    if(user.active == 0) return ReE(res, 'Your account is not verfied.');
    return ReS(res, {token:user.getJWT(), user:user.toWeb()});
}
module.exports.login = login;

const resetPassword = async function(req, res){
    
    const body = req.body.user;
    
    if(!body.email){
        return ReE(res, 'Please enter an email.');
    } else { 
        let err, user;
        [err, user] = await to(userService.authUserByEmail(req.body.user));
        if(err) return ReE(res, err, 422); 

        //console.log(user);

        var resetpasskey = encrypt(req.body.user.email);
        console.log(resetpasskey);
        user.forget_password = resetpasskey;
        [err, user] = await to(user.save());
        
        // outputs hello world
        console.log(decrypt(resetpasskey));
        
        var emailBody = '<table width="100%">';
        emailBody += '<tr>';
        emailBody += '<td>Please click on below link and reset your password.</td>';
        emailBody += '</tr>';
        emailBody += '<tr>';
        emailBody += '<td>Your Token : '+resetpasskey+'</td>';
        emailBody += '</tr>';
        emailBody += '<tr>';
        emailBody += '<td><a href="'+WEB_URL+'/resettoken">Click here</a></td>';
        emailBody += '</tr>';
        emailBody += '</table>';
        emailUtil(body.email,emailBody,'Reset Password.',req, res);
        return ReS(res, {message:"send password to mail"});
    }
}
module.exports.resetPassword = resetPassword;
    
const getPasswordApplied = async function(req, res){
    console.log(req.body);
    var body = req.body.passwordInfo;
    let err, user;
    [err, user] = await to(userService.checkByTokenAndUpdtPass(body)); 
    if(err) return ReE(res, err, 422);     
    return ReS(res, {message:"send password to mail",data:req.body.passwordInfo});
}
module.exports.getPasswordApplied = getPasswordApplied;

const activeRegisteredUser = async function(req, res){
    
    var activeuserkey = req.params.activeuserkey; 
    //console.log(decrypt(activeuserkey));
    let err, user;
    [err, user] = await to(userService.activeUserById(activeuserkey));     
    return ReS(res, {message:"Your account successfully activated."});
}
module.exports.activeRegisteredUser = activeRegisteredUser;

const setProfile = async function(req, res){
    
    var activeuserkey = req.params.activeuserkey; 
    //console.log(decrypt(activeuserkey));
    let err, user;
    [err, user] = await to(userService.activeUserById(activeuserkey));     
    return ReS(res, {message:"Your account successfully activated."});
}
module.exports.setProfile = setProfile;


//********* Change Password **********
const changePassword = async function (req, res) {

    let body = req.body;
    let newPassword = body.newPassword;
    let confirmPassword = body.confirmPassword;

    if (newPassword != confirmPassword) {
        return ReS(res, { message: "New password and repeat password does not match." });
    } else {
        [err, user] = await to(userService.changePassword(req.user, body));
        if (err) return ReE(res, err, 422);
        return ReS(res, { message: "Password change successfully." });
    }
}
module.exports.changePassword = changePassword;

const getAllUsers = async function (req, res) {

    let err, user 
    [err, user] = await to(User.findAll());
    if(err){
        if(err.message=='Validation error') err = 'Unable to found any user.';
        return ReE(res, err);
    }
    return ReS(res, {message :'Found all users ',users:user});
}
module.exports.getAllUsers = getAllUsers;


const createUser = async function(req, res){ 
    console.log(req.body.user);
    const body = req.body.user; 
    if(!body.unique_key && !body.email && !body.phone){
        return ReE(res, 'Please enter an email or phone number to register.');
    } else if(!body.password){
        return ReE(res, 'Please enter a password to register.');
    }else{
        let err, user;

        [err, user] = await to(authService.createUser(body));

        if(err) return ReE(res, err, 422); 
        //var activeuserkey = encrypt('ABC_'+user.id); 
        var emailBody = '<table width="100%">';
        emailBody += '<tr>';
        emailBody += '<td>Hello '+body.first_name+' '+body.last_name+'</td>';
        emailBody += '</tr>';
        emailBody += '<tr>';
        emailBody += '<td>Admin created your account.Please click on below link and active your account.</td>';
        emailBody += '</tr>';
        emailBody += '<tr>';
        emailBody += '<td><a href="http://localhost:8080/api/user/active/'+user.id+'">Click here</a></td>';
        emailBody += '</tr>';
        emailBody += '</table>';
        emailUtil(body.email,emailBody,'Registation Invitation.',req, res);

        return ReS(res, {message:'Successfully created new user.', user:user.toWeb(), token:user.getJWT()}, 201);
    }
}
module.exports.createUser = createUser;


import config from 'config';
import { authHeader } from '../_helpers';
import axios from 'axios';
var Usertoken = localStorage.getItem('user'); 
var tokenObj = JSON.parse(Usertoken); 

 

export const userService = {
    login,
    logout,
    register,
    getAll,
    getById,
    update,
    delete: _delete,
    forgetpassword,
    resettoken,
    dashboard,
    profile,
    getAllCompanies,
    addCompany,
    getCompaniesDetails,
    changePassword,
    getAllUsers,
    getUserDetails,
    updateUserDetails,
    addUser
};

function login(email, password) { 
    const userInfo = {
        email: email,
        password: password 
    };   
    return axios.post(`${config.apiUrl}/api/users/login`, userInfo)
        //.then(handleResponse)
        .then(function(response){
            if (response.data.token) { 
                localStorage.setItem('user', JSON.stringify(response.data));               
            }
        });
}

function logout() {
    // remove user from local storage to log user out
    //localStorage.removeItem('user');
}

function getAll() {
    const requestOptions = {
        method: 'GET',
        headers: authHeader()
    };

    return fetch(`${config.apiUrl}/users`, requestOptions).then(handleResponse);
}

function getById(id) {
    const requestOptions = {
        method: 'GET',
        headers: authHeader()
    };

    return fetch(`${config.apiUrl}/users/${id}`, requestOptions).then(handleResponse);
}

function register(user) { 

    return axios({
        method: 'POST',
        url: `${config.apiUrl}/api/users`,
        headers: { 'Content-Type': 'application/json'},
        data: {user:user}
    }).then(handleResponse);   
}

function update(user) {
    const requestOptions = {
        method: 'PUT',
        headers: { ...authHeader(), 'Content-Type': 'application/json' },
        body: JSON.stringify(user)
    };

    return fetch(`${config.apiUrl}/users/${user.id}`, requestOptions).then(handleResponse);;
}

// prefixed function name with underscore because delete is a reserved word in javascript
function _delete(id) {
    const requestOptions = {
        method: 'DELETE',
        headers: authHeader()
    };

    return fetch(`${config.apiUrl}/users/${id}`, requestOptions).then(handleResponse);
}

function forgetpassword(user) { 
    return axios({
        method: 'POST',
        url: `${config.apiUrl}/api/resetpassword`,
        headers: { 'Content-Type': 'application/json'},
        data: {user:user}
    }).then(handleResponse);  
}

function resettoken(passwordInfo) {      
    return axios({
        method: 'POST',
        url: `${config.apiUrl}/api/resetpasswordapplied`,
        headers: { 'Content-Type': 'application/json'},
        data: {passwordInfo:passwordInfo}
    }).then(handleResponse);  
}

function dashboard(loggedInUserInfo) { 
    const requestOptions = {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(loggedInUserInfo)
    };
     
    return fetch(`${config.apiUrl}/api/dashboard`, requestOptions).then(handleResponse);
}

function profile(loggedInUserInfo) { 
    const requestOptions = {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(loggedInUserInfo)
    };
     
    return fetch(`${config.apiUrl}/api/profile`, requestOptions).then(handleResponse);
}

function getAllCompanies() { 
    return axios({
        method: 'POST',
        url: `${config.apiUrl}/api/companies/all`,
        headers: { 'Content-Type': 'application/json', 'Authorization' : tokenObj.token },
    }).then(handleResponse); 
}

function addCompany(companyInfo) {
    const requestOptions = {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization' : tokenObj.token },
        body: JSON.stringify(companyInfo)
    };     
    return fetch(`${config.apiUrl}/api/companies`, requestOptions).then(handleResponse);
}

function getCompaniesDetails(id) {
    return axios({
        method: 'POST',
        url: `${config.apiUrl}/api/companiesdetail`,
        headers: { 'Content-Type': 'application/json', 'Authorization' : tokenObj.token },
        data: {id:id}
    }).then(handleResponse);     
}

function changePassword(changePasswordInfo) {
    const requestOptions = {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization' : tokenObj.token },
        body: JSON.stringify(changePasswordInfo)
    };   
    return fetch(`${config.apiUrl}/api/users/changepassword`, requestOptions).then(handleResponse);
}

function getAllUsers() { 
    return axios({
        method: 'POST',
        url: `${config.apiUrl}/api/users/all`,
        headers: { 'Content-Type': 'application/json', 'Authorization' : tokenObj.token },
    }).then(handleResponse); 
}

function getUserDetails(id) {
    return axios({
        method: 'POST',
        url: `${config.apiUrl}/api/users/userdetail`,
        headers: { 'Content-Type': 'application/json', 'Authorization' : tokenObj.token },
        data: {id:id}
    }).then(handleResponse);     
}

function updateUserDetails(allUserInfo) {
    return axios({
        method: 'POST',
        url: `${config.apiUrl}/api/users/updateuserdetail`,
        headers: { 'Content-Type': 'application/json', 'Authorization' : tokenObj.token },
        data: {allUserInfo:allUserInfo}
    }).then(handleResponse);     
}

function addUser(user) {
    return axios({
        method: 'POST',
        url: `${config.apiUrl}/api/users/adduserbyadmin`,
        headers: { 'Content-Type': 'application/json', 'Authorization' : tokenObj.token },
        data: {user:user}
    }).then(handleResponse);     
} 

function handleResponse(response) { 
    if(response.status = 200){
        return response;
    } else {
        const error = (data && data.message) || response.statusText;
        return Promise.reject(error);
    }

    // return response.text().then(text => {
    //     const data = text && JSON.parse(text);
    //     console.log('data',data);
    // console.log('<<<<<<<<<<<<<<<<<<<<<');
    //     if (!response.ok) {
    //         if (response.status === 401) {
    //             // auto logout if 401 response returned from api
    //             logout();
    //             location.reload(true);
    //         }
    //         const error = (data && data.message) || response.statusText;
    //         return Promise.reject(error);
    //     }

    //     console.log('data',data);
    //     return data;
    // });
}

const { User }          = require('../models');
const authService       = require('../services/auth.service');
const { to, ReE, ReS, encrypt, decrypt, emailUtil }  = require('../services/util.service');
const userService       = require('../services/user.service');
const WEB_URL = 'http://localhost:8080';


const create = async function(req, res){ 
    const body = req.body.user; 
    if(!body.unique_key && !body.email && !body.phone){
        return ReE(res, 'Please enter an email or phone number to register.');
    } else if(!body.password){
        return ReE(res, 'Please enter a password to register.');
    }else{
        let err, user;

        [err, user] = await to(authService.createUser(body));

        if(err) return ReE(res, err, 422); 
        //var activeuserkey = encrypt('ABC_'+user.id); 
        var emailBody = '<table width="100%">';
        emailBody += '<tr>';
        emailBody += '<td>Hello '+body.first_name+' '+body.last_name+'</td>';
        emailBody += '</tr>';
        emailBody += '<tr>';
        emailBody += '<td>Thank you for register on our application.Please click on below link and active your account.</td>';
        emailBody += '</tr>';
        emailBody += '<tr>';
        emailBody += '<td><a href="http://localhost:8080/api/user/active/'+user.id+'">Click here</a></td>';
        emailBody += '</tr>';
        emailBody += '</table>';
        emailUtil(body.email,emailBody,'Registation Invitation.',req, res);
        return ReS(res, {message:'Successfully created new user.', user:user.toWeb(), token:user.getJWT()}, 201);
    }
}
module.exports.create = create;

const getUserDetail = async function(req, res){
    console.log('POPOPOPOPOPO');
    let err, user;
    [err, user] = await to(User.findById(req.body.id));  
    if(err){
        return ReE(res, err);
    } 
    // let company = req.company;
    return ReS(res, {user:user.toWeb()});
}
module.exports.getUserDetail = getUserDetail;

const update = async function(req, res){
    let err, user, data
    user = req.user;
    data = req.body.allUserInfo;
    user.set(data);
    [err, user] = await to(user.save());
    if(err){
        if(err.message=='Validation error') err = 'The email address or phone number is already in use';
        return ReE(res, err);
    }
    return ReS(res, {message :'Updated User: '+user.email});
}
module.exports.update = update;

const remove = async function(req, res){
    let user, err;
    user = req.user;
    user.remove_by_admin = 1;
 
    [err, user] = await to(user.save()); 
    if(err) return ReE(res, 'error occured trying to delete user');
   
    return ReS(res, {message:'Deleted successfully.'}, 204);
}
module.exports.remove = remove;

const login = async function(req, res){
    const body = req.body; 
    let err, user;
    [err, user] = await to(authService.authUser(req.body));
    if(err) return ReE(res, err, 422);
    if(user.remove_by_admin == 1) return ReE(res, 'Your account is deleted by admin');
    if(user.active == 0) return ReE(res, 'Your account is not verfied.');
    return ReS(res, {token:user.getJWT(), user:user.toWeb()});
}
module.exports.login = login;

const resetPassword = async function(req, res){
    
    const body = req.body.user;
    
    if(!body.email){
        return ReE(res, 'Please enter an email.');
    } else { 
        let err, user;
        [err, user] = await to(userService.authUserByEmail(req.body.user));
        if(err) return ReE(res, err, 422); 

        //console.log(user);

        var resetpasskey = encrypt(req.body.user.email);
        console.log(resetpasskey);
        user.forget_password = resetpasskey;
        [err, user] = await to(user.save());
        
        // outputs hello world
        console.log(decrypt(resetpasskey));
        
        var emailBody = '<table width="100%">';
        emailBody += '<tr>';
        emailBody += '<td>Please click on below link and reset your password.</td>';
        emailBody += '</tr>';
        emailBody += '<tr>';
        emailBody += '<td>Your Token : '+resetpasskey+'</td>';
        emailBody += '</tr>';
        emailBody += '<tr>';
        emailBody += '<td><a href="'+WEB_URL+'/resettoken">Click here</a></td>';
        emailBody += '</tr>';
        emailBody += '</table>';
        emailUtil(body.email,emailBody,'Reset Password.',req, res);
        return ReS(res, {message:"send password to mail"});
    }
}
module.exports.resetPassword = resetPassword;
    
const getPasswordApplied = async function(req, res){
    console.log(req.body);
    var body = req.body.passwordInfo;
    let err, user;
    [err, user] = await to(userService.checkByTokenAndUpdtPass(body)); 
    if(err) return ReE(res, err, 422);     
    return ReS(res, {message:"send password to mail",data:req.body.passwordInfo});
}
module.exports.getPasswordApplied = getPasswordApplied;

const activeRegisteredUser = async function(req, res){
    
    var activeuserkey = req.params.activeuserkey; 
    //console.log(decrypt(activeuserkey));
    let err, user;
    [err, user] = await to(userService.activeUserById(activeuserkey));     
    return ReS(res, {message:"Your account successfully activated."});
}
module.exports.activeRegisteredUser = activeRegisteredUser;

const setProfile = async function(req, res){
    
    var activeuserkey = req.params.activeuserkey; 
    //console.log(decrypt(activeuserkey));
    let err, user;
    [err, user] = await to(userService.activeUserById(activeuserkey));     
    return ReS(res, {message:"Your account successfully activated."});
}
module.exports.setProfile = setProfile;


//********* Change Password **********
const changePassword = async function (req, res) {

    let body = req.body;
    let newPassword = body.newPassword;
    let confirmPassword = body.confirmPassword;

    if (newPassword != confirmPassword) {
        return ReS(res, { message: "New password and repeat password does not match." });
    } else {
        [err, user] = await to(userService.changePassword(req.user, body));
        if (err) return ReE(res, err, 422);
        return ReS(res, { message: "Password change successfully." });
    }
}
module.exports.changePassword = changePassword;

const getAllUsers = async function (req, res) {

    let err, user 
    [err, user] = await to(User.findAll());
    if(err){
        if(err.message=='Validation error') err = 'Unable to found any user.';
        return ReE(res, err);
    }
    return ReS(res, {message :'Found all users ',users:user});
}
module.exports.getAllUsers = getAllUsers;


const createUser = async function(req, res){ 
    console.log(req.body.user);
    const body = req.body.user; 
    if(!body.unique_key && !body.email && !body.phone){
        return ReE(res, 'Please enter an email or phone number to register.');
    } else if(!body.password){
        return ReE(res, 'Please enter a password to register.');
    }else{
        let err, user;

        [err, user] = await to(authService.createUser(body));

        if(err) return ReE(res, err, 422); 
        //var activeuserkey = encrypt('ABC_'+user.id); 
        var emailBody = '<table width="100%">';
        emailBody += '<tr>';
        emailBody += '<td>Hello '+body.first_name+' '+body.last_name+'</td>';
        emailBody += '</tr>';
        emailBody += '<tr>';
        emailBody += '<td>Admin created your account.Please click on below link and active your account.</td>';
        emailBody += '</tr>';
        emailBody += '<tr>';
        emailBody += '<td><a href="http://localhost:8080/api/user/active/'+user.id+'">Click here</a></td>';
        emailBody += '</tr>';
        emailBody += '</table>';
        emailUtil(body.email,emailBody,'Registation Invitation.',req, res);

        return ReS(res, {message:'Successfully created new user.', user:user.toWeb(), token:user.getJWT()}, 201);
    }
}
module.exports.createUser = createUser;

const { to, ReE, ReS } = require('../services/util.service');

const Dashboard = function(req, res){
	let user = req.user.id;
	return res.json({success:true, message:'it worked', data:'user name is :'});
}
module.exports.Dashboard = Dashboard


const { User }          = require('../models');
const authService       = require('../services/auth.service');
const { to, ReE, ReS, encrypt, decrypt, emailUtil }  = require('../services/util.service');
const userService       = require('../services/user.service');
const WEB_URL = 'http://localhost:8080';


const create = async function(req, res){ 
    const body = req.body.user; 
    if(!body.unique_key && !body.email && !body.phone){
        return ReE(res, 'Please enter an email or phone number to register.');
    } else if(!body.password){
        return ReE(res, 'Please enter a password to register.');
    }else{
        let err, user;

        [err, user] = await to(authService.createUser(body));

        if(err) return ReE(res, err, 422); 
        //var activeuserkey = encrypt('ABC_'+user.id); 
        var emailBody = '<table width="100%">';
        emailBody += '<tr>';
        emailBody += '<td>Hello '+body.first_name+' '+body.last_name+'</td>';
        emailBody += '</tr>';
        emailBody += '<tr>';
        emailBody += '<td>Thank you for register on our application.Please click on below link and active your account.</td>';
        emailBody += '</tr>';
        emailBody += '<tr>';
        emailBody += '<td><a href="http://localhost:8080/api/user/active/'+user.id+'">Click here</a></td>';
        emailBody += '</tr>';
        emailBody += '</table>';
        emailUtil(body.email,emailBody,'Registation Invitation.',req, res);
        return ReS(res, {message:'Successfully created new user.', user:user.toWeb(), token:user.getJWT()}, 201);
    }
}
module.exports.create = create;

const getUserDetail = async function(req, res){
    console.log('POPOPOPOPOPO');
    let err, user;
    [err, user] = await to(User.findById(req.body.id));  
    if(err){
        return ReE(res, err);
    } 
    // let company = req.company;
    return ReS(res, {user:user.toWeb()});
}
module.exports.getUserDetail = getUserDetail;

const update = async function(req, res){
    let err, user, data
    user = req.user;
    data = req.body.allUserInfo;
    user.set(data);
    [err, user] = await to(user.save());
    if(err){
        if(err.message=='Validation error') err = 'The email address or phone number is already in use';
        return ReE(res, err);
    }
    return ReS(res, {message :'Updated User: '+user.email});
}
module.exports.update = update;

const remove = async function(req, res){
    let user, err;
    user = req.user;
    user.remove_by_admin = 1;
 
    [err, user] = await to(user.save()); 
    if(err) return ReE(res, 'error occured trying to delete user');
   
    return ReS(res, {message:'Deleted successfully.'}, 204);
}
module.exports.remove = remove;

const login = async function(req, res){
    const body = req.body; 
    let err, user;
    [err, user] = await to(authService.authUser(req.body));
    if(err) return ReE(res, err, 422);
    if(user.remove_by_admin == 1) return ReE(res, 'Your account is deleted by admin');
    if(user.active == 0) return ReE(res, 'Your account is not verfied.');
    return ReS(res, {token:user.getJWT(), user:user.toWeb()});
}
module.exports.login = login;

const resetPassword = async function(req, res){
    
    const body = req.body.user;
    
    if(!body.email){
        return ReE(res, 'Please enter an email.');
    } else { 
        let err, user;
        [err, user] = await to(userService.authUserByEmail(req.body.user));
        if(err) return ReE(res, err, 422); 

        //console.log(user);

        var resetpasskey = encrypt(req.body.user.email);
        console.log(resetpasskey);
        user.forget_password = resetpasskey;
        [err, user] = await to(user.save());
        
        // outputs hello world
        console.log(decrypt(resetpasskey));
        
        var emailBody = '<table width="100%">';
        emailBody += '<tr>';
        emailBody += '<td>Please click on below link and reset your password.</td>';
        emailBody += '</tr>';
        emailBody += '<tr>';
        emailBody += '<td>Your Token : '+resetpasskey+'</td>';
        emailBody += '</tr>';
        emailBody += '<tr>';
        emailBody += '<td><a href="'+WEB_URL+'/resettoken">Click here</a></td>';
        emailBody += '</tr>';
        emailBody += '</table>';
        emailUtil(body.email,emailBody,'Reset Password.',req, res);
        return ReS(res, {message:"send password to mail"});
    }
}
module.exports.resetPassword = resetPassword;
    
const getPasswordApplied = async function(req, res){
    console.log(req.body);
    var body = req.body.passwordInfo;
    let err, user;
    [err, user] = await to(userService.checkByTokenAndUpdtPass(body)); 
    if(err) return ReE(res, err, 422);     
    return ReS(res, {message:"send password to mail",data:req.body.passwordInfo});
}
module.exports.getPasswordApplied = getPasswordApplied;

const activeRegisteredUser = async function(req, res){
    
    var activeuserkey = req.params.activeuserkey; 
    //console.log(decrypt(activeuserkey));
    let err, user;
    [err, user] = await to(userService.activeUserById(activeuserkey));     
    return ReS(res, {message:"Your account successfully activated."});
}
module.exports.activeRegisteredUser = activeRegisteredUser;

const setProfile = async function(req, res){
    
    var activeuserkey = req.params.activeuserkey; 
    //console.log(decrypt(activeuserkey));
    let err, user;
    [err, user] = await to(userService.activeUserById(activeuserkey));     
    return ReS(res, {message:"Your account successfully activated."});
}
module.exports.setProfile = setProfile;


//********* Change Password **********
const changePassword = async function (req, res) {

    let body = req.body;
    let newPassword = body.newPassword;
    let confirmPassword = body.confirmPassword;

    if (newPassword != confirmPassword) {
        return ReS(res, { message: "New password and repeat password does not match." });
    } else {
        [err, user] = await to(userService.changePassword(req.user, body));
        if (err) return ReE(res, err, 422);
        return ReS(res, { message: "Password change successfully." });
    }
}
module.exports.changePassword = changePassword;

const getAllUsers = async function (req, res) {

    let err, user 
    [err, user] = await to(User.findAll());
    if(err){
        if(err.message=='Validation error') err = 'Unable to found any user.';
        return ReE(res, err);
    }
    return ReS(res, {message :'Found all users ',users:user});
}
module.exports.getAllUsers = getAllUsers;


const createUser = async function(req, res){ 
    console.log(req.body.user);
    const body = req.body.user; 
    if(!body.unique_key && !body.email && !body.phone){
        return ReE(res, 'Please enter an email or phone number to register.');
    } else if(!body.password){
        return ReE(res, 'Please enter a password to register.');
    }else{
        let err, user;

        [err, user] = await to(authService.createUser(body));

        if(err) return ReE(res, err, 422); 
        //var activeuserkey = encrypt('ABC_'+user.id); 
        var emailBody = '<table width="100%">';
        emailBody += '<tr>';
        emailBody += '<td>Hello '+body.first_name+' '+body.last_name+'</td>';
        emailBody += '</tr>';
        emailBody += '<tr>';
        emailBody += '<td>Admin created your account.Please click on below link and active your account.</td>';
        emailBody += '</tr>';
        emailBody += '<tr>';
        emailBody += '<td><a href="http://localhost:8080/api/user/active/'+user.id+'">Click here</a></td>';
        emailBody += '</tr>';
        emailBody += '</table>';
        emailUtil(body.email,emailBody,'Registation Invitation.',req, res);

        return ReS(res, {message:'Successfully created new user.', user:user.toWeb(), token:user.getJWT()}, 201);
    }
}
module.exports.createUser = createUser;


import config from 'config';
import { authHeader } from '../_helpers';
import axios from 'axios';
var Usertoken = localStorage.getItem('user'); 
var tokenObj = JSON.parse(Usertoken); 

 

export const userService = {
    login,
    logout,
    register,
    getAll,
    getById,
    update,
    delete: _delete,
    forgetpassword,
    resettoken,
    dashboard,
    profile,
    getAllCompanies,
    addCompany,
    getCompaniesDetails,
    changePassword,
    getAllUsers,
    getUserDetails,
    updateUserDetails,
    addUser
};

function login(email, password) { 
    const userInfo = {
        email: email,
        password: password 
    };   
    return axios.post(`${config.apiUrl}/api/users/login`, userInfo)
        //.then(handleResponse)
        .then(function(response){
            if (response.data.token) { 
                localStorage.setItem('user', JSON.stringify(response.data));               
            }
        });
}

function logout() {
    // remove user from local storage to log user out
    //localStorage.removeItem('user');
}

function getAll() {
    const requestOptions = {
        method: 'GET',
        headers: authHeader()
    };

    return fetch(`${config.apiUrl}/users`, requestOptions).then(handleResponse);
}

function getById(id) {
    const requestOptions = {
        method: 'GET',
        headers: authHeader()
    };

    return fetch(`${config.apiUrl}/users/${id}`, requestOptions).then(handleResponse);
}

function register(user) { 

    return axios({
        method: 'POST',
        url: `${config.apiUrl}/api/users`,
        headers: { 'Content-Type': 'application/json'},
        data: {user:user}
    }).then(handleResponse);   
}

function update(user) {
    const requestOptions = {
        method: 'PUT',
        headers: { ...authHeader(), 'Content-Type': 'application/json' },
        body: JSON.stringify(user)
    };

    return fetch(`${config.apiUrl}/users/${user.id}`, requestOptions).then(handleResponse);;
}

// prefixed function name with underscore because delete is a reserved word in javascript
function _delete(id) {
    const requestOptions = {
        method: 'DELETE',
        headers: authHeader()
    };

    return fetch(`${config.apiUrl}/users/${id}`, requestOptions).then(handleResponse);
}

function forgetpassword(user) { 
    return axios({
        method: 'POST',
        url: `${config.apiUrl}/api/resetpassword`,
        headers: { 'Content-Type': 'application/json'},
        data: {user:user}
    }).then(handleResponse);  
}

function resettoken(passwordInfo) {      
    return axios({
        method: 'POST',
        url: `${config.apiUrl}/api/resetpasswordapplied`,
        headers: { 'Content-Type': 'application/json'},
        data: {passwordInfo:passwordInfo}
    }).then(handleResponse);  
}

function dashboard(loggedInUserInfo) { 
    const requestOptions = {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(loggedInUserInfo)
    };
     
    return fetch(`${config.apiUrl}/api/dashboard`, requestOptions).then(handleResponse);
}

function profile(loggedInUserInfo) { 
    const requestOptions = {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(loggedInUserInfo)
    };
     
    return fetch(`${config.apiUrl}/api/profile`, requestOptions).then(handleResponse);
}

function getAllCompanies() { 
    return axios({
        method: 'POST',
        url: `${config.apiUrl}/api/companies/all`,
        headers: { 'Content-Type': 'application/json', 'Authorization' : tokenObj.token },
    }).then(handleResponse); 
}

function addCompany(companyInfo) {
    const requestOptions = {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization' : tokenObj.token },
        body: JSON.stringify(companyInfo)
    };     
    return fetch(`${config.apiUrl}/api/companies`, requestOptions).then(handleResponse);
}

function getCompaniesDetails(id) {
    return axios({
        method: 'POST',
        url: `${config.apiUrl}/api/companiesdetail`,
        headers: { 'Content-Type': 'application/json', 'Authorization' : tokenObj.token },
        data: {id:id}
    }).then(handleResponse);     
}

function changePassword(changePasswordInfo) {
    const requestOptions = {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization' : tokenObj.token },
        body: JSON.stringify(changePasswordInfo)
    };   
    return fetch(`${config.apiUrl}/api/users/changepassword`, requestOptions).then(handleResponse);
}

function getAllUsers() { 
    return axios({
        method: 'POST',
        url: `${config.apiUrl}/api/users/all`,
        headers: { 'Content-Type': 'application/json', 'Authorization' : tokenObj.token },
    }).then(handleResponse); 
}

function getUserDetails(id) {
    return axios({
        method: 'POST',
        url: `${config.apiUrl}/api/users/userdetail`,
        headers: { 'Content-Type': 'application/json', 'Authorization' : tokenObj.token },
        data: {id:id}
    }).then(handleResponse);     
}

function updateUserDetails(allUserInfo) {
    return axios({
        method: 'POST',
        url: `${config.apiUrl}/api/users/updateuserdetail`,
        headers: { 'Content-Type': 'application/json', 'Authorization' : tokenObj.token },
        data: {allUserInfo:allUserInfo}
    }).then(handleResponse);     
}

function addUser(user) {
    return axios({
        method: 'POST',
        url: `${config.apiUrl}/api/users/adduserbyadmin`,
        headers: { 'Content-Type': 'application/json', 'Authorization' : tokenObj.token },
        data: {user:user}
    }).then(handleResponse);     
} 

function handleResponse(response) { 
    if(response.status = 200){
        return response;
    } else {
        const error = (data && data.message) || response.statusText;
        return Promise.reject(error);
    }

    // return response.text().then(text => {
    //     const data = text && JSON.parse(text);
    //     console.log('data',data);
    // console.log('<<<<<<<<<<<<<<<<<<<<<');
    //     if (!response.ok) {
    //         if (response.status === 401) {
    //             // auto logout if 401 response returned from api
    //             logout();
    //             location.reload(true);
    //         }
    //         const error = (data && data.message) || response.statusText;
    //         return Promise.reject(error);
    //     }

    //     console.log('data',data);
    //     return data;
    // });
}

const { User }          = require('../models');
const authService       = require('../services/auth.service');
const { to, ReE, ReS, encrypt, decrypt, emailUtil }  = require('../services/util.service');
const userService       = require('../services/user.service');
const WEB_URL = 'http://localhost:8080';


const create = async function(req, res){ 
    const body = req.body.user; 
    if(!body.unique_key && !body.email && !body.phone){
        return ReE(res, 'Please enter an email or phone number to register.');
    } else if(!body.password){
        return ReE(res, 'Please enter a password to register.');
    }else{
        let err, user;

        [err, user] = await to(authService.createUser(body));

        if(err) return ReE(res, err, 422); 
        //var activeuserkey = encrypt('ABC_'+user.id); 
        var emailBody = '<table width="100%">';
        emailBody += '<tr>';
        emailBody += '<td>Hello '+body.first_name+' '+body.last_name+'</td>';
        emailBody += '</tr>';
        emailBody += '<tr>';
        emailBody += '<td>Thank you for register on our application.Please click on below link and active your account.</td>';
        emailBody += '</tr>';
        emailBody += '<tr>';
        emailBody += '<td><a href="http://localhost:8080/api/user/active/'+user.id+'">Click here</a></td>';
        emailBody += '</tr>';
        emailBody += '</table>';
        emailUtil(body.email,emailBody,'Registation Invitation.',req, res);
        return ReS(res, {message:'Successfully created new user.', user:user.toWeb(), token:user.getJWT()}, 201);
    }
}
module.exports.create = create;

const getUserDetail = async function(req, res){
    console.log('POPOPOPOPOPO');
    let err, user;
    [err, user] = await to(User.findById(req.body.id));  
    if(err){
        return ReE(res, err);
    } 
    // let company = req.company;
    return ReS(res, {user:user.toWeb()});
}
module.exports.getUserDetail = getUserDetail;

const update = async function(req, res){
    let err, user, data
    user = req.user;
    data = req.body.allUserInfo;
    user.set(data);
    [err, user] = await to(user.save());
    if(err){
        if(err.message=='Validation error') err = 'The email address or phone number is already in use';
        return ReE(res, err);
    }
    return ReS(res, {message :'Updated User: '+user.email});
}
module.exports.update = update;

const remove = async function(req, res){
    let user, err;
    user = req.user;
    user.remove_by_admin = 1;
 
    [err, user] = await to(user.save()); 
    if(err) return ReE(res, 'error occured trying to delete user');
   
    return ReS(res, {message:'Deleted successfully.'}, 204);
}
module.exports.remove = remove;

const login = async function(req, res){
    const body = req.body; 
    let err, user;
    [err, user] = await to(authService.authUser(req.body));
    if(err) return ReE(res, err, 422);
    if(user.remove_by_admin == 1) return ReE(res, 'Your account is deleted by admin');
    if(user.active == 0) return ReE(res, 'Your account is not verfied.');
    return ReS(res, {token:user.getJWT(), user:user.toWeb()});
}
module.exports.login = login;

const resetPassword = async function(req, res){
    
    const body = req.body.user;
    
    if(!body.email){
        return ReE(res, 'Please enter an email.');
    } else { 
        let err, user;
        [err, user] = await to(userService.authUserByEmail(req.body.user));
        if(err) return ReE(res, err, 422); 

        //console.log(user);

        var resetpasskey = encrypt(req.body.user.email);
        console.log(resetpasskey);
        user.forget_password = resetpasskey;
        [err, user] = await to(user.save());
        
        // outputs hello world
        console.log(decrypt(resetpasskey));
        
        var emailBody = '<table width="100%">';
        emailBody += '<tr>';
        emailBody += '<td>Please click on below link and reset your password.</td>';
        emailBody += '</tr>';
        emailBody += '<tr>';
        emailBody += '<td>Your Token : '+resetpasskey+'</td>';
        emailBody += '</tr>';
        emailBody += '<tr>';
        emailBody += '<td><a href="'+WEB_URL+'/resettoken">Click here</a></td>';
        emailBody += '</tr>';
        emailBody += '</table>';
        emailUtil(body.email,emailBody,'Reset Password.',req, res);
        return ReS(res, {message:"send password to mail"});
    }
}
module.exports.resetPassword = resetPassword;
    
const getPasswordApplied = async function(req, res){
    console.log(req.body);
    var body = req.body.passwordInfo;
    let err, user;
    [err, user] = await to(userService.checkByTokenAndUpdtPass(body)); 
    if(err) return ReE(res, err, 422);     
    return ReS(res, {message:"send password to mail",data:req.body.passwordInfo});
}
module.exports.getPasswordApplied = getPasswordApplied;

const activeRegisteredUser = async function(req, res){
    
    var activeuserkey = req.params.activeuserkey; 
    //console.log(decrypt(activeuserkey));
    let err, user;
    [err, user] = await to(userService.activeUserById(activeuserkey));     
    return ReS(res, {message:"Your account successfully activated."});
}
module.exports.activeRegisteredUser = activeRegisteredUser;

const setProfile = async function(req, res){
    
    var activeuserkey = req.params.activeuserkey; 
    //console.log(decrypt(activeuserkey));
    let err, user;
    [err, user] = await to(userService.activeUserById(activeuserkey));     
    return ReS(res, {message:"Your account successfully activated."});
}
module.exports.setProfile = setProfile;


//********* Change Password **********
const changePassword = async function (req, res) {

    let body = req.body;
    let newPassword = body.newPassword;
    let confirmPassword = body.confirmPassword;

    if (newPassword != confirmPassword) {
        return ReS(res, { message: "New password and repeat password does not match." });
    } else {
        [err, user] = await to(userService.changePassword(req.user, body));
        if (err) return ReE(res, err, 422);
        return ReS(res, { message: "Password change successfully." });
    }
}
module.exports.changePassword = changePassword;

const getAllUsers = async function (req, res) {

    let err, user 
    [err, user] = await to(User.findAll());
    if(err){
        if(err.message=='Validation error') err = 'Unable to found any user.';
        return ReE(res, err);
    }
    return ReS(res, {message :'Found all users ',users:user});
}
module.exports.getAllUsers = getAllUsers;


const createUser = async function(req, res){ 
    console.log(req.body.user);
    const body = req.body.user; 
    if(!body.unique_key && !body.email && !body.phone){
        return ReE(res, 'Please enter an email or phone number to register.');
    } else if(!body.password){
        return ReE(res, 'Please enter a password to register.');
    }else{
        let err, user;

        [err, user] = await to(authService.createUser(body));

        if(err) return ReE(res, err, 422); 
        //var activeuserkey = encrypt('ABC_'+user.id); 
        var emailBody = '<table width="100%">';
        emailBody += '<tr>';
        emailBody += '<td>Hello '+body.first_name+' '+body.last_name+'</td>';
        emailBody += '</tr>';
        emailBody += '<tr>';
        emailBody += '<td>Admin created your account.Please click on below link and active your account.</td>';
        emailBody += '</tr>';
        emailBody += '<tr>';
        emailBody += '<td><a href="http://localhost:8080/api/user/active/'+user.id+'">Click here</a></td>';
        emailBody += '</tr>';
        emailBody += '</table>';
        emailUtil(body.email,emailBody,'Registation Invitation.',req, res);

        return ReS(res, {message:'Successfully created new user.', user:user.toWeb(), token:user.getJWT()}, 201);
    }
}
module.exports.createUser = createUser;

const { to, ReE, ReS } = require('../services/util.service');

const Dashboard = function(req, res){
	let user = req.user.id;
	return res.json({success:true, message:'it worked', data:'user name is :'});
}
module.exports.Dashboard = Dashboard


const { User }          = require('../models');
const authService       = require('../services/auth.service');
const { to, ReE, ReS, encrypt, decrypt, emailUtil }  = require('../services/util.service');
const userService       = require('../services/user.service');
const WEB_URL = 'http://localhost:8080';


const create = async function(req, res){ 
    const body = req.body.user; 
    if(!body.unique_key && !body.email && !body.phone){
        return ReE(res, 'Please enter an email or phone number to register.');
    } else if(!body.password){
        return ReE(res, 'Please enter a password to register.');
    }else{
        let err, user;

        [err, user] = await to(authService.createUser(body));

        if(err) return ReE(res, err, 422); 
        //var activeuserkey = encrypt('ABC_'+user.id); 
        var emailBody = '<table width="100%">';
        emailBody += '<tr>';
        emailBody += '<td>Hello '+body.first_name+' '+body.last_name+'</td>';
        emailBody += '</tr>';
        emailBody += '<tr>';
        emailBody += '<td>Thank you for register on our application.Please click on below link and active your account.</td>';
        emailBody += '</tr>';
        emailBody += '<tr>';
        emailBody += '<td><a href="http://localhost:8080/api/user/active/'+user.id+'">Click here</a></td>';
        emailBody += '</tr>';
        emailBody += '</table>';
        emailUtil(body.email,emailBody,'Registation Invitation.',req, res);
        return ReS(res, {message:'Successfully created new user.', user:user.toWeb(), token:user.getJWT()}, 201);
    }
}
module.exports.create = create;

const getUserDetail = async function(req, res){
    let err, user;
    [err, user] = await to(User.findById(req.body.id));  
    if(err){
        return ReE(res, err);
    } 
    // let company = req.company;
    return ReS(res, {user:user.toWeb()});
}
module.exports.getUserDetail = getUserDetail;

const update = async function(req, res){
    let err, user, data
    user = req.user;
    data = req.body.allUserInfo;
    user.set(data);
    [err, user] = await to(user.save());
    if(err){
        if(err.message=='Validation error') err = 'The email address or phone number is already in use';
        return ReE(res, err);
    }
    return ReS(res, {message :'Updated User: '+user.email});
}
module.exports.update = update;

const remove = async function(req, res){
    let user, err;
    user = req.user;
    user.remove_by_admin = 1;
 
    [err, user] = await to(user.save()); 
    if(err) return ReE(res, 'error occured trying to delete user');
   
    return ReS(res, {message:'Deleted successfully.'}, 204);
}
module.exports.remove = remove;

const login = async function(req, res){
    const body = req.body; 
    let err, user;
    [err, user] = await to(authService.authUser(req.body));
    if(err) return ReE(res, err, 422);
    if(user.remove_by_admin == 1) return ReE(res, 'Your account is deleted by admin');
    if(user.active == 0) return ReE(res, 'Your account is not verfied.');
    return ReS(res, {token:user.getJWT(), user:user.toWeb()});
}
module.exports.login = login;

const resetPassword = async function(req, res){
    
    const body = req.body.user;
    
    if(!body.email){
        return ReE(res, 'Please enter an email.');
    } else { 
        let err, user;
        [err, user] = await to(userService.authUserByEmail(req.body.user));
        if(err) return ReE(res, err, 422); 

        //console.log(user);

        var resetpasskey = encrypt(req.body.user.email);
        console.log(resetpasskey);
        user.forget_password = resetpasskey;
        [err, user] = await to(user.save());
        
        // outputs hello world
        console.log(decrypt(resetpasskey));
        
        var emailBody = '<table width="100%">';
        emailBody += '<tr>';
        emailBody += '<td>Please click on below link and reset your password.</td>';
        emailBody += '</tr>';
        emailBody += '<tr>';
        emailBody += '<td>Your Token : '+resetpasskey+'</td>';
        emailBody += '</tr>';
        emailBody += '<tr>';
        emailBody += '<td><a href="'+WEB_URL+'/resettoken">Click here</a></td>';
        emailBody += '</tr>';
        emailBody += '</table>';
        emailUtil(body.email,emailBody,'Reset Password.',req, res);
        return ReS(res, {message:"send password to mail"});
    }
}
module.exports.resetPassword = resetPassword;
    
const getPasswordApplied = async function(req, res){
    console.log(req.body);
    var body = req.body.passwordInfo;
    let err, user;
    [err, user] = await to(userService.checkByTokenAndUpdtPass(body)); 
    if(err) return ReE(res, err, 422);     
    return ReS(res, {message:"send password to mail",data:req.body.passwordInfo});
}
module.exports.getPasswordApplied = getPasswordApplied;

const activeRegisteredUser = async function(req, res){
    
    var activeuserkey = req.params.activeuserkey; 
    //console.log(decrypt(activeuserkey));
    let err, user;
    [err, user] = await to(userService.activeUserById(activeuserkey));     
    return ReS(res, {message:"Your account successfully activated."});
}
module.exports.activeRegisteredUser = activeRegisteredUser;

const setProfile = async function(req, res){
    
    var activeuserkey = req.params.activeuserkey; 
    //console.log(decrypt(activeuserkey));
    let err, user;
    [err, user] = await to(userService.activeUserById(activeuserkey));     
    return ReS(res, {message:"Your account successfully activated."});
}
module.exports.setProfile = setProfile;


//********* Change Password **********
const changePassword = async function (req, res) {

    let body = req.body;
    let newPassword = body.newPassword;
    let confirmPassword = body.confirmPassword;

    if (newPassword != confirmPassword) {
        return ReS(res, { message: "New password and repeat password does not match." });
    } else {
        [err, user] = await to(userService.changePassword(req.user, body));
        if (err) return ReE(res, err, 422);
        return ReS(res, { message: "Password change successfully." });
    }
}
module.exports.changePassword = changePassword;

const getAllUsers = async function (req, res) {

    let err, user 
    [err, user] = await to(User.findAll());
    if(err){
        if(err.message=='Validation error') err = 'Unable to found any user.';
        return ReE(res, err);
    }
    return ReS(res, {message :'Found all users ',users:user});
}
module.exports.getAllUsers = getAllUsers;


const createUser = async function(req, res){ 
    console.log(req.body.user);
    const body = req.body.user; 
    if(!body.unique_key && !body.email && !body.phone){
        return ReE(res, 'Please enter an email or phone number to register.');
    } else if(!body.password){
        return ReE(res, 'Please enter a password to register.');
    }else{
        let err, user;

        [err, user] = await to(authService.createUser(body));

        if(err) return ReE(res, err, 422); 
        //var activeuserkey = encrypt('ABC_'+user.id); 
        var emailBody = '<table width="100%">';
        emailBody += '<tr>';
        emailBody += '<td>Hello '+body.first_name+' '+body.last_name+'</td>';
        emailBody += '</tr>';
        emailBody += '<tr>';
        emailBody += '<td>Admin created your account.Please click on below link and active your account.</td>';
        emailBody += '</tr>';
        emailBody += '<tr>';
        emailBody += '<td><a href="http://localhost:8080/api/user/active/'+user.id+'">Click here</a></td>';
        emailBody += '</tr>';
        emailBody += '</table>';
        emailUtil(body.email,emailBody,'Registation Invitation.',req, res);

        return ReS(res, {message:'Successfully created new user.', user:user.toWeb(), token:user.getJWT()}, 201);
    }
}
module.exports.createUser = createUser;


import config from 'config';
import { authHeader } from '../_helpers';
import axios from 'axios';
var Usertoken = localStorage.getItem('user'); 
var tokenObj = JSON.parse(Usertoken); 

 

export const userService = {
    login,
    logout,
    register,
    getAll,
    getById,
    update,
    delete: _delete,
    forgetpassword,
    resettoken,
    dashboard,
    profile,
    getAllCompanies,
    addCompany,
    getCompaniesDetails,
    changePassword,
    getAllUsers,
    getUserDetails,
    updateUserDetails,
    addUser
};

function login(email, password) { 
    const userInfo = {
        email: email,
        password: password 
    };   
    return axios.post(`${config.apiUrl}/api/users/login`, userInfo)
        //.then(handleResponse)
        .then(function(response){
            if (response.data.token) { 
                localStorage.setItem('user', JSON.stringify(response.data));               
            }
        });
}

function logout() {
    // remove user from local storage to log user out
    //localStorage.removeItem('user');
}

function getAll() {
    const requestOptions = {
        method: 'GET',
        headers: authHeader()
    };

    return fetch(`${config.apiUrl}/users`, requestOptions).then(handleResponse);
}

function getById(id) {
    const requestOptions = {
        method: 'GET',
        headers: authHeader()
    };

    return fetch(`${config.apiUrl}/users/${id}`, requestOptions).then(handleResponse);
}

function register(user) { 

    return axios({
        method: 'POST',
        url: `${config.apiUrl}/api/users`,
        headers: { 'Content-Type': 'application/json'},
        data: {user:user}
    }).then(handleResponse);   
}

function update(user) {
    const requestOptions = {
        method: 'PUT',
        headers: { ...authHeader(), 'Content-Type': 'application/json' },
        body: JSON.stringify(user)
    };

    return fetch(`${config.apiUrl}/users/${user.id}`, requestOptions).then(handleResponse);;
}

// prefixed function name with underscore because delete is a reserved word in javascript
function _delete(id) {
    const requestOptions = {
        method: 'DELETE',
        headers: authHeader()
    };

    return fetch(`${config.apiUrl}/users/${id}`, requestOptions).then(handleResponse);
}

function forgetpassword(user) { 
    return axios({
        method: 'POST',
        url: `${config.apiUrl}/api/resetpassword`,
        headers: { 'Content-Type': 'application/json'},
        data: {user:user}
    }).then(handleResponse);  
}

function resettoken(passwordInfo) {      
    return axios({
        method: 'POST',
        url: `${config.apiUrl}/api/resetpasswordapplied`,
        headers: { 'Content-Type': 'application/json'},
        data: {passwordInfo:passwordInfo}
    }).then(handleResponse);  
}

function dashboard(loggedInUserInfo) { 
    const requestOptions = {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(loggedInUserInfo)
    };
     
    return fetch(`${config.apiUrl}/api/dashboard`, requestOptions).then(handleResponse);
}

function profile(loggedInUserInfo) { 
    const requestOptions = {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(loggedInUserInfo)
    };
     
    return fetch(`${config.apiUrl}/api/profile`, requestOptions).then(handleResponse);
}

function getAllCompanies() { 
    return axios({
        method: 'POST',
        url: `${config.apiUrl}/api/companies/all`,
        headers: { 'Content-Type': 'application/json', 'Authorization' : tokenObj.token },
    }).then(handleResponse); 
}

function addCompany(companyInfo) {
    const requestOptions = {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization' : tokenObj.token },
        body: JSON.stringify(companyInfo)
    };     
    return fetch(`${config.apiUrl}/api/companies`, requestOptions).then(handleResponse);
}

function getCompaniesDetails(id) {
    return axios({
        method: 'POST',
        url: `${config.apiUrl}/api/companiesdetail`,
        headers: { 'Content-Type': 'application/json', 'Authorization' : tokenObj.token },
        data: {id:id}
    }).then(handleResponse);     
}

function changePassword(changePasswordInfo) {
    const requestOptions = {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization' : tokenObj.token },
        body: JSON.stringify(changePasswordInfo)
    };   
    return fetch(`${config.apiUrl}/api/users/changepassword`, requestOptions).then(handleResponse);
}

function getAllUsers() { 
    return axios({
        method: 'POST',
        url: `${config.apiUrl}/api/users/all`,
        headers: { 'Content-Type': 'application/json', 'Authorization' : tokenObj.token },
    }).then(handleResponse); 
}

function getUserDetails(id) {
    return axios({
        method: 'POST',
        url: `${config.apiUrl}/api/users/userdetail`,
        headers: { 'Content-Type': 'application/json', 'Authorization' : tokenObj.token },
        data: {id:id}
    }).then(handleResponse);     
}

function updateUserDetails(allUserInfo) {
    return axios({
        method: 'POST',
        url: `${config.apiUrl}/api/users/updateuserdetail`,
        headers: { 'Content-Type': 'application/json', 'Authorization' : tokenObj.token },
        data: {allUserInfo:allUserInfo}
    }).then(handleResponse);     
}

function addUser(user) {
    return axios({
        method: 'POST',
        url: `${config.apiUrl}/api/users/adduserbyadmin`,
        headers: { 'Content-Type': 'application/json', 'Authorization' : tokenObj.token },
        data: {user:user}
    }).then(handleResponse);     
} 

function handleResponse(response) { 
    if(response.status = 200){
        return response;
    } else {
        const error = (data && data.message) || response.statusText;
        return Promise.reject(error);
    }

    // return response.text().then(text => {
    //     const data = text && JSON.parse(text);
    //     console.log('data',data);
    // console.log('<<<<<<<<<<<<<<<<<<<<<');
    //     if (!response.ok) {
    //         if (response.status === 401) {
    //             // auto logout if 401 response returned from api
    //             logout();
    //             location.reload(true);
    //         }
    //         const error = (data && data.message) || response.statusText;
    //         return Promise.reject(error);
    //     }

    //     console.log('data',data);
    //     return data;
    // });
}

const { User }          = require('../models');
const authService       = require('../services/auth.service');
const { to, ReE, ReS, encrypt, decrypt, emailUtil }  = require('../services/util.service');
const userService       = require('../services/user.service');
const WEB_URL = 'http://localhost:8080';


const create = async function(req, res){ 
    const body = req.body.user; 
    if(!body.unique_key && !body.email && !body.phone){
        return ReE(res, 'Please enter an email or phone number to register.');
    } else if(!body.password){
        return ReE(res, 'Please enter a password to register.');
    }else{
        let err, user;

        [err, user] = await to(authService.createUser(body));

        if(err) return ReE(res, err, 422); 
        //var activeuserkey = encrypt('ABC_'+user.id); 
        var emailBody = '<table width="100%">';
        emailBody += '<tr>';
        emailBody += '<td>Hello '+body.first_name+' '+body.last_name+'</td>';
        emailBody += '</tr>';
        emailBody += '<tr>';
        emailBody += '<td>Thank you for register on our application.Please click on below link and active your account.</td>';
        emailBody += '</tr>';
        emailBody += '<tr>';
        emailBody += '<td><a href="http://localhost:8080/api/user/active/'+user.id+'">Click here</a></td>';
        emailBody += '</tr>';
        emailBody += '</table>';
        emailUtil(body.email,emailBody,'Registation Invitation.',req, res);
        return ReS(res, {message:'Successfully created new user.', user:user.toWeb(), token:user.getJWT()}, 201);
    }
}
module.exports.create = create;

const getUserDetail = async function(req, res){
    console.log('POPOPOPOPOPO');
    let err, user;
    [err, user] = await to(User.findById(req.body.id));  
    if(err){
        return ReE(res, err);
    } 
    // let company = req.company;
    return ReS(res, {user:user.toWeb()});
}
module.exports.getUserDetail = getUserDetail;

const update = async function(req, res){
    let err, user, data
    user = req.user;
    data = req.body.allUserInfo;
    user.set(data);
    [err, user] = await to(user.save());
    if(err){
        if(err.message=='Validation error') err = 'The email address or phone number is already in use';
        return ReE(res, err);
    }
    return ReS(res, {message :'Updated User: '+user.email});
}
module.exports.update = update;

const remove = async function(req, res){
    let user, err;
    user = req.user;
    user.remove_by_admin = 1;
 
    [err, user] = await to(user.save()); 
    if(err) return ReE(res, 'error occured trying to delete user');
   
    return ReS(res, {message:'Deleted successfully.'}, 204);
}
module.exports.remove = remove;

const login = async function(req, res){
    const body = req.body; 
    let err, user;
    [err, user] = await to(authService.authUser(req.body));
    if(err) return ReE(res, err, 422);
    if(user.remove_by_admin == 1) return ReE(res, 'Your account is deleted by admin');
    if(user.active == 0) return ReE(res, 'Your account is not verfied.');
    return ReS(res, {token:user.getJWT(), user:user.toWeb()});
}
module.exports.login = login;

const resetPassword = async function(req, res){
    
    const body = req.body.user;
    
    if(!body.email){
        return ReE(res, 'Please enter an email.');
    } else { 
        let err, user;
        [err, user] = await to(userService.authUserByEmail(req.body.user));
        if(err) return ReE(res, err, 422); 

        //console.log(user);

        var resetpasskey = encrypt(req.body.user.email);
        console.log(resetpasskey);
        user.forget_password = resetpasskey;
        [err, user] = await to(user.save());
        
        // outputs hello world
        console.log(decrypt(resetpasskey));
        
        var emailBody = '<table width="100%">';
        emailBody += '<tr>';
        emailBody += '<td>Please click on below link and reset your password.</td>';
        emailBody += '</tr>';
        emailBody += '<tr>';
        emailBody += '<td>Your Token : '+resetpasskey+'</td>';
        emailBody += '</tr>';
        emailBody += '<tr>';
        emailBody += '<td><a href="'+WEB_URL+'/resettoken">Click here</a></td>';
        emailBody += '</tr>';
        emailBody += '</table>';
        emailUtil(body.email,emailBody,'Reset Password.',req, res);
        return ReS(res, {message:"send password to mail"});
    }
}
module.exports.resetPassword = resetPassword;
    
const getPasswordApplied = async function(req, res){
    console.log(req.body);
    var body = req.body.passwordInfo;
    let err, user;
    [err, user] = await to(userService.checkByTokenAndUpdtPass(body)); 
    if(err) return ReE(res, err, 422);     
    return ReS(res, {message:"send password to mail",data:req.body.passwordInfo});
}
module.exports.getPasswordApplied = getPasswordApplied;

const activeRegisteredUser = async function(req, res){
    
    var activeuserkey = req.params.activeuserkey; 
    //console.log(decrypt(activeuserkey));
    let err, user;
    [err, user] = await to(userService.activeUserById(activeuserkey));     
    return ReS(res, {message:"Your account successfully activated."});
}
module.exports.activeRegisteredUser = activeRegisteredUser;

const setProfile = async function(req, res){
    
    var activeuserkey = req.params.activeuserkey; 
    //console.log(decrypt(activeuserkey));
    let err, user;
    [err, user] = await to(userService.activeUserById(activeuserkey));     
    return ReS(res, {message:"Your account successfully activated."});
}
module.exports.setProfile = setProfile;


//********* Change Password **********
const changePassword = async function (req, res) {

    let body = req.body;
    let newPassword = body.newPassword;
    let confirmPassword = body.confirmPassword;

    if (newPassword != confirmPassword) {
        return ReS(res, { message: "New password and repeat password does not match." });
    } else {
        [err, user] = await to(userService.changePassword(req.user, body));
        if (err) return ReE(res, err, 422);
        return ReS(res, { message: "Password change successfully." });
    }
}
module.exports.changePassword = changePassword;

const getAllUsers = async function (req, res) {

    let err, user 
    [err, user] = await to(User.findAll());
    if(err){
        if(err.message=='Validation error') err = 'Unable to found any user.';
        return ReE(res, err);
    }
    return ReS(res, {message :'Found all users ',users:user});
}
module.exports.getAllUsers = getAllUsers;


const createUser = async function(req, res){ 
    console.log(req.body.user);
    const body = req.body.user; 
    if(!body.unique_key && !body.email && !body.phone){
        return ReE(res, 'Please enter an email or phone number to register.');
    } else if(!body.password){
        return ReE(res, 'Please enter a password to register.');
    }else{
        let err, user;

        [err, user] = await to(authService.createUser(body));

        if(err) return ReE(res, err, 422); 
        //var activeuserkey = encrypt('ABC_'+user.id); 
        var emailBody = '<table width="100%">';
        emailBody += '<tr>';
        emailBody += '<td>Hello '+body.first_name+' '+body.last_name+'</td>';
        emailBody += '</tr>';
        emailBody += '<tr>';
        emailBody += '<td>Admin created your account.Please click on below link and active your account.</td>';
        emailBody += '</tr>';
        emailBody += '<tr>';
        emailBody += '<td><a href="http://localhost:8080/api/user/active/'+user.id+'">Click here</a></td>';
        emailBody += '</tr>';
        emailBody += '</table>';
        emailUtil(body.email,emailBody,'Registation Invitation.',req, res);

        return ReS(res, {message:'Successfully created new user.', user:user.toWeb(), token:user.getJWT()}, 201);
    }
}
module.exports.createUser = createUser;

const { to, ReE, ReS } = require('../services/util.service');

const Dashboard = function(req, res){
	let user = req.user.id;
	return res.json({success:true, message:'it worked', data:'user name is :'});
}
module.exports.Dashboard = Dashboard


const { User }          = require('../models');
const authService       = require('../services/auth.service');
const { to, ReE, ReS, encrypt, decrypt, emailUtil }  = require('../services/util.service');
const userService       = require('../services/user.service');
const WEB_URL = 'http://localhost:8080';


const create = async function(req, res){ 
    const body = req.body.user; 
    if(!body.unique_key && !body.email && !body.phone){
        return ReE(res, 'Please enter an email or phone number to register.');
    } else if(!body.password){
        return ReE(res, 'Please enter a password to register.');
    }else{
        let err, user;

        [err, user] = await to(authService.createUser(body));

        if(err) return ReE(res, err, 422); 
        //var activeuserkey = encrypt('ABC_'+user.id); 
        var emailBody = '<table width="100%">';
        emailBody += '<tr>';
        emailBody += '<td>Hello '+body.first_name+' '+body.last_name+'</td>';
        emailBody += '</tr>';
        emailBody += '<tr>';
        emailBody += '<td>Thank you for register on our application.Please click on below link and active your account.</td>';
        emailBody += '</tr>';
        emailBody += '<tr>';
        emailBody += '<td><a href="http://localhost:8080/api/user/active/'+user.id+'">Click here</a></td>';
        emailBody += '</tr>';
        emailBody += '</table>';
        emailUtil(body.email,emailBody,'Registation Invitation.',req, res);
        return ReS(res, {message:'Successfully created new user.', user:user.toWeb(), token:user.getJWT()}, 201);
    }
}
module.exports.create = create;

const getUserDetail = async function(req, res){
    console.log('POPOPOPOPOPO');
    let err, user;
    [err, user] = await to(User.findById(req.body.id));  
    if(err){
        return ReE(res, err);
    } 
    // let company = req.company;
    return ReS(res, {user:user.toWeb()});
}
module.exports.getUserDetail = getUserDetail;

const update = async function(req, res){
    let err, user, data
    user = req.user;
    data = req.body.allUserInfo;
    user.set(data);
    [err, user] = await to(user.save());
    if(err){
        if(err.message=='Validation error') err = 'The email address or phone number is already in use';
        return ReE(res, err);
    }
    return ReS(res, {message :'Updated User: '+user.email});
}
module.exports.update = update;

const remove = async function(req, res){
    let user, err;
    user = req.user;
    user.remove_by_admin = 1;
 
    [err, user] = await to(user.save()); 
    if(err) return ReE(res, 'error occured trying to delete user');
   
    return ReS(res, {message:'Deleted successfully.'}, 204);
}
module.exports.remove = remove;

const login = async function(req, res){
    const body = req.body; 
    let err, user;
    [err, user] = await to(authService.authUser(req.body));
    if(err) return ReE(res, err, 422);
    if(user.remove_by_admin == 1) return ReE(res, 'Your account is deleted by admin');
    if(user.active == 0) return ReE(res, 'Your account is not verfied.');
    return ReS(res, {token:user.getJWT(), user:user.toWeb()});
}
module.exports.login = login;

const resetPassword = async function(req, res){
    
    const body = req.body.user;
    
    if(!body.email){
        return ReE(res, 'Please enter an email.');
    } else { 
        let err, user;
        [err, user] = await to(userService.authUserByEmail(req.body.user));
        if(err) return ReE(res, err, 422); 

        //console.log(user);

        var resetpasskey = encrypt(req.body.user.email);
        console.log(resetpasskey);
        user.forget_password = resetpasskey;
        [err, user] = await to(user.save());
        
        // outputs hello world
        console.log(decrypt(resetpasskey));
        
        var emailBody = '<table width="100%">';
        emailBody += '<tr>';
        emailBody += '<td>Please click on below link and reset your password.</td>';
        emailBody += '</tr>';
        emailBody += '<tr>';
        emailBody += '<td>Your Token : '+resetpasskey+'</td>';
        emailBody += '</tr>';
        emailBody += '<tr>';
        emailBody += '<td><a href="'+WEB_URL+'/resettoken">Click here</a></td>';
        emailBody += '</tr>';
        emailBody += '</table>';
        emailUtil(body.email,emailBody,'Reset Password.',req, res);
        return ReS(res, {message:"send password to mail"});
    }
}
module.exports.resetPassword = resetPassword;
    
const getPasswordApplied = async function(req, res){
    console.log(req.body);
    var body = req.body.passwordInfo;
    let err, user;
    [err, user] = await to(userService.checkByTokenAndUpdtPass(body)); 
    if(err) return ReE(res, err, 422);     
    return ReS(res, {message:"send password to mail",data:req.body.passwordInfo});
}
module.exports.getPasswordApplied = getPasswordApplied;

const activeRegisteredUser = async function(req, res){
    
    var activeuserkey = req.params.activeuserkey; 
    //console.log(decrypt(activeuserkey));
    let err, user;
    [err, user] = await to(userService.activeUserById(activeuserkey));     
    return ReS(res, {message:"Your account successfully activated."});
}
module.exports.activeRegisteredUser = activeRegisteredUser;

const setProfile = async function(req, res){
    
    var activeuserkey = req.params.activeuserkey; 
    //console.log(decrypt(activeuserkey));
    let err, user;
    [err, user] = await to(userService.activeUserById(activeuserkey));     
    return ReS(res, {message:"Your account successfully activated."});
}
module.exports.setProfile = setProfile;


//********* Change Password **********
const changePassword = async function (req, res) {

    let body = req.body;
    let newPassword = body.newPassword;
    let confirmPassword = body.confirmPassword;

    if (newPassword != confirmPassword) {
        return ReS(res, { message: "New password and repeat password does not match." });
    } else {
        [err, user] = await to(userService.changePassword(req.user, body));
        if (err) return ReE(res, err, 422);
        return ReS(res, { message: "Password change successfully." });
    }
}
module.exports.changePassword = changePassword;

const getAllUsers = async function (req, res) {

    let err, user 
    [err, user] = await to(User.findAll());
    if(err){
        if(err.message=='Validation error') err = 'Unable to found any user.';
        return ReE(res, err);
    }
    return ReS(res, {message :'Found all users ',users:user});
}
module.exports.getAllUsers = getAllUsers;


const createUser = async function(req, res){ 
    console.log(req.body.user);
    const body = req.body.user; 
    if(!body.unique_key && !body.email && !body.phone){
        return ReE(res, 'Please enter an email or phone number to register.');
    } else if(!body.password){
        return ReE(res, 'Please enter a password to register.');
    }else{
        let err, user;

        [err, user] = await to(authService.createUser(body));

        if(err) return ReE(res, err, 422); 
        //var activeuserkey = encrypt('ABC_'+user.id); 
        var emailBody = '<table width="100%">';
        emailBody += '<tr>';
        emailBody += '<td>Hello '+body.first_name+' '+body.last_name+'</td>';
        emailBody += '</tr>';
        emailBody += '<tr>';
        emailBody += '<td>Admin created your account.Please click on below link and active your account.</td>';
        emailBody += '</tr>';
        emailBody += '<tr>';
        emailBody += '<td><a href="http://localhost:8080/api/user/active/'+user.id+'">Click here</a></td>';
        emailBody += '</tr>';
        emailBody += '</table>';
        emailUtil(body.email,emailBody,'Registation Invitation.',req, res);

        return ReS(res, {message:'Successfully created new user.', user:user.toWeb(), token:user.getJWT()}, 201);
    }
}
module.exports.createUser = createUser;


import config from 'config';
import { authHeader } from '../_helpers';
import axios from 'axios';
var Usertoken = localStorage.getItem('user'); 
var tokenObj = JSON.parse(Usertoken); 

 

export const userService = {
    login,
    logout,
    register,
    getAll,
    getById,
    update,
    delete: _delete,
    forgetpassword,
    resettoken,
    dashboard,
    profile,
    getAllCompanies,
    addCompany,
    getCompaniesDetails,
    changePassword,
    getAllUsers,
    getUserDetails,
    updateUserDetails,
    addUser
};

function login(email, password) { 
    const userInfo = {
        email: email,
        password: password 
    };   
    return axios.post(`${config.apiUrl}/api/users/login`, userInfo)
        //.then(handleResponse)
        .then(function(response){
            if (response.data.token) { 
                localStorage.setItem('user', JSON.stringify(response.data));               
            }
        });
}

function logout() {
    // remove user from local storage to log user out
    //localStorage.removeItem('user');
}

function getAll() {
    const requestOptions = {
        method: 'GET',
        headers: authHeader()
    };

    return fetch(`${config.apiUrl}/users`, requestOptions).then(handleResponse);
}

function getById(id) {
    const requestOptions = {
        method: 'GET',
        headers: authHeader()
    };

    return fetch(`${config.apiUrl}/users/${id}`, requestOptions).then(handleResponse);
}

function register(user) { 

    return axios({
        method: 'POST',
        url: `${config.apiUrl}/api/users`,
        headers: { 'Content-Type': 'application/json'},
        data: {user:user}
    }).then(handleResponse);   
}

function update(user) {
    const requestOptions = {
        method: 'PUT',
        headers: { ...authHeader(), 'Content-Type': 'application/json' },
        body: JSON.stringify(user)
    };

    return fetch(`${config.apiUrl}/users/${user.id}`, requestOptions).then(handleResponse);;
}

// prefixed function name with underscore because delete is a reserved word in javascript
function _delete(id) {
    const requestOptions = {
        method: 'DELETE',
        headers: authHeader()
    };

    return fetch(`${config.apiUrl}/users/${id}`, requestOptions).then(handleResponse);
}

function forgetpassword(user) { 
    return axios({
        method: 'POST',
        url: `${config.apiUrl}/api/resetpassword`,
        headers: { 'Content-Type': 'application/json'},
        data: {user:user}
    }).then(handleResponse);  
}

function resettoken(passwordInfo) {      
    return axios({
        method: 'POST',
        url: `${config.apiUrl}/api/resetpasswordapplied`,
        headers: { 'Content-Type': 'application/json'},
        data: {passwordInfo:passwordInfo}
    }).then(handleResponse);  
}

function dashboard(loggedInUserInfo) { 
    const requestOptions = {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(loggedInUserInfo)
    };
     
    return fetch(`${config.apiUrl}/api/dashboard`, requestOptions).then(handleResponse);
}

function profile(loggedInUserInfo) { 
    const requestOptions = {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(loggedInUserInfo)
    };
     
    return fetch(`${config.apiUrl}/api/profile`, requestOptions).then(handleResponse);
}

function getAllCompanies() { 
    return axios({
        method: 'POST',
        url: `${config.apiUrl}/api/companies/all`,
        headers: { 'Content-Type': 'application/json', 'Authorization' : tokenObj.token },
    }).then(handleResponse); 
}

function addCompany(companyInfo) {
    const requestOptions = {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization' : tokenObj.token },
        body: JSON.stringify(companyInfo)
    };     
    return fetch(`${config.apiUrl}/api/companies`, requestOptions).then(handleResponse);
}

function getCompaniesDetails(id) {
    return axios({
        method: 'POST',
        url: `${config.apiUrl}/api/companiesdetail`,
        headers: { 'Content-Type': 'application/json', 'Authorization' : tokenObj.token },
        data: {id:id}
    }).then(handleResponse);     
}

function changePassword(changePasswordInfo) {
    const requestOptions = {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization' : tokenObj.token },
        body: JSON.stringify(changePasswordInfo)
    };   
    return fetch(`${config.apiUrl}/api/users/changepassword`, requestOptions).then(handleResponse);
}

function getAllUsers() { 
    return axios({
        method: 'POST',
        url: `${config.apiUrl}/api/users/all`,
        headers: { 'Content-Type': 'application/json', 'Authorization' : tokenObj.token },
    }).then(handleResponse); 
}

function getUserDetails(id) {
    return axios({
        method: 'POST',
        url: `${config.apiUrl}/api/users/userdetail`,
        headers: { 'Content-Type': 'application/json', 'Authorization' : tokenObj.token },
        data: {id:id}
    }).then(handleResponse);     
}

function updateUserDetails(allUserInfo) {
    return axios({
        method: 'POST',
        url: `${config.apiUrl}/api/users/updateuserdetail`,
        headers: { 'Content-Type': 'application/json', 'Authorization' : tokenObj.token },
        data: {allUserInfo:allUserInfo}
    }).then(handleResponse);     
}

function addUser(user) {
    return axios({
        method: 'POST',
        url: `${config.apiUrl}/api/users/adduserbyadmin`,
        headers: { 'Content-Type': 'application/json', 'Authorization' : tokenObj.token },
        data: {user:user}
    }).then(handleResponse);     
} 

function handleResponse(response) { 
    if(response.status = 200){
        return response;
    } else {
        const error = (data && data.message) || response.statusText;
        return Promise.reject(error);
    }

    // return response.text().then(text => {
    //     const data = text && JSON.parse(text);
    //     console.log('data',data);
    // console.log('<<<<<<<<<<<<<<<<<<<<<');
    //     if (!response.ok) {
    //         if (response.status === 401) {
    //             // auto logout if 401 response returned from api
    //             logout();
    //             location.reload(true);
    //         }
    //         const error = (data && data.message) || response.statusText;
    //         return Promise.reject(error);
    //     }

    //     console.log('data',data);
    //     return data;
    // });
}

const { User }          = require('../models');
const authService       = require('../services/auth.service');
const { to, ReE, ReS, encrypt, decrypt, emailUtil }  = require('../services/util.service');
const userService       = require('../services/user.service');
const WEB_URL = 'http://localhost:8080';


const create = async function(req, res){ 
    const body = req.body.user; 
    if(!body.unique_key && !body.email && !body.phone){
        return ReE(res, 'Please enter an email or phone number to register.');
    } else if(!body.password){
        return ReE(res, 'Please enter a password to register.');
    }else{
        let err, user;

        [err, user] = await to(authService.createUser(body));

        if(err) return ReE(res, err, 422); 
        //var activeuserkey = encrypt('ABC_'+user.id); 
        var emailBody = '<table width="100%">';
        emailBody += '<tr>';
        emailBody += '<td>Hello '+body.first_name+' '+body.last_name+'</td>';
        emailBody += '</tr>';
        emailBody += '<tr>';
        emailBody += '<td>Thank you for register on our application.Please click on below link and active your account.</td>';
        emailBody += '</tr>';
        emailBody += '<tr>';
        emailBody += '<td><a href="http://localhost:8080/api/user/active/'+user.id+'">Click here</a></td>';
        emailBody += '</tr>';
        emailBody += '</table>';
        emailUtil(body.email,emailBody,'Registation Invitation.',req, res);
        return ReS(res, {message:'Successfully created new user.', user:user.toWeb(), token:user.getJWT()}, 201);
    }
}
module.exports.create = create;

const getUserDetail = async function(req, res){
    console.log('POPOPOPOPOPO');
    let err, user;
    [err, user] = await to(User.findById(req.body.id));  
    if(err){
        return ReE(res, err);
    } 
    // let company = req.company;
    return ReS(res, {user:user.toWeb()});
}
module.exports.getUserDetail = getUserDetail;

const update = async function(req, res){
    let err, user, data
    user = req.user;
    data = req.body.allUserInfo;
    user.set(data);
    [err, user] = await to(user.save());
    if(err){
        if(err.message=='Validation error') err = 'The email address or phone number is already in use';
        return ReE(res, err);
    }
    return ReS(res, {message :'Updated User: '+user.email});
}
module.exports.update = update;

const remove = async function(req, res){
    let user, err;
    user = req.user;
    user.remove_by_admin = 1;
 
    [err, user] = await to(user.save()); 
    if(err) return ReE(res, 'error occured trying to delete user');
   
    return ReS(res, {message:'Deleted successfully.'}, 204);
}
module.exports.remove = remove;

const login = async function(req, res){
    const body = req.body; 
    let err, user;
    [err, user] = await to(authService.authUser(req.body));
    if(err) return ReE(res, err, 422);
    if(user.remove_by_admin == 1) return ReE(res, 'Your account is deleted by admin');
    if(user.active == 0) return ReE(res, 'Your account is not verfied.');
    return ReS(res, {token:user.getJWT(), user:user.toWeb()});
}
module.exports.login = login;

const resetPassword = async function(req, res){
    
    const body = req.body.user;
    
    if(!body.email){
        return ReE(res, 'Please enter an email.');
    } else { 
        let err, user;
        [err, user] = await to(userService.authUserByEmail(req.body.user));
        if(err) return ReE(res, err, 422); 

        //console.log(user);

        var resetpasskey = encrypt(req.body.user.email);
        console.log(resetpasskey);
        user.forget_password = resetpasskey;
        [err, user] = await to(user.save());
        
        // outputs hello world
        console.log(decrypt(resetpasskey));
        
        var emailBody = '<table width="100%">';
        emailBody += '<tr>';
        emailBody += '<td>Please click on below link and reset your password.</td>';
        emailBody += '</tr>';
        emailBody += '<tr>';
        emailBody += '<td>Your Token : '+resetpasskey+'</td>';
        emailBody += '</tr>';
        emailBody += '<tr>';
        emailBody += '<td><a href="'+WEB_URL+'/resettoken">Click here</a></td>';
        emailBody += '</tr>';
        emailBody += '</table>';
        emailUtil(body.email,emailBody,'Reset Password.',req, res);
        return ReS(res, {message:"send password to mail"});
    }
}
module.exports.resetPassword = resetPassword;
    
const getPasswordApplied = async function(req, res){
    console.log(req.body);
    var body = req.body.passwordInfo;
    let err, user;
    [err, user] = await to(userService.checkByTokenAndUpdtPass(body)); 
    if(err) return ReE(res, err, 422);     
    return ReS(res, {message:"send password to mail",data:req.body.passwordInfo});
}
module.exports.getPasswordApplied = getPasswordApplied;

const activeRegisteredUser = async function(req, res){
    
    var activeuserkey = req.params.activeuserkey; 
    //console.log(decrypt(activeuserkey));
    let err, user;
    [err, user] = await to(userService.activeUserById(activeuserkey));     
    return ReS(res, {message:"Your account successfully activated."});
}
module.exports.activeRegisteredUser = activeRegisteredUser;

const setProfile = async function(req, res){
    
    var activeuserkey = req.params.activeuserkey; 
    //console.log(decrypt(activeuserkey));
    let err, user;
    [err, user] = await to(userService.activeUserById(activeuserkey));     
    return ReS(res, {message:"Your account successfully activated."});
}
module.exports.setProfile = setProfile;


//********* Change Password **********
const changePassword = async function (req, res) {

    let body = req.body;
    let newPassword = body.newPassword;
    let confirmPassword = body.confirmPassword;

    if (newPassword != confirmPassword) {
        return ReS(res, { message: "New password and repeat password does not match." });
    } else {
        [err, user] = await to(userService.changePassword(req.user, body));
        if (err) return ReE(res, err, 422);
        return ReS(res, { message: "Password change successfully." });
    }
}
module.exports.changePassword = changePassword;

const getAllUsers = async function (req, res) {

    let err, user 
    [err, user] = await to(User.findAll());
    if(err){
        if(err.message=='Validation error') err = 'Unable to found any user.';
        return ReE(res, err);
    }
    return ReS(res, {message :'Found all users ',users:user});
}
module.exports.getAllUsers = getAllUsers;


const createUser = async function(req, res){ 
    console.log(req.body.user);
    const body = req.body.user; 
    if(!body.unique_key && !body.email && !body.phone){
        return ReE(res, 'Please enter an email or phone number to register.');
    } else if(!body.password){
        return ReE(res, 'Please enter a password to register.');
    }else{
        let err, user;

        [err, user] = await to(authService.createUser(body));

        if(err) return ReE(res, err, 422); 
        //var activeuserkey = encrypt('ABC_'+user.id); 
        var emailBody = '<table width="100%">';
        emailBody += '<tr>';
        emailBody += '<td>Hello '+body.first_name+' '+body.last_name+'</td>';
        emailBody += '</tr>';
        emailBody += '<tr>';
        emailBody += '<td>Admin created your account.Please click on below link and active your account.</td>';
        emailBody += '</tr>';
        emailBody += '<tr>';
        emailBody += '<td><a href="http://localhost:8080/api/user/active/'+user.id+'">Click here</a></td>';
        emailBody += '</tr>';
        emailBody += '</table>';
        emailUtil(body.email,emailBody,'Registation Invitation.',req, res);

        return ReS(res, {message:'Successfully created new user.', user:user.toWeb(), token:user.getJWT()}, 201);
    }
}
module.exports.createUser = createUser;

const { to, ReE, ReS } = require('../services/util.service');

const Dashboard = function(req, res){
	let user = req.user.id;
	return res.json({success:true, message:'it worked', data:'user name is :'});
}
module.exports.Dashboard = Dashboard


const { User }          = require('../models');
const authService       = require('../services/auth.service');
const { to, ReE, ReS, encrypt, decrypt, emailUtil }  = require('../services/util.service');
const userService       = require('../services/user.service');
const WEB_URL = 'http://localhost:8080';


const create = async function(req, res){ 
    const body = req.body.user; 
    if(!body.unique_key && !body.email && !body.phone){
        return ReE(res, 'Please enter an email or phone number to register.');
    } else if(!body.password){
        return ReE(res, 'Please enter a password to register.');
    }else{
        let err, user;

        [err, user] = await to(authService.createUser(body));

        if(err) return ReE(res, err, 422); 
        //var activeuserkey = encrypt('ABC_'+user.id); 
        var emailBody = '<table width="100%">';
        emailBody += '<tr>';
        emailBody += '<td>Hello '+body.first_name+' '+body.last_name+'</td>';
        emailBody += '</tr>';
        emailBody += '<tr>';
        emailBody += '<td>Thank you for register on our application.Please click on below link and active your account.</td>';
        emailBody += '</tr>';
        emailBody += '<tr>';
        emailBody += '<td><a href="http://localhost:8080/api/user/active/'+user.id+'">Click here</a></td>';
        emailBody += '</tr>';
        emailBody += '</table>';
        emailUtil(body.email,emailBody,'Registation Invitation.',req, res);
        return ReS(res, {message:'Successfully created new user.', user:user.toWeb(), token:user.getJWT()}, 201);
    }
}
module.exports.create = create;

const getUserDetail = async function(req, res){
    console.log('POPOPOPOPOPO');
    let err, user;
    [err, user] = await to(User.findById(req.body.id));  
    if(err){
        return ReE(res, err);
    } 
    // let company = req.company;
    return ReS(res, {user:user.toWeb()});
}
module.exports.getUserDetail = getUserDetail;

const update = async function(req, res){
    let err, user, data
    user = req.user;
    data = req.body.allUserInfo;
    user.set(data);
    [err, user] = await to(user.save());
    if(err){
        if(err.message=='Validation error') err = 'The email address or phone number is already in use';
        return ReE(res, err);
    }
    return ReS(res, {message :'Updated User: '+user.email});
}
module.exports.update = update;

const remove = async function(req, res){
    let user, err;
    user = req.user;
    user.remove_by_admin = 1;
 
    [err, user] = await to(user.save()); 
    if(err) return ReE(res, 'error occured trying to delete user');
   
    return ReS(res, {message:'Deleted successfully.'}, 204);
}
module.exports.remove = remove;

const login = async function(req, res){
    const body = req.body; 
    let err, user;
    [err, user] = await to(authService.authUser(req.body));
    if(err) return ReE(res, err, 422);
    if(user.remove_by_admin == 1) return ReE(res, 'Your account is deleted by admin');
    if(user.active == 0) return ReE(res, 'Your account is not verfied.');
    return ReS(res, {token:user.getJWT(), user:user.toWeb()});
}
module.exports.login = login;

const resetPassword = async function(req, res){
    
    const body = req.body.user;
    
    if(!body.email){
        return ReE(res, 'Please enter an email.');
    } else { 
        let err, user;
        [err, user] = await to(userService.authUserByEmail(req.body.user));
        if(err) return ReE(res, err, 422); 

        //console.log(user);

        var resetpasskey = encrypt(req.body.user.email);
        console.log(resetpasskey);
        user.forget_password = resetpasskey;
        [err, user] = await to(user.save());
        
        // outputs hello world
        console.log(decrypt(resetpasskey));
        
        var emailBody = '<table width="100%">';
        emailBody += '<tr>';
        emailBody += '<td>Please click on below link and reset your password.</td>';
        emailBody += '</tr>';
        emailBody += '<tr>';
        emailBody += '<td>Your Token : '+resetpasskey+'</td>';
        emailBody += '</tr>';
        emailBody += '<tr>';
        emailBody += '<td><a href="'+WEB_URL+'/resettoken">Click here</a></td>';
        emailBody += '</tr>';
        emailBody += '</table>';
        emailUtil(body.email,emailBody,'Reset Password.',req, res);
        return ReS(res, {message:"send password to mail"});
    }
}
module.exports.resetPassword = resetPassword;
    
const getPasswordApplied = async function(req, res){
    console.log(req.body);
    var body = req.body.passwordInfo;
    let err, user;
    [err, user] = await to(userService.checkByTokenAndUpdtPass(body)); 
    if(err) return ReE(res, err, 422);     
    return ReS(res, {message:"send password to mail",data:req.body.passwordInfo});
}
module.exports.getPasswordApplied = getPasswordApplied;

const activeRegisteredUser = async function(req, res){
    
    var activeuserkey = req.params.activeuserkey; 
    //console.log(decrypt(activeuserkey));
    let err, user;
    [err, user] = await to(userService.activeUserById(activeuserkey));     
    return ReS(res, {message:"Your account successfully activated."});
}
module.exports.activeRegisteredUser = activeRegisteredUser;

const setProfile = async function(req, res){
    
    var activeuserkey = req.params.activeuserkey; 
    //console.log(decrypt(activeuserkey));
    let err, user;
    [err, user] = await to(userService.activeUserById(activeuserkey));     
    return ReS(res, {message:"Your account successfully activated."});
}
module.exports.setProfile = setProfile;


//********* Change Password **********
const changePassword = async function (req, res) {

    let body = req.body;
    let newPassword = body.newPassword;
    let confirmPassword = body.confirmPassword;

    if (newPassword != confirmPassword) {
        return ReS(res, { message: "New password and repeat password does not match." });
    } else {
        [err, user] = await to(userService.changePassword(req.user, body));
        if (err) return ReE(res, err, 422);
        return ReS(res, { message: "Password change successfully." });
    }
}
module.exports.changePassword = changePassword;

const getAllUsers = async function (req, res) {

    let err, user 
    [err, user] = await to(User.findAll());
    if(err){
        if(err.message=='Validation error') err = 'Unable to found any user.';
        return ReE(res, err);
    }
    return ReS(res, {message :'Found all users ',users:user});
}
module.exports.getAllUsers = getAllUsers;


const createUser = async function(req, res){ 
    console.log(req.body.user);
    const body = req.body.user; 
    if(!body.unique_key && !body.email && !body.phone){
        return ReE(res, 'Please enter an email or phone number to register.');
    } else if(!body.password){
        return ReE(res, 'Please enter a password to register.');
    }else{
        let err, user;

        [err, user] = await to(authService.createUser(body));

        if(err) return ReE(res, err, 422); 
        //var activeuserkey = encrypt('ABC_'+user.id); 
        var emailBody = '<table width="100%">';
        emailBody += '<tr>';
        emailBody += '<td>Hello '+body.first_name+' '+body.last_name+'</td>';
        emailBody += '</tr>';
        emailBody += '<tr>';
        emailBody += '<td>Admin created your account.Please click on below link and active your account.</td>';
        emailBody += '</tr>';
        emailBody += '<tr>';
        emailBody += '<td><a href="http://localhost:8080/api/user/active/'+user.id+'">Click here</a></td>';
        emailBody += '</tr>';
        emailBody += '</table>';
        emailUtil(body.email,emailBody,'Registation Invitation.',req, res);

        return ReS(res, {message:'Successfully created new user.', user:user.toWeb(), token:user.getJWT()}, 201);
    }
}
module.exports.createUser = createUser;


import config from 'config';
import { authHeader } from '../_helpers';
import axios from 'axios';
var Usertoken = localStorage.getItem('user'); 
var tokenObj = JSON.parse(Usertoken); 

 

export const userService = {
    login,
    logout,
    register,
    getAll,
    getById,
    update,
    delete: _delete,
    forgetpassword,
    resettoken,
    dashboard,
    profile,
    getAllCompanies,
    addCompany,
    getCompaniesDetails,
    changePassword,
    getAllUsers,
    getUserDetails,
    updateUserDetails,
    addUser
};

function login(email, password) { 
    const userInfo = {
        email: email,
        password: password 
    };   
    return axios.post(`${config.apiUrl}/api/users/login`, userInfo)
        //.then(handleResponse)
        .then(function(response){
            if (response.data.token) { 
                localStorage.setItem('user', JSON.stringify(response.data));               
            }
        });
}

function logout() {
    // remove user from local storage to log user out
    //localStorage.removeItem('user');
}

function getAll() {
    const requestOptions = {
        method: 'GET',
        headers: authHeader()
    };

    return fetch(`${config.apiUrl}/users`, requestOptions).then(handleResponse);
}

function getById(id) {
    const requestOptions = {
        method: 'GET',
        headers: authHeader()
    };

    return fetch(`${config.apiUrl}/users/${id}`, requestOptions).then(handleResponse);
}

function register(user) { 

    return axios({
        method: 'POST',
        url: `${config.apiUrl}/api/users`,
        headers: { 'Content-Type': 'application/json'},
        data: {user:user}
    }).then(handleResponse);   
}

function update(user) {
    const requestOptions = {
        method: 'PUT',
        headers: { ...authHeader(), 'Content-Type': 'application/json' },
        body: JSON.stringify(user)
    };

    return fetch(`${config.apiUrl}/users/${user.id}`, requestOptions).then(handleResponse);;
}

// prefixed function name with underscore because delete is a reserved word in javascript
function _delete(id) {
    const requestOptions = {
        method: 'DELETE',
        headers: authHeader()
    };

    return fetch(`${config.apiUrl}/users/${id}`, requestOptions).then(handleResponse);
}

function forgetpassword(user) { 
    return axios({
        method: 'POST',
        url: `${config.apiUrl}/api/resetpassword`,
        headers: { 'Content-Type': 'application/json'},
        data: {user:user}
    }).then(handleResponse);  
}

function resettoken(passwordInfo) {      
    return axios({
        method: 'POST',
        url: `${config.apiUrl}/api/resetpasswordapplied`,
        headers: { 'Content-Type': 'application/json'},
        data: {passwordInfo:passwordInfo}
    }).then(handleResponse);  
}

function dashboard(loggedInUserInfo) { 
    const requestOptions = {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(loggedInUserInfo)
    };
     
    return fetch(`${config.apiUrl}/api/dashboard`, requestOptions).then(handleResponse);
}

function profile(loggedInUserInfo) { 
    const requestOptions = {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(loggedInUserInfo)
    };
     
    return fetch(`${config.apiUrl}/api/profile`, requestOptions).then(handleResponse);
}

function getAllCompanies() { 
    return axios({
        method: 'POST',
        url: `${config.apiUrl}/api/companies/all`,
        headers: { 'Content-Type': 'application/json', 'Authorization' : tokenObj.token },
    }).then(handleResponse); 
}

function addCompany(companyInfo) {
    const requestOptions = {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization' : tokenObj.token },
        body: JSON.stringify(companyInfo)
    };     
    return fetch(`${config.apiUrl}/api/companies`, requestOptions).then(handleResponse);
}

function getCompaniesDetails(id) {
    return axios({
        method: 'POST',
        url: `${config.apiUrl}/api/companiesdetail`,
        headers: { 'Content-Type': 'application/json', 'Authorization' : tokenObj.token },
        data: {id:id}
    }).then(handleResponse);     
}

function changePassword(changePasswordInfo) {
    const requestOptions = {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization' : tokenObj.token },
        body: JSON.stringify(changePasswordInfo)
    };   
    return fetch(`${config.apiUrl}/api/users/changepassword`, requestOptions).then(handleResponse);
}

function getAllUsers() { 
    return axios({
        method: 'POST',
        url: `${config.apiUrl}/api/users/all`,
        headers: { 'Content-Type': 'application/json', 'Authorization' : tokenObj.token },
    }).then(handleResponse); 
}

function getUserDetails(id) {
    return axios({
        method: 'POST',
        url: `${config.apiUrl}/api/users/userdetail`,
        headers: { 'Content-Type': 'application/json', 'Authorization' : tokenObj.token },
        data: {id:id}
    }).then(handleResponse);     
}

function updateUserDetails(allUserInfo) {
    return axios({
        method: 'POST',
        url: `${config.apiUrl}/api/users/updateuserdetail`,
        headers: { 'Content-Type': 'application/json', 'Authorization' : tokenObj.token },
        data: {allUserInfo:allUserInfo}
    }).then(handleResponse);     
}

function addUser(user) {
    return axios({
        method: 'POST',
        url: `${config.apiUrl}/api/users/adduserbyadmin`,
        headers: { 'Content-Type': 'application/json', 'Authorization' : tokenObj.token },
        data: {user:user}
    }).then(handleResponse);     
} 

function handleResponse(response) { 
    if(response.status = 200){
        return response;
    } else {
        const error = (data && data.message) || response.statusText;
        return Promise.reject(error);
    }

    // return response.text().then(text => {
    //     const data = text && JSON.parse(text);
    //     console.log('data',data);
    // console.log('<<<<<<<<<<<<<<<<<<<<<');
    //     if (!response.ok) {
    //         if (response.status === 401) {
    //             // auto logout if 401 response returned from api
    //             logout();
    //             location.reload(true);
    //         }
    //         const error = (data && data.message) || response.statusText;
    //         return Promise.reject(error);
    //     }

    //     console.log('data',data);
    //     return data;
    // });
}

const { User }          = require('../models');
const authService       = require('../services/auth.service');
const { to, ReE, ReS, encrypt, decrypt, emailUtil }  = require('../services/util.service');
const userService       = require('../services/user.service');
const WEB_URL = 'http://localhost:8080';


const create = async function(req, res){ 
    const body = req.body.user; 
    if(!body.unique_key && !body.email && !body.phone){
        return ReE(res, 'Please enter an email or phone number to register.');
    } else if(!body.password){
        return ReE(res, 'Please enter a password to register.');
    }else{
        let err, user;

        [err, user] = await to(authService.createUser(body));

        if(err) return ReE(res, err, 422); 
        //var activeuserkey = encrypt('ABC_'+user.id); 
        var emailBody = '<table width="100%">';
        emailBody += '<tr>';
        emailBody += '<td>Hello '+body.first_name+' '+body.last_name+'</td>';
        emailBody += '</tr>';
        emailBody += '<tr>';
        emailBody += '<td>Thank you for register on our application.Please click on below link and active your account.</td>';
        emailBody += '</tr>';
        emailBody += '<tr>';
        emailBody += '<td><a href="http://localhost:8080/api/user/active/'+user.id+'">Click here</a></td>';
        emailBody += '</tr>';
        emailBody += '</table>';
        emailUtil(body.email,emailBody,'Registation Invitation.',req, res);
        return ReS(res, {message:'Successfully created new user.', user:user.toWeb(), token:user.getJWT()}, 201);
    }
}
module.exports.create = create;

const getUserDetail = async function(req, res){
    console.log('POPOPOPOPOPO');
    let err, user;
    [err, user] = await to(User.findById(req.body.id));  
    if(err){
        return ReE(res, err);
    } 
    // let company = req.company;
    return ReS(res, {user:user.toWeb()});
}
module.exports.getUserDetail = getUserDetail;

const update = async function(req, res){
    let err, user, data
    user = req.user;
    data = req.body.allUserInfo;
    user.set(data);
    [err, user] = await to(user.save());
    if(err){
        if(err.message=='Validation error') err = 'The email address or phone number is already in use';
        return ReE(res, err);
    }
    return ReS(res, {message :'Updated User: '+user.email});
}
module.exports.update = update;

const remove = async function(req, res){
    let user, err;
    user = req.user;
    user.remove_by_admin = 1;
 
    [err, user] = await to(user.save()); 
    if(err) return ReE(res, 'error occured trying to delete user');
   
    return ReS(res, {message:'Deleted successfully.'}, 204);
}
module.exports.remove = remove;

const login = async function(req, res){
    const body = req.body; 
    let err, user;
    [err, user] = await to(authService.authUser(req.body));
    if(err) return ReE(res, err, 422);
    if(user.remove_by_admin == 1) return ReE(res, 'Your account is deleted by admin');
    if(user.active == 0) return ReE(res, 'Your account is not verfied.');
    return ReS(res, {token:user.getJWT(), user:user.toWeb()});
}
module.exports.login = login;

const resetPassword = async function(req, res){
    
    const body = req.body.user;
    
    if(!body.email){
        return ReE(res, 'Please enter an email.');
    } else { 
        let err, user;
        [err, user] = await to(userService.authUserByEmail(req.body.user));
        if(err) return ReE(res, err, 422); 

        //console.log(user);

        var resetpasskey = encrypt(req.body.user.email);
        console.log(resetpasskey);
        user.forget_password = resetpasskey;
        [err, user] = await to(user.save());
        
        // outputs hello world
        console.log(decrypt(resetpasskey));
        
        var emailBody = '<table width="100%">';
        emailBody += '<tr>';
        emailBody += '<td>Please click on below link and reset your password.</td>';
        emailBody += '</tr>';
        emailBody += '<tr>';
        emailBody += '<td>Your Token : '+resetpasskey+'</td>';
        emailBody += '</tr>';
        emailBody += '<tr>';
        emailBody += '<td><a href="'+WEB_URL+'/resettoken">Click here</a></td>';
        emailBody += '</tr>';
        emailBody += '</table>';
        emailUtil(body.email,emailBody,'Reset Password.',req, res);
        return ReS(res, {message:"send password to mail"});
    }
}
module.exports.resetPassword = resetPassword;
    
const getPasswordApplied = async function(req, res){
    console.log(req.body);
    var body = req.body.passwordInfo;
    let err, user;
    [err, user] = await to(userService.checkByTokenAndUpdtPass(body)); 
    if(err) return ReE(res, err, 422);     
    return ReS(res, {message:"send password to mail",data:req.body.passwordInfo});
}
module.exports.getPasswordApplied = getPasswordApplied;

const activeRegisteredUser = async function(req, res){
    
    var activeuserkey = req.params.activeuserkey; 
    //console.log(decrypt(activeuserkey));
    let err, user;
    [err, user] = await to(userService.activeUserById(activeuserkey));     
    return ReS(res, {message:"Your account successfully activated."});
}
module.exports.activeRegisteredUser = activeRegisteredUser;

const setProfile = async function(req, res){
    
    var activeuserkey = req.params.activeuserkey; 
    //console.log(decrypt(activeuserkey));
    let err, user;
    [err, user] = await to(userService.activeUserById(activeuserkey));     
    return ReS(res, {message:"Your account successfully activated."});
}
module.exports.setProfile = setProfile;


//********* Change Password **********
const changePassword = async function (req, res) {

    let body = req.body;
    let newPassword = body.newPassword;
    let confirmPassword = body.confirmPassword;

    if (newPassword != confirmPassword) {
        return ReS(res, { message: "New password and repeat password does not match." });
    } else {
        [err, user] = await to(userService.changePassword(req.user, body));
        if (err) return ReE(res, err, 422);
        return ReS(res, { message: "Password change successfully." });
    }
}
module.exports.changePassword = changePassword;

const getAllUsers = async function (req, res) {

    let err, user 
    [err, user] = await to(User.findAll());
    if(err){
        if(err.message=='Validation error') err = 'Unable to found any user.';
        return ReE(res, err);
    }
    return ReS(res, {message :'Found all users ',users:user});
}
module.exports.getAllUsers = getAllUsers;


const createUser = async function(req, res){ 
    console.log(req.body.user);
    const body = req.body.user; 
    if(!body.unique_key && !body.email && !body.phone){
        return ReE(res, 'Please enter an email or phone number to register.');
    } else if(!body.password){
        return ReE(res, 'Please enter a password to register.');
    }else{
        let err, user;

        [err, user] = await to(authService.createUser(body));

        if(err) return ReE(res, err, 422); 
        //var activeuserkey = encrypt('ABC_'+user.id); 
        var emailBody = '<table width="100%">';
        emailBody += '<tr>';
        emailBody += '<td>Hello '+body.first_name+' '+body.last_name+'</td>';
        emailBody += '</tr>';
        emailBody += '<tr>';
        emailBody += '<td>Admin created your account.Please click on below link and active your account.</td>';
        emailBody += '</tr>';
        emailBody += '<tr>';
        emailBody += '<td><a href="http://localhost:8080/api/user/active/'+user.id+'">Click here</a></td>';
        emailBody += '</tr>';
        emailBody += '</table>';
        emailUtil(body.email,emailBody,'Registation Invitation.',req, res);

        return ReS(res, {message:'Successfully created new user.', user:user.toWeb(), token:user.getJWT()}, 201);
    }
}
module.exports.createUser = createUser;

const { to, ReE, ReS } = require('../services/util.service');

const Dashboard = function(req, res){
	let user = req.user.id;
	return res.json({success:true, message:'it worked', data:'user name is :'});
}
module.exports.Dashboard = Dashboard


const { User }          = require('../models');
const authService       = require('../services/auth.service');
const { to, ReE, ReS, encrypt, decrypt, emailUtil }  = require('../services/util.service');
const userService       = require('../services/user.service');
const WEB_URL = 'http://localhost:8080';


const create = async function(req, res){ 
    const body = req.body.user; 
    if(!body.unique_key && !body.email && !body.phone){
        return ReE(res, 'Please enter an email or phone number to register.');
    } else if(!body.password){
        return ReE(res, 'Please enter a password to register.');
    }else{
        let err, user;

        [err, user] = await to(authService.createUser(body));

        if(err) return ReE(res, err, 422); 
        //var activeuserkey = encrypt('ABC_'+user.id); 
        var emailBody = '<table width="100%">';
        emailBody += '<tr>';
        emailBody += '<td>Hello '+body.first_name+' '+body.last_name+'</td>';
        emailBody += '</tr>';
        emailBody += '<tr>';
        emailBody += '<td>Thank you for register on our application.Please click on below link and active your account.</td>';
        emailBody += '</tr>';
        emailBody += '<tr>';
        emailBody += '<td><a href="http://localhost:8080/api/user/active/'+user.id+'">Click here</a></td>';
        emailBody += '</tr>';
        emailBody += '</table>';
        emailUtil(body.email,emailBody,'Registation Invitation.',req, res);
        return ReS(res, {message:'Successfully created new user.', user:user.toWeb(), token:user.getJWT()}, 201);
    }
}
module.exports.create = create;

const getUserDetail = async function(req, res){
    console.log('POPOPOPOPOPO');
    let err, user;
    [err, user] = await to(User.findById(req.body.id));  
    if(err){
        return ReE(res, err);
    } 
    // let company = req.company;
    return ReS(res, {user:user.toWeb()});
}
module.exports.getUserDetail = getUserDetail;

const update = async function(req, res){
    let err, user, data
    user = req.user;
    data = req.body.allUserInfo;
    user.set(data);
    [err, user] = await to(user.save());
    if(err){
        if(err.message=='Validation error') err = 'The email address or phone number is already in use';
        return ReE(res, err);
    }
    return ReS(res, {message :'Updated User: '+user.email});
}
module.exports.update = update;

const remove = async function(req, res){
    let user, err;
    user = req.user;
    user.remove_by_admin = 1;
 
    [err, user] = await to(user.save()); 
    if(err) return ReE(res, 'error occured trying to delete user');
   
    return ReS(res, {message:'Deleted successfully.'}, 204);
}
module.exports.remove = remove;

const login = async function(req, res){
    const body = req.body; 
    let err, user;
    [err, user] = await to(authService.authUser(req.body));
    if(err) return ReE(res, err, 422);
    if(user.remove_by_admin == 1) return ReE(res, 'Your account is deleted by admin');
    if(user.active == 0) return ReE(res, 'Your account is not verfied.');
    return ReS(res, {token:user.getJWT(), user:user.toWeb()});
}
module.exports.login = login;

const resetPassword = async function(req, res){
    
    const body = req.body.user;
    
    if(!body.email){
        return ReE(res, 'Please enter an email.');
    } else { 
        let err, user;
        [err, user] = await to(userService.authUserByEmail(req.body.user));
        if(err) return ReE(res, err, 422); 

        //console.log(user);

        var resetpasskey = encrypt(req.body.user.email);
        console.log(resetpasskey);
        user.forget_password = resetpasskey;
        [err, user] = await to(user.save());
        
        // outputs hello world
        console.log(decrypt(resetpasskey));
        
        var emailBody = '<table width="100%">';
        emailBody += '<tr>';
        emailBody += '<td>Please click on below link and reset your password.</td>';
        emailBody += '</tr>';
        emailBody += '<tr>';
        emailBody += '<td>Your Token : '+resetpasskey+'</td>';
        emailBody += '</tr>';
        emailBody += '<tr>';
        emailBody += '<td><a href="'+WEB_URL+'/resettoken">Click here</a></td>';
        emailBody += '</tr>';
        emailBody += '</table>';
        emailUtil(body.email,emailBody,'Reset Password.',req, res);
        return ReS(res, {message:"send password to mail"});
    }
}
module.exports.resetPassword = resetPassword;
    
const getPasswordApplied = async function(req, res){
    console.log(req.body);
    var body = req.body.passwordInfo;
    let err, user;
    [err, user] = await to(userService.checkByTokenAndUpdtPass(body)); 
    if(err) return ReE(res, err, 422);     
    return ReS(res, {message:"send password to mail",data:req.body.passwordInfo});
}
module.exports.getPasswordApplied = getPasswordApplied;

const activeRegisteredUser = async function(req, res){
    
    var activeuserkey = req.params.activeuserkey; 
    //console.log(decrypt(activeuserkey));
    let err, user;
    [err, user] = await to(userService.activeUserById(activeuserkey));     
    return ReS(res, {message:"Your account successfully activated."});
}
module.exports.activeRegisteredUser = activeRegisteredUser;

const setProfile = async function(req, res){
    
    var activeuserkey = req.params.activeuserkey; 
    //console.log(decrypt(activeuserkey));
    let err, user;
    [err, user] = await to(userService.activeUserById(activeuserkey));     
    return ReS(res, {message:"Your account successfully activated."});
}
module.exports.setProfile = setProfile;


//********* Change Password **********
const changePassword = async function (req, res) {

    let body = req.body;
    let newPassword = body.newPassword;
    let confirmPassword = body.confirmPassword;

    if (newPassword != confirmPassword) {
        return ReS(res, { message: "New password and repeat password does not match." });
    } else {
        [err, user] = await to(userService.changePassword(req.user, body));
        if (err) return ReE(res, err, 422);
        return ReS(res, { message: "Password change successfully." });
    }
}
module.exports.changePassword = changePassword;

const getAllUsers = async function (req, res) {

    let err, user 
    [err, user] = await to(User.findAll());
    if(err){
        if(err.message=='Validation error') err = 'Unable to found any user.';
        return ReE(res, err);
    }
    return ReS(res, {message :'Found all users ',users:user});
}
module.exports.getAllUsers = getAllUsers;


const createUser = async function(req, res){ 
    console.log(req.body.user);
    const body = req.body.user; 
    if(!body.unique_key && !body.email && !body.phone){
        return ReE(res, 'Please enter an email or phone number to register.');
    } else if(!body.password){
        return ReE(res, 'Please enter a password to register.');
    }else{
        let err, user;

        [err, user] = await to(authService.createUser(body));

        if(err) return ReE(res, err, 422); 
        //var activeuserkey = encrypt('ABC_'+user.id); 
        var emailBody = '<table width="100%">';
        emailBody += '<tr>';
        emailBody += '<td>Hello '+body.first_name+' '+body.last_name+'</td>';
        emailBody += '</tr>';
        emailBody += '<tr>';
        emailBody += '<td>Admin created your account.Please click on below link and active your account.</td>';
        emailBody += '</tr>';
        emailBody += '<tr>';
        emailBody += '<td><a href="http://localhost:8080/api/user/active/'+user.id+'">Click here</a></td>';
        emailBody += '</tr>';
        emailBody += '</table>';
        emailUtil(body.email,emailBody,'Registation Invitation.',req, res);

        return ReS(res, {message:'Successfully created new user.', user:user.toWeb(), token:user.getJWT()}, 201);
    }
}
module.exports.createUser = createUser;


import config from 'config';
import { authHeader } from '../_helpers';
import axios from 'axios';
var Usertoken = localStorage.getItem('user'); 
var tokenObj = JSON.parse(Usertoken); 

 

export const userService = {
    login,
    logout,
    register,
    getAll,
    getById,
    update,
    delete: _delete,
    forgetpassword,
    resettoken,
    dashboard,
    profile,
    getAllCompanies,
    addCompany,
    getCompaniesDetails,
    changePassword,
    getAllUsers,
    getUserDetails,
    updateUserDetails,
    addUser
};

function login(email, password) { 
    const userInfo = {
        email: email,
        password: password 
    };   
    return axios.post(`${config.apiUrl}/api/users/login`, userInfo)
        //.then(handleResponse)
        .then(function(response){
            if (response.data.token) { 
                localStorage.setItem('user', JSON.stringify(response.data));               
            }
        });
}

function logout() {
    // remove user from local storage to log user out
    //localStorage.removeItem('user');
}

function getAll() {
    const requestOptions = {
        method: 'GET',
        headers: authHeader()
    };

    return fetch(`${config.apiUrl}/users`, requestOptions).then(handleResponse);
}

function getById(id) {
    const requestOptions = {
        method: 'GET',
        headers: authHeader()
    };

    return fetch(`${config.apiUrl}/users/${id}`, requestOptions).then(handleResponse);
}

function register(user) { 

    return axios({
        method: 'POST',
        url: `${config.apiUrl}/api/users`,
        headers: { 'Content-Type': 'application/json'},
        data: {user:user}
    }).then(handleResponse);   
}

function update(user) {
    const requestOptions = {
        method: 'PUT',
        headers: { ...authHeader(), 'Content-Type': 'application/json' },
        body: JSON.stringify(user)
    };

    return fetch(`${config.apiUrl}/users/${user.id}`, requestOptions).then(handleResponse);;
}

// prefixed function name with underscore because delete is a reserved word in javascript
function _delete(id) {
    const requestOptions = {
        method: 'DELETE',
        headers: authHeader()
    };

    return fetch(`${config.apiUrl}/users/${id}`, requestOptions).then(handleResponse);
}

function forgetpassword(user) { 
    return axios({
        method: 'POST',
        url: `${config.apiUrl}/api/resetpassword`,
        headers: { 'Content-Type': 'application/json'},
        data: {user:user}
    }).then(handleResponse);  
}

function resettoken(passwordInfo) {      
    return axios({
        method: 'POST',
        url: `${config.apiUrl}/api/resetpasswordapplied`,
        headers: { 'Content-Type': 'application/json'},
        data: {passwordInfo:passwordInfo}
    }).then(handleResponse);  
}

function dashboard(loggedInUserInfo) { 
    const requestOptions = {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(loggedInUserInfo)
    };
     
    return fetch(`${config.apiUrl}/api/dashboard`, requestOptions).then(handleResponse);
}

function profile(loggedInUserInfo) { 
    const requestOptions = {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(loggedInUserInfo)
    };
     
    return fetch(`${config.apiUrl}/api/profile`, requestOptions).then(handleResponse);
}

function getAllCompanies() { 
    return axios({
        method: 'POST',
        url: `${config.apiUrl}/api/companies/all`,
        headers: { 'Content-Type': 'application/json', 'Authorization' : tokenObj.token },
    }).then(handleResponse); 
}

function addCompany(companyInfo) {
    const requestOptions = {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization' : tokenObj.token },
        body: JSON.stringify(companyInfo)
    };     
    return fetch(`${config.apiUrl}/api/companies`, requestOptions).then(handleResponse);
}

function getCompaniesDetails(id) {
    return axios({
        method: 'POST',
        url: `${config.apiUrl}/api/companiesdetail`,
        headers: { 'Content-Type': 'application/json', 'Authorization' : tokenObj.token },
        data: {id:id}
    }).then(handleResponse);     
}

function changePassword(changePasswordInfo) {
    const requestOptions = {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization' : tokenObj.token },
        body: JSON.stringify(changePasswordInfo)
    };   
    return fetch(`${config.apiUrl}/api/users/changepassword`, requestOptions).then(handleResponse);
}

function getAllUsers() { 
    return axios({
        method: 'POST',
        url: `${config.apiUrl}/api/users/all`,
        headers: { 'Content-Type': 'application/json', 'Authorization' : tokenObj.token },
    }).then(handleResponse); 
}

function getUserDetails(id) {
    return axios({
        method: 'POST',
        url: `${config.apiUrl}/api/users/userdetail`,
        headers: { 'Content-Type': 'application/json', 'Authorization' : tokenObj.token },
        data: {id:id}
    }).then(handleResponse);     
}

function updateUserDetails(allUserInfo) {
    return axios({
        method: 'POST',
        url: `${config.apiUrl}/api/users/updateuserdetail`,
        headers: { 'Content-Type': 'application/json', 'Authorization' : tokenObj.token },
        data: {allUserInfo:allUserInfo}
    }).then(handleResponse);     
}

function addUser(user) {
    return axios({
        method: 'POST',
        url: `${config.apiUrl}/api/users/adduserbyadmin`,
        headers: { 'Content-Type': 'application/json', 'Authorization' : tokenObj.token },
        data: {user:user}
    }).then(handleResponse);     
} 

function handleResponse(response) { 
    if(response.status = 200){
        return response;
    } else {
        const error = (data && data.message) || response.statusText;
        return Promise.reject(error);
    }

    // return response.text().then(text => {
    //     const data = text && JSON.parse(text);
    //     console.log('data',data);
    // console.log('<<<<<<<<<<<<<<<<<<<<<');
    //     if (!response.ok) {
    //         if (response.status === 401) {
    //             // auto logout if 401 response returned from api
    //             logout();
    //             location.reload(true);
    //         }
    //         const error = (data && data.message) || response.statusText;
    //         return Promise.reject(error);
    //     }

    //     console.log('data',data);
    //     return data;
    // });
}

const { User }          = require('../models');
const authService       = require('../services/auth.service');
const { to, ReE, ReS, encrypt, decrypt, emailUtil }  = require('../services/util.service');
const userService       = require('../services/user.service');
const WEB_URL = 'http://localhost:8080';


const create = async function(req, res){ 
    const body = req.body.user; 
    if(!body.unique_key && !body.email && !body.phone){
        return ReE(res, 'Please enter an email or phone number to register.');
    } else if(!body.password){
        return ReE(res, 'Please enter a password to register.');
    }else{
        let err, user;

        [err, user] = await to(authService.createUser(body));

        if(err) return ReE(res, err, 422); 
        //var activeuserkey = encrypt('ABC_'+user.id); 
        var emailBody = '<table width="100%">';
        emailBody += '<tr>';
        emailBody += '<td>Hello '+body.first_name+' '+body.last_name+'</td>';
        emailBody += '</tr>';
        emailBody += '<tr>';
        emailBody += '<td>Thank you for register on our application.Please click on below link and active your account.</td>';
        emailBody += '</tr>';
        emailBody += '<tr>';
        emailBody += '<td><a href="http://localhost:8080/api/user/active/'+user.id+'">Click here</a></td>';
        emailBody += '</tr>';
        emailBody += '</table>';
        emailUtil(body.email,emailBody,'Registation Invitation.',req, res);
        return ReS(res, {message:'Successfully created new user.', user:user.toWeb(), token:user.getJWT()}, 201);
    }
}
module.exports.create = create;

const getUserDetail = async function(req, res){
    console.log('POPOPOPOPOPO');
    let err, user;
    [err, user] = await to(User.findById(req.body.id));  
    if(err){
        return ReE(res, err);
    } 
    // let company = req.company;
    return ReS(res, {user:user.toWeb()});
}
module.exports.getUserDetail = getUserDetail;

const update = async function(req, res){
    let err, user, data
    user = req.user;
    data = req.body.allUserInfo;
    user.set(data);
    [err, user] = await to(user.save());
    if(err){
        if(err.message=='Validation error') err = 'The email address or phone number is already in use';
        return ReE(res, err);
    }
    return ReS(res, {message :'Updated User: '+user.email});
}
module.exports.update = update;

const remove = async function(req, res){
    let user, err;
    user = req.user;
    user.remove_by_admin = 1;
 
    [err, user] = await to(user.save()); 
    if(err) return ReE(res, 'error occured trying to delete user');
   
    return ReS(res, {message:'Deleted successfully.'}, 204);
}
module.exports.remove = remove;

const login = async function(req, res){
    const body = req.body; 
    let err, user;
    [err, user] = await to(authService.authUser(req.body));
    if(err) return ReE(res, err, 422);
    if(user.remove_by_admin == 1) return ReE(res, 'Your account is deleted by admin');
    if(user.active == 0) return ReE(res, 'Your account is not verfied.');
    return ReS(res, {token:user.getJWT(), user:user.toWeb()});
}
module.exports.login = login;

const resetPassword = async function(req, res){
    
    const body = req.body.user;
    
    if(!body.email){
        return ReE(res, 'Please enter an email.');
    } else { 
        let err, user;
        [err, user] = await to(userService.authUserByEmail(req.body.user));
        if(err) return ReE(res, err, 422); 

        //console.log(user);

        var resetpasskey = encrypt(req.body.user.email);
        console.log(resetpasskey);
        user.forget_password = resetpasskey;
        [err, user] = await to(user.save());
        
        // outputs hello world
        console.log(decrypt(resetpasskey));
        
        var emailBody = '<table width="100%">';
        emailBody += '<tr>';
        emailBody += '<td>Please click on below link and reset your password.</td>';
        emailBody += '</tr>';
        emailBody += '<tr>';
        emailBody += '<td>Your Token : '+resetpasskey+'</td>';
        emailBody += '</tr>';
        emailBody += '<tr>';
        emailBody += '<td><a href="'+WEB_URL+'/resettoken">Click here</a></td>';
        emailBody += '</tr>';
        emailBody += '</table>';
        emailUtil(body.email,emailBody,'Reset Password.',req, res);
        return ReS(res, {message:"send password to mail"});
    }
}
module.exports.resetPassword = resetPassword;
    
const getPasswordApplied = async function(req, res){
    console.log(req.body);
    var body = req.body.passwordInfo;
    let err, user;
    [err, user] = await to(userService.checkByTokenAndUpdtPass(body)); 
    if(err) return ReE(res, err, 422);     
    return ReS(res, {message:"send password to mail",data:req.body.passwordInfo});
}
module.exports.getPasswordApplied = getPasswordApplied;

const activeRegisteredUser = async function(req, res){
    
    var activeuserkey = req.params.activeuserkey; 
    //console.log(decrypt(activeuserkey));
    let err, user;
    [err, user] = await to(userService.activeUserById(activeuserkey));     
    return ReS(res, {message:"Your account successfully activated."});
}
module.exports.activeRegisteredUser = activeRegisteredUser;

const setProfile = async function(req, res){
    
    var activeuserkey = req.params.activeuserkey; 
    //console.log(decrypt(activeuserkey));
    let err, user;
    [err, user] = await to(userService.activeUserById(activeuserkey));     
    return ReS(res, {message:"Your account successfully activated."});
}
module.exports.setProfile = setProfile;


//********* Change Password **********
const changePassword = async function (req, res) {

    let body = req.body;
    let newPassword = body.newPassword;
    let confirmPassword = body.confirmPassword;

    if (newPassword != confirmPassword) {
        return ReS(res, { message: "New password and repeat password does not match." });
    } else {
        [err, user] = await to(userService.changePassword(req.user, body));
        if (err) return ReE(res, err, 422);
        return ReS(res, { message: "Password change successfully." });
    }
}
module.exports.changePassword = changePassword;

const getAllUsers = async function (req, res) {

    let err, user 
    [err, user] = await to(User.findAll());
    if(err){
        if(err.message=='Validation error') err = 'Unable to found any user.';
        return ReE(res, err);
    }
    return ReS(res, {message :'Found all users ',users:user});
}
module.exports.getAllUsers = getAllUsers;


const createUser = async function(req, res){ 
    console.log(req.body.user);
    const body = req.body.user; 
    if(!body.unique_key && !body.email && !body.phone){
        return ReE(res, 'Please enter an email or phone number to register.');
    } else if(!body.password){
        return ReE(res, 'Please enter a password to register.');
    }else{
        let err, user;

        [err, user] = await to(authService.createUser(body));

        if(err) return ReE(res, err, 422); 
        //var activeuserkey = encrypt('ABC_'+user.id); 
        var emailBody = '<table width="100%">';
        emailBody += '<tr>';
        emailBody += '<td>Hello '+body.first_name+' '+body.last_name+'</td>';
        emailBody += '</tr>';
        emailBody += '<tr>';
        emailBody += '<td>Admin created your account.Please click on below link and active your account.</td>';
        emailBody += '</tr>';
        emailBody += '<tr>';
        emailBody += '<td><a href="http://localhost:8080/api/user/active/'+user.id+'">Click here</a></td>';
        emailBody += '</tr>';
        emailBody += '</table>';
        emailUtil(body.email,emailBody,'Registation Invitation.',req, res);

        return ReS(res, {message:'Successfully created new user.', user:user.toWeb(), token:user.getJWT()}, 201);
    }
}
module.exports.createUser = createUser;
const { to, ReE, ReS } = require('../services/util.service');

const Dashboard = function(req, res){
	let user = req.user.id;
	return res.json({success:true, message:'it worked', data:'user name is :'});
}
module.exports.Dashboard = Dashboard

const { User }          = require('../models');
const authService       = require('../services/auth.service');
const { to, ReE, ReS, encrypt, decrypt, emailUtil }  = require('../services/util.service');
const userService       = require('../services/user.service');
const WEB_URL = 'http://localhost:8080';


const create = async function(req, res){ 
    const body = req.body.user; 
    if(!body.unique_key && !body.email && !body.phone){
        return ReE(res, 'Please enter an email or phone number to register.');
    } else if(!body.password){
        return ReE(res, 'Please enter a password to register.');
    }else{
        let err, user;

        [err, user] = await to(authService.createUser(body));

        if(err) return ReE(res, err, 422); 
        //var activeuserkey = encrypt('ABC_'+user.id); 
        var emailBody = '<table width="100%">';
        emailBody += '<tr>';
        emailBody += '<td>Hello '+body.first_name+' '+body.last_name+'</td>';
        emailBody += '</tr>';
        emailBody += '<tr>';
        emailBody += '<td>Thank you for register on our application.Please click on below link and active your account.</td>';
        emailBody += '</tr>';
        emailBody += '<tr>';
        emailBody += '<td><a href="http://localhost:8080/api/user/active/'+user.id+'">Click here</a></td>';
        emailBody += '</tr>';
        emailBody += '</table>';
        emailUtil(body.email,emailBody,'Registation Invitation.',req, res);
        return ReS(res, {message:'Successfully created new user.', user:user.toWeb(), token:user.getJWT()}, 201);
    }
}
module.exports.create = create;

const getUserDetail = async function(req, res){
    console.log('POPOPOPOPOPO');
    let err, user;
    [err, user] = await to(User.findById(req.body.id));  
    if(err){
        return ReE(res, err);
    } 
    // let company = req.company;
    return ReS(res, {user:user.toWeb()});
}
module.exports.getUserDetail = getUserDetail;

const update = async function(req, res){
    let err, user, data
    user = req.user;
    data = req.body.allUserInfo;
    user.set(data);
    [err, user] = await to(user.save());
    if(err){
        if(err.message=='Validation error') err = 'The email address or phone number is already in use';
        return ReE(res, err);
    }
    return ReS(res, {message :'Updated User: '+user.email});
}
module.exports.update = update;

const remove = async function(req, res){
    let user, err;
    user = req.user;
    user.remove_by_admin = 1;
 
    [err, user] = await to(user.save()); 
    if(err) return ReE(res, 'error occured trying to delete user');
   
    return ReS(res, {message:'Deleted successfully.'}, 204);
}
module.exports.remove = remove;

const login = async function(req, res){
    const body = req.body; 
    let err, user;
    [err, user] = await to(authService.authUser(req.body));
    if(err) return ReE(res, err, 422);
    if(user.remove_by_admin == 1) return ReE(res, 'Your account is deleted by admin');
    if(user.active == 0) return ReE(res, 'Your account is not verfied.');
    return ReS(res, {token:user.getJWT(), user:user.toWeb()});
}
module.exports.login = login;

const resetPassword = async function(req, res){
    
    const body = req.body.user;
    
    if(!body.email){
        return ReE(res, 'Please enter an email.');
    } else { 
        let err, user;
        [err, user] = await to(userService.authUserByEmail(req.body.user));
        if(err) return ReE(res, err, 422); 

        //console.log(user);

        var resetpasskey = encrypt(req.body.user.email);
        console.log(resetpasskey);
        user.forget_password = resetpasskey;
        [err, user] = await to(user.save());
        
        // outputs hello world
        console.log(decrypt(resetpasskey));
        
        var emailBody = '<table width="100%">';
        emailBody += '<tr>';
        emailBody += '<td>Please click on below link and reset your password.</td>';
        emailBody += '</tr>';
        emailBody += '<tr>';
        emailBody += '<td>Your Token : '+resetpasskey+'</td>';
        emailBody += '</tr>';
        emailBody += '<tr>';
        emailBody += '<td><a href="'+WEB_URL+'/resettoken">Click here</a></td>';
        emailBody += '</tr>';
        emailBody += '</table>';
        emailUtil(body.email,emailBody,'Reset Password.',req, res);
        return ReS(res, {message:"send password to mail"});
    }
}
module.exports.resetPassword = resetPassword;
    
const getPasswordApplied = async function(req, res){
    console.log(req.body);
    var body = req.body.passwordInfo;
    let err, user;
    [err, user] = await to(userService.checkByTokenAndUpdtPass(body)); 
    if(err) return ReE(res, err, 422);     
    return ReS(res, {message:"send password to mail",data:req.body.passwordInfo});
}
module.exports.getPasswordApplied = getPasswordApplied;

const activeRegisteredUser = async function(req, res){
    
    var activeuserkey = req.params.activeuserkey; 
    //console.log(decrypt(activeuserkey));
    let err, user;
    [err, user] = await to(userService.activeUserById(activeuserkey));     
    return ReS(res, {message:"Your account successfully activated."});
}
module.exports.activeRegisteredUser = activeRegisteredUser;

const setProfile = async function(req, res){
    
    var activeuserkey = req.params.activeuserkey; 
    //console.log(decrypt(activeuserkey));
    let err, user;
    [err, user] = await to(userService.activeUserById(activeuserkey));     
    return ReS(res, {message:"Your account successfully activated."});
}
module.exports.setProfile = setProfile;


//********* Change Password **********
const changePassword = async function (req, res) {

    let body = req.body;
    let newPassword = body.newPassword;
    let confirmPassword = body.confirmPassword;

    if (newPassword != confirmPassword) {
        return ReS(res, { message: "New password and repeat password does not match." });
    } else {
        [err, user] = await to(userService.changePassword(req.user, body));
        if (err) return ReE(res, err, 422);
        return ReS(res, { message: "Password change successfully." });
    }
}
module.exports.changePassword = changePassword;

const getAllUsers = async function (req, res) {

    let err, user 
    [err, user] = await to(User.findAll());
    if(err){
        if(err.message=='Validation error') err = 'Unable to found any user.';
        return ReE(res, err);
    }
    return ReS(res, {message :'Found all users ',users:user});
}
module.exports.getAllUsers = getAllUsers;


const createUser = async function(req, res){ 
    console.log(req.body.user);
    const body = req.body.user; 
    if(!body.unique_key && !body.email && !body.phone){
        return ReE(res, 'Please enter an email or phone number to register.');
    } else if(!body.password){
        return ReE(res, 'Please enter a password to register.');
    }else{
        let err, user;

        [err, user] = await to(authService.createUser(body));

        if(err) return ReE(res, err, 422); 
        //var activeuserkey = encrypt('ABC_'+user.id); 
        var emailBody = '<table width="100%">';
        emailBody += '<tr>';
        emailBody += '<td>Hello '+body.first_name+' '+body.last_name+'</td>';
        emailBody += '</tr>';
        emailBody += '<tr>';
        emailBody += '<td>Admin created your account.Please click on below link and active your account.</td>';
        emailBody += '</tr>';
        emailBody += '<tr>';
        emailBody += '<td><a href="http://localhost:8080/api/user/active/'+user.id+'">Click here</a></td>';
        emailBody += '</tr>';
        emailBody += '</table>';
        emailUtil(body.email,emailBody,'Registation Invitation.',req, res);

        return ReS(res, {message:'Successfully created new user.', user:user.toWeb(), token:user.getJWT()}, 201);
    }
}
module.exports.createUser = createUser;


import config from 'config';
import { authHeader } from '../_helpers';
import axios from 'axios';
var Usertoken = localStorage.getItem('user'); 
var tokenObj = JSON.parse(Usertoken); 

 

export const userService = {
    login,
    logout,
    register,
    getAll,
    getById,
    update,
    delete: _delete,
    forgetpassword,
    resettoken,
    dashboard,
    profile,
    getAllCompanies,
    addCompany,
    getCompaniesDetails,
    changePassword,
    getAllUsers,
    getUserDetails,
    updateUserDetails,
    addUser
};

function login(email, password) { 
    const userInfo = {
        email: email,
        password: password 
    };   
    return axios.post(`${config.apiUrl}/api/users/login`, userInfo)
        //.then(handleResponse)
        .then(function(response){
            if (response.data.token) { 
                localStorage.setItem('user', JSON.stringify(response.data));               
            }
        });
}

function logout() {
    // remove user from local storage to log user out
    //localStorage.removeItem('user');
}

function getAll() {
    const requestOptions = {
        method: 'GET',
        headers: authHeader()
    };

    return fetch(`${config.apiUrl}/users`, requestOptions).then(handleResponse);
}

function getById(id) {
    const requestOptions = {
        method: 'GET',
        headers: authHeader()
    };

    return fetch(`${config.apiUrl}/users/${id}`, requestOptions).then(handleResponse);
}

function register(user) { 

    return axios({
        method: 'POST',
        url: `${config.apiUrl}/api/users`,
        headers: { 'Content-Type': 'application/json'},
        data: {user:user}
    }).then(handleResponse);   
}

function update(user) {
    const requestOptions = {
        method: 'PUT',
        headers: { ...authHeader(), 'Content-Type': 'application/json' },
        body: JSON.stringify(user)
    };

    return fetch(`${config.apiUrl}/users/${user.id}`, requestOptions).then(handleResponse);;
}

// prefixed function name with underscore because delete is a reserved word in javascript
function _delete(id) {
    const requestOptions = {
        method: 'DELETE',
        headers: authHeader()
    };

    return fetch(`${config.apiUrl}/users/${id}`, requestOptions).then(handleResponse);
}

function forgetpassword(user) { 
    return axios({
        method: 'POST',
        url: `${config.apiUrl}/api/resetpassword`,
        headers: { 'Content-Type': 'application/json'},
        data: {user:user}
    }).then(handleResponse);  
}

function resettoken(passwordInfo) {      
    return axios({
        method: 'POST',
        url: `${config.apiUrl}/api/resetpasswordapplied`,
        headers: { 'Content-Type': 'application/json'},
        data: {passwordInfo:passwordInfo}
    }).then(handleResponse);  
}

function dashboard(loggedInUserInfo) { 
    const requestOptions = {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(loggedInUserInfo)
    };
     
    return fetch(`${config.apiUrl}/api/dashboard`, requestOptions).then(handleResponse);
}

function profile(loggedInUserInfo) { 
    const requestOptions = {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(loggedInUserInfo)
    };
     
    return fetch(`${config.apiUrl}/api/profile`, requestOptions).then(handleResponse);
}

function getAllCompanies() { 
    return axios({
        method: 'POST',
        url: `${config.apiUrl}/api/companies/all`,
        headers: { 'Content-Type': 'application/json', 'Authorization' : tokenObj.token },
    }).then(handleResponse); 
}

function addCompany(companyInfo) {
    const requestOptions = {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization' : tokenObj.token },
        body: JSON.stringify(companyInfo)
    };     
    return fetch(`${config.apiUrl}/api/companies`, requestOptions).then(handleResponse);
}

function getCompaniesDetails(id) {
    return axios({
        method: 'POST',
        url: `${config.apiUrl}/api/companiesdetail`,
        headers: { 'Content-Type': 'application/json', 'Authorization' : tokenObj.token },
        data: {id:id}
    }).then(handleResponse);     
}

function changePassword(changePasswordInfo) {
    const requestOptions = {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization' : tokenObj.token },
        body: JSON.stringify(changePasswordInfo)
    };   
    return fetch(`${config.apiUrl}/api/users/changepassword`, requestOptions).then(handleResponse);
}

function getAllUsers() { 
    return axios({
        method: 'POST',
        url: `${config.apiUrl}/api/users/all`,
        headers: { 'Content-Type': 'application/json', 'Authorization' : tokenObj.token },
    }).then(handleResponse); 
}

function getUserDetails(id) {
    return axios({
        method: 'POST',
        url: `${config.apiUrl}/api/users/userdetail`,
        headers: { 'Content-Type': 'application/json', 'Authorization' : tokenObj.token },
        data: {id:id}
    }).then(handleResponse);     
}

function updateUserDetails(allUserInfo) {
    return axios({
        method: 'POST',
        url: `${config.apiUrl}/api/users/updateuserdetail`,
        headers: { 'Content-Type': 'application/json', 'Authorization' : tokenObj.token },
        data: {allUserInfo:allUserInfo}
    }).then(handleResponse);     
}

function addUser(user) {
    return axios({
        method: 'POST',
        url: `${config.apiUrl}/api/users/adduserbyadmin`,
        headers: { 'Content-Type': 'application/json', 'Authorization' : tokenObj.token },
        data: {user:user}
    }).then(handleResponse);     
} 

function handleResponse(response) { 
    if(response.status = 200){
        return response;
    } else {
        const error = (data && data.message) || response.statusText;
        return Promise.reject(error);
    }

    // return response.text().then(text => {
    //     const data = text && JSON.parse(text);
    //     console.log('data',data);
    // console.log('<<<<<<<<<<<<<<<<<<<<<');
    //     if (!response.ok) {
    //         if (response.status === 401) {
    //             // auto logout if 401 response 00returned from api
    //             logout();
    //             location.reload(true);
    //         }
    //         const error = (data && data.message) || response.statusText;
    //         return Promise.reject(error);
    //     }

    //     console.log('data',data);
    //     return data;
    // });
}

const { User }          = require('../models');
const authService       = require('../services/auth.service');
const { to, ReE, ReS, encrypt, decrypt, emailUtil }  = require('../services/util.service');
const userService       = require('../services/user.service');
const WEB_URL = 'http://localhost:8080';


const create = async function(req, res){ 
    const body = req.body.user; 
    if(!body.unique_key && !body.email && !body.phone){
        return ReE(res, 'Please enter an email or phone number to register.');
    } else if(!body.password){
        return ReE(res, 'Please enter a password to register.');
    }else{
        let err, user;

        [err, user] = await to(authService.createUser(body));

        if(err) return ReE(res, err, 422); 
        //var activeuserkey = encrypt('ABC_'+user.id); 
        var emailBody = '<table width="100%">';
        emailBody += '<tr>';
        emailBody += '<td>Hello '+body.first_name+' '+body.last_name+'</td>';
        emailBody += '</tr>';
        emailBody += '<tr>';
        emailBody += '<td>Thank you for register on our application.Please click on below link and active your account.</td>';
        emailBody += '</tr>';
        emailBody += '<tr>';
        emailBody += '<td><a href="http://localhost:8080/api/user/active/'+user.id+'">Click here</a></td>';
        emailBody += '</tr>';
        emailBody += '</table>';
        emailUtil(body.email,emailBody,'Registation Invitation.',req, res);
        return ReS(res, {message:'Successfully created new user.', user:user.toWeb(), token:user.getJWT()}, 201);
    }
}
module.exports.create = create;

const getUserDetail = async function(req, res){
    console.log('POPOPOPOPOPO');
    let err, user;
    [err, user] = await to(User.findById(req.body.id));  
    if(err){
        return ReE(res, err);
    } 
    // let company = req.company;
    return ReS(res, {user:user.toWeb()});
}
module.exports.getUserDetail = getUserDetail;

const update = async function(req, res){
    let err, user, data
    user = req.user;
    data = req.body.allUserInfo;
    user.set(data);
    [err, user] = await to(user.save());
    if(err){
        if(err.message=='Validation error') err = 'The email address or phone number is already in use';
        return ReE(res, err);
    }
    return ReS(res, {message :'Updated User: '+user.email});
}
module.exports.update = update;

const remove = async function(req, res){
    let user, err;
    user = req.user;
    user.remove_by_admin = 1;
 
    [err, user] = await to(user.save()); 
    if(err) return ReE(res, 'error occured trying to delete user');
   
    return ReS(res, {message:'Deleted successfully.'}, 204);
}
module.exports.remove = remove;

const login = async function(req, res){
    const body = req.body; 
    let err, user;
    [err, user] = await to(authService.authUser(req.body));
    if(err) return ReE(res, err, 422);
    if(user.remove_by_admin == 1) return ReE(res, 'Your account is deleted by admin');
    if(user.active == 0) return ReE(res, 'Your account is not verfied.');
    return ReS(res, {token:user.getJWT(), user:user.toWeb()});
}
module.exports.login = login;

const resetPassword = async function(req, res){
    
    const body = req.body.user;
    
    if(!body.email){
        return ReE(res, 'Please enter an email.');
    } else { 
        let err, user;
        [err, user] = await to(userService.authUserByEmail(req.body.user));
        if(err) return ReE(res, err, 422); 

        //console.log(user);

        var resetpasskey = encrypt(req.body.user.email);
        console.log(resetpasskey);
        user.forget_password = resetpasskey;
        [err, user] = await to(user.save());
        
        // outputs hello world
        console.log(decrypt(resetpasskey));
        
        var emailBody = '<table width="100%">';
        emailBody += '<tr>';
        emailBody += '<td>Please click on below link and reset your password.</td>';
        emailBody += '</tr>';
        emailBody += '<tr>';
        emailBody += '<td>Your Token : '+resetpasskey+'</td>';
        emailBody += '</tr>';
        emailBody += '<tr>';
        emailBody += '<td><a href="'+WEB_URL+'/resettoken">Click here</a></td>';
        emailBody += '</tr>';
        emailBody += '</table>';
        emailUtil(body.email,emailBody,'Reset Password.',req, res);
        return ReS(res, {message:"send password to mail"});
    }
}
module.exports.resetPassword = resetPassword;
    
const getPasswordApplied = async function(req, res){
    console.log(req.body);
    var body = req.body.passwordInfo;
    let err, user;
    [err, user] = await to(userService.checkByTokenAndUpdtPass(body)); 
    if(err) return ReE(res, err, 422);     
    return ReS(res, {message:"send password to mail",data:req.body.passwordInfo});
}
module.exports.getPasswordApplied = getPasswordApplied;

const activeRegisteredUser = async function(req, res){
    
    var activeuserkey = req.params.activeuserkey; 
    //console.log(decrypt(activeuserkey));
    let err, user;
    [err, user] = await to(userService.activeUserById(activeuserkey));     
    return ReS(res, {message:"Your account successfully activated."});
}
module.exports.activeRegisteredUser = activeRegisteredUser;

const setProfile = async function(req, res){
    
    var activeuserkey = req.params.activeuserkey; 
    //console.log(decrypt(activeuserkey));
    let err, user;
    [err, user] = await to(userService.activeUserById(activeuserkey));     
    return ReS(res, {message:"Your account successfully activated."});
}
module.exports.setProfile = setProfile;


//********* Change Password **********
const changePassword = async function (req, res) {

    let body = req.body;
    let newPassword = body.newPassword;
    let confirmPassword = body.confirmPassword;

    if (newPassword != confirmPassword) {
        return ReS(res, { message: "New password and repeat password does not match." });
    } else {
        [err, user] = await to(userService.changePassword(req.user, body));
        if (err) return ReE(res, err, 422);
        return ReS(res, { message: "Password change successfully." });
    }
}
module.exports.changePassword = changePassword;

const getAllUsers = async function (req, res) {

    let err, user 
    [err, user] = await to(User.findAll());
    if(err){
        if(err.message=='Validation error') err = 'Unable to found any user.';
        return ReE(res, err);
    }
    return ReS(res, {message :'Found all users ',users:user});
}
module.exports.getAllUsers = getAllUsers;


const createUser = async function(req, res){ 
    console.log(req.body.user);
    const body = req.body.user; 
    if(!body.unique_key && !body.email && !body.phone){
        return ReE(res, 'Please enter an email or phone number to register.');
    } else if(!body.password){
        return ReE(res, 'Please enter a password to register.');
    }else{
        let err, user;

        [err, user] = await to(authService.createUser(body));

        if(err) return ReE(res, err, 422); 
        //var activeuserkey = encrypt('ABC_'+user.id); 
        var emailBody = '<table width="100%">';
        emailBody += '<tr>';
        emailBody += '<td>Hello '+body.first_name+' '+body.last_name+'</td>';
        emailBody += '</tr>';
        emailBody += '<tr>';
        emailBody += '<td>Admin created your account.Please click on below link and active your account.</td>';
        emailBody += '</tr>';
        emailBody += '<tr>';
        emailBody += '<td><a href="http://localhost:8080/api/user/active/'+user.id+'">Click here</a></td>';
        emailBody += '</tr>';
        emailBody += '</table>';
        emailUtil(body.email,emailBody,'Registation Invitation.',req, res);

        return ReS(res, {message:'Successfully created new user.', user:user.toWeb(), token:user.getJWT()}, 201);
    }
}
module.exports.createUser = createUser;

const { to, ReE, ReS } = require('../services/util.service');

const Dashboard = function(req, res){
	let user = req.user.id;
	return res.json({success:true, message:'it worked', data:'user name is :'});
}
module.exports.Dashboard = Dashboard


const { User }          = require('../models');
const authService       = require('../services/auth.service');
const { to, ReE, ReS, encrypt, decrypt, emailUtil }  = require('../services/util.service');
const userService       = require('../services/user.service');
const WEB_URL = 'http://localhost:8080';


const create = async function(req, res){ 
    const body = req.body.user; 
    if(!body.unique_key && !body.email && !body.phone){
        return ReE(res, 'Please enter an email or phone number to register.');
    } else if(!body.password){
        return ReE(res, 'Please enter a password to register.');
    }else{
        let err, user;

        [err, user] = await to(authService.createUser(body));

        if(err) return ReE(res, err, 422); 
        //var activeuserkey = encrypt('ABC_'+user.id); 
        var emailBody = '<table width="100%">';
        emailBody += '<tr>';
        emailBody += '<td>Hello '+body.first_name+' '+body.last_name+'</td>';
        emailBody += '</tr>';
        emailBody += '<tr>';
        emailBody += '<td>Thank you for register on our application.Please click on below link and active your account.</td>';
        emailBody += '</tr>';
        emailBody += '<tr>';
        emailBody += '<td><a href="http://localhost:8080/api/user/active/'+user.id+'">Click here</a></td>';
        emailBody += '</tr>';
        emailBody += '</table>';
        emailUtil(body.email,emailBody,'Registation Invitation.',req, res);
        return ReS(res, {message:'Successfully created new user.', user:user.toWeb(), token:user.getJWT()}, 201);
    }
}
module.exports.create = create;

const getUserDetail = async function(req, res){
    console.log('POPOPOPOPOPO');
    let err, user;
    [err, user] = await to(User.findById(req.body.id));  
    if(err){
        return ReE(res, err);
    } 
    // let company = req.company;
    return ReS(res, {user:user.toWeb()});
}
module.exports.getUserDetail = getUserDetail;

const update = async function(req, res){
    let err, user, data
    user = req.user;
    data = req.body.allUserInfo;
    user.set(data);
    [err, user] = await to(user.save());
    if(err){
        if(err.message=='Validation error') err = 'The email address or phone number is already in use';
        return ReE(res, err);
    }
    return ReS(res, {message :'Updated User: '+user.email});
}
module.exports.update = update;

const remove = async function(req, res){
    let user, err;
    user = req.user;
    user.remove_by_admin = 1;
 
    [err, user] = await to(user.save()); 
    if(err) return ReE(res, 'error occured trying to delete user');
   
    return ReS(res, {message:'Deleted successfully.'}, 204);
}
module.exports.remove = remove;

const login = async function(req, res){
    const body = req.body; 
    let err, user;
    [err, user] = await to(authService.authUser(req.body));
    if(err) return ReE(res, err, 422);
    if(user.remove_by_admin == 1) return ReE(res, 'Your account is deleted by admin');
    if(user.active == 0) return ReE(res, 'Your account is not verfied.');
    return ReS(res, {token:user.getJWT(), user:user.toWeb()});
}
module.exports.login = login;

const resetPassword = async function(req, res){
    
    const body = req.body.user;
    
    if(!body.email){
        return ReE(res, 'Please enter an email.');
    } else { 
        let err, user;
        [err, user] = await to(userService.authUserByEmail(req.body.user));
        if(err) return ReE(res, err, 422); 

        //console.log(user);

        var resetpasskey = encrypt(req.body.user.email);
        console.log(resetpasskey);
        user.forget_password = resetpasskey;
        [err, user] = await to(user.save());
        
        // outputs hello world
        console.log(decrypt(resetpasskey));
        
        var emailBody = '<table width="100%">';
        emailBody += '<tr>';
        emailBody += '<td>Please click on below link and reset your password.</td>';
        emailBody += '</tr>';
        emailBody += '<tr>';
        emailBody += '<td>Your Token : '+resetpasskey+'</td>';
        emailBody += '</tr>';
        emailBody += '<tr>';
        emailBody += '<td><a href="'+WEB_URL+'/resettoken">Click here</a></td>';
        emailBody += '</tr>';
        emailBody += '</table>';
        emailUtil(body.email,emailBody,'Reset Password.',req, res);
        return ReS(res, {message:"send password to mail"});
    }
}
module.exports.resetPassword = resetPassword;
    
const getPasswordApplied = async function(req, res){
    console.log(req.body);
    var body = req.body.passwordInfo;
    let err, user;
    [err, user] = await to(userService.checkByTokenAndUpdtPass(body)); 
    if(err) return ReE(res, err, 422);     
    return ReS(res, {message:"send password to mail",data:req.body.passwordInfo});
}
module.exports.getPasswordApplied = getPasswordApplied;

const activeRegisteredUser = async function(req, res){
    
    var activeuserkey = req.params.activeuserkey; 
    //console.log(decrypt(activeuserkey));
    let err, user;
    [err, user] = await to(userService.activeUserById(activeuserkey));     
    return ReS(res, {message:"Your account successfully activated."});
}
module.exports.activeRegisteredUser = activeRegisteredUser;

const setProfile = async function(req, res){
    
    var activeuserkey = req.params.activeuserkey; 
    //console.log(decrypt(activeuserkey));
    let err, user;
    [err, user] = await to(userService.activeUserById(activeuserkey));     
    return ReS(res, {message:"Your account successfully activated."});
}
module.exports.setProfile = setProfile;


//********* Change Password **********
const changePassword = async function (req, res) {

    let body = req.body;
    let newPassword = body.newPassword;
    let confirmPassword = body.confirmPassword;

    if (newPassword != confirmPassword) {
        return ReS(res, { message: "New password and repeat password does not match." });
    } else {
        [err, user] = await to(userService.changePassword(req.user, body));
        if (err) return ReE(res, err, 422);
        return ReS(res, { message: "Password change successfully." });
    }
}
module.exports.changePassword = changePassword;

const getAllUsers = async function (req, res) {

    let err, user 
    [err, user] = await to(User.findAll());
    if(err){
        if(err.message=='Validation error') err = 'Unable to found any user.';
        return ReE(res, err);
    }
    return ReS(res, {message :'Found all users ',users:user});
}
module.exports.getAllUsers = getAllUsers;


const createUser = async function(req, res){ 
    console.log(req.body.user);
    const body = req.body.user; 
    if(!body.unique_key && !body.email && !body.phone){
        return ReE(res, 'Please enter an email or phone number to register.');
    } else if(!body.password){
        return ReE(res, 'Please enter a password to register.');
    }else{
        let err, user;

        [err, user] = await to(authService.createUser(body));

        if(err) return ReE(res, err, 422); 
        //var activeuserkey = encrypt('ABC_'+user.id); 
        var emailBody = '<table width="100%">';
        emailBody += '<tr>';
        emailBody += '<td>Hello '+body.first_name+' '+body.last_name+'</td>';
        emailBody += '</tr>';
        emailBody += '<tr>';
        emailBody += '<td>Admin created your account.Please click on below link and active your account.</td>';
        emailBody += '</tr>';
        emailBody += '<tr>';
        emailBody += '<td><a href="http://localhost:8080/api/user/active/'+user.id+'">Click here</a></td>';
        emailBody += '</tr>';
        emailBody += '</table>';
        emailUtil(body.email,emailBody,'Registation Invitation.',req, res);

        return ReS(res, {message:'Successfully created new user.', user:user.toWeb(), token:user.getJWT()}, 201);
    }
}
module.exports.createUser = createUser;


import config from 'config';
import { authHeader } from '../_helpers';
import axios from 'axios';
var Usertoken = localStorage.getItem('user'); 
var tokenObj = JSON.parse(Usertoken); 

 

export const userService = {
    login,
    logout,
    register,
    getAll,
    getById,
    update,
    delete: _delete,
    forgetpassword,
    resettoken,
    dashboard,
    profile,
    getAllCompanies,
    addCompany,
    getCompaniesDetails,
    changePassword,
    getAllUsers,
    getUserDetails,
    updateUserDetails,
    addUser
};

function login(email, password) { 
    const userInfo = {
        email: email,
        password: password 
    };   
    return axios.post(`${config.apiUrl}/api/users/login`, userInfo)
        //.then(handleResponse)
        .then(function(response){
            if (response.data.token) { 
                localStorage.setItem('user', JSON.stringify(response.data));               
            }
        });
}

function logout() {
    // remove user from local storage to log user out
    //localStorage.removeItem('user');
}

function getAll() {
    const requestOptions = {
        method: 'GET',
        headers: authHeader()
    };

    return fetch(`${config.apiUrl}/users`, requestOptions).then(handleResponse);
}

function getById(id) {
    const requestOptions = {
        method: 'GET',
        headers: authHeader()
    };

    return fetch(`${config.apiUrl}/users/${id}`, requestOptions).then(handleResponse);
}

function register(user) { 

    return axios({
        method: 'POST',
        url: `${config.apiUrl}/api/users`,
        headers: { 'Content-Type': 'application/json'},
        data: {user:user}
    }).then(handleResponse);   
}

function update(user) {
    const requestOptions = {
        method: 'PUT',
        headers: { ...authHeader(), 'Content-Type': 'application/json' },
        body: JSON.stringify(user)
    };

    return fetch(`${config.apiUrl}/users/${user.id}`, requestOptions).then(handleResponse);;
}

// prefixed function name with underscore because delete is a reserved word in javascript
function _delete(id) {
    const requestOptions = {
        method: 'DELETE',
        headers: authHeader()
    };

    return fetch(`${config.apiUrl}/users/${id}`, requestOptions).then(handleResponse);
}

function forgetpassword(user) { 
    return axios({
        method: 'POST',
        url: `${config.apiUrl}/api/resetpassword`,
        headers: { 'Content-Type': 'application/json'},
        data: {user:user}
    }).then(handleResponse);  
}

function resettoken(passwordInfo) {      
    return axios({
        method: 'POST',
        url: `${config.apiUrl}/api/resetpasswordapplied`,
        headers: { 'Content-Type': 'application/json'},
        data: {passwordInfo:passwordInfo}
    }).then(handleResponse);  
}

function dashboard(loggedInUserInfo) { 
    const requestOptions = {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(loggedInUserInfo)
    };
     
    return fetch(`${config.apiUrl}/api/dashboard`, requestOptions).then(handleResponse);
}

function profile(loggedInUserInfo) { 
    const requestOptions = {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(loggedInUserInfo)
    };
     
    return fetch(`${config.apiUrl}/api/profile`, requestOptions).then(handleResponse);
}

function getAllCompanies() { 
    return axios({
        method: 'POST',
        url: `${config.apiUrl}/api/companies/all`,
        headers: { 'Content-Type': 'application/json', 'Authorization' : tokenObj.token },
    }).then(handleResponse); 
}

function addCompany(companyInfo) {
    const requestOptions = {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization' : tokenObj.token },
        body: JSON.stringify(companyInfo)
    };     
    return fetch(`${config.apiUrl}/api/companies`, requestOptions).then(handleResponse);
}

function getCompaniesDetails(id) {
    return axios({
        method: 'POST',
        url: `${config.apiUrl}/api/companiesdetail`,
        headers: { 'Content-Type': 'application/json', 'Authorization' : tokenObj.token },
        data: {id:id}
    }).then(handleResponse);     
}

function changePassword(changePasswordInfo) {
    const requestOptions = {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization' : tokenObj.token },
        body: JSON.stringify(changePasswordInfo)
    };   
    return fetch(`${config.apiUrl}/api/users/changepassword`, requestOptions).then(handleResponse);
}

function getAllUsers() { 
    return axios({
        method: 'POST',
        url: `${config.apiUrl}/api/users/all`,
        headers: { 'Content-Type': 'application/json', 'Authorization' : tokenObj.token },
    }).then(handleResponse); 
}

function getUserDetails(id) {
    return axios({
        method: 'POST',
        url: `${config.apiUrl}/api/users/userdetail`,
        headers: { 'Content-Type': 'application/json', 'Authorization' : tokenObj.token },
        data: {id:id}
    }).then(handleResponse);     
}

function updateUserDetails(allUserInfo) {
    return axios({
        method: 'POST',
        url: `${config.apiUrl}/api/users/updateuserdetail`,
        headers: { 'Content-Type': 'application/json', 'Authorization' : tokenObj.token },
        data: {allUserInfo:allUserInfo}
    }).then(handleResponse);     
}

function addUser(user) {
    return axios({
        method: 'POST',
        url: `${config.apiUrl}/api/users/adduserbyadmin`,
        headers: { 'Content-Type': 'application/json', 'Authorization' : tokenObj.token },
        data: {user:user}
    }).then(handleResponse);     
} 

function handleResponse(response) { 
    if(response.status = 200){
        return response;
    } else {
        const error = (data && data.message) || response.statusText;
        return Promise.reject(error);
    }

    // return response.text().then(text => {
    //     const data = text && JSON.parse(text);
    //     console.log('data',data);
    // console.log('<<<<<<<<<<<<<<<<<<<<<');
    //     if (!response.ok) {
    //         if (response.status === 401) {
    //             // auto logout if 401 response returned from api
    //             logout();
    //             location.reload(true);
    //         }
    //         const error = (data && data.message) || response.statusText;
    //         return Promise.reject(error);
    //     }

    //     console.log('data',data);
    //     return data;
    // });
}

const { User }          = require('../models');
const authService       = require('../services/auth.service');
const { to, ReE, ReS, encrypt, decrypt, emailUtil }  = require('../services/util.service');
const userService       = require('../services/user.service');
const WEB_URL = 'http://localhost:8080';


const create = async function(req, res){ 
    const body = req.body.user; 
    if(!body.unique_key && !body.email && !body.phone){
        return ReE(res, 'Please enter an email or phone number to register.');
    } else if(!body.password){
        return ReE(res, 'Please enter a password to register.');
    }else{
        let err, user;

        [err, user] = await to(authService.createUser(body));

        if(err) return ReE(res, err, 422); 
        //var activeuserkey = encrypt('ABC_'+user.id); 
        var emailBody = '<table width="100%">';
        emailBody += '<tr>';
        emailBody += '<td>Hello '+body.first_name+' '+body.last_name+'</td>';
        emailBody += '</tr>';
        emailBody += '<tr>';
        emailBody += '<td>Thank you for register on our application.Please click on below link and active your account.</td>';
        emailBody += '</tr>';
        emailBody += '<tr>';
        emailBody += '<td><a href="http://localhost:8080/api/user/active/'+user.id+'">Click here</a></td>';
        emailBody += '</tr>';
        emailBody += '</table>';
        emailUtil(body.email,emailBody,'Registation Invitation.',req, res);
        return ReS(res, {message:'Successfully created new user.', user:user.toWeb(), token:user.getJWT()}, 201);
    }
}
module.exports.create = create;

const getUserDetail = async function(req, res){
    console.log('POPOPOPOPOPO');
    let err, user;
    [err, user] = await to(User.findById(req.body.id));  
    if(err){
        return ReE(res, err);
    } 
    // let company = req.company;
    return ReS(res, {user:user.toWeb()});
}
module.exports.getUserDetail = getUserDetail;

const update = async function(req, res){
    let err, user, data
    user = req.user;
    data = req.body.allUserInfo;
    user.set(data);
    [err, user] = await to(user.save());
    if(err){
        if(err.message=='Validation error') err = 'The email address or phone number is already in use';
        return ReE(res, err);
    }
    return ReS(res, {message :'Updated User: '+user.email});
}
module.exports.update = update;

const remove = async function(req, res){
    let user, err;
    user = req.user;
    user.remove_by_admin = 1;
 
    [err, user] = await to(user.save()); 
    if(err) return ReE(res, 'error occured trying to delete user');
   
    return ReS(res, {message:'Deleted successfully.'}, 204);
}
module.exports.remove = remove;

const login = async function(req, res){
    const body = req.body; 
    let err, user;
    [err, user] = await to(authService.authUser(req.body));
    if(err) return ReE(res, err, 422);
    if(user.remove_by_admin == 1) return ReE(res, 'Your account is deleted by admin');
    if(user.active == 0) return ReE(res, 'Your account is not verfied.');
    return ReS(res, {token:user.getJWT(), user:user.toWeb()});
}
module.exports.login = login;

const resetPassword = async function(req, res){
    
    const body = req.body.user;
    
    if(!body.email){
        return ReE(res, 'Please enter an email.');
    } else { 
        let err, user;
        [err, user] = await to(userService.authUserByEmail(req.body.user));
        if(err) return ReE(res, err, 422); 

        //console.log(user);

        var resetpasskey = encrypt(req.body.user.email);
        console.log(resetpasskey);
        user.forget_password = resetpasskey;
        [err, user] = await to(user.save());
        
        // outputs hello world
        console.log(decrypt(resetpasskey));
        
        var emailBody = '<table width="100%">';
        emailBody += '<tr>';
        emailBody += '<td>Please click on below link and reset your password.</td>';
        emailBody += '</tr>';
        emailBody += '<tr>';
        emailBody += '<td>Your Token : '+resetpasskey+'</td>';
        emailBody += '</tr>';
        emailBody += '<tr>';
        emailBody += '<td><a href="'+WEB_URL+'/resettoken">Click here</a></td>';
        emailBody += '</tr>';
        emailBody += '</table>';
        emailUtil(body.email,emailBody,'Reset Password.',req, res);
        return ReS(res, {message:"send password to mail"});
    }
}
module.exports.resetPassword = resetPassword;
    
const getPasswordApplied = async function(req, res){
    console.log(req.body);
    var body = req.body.passwordInfo;
    let err, user;
    [err, user] = await to(userService.checkByTokenAndUpdtPass(body)); 
    if(err) return ReE(res, err, 422);     
    return ReS(res, {message:"send password to mail",data:req.body.passwordInfo});
}
module.exports.getPasswordApplied = getPasswordApplied;

const activeRegisteredUser = async function(req, res){
    
    var activeuserkey = req.params.activeuserkey; 
    //console.log(decrypt(activeuserkey));
    let err, user;
    [err, user] = await to(userService.activeUserById(activeuserkey));     
    return ReS(res, {message:"Your account successfully activated."});
}
module.exports.activeRegisteredUser = activeRegisteredUser;

const setProfile = async function(req, res){
    
    var activeuserkey = req.params.activeuserkey; 
    //console.log(decrypt(activeuserkey));
    let err, user;
    [err, user] = await to(userService.activeUserById(activeuserkey));     
    return ReS(res, {message:"Your account successfully activated."});
}
module.exports.setProfile = setProfile;


//********* Change Password **********
const changePassword = async function (req, res) {

    let body = req.body;
    let newPassword = body.newPassword;
    let confirmPassword = body.confirmPassword;

    if (newPassword != confirmPassword) {
        return ReS(res, { message: "New password and repeat password does not match." });
    } else {
        [err, user] = await to(userService.changePassword(req.user, body));
        if (err) return ReE(res, err, 422);
        return ReS(res, { message: "Password change successfully." });
    }
}
module.exports.changePassword = changePassword;

const getAllUsers = async function (req, res) {

    let err, user 
    [err, user] = await to(User.findAll());
    if(err){
        if(err.message=='Validation error') err = 'Unable to found any user.';
        return ReE(res, err);
    }
    return ReS(res, {message :'Found all users ',users:user});
}
module.exports.getAllUsers = getAllUsers;


const createUser = async function(req, res){ 
    console.log(req.body.user);
    const body = req.body.user; 
    if(!body.unique_key && !body.email && !body.phone){
        return ReE(res, 'Please enter an email or phone number to register.');
    } else if(!body.password){
        return ReE(res, 'Please enter a password to register.');
    }else{
        let err, user;

        [err, user] = await to(authService.createUser(body));

        if(err) return ReE(res, err, 422); 
        //var activeuserkey = encrypt('ABC_'+user.id); 
        var emailBody = '<table width="100%">';
        emailBody += '<tr>';
        emailBody += '<td>Hello '+body.first_name+' '+body.last_name+'</td>';
        emailBody += '</tr>';
        emailBody += '<tr>';
        emailBody += '<td>Admin created your account.Please click on below link and active your account.</td>';
        emailBody += '</tr>';
        emailBody += '<tr>';
        emailBody += '<td><a href="http://localhost:8080/api/user/active/'+user.id+'">Click here</a></td>';
        emailBody += '</tr>';
        emailBody += '</table>';
        emailUtil(body.email,emailBody,'Registation Invitation.',req, res);

        return ReS(res, {message:'Successfully created new user.', user:user.toWeb(), token:user.getJWT()}, 201);
    }
}
module.exports.createUser = createUser;

const { to, ReE, ReS } = require('../services/util.service');

const Dashboard = function(req, res){
	let user = req.user.id;
	return res.json({success:true, message:'it worked', data:'user name is :'});
}
module.exports.Dashboard = Dashboard


const { User }          = require('../models');
const authService       = require('../services/auth.service');
const { to, ReE, ReS, encrypt, decrypt, emailUtil }  = require('../services/util.service');
const userService       = require('../services/user.service');
const WEB_URL = 'http://localhost:8080';


const create = async function(req, res){ 
    const body = req.body.user; 
    if(!body.unique_key && !body.email && !body.phone){
        return ReE(res, 'Please enter an email or phone number to register.');
    } else if(!body.password){
        return ReE(res, 'Please enter a password to register.');
    }else{
        let err, user;

        [err, user] = await to(authService.createUser(body));

        if(err) return ReE(res, err, 422); 
        //var activeuserkey = encrypt('ABC_'+user.id); 
        var emailBody = '<table width="100%">';
        emailBody += '<tr>';
        emailBody += '<td>Hello '+body.first_name+' '+body.last_name+'</td>';
        emailBody += '</tr>';
        emailBody += '<tr>';
        emailBody += '<td>Thank you for register on our application.Please click on below link and active your account.</td>';
        emailBody += '</tr>';
        emailBody += '<tr>';
        emailBody += '<td><a href="http://localhost:8080/api/user/active/'+user.id+'">Click here</a></td>';
        emailBody += '</tr>';
        emailBody += '</table>';
        emailUtil(body.email,emailBody,'Registation Invitation.',req, res);
        return ReS(res, {message:'Successfully created new user.', user:user.toWeb(), token:user.getJWT()}, 201);
    }
}
module.exports.create = create;

const getUserDetail = async function(req, res){
    console.log('POPOPOPOPOPO');
    let err, user;
    [err, user] = await to(User.findById(req.body.id));  
    if(err){
        return ReE(res, err);
    } 
    // let company = req.company;
    return ReS(res, {user:user.toWeb()});
}
module.exports.getUserDetail = getUserDetail;

const update = async function(req, res){
    let err, user, data
    user = req.user;
    data = req.body.allUserInfo;
    user.set(data);
    [err, user] = await to(user.save());
    if(err){
        if(err.message=='Validation error') err = 'The email address or phone number is already in use';
        return ReE(res, err);
    }
    return ReS(res, {message :'Updated User: '+user.email});
}
module.exports.update = update;

const remove = async function(req, res){
    let user, err;
    user = req.user;
    user.remove_by_admin = 1;
 
    [err, user] = await to(user.save()); 
    if(err) return ReE(res, 'error occured trying to delete user');
   
    return ReS(res, {message:'Deleted successfully.'}, 204);
}
module.exports.remove = remove;

const login = async function(req, res){
    const body = req.body; 
    let err, user;
    [err, user] = await to(authService.authUser(req.body));
    if(err) return ReE(res, err, 422);
    if(user.remove_by_admin == 1) return ReE(res, 'Your account is deleted by admin');
    if(user.active == 0) return ReE(res, 'Your account is not verfied.');
    return ReS(res, {token:user.getJWT(), user:user.toWeb()});
}
module.exports.login = login;

const resetPassword = async function(req, res){
    
    const body = req.body.user;
    
    if(!body.email){
        return ReE(res, 'Please enter an email.');
    } else { 
        let err, user;
        [err, user] = await to(userService.authUserByEmail(req.body.user));
        if(err) return ReE(res, err, 422); 

        //console.log(user);

        var resetpasskey = encrypt(req.body.user.email);
        console.log(resetpasskey);
        user.forget_password = resetpasskey;
        [err, user] = await to(user.save());
        
        // outputs hello world
        console.log(decrypt(resetpasskey));
        
        var emailBody = '<table width="100%">';
        emailBody += '<tr>';
        emailBody += '<td>Please click on below link and reset your password.</td>';
        emailBody += '</tr>';
        emailBody += '<tr>';
        emailBody += '<td>Your Token : '+resetpasskey+'</td>';
        emailBody += '</tr>';
        emailBody += '<tr>';
        emailBody += '<td><a href="'+WEB_URL+'/resettoken">Click here</a></td>';
        emailBody += '</tr>';
        emailBody += '</table>';
        emailUtil(body.email,emailBody,'Reset Password.',req, res);
        return ReS(res, {message:"send password to mail"});
    }
}
module.exports.resetPassword = resetPassword;
    
const getPasswordApplied = async function(req, res){
    console.log(req.body);
    var body = req.body.passwordInfo;
    let err, user;
    [err, user] = await to(userService.checkByTokenAndUpdtPass(body)); 
    if(err) return ReE(res, err, 422);     
    return ReS(res, {message:"send password to mail",data:req.body.passwordInfo});
}
module.exports.getPasswordApplied = getPasswordApplied;

const activeRegisteredUser = async function(req, res){
    
    var activeuserkey = req.params.activeuserkey; 
    //console.log(decrypt(activeuserkey));
    let err, user;
    [err, user] = await to(userService.activeUserById(activeuserkey));     
    return ReS(res, {message:"Your account successfully activated."});
}
module.exports.activeRegisteredUser = activeRegisteredUser;

const setProfile = async function(req, res){
    
    var activeuserkey = req.params.activeuserkey; 
    //console.log(decrypt(activeuserkey));
    let err, user;
    [err, user] = await to(userService.activeUserById(activeuserkey));     
    return ReS(res, {message:"Your account successfully activated."});
}
module.exports.setProfile = setProfile;


//********* Change Password **********
const changePassword = async function (req, res) {

    let body = req.body;
    let newPassword = body.newPassword;
    let confirmPassword = body.confirmPassword;

    if (newPassword != confirmPassword) {
        return ReS(res, { message: "New password and repeat password does not match." });
    } else {
        [err, user] = await to(userService.changePassword(req.user, body));
        if (err) return ReE(res, err, 422);
        return ReS(res, { message: "Password change successfully." });
    }
}
module.exports.changePassword = changePassword;

const getAllUsers = async function (req, res) {

    let err, user 
    [err, user] = await to(User.findAll());
    if(err){
        if(err.message=='Validation error') err = 'Unable to found any user.';
        return ReE(res, err);
    }
    return ReS(res, {message :'Found all users ',users:user});
}
module.exports.getAllUsers = getAllUsers;


const createUser = async function(req, res){ 
    console.log(req.body.user);
    const body = req.body.user; 
    if(!body.unique_key && !body.email && !body.phone){
        return ReE(res, 'Please enter an email or phone number to register.');
    } else if(!body.password){
        return ReE(res, 'Please enter a password to register.');
    }else{
        let err, user;

        [err, user] = await to(authService.createUser(body));

        if(err) return ReE(res, err, 422); 
        //var activeuserkey = encrypt('ABC_'+user.id); 
        var emailBody = '<table width="100%">';
        emailBody += '<tr>';
        emailBody += '<td>Hello '+body.first_name+' '+body.last_name+'</td>';
        emailBody += '</tr>';
        emailBody += '<tr>';
        emailBody += '<td>Admin created your account.Please click on below link and active your account.</td>';
        emailBody += '</tr>';
        emailBody += '<tr>';
        emailBody += '<td><a href="http://localhost:8080/api/user/active/'+user.id+'">Click here</a></td>';
        emailBody += '</tr>';
        emailBody += '</table>';
        emailUtil(body.email,emailBody,'Registation Invitation.',req, res);

        return ReS(res, {message:'Successfully created new user.', user:user.toWeb(), token:user.getJWT()}, 201);
    }
}
module.exports.createUser = createUser;


import config from 'config';
import { authHeader } from '../_helpers';
import axios from 'axios';
var Usertoken = localStorage.getItem('user'); 
var tokenObj = JSON.parse(Usertoken); 

 

export const userService = {
    login,
    logout,
    register,
    getAll,
    getById,
    update,
    delete: _delete,
    forgetpassword,
    resettoken,
    dashboard,
    profile,
    getAllCompanies,
    addCompany,
    getCompaniesDetails,
    changePassword,
    getAllUsers,
    getUserDetails,
    updateUserDetails,
    addUser
};

function login(email, password) { 
    const userInfo = {
        email: email,
        password: password 
    };   
    return axios.post(`${config.apiUrl}/api/users/login`, userInfo)
        //.then(handleResponse)
        .then(function(response){
            if (response.data.token) { 
                localStorage.setItem('user', JSON.stringify(response.data));               
            }
        });
}

function logout() {
    // remove user from local storage to log user out
    //localStorage.removeItem('user');
}

function getAll() {
    const requestOptions = {
        method: 'GET',
        headers: authHeader()
    };

    return fetch(`${config.apiUrl}/users`, requestOptions).then(handleResponse);
}

function getById(id) {
    const requestOptions = {
        method: 'GET',
        headers: authHeader()
    };

    return fetch(`${config.apiUrl}/users/${id}`, requestOptions).then(handleResponse);
}

function register(user) { 

    return axios({
        method: 'POST',
        url: `${config.apiUrl}/api/users`,
        headers: { 'Content-Type': 'application/json'},
        data: {user:user}
    }).then(handleResponse);   
}

function update(user) {
    const requestOptions = {
        method: 'PUT',
        headers: { ...authHeader(), 'Content-Type': 'application/json' },
        body: JSON.stringify(user)
    };

    return fetch(`${config.apiUrl}/users/${user.id}`, requestOptions).then(handleResponse);;
}

// prefixed function name with underscore because delete is a reserved word in javascript
function _delete(id) {
    const requestOptions = {
        method: 'DELETE',
        headers: authHeader()
    };

    return fetch(`${config.apiUrl}/users/${id}`, requestOptions).then(handleResponse);
}

function forgetpassword(user) { 
    return axios({
        method: 'POST',
        url: `${config.apiUrl}/api/resetpassword`,
        headers: { 'Content-Type': 'application/json'},
        data: {user:user}
    }).then(handleResponse);  
}

function resettoken(passwordInfo) {      
    return axios({
        method: 'POST',
        url: `${config.apiUrl}/api/resetpasswordapplied`,
        headers: { 'Content-Type': 'application/json'},
        data: {passwordInfo:passwordInfo}
    }).then(handleResponse);  
}

function dashboard(loggedInUserInfo) { 
    const requestOptions = {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(loggedInUserInfo)
    };
     
    return fetch(`${config.apiUrl}/api/dashboard`, requestOptions).then(handleResponse);
}

function profile(loggedInUserInfo) { 
    const requestOptions = {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(loggedInUserInfo)
    };
     
    return fetch(`${config.apiUrl}/api/profile`, requestOptions).then(handleResponse);
}

function getAllCompanies() { 
    return axios({
        method: 'POST',
        url: `${config.apiUrl}/api/companies/all`,
        headers: { 'Content-Type': 'application/json', 'Authorization' : tokenObj.token },
    }).then(handleResponse); 
}

function addCompany(companyInfo) {
    const requestOptions = {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization' : tokenObj.token },
        body: JSON.stringify(companyInfo)
    };     
    return fetch(`${config.apiUrl}/api/companies`, requestOptions).then(handleResponse);
}

function getCompaniesDetails(id) {
    return axios({
        method: 'POST',
        url: `${config.apiUrl}/api/companiesdetail`,
        headers: { 'Content-Type': 'application/json', 'Authorization' : tokenObj.token },
        data: {id:id}
    }).then(handleResponse);     
}

function changePassword(changePasswordInfo) {
    const requestOptions = {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization' : tokenObj.token },
        body: JSON.stringify(changePasswordInfo)
    };   
    return fetch(`${config.apiUrl}/api/users/changepassword`, requestOptions).then(handleResponse);
}

function getAllUsers() { 
    return axios({
        method: 'POST',
        url: `${config.apiUrl}/api/users/all`,
        headers: { 'Content-Type': 'application/json', 'Authorization' : tokenObj.token },
    }).then(handleResponse); 
}

function getUserDetails(id) {
    return axios({
        method: 'POST',
        url: `${config.apiUrl}/api/users/userdetail`,
        headers: { 'Content-Type': 'application/json', 'Authorization' : tokenObj.token },
        data: {id:id}
    }).then(handleResponse);     
}

function updateUserDetails(allUserInfo) {
    return axios({
        method: 'POST',
        url: `${config.apiUrl}/api/users/updateuserdetail`,
        headers: { 'Content-Type': 'application/json', 'Authorization' : tokenObj.token },
        data: {allUserInfo:allUserInfo}
    }).then(handleResponse);     
}

function addUser(user) {
    return axios({
        method: 'POST',
        url: `${config.apiUrl}/api/users/adduserbyadmin`,
        headers: { 'Content-Type': 'application/json', 'Authorization' : tokenObj.token },
        data: {user:user}
    }).then(handleResponse);     
} 

function handleResponse(response) { 
    if(response.status = 200){
        return response;
    } else {
        const error = (data && data.message) || response.statusText;
        return Promise.reject(error);
    }

    // return response.text().then(text => {
    //     const data = text && JSON.parse(text);
    //     console.log('data',data);
    // console.log('<<<<<<<<<<<<<<<<<<<<<');
    //     if (!response.ok) {
    //         if (response.status === 401) {
    //             // auto logout if 401 response returned from api
    //             logout();
    //             location.reload(true);
    //         }
    //         const error = (data && data.message) || response.statusText;
    //         return Promise.reject(error);
    //     }

    //     console.log('data',data);
    //     return data;
    // });
}

const { User }          = require('../models');
const authService       = require('../services/auth.service');
const { to, ReE, ReS, encrypt, decrypt, emailUtil }  = require('../services/util.service');
const userService       = require('../services/user.service');
const WEB_URL = 'http://localhost:8080';


const create = async function(req, res){ 
    const body = req.body.user; 
    if(!body.unique_key && !body.email && !body.phone){
        return ReE(res, 'Please enter an email or phone number to register.');
    } else if(!body.password){
        return ReE(res, 'Please enter a password to register.');
    }else{
        let err, user;

        [err, user] = await to(authService.createUser(body));

        if(err) return ReE(res, err, 422); 
        //var activeuserkey = encrypt('ABC_'+user.id); 
        var emailBody = '<table width="100%">';
        emailBody += '<tr>';
        emailBody += '<td>Hello '+body.first_name+' '+body.last_name+'</td>';
        emailBody += '</tr>';
        emailBody += '<tr>';
        emailBody += '<td>Thank you for register on our application.Please click on below link and active your account.</td>';
        emailBody += '</tr>';
        emailBody += '<tr>';
        emailBody += '<td><a href="http://localhost:8080/api/user/active/'+user.id+'">Click here</a></td>';
        emailBody += '</tr>';
        emailBody += '</table>';
        emailUtil(body.email,emailBody,'Registation Invitation.',req, res);
        return ReS(res, {message:'Successfully created new user.', user:user.toWeb(), token:user.getJWT()}, 201);
    }
}
module.exports.create = create;

const getUserDetail = async function(req, res){
    console.log('POPOPOPOPOPO');
    let err, user;
    [err, user] = await to(User.findById(req.body.id));  
    if(err){
        return ReE(res, err);
    } 
    // let company = req.company;
    return ReS(res, {user:user.toWeb()});
}
module.exports.getUserDetail = getUserDetail;

const update = async function(req, res){
    let err, user, data
    user = req.user;
    data = req.body.allUserInfo;
    user.set(data);
    [err, user] = await to(user.save());
    if(err){
        if(err.message=='Validation error') err = 'The email address or phone number is already in use';
        return ReE(res, err);
    }
    return ReS(res, {message :'Updated User: '+user.email});
}
module.exports.update = update;

const remove = async function(req, res){
    let user, err;
    user = req.user;
    user.remove_by_admin = 1;
 
    [err, user] = await to(user.save()); 
    if(err) return ReE(res, 'error occured trying to delete user');
   
    return ReS(res, {message:'Deleted successfully.'}, 204);
}
module.exports.remove = remove;

const login = async function(req, res){
    const body = req.body; 
    let err, user;
    [err, user] = await to(authService.authUser(req.body));
    if(err) return ReE(res, err, 422);
    if(user.remove_by_admin == 1) return ReE(res, 'Your account is deleted by admin');
    if(user.active == 0) return ReE(res, 'Your account is not verfied.');
    return ReS(res, {token:user.getJWT(), user:user.toWeb()});
}
module.exports.login = login;

const resetPassword = async function(req, res){
    
    const body = req.body.user;
    
    if(!body.email){
        return ReE(res, 'Please enter an email.');
    } else { 
        let err, user;
        [err, user] = await to(userService.authUserByEmail(req.body.user));
        if(err) return ReE(res, err, 422); 

        //console.log(user);

        var resetpasskey = encrypt(req.body.user.email);
        console.log(resetpasskey);
        user.forget_password = resetpasskey;
        [err, user] = await to(user.save());
        
        // outputs hello world
        console.log(decrypt(resetpasskey));
        
        var emailBody = '<table width="100%">';
        emailBody += '<tr>';
        emailBody += '<td>Please click on below link and reset your password.</td>';
        emailBody += '</tr>';
        emailBody += '<tr>';
        emailBody += '<td>Your Token : '+resetpasskey+'</td>';
        emailBody += '</tr>';
        emailBody += '<tr>';
        emailBody += '<td><a href="'+WEB_URL+'/resettoken">Click here</a></td>';
        emailBody += '</tr>';
        emailBody += '</table>';
        emailUtil(body.email,emailBody,'Reset Password.',req, res);
        return ReS(res, {message:"send password to mail"});
    }
}
module.exports.resetPassword = resetPassword;
    
const getPasswordApplied = async function(req, res){
    console.log(req.body);
    var body = req.body.passwordInfo;
    let err, user;
    [err, user] = await to(userService.checkByTokenAndUpdtPass(body)); 
    if(err) return ReE(res, err, 422);     
    return ReS(res, {message:"send password to mail",data:req.body.passwordInfo});
}
module.exports.getPasswordApplied = getPasswordApplied;

const activeRegisteredUser = async function(req, res){
    
    var activeuserkey = req.params.activeuserkey; 
    //console.log(decrypt(activeuserkey));
    let err, user;
    [err, user] = await to(userService.activeUserById(activeuserkey));     
    return ReS(res, {message:"Your account successfully activated."});
}
module.exports.activeRegisteredUser = activeRegisteredUser;

const setProfile = async function(req, res){
    
    var activeuserkey = req.params.activeuserkey; 
    //console.log(decrypt(activeuserkey));
    let err, user;
    [err, user] = await to(userService.activeUserById(activeuserkey));     
    return ReS(res, {message:"Your account successfully activated."});
}
module.exports.setProfile = setProfile;


//********* Change Password **********
const changePassword = async function (req, res) {

    let body = req.body;
    let newPassword = body.newPassword;
    let confirmPassword = body.confirmPassword;

    if (newPassword != confirmPassword) {
        return ReS(res, { message: "New password and repeat password does not match." });
    } else {
        [err, user] = await to(userService.changePassword(req.user, body));
        if (err) return ReE(res, err, 422);
        return ReS(res, { message: "Password change successfully." });
    }
}
module.exports.changePassword = changePassword;

const getAllUsers = async function (req, res) {

    let err, user 
    [err, user] = await to(User.findAll());
    if(err){
        if(err.message=='Validation error') err = 'Unable to found any user.';
        return ReE(res, err);
    }
    return ReS(res, {message :'Found all users ',users:user});
}
module.exports.getAllUsers = getAllUsers;


const createUser = async function(req, res){ 
    console.log(req.body.user);
    const body = req.body.user; 
    if(!body.unique_key && !body.email && !body.phone){
        return ReE(res, 'Please enter an email or phone number to register.');
    } else if(!body.password){
        return ReE(res, 'Please enter a password to register.');
    }else{
        let err, user;

        [err, user] = await to(authService.createUser(body));

        if(err) return ReE(res, err, 422); 
        //var activeuserkey = encrypt('ABC_'+user.id); 
        var emailBody = '<table width="100%">';
        emailBody += '<tr>';
        emailBody += '<td>Hello '+body.first_name+' '+body.last_name+'</td>';
        emailBody += '</tr>';
        emailBody += '<tr>';
        emailBody += '<td>Admin created your account.Please click on below link and active your account.</td>';
        emailBody += '</tr>';
        emailBody += '<tr>';
        emailBody += '<td><a href="http://localhost:8080/api/user/active/'+user.id+'">Click here</a></td>';
        emailBody += '</tr>';
        emailBody += '</table>';
        emailUtil(body.email,emailBody,'Registation Invitation.',req, res);

        return ReS(res, {message:'Successfully created new user.', user:user.toWeb(), token:user.getJWT()}, 201);
    }
}
module.exports.createUser = createUser;

const { to, ReE, ReS } = require('../services/util.service');

const Dashboard = function(req, res){
	let user = req.user.id;
	return res.json({success:true, message:'it worked', data:'user name is :'});
}
module.exports.Dashboard = Dashboard


const { User }          = require('../models');
const authService       = require('../services/auth.service');
const { to, ReE, ReS, encrypt, decrypt, emailUtil }  = require('../services/util.service');
const userService       = require('../services/user.service');
const WEB_URL = 'http://localhost:8080';


const create = async function(req, res){ 
    const body = req.body.user; 
    if(!body.unique_key && !body.email && !body.phone){
        return ReE(res, 'Please enter an email or phone number to register.');
    } else if(!body.password){
        return ReE(res, 'Please enter a password to register.');
    }else{
        let err, user;

        [err, user] = await to(authService.createUser(body));

        if(err) return ReE(res, err, 422); 
        //var activeuserkey = encrypt('ABC_'+user.id); 
        var emailBody = '<table width="100%">';
        emailBody += '<tr>';
        emailBody += '<td>Hello '+body.first_name+' '+body.last_name+'</td>';
        emailBody += '</tr>';
        emailBody += '<tr>';
        emailBody += '<td>Thank you for register on our application.Please click on below link and active your account.</td>';
        emailBody += '</tr>';
        emailBody += '<tr>';
        emailBody += '<td><a href="http://localhost:8080/api/user/active/'+user.id+'">Click here</a></td>';
        emailBody += '</tr>';
        emailBody += '</table>';
        emailUtil(body.email,emailBody,'Registation Invitation.',req, res);
        return ReS(res, {message:'Successfully created new user.', user:user.toWeb(), token:user.getJWT()}, 201);
    }
}
module.exports.create = create;

const getUserDetail = async function(req, res){
    console.log('POPOPOPOPOPO');
    let err, user;
    [err, user] = await to(User.findById(req.body.id));  
    if(err){
        return ReE(res, err);
    } 
    // let company = req.company;
    return ReS(res, {user:user.toWeb()});
}
module.exports.getUserDetail = getUserDetail;

const update = async function(req, res){
    let err, user, data
    user = req.user;
    data = req.body.allUserInfo;
    user.set(data);
    [err, user] = await to(user.save());
    if(err){
        if(err.message=='Validation error') err = 'The email address or phone number is already in use';
        return ReE(res, err);
    }
    return ReS(res, {message :'Updated User: '+user.email});
}
module.exports.update = update;

const remove = async function(req, res){
    let user, err;
    user = req.user;
    user.remove_by_admin = 1;
 
    [err, user] = await to(user.save()); 
    if(err) return ReE(res, 'error occured trying to delete user');
   
    return ReS(res, {message:'Deleted successfully.'}, 204);
}
module.exports.remove = remove;

const login = async function(req, res){
    const body = req.body; 
    let err, user;
    [err, user] = await to(authService.authUser(req.body));
    if(err) return ReE(res, err, 422);
    if(user.remove_by_admin == 1) return ReE(res, 'Your account is deleted by admin');
    if(user.active == 0) return ReE(res, 'Your account is not verfied.');
    return ReS(res, {token:user.getJWT(), user:user.toWeb()});
}
module.exports.login = login;

const resetPassword = async function(req, res){
    
    const body = req.body.user;
    
    if(!body.email){
        return ReE(res, 'Please enter an email.');
    } else { 
        let err, user;
        [err, user] = await to(userService.authUserByEmail(req.body.user));
        if(err) return ReE(res, err, 422); 

        //console.log(user);

        var resetpasskey = encrypt(req.body.user.email);
        console.log(resetpasskey);
        user.forget_password = resetpasskey;
        [err, user] = await to(user.save());
        
        // outputs hello world
        console.log(decrypt(resetpasskey));
        
        var emailBody = '<table width="100%">';
        emailBody += '<tr>';
        emailBody += '<td>Please click on below link and reset your password.</td>';
        emailBody += '</tr>';
        emailBody += '<tr>';
        emailBody += '<td>Your Token : '+resetpasskey+'</td>';
        emailBody += '</tr>';
        emailBody += '<tr>';
        emailBody += '<td><a href="'+WEB_URL+'/resettoken">Click here</a></td>';
        emailBody += '</tr>';
        emailBody += '</table>';
        emailUtil(body.email,emailBody,'Reset Password.',req, res);
        return ReS(res, {message:"send password to mail"});
    }
}
module.exports.resetPassword = resetPassword;
    
const getPasswordApplied = async function(req, res){
    console.log(req.body);
    var body = req.body.passwordInfo;
    let err, user;
    [err, user] = await to(userService.checkByTokenAndUpdtPass(body)); 
    if(err) return ReE(res, err, 422);     
    return ReS(res, {message:"send password to mail",data:req.body.passwordInfo});
}
module.exports.getPasswordApplied = getPasswordApplied;

const activeRegisteredUser = async function(req, res){
    
    var activeuserkey = req.params.activeuserkey; 
    //console.log(decrypt(activeuserkey));
    let err, user;
    [err, user] = await to(userService.activeUserById(activeuserkey));     
    return ReS(res, {message:"Your account successfully activated."});
}
module.exports.activeRegisteredUser = activeRegisteredUser;

const setProfile = async function(req, res){
    
    var activeuserkey = req.params.activeuserkey; 
    //console.log(decrypt(activeuserkey));
    let err, user;
    [err, user] = await to(userService.activeUserById(activeuserkey));     
    return ReS(res, {message:"Your account successfully activated."});
}
module.exports.setProfile = setProfile;


//********* Change Password **********
const changePassword = async function (req, res) {

    let body = req.body;
    let newPassword = body.newPassword;
    let confirmPassword = body.confirmPassword;

    if (newPassword != confirmPassword) {
        return ReS(res, { message: "New password and repeat password does not match." });
    } else {
        [err, user] = await to(userService.changePassword(req.user, body));
        if (err) return ReE(res, err, 422);
        return ReS(res, { message: "Password change successfully." });
    }
}
module.exports.changePassword = changePassword;

const getAllUsers = async function (req, res) {

    let err, user 
    [err, user] = await to(User.findAll());
    if(err){
        if(err.message=='Validation error') err = 'Unable to found any user.';
        return ReE(res, err);
    }
    return ReS(res, {message :'Found all users ',users:user});
}
module.exports.getAllUsers = getAllUsers;


const createUser = async function(req, res){ 
    console.log(req.body.user);
    const body = req.body.user; 
    if(!body.unique_key && !body.email && !body.phone){
        return ReE(res, 'Please enter an email or phone number to register.');
    } else if(!body.password){
        return ReE(res, 'Please enter a password to register.');
    }else{
        let err, user;

        [err, user] = await to(authService.createUser(body));

        if(err) return ReE(res, err, 422); 
        //var activeuserkey = encrypt('ABC_'+user.id); 
        var emailBody = '<table width="100%">';
        emailBody += '<tr>';
        emailBody += '<td>Hello '+body.first_name+' '+body.last_name+'</td>';
        emailBody += '</tr>';
        emailBody += '<tr>';
        emailBody += '<td>Admin created your account.Please click on below link and active your account.</td>';
        emailBody += '</tr>';
        emailBody += '<tr>';
        emailBody += '<td><a href="http://localhost:8080/api/user/active/'+user.id+'">Click here</a></td>';
        emailBody += '</tr>';
        emailBody += '</table>';
        emailUtil(body.email,emailBody,'Registation Invitation.',req, res);

        return ReS(res, {message:'Successfully created new user.', user:user.toWeb(), token:user.getJWT()}, 201);
    }
}
module.exports.createUser = createUser;


import config from 'config';
import { authHeader } from '../_helpers';
import axios from 'axios';
var Usertoken = localStorage.getItem('user'); 
var tokenObj = JSON.parse(Usertoken); 

 

export const userService = {
    login,
    logout,
    register,
    getAll,
    getById,
    update,
    delete: _delete,
    forgetpassword,
    resettoken,
    dashboard,
    profile,
    getAllCompanies,
    addCompany,
    getCompaniesDetails,
    changePassword,
    getAllUsers,
    getUserDetails,
    updateUserDetails,
    addUser
};

function login(email, password) { 
    const userInfo = {
        email: email,
        password: password 
    };   
    return axios.post(`${config.apiUrl}/api/users/login`, userInfo)
        //.then(handleResponse)
        .then(function(response){
            if (response.data.token) { 
                localStorage.setItem('user', JSON.stringify(response.data));               
            }
        });
}

function logout() {
    // remove user from local storage to log user out
    //localStorage.removeItem('user');
}

function getAll() {
    const requestOptions = {
        method: 'GET',
        headers: authHeader()
    };

    return fetch(`${config.apiUrl}/users`, requestOptions).then(handleResponse);
}

function getById(id) {
    const requestOptions = {
        method: 'GET',
        headers: authHeader()
    };

    return fetch(`${config.apiUrl}/users/${id}`, requestOptions).then(handleResponse);
}

function register(user) { 

    return axios({
        method: 'POST',
        url: `${config.apiUrl}/api/users`,
        headers: { 'Content-Type': 'application/json'},
        data: {user:user}
    }).then(handleResponse);   
}

function update(user) {
    const requestOptions = {
        method: 'PUT',
        headers: { ...authHeader(), 'Content-Type': 'application/json' },
        body: JSON.stringify(user)
    };

    return fetch(`${config.apiUrl}/users/${user.id}`, requestOptions).then(handleResponse);;
}

// prefixed function name with underscore because delete is a reserved word in javascript
function _delete(id) {
    const requestOptions = {
        method: 'DELETE',
        headers: authHeader()
    };

    return fetch(`${config.apiUrl}/users/${id}`, requestOptions).then(handleResponse);
}

function forgetpassword(user) { 
    return axios({
        method: 'POST',
        url: `${config.apiUrl}/api/resetpassword`,
        headers: { 'Content-Type': 'application/json'},
        data: {user:user}
    }).then(handleResponse);  
}

function resettoken(passwordInfo) {      
    return axios({
        method: 'POST',
        url: `${config.apiUrl}/api/resetpasswordapplied`,
        headers: { 'Content-Type': 'application/json'},
        data: {passwordInfo:passwordInfo}
    }).then(handleResponse);  
}

function dashboard(loggedInUserInfo) { 
    const requestOptions = {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(loggedInUserInfo)
    };
     
    return fetch(`${config.apiUrl}/api/dashboard`, requestOptions).then(handleResponse);
}

function profile(loggedInUserInfo) { 
    const requestOptions = {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(loggedInUserInfo)
    };
     
    return fetch(`${config.apiUrl}/api/profile`, requestOptions).then(handleResponse);
}

function getAllCompanies() { 
    return axios({
        method: 'POST',
        url: `${config.apiUrl}/api/companies/all`,
        headers: { 'Content-Type': 'application/json', 'Authorization' : tokenObj.token },
    }).then(handleResponse); 
}

function addCompany(companyInfo) {
    const requestOptions = {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization' : tokenObj.token },
        body: JSON.stringify(companyInfo)
    };     
    return fetch(`${config.apiUrl}/api/companies`, requestOptions).then(handleResponse);
}

function getCompaniesDetails(id) {
    return axios({
        method: 'POST',
        url: `${config.apiUrl}/api/companiesdetail`,
        headers: { 'Content-Type': 'application/json', 'Authorization' : tokenObj.token },
        data: {id:id}
    }).then(handleResponse);     
}

function changePassword(changePasswordInfo) {
    const requestOptions = {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization' : tokenObj.token },
        body: JSON.stringify(changePasswordInfo)
    };   
    return fetch(`${config.apiUrl}/api/users/changepassword`, requestOptions).then(handleResponse);
}

function getAllUsers() { 
    return axios({
        method: 'POST',
        url: `${config.apiUrl}/api/users/all`,
        headers: { 'Content-Type': 'application/json', 'Authorization' : tokenObj.token },
    }).then(handleResponse); 
}

function getUserDetails(id) {
    return axios({
        method: 'POST',
        url: `${config.apiUrl}/api/users/userdetail`,
        headers: { 'Content-Type': 'application/json', 'Authorization' : tokenObj.token },
        data: {id:id}
    }).then(handleResponse);     
}

function updateUserDetails(allUserInfo) {
    return axios({
        method: 'POST',
        url: `${config.apiUrl}/api/users/updateuserdetail`,
        headers: { 'Content-Type': 'application/json', 'Authorization' : tokenObj.token },
        data: {allUserInfo:allUserInfo}
    }).then(handleResponse);     
}

function addUser(user) {
    return axios({
        method: 'POST',
        url: `${config.apiUrl}/api/users/adduserbyadmin`,
        headers: { 'Content-Type': 'application/json', 'Authorization' : tokenObj.token },
        data: {user:user}
    }).then(handleResponse);     
} 

function handleResponse(response) { 
    if(response.status = 200){
        return response;
    } else {
        const error = (data && data.message) || response.statusText;
        return Promise.reject(error);
    }

    // return response.text().then(text => {
    //     const data = text && JSON.parse(text);
    //     console.log('data',data);
    // console.log('<<<<<<<<<<<<<<<<<<<<<');
    //     if (!response.ok) {
    //         if (response.status === 401) {
    //             // auto logout if 401 response returned from api
    //             logout();
    //             location.reload(true);
    //         }
    //         const error = (data && data.message) || response.statusText;
    //         return Promise.reject(error);
    //     }

    //     console.log('data',data);
    //     return data;
    // });
}

const { User }          = require('../models');
const authService       = require('../services/auth.service');
const { to, ReE, ReS, encrypt, decrypt, emailUtil }  = require('../services/util.service');
const userService       = require('../services/user.service');
const WEB_URL = 'http://localhost:8080';


const create = async function(req, res){ 
    const body = req.body.user; 
    if(!body.unique_key && !body.email && !body.phone){
        return ReE(res, 'Please enter an email or phone number to register.');
    } else if(!body.password){
        return ReE(res, 'Please enter a password to register.');
    }else{
        let err, user;

        [err, user] = await to(authService.createUser(body));

        if(err) return ReE(res, err, 422); 
        //var activeuserkey = encrypt('ABC_'+user.id); 
        var emailBody = '<table width="100%">';
        emailBody += '<tr>';
        emailBody += '<td>Hello '+body.first_name+' '+body.last_name+'</td>';
        emailBody += '</tr>';
        emailBody += '<tr>';
        emailBody += '<td>Thank you for register on our application.Please click on below link and active your account.</td>';
        emailBody += '</tr>';
        emailBody += '<tr>';
        emailBody += '<td><a href="http://localhost:8080/api/user/active/'+user.id+'">Click here</a></td>';
        emailBody += '</tr>';
        emailBody += '</table>';
        emailUtil(body.email,emailBody,'Registation Invitation.',req, res);
        return ReS(res, {message:'Successfully created new user.', user:user.toWeb(), token:user.getJWT()}, 201);
    }
}
module.exports.create = create;

const getUserDetail = async function(req, res){
    console.log('POPOPOPOPOPO');
    let err, user;
    [err, user] = await to(User.findById(req.body.id));  
    if(err){
        return ReE(res, err);
    } 
    // let company = req.company;
    return ReS(res, {user:user.toWeb()});
}
module.exports.getUserDetail = getUserDetail;

const update = async function(req, res){
    let err, user, data
    user = req.user;
    data = req.body.allUserInfo;
    user.set(data);
    [err, user] = await to(user.save());
    if(err){
        if(err.message=='Validation error') err = 'The email address or phone number is already in use';
        return ReE(res, err);
    }
    return ReS(res, {message :'Updated User: '+user.email});
}
module.exports.update = update;

const remove = async function(req, res){
    let user, err;
    user = req.user;
    user.remove_by_admin = 1;
 
    [err, user] = await to(user.save()); 
    if(err) return ReE(res, 'error occured trying to delete user');
   
    return ReS(res, {message:'Deleted successfully.'}, 204);
}
module.exports.remove = remove;

const login = async function(req, res){
    const body = req.body; 
    let err, user;
    [err, user] = await to(authService.authUser(req.body));
    if(err) return ReE(res, err, 422);
    if(user.remove_by_admin == 1) return ReE(res, 'Your account is deleted by admin');
    if(user.active == 0) return ReE(res, 'Your account is not verfied.');
    return ReS(res, {token:user.getJWT(), user:user.toWeb()});
}
module.exports.login = login;

const resetPassword = async function(req, res){
    
    const body = req.body.user;
    
    if(!body.email){
        return ReE(res, 'Please enter an email.');
    } else { 
        let err, user;
        [err, user] = await to(userService.authUserByEmail(req.body.user));
        if(err) return ReE(res, err, 422); 

        //console.log(user);

        var resetpasskey = encrypt(req.body.user.email);
        console.log(resetpasskey);
        user.forget_password = resetpasskey;
        [err, user] = await to(user.save());
        
        // outputs hello world
        console.log(decrypt(resetpasskey));
        
        var emailBody = '<table width="100%">';
        emailBody += '<tr>';
        emailBody += '<td>Please click on below link and reset your password.</td>';
        emailBody += '</tr>';
        emailBody += '<tr>';
        emailBody += '<td>Your Token : '+resetpasskey+'</td>';
        emailBody += '</tr>';
        emailBody += '<tr>';
        emailBody += '<td><a href="'+WEB_URL+'/resettoken">Click here</a></td>';
        emailBody += '</tr>';
        emailBody += '</table>';
        emailUtil(body.email,emailBody,'Reset Password.',req, res);
        return ReS(res, {message:"send password to mail"});
    }
}
module.exports.resetPassword = resetPassword;
    
const getPasswordApplied = async function(req, res){
    console.log(req.body);
    var body = req.body.passwordInfo;
    let err, user;
    [err, user] = await to(userService.checkByTokenAndUpdtPass(body)); 
    if(err) return ReE(res, err, 422);     
    return ReS(res, {message:"send password to mail",data:req.body.passwordInfo});
}
module.exports.getPasswordApplied = getPasswordApplied;

const activeRegisteredUser = async function(req, res){
    
    var activeuserkey = req.params.activeuserkey; 
    //console.log(decrypt(activeuserkey));
    let err, user;
    [err, user] = await to(userService.activeUserById(activeuserkey));     
    return ReS(res, {message:"Your account successfully activated."});
}
module.exports.activeRegisteredUser = activeRegisteredUser;

const setProfile = async function(req, res){
    
    var activeuserkey = req.params.activeuserkey; 
    //console.log(decrypt(activeuserkey));
    let err, user;
    [err, user] = await to(userService.activeUserById(activeuserkey));     
    return ReS(res, {message:"Your account successfully activated."});
}
module.exports.setProfile = setProfile;


//********* Change Password **********
const changePassword = async function (req, res) {

    let body = req.body;
    let newPassword = body.newPassword;
    let confirmPassword = body.confirmPassword;

    if (newPassword != confirmPassword) {
        return ReS(res, { message: "New password and repeat password does not match." });
    } else {
        [err, user] = await to(userService.changePassword(req.user, body));
        if (err) return ReE(res, err, 422);
        return ReS(res, { message: "Password change successfully." });
    }
}
module.exports.changePassword = changePassword;

const getAllUsers = async function (req, res) {

    let err, user 
    [err, user] = await to(User.findAll());
    if(err){
        if(err.message=='Validation error') err = 'Unable to found any user.';
        return ReE(res, err);
    }
    return ReS(res, {message :'Found all users ',users:user});
}
module.exports.getAllUsers = getAllUsers;


const createUser = async function(req, res){ 
    console.log(req.body.user);
    const body = req.body.user; 
    if(!body.unique_key && !body.email && !body.phone){
        return ReE(res, 'Please enter an email or phone number to register.');
    } else if(!body.password){
        return ReE(res, 'Please enter a password to register.');
    }else{
        let err, user;

        [err, user] = await to(authService.createUser(body));

        if(err) return ReE(res, err, 422); 
        //var activeuserkey = encrypt('ABC_'+user.id); 
        var emailBody = '<table width="100%">';
        emailBody += '<tr>';
        emailBody += '<td>Hello '+body.first_name+' '+body.last_name+'</td>';
        emailBody += '</tr>';
        emailBody += '<tr>';
        emailBody += '<td>Admin created your account.Please click on below link and active your account.</td>';
        emailBody += '</tr>';
        emailBody += '<tr>';
        emailBody += '<td><a href="http://localhost:8080/api/user/active/'+user.id+'">Click here</a></td>';
        emailBody += '</tr>';
        emailBody += '</table>';
        emailUtil(body.email,emailBody,'Registation Invitation.',req, res);

        return ReS(res, {message:'Successfully created new user.', user:user.toWeb(), token:user.getJWT()}, 201);
    }
}
module.exports.createUser = createUser;

const { to, ReE, ReS } = require('../services/util.service');

const Dashboard = function(req, res){
	let user = req.user.id;
	return res.json({success:true, message:'it worked', data:'user name is :'});
}
module.exports.Dashboard = Dashboard


const { User }          = require('../models');
const authService       = require('../services/auth.service');
const { to, ReE, ReS, encrypt, decrypt, emailUtil }  = require('../services/util.service');
const userService       = require('../services/user.service');
const WEB_URL = 'http://localhost:8080';


const create = async function(req, res){ 
    const body = req.body.user; 
    if(!body.unique_key && !body.email && !body.phone){
        return ReE(res, 'Please enter an email or phone number to register.');
    } else if(!body.password){
        return ReE(res, 'Please enter a password to register.');
    }else{
        let err, user;

        [err, user] = await to(authService.createUser(body));

        if(err) return ReE(res, err, 422); 
        //var activeuserkey = encrypt('ABC_'+user.id); 
        var emailBody = '<table width="100%">';
        emailBody += '<tr>';
        emailBody += '<td>Hello '+body.first_name+' '+body.last_name+'</td>';
        emailBody += '</tr>';
        emailBody += '<tr>';
        emailBody += '<td>Thank you for register on our application.Please click on below link and active your account.</td>';
        emailBody += '</tr>';
        emailBody += '<tr>';
        emailBody += '<td><a href="http://localhost:8080/api/user/active/'+user.id+'">Click here</a></td>';
        emailBody += '</tr>';
        emailBody += '</table>';
        emailUtil(body.email,emailBody,'Registation Invitation.',req, res);
        return ReS(res, {message:'Successfully created new user.', user:user.toWeb(), token:user.getJWT()}, 201);
    }
}
module.exports.create = create;

const getUserDetail = async function(req, res){
    console.log('POPOPOPOPOPO');
    let err, user;
    [err, user] = await to(User.findById(req.body.id));  
    if(err){
        return ReE(res, err);
    } 
    // let company = req.company;
    return ReS(res, {user:user.toWeb()});
}
module.exports.getUserDetail = getUserDetail;

const update = async function(req, res){
    let err, user, data
    user = req.user;
    data = req.body.allUserInfo;
    user.set(data);
    [err, user] = await to(user.save());
    if(err){
        if(err.message=='Validation error') err = 'The email address or phone number is already in use';
        return ReE(res, err);
    }
    return ReS(res, {message :'Updated User: '+user.email});
}
module.exports.update = update;

const remove = async function(req, res){
    let user, err;
    user = req.user;
    user.remove_by_admin = 1;
 
    [err, user] = await to(user.save()); 
    if(err) return ReE(res, 'error occured trying to delete user');
   
    return ReS(res, {message:'Deleted successfully.'}, 204);
}
module.exports.remove = remove;

const login = async function(req, res){
    const body = req.body; 
    let err, user;
    [err, user] = await to(authService.authUser(req.body));
    if(err) return ReE(res, err, 422);
    if(user.remove_by_admin == 1) return ReE(res, 'Your account is deleted by admin');
    if(user.active == 0) return ReE(res, 'Your account is not verfied.');
    return ReS(res, {token:user.getJWT(), user:user.toWeb()});
}
module.exports.login = login;

const resetPassword = async function(req, res){
    
    const body = req.body.user;
    
    if(!body.email){
        return ReE(res, 'Please enter an email.');
    } else { 
        let err, user;
        [err, user] = await to(userService.authUserByEmail(req.body.user));
        if(err) return ReE(res, err, 422); 

        //console.log(user);

        var resetpasskey = encrypt(req.body.user.email);
        console.log(resetpasskey);
        user.forget_password = resetpasskey;
        [err, user] = await to(user.save());
        
        // outputs hello world
        console.log(decrypt(resetpasskey));
        
        var emailBody = '<table width="100%">';
        emailBody += '<tr>';
        emailBody += '<td>Please click on below link and reset your password.</td>';
        emailBody += '</tr>';
        emailBody += '<tr>';
        emailBody += '<td>Your Token : '+resetpasskey+'</td>';
        emailBody += '</tr>';
        emailBody += '<tr>';
        emailBody += '<td><a href="'+WEB_URL+'/resettoken">Click here</a></td>';
        emailBody += '</tr>';
        emailBody += '</table>';
        emailUtil(body.email,emailBody,'Reset Password.',req, res);
        return ReS(res, {message:"send password to mail"});
    }
}
module.exports.resetPassword = resetPassword;
    
const getPasswordApplied = async function(req, res){
    console.log(req.body);
    var body = req.body.passwordInfo;
    let err, user;
    [err, user] = await to(userService.checkByTokenAndUpdtPass(body)); 
    if(err) return ReE(res, err, 422);     
    return ReS(res, {message:"send password to mail",data:req.body.passwordInfo});
}
module.exports.getPasswordApplied = getPasswordApplied;

const activeRegisteredUser = async function(req, res){
    
    var activeuserkey = req.params.activeuserkey; 
    //console.log(decrypt(activeuserkey));
    let err, user;
    [err, user] = await to(userService.activeUserById(activeuserkey));     
    return ReS(res, {message:"Your account successfully activated."});
}
module.exports.activeRegisteredUser = activeRegisteredUser;

const setProfile = async function(req, res){
    
    var activeuserkey = req.params.activeuserkey; 
    //console.log(decrypt(activeuserkey));
    let err, user;
    [err, user] = await to(userService.activeUserById(activeuserkey));     
    return ReS(res, {message:"Your account successfully activated."});
}
module.exports.setProfile = setProfile;


//********* Change Password **********
const changePassword = async function (req, res) {

    let body = req.body;
    let newPassword = body.newPassword;
    let confirmPassword = body.confirmPassword;

    if (newPassword != confirmPassword) {
        return ReS(res, { message: "New password and repeat password does not match." });
    } else {
        [err, user] = await to(userService.changePassword(req.user, body));
        if (err) return ReE(res, err, 422);
        return ReS(res, { message: "Password change successfully." });
    }
}
module.exports.changePassword = changePassword;

const getAllUsers = async function (req, res) {

    let err, user 
    [err, user] = await to(User.findAll());
    if(err){
        if(err.message=='Validation error') err = 'Unable to found any user.';
        return ReE(res, err);
    }
    return ReS(res, {message :'Found all users ',users:user});
}
module.exports.getAllUsers = getAllUsers;


const createUser = async function(req, res){ 
    console.log(req.body.user);
    const body = req.body.user; 
    if(!body.unique_key && !body.email && !body.phone){
        return ReE(res, 'Please enter an email or phone number to register.');
    } else if(!body.password){
        return ReE(res, 'Please enter a password to register.');
    }else{
        let err, user;

        [err, user] = await to(authService.createUser(body));

        if(err) return ReE(res, err, 422); 
        //var activeuserkey = encrypt('ABC_'+user.id); 
        var emailBody = '<table width="100%">';
        emailBody += '<tr>';
        emailBody += '<td>Hello '+body.first_name+' '+body.last_name+'</td>';
        emailBody += '</tr>';
        emailBody += '<tr>';
        emailBody += '<td>Admin created your account.Please click on below link and active your account.</td>';
        emailBody += '</tr>';
        emailBody += '<tr>';
        emailBody += '<td><a href="http://localhost:8080/api/user/active/'+user.id+'">Click here</a></td>';
        emailBody += '</tr>';
        emailBody += '</table>';
        emailUtil(body.email,emailBody,'Registation Invitation.',req, res);

        return ReS(res, {message:'Successfully created new user.', user:user.toWeb(), token:user.getJWT()}, 201);
    }
}
module.exports.createUser = createUser;


import config from 'config';
import { authHeader } from '../_helpers';
import axios from 'axios';
var Usertoken = localStorage.getItem('user'); 
var tokenObj = JSON.parse(Usertoken); 

 

export const userService = {
    login,
    logout,
    register,
    getAll,
    getById,
    update,
    delete: _delete,
    forgetpassword,
    resettoken,
    dashboard,
    profile,
    getAllCompanies,
    addCompany,
    getCompaniesDetails,
    changePassword,
    getAllUsers,
    getUserDetails,
    updateUserDetails,
    addUser
};

function login(email, password) { 
    const userInfo = {
        email: email,
        password: password 
    };   
    return axios.post(`${config.apiUrl}/api/users/login`, userInfo)
        //.then(handleResponse)
        .then(function(response){
            if (response.data.token) { 
                localStorage.setItem('user', JSON.stringify(response.data));               
            }
        });
}

function logout() {
    // remove user from local storage to log user out
    //localStorage.removeItem('user');
}

function getAll() {
    const requestOptions = {
        method: 'GET',
        headers: authHeader()
    };

    return fetch(`${config.apiUrl}/users`, requestOptions).then(handleResponse);
}

function getById(id) {
    const requestOptions = {
        method: 'GET',
        headers: authHeader()
    };

    return fetch(`${config.apiUrl}/users/${id}`, requestOptions).then(handleResponse);
}

function register(user) { 

    return axios({
        method: 'POST',
        url: `${config.apiUrl}/api/users`,
        headers: { 'Content-Type': 'application/json'},
        data: {user:user}
    }).then(handleResponse);   
}

function update(user) {
    const requestOptions = {
        method: 'PUT',
        headers: { ...authHeader(), 'Content-Type': 'application/json' },
        body: JSON.stringify(user)
    };

    return fetch(`${config.apiUrl}/users/${user.id}`, requestOptions).then(handleResponse);;
}

// prefixed function name with underscore because delete is a reserved word in javascript
function _delete(id) {
    const requestOptions = {
        method: 'DELETE',
        headers: authHeader()
    };

    return fetch(`${config.apiUrl}/users/${id}`, requestOptions).then(handleResponse);
}

function forgetpassword(user) { 
    return axios({
        method: 'POST',
        url: `${config.apiUrl}/api/resetpassword`,
        headers: { 'Content-Type': 'application/json'},
        data: {user:user}
    }).then(handleResponse);  
}

function resettoken(passwordInfo) {      
    return axios({
        method: 'POST',
        url: `${config.apiUrl}/api/resetpasswordapplied`,
        headers: { 'Content-Type': 'application/json'},
        data: {passwordInfo:passwordInfo}
    }).then(handleResponse);  
}

function dashboard(loggedInUserInfo) { 
    const requestOptions = {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(loggedInUserInfo)
    };
     
    return fetch(`${config.apiUrl}/api/dashboard`, requestOptions).then(handleResponse);
}

function profile(loggedInUserInfo) { 
    const requestOptions = {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(loggedInUserInfo)
    };
     
    return fetch(`${config.apiUrl}/api/profile`, requestOptions).then(handleResponse);
}

function getAllCompanies() { 
    return axios({
        method: 'POST',
        url: `${config.apiUrl}/api/companies/all`,
        headers: { 'Content-Type': 'application/json', 'Authorization' : tokenObj.token },
    }).then(handleResponse); 
}

function addCompany(companyInfo) {
    const requestOptions = {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization' : tokenObj.token },
        body: JSON.stringify(companyInfo)
    };     
    return fetch(`${config.apiUrl}/api/companies`, requestOptions).then(handleResponse);
}

function getCompaniesDetails(id) {
    return axios({
        method: 'POST',
        url: `${config.apiUrl}/api/companiesdetail`,
        headers: { 'Content-Type': 'application/json', 'Authorization' : tokenObj.token },
        data: {id:id}
    }).then(handleResponse);     
}

function changePassword(changePasswordInfo) {
    const requestOptions = {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization' : tokenObj.token },
        body: JSON.stringify(changePasswordInfo)
    };   
    return fetch(`${config.apiUrl}/api/users/changepassword`, requestOptions).then(handleResponse);
}

function getAllUsers() { 
    return axios({
        method: 'POST',
        url: `${config.apiUrl}/api/users/all`,
        headers: { 'Content-Type': 'application/json', 'Authorization' : tokenObj.token },
    }).then(handleResponse); 
}

function getUserDetails(id) {
    return axios({
        method: 'POST',
        url: `${config.apiUrl}/api/users/userdetail`,
        headers: { 'Content-Type': 'application/json', 'Authorization' : tokenObj.token },
        data: {id:id}
    }).then(handleResponse);     
}

function updateUserDetails(allUserInfo) {
    return axios({
        method: 'POST',
        url: `${config.apiUrl}/api/users/updateuserdetail`,
        headers: { 'Content-Type': 'application/json', 'Authorization' : tokenObj.token },
        data: {allUserInfo:allUserInfo}
    }).then(handleResponse);     
}

function addUser(user) {
    return axios({
        method: 'POST',
        url: `${config.apiUrl}/api/users/adduserbyadmin`,
        headers: { 'Content-Type': 'application/json', 'Authorization' : tokenObj.token },
        data: {user:user}
    }).then(handleResponse);     
} 

function handleResponse(response) { 
    if(response.status = 200){
        return response;
    } else {
        const error = (data && data.message) || response.statusText;
        return Promise.reject(error);
    }

    // return response.text().then(text => {
    //     const data = text && JSON.parse(text);
    //     console.log('data',data);
    // console.log('<<<<<<<<<<<<<<<<<<<<<');
    //     if (!response.ok) {
    //         if (response.status === 401) {
    //             // auto logout if 401 response returned from api
    //             logout();
    //             location.reload(true);
    //         }
    //         const error = (data && data.message) || response.statusText;
    //         return Promise.reject(error);
    //     }

    //     console.log('data',data);
    //     return data;
    // });
}

const { User }          = require('../models');
const authService       = require('../services/auth.service');
const { to, ReE, ReS, encrypt, decrypt, emailUtil }  = require('../services/util.service');
const userService       = require('../services/user.service');
const WEB_URL = 'http://localhost:8080';


const create = async function(req, res){ 
    const body = req.body.user; 
    if(!body.unique_key && !body.email && !body.phone){
        return ReE(res, 'Please enter an email or phone number to register.');
    } else if(!body.password){
        return ReE(res, 'Please enter a password to register.');
    }else{
        let err, user;

        [err, user] = await to(authService.createUser(body));

        if(err) return ReE(res, err, 422); 
        //var activeuserkey = encrypt('ABC_'+user.id); 
        var emailBody = '<table width="100%">';
        emailBody += '<tr>';
        emailBody += '<td>Hello '+body.first_name+' '+body.last_name+'</td>';
        emailBody += '</tr>';
        emailBody += '<tr>';
        emailBody += '<td>Thank you for register on our application.Please click on below link and active your account.</td>';
        emailBody += '</tr>';
        emailBody += '<tr>';
        emailBody += '<td><a href="http://localhost:8080/api/user/active/'+user.id+'">Click here</a></td>';
        emailBody += '</tr>';
        emailBody += '</table>';
        emailUtil(body.email,emailBody,'Registation Invitation.',req, res);
        return ReS(res, {message:'Successfully created new user.', user:user.toWeb(), token:user.getJWT()}, 201);
    }
}
module.exports.create = create;

const getUserDetail = async function(req, res){
    console.log('POPOPOPOPOPO');
    let err, user;
    [err, user] = await to(User.findById(req.body.id));  
    if(err){
        return ReE(res, err);
    } 
    // let company = req.company;
    return ReS(res, {user:user.toWeb()});
}
module.exports.getUserDetail = getUserDetail;

const update = async function(req, res){
    let err, user, data
    user = req.user;
    data = req.body.allUserInfo;
    user.set(data);
    [err, user] = await to(user.save());
    if(err){
        if(err.message=='Validation error') err = 'The email address or phone number is already in use';
        return ReE(res, err);
    }
    return ReS(res, {message :'Updated User: '+user.email});
}
module.exports.update = update;

const remove = async function(req, res){
    let user, err;
    user = req.user;
    user.remove_by_admin = 1;
 
    [err, user] = await to(user.save()); 
    if(err) return ReE(res, 'error occured trying to delete user');
   
    return ReS(res, {message:'Deleted successfully.'}, 204);
}
module.exports.remove = remove;

const login = async function(req, res){
    const body = req.body; 
    let err, user;
    [err, user] = await to(authService.authUser(req.body));
    if(err) return ReE(res, err, 422);
    if(user.remove_by_admin == 1) return ReE(res, 'Your account is deleted by admin');
    if(user.active == 0) return ReE(res, 'Your account is not verfied.');
    return ReS(res, {token:user.getJWT(), user:user.toWeb()});
}
module.exports.login = login;

const resetPassword = async function(req, res){
    
    const body = req.body.user;
    
    if(!body.email){
        return ReE(res, 'Please enter an email.');
    } else { 
        let err, user;
        [err, user] = await to(userService.authUserByEmail(req.body.user));
        if(err) return ReE(res, err, 422); 

        //console.log(user);

        var resetpasskey = encrypt(req.body.user.email);
        console.log(resetpasskey);
        user.forget_password = resetpasskey;
        [err, user] = await to(user.save());
        
        // outputs hello world
        console.log(decrypt(resetpasskey));
        
        var emailBody = '<table width="100%">';
        emailBody += '<tr>';
        emailBody += '<td>Please click on below link and reset your password.</td>';
        emailBody += '</tr>';
        emailBody += '<tr>';
        emailBody += '<td>Your Token : '+resetpasskey+'</td>';
        emailBody += '</tr>';
        emailBody += '<tr>';
        emailBody += '<td><a href="'+WEB_URL+'/resettoken">Click here</a></td>';
        emailBody += '</tr>';
        emailBody += '</table>';
        emailUtil(body.email,emailBody,'Reset Password.',req, res);
        return ReS(res, {message:"send password to mail"});
    }
}
module.exports.resetPassword = resetPassword;
    
const getPasswordApplied = async function(req, res){
    console.log(req.body);
    var body = req.body.passwordInfo;
    let err, user;
    [err, user] = await to(userService.checkByTokenAndUpdtPass(body)); 
    if(err) return ReE(res, err, 422);     
    return ReS(res, {message:"send password to mail",data:req.body.passwordInfo});
}
module.exports.getPasswordApplied = getPasswordApplied;

const activeRegisteredUser = async function(req, res){
    
    var activeuserkey = req.params.activeuserkey; 
    //console.log(decrypt(activeuserkey));
    let err, user;
    [err, user] = await to(userService.activeUserById(activeuserkey));     
    return ReS(res, {message:"Your account successfully activated."});
}
module.exports.activeRegisteredUser = activeRegisteredUser;

const setProfile = async function(req, res){
    
    var activeuserkey = req.params.activeuserkey; 
    //console.log(decrypt(activeuserkey));
    let err, user;
    [err, user] = await to(userService.activeUserById(activeuserkey));     
    return ReS(res, {message:"Your account successfully activated."});
}
module.exports.setProfile = setProfile;


//********* Change Password **********
const changePassword = async function (req, res) {

    let body = req.body;
    let newPassword = body.newPassword;
    let confirmPassword = body.confirmPassword;

    if (newPassword != confirmPassword) {
        return ReS(res, { message: "New password and repeat password does not match." });
    } else {
        [err, user] = await to(userService.changePassword(req.user, body));
        if (err) return ReE(res, err, 422);
        return ReS(res, { message: "Password change successfully." });
    }
}
module.exports.changePassword = changePassword;

const getAllUsers = async function (req, res) {

    let err, user 
    [err, user] = await to(User.findAll());
    if(err){
        if(err.message=='Validation error') err = 'Unable to found any user.';
        return ReE(res, err);
    }
    return ReS(res, {message :'Found all users ',users:user});
}
module.exports.getAllUsers = getAllUsers;


const createUser = async function(req, res){ 
    console.log(req.body.user);
    const body = req.body.user; 
    if(!body.unique_key && !body.email && !body.phone){
        return ReE(res, 'Please enter an email or phone number to register.');
    } else if(!body.password){
        return ReE(res, 'Please enter a password to register.');
    }else{
        let err, user;

        [err, user] = await to(authService.createUser(body));

        if(err) return ReE(res, err, 422); 
        //var activeuserkey = encrypt('ABC_'+user.id); 
        var emailBody = '<table width="100%">';
        emailBody += '<tr>';
        emailBody += '<td>Hello '+body.first_name+' '+body.last_name+'</td>';
        emailBody += '</tr>';
        emailBody += '<tr>';
        emailBody += '<td>Admin created your account.Please click on below link and active your account.</td>';
        emailBody += '</tr>';
        emailBody += '<tr>';
        emailBody += '<td><a href="http://localhost:8080/api/user/active/'+user.id+'">Click here</a></td>';
        emailBody += '</tr>';
        emailBody += '</table>';
        emailUtil(body.email,emailBody,'Registation Invitation.',req, res);

        return ReS(res, {message:'Successfully created new user.', user:user.toWeb(), token:user.getJWT()}, 201);
    }
}
module.exports.createUser = createUser;

const { to, ReE, ReS } = require('../services/util.service');

const Dashboard = function(req, res){
	let user = req.user.id;
	return res.json({success:true, message:'it worked', data:'user name is :'});
}
module.exports.Dashboard = Dashboard


const { User }          = require('../models');
const authService       = require('../services/auth.service');
const { to, ReE, ReS, encrypt, decrypt, emailUtil }  = require('../services/util.service');
const userService       = require('../services/user.service');
const WEB_URL = 'http://localhost:8080';


const create = async function(req, res){ 
    const body = req.body.user; 
    if(!body.unique_key && !body.email && !body.phone){
        return ReE(res, 'Please enter an email or phone number to register.');
    } else if(!body.password){
        return ReE(res, 'Please enter a password to register.');
    }else{
        let err, user;

        [err, user] = await to(authService.createUser(body));

        if(err) return ReE(res, err, 422); 
        //var activeuserkey = encrypt('ABC_'+user.id); 
        var emailBody = '<table width="100%">';
        emailBody += '<tr>';
        emailBody += '<td>Hello '+body.first_name+' '+body.last_name+'</td>';
        emailBody += '</tr>';
        emailBody += '<tr>';
        emailBody += '<td>Thank you for register on our application.Please click on below link and active your account.</td>';
        emailBody += '</tr>';
        emailBody += '<tr>';
        emailBody += '<td><a href="http://localhost:8080/api/user/active/'+user.id+'">Click here</a></td>';
        emailBody += '</tr>';
        emailBody += '</table>';
        emailUtil(body.email,emailBody,'Registation Invitation.',req, res);
        return ReS(res, {message:'Successfully created new user.', user:user.toWeb(), token:user.getJWT()}, 201);
    }
}
module.exports.create = create;

const getUserDetail = async function(req, res){
    console.log('POPOPOPOPOPO');
    let err, user;
    [err, user] = await to(User.findById(req.body.id));  
    if(err){
        return ReE(res, err);
    } 
    // let company = req.company;
    return ReS(res, {user:user.toWeb()});
}
module.exports.getUserDetail = getUserDetail;

const update = async function(req, res){
    let err, user, data
    user = req.user;
    data = req.body.allUserInfo;
    user.set(data);
    [err, user] = await to(user.save());
    if(err){
        if(err.message=='Validation error') err = 'The email address or phone number is already in use';
        return ReE(res, err);
    }
    return ReS(res, {message :'Updated User: '+user.email});
}
module.exports.update = update;

const remove = async function(req, res){
    let user, err;
    user = req.user;
    user.remove_by_admin = 1;
 
    [err, user] = await to(user.save()); 
    if(err) return ReE(res, 'error occured trying to delete user');
   
    return ReS(res, {message:'Deleted successfully.'}, 204);
}
module.exports.remove = remove;

const login = async function(req, res){
    const body = req.body; 
    let err, user;
    [err, user] = await to(authService.authUser(req.body));
    if(err) return ReE(res, err, 422);
    if(user.remove_by_admin == 1) return ReE(res, 'Your account is deleted by admin');
    if(user.active == 0) return ReE(res, 'Your account is not verfied.');
    return ReS(res, {token:user.getJWT(), user:user.toWeb()});
}
module.exports.login = login;

const resetPassword = async function(req, res){
    
    const body = req.body.user;
    
    if(!body.email){
        return ReE(res, 'Please enter an email.');
    } else { 
        let err, user;
        [err, user] = await to(userService.authUserByEmail(req.body.user));
        if(err) return ReE(res, err, 422); 

        //console.log(user);

        var resetpasskey = encrypt(req.body.user.email);
        console.log(resetpasskey);
        user.forget_password = resetpasskey;
        [err, user] = await to(user.save());
        
        // outputs hello world
        console.log(decrypt(resetpasskey));
        
        var emailBody = '<table width="100%">';
        emailBody += '<tr>';
        emailBody += '<td>Please click on below link and reset your password.</td>';
        emailBody += '</tr>';
        emailBody += '<tr>';
        emailBody += '<td>Your Token : '+resetpasskey+'</td>';
        emailBody += '</tr>';
        emailBody += '<tr>';
        emailBody += '<td><a href="'+WEB_URL+'/resettoken">Click here</a></td>';
        emailBody += '</tr>';
        emailBody += '</table>';
        emailUtil(body.email,emailBody,'Reset Password.',req, res);
        return ReS(res, {message:"send password to mail"});
    }
}
module.exports.resetPassword = resetPassword;
    
const getPasswordApplied = async function(req, res){
    console.log(req.body);
    var body = req.body.passwordInfo;
    let err, user;
    [err, user] = await to(userService.checkByTokenAndUpdtPass(body)); 
    if(err) return ReE(res, err, 422);     
    return ReS(res, {message:"send password to mail",data:req.body.passwordInfo});
}
module.exports.getPasswordApplied = getPasswordApplied;

const activeRegisteredUser = async function(req, res){
    
    var activeuserkey = req.params.activeuserkey; 
    //console.log(decrypt(activeuserkey));
    let err, user;
    [err, user] = await to(userService.activeUserById(activeuserkey));     
    return ReS(res, {message:"Your account successfully activated."});
}
module.exports.activeRegisteredUser = activeRegisteredUser;

const setProfile = async function(req, res){
    
    var activeuserkey = req.params.activeuserkey; 
    //console.log(decrypt(activeuserkey));
    let err, user;
    [err, user] = await to(userService.activeUserById(activeuserkey));     
    return ReS(res, {message:"Your account successfully activated."});
}
module.exports.setProfile = setProfile;


//********* Change Password **********
const changePassword = async function (req, res) {

    let body = req.body;
    let newPassword = body.newPassword;
    let confirmPassword = body.confirmPassword;

    if (newPassword != confirmPassword) {
        return ReS(res, { message: "New password and repeat password does not match." });
    } else {
        [err, user] = await to(userService.changePassword(req.user, body));
        if (err) return ReE(res, err, 422);
        return ReS(res, { message: "Password change successfully." });
    }
}
module.exports.changePassword = changePassword;

const getAllUsers = async function (req, res) {

    let err, user 
    [err, user] = await to(User.findAll());
    if(err){
        if(err.message=='Validation error') err = 'Unable to found any user.';
        return ReE(res, err);
    }
    return ReS(res, {message :'Found all users ',users:user});
}
module.exports.getAllUsers = getAllUsers;


const createUser = async function(req, res){ 
    console.log(req.body.user);
    const body = req.body.user; 
    if(!body.unique_key && !body.email && !body.phone){
        return ReE(res, 'Please enter an email or phone number to register.');
    } else if(!body.password){
        return ReE(res, 'Please enter a password to register.');
    }else{
        let err, user;

        [err, user] = await to(authService.createUser(body));

        if(err) return ReE(res, err, 422); 
        //var activeuserkey = encrypt('ABC_'+user.id); 
        var emailBody = '<table width="100%">';
        emailBody += '<tr>';
        emailBody += '<td>Hello '+body.first_name+' '+body.last_name+'</td>';
        emailBody += '</tr>';
        emailBody += '<tr>';
        emailBody += '<td>Admin created your account.Please click on below link and active your account.</td>';
        emailBody += '</tr>';
        emailBody += '<tr>';
        emailBody += '<td><a href="http://localhost:8080/api/user/active/'+user.id+'">Click here</a></td>';
        emailBody += '</tr>';
        emailBody += '</table>';
        emailUtil(body.email,emailBody,'Registation Invitation.',req, res);

        return ReS(res, {message:'Successfully created new user.', user:user.toWeb(), token:user.getJWT()}, 201);
    }
}
module.exports.createUser = createUser;


import config from 'config';
import { authHeader } from '../_helpers';
import axios from 'axios';
var Usertoken = localStorage.getItem('user'); 
var tokenObj = JSON.parse(Usertoken); 

 

export const userService = {
    login,
    logout,
    register,
    getAll,
    getById,
    update,
    delete: _delete,
    forgetpassword,
    resettoken,
    dashboard,
    profile,
    getAllCompanies,
    addCompany,
    getCompaniesDetails,
    changePassword,
    getAllUsers,
    getUserDetails,
    updateUserDetails,
    addUser
};

function login(email, password) { 
    const userInfo = {
        email: email,
        password: password 
    };   
    return axios.post(`${config.apiUrl}/api/users/login`, userInfo)
        //.then(handleResponse)
        .then(function(response){
            if (response.data.token) { 
                localStorage.setItem('user', JSON.stringify(response.data));               
            }
        });
}

function logout() {
    // remove user from local storage to log user out
    //localStorage.removeItem('user');
}

function getAll() {
    const requestOptions = {
        method: 'GET',
        headers: authHeader()
    };

    return fetch(`${config.apiUrl}/users`, requestOptions).then(handleResponse);
}

function getById(id) {
    const requestOptions = {
        method: 'GET',
        headers: authHeader()
    };

    return fetch(`${config.apiUrl}/users/${id}`, requestOptions).then(handleResponse);
}

function register(user) { 

    return axios({
        method: 'POST',
        url: `${config.apiUrl}/api/users`,
        headers: { 'Content-Type': 'application/json'},
        data: {user:user}
    }).then(handleResponse);   
}

function update(user) {
    const requestOptions = {
        method: 'PUT',
        headers: { ...authHeader(), 'Content-Type': 'application/json' },
        body: JSON.stringify(user)
    };

    return fetch(`${config.apiUrl}/users/${user.id}`, requestOptions).then(handleResponse);;
}

// prefixed function name with underscore because delete is a reserved word in javascript
function _delete(id) {
    const requestOptions = {
        method: 'DELETE',
        headers: authHeader()
    };

    return fetch(`${config.apiUrl}/users/${id}`, requestOptions).then(handleResponse);
}

function forgetpassword(user) { 
    return axios({
        method: 'POST',
        url: `${config.apiUrl}/api/resetpassword`,
        headers: { 'Content-Type': 'application/json'},
        data: {user:user}
    }).then(handleResponse);  
}

function resettoken(passwordInfo) {      
    return axios({
        method: 'POST',
        url: `${config.apiUrl}/api/resetpasswordapplied`,
        headers: { 'Content-Type': 'application/json'},
        data: {passwordInfo:passwordInfo}
    }).then(handleResponse);  
}

function dashboard(loggedInUserInfo) { 
    const requestOptions = {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(loggedInUserInfo)
    };
     
    return fetch(`${config.apiUrl}/api/dashboard`, requestOptions).then(handleResponse);
}

function profile(loggedInUserInfo) { 
    const requestOptions = {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(loggedInUserInfo)
    };
     
    return fetch(`${config.apiUrl}/api/profile`, requestOptions).then(handleResponse);
}

function getAllCompanies() { 
    return axios({
        method: 'POST',
        url: `${config.apiUrl}/api/companies/all`,
        headers: { 'Content-Type': 'application/json', 'Authorization' : tokenObj.token },
    }).then(handleResponse); 
}

function addCompany(companyInfo) {
    const requestOptions = {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization' : tokenObj.token },
        body: JSON.stringify(companyInfo)
    };     
    return fetch(`${config.apiUrl}/api/companies`, requestOptions).then(handleResponse);
}

function getCompaniesDetails(id) {
    return axios({
        method: 'POST',
        url: `${config.apiUrl}/api/companiesdetail`,
        headers: { 'Content-Type': 'application/json', 'Authorization' : tokenObj.token },
        data: {id:id}
    }).then(handleResponse);     
}

function changePassword(changePasswordInfo) {
    const requestOptions = {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization' : tokenObj.token },
        body: JSON.stringify(changePasswordInfo)
    };   
    return fetch(`${config.apiUrl}/api/users/changepassword`, requestOptions).then(handleResponse);
}

function getAllUsers() { 
    return axios({
        method: 'POST',
        url: `${config.apiUrl}/api/users/all`,
        headers: { 'Content-Type': 'application/json', 'Authorization' : tokenObj.token },
    }).then(handleResponse); 
}

function getUserDetails(id) {
    return axios({
        method: 'POST',
        url: `${config.apiUrl}/api/users/userdetail`,
        headers: { 'Content-Type': 'application/json', 'Authorization' : tokenObj.token },
        data: {id:id}
    }).then(handleResponse);     
}

function updateUserDetails(allUserInfo) {
    return axios({
        method: 'POST',
        url: `${config.apiUrl}/api/users/updateuserdetail`,
        headers: { 'Content-Type': 'application/json', 'Authorization' : tokenObj.token },
        data: {allUserInfo:allUserInfo}
    }).then(handleResponse);     
}

function addUser(user) {
    return axios({
        method: 'POST',
        url: `${config.apiUrl}/api/users/adduserbyadmin`,
        headers: { 'Content-Type': 'application/json', 'Authorization' : tokenObj.token },
        data: {user:user}
    }).then(handleResponse);     
} 

function handleResponse(response) { 
    if(response.status = 200){
        return response;
    } else {
        const error = (data && data.message) || response.statusText;
        return Promise.reject(error);
    }

    // return response.text().then(text => {
    //     const data = text && JSON.parse(text);
    //     console.log('data',data);
    // console.log('<<<<<<<<<<<<<<<<<<<<<');
    //     if (!response.ok) {
    //         if (response.status === 401) {
    //             // auto logout if 401 response returned from api
    //             logout();
    //             location.reload(true);
    //         }
    //         const error = (data && data.message) || response.statusText;
    //         return Promise.reject(error);
    //     }

    //     console.log('data',data);
    //     return data;
    // });
}

const { User }          = require('../models');
const authService       = require('../services/auth.service');
const { to, ReE, ReS, encrypt, decrypt, emailUtil }  = require('../services/util.service');
const userService       = require('../services/user.service');
const WEB_URL = 'http://localhost:8080';


const create = async function(req, res){ 
    const body = req.body.user; 
    if(!body.unique_key && !body.email && !body.phone){
        return ReE(res, 'Please enter an email or phone number to register.');
    } else if(!body.password){
        return ReE(res, 'Please enter a password to register.');
    }else{
        let err, user;

        [err, user] = await to(authService.createUser(body));

        if(err) return ReE(res, err, 422); 
        //var activeuserkey = encrypt('ABC_'+user.id); 
        var emailBody = '<table width="100%">';
        emailBody += '<tr>';
        emailBody += '<td>Hello '+body.first_name+' '+body.last_name+'</td>';
        emailBody += '</tr>';
        emailBody += '<tr>';
        emailBody += '<td>Thank you for register on our application.Please click on below link and active your account.</td>';
        emailBody += '</tr>';
        emailBody += '<tr>';
        emailBody += '<td><a href="http://localhost:8080/api/user/active/'+user.id+'">Click here</a></td>';
        emailBody += '</tr>';
        emailBody += '</table>';
        emailUtil(body.email,emailBody,'Registation Invitation.',req, res);
        return ReS(res, {message:'Successfully created new user.', user:user.toWeb(), token:user.getJWT()}, 201);
    }
}
module.exports.create = create;

const getUserDetail = async function(req, res){
    console.log('POPOPOPOPOPO');
    let err, user;
    [err, user] = await to(User.findById(req.body.id));  
    if(err){
        return ReE(res, err);
    } 
    // let company = req.company;
    return ReS(res, {user:user.toWeb()});
}
module.exports.getUserDetail = getUserDetail;

const update = async function(req, res){
    let err, user, data
    user = req.user;
    data = req.body.allUserInfo;
    user.set(data);
    [err, user] = await to(user.save());
    if(err){
        if(err.message=='Validation error') err = 'The email address or phone number is already in use';
        return ReE(res, err);
    }
    return ReS(res, {message :'Updated User: '+user.email});
}
module.exports.update = update;

const remove = async function(req, res){
    let user, err;
    user = req.user;
    user.remove_by_admin = 1;
 
    [err, user] = await to(user.save()); 
    if(err) return ReE(res, 'error occured trying to delete user');
   
    return ReS(res, {message:'Deleted successfully.'}, 204);
}
module.exports.remove = remove;

const login = async function(req, res){
    const body = req.body; 
    let err, user;
    [err, user] = await to(authService.authUser(req.body));
    if(err) return ReE(res, err, 422);
    if(user.remove_by_admin == 1) return ReE(res, 'Your account is deleted by admin');
    if(user.active == 0) return ReE(res, 'Your account is not verfied.');
    return ReS(res, {token:user.getJWT(), user:user.toWeb()});
}
module.exports.login = login;

const resetPassword = async function(req, res){
    
    const body = req.body.user;
    
    if(!body.email){
        return ReE(res, 'Please enter an email.');
    } else { 
        let err, user;
        [err, user] = await to(userService.authUserByEmail(req.body.user));
        if(err) return ReE(res, err, 422); 

        //console.log(user);

        var resetpasskey = encrypt(req.body.user.email);
        console.log(resetpasskey);
        user.forget_password = resetpasskey;
        [err, user] = await to(user.save());
        
        // outputs hello world
        console.log(decrypt(resetpasskey));
        
        var emailBody = '<table width="100%">';
        emailBody += '<tr>';
        emailBody += '<td>Please click on below link and reset your password.</td>';
        emailBody += '</tr>';
        emailBody += '<tr>';
        emailBody += '<td>Your Token : '+resetpasskey+'</td>';
        emailBody += '</tr>';
        emailBody += '<tr>';
        emailBody += '<td><a href="'+WEB_URL+'/resettoken">Click here</a></td>';
        emailBody += '</tr>';
        emailBody += '</table>';
        emailUtil(body.email,emailBody,'Reset Password.',req, res);
        return ReS(res, {message:"send password to mail"});
    }
}
module.exports.resetPassword = resetPassword;
    
const getPasswordApplied = async function(req, res){
    console.log(req.body);
    var body = req.body.passwordInfo;
    let err, user;
    [err, user] = await to(userService.checkByTokenAndUpdtPass(body)); 
    if(err) return ReE(res, err, 422);     
    return ReS(res, {message:"send password to mail",data:req.body.passwordInfo});
}
module.exports.getPasswordApplied = getPasswordApplied;

const activeRegisteredUser = async function(req, res){
    
    var activeuserkey = req.params.activeuserkey; 
    //console.log(decrypt(activeuserkey));
    let err, user;
    [err, user] = await to(userService.activeUserById(activeuserkey));     
    return ReS(res, {message:"Your account successfully activated."});
}
module.exports.activeRegisteredUser = activeRegisteredUser;

const setProfile = async function(req, res){
    
    var activeuserkey = req.params.activeuserkey; 
    //console.log(decrypt(activeuserkey));
    let err, user;
    [err, user] = await to(userService.activeUserById(activeuserkey));     
    return ReS(res, {message:"Your account successfully activated."});
}
module.exports.setProfile = setProfile;


//********* Change Password **********
const changePassword = async function (req, res) {

    let body = req.body;
    let newPassword = body.newPassword;
    let confirmPassword = body.confirmPassword;

    if (newPassword != confirmPassword) {
        return ReS(res, { message: "New password and repeat password does not match." });
    } else {
        [err, user] = await to(userService.changePassword(req.user, body));
        if (err) return ReE(res, err, 422);
        return ReS(res, { message: "Password change successfully." });
    }
}
module.exports.changePassword = changePassword;

const getAllUsers = async function (req, res) {

    let err, user 
    [err, user] = await to(User.findAll());
    if(err){
        if(err.message=='Validation error') err = 'Unable to found any user.';
        return ReE(res, err);
    }
    return ReS(res, {message :'Found all users ',users:user});
}
module.exports.getAllUsers = getAllUsers;


const createUser = async function(req, res){ 
    console.log(req.body.user);
    const body = req.body.user; 
    if(!body.unique_key && !body.email && !body.phone){
        return ReE(res, 'Please enter an email or phone number to register.');
    } else if(!body.password){
        return ReE(res, 'Please enter a password to register.');
    }else{
        let err, user;

        [err, user] = await to(authService.createUser(body));

        if(err) return ReE(res, err, 422); 
        //var activeuserkey = encrypt('ABC_'+user.id); 
        var emailBody = '<table width="100%">';
        emailBody += '<tr>';
        emailBody += '<td>Hello '+body.first_name+' '+body.last_name+'</td>';
        emailBody += '</tr>';
        emailBody += '<tr>';
        emailBody += '<td>Admin created your account.Please click on below link and active your account.</td>';
        emailBody += '</tr>';
        emailBody += '<tr>';
        emailBody += '<td><a href="http://localhost:8080/api/user/active/'+user.id+'">Click here</a></td>';
        emailBody += '</tr>';
        emailBody += '</table>';
        emailUtil(body.email,emailBody,'Registation Invitation.',req, res);

        return ReS(res, {message:'Successfully created new user.', user:user.toWeb(), token:user.getJWT()}, 201);
    }
}
module.exports.createUser = createUser;

const { to, ReE, ReS } = require('../services/util.service');

const Dashboard = function(req, res){
	let user = req.user.id;
	return res.json({success:true, message:'it worked', data:'user name is :'});
}
module.exports.Dashboard = Dashboard


const { User }          = require('../models');
const authService       = require('../services/auth.service');
const { to, ReE, ReS, encrypt, decrypt, emailUtil }  = require('../services/util.service');
const userService       = require('../services/user.service');
const WEB_URL = 'http://localhost:8080';


const create = async function(req, res){ 
    const body = req.body.user; 
    if(!body.unique_key && !body.email && !body.phone){
        return ReE(res, 'Please enter an email or phone number to register.');
    } else if(!body.password){
        return ReE(res, 'Please enter a password to register.');
    }else{
        let err, user;

        [err, user] = await to(authService.createUser(body));

        if(err) return ReE(res, err, 422); 
        //var activeuserkey = encrypt('ABC_'+user.id); 
        var emailBody = '<table width="100%">';
        emailBody += '<tr>';
        emailBody += '<td>Hello '+body.first_name+' '+body.last_name+'</td>';
        emailBody += '</tr>';
        emailBody += '<tr>';
        emailBody += '<td>Thank you for register on our application.Please click on below link and active your account.</td>';
        emailBody += '</tr>';
        emailBody += '<tr>';
        emailBody += '<td><a href="http://localhost:8080/api/user/active/'+user.id+'">Click here</a></td>';
        emailBody += '</tr>';
        emailBody += '</table>';
        emailUtil(body.email,emailBody,'Registation Invitation.',req, res);
        return ReS(res, {message:'Successfully created new user.', user:user.toWeb(), token:user.getJWT()}, 201);
    }
}
module.exports.create = create;

const getUserDetail = async function(req, res){
    console.log('POPOPOPOPOPO');
    let err, user;
    [err, user] = await to(User.findById(req.body.id));  
    if(err){
        return ReE(res, err);
    } 
    // let company = req.company;
    return ReS(res, {user:user.toWeb()});
}
module.exports.getUserDetail = getUserDetail;

const update = async function(req, res){
    let err, user, data
    user = req.user;
    data = req.body.allUserInfo;
    user.set(data);
    [err, user] = await to(user.save());
    if(err){
        if(err.message=='Validation error') err = 'The email address or phone number is already in use';
        return ReE(res, err);
    }
    return ReS(res, {message :'Updated User: '+user.email});
}
module.exports.update = update;

const remove = async function(req, res){
    let user, err;
    user = req.user;
    user.remove_by_admin = 1;
 
    [err, user] = await to(user.save()); 
    if(err) return ReE(res, 'error occured trying to delete user');
   
    return ReS(res, {message:'Deleted successfully.'}, 204);
}
module.exports.remove = remove;

const login = async function(req, res){
    const body = req.body; 
    let err, user;
    [err, user] = await to(authService.authUser(req.body));
    if(err) return ReE(res, err, 422);
    if(user.remove_by_admin == 1) return ReE(res, 'Your account is deleted by admin');
    if(user.active == 0) return ReE(res, 'Your account is not verfied.');
    return ReS(res, {token:user.getJWT(), user:user.toWeb()});
}
module.exports.login = login;

const resetPassword = async function(req, res){
    
    const body = req.body.user;
    
    if(!body.email){
        return ReE(res, 'Please enter an email.');
    } else { 
        let err, user;
        [err, user] = await to(userService.authUserByEmail(req.body.user));
        if(err) return ReE(res, err, 422); 

        //console.log(user);

        var resetpasskey = encrypt(req.body.user.email);
        console.log(resetpasskey);
        user.forget_password = resetpasskey;
        [err, user] = await to(user.save());
        
        // outputs hello world
        console.log(decrypt(resetpasskey));
        
        var emailBody = '<table width="100%">';
        emailBody += '<tr>';
        emailBody += '<td>Please click on below link and reset your password.</td>';
        emailBody += '</tr>';
        emailBody += '<tr>';
        emailBody += '<td>Your Token : '+resetpasskey+'</td>';
        emailBody += '</tr>';
        emailBody += '<tr>';
        emailBody += '<td><a href="'+WEB_URL+'/resettoken">Click here</a></td>';
        emailBody += '</tr>';
        emailBody += '</table>';
        emailUtil(body.email,emailBody,'Reset Password.',req, res);
        return ReS(res, {message:"send password to mail"});
    }
}
module.exports.resetPassword = resetPassword;
    
const getPasswordApplied = async function(req, res){
    console.log(req.body);
    var body = req.body.passwordInfo;
    let err, user;
    [err, user] = await to(userService.checkByTokenAndUpdtPass(body)); 
    if(err) return ReE(res, err, 422);     
    return ReS(res, {message:"send password to mail",data:req.body.passwordInfo});
}
module.exports.getPasswordApplied = getPasswordApplied;

const activeRegisteredUser = async function(req, res){
    
    var activeuserkey = req.params.activeuserkey; 
    //console.log(decrypt(activeuserkey));
    let err, user;
    [err, user] = await to(userService.activeUserById(activeuserkey));     
    return ReS(res, {message:"Your account successfully activated."});
}
module.exports.activeRegisteredUser = activeRegisteredUser;

const setProfile = async function(req, res){
    
    var activeuserkey = req.params.activeuserkey; 
    //console.log(decrypt(activeuserkey));
    let err, user;
    [err, user] = await to(userService.activeUserById(activeuserkey));     
    return ReS(res, {message:"Your account successfully activated."});
}
module.exports.setProfile = setProfile;


//********* Change Password **********
const changePassword = async function (req, res) {

    let body = req.body;
    let newPassword = body.newPassword;
    let confirmPassword = body.confirmPassword;

    if (newPassword != confirmPassword) {
        return ReS(res, { message: "New password and repeat password does not match." });
    } else {
        [err, user] = await to(userService.changePassword(req.user, body));
        if (err) return ReE(res, err, 422);
        return ReS(res, { message: "Password change successfully." });
    }
}
module.exports.changePassword = changePassword;

const getAllUsers = async function (req, res) {

    let err, user 
    [err, user] = await to(User.findAll());
    if(err){
        if(err.message=='Validation error') err = 'Unable to found any user.';
        return ReE(res, err);
    }
    return ReS(res, {message :'Found all users ',users:user});
}
module.exports.getAllUsers = getAllUsers;


const createUser = async function(req, res){ 
    console.log(req.body.user);
    const body = req.body.user; 
    if(!body.unique_key && !body.email && !body.phone){
        return ReE(res, 'Please enter an email or phone number to register.');
    } else if(!body.password){
        return ReE(res, 'Please enter a password to register.');
    }else{
        let err, user;

        [err, user] = await to(authService.createUser(body));

        if(err) return ReE(res, err, 422); 
        //var activeuserkey = encrypt('ABC_'+user.id); 
        var emailBody = '<table width="100%">';
        emailBody += '<tr>';
        emailBody += '<td>Hello '+body.first_name+' '+body.last_name+'</td>';
        emailBody += '</tr>';
        emailBody += '<tr>';
        emailBody += '<td>Admin created your account.Please click on below link and active your account.</td>';
        emailBody += '</tr>';
        emailBody += '<tr>';
        emailBody += '<td><a href="http://localhost:8080/api/user/active/'+user.id+'">Click here</a></td>';
        emailBody += '</tr>';
        emailBody += '</table>';
        emailUtil(body.email,emailBody,'Registation Invitation.',req, res);

        return ReS(res, {message:'Successfully created new user.', user:user.toWeb(), token:user.getJWT()}, 201);
    }
}
module.exports.createUser = createUser;


import config from 'config';
import { authHeader } from '../_helpers';
import axios from 'axios';
var Usertoken = localStorage.getItem('user'); 
var tokenObj = JSON.parse(Usertoken); 

 

export const userService = {
    login,
    logout,
    register,
    getAll,
    getById,
    update,
    delete: _delete,
    forgetpassword,
    resettoken,
    dashboard,
    profile,
    getAllCompanies,
    addCompany,
    getCompaniesDetails,
    changePassword,
    getAllUsers,
    getUserDetails,
    updateUserDetails,
    addUser
};

function login(email, password) { 
    const userInfo = {
        email: email,
        password: password 
    };   
    return axios.post(`${config.apiUrl}/api/users/login`, userInfo)
        //.then(handleResponse)
        .then(function(response){
            if (response.data.token) { 
                localStorage.setItem('user', JSON.stringify(response.data));               
            }
        });
}

function logout() {
    // remove user from local storage to log user out
    //localStorage.removeItem('user');
}

function getAll() {
    const requestOptions = {
        method: 'GET',
        headers: authHeader()
    };

    return fetch(`${config.apiUrl}/users`, requestOptions).then(handleResponse);
}

function getById(id) {
    const requestOptions = {
        method: 'GET',
        headers: authHeader()
    };

    return fetch(`${config.apiUrl}/users/${id}`, requestOptions).then(handleResponse);
}

function register(user) { 

    return axios({
        method: 'POST',
        url: `${config.apiUrl}/api/users`,
        headers: { 'Content-Type': 'application/json'},
        data: {user:user}
    }).then(handleResponse);   
}

function update(user) {
    const requestOptions = {
        method: 'PUT',
        headers: { ...authHeader(), 'Content-Type': 'application/json' },
        body: JSON.stringify(user)
    };

    return fetch(`${config.apiUrl}/users/${user.id}`, requestOptions).then(handleResponse);;
}

// prefixed function name with underscore because delete is a reserved word in javascript
function _delete(id) {
    const requestOptions = {
        method: 'DELETE',
        headers: authHeader()
    };

    return fetch(`${config.apiUrl}/users/${id}`, requestOptions).then(handleResponse);
}

function forgetpassword(user) { 
    return axios({
        method: 'POST',
        url: `${config.apiUrl}/api/resetpassword`,
        headers: { 'Content-Type': 'application/json'},
        data: {user:user}
    }).then(handleResponse);  
}

function resettoken(passwordInfo) {      
    return axios({
        method: 'POST',
        url: `${config.apiUrl}/api/resetpasswordapplied`,
        headers: { 'Content-Type': 'application/json'},
        data: {passwordInfo:passwordInfo}
    }).then(handleResponse);  
}

function dashboard(loggedInUserInfo) { 
    const requestOptions = {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(loggedInUserInfo)
    };
     
    return fetch(`${config.apiUrl}/api/dashboard`, requestOptions).then(handleResponse);
}

function profile(loggedInUserInfo) { 
    const requestOptions = {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(loggedInUserInfo)
    };
     
    return fetch(`${config.apiUrl}/api/profile`, requestOptions).then(handleResponse);
}

function getAllCompanies() { 
    return axios({
        method: 'POST',
        url: `${config.apiUrl}/api/companies/all`,
        headers: { 'Content-Type': 'application/json', 'Authorization' : tokenObj.token },
    }).then(handleResponse); 
}

function addCompany(companyInfo) {
    const requestOptions = {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization' : tokenObj.token },
        body: JSON.stringify(companyInfo)
    };     
    return fetch(`${config.apiUrl}/api/companies`, requestOptions).then(handleResponse);
}

function getCompaniesDetails(id) {
    return axios({
        method: 'POST',
        url: `${config.apiUrl}/api/companiesdetail`,
        headers: { 'Content-Type': 'application/json', 'Authorization' : tokenObj.token },
        data: {id:id}
    }).then(handleResponse);     
}

function changePassword(changePasswordInfo) {
    const requestOptions = {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization' : tokenObj.token },
        body: JSON.stringify(changePasswordInfo)
    };   
    return fetch(`${config.apiUrl}/api/users/changepassword`, requestOptions).then(handleResponse);
}

function getAllUsers() { 
    return axios({
        method: 'POST',
        url: `${config.apiUrl}/api/users/all`,
        headers: { 'Content-Type': 'application/json', 'Authorization' : tokenObj.token },
    }).then(handleResponse); 
}

function getUserDetails(id) {
    return axios({
        method: 'POST',
        url: `${config.apiUrl}/api/users/userdetail`,
        headers: { 'Content-Type': 'application/json', 'Authorization' : tokenObj.token },
        data: {id:id}
    }).then(handleResponse);     
}

function updateUserDetails(allUserInfo) {
    return axios({
        method: 'POST',
        url: `${config.apiUrl}/api/users/updateuserdetail`,
        headers: { 'Content-Type': 'application/json', 'Authorization' : tokenObj.token },
        data: {allUserInfo:allUserInfo}
    }).then(handleResponse);     
}

function addUser(user) {
    return axios({
        method: 'POST',
        url: `${config.apiUrl}/api/users/adduserbyadmin`,
        headers: { 'Content-Type': 'application/json', 'Authorization' : tokenObj.token },
        data: {user:user}
    }).then(handleResponse);     
} 

function handleResponse(response) { 
    if(response.status = 200){
        return response;
    } else {
        const error = (data && data.message) || response.statusText;
        return Promise.reject(error);
    }

    // return response.text().then(text => {
    //     const data = text && JSON.parse(text);
    //     console.log('data',data);
    // console.log('<<<<<<<<<<<<<<<<<<<<<');
    //     if (!response.ok) {
    //         if (response.status === 401) {
    //             // auto logout if 401 response returned from api
    //             logout();
    //             location.reload(true);
    //         }
    //         const error = (data && data.message) || response.statusText;
    //         return Promise.reject(error);
    //     }

    //     console.log('data',data);
    //     return data;
    // });
}

const { User }          = require('../models');
const authService       = require('../services/auth.service');
const { to, ReE, ReS, encrypt, decrypt, emailUtil }  = require('../services/util.service');
const userService       = require('../services/user.service');
const WEB_URL = 'http://localhost:8080';


const create = async function(req, res){ 
    const body = req.body.user; 
    if(!body.unique_key && !body.email && !body.phone){
        return ReE(res, 'Please enter an email or phone number to register.');
    } else if(!body.password){
        return ReE(res, 'Please enter a password to register.');
    }else{
        let err, user;

        [err, user] = await to(authService.createUser(body));

        if(err) return ReE(res, err, 422); 
        //var activeuserkey = encrypt('ABC_'+user.id); 
        var emailBody = '<table width="100%">';
        emailBody += '<tr>';
        emailBody += '<td>Hello '+body.first_name+' '+body.last_name+'</td>';
        emailBody += '</tr>';
        emailBody += '<tr>';
        emailBody += '<td>Thank you for register on our application.Please click on below link and active your account.</td>';
        emailBody += '</tr>';
        emailBody += '<tr>';
        emailBody += '<td><a href="http://localhost:8080/api/user/active/'+user.id+'">Click here</a></td>';
        emailBody += '</tr>';
        emailBody += '</table>';
        emailUtil(body.email,emailBody,'Registation Invitation.',req, res);
        return ReS(res, {message:'Successfully created new user.', user:user.toWeb(), token:user.getJWT()}, 201);
    }
}
module.exports.create = create;

const getUserDetail = async function(req, res){
    console.log('POPOPOPOPOPO');
    let err, user;
    [err, user] = await to(User.findById(req.body.id));  
    if(err){
        return ReE(res, err);
    } 
    // let company = req.company;
    return ReS(res, {user:user.toWeb()});
}
module.exports.getUserDetail = getUserDetail;

const update = async function(req, res){
    let err, user, data
    user = req.user;
    data = req.body.allUserInfo;
    user.set(data);
    [err, user] = await to(user.save());
    if(err){
        if(err.message=='Validation error') err = 'The email address or phone number is already in use';
        return ReE(res, err);
    }
    return ReS(res, {message :'Updated User: '+user.email});
}
module.exports.update = update;

const remove = async function(req, res){
    let user, err;
    user = req.user;
    user.remove_by_admin = 1;
 
    [err, user] = await to(user.save()); 
    if(err) return ReE(res, 'error occured trying to delete user');
   
    return ReS(res, {message:'Deleted successfully.'}, 204);
}
module.exports.remove = remove;

const login = async function(req, res){
    const body = req.body; 
    let err, user;
    [err, user] = await to(authService.authUser(req.body));
    if(err) return ReE(res, err, 422);
    if(user.remove_by_admin == 1) return ReE(res, 'Your account is deleted by admin');
    if(user.active == 0) return ReE(res, 'Your account is not verfied.');
    return ReS(res, {token:user.getJWT(), user:user.toWeb()});
}
module.exports.login = login;

const resetPassword = async function(req, res){
    
    const body = req.body.user;
    
    if(!body.email){
        return ReE(res, 'Please enter an email.');
    } else { 
        let err, user;
        [err, user] = await to(userService.authUserByEmail(req.body.user));
        if(err) return ReE(res, err, 422); 

        //console.log(user);

        var resetpasskey = encrypt(req.body.user.email);
        console.log(resetpasskey);
        user.forget_password = resetpasskey;
        [err, user] = await to(user.save());
        
        // outputs hello world
        console.log(decrypt(resetpasskey));
        
        var emailBody = '<table width="100%">';
        emailBody += '<tr>';
        emailBody += '<td>Please click on below link and reset your password.</td>';
        emailBody += '</tr>';
        emailBody += '<tr>';
        emailBody += '<td>Your Token : '+resetpasskey+'</td>';
        emailBody += '</tr>';
        emailBody += '<tr>';
        emailBody += '<td><a href="'+WEB_URL+'/resettoken">Click here</a></td>';
        emailBody += '</tr>';
        emailBody += '</table>';
        emailUtil(body.email,emailBody,'Reset Password.',req, res);
        return ReS(res, {message:"send password to mail"});
    }
}
module.exports.resetPassword = resetPassword;
    
const getPasswordApplied = async function(req, res){
    console.log(req.body);
    var body = req.body.passwordInfo;
    let err, user;
    [err, user] = await to(userService.checkByTokenAndUpdtPass(body)); 
    if(err) return ReE(res, err, 422);     
    return ReS(res, {message:"send password to mail",data:req.body.passwordInfo});
}
module.exports.getPasswordApplied = getPasswordApplied;

const activeRegisteredUser = async function(req, res){
    
    var activeuserkey = req.params.activeuserkey; 
    //console.log(decrypt(activeuserkey));
    let err, user;
    [err, user] = await to(userService.activeUserById(activeuserkey));     
    return ReS(res, {message:"Your account successfully activated."});
}
module.exports.activeRegisteredUser = activeRegisteredUser;

const setProfile = async function(req, res){
    
    var activeuserkey = req.params.activeuserkey; 
    //console.log(decrypt(activeuserkey));
    let err, user;
    [err, user] = await to(userService.activeUserById(activeuserkey));     
    return ReS(res, {message:"Your account successfully activated."});
}
module.exports.setProfile = setProfile;


//********* Change Password **********
const changePassword = async function (req, res) {

    let body = req.body;
    let newPassword = body.newPassword;
    let confirmPassword = body.confirmPassword;

    if (newPassword != confirmPassword) {
        return ReS(res, { message: "New password and repeat password does not match." });
    } else {
        [err, user] = await to(userService.changePassword(req.user, body));
        if (err) return ReE(res, err, 422);
        return ReS(res, { message: "Password change successfully." });
    }
}
module.exports.changePassword = changePassword;

const getAllUsers = async function (req, res) {

    let err, user 
    [err, user] = await to(User.findAll());
    if(err){
        if(err.message=='Validation error') err = 'Unable to found any user.';
        return ReE(res, err);
    }
    return ReS(res, {message :'Found all users ',users:user});
}
module.exports.getAllUsers = getAllUsers;


const createUser = async function(req, res){ 
    console.log(req.body.user);
    const body = req.body.user; 
    if(!body.unique_key && !body.email && !body.phone){
        return ReE(res, 'Please enter an email or phone number to register.');
    } else if(!body.password){
        return ReE(res, 'Please enter a password to register.');
    }else{
        let err, user;

        [err, user] = await to(authService.createUser(body));

        if(err) return ReE(res, err, 422); 
        //var activeuserkey = encrypt('ABC_'+user.id); 
        var emailBody = '<table width="100%">';
        emailBody += '<tr>';
        emailBody += '<td>Hello '+body.first_name+' '+body.last_name+'</td>';
        emailBody += '</tr>';
        emailBody += '<tr>';
        emailBody += '<td>Admin created your account.Please click on below link and active your account.</td>';
        emailBody += '</tr>';
        emailBody += '<tr>';
        emailBody += '<td><a href="http://localhost:8080/api/user/active/'+user.id+'">Click here</a></td>';
        emailBody += '</tr>';
        emailBody += '</table>';
        emailUtil(body.email,emailBody,'Registation Invitation.',req, res);

        return ReS(res, {message:'Successfully created new user.', user:user.toWeb(), token:user.getJWT()}, 201);
    }
}
module.exports.createUser = createUser;
