const { User, Company, Terms,FeatureUpdate, Clauses,Deedusers,Deeds,Deedhistory,CompanyAdmin,CompanyDirector,TermAndClauseSection,MinuteTemplate } 	    = require('../models');

const validator             = require('validator');
const { to, TE,emailUtil }  = require('./util.service');
const bcrypt_p 			    = require('bcrypt-promise');

const getUniqueKeyFromBody = function(body){// this is so they can send in 3 options unique_key, email, or phone and it will work
    let unique_key = body.unique_key;
    if(typeof unique_key==='undefined'){
        if(typeof body.email != 'undefined'){
            unique_key = body.email
        }else{
            unique_key = null;
        }
    }

    return unique_key;
}
module.exports.getUniqueKeyFromBody = getUniqueKeyFromBody;

const authUserByEmail = async function(userInfo){//returns token
    let unique_key;
    let auth_info = {};
    auth_info.status = 'resetPassword';
    unique_key = getUniqueKeyFromBody(userInfo);

    if(!unique_key) TE('Please enter an email');

    let user;
    if(validator.isEmail(unique_key)){
        auth_info.method='email';

        [err, user] = await to(User.findOne({where:{email:unique_key}}));
        if(err) TE(err.message);

    }else{
        TE('A valid email was not entered');
    }
    if(!user) TE('Not registered');
    return user;
}
module.exports.authUserByEmail = authUserByEmail;

const activeUserById = async function(userInfo){//returns token
 
    let err,user;
    [err, user] = await to(User.findOne({where:{email:userInfo}})); 
    console.log("------------", user);
    if(err) TE(err.message);
    if(!user) TE('Something went wrong.');
    user.is_active = 1; 
    [err, user] = await to(user.save());
    return user;
}
module.exports.activeUserById = activeUserById;

const getUserById = async function(userid){//returns token 
    let err,user;  
    [err, user] = await to(User.findOne({where:{id:userid}}));  
    if(err) TE(err.message);
    return user;
}
module.exports.getUserById = getUserById;

const countAssociatedUsers = async function(company_id,type){//returns token 
    let err,user; 
    let whereObj = {};
    whereObj.company_id = company_id;
    if(type == 'directors') {
        whereObj.user_type = 3;
    } 
    [err, user] = await to(User.findAndCountAll({where:whereObj})); 
    if(err) TE(err.message);
    if(!user) TE('Something went wrong.');  
    return user;
}
module.exports.countAssociatedUsers = countAssociatedUsers;

const associatedDirectors = async function(company_id){//returns token 
    let err,user;  
    [err, user] = await to(User.findAll({where:{user_type:3,company_id:company_id}})); 
    if(err) TE(err.message);
    if(!user) TE('Something went wrong.');  
    return user;
}
module.exports.associatedDirectors = associatedDirectors;

const getCompanyById = async function(compid){
    let err,user;
   
    [err, user] = await to(Company.findOne({where:{id:compid}})); 
    if(err) TE(err.message);
    if(!user) TE('Something went wrong.');
    [err, user] = await to(user.save());
    return user;
}
module.exports.getCompanyById = getCompanyById;

const checkByTokenAndUpdtPass = async function(userInfo){//returns token
 
    let err,user;
    [err, user] = await to(User.findOne({where:{forget_password:userInfo.token}})); 
    if(err) TE(err.message);
    if(!user) TE('Something went wrong.');
    user.password = userInfo.newPassword; 
    user.forget_password = null; 
   
    [err, user] = await to(user.save());
    return user;

}
module.exports.checkByTokenAndUpdtPass = checkByTokenAndUpdtPass;

const changePassword = async function(userId, body){

    let pass,user ;  
    [err, user] = await to(User.findOne({where:{id:userId}})); 
    if(user != null){ 
        user.toWeb();
        [err, pass] = await to(bcrypt_p.compare(body.currentPassword, user.toWeb().password));
        if(!pass) TE('Current password does not match.');
        user.password = body.newPassword;
        [err, user] = await to(user.save());
        return user;
    } 
   // }
}
module.exports.changePassword = changePassword;

const getTermById = async function(termId){//returns token 
    let err,term;  
    [err, term] = await to(Terms.findOne({where:{id:termId}})); 
    if(err) TE(err.message);
    if(!term) TE('Something went wrong.');  
    
    return term;
}
module.exports.getTermById = getTermById;

const setTermBlockedByCreatedBy = async function(createdBy){//returns token 
    let err, term ;  
    [err, term] = await to(Terms.findOne({where:{created_by:createdBy,status:1}})) 
    if(err) TE(err.message);
    if(!term) TE('Something went wrong.'); 
    Terms.update({status:2},{where:{id:term.dataValues.id}}) 
    return true;
}
module.exports.setTermBlockedByCreatedBy = setTermBlockedByCreatedBy;

const getClausesById = async function(clausesId){//returns token 
    let err,clauses;  
    [err, clauses] = await to(Clauses.findOne({where:{id:clausesId}})); 
    if(err) TE(err.message);
    if(!clauses) TE('Something went wrong.');  
    
    return clauses;
}
module.exports.getClausesById = getClausesById;

const setClausesBlockedByCreatedBy = async function(createdBy){//returns token 
    let err, clauses ;  
    [err, clauses] = await to(Clauses.findOne({where:{created_by:createdBy,status:1}})) 
    if(err) TE(err.message);
    if(!clauses) TE('Something went wrong.'); 
    Clauses.update({status:2},{where:{id:clauses.dataValues.id}}) 
    return true;
}
module.exports.setClausesBlockedByCreatedBy = setClausesBlockedByCreatedBy;

const addUserDataOnDeedUsers = async function(userIds,deedId,type,deedname){//returns token  
    
    let err, deeduser ;  
    for( let i in userIds){
        let deedUserObj = {};
        deedUserObj.deed_id = deedId;
        deedUserObj.user_id = userIds[i].id;
        deedUserObj.acknowledgement = 0;
        deedUserObj.is_approve = 0; 
        deedUserObj.user_type = type;      
        [err, deeduser] = await to(Deedusers.create(deedUserObj)); 
        [err, deeduser] = await to(deeduser.save());
    } 
    return true;
}
module.exports.addUserDataOnDeedUsers = addUserDataOnDeedUsers;


const getAllDeedUserById = async function(deedId,deedName,type){//returns token 
    let err,deedusers,user;  
    [err, deedusers] = await to(Deedusers.findAll({where:{deed_id:deedId}})); 
    if(err) TE(err.message);
    if(!deedusers) TE('Something went wrong.');  
    
    for( let i in deedusers){
        let deed = deedusers[i];  
        let deed_info = deed.toWeb();
        [err, user] = await to(User.findOne({where:{id:deed_info.user_id}}));   
        let emailBody = '<table width="100%">';
        emailBody += "<tr>";
        emailBody +="<td>Hello user</td>";
        emailBody += "</tr>";
        emailBody += "<tr>";

        if(type == 'changestatus'){
            emailBody += "<td>Deed Provider added you for deed <b>"+deedName+"</b>.</td>";
        } else if(type == 'sendapproval') {
            emailBody += "<tr>";
            emailBody += "<td>Add your approval before publish deed <b>"+deedName+"</b>.</td>";
        }
        emailBody += "</tr>";
        emailBody += "</table>";  
        emailUtil(user.toWeb().email, emailBody, "Deed provider published.", '', '');        
    }    
    return true;
}
module.exports.getAllDeedUserById = getAllDeedUserById;

const getcountStackholdersOfDeed = async function(deedId){//returns token 
    let err,deedusers;
    [err, deedusers] = await to(Deedusers.findAndCountAll({where:{deed_id:deedId}})); 
    if(err) TE(err.message);
    if(!deedusers) TE('Something went wrong.');  
    return deedusers;
}
module.exports.getcountStackholdersOfDeed = getcountStackholdersOfDeed;

const getcountStackholdersOfDeedAck = async function(deedId){//returns token 
    let err,deedusers;
    [err, deedusers] = await to(Deedusers.findAndCountAll({where:{deed_id:deedId,acknowledgement:1}})); 
    if(err) TE(err.message);
    if(!deedusers) TE('Something went wrong.');  
    return deedusers;
}
module.exports.getcountStackholdersOfDeedAck = getcountStackholdersOfDeedAck;

const getDeedById = async function(deedId){//returns token  
    let err,deed;
    [err, deed] = await to(Deeds.findById(deedId)); 
    if(err) TE(err.message);
    let sendData = (deed != null) ? deed.toWeb() : null; 
    return sendData;
}
module.exports.getDeedById = getDeedById;

const addUserHistoryOnDeedUsers = async function(historyData,updateId){    
    let err, deedhistory;
    for( let i in historyData){
        let deedUserObj = historyData[i];
        deedUserObj.deed_update_id = updateId;
        [err, deedhistory] = await to(Deedhistory.create(deedUserObj)); 
        [err, deedhistory] = await to(deedhistory.save());
    } 
    return true;
}
module.exports.addUserHistoryOnDeedUsers = addUserHistoryOnDeedUsers;

const updateUserDataOnDeedUsers = async function(listOfUsers,deedId,type){

    let err, deeduser;

    let oldUsers=  [];
    [err, oldUsers] = await to(Deedusers.findAll({where:{deed_id:deedId,user_type:type}})); 
    for( let i in listOfUsers){
        let deedUserObj = listOfUsers[i];
        [err, deeduser] = await to(Deedusers.findOne({where:{user_id:deedUserObj.id,deed_id:deedId,user_type:type}})); 
        if(deeduser == null){
            let deedUserObjNew = {};
            deedUserObjNew.deed_id = deedId;
            deedUserObjNew.user_id = deedUserObj.id;
            deedUserObjNew.acknowledgement = 0;
            deedUserObjNew.is_approve = 0; 
            deedUserObjNew.user_type = type;   
            [err, deeduser] = await to(Deedusers.create(deedUserObjNew));  
            [err, deeduser] = await to(deeduser.save());
        } 
    } 

    for( let i in oldUsers){
        let deedUserObj = oldUsers[i];
        if( listOfUsers.findIndex(obj=>obj.id == deedUserObj.user_id)==-1){
            [err, deeduser] = await to(Deedusers.destroy({where:{id:deedUserObj.id}}));  
        }
    }
    

    return true;
}
module.exports.updateUserDataOnDeedUsers = updateUserDataOnDeedUsers;

const removeUserDataOnDeedUsers = async function(listOfIds,deedId){
    let err, deeduser;
    for( let i in listOfIds){ 
        [err, deeduser] = await to(Deedusers.destroy({where:{id:listOfIds[i]}})); 
    } 
    return true;
}
module.exports.removeUserDataOnDeedUsers = removeUserDataOnDeedUsers;


const getcountStatusOfDeed = async function(deedId){
    let err,deeds;
    [err, deeds] = await to(Deeds.findAll({where:{id:deedId}})); 
    if(err) TE(err.message);
    return deeds;
}
module.exports.getcountStatusOfDeed = getcountStatusOfDeed;


const getAdminCountByID = async function(companyId){//returns token 
    let err,user;  
    [err, user] = await to(CompanyAdmin.findAndCountAll({where:{company_id:companyId}}));  
    if(err) TE(err.message);
    if(!user) TE('Something went wrong.');  
    
    return user;
}
module.exports.getAdminCountByID = getAdminCountByID;

const getDirectorsCountByID = async function(companyId){//returns token 
    let err,user;  
    [err, user] = await to(CompanyDirector.findAndCountAll({where:{company_id:companyId}}));  
    if(err) TE(err.message);
    if(!user) TE('Something went wrong.');      
    return user;
}
module.exports.getDirectorsCountByID = getDirectorsCountByID;


const getlistofAllAdminIds = async function(companyId){//returns token 
    let err,admins;  
    [err, admins] = await to(CompanyAdmin.findAll({where:{company_id:companyId}}));  
    if(err) TE(err.message);
    if(!admins) TE('Something went wrong.');   
    let user = [];
    for(let i in admins){
        user.push(admins[i].user_id);
    }    
    return user;
}
module.exports.getlistofAllAdminIds = getlistofAllAdminIds;

const getlistofAllDirectorsIds = async function(companyId){//returns token 
    let err,directors;  
    [err, directors] = await to(CompanyDirector.findAll({where:{company_id:companyId}}));  
    if(err) TE(err.message);
    if(!directors) TE('Something went wrong.');  
    let user = [];
    for(let i in directors){
        user.push(directors[i].user_id);
    }      
    return user;
}
module.exports.getlistofAllDirectorsIds = getlistofAllDirectorsIds;

const removeAllAdminOfAssCompany = async function(companyId){//returns token 
    let err,admin;  
    [err, admin] = await to(CompanyAdmin.destroy({where:{company_id:companyId}}));  
    if(err) TE(err.message); 
    return true;
}
module.exports.removeAllAdminOfAssCompany = removeAllAdminOfAssCompany;

const removeAllDirectorsOfAssCompany = async function(companyId){//returns token 
    let err,directors;  
    [err, directors] = await to(CompanyDirector.destroy({where:{company_id:companyId}}));  
    if(err) TE(err.message); 
    return true;
}
module.exports.removeAllDirectorsOfAssCompany = removeAllDirectorsOfAssCompany;

const countAllDeeds = async function(status){//returns token 
    let err,deeds;
    if(status > 0){
        [err, deeds] = await to(Deeds.findAndCountAll({where:{status:status}})); 
    } else {
        [err, deeds] = await to(Deeds.findAndCountAll()); 
    }
    if(err) TE(err.message); 
    return deeds;
}
module.exports.countAllDeeds = countAllDeeds;

const countMyDeeds = async function(userId,status){//returns token 
    let err,deeds; 
    if(status > 0){
        [err, deeds] = await to(Deeds.findAndCountAll({where:{created_by:userId,status:status}})); 
    } else {
        [err, deeds] = await to(Deeds.findAndCountAll({where:{created_by:userId}})); 
    } 
    if(err) TE(err.message); 
    return deeds;
}
module.exports.countMyDeeds = countMyDeeds;

const getTermDetailsById = async function(userId,versionId){//returns token 
    let err, term,termsections,termsubsections,termsubsubsections,termData = null;  
    [err, term] = await to(Terms.findOne({where : {created_by : userId,version:versionId,status:1 }})); 
    let term_json = [];
    let term_info = {"termsections":[{"termsubsections":[{"termsubsubsections":[]}]}]}; 
    if(term != null){
        termData = term.toWeb();
        [err, termsections] = await to(TermAndClauseSection.findAll({where:{parent_id:term.toWeb().id,type:1,level:'section'},order: [['ordering', 'ASC']]}));
        term_info.termsections.pop();
        let checkLength = termsections.length; 
        if(checkLength > 0){
            for( let i in termsections){
                let section = termsections[i];  
                let section_info = section.toWeb();
                let tempSection ={"termsection":section_info,"termsubsections":[]} ;
                [err, termsubsections] = await to(TermAndClauseSection.findAll({where:{parent_id:section_info.id,type:1,level:'subsection'},order: [['ordering', 'ASC']]}));  
                    let checkSubLength = termsubsections.length;
                    if(checkSubLength > 0){
                        for( let p in termsubsections){ 
                            let termsubsection = termsubsections[p];  
                            let subsection_info = termsubsection.toWeb();
                            let tempsubsection={"termsubsection":subsection_info,"termsubsubsection":[]} ;
                            [err, termsubsubsections] = await to(TermAndClauseSection.findAll({where:{parent_id:subsection_info.id,type:1,level:'subsubsection'},order: [['ordering', 'ASC']]}));
                            tempsubsection.termsubsubsection = termsubsubsections ;
                            tempSection.termsubsections.push(tempsubsection);
                        }
                    } 
                    term_info.termsections.push(tempSection)
            } 
        }
    }
    
    let returnObj = {};
    returnObj.term = termData
    returnObj.term_info = term_info;
    return returnObj;
}
module.exports.getTermDetailsById = getTermDetailsById;

const getClauseDetailsById = async function(userId,versionId){ 

    let err, clauses,sections,subsections,subsubsections,clauseData = null;  
    [err, clauses] = await to(Clauses.findOne({where : {created_by : userId,version:versionId,status:1 }}));
    if (err) return ReE(res, err, 422);
    let clauses_json = [];
    let clauses_info = {"sections":[{"subsections":[{"subsubsections":[]}]}]};
    if(clauses != null){
        clauseData = clauses.toWeb();
        [err, sections] = await to(TermAndClauseSection.findAll({where:{parent_id:clauses.toWeb().id,type:2,level:'section'},order: [['ordering', 'ASC']]}));
        clauses_info.sections.pop();
        let checkLength = sections.length; 
        if(checkLength > 0){
            for( let i in sections){
                let section = sections[i];  
                let section_info = section.toWeb();
                let tempSection ={"section":section_info,"subsections":[]} ;
                [err, subsections] = await to(TermAndClauseSection.findAll({where:{parent_id:section_info.id,type:2,level:'subsection'},order: [['ordering', 'ASC']]}));                
                    let checkSubLength = subsections.length;
                    if(checkSubLength > 0){
                        for( let p in subsections){ 
                            let subsection = subsections[p];  
                            let subsection_info = subsection.toWeb();
                            let tempsubsection={"subsection":subsection_info,"subsubsection":[]} ;
                            [err, subsubsections] = await to(TermAndClauseSection.findAll({where:{parent_id:subsection_info.id,type:2,level:'subsubsection'},order: [['ordering', 'ASC']]}));
                            tempsubsection.subsubsection = subsubsections ;
                            tempSection.subsections.push(tempsubsection);
                        }
                    } 
                clauses_info.sections.push(tempSection)
            } 
        }
    } 
    
    let returnObj = {};
    returnObj.clauses = clauseData;
    returnObj.clauses_info = clauses_info;
    return returnObj;
}
module.exports.getClauseDetailsById = getClauseDetailsById;


const getSpecialClauseDetailsById = async function(id){ 

    let err, clauses,sections,subsections,subsubsections,clauseData = null;  
    [err, clauses] = await to(Clauses.findOne({where : {id : id }}));
    if (err) return ReE(res, err, 422);
    let clauses_json = [];
    let clauses_info = {"sections":[{"subsections":[{"subsubsections":[]}]}]};
    if(clauses != null){
        clauseData = clauses.toWeb();
        [err, sections] = await to(TermAndClauseSection.findAll({where:{parent_id:clauses.toWeb().id,type:2,level:'section'},order: [['ordering', 'ASC']]}));
        clauses_info.sections.pop();
        let checkLength = sections.length; 
        if(checkLength > 0){
            for( let i in sections){
                let section = sections[i];  
                let section_info = section.toWeb();
                let tempSection ={"section":section_info,"subsections":[]} ;
                [err, subsections] = await to(TermAndClauseSection.findAll({where:{parent_id:section_info.id,type:2,level:'subsection'},order: [['ordering', 'ASC']]}));                
                    let checkSubLength = subsections.length;
                    if(checkSubLength > 0){
                        for( let p in subsections){ 
                            let subsection = subsections[p];  
                            let subsection_info = subsection.toWeb();
                            let tempsubsection={"subsection":subsection_info,"subsubsection":[]} ;
                            [err, subsubsections] = await to(TermAndClauseSection.findAll({where:{parent_id:subsection_info.id,type:2,level:'subsubsection'},order: [['ordering', 'ASC']]}));
                            tempsubsection.subsubsection = subsubsections ;
                            tempSection.subsections.push(tempsubsection);
                        }
                    } 
                clauses_info.sections.push(tempSection)
            } 
        }
    }    
    let returnObj = {};
    returnObj.clauses = clauseData;
    returnObj.clauses_info = clauses_info;
    return returnObj;
}
module.exports.getSpecialClauseDetailsById = getSpecialClauseDetailsById;

const getMinuteStatus = async function(id){ 

    let err,minuteTemplate;  
    [err, minuteTemplate] = await to(MinuteTemplate.findOne({where:{id:id}}));  
    if(err) TE(err.message);
    return minuteTemplate;
}
module.exports.getMinuteStatus = getMinuteStatus;


const countAllFeatures = async function(){
    let err,features;
    console.log("=================");
    [err, features] = await to(FeatureUpdate.findAndCountAll()); 
    console.log("=================",features);
    if(err) TE(err.message);
    if(!features) TE('Something went wrong.');  
    return features;
}
module.exports.countAllFeatures = countAllFeatures;

