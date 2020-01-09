const {to}      = require('await-to-js');
const pe        = require('parse-error');
const crypto    = require('crypto'),algorithm = 'aes-256-ctr',password = 'd6F3Efeq';
require('dotenv').config();//instatiate environment variables
const nodemailer        = require("nodemailer");

module.exports.to = async (promise) => {
    let err, res;
    [err, res] = await to(promise);
    if(err) return [pe(err)];

    return [null, res];
};

module.exports.ReE = function(res, err, code){ // Error Web Response
    if(typeof err == 'object' && typeof err.message != 'undefined'){
        err = err.message;
    }

    if(typeof code !== 'undefined') res.statusCode = code;

    return res.json({success:false, error: err});
};

module.exports.ReS = function(res, data, code){ // Success Web Response
    let send_data = {success:true};

    if(typeof data == 'object'){
        send_data = Object.assign(data, send_data);//merge the objects
    }

    if(typeof code !== 'undefined') res.statusCode = code;
    return res.json(send_data)
};

module.exports.TE = TE = function(err_message, log){ // TE stands for Throw Error
    if(log === true){
        console.error(err_message);
    }
    throw new Error(err_message);
};

module.exports.encrypt =  function encrypt(text){
    var cipher = crypto.createCipher(algorithm,password)
    var crypted = cipher.update(text,'utf8','hex')
    crypted += cipher.final('hex');
    return crypted;
}
   
module.exports.decrypt = function decrypt(text){
    var decipher = crypto.createDecipher(algorithm,password)
    var dec = decipher.update(text,'hex','utf8')
    dec += decipher.final('utf8');
    return dec;
  }

module.exports.emailUtil = function sendEmail(userEmailAddress,mailBody,subject,req, res){

    var smtpTransport = nodemailer.createTransport("SMTP",{ 
        service: process.env.SMTP_SERVICE,
        host: process.env.SMTP_HOST_NAME,
        auth: {
            user: process.env.SMTP_USERNAME,
            pass: process.env.SMTP_PASSWORD
        },
        debug:process.env.SMTP_DEBUG
    });

    var mailOptions = {
        to : userEmailAddress,
        subject : subject,
        html : mailBody
    } 
    
    smtpTransport.sendMail(mailOptions, function(error, response){
        if(error){
            return false;
        } else {
            return true;
        }
    });
}