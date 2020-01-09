'use strict';
const bcrypt 			= require('bcrypt');
const bcrypt_p 			= require('bcrypt-promise');
const jwt           	= require('jsonwebtoken');
const {TE, to}          = require('../services/util.service');
const CONFIG            = require('../config/config');
const Sequelize = require('sequelize');

module.exports = (sequelize, DataTypes) => {
    var Model = sequelize.define('User', {
        username: DataTypes.STRING,
        password: DataTypes.STRING,
        email: {type: DataTypes.STRING, allowNull: true, unique: true, validate: { isEmail: {msg: "Email address invalid."} }},
        user_type: DataTypes.INTEGER,
        abn_number: DataTypes.STRING, 
        first_name: DataTypes.STRING,
        last_name: DataTypes.STRING,
        profile_image: DataTypes.STRING,
        is_active:{ type: Sequelize.INTEGER, defaultValue: 0 },
        isArchived:{ type: Sequelize.INTEGER, defaultValue: 0 },
        forget_password:DataTypes.STRING, 
        remove_by_admin: { type: Sequelize.INTEGER, defaultValue: 0 },
        address:DataTypes.STRING, 
        latitude:DataTypes.STRING, 
        longitude:DataTypes.STRING, 
        phone_number:DataTypes.STRING,   
        added_by: DataTypes.INTEGER,  
    }); 
    
    Model.beforeSave(async (user, options) => {
        let err;
        if (user.changed('password')){
            let salt, hash
            [err, salt] = await to(bcrypt.genSalt(10));
            if(err) TE(err.message, true);

            [err, hash] = await to(bcrypt.hash(user.password, salt));
            if(err) TE(err.message, true);

            user.password = hash;
        }
    });

    Model.prototype.comparePassword = async function (pw) {
        let err, pass
        if(!this.password) TE('password not set');

        [err, pass] = await to(bcrypt_p.compare(pw, this.password));
        if(err) TE(err);

        if(!pass) TE('invalid password');

        return this;
    }

    Model.prototype.getJWT = function () {
        let expiration_time = parseInt(CONFIG.jwt_expiration);
        return "Bearer "+jwt.sign({user_id:this.id}, CONFIG.jwt_encryption, {expiresIn: expiration_time});
    };

    Model.prototype.toWeb = function (pw) {
        let json = this.toJSON();
        return json;
    };

    return Model;
};
