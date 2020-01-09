const { Deeds,Deedusers,Clauses,Deedhistory,Terms,DeedNotes,DeedAttachments,DeedUpdate,DeedUpdateAck } = require('../models');
const userService   = require("../services/user.service");
const { to, ReE, ReS, emailUtil } = require('../services/util.service');
const Sequelize     = require('sequelize');
const Op            = Sequelize.Op 
const PDFService 	= require('./pdf.controller');

const getListOfAllDeeds = async function(req, res){ 

    let user = req.user; 
    if(user.user_type == 1){

        /* Code for Pagination */
        let limit = 10;   // number of records per page
        let offset = 0;        
        let countallUsers = await userService.countAllDeeds(req.body.status); 
        let page = req.body.page;      // page number
        let order_by = req.body.order_by;  
        let order_by_ASC_DESC = req.body.order_by_ASC_DESC;
        let totalCount = countallUsers.count;
        let pages = Math.ceil(totalCount / limit);
        offset = limit * (page - 1); 
        let query = req.body.q; 
        /* End code for Pagination */

        let user = req.user; 
        let err, deeds;

        [err, isActiveCount]    = await to(Deeds.findAndCountAll({where:{status:1}}));
        [err, isReviewCount]    = await to(Deeds.findAndCountAll({where:{status:2}}));
        [err, isDraftCount]     = await to(Deeds.findAndCountAll({where:{status:3}}));  

        let whereObj = {}; 

        if(query.trim() != "") {
            whereObj.trust_name = { [Op.like]: '%'+query.trim()+'%' };
        } 
        if(req.body.status > 0) {
            whereObj.status = req.body.status;
        }   
        [err, deeds] = await to(Deeds.findAll({
            where : whereObj, 
            limit: limit,
            offset: offset,
            order: [[order_by, order_by_ASC_DESC]]
        }));  

        if(query.trim() != "") { 
            pages = (deeds.length > 0) ?  Math.ceil(deeds.length / limit) : 1;
            totalCount = (deeds.length > 0) ? deeds.length : 1;
        }
 
        if(err){return ReE(res, err);}
        //let is_active = 0;
        //let is_draft = 0;
        //let is_review = 0;
        let deedUsersArr = []; 
        for( let i in deeds){       
            let deeduser = deeds[i]; 
            //(deeduser.toWeb().status == 1){ is_active = parseInt(is_active + 1); }
            //if(deeduser.toWeb().status == 3){ is_draft = parseInt(is_draft + 1); }
            //if(deeduser.toWeb().status == 2){ is_review = parseInt(is_review + 1); }
            let userDetailsObj = deeduser.toWeb(); 
            let userDetails = await userService.getUserById(deeduser.toWeb().updated_by);  
            userDetailsObj.updated_by_user_detail = userDetails; 
            let countStackholders = await userService.getcountStackholdersOfDeed(deeduser.toWeb().id);  
            let countStackholdersAck = await userService.getcountStackholdersOfDeedAck(deeduser.toWeb().id);  
            userDetailsObj.countStackholders = countStackholders.count; 
            userDetailsObj.countStackholdersAck = countStackholdersAck.count; 
            deedUsersArr.push(userDetailsObj); 
        }
        return ReS(res, {deeds:deedUsersArr,is_active:isActiveCount.count,is_review:isReviewCount.count,is_draft:isDraftCount.count,'count': totalCount, 'pages': pages}); 
    } else {
        return ReE(res, "Only Admin can see all list of terms");
    }    
}
module.exports.getListOfAllDeeds = getListOfAllDeeds; 

const getListOfDeeds = async function(req, res){ 
    let user = req.user; 
    
    /* Code for Pagination */
    let limit = 10;   // number of records per page
    let offset = 0;
    let countallUsers = await userService.countMyDeeds(user.id,req.body.status); 
    let page = req.body.page;      // page number
    let order_by = req.body.order_by;  
    let order_by_ASC_DESC = req.body.order_by_ASC_DESC;
    let totalCount = countallUsers.count;
    let pages = Math.ceil(totalCount / limit);
    offset = limit * (page - 1); 
    let query = req.body.q; 
    /* End code for Pagination */

    let err, deeds; 
    [err, isActiveCount]    = await to(Deeds.findAndCountAll({where:{created_by:user.id,status:1}}));
    [err, isReviewCount]    = await to(Deeds.findAndCountAll({where:{created_by:user.id,status:2}}));
    [err, isDraftCount]     = await to(Deeds.findAndCountAll({where:{created_by:user.id,status:3}}));  

    let whereObj = {};
    whereObj.created_by = user.id;

    if(query.trim() != "") {
        whereObj.trust_name = { [Op.like]: '%'+query.trim()+'%' };
    } 
    if(req.body.status > 0) {
        whereObj.status = req.body.status;
    }  
    
    [err, deeds] = await to(Deeds.findAll({
        where : whereObj,
        limit: limit,
        offset: offset,
        order: [[order_by, order_by_ASC_DESC]]
    }));
    
    if(query.trim() != "") {
        pages = (deeds.length > 0) ?  Math.ceil(deeds.length / limit) : 1;
        totalCount = (deeds.length > 0) ? deeds.length : 1;
    }
     
    if(err){return ReE(res, err);}
    //let is_active = 0;
    //let is_draft = 0;
    //let is_review = 0;
    let deedUsersArr = []; 
    for( let i in deeds){
        let deeduser = deeds[i];
        let userDetailsObj = deeduser.toWeb(); 
        //if(deeduser.toWeb().status == 1){ is_active = parseInt(is_active + 1); }
        //if(deeduser.toWeb().status == 3){ is_draft = parseInt(is_draft + 1); }
        //if(deeduser.toWeb().status == 2){ is_review = parseInt(is_review + 1); }
        let userDetails = await userService.getUserById(deeduser.toWeb().updated_by);  
        userDetailsObj.updated_by_user_detail = userDetails; 
        let countStackholders = await userService.getcountStackholdersOfDeed(deeduser.toWeb().id);  
        let countStackholdersAck = await userService.getcountStackholdersOfDeedAck(deeduser.toWeb().id); 
        userDetailsObj.countStackholders = countStackholders.count;  
        userDetailsObj.countStackholdersAck = countStackholdersAck.count; 
        deedUsersArr.push(userDetailsObj); 
    }
    return ReS(res, {deeds:deedUsersArr,is_active:isActiveCount.count,is_review:isReviewCount.count,is_draft:isDraftCount.count,'count': totalCount, 'pages': pages});
}
module.exports.getListOfDeeds = getListOfDeeds; 

const createDeed = async function(req, res){ 

    let err, deed,deeduser;
    let user = req.user;  

    let deed_info = req.body.deed; 
    deed_info.created_by = user.id;  
    deed_info.updated_by = user.id;  
    
    [err, deed] = await to(Deeds.create(deed_info));    
    if(err) return ReE(res, err, 422);  
    [err, deed] = await to(deed.save()); 
    if(err) return ReE(res, err, 422); 
    let deed_json = deed.toWeb(); 

    let listOfAllUsers = deed_info.user;
    let listOfAllTrusteeUsers       = listOfAllUsers.trustee; 
    let listOfAllSettlorUsers       = listOfAllUsers.settlor;
    let listOfAllGuardianUsers      = listOfAllUsers.guardian;
    let listOfAllBeneficiaryUsers   = listOfAllUsers.beneficiary;
    let listOfAllAppointerUsers     = listOfAllUsers.appointer; 
    let listOfAllAlterAppointerUsers     = listOfAllUsers.alternative_appointer; 
    await userService.addUserDataOnDeedUsers(listOfAllTrusteeUsers,deed_json.id,'1',deed_info.trust_name); // For Trustee;
    await userService.addUserDataOnDeedUsers(listOfAllSettlorUsers,deed_json.id,'2',deed_info.trust_name); // For Settlor;
    await userService.addUserDataOnDeedUsers(listOfAllGuardianUsers,deed_json.id,'4',deed_info.trust_name); // For Guardian;
    await userService.addUserDataOnDeedUsers(listOfAllBeneficiaryUsers,deed_json.id,'5',deed_info.trust_name); // For Beneficiary;
    await userService.addUserDataOnDeedUsers(listOfAllAppointerUsers,deed_json.id,'3',deed_info.trust_name); // For Appointer;
    await userService.addUserDataOnDeedUsers(listOfAllAlterAppointerUsers,deed_json.id,'6',deed_info.trust_name); // For Alternative Appointer;
    await PDFService.generatepdf(deed_json.id);
    return ReS(res, {deed:deed.toWeb()}, 201);
}
module.exports.createDeed = createDeed; 

const getRefNumber = async function(req, res){ 
    let err, deed;
    [err, deed] = await to(Deeds.findAndCountAll());  
    if(deed.count.toString().length == 1){deed = '000'+parseInt(deed.count+1)}
    else if(deed.count.toString().length == 2) {deed = '00'+parseInt(deed.count+1)} 
    else if(deed.count.toString().length == 3) {deed = '0'+parseInt(deed.count+1)}  
    else {deed = parseInt(deed.count+1)}
    return ReS(res, {deed:deed}, 201); 
} 
module.exports.getRefNumber = getRefNumber;

const getDeedDetails = async function(req, res){ 

    let err, deed, deedusers,clause,approve,deedhistory;
    [err, deed] = await to(Deeds.findById(req.body.deed_id));
    if (err) {return ReE(res, err);}   
    if(deed != null){
        let createdBy = await userService.getUserById(deed.toWeb().created_by);  

        [err, deedusers] = await to(Deedusers.findAll({where:{deed_id:req.body.deed_id}}));
        if (err) {return ReE(res, err);}

        [err, approve] = await to(Deedusers.findOne({where:{deed_id:req.body.deed_id,user_id:req.user.id}}));
        if (err) {return ReE(res, err);}
  
        [err, deedhistory] = await to(Deedhistory.findAll({where:{deed_id:req.body.deed_id}}));
        if (err) {return ReE(res, err);}

        [err, deedattachmentlist] = await to(DeedAttachments.findAll({where:{deed_id:req.body.deed_id}})); 
        if(err) return ReE(res, err, 422); 

        let deedUsersArr = [];
        for( let i in deedusers){
            let deeduser = deedusers[i];
            let userDetailsObj = {};
            let userDetails = await userService.getUserById(deeduser.toWeb().user_id);         
            userDetailsObj.user_type = deeduser.toWeb().user_type;
            userDetailsObj.deeduser_tableid = deeduser.toWeb().id;
            userDetailsObj.acknowledgement  = deeduser.toWeb().acknowledgement;  
            userDetailsObj.user_detail = userDetails;        
            deedUsersArr.push(userDetailsObj); 
        }

        let deedHistorysArr = [];
        let listofHistorysUsers = [];
        let listofHistoryscheck = [];
        if(deedhistory != null){           
            for( let i in deedhistory){
                let deedhis = deedhistory[i];
                let userhistoryObj = {};
                let userDetails = await userService.getUserById(deedhis.toWeb().updated_by);  
                if(deedhis.toWeb().minute_id > 0){
                    let minuteStatus = await userService.getMinuteStatus(deedhis.toWeb().minute_id);
                    userhistoryObj.minutedetails = minuteStatus; 
                }

                if(userDetails != null){
                    if(listofHistoryscheck.indexOf(userDetails.id) == -1){
                        listofHistoryscheck.push(userDetails.id);
                        listofHistorysUsers.push(userDetails);
                    }
                }    
                userhistoryObj.historyData = deedhis.toWeb();
                userhistoryObj.historyCreated = userDetails; 
                deedHistorysArr.push(userhistoryObj); 
            }
        }    
        // await PDFService.generatepdf(req.body.deed_id);   
        return ReS(res, { deed: deed.toWeb(),createdBy:createdBy,deedUserDetails:deedUsersArr,is_approve:approve,history:deedHistorysArr,listofHistorysUsers:listofHistorysUsers,deedattachmentlist:deedattachmentlist }); 
    } else {
        return ReE(res, "Unable to found requested deed.");
    }
       
}
module.exports.getDeedDetails = getDeedDetails;

const updateDeed = async function(req, res){

    let err, deed, data; 
    data = req.body.deed;  
    [err, deed] = await to(Deeds.findById(data.id));
    if (err) return ReE(res, err, 422); 
    data.updated_by = req.user.id;

    if(deed.toWeb().status == 2 || deed.toWeb().status == 1){
        data.status = 2;
    }
    deed.set(data);
    [err, deed] = await to(deed.save());
    if (err) { return ReE(res, err);}
    if(data.history.length > 0){

        let deedUserObj = {};
        deedUserObj.deed_id = data.id;
        [err, deedupdate] = await to(DeedUpdate.create(deedUserObj)); 
        [err, deedupdate] = await to(deedupdate.save());

        await userService.addUserHistoryOnDeedUsers(data.history,deedupdate.toWeb().id); // For Trustee;
    }

    let listOfAllTrusteeUsers       = data.user.trustee;
    let listOfAllSettlorUsers       = data.user.settlor;
    let listOfAllGuardianUsers      = data.user.guardian;
    let listOfAllBeneficiaryUsers   = data.user.beneficiary;
    let listOfAllAppointerUsers     = data.user.appointer; 
    let listOfAllAlterAppointerUsers     = data.user.alternative_appointer; 
    await userService.updateUserDataOnDeedUsers(listOfAllTrusteeUsers,data.id,'1'); // For Trustee;
    await userService.updateUserDataOnDeedUsers(listOfAllSettlorUsers,data.id,'2'); // For Settlor;
    await userService.updateUserDataOnDeedUsers(listOfAllGuardianUsers,data.id,'4'); // For Guardian;
    await userService.updateUserDataOnDeedUsers(listOfAllBeneficiaryUsers,data.id,'5'); // For Beneficiary;
    await userService.updateUserDataOnDeedUsers(listOfAllAppointerUsers,data.id,'3'); // For Appointer;
    await userService.updateUserDataOnDeedUsers(listOfAllAlterAppointerUsers,data.id,'6'); // For Alternative Appointer;
    // await userService.removeUserDataOnDeedUsers(data.delete,data.id); // For Appointer;
    await PDFService.generatepdf(data.id);
    return ReS(res, { message: "Deed is successfully updated "});

}
module.exports.updateDeed = updateDeed;

const sendRemiderForDeed = async function(req, res){ 
    let err, deed;  
    [err, deed] = await to(Deeds.findById(req.body.id ));  
    if (err) return ReE(res, err, 422);   
    let userDetails = await userService.getUserById(req.body.user_id); 

    let emailBody = '<table width="100%">';
    emailBody += "<tr>";
    emailBody +="<td>Hello " + userDetails.toWeb().first_name + " " + userDetails.toWeb().last_name + "</td>";
    emailBody += "</tr>";
    emailBody += "<tr>";
    emailBody += "<td>Deed Provider send you a reminder message for deed <b>"+deed.toWeb().trust_name+"</b>.</td>";
    emailBody += "</tr>";
    emailBody += "</table>";
    emailUtil(userDetails.toWeb().email, emailBody, "Deed provider reminder.", req, res);
    return ReS(res,  { message: "Reminder sent successfully."}); 
}
module.exports.sendRemiderForDeed = sendRemiderForDeed;

const changeStatusOfDeed = async function(req, res){ 
    let err, deed; 
    [err, deed] = await to(Deeds.findById(req.body.id));
    let deedname = deed.toWeb().trust_name;
    if (err) return ReE(res, err, 422);
    deed.set({status:1});
    [err, deed] = await to(deed.save());
    if (err) return ReE(res, err, 422);
    await userService.getAllDeedUserById(req.body.id,deedname,'changestatus'); // Send mail to all stackholders
    await PDFService.generatepdf(req.body.id);
    return ReS(res, { message: "Deed successfully active "}); 
}
module.exports.changeStatusOfDeed = changeStatusOfDeed;

const sendApprovalReminder = async function(req, res){ 
    let err, deed,deedusers; 
    [err, deed] = await to(Deeds.findById(req.body.id));
    if (err) return ReE(res, err, 422);
    let deedname = deed.toWeb().trust_name;
    await userService.getAllDeedUserById(req.body.id,deedname,'sendapproval'); // Send mail to all stackholders
    [err, deedusers] = await to(Deedusers.update({ acknowledgement:0,is_approve:0 },{ where: {deed_id: req.body.id}}));
    [err, deedupdate] = await to(Deeds.update({ status:2 },{ where: {id: req.body.id}}));
    if (err) return ReE(res, err, 422); 
    return ReS(res, { message: "Deed approval reminder"}); 
}
module.exports.sendApprovalReminder = sendApprovalReminder;

const listOfAcknowledgementUsersOfDeed = async function(req, res){ 
    let err, deedusers; 
    let user = req.user;  

    [err, deedusers] = await to(Deedusers.findAll({where:{deed_id:req.body.id}}));
    if (err) {return ReE(res, err);}

    let deedUsersArr = [];
    for( let i in deedusers){
        let deeduser = deedusers[i];
        let userDetailsObj = {};
        let userDetails = await userService.getUserById(deeduser.toWeb().user_id); 
        userDetailsObj.user_type = deeduser.toWeb().user_type;
        userDetailsObj.user_detail = userDetails;
        userDetailsObj.acknowledgement = deeduser.toWeb().acknowledgement;
        userDetailsObj.acknowledgement_time = deeduser.toWeb().updatedAt;
        deedUsersArr.push(userDetailsObj); 
    }
    return ReS(res, { deedUserList:deedUsersArr });
}
module.exports.listOfAcknowledgementUsersOfDeed = listOfAcknowledgementUsersOfDeed;

const acknowledgementByStackholder = async function(req, res){ 
    let err, deeduser,deed; 
    let user = req.user;  
    [err, deeduser] = await to(Deedusers.update({acknowledgement:1},{ where : { deed_id : req.body.id , user_id : user.id }}));
    if (err) return ReE(res, err, 422);  
    [err, deed] = await to(Deeds.update({status:2},{ where : { id : req.body.id }})); // Review
    if (err) return ReE(res, err, 422);     
    return ReS(res, { message: "Deed acknowledgement successfull."}); 
}
module.exports.acknowledgementByStackholder = acknowledgementByStackholder;

const approvalByStackholder = async function(req, res){ 
    let err, deeduser; 
    let user = req.user;  
    [err, deeduser] = await to(Deedusers.update({is_approve:1},{ where : { deed_id : req.body.id , user_id : user.id }}));
    if (err) return ReE(res, err, 422);     
    return ReS(res, { message: "Deed acknowledgement successfully."}); 
}
module.exports.approvalByStackholder = approvalByStackholder;

const listOfAssignedDeeds = async function(req, res){ 
    
    let err, deedusers; 
    let user = req.user;
    //console.log(user);
    [err, deedusers] = await to(Deedusers.aggregate('deed_id', 'DISTINCT', {plain: false,where:{user_id:user.id}}));    
    //[err, deedusers] = await to(Deedusers.findAll({ where : { user_id : user.id }}));
    if (err) return ReE(res, err, 422);
    //console.log(deedusers);
    let deedDetailsArr = [];
    for( let i in deedusers){
        let deeduser = deedusers[i].DISTINCT; ;         
        let deedDetailsObj = {};
        let deedDetails = await userService.getDeedById(deeduser);

        //-- Stack holders
        if (req.body.user_type == 4) {
            if (deedDetails.status == 2)
            {
                let countStackholders = await userService.getcountStackholdersOfDeed(deeduser);
                deedDetailsObj.deed_details = deedDetails;
                deedDetailsObj.created_by = (deedDetails != null) ? await userService.getUserById(deedDetails.created_by) : null;
                deedDetailsObj.countStackholders = countStackholders.count;

                deedDetailsArr.push(deedDetailsObj);
            }
        }else {
            let countStackholders = await userService.getcountStackholdersOfDeed(deeduser);
            deedDetailsObj.deed_details = deedDetails;
            deedDetailsObj.created_by = (deedDetails != null) ? await userService.getUserById(deedDetails.created_by) : null;
            deedDetailsObj.countStackholders = countStackholders.count;

            deedDetailsArr.push(deedDetailsObj);
        }
    }
    return ReS(res, { assignedDeedList:deedDetailsArr });     
}
module.exports.listOfAssignedDeeds = listOfAssignedDeeds;

const getSingleHistoryData = async function(req, res){ 
    
    let err, deedhistory; 
    let user = req.user;  
    [err, deedhistory] = await to(Deedhistory.findById(req.body.id));
    if (err) return ReE(res, err, 422);

    let userhistoryObj = deedhistory.toWeb();
    let userDetails = await userService.getUserById(deedhistory.toWeb().updated_by); 
    userhistoryObj.historyCreated = userDetails;   
    return ReS(res, { userhistory:userhistoryObj });     
}
module.exports.getSingleHistoryData = getSingleHistoryData;

const listOfMyUpdatedDeedsForStackHolder = async function(req, res){ 
    
    let err, deedusers; 
    let user = req.user;  

    /* Code for Pagination */
    let limit = 10;   // number of records per page
    let offset = 0;
    let countallUsers = 0 ;
    [err, deedusers] = await to(Deedusers.aggregate('deed_id', 'DISTINCT', {plain: false,where:{user_id:user.id}}));      
    let page = req.body.page;      // page number
    let order_by = req.body.order_by;  
    let order_by_ASC_DESC = req.body.order_by_ASC_DESC;
    let totalCount = deedusers.length;
    let pages = Math.ceil(totalCount / limit);
    offset = limit * (page - 1); 
    let query = req.body.q; 
    /* End code for Pagination */

    [err, deedusers] = await to(Deedusers.aggregate('deed_id', 'DISTINCT', {
        plain: false,
        where:{user_id:user.id},
        limit: limit,
        offset: offset,
        order: [[order_by, order_by_ASC_DESC]]
    }));    
    if (err) return ReE(res, err, 422);
    let deedUsersArr = [];
    let companiesReturn =[] ; 
    let finalResponse =[] ;
    for( let i in deedusers){
        let deeduser = deedusers[i].DISTINCT;
        [err, deedhistory] = await to(Deedhistory.findOne({where:{deed_id:deeduser}}));  
        if(deedhistory != null){            
            let deedDetails = await userService.getDeedById(deeduser);
            let userDetails = await userService.getUserById(deedDetails.updated_by); 
            let userDetailsObj = deedDetails;
            userDetailsObj.updated_by_user_detail = userDetails; 
            let countStackholders = await userService.getcountStackholdersOfDeed(deeduser);  
            let countStackholdersAck = await userService.getcountStackholdersOfDeedAck(deeduser); 
            userDetailsObj.countStackholders = countStackholders.count;  
            userDetailsObj.countStackholdersAck = countStackholdersAck.count; 
            deedUsersArr.push(userDetailsObj); 
        }

        let countallCompanies = deedUsersArr.length; 
        totalCount = countallCompanies;
        pages = Math.ceil(totalCount / limit); 
         
        for(let i = page*limit-limit;i<page*limit;i++){ 
            if(deedUsersArr[i])
            companiesReturn.push(deedUsersArr[i]) ;
        }  
        for(var k in companiesReturn){
            [err, deedupdates] = await to(DeedUpdate.findAll({ 
                where:{ deed_id:companiesReturn[k].id} 
            }));  
            for(var j in deedupdates){
                finalResponse.push({"deed_update":deedupdates[j].toWeb(),"deed_details":companiesReturn[k]})
            }
            
        }

    }
    return ReS(res, { historyData:deedUsersArr });  
}
module.exports.listOfMyUpdatedDeedsForStackHolder = listOfMyUpdatedDeedsForStackHolder;

const listOfMyUpdatedDeeds = async function(req, res){ 
    
    let user = req.user; 
    /* Code for Pagination */
    let limit = 10;   // number of records per page
    let offset = 0;
    let countallUsers = 0 ;
    if(user.user_type == 1){
        countallUsers = await Deeds.findAndCountAll(); 
    } else {
        countallUsers = await Deeds.findAndCountAll({where:{created_by :  req.body.id }}); 
    }     
    let page = req.body.page;      // page number
    let order_by = req.body.order_by;  
    let order_by_ASC_DESC = req.body.order_by_ASC_DESC;
    let totalCount = countallUsers.count;
    let pages = Math.ceil(totalCount / limit);
    offset = limit * (page - 1); 
    let query = req.body.q; 
    /* End code for Pagination */
    let whereObj = {};    
    if(query.trim() != ""){
        whereObj.trust_name = {[Op.or] : {trust_name:{ [Op.like]: '%'+query.trim()+'%' }}};
    }
    if(user.user_type != 1){
        whereObj.created_by = req.body.id;
    }

    let err, deeds,deedupdate,deedupdates;  
    [err, deeds] = await to(Deeds.findAll({ 
        where:whereObj,
        limit: limit,
        offset: offset,
        order: [[order_by, order_by_ASC_DESC]]
    }));  

    if(err){return ReE(res, err);} 
    let deedUsersArr = []; 
    let companiesReturn =[] ; 
    let finalResponse =[] ;
    if(deeds.length > 0){
        for( let i in deeds){     
            let deeduser = deeds[i];
            let userDetailsObj = deeduser.toWeb(); 
            [err, deedupdate] = await to(DeedUpdate.findOne({where : { deed_id : deeduser.toWeb().id }}));    
            if(deedupdate != null){ 
                let userDetails = await userService.getUserById(deeduser.toWeb().updated_by);  
                userDetailsObj.updated_by_user_detail = userDetails; 
                let countStackholders = await userService.getcountStackholdersOfDeed(deeduser.toWeb().id);  
                let countStackholdersAck = await userService.getcountStackholdersOfDeedAck(deeduser.toWeb().id); 
                userDetailsObj.countStackholders = countStackholders.count;  
                userDetailsObj.countStackholdersAck = countStackholdersAck.count; 
                deedUsersArr.push(userDetailsObj); 
            }
        }
        let countallCompanies = deedUsersArr.length; 
        totalCount = countallCompanies;
        pages = Math.ceil(totalCount / limit); 
         
        for(let i = page*limit-limit;i<page*limit;i++){ 
            if(deedUsersArr[i])
            companiesReturn.push(deedUsersArr[i]) ;
        }  
        for(var k in companiesReturn){
            [err, deedupdates] = await to(DeedUpdate.findAll({ 
                where:{ deed_id:companiesReturn[k].id} 
            }));  
            for(var i in deedupdates){
                finalResponse.push({"deed_update":deedupdates[i].toWeb(),"deed_details":companiesReturn[k]})
            }
            
        }   
    }
    
    return ReS(res, {historyData:finalResponse,'count': totalCount, 'pages': pages});
}
module.exports.listOfMyUpdatedDeeds = listOfMyUpdatedDeeds;

const listOfMyChangesInDeeds = async function(req, res){     

    let err, deedhistory; 
    let user = req.user;  
    if(user.user_type != 1){
        let deed_info = {}; 
        deed_info.deed_update_id = req.body.id;
        deed_info.stackholder_id = user.id; 
        [err, deedupdateAck] = await to(DeedUpdateAck.create(deed_info));
        [err, deedupdateAck] = await to(deedupdateAck.save());
    } 
    [err, deedhistory] = await to(Deedhistory.findAll({where : { deed_update_id:req.body.id }}));
    if (err) return ReE(res, err, 422);      
    return ReS(res, { historyData:deedhistory });  
}
module.exports.listOfMyChangesInDeeds = listOfMyChangesInDeeds;

const addDeedNote = async function(req, res){ 

    let err, deednote,deedhistory;
    let user = req.user;
    let deed_info       = req.body.deednote; 
    deed_info.deed_id   = deed_info.deed_id;
    deed_info.content   = deed_info.content;
    deed_info.title     = 'Added a note';
    deed_info.posted_by = user.id; 

    [err, deednote] = await to(DeedNotes.create(deed_info));    
    if(err) return ReE(res, err, 422);  
    [err, deednote] = await to(deednote.save());
    if(err) return ReE(res, err, 422); 

    let deedUserObj = {};
    deedUserObj.deed_id = deed_info.deed_id;
    deedUserObj.type = 'Added a note';
    deedUserObj.title = 'Added a note';
    deedUserObj.old = '--';
    deedUserObj.new = '--';
    deedUserObj.updated_by = user.id;

    deedUserObj.note = deed_info.content;
    [err, deedhistory] = await to(Deedhistory.create(deedUserObj)); 
    [err, deedhistory] = await to(deedhistory.save());
    return ReS(res, { deednote:deednote.toWeb() });      
}
module.exports.addDeedNote = addDeedNote;

const getDeedNote = async function(req, res){ 

    let err, deednotes;
    [err, deednotes] = await to(DeedNotes.findAll({where : { deed_id:req.body.deed_id }}));
    if(err) return ReE(res, err, 422);  
    let deednote_json = [];
    for(let i in deednotes){
        let deednote = deednotes[i];  
        let deednote_info = deednote.toWeb();
        let userData = await userService.getUserById(deednote_info.posted_by);
        if(userData != null){
            deednote_info.posted_user = userData.dataValues;   
            deednote_json.push(deednote_info);
        }       
    }  
    return ReS(res, { deednote:deednote_json });  
}
module.exports.getDeedNote = getDeedNote;

const getDeedDetailsForPDF = async function(req, res){ 

    let err, deed, deedusers,clause,approve,deedhistory,speicalclausedetails = null;
    let termDetails = null;
    let clausedetails = null;
    [err, deed] = await to(Deeds.findById(req.body.deed_id));
    if (err) {return ReE(res, err);}   
    if(deed != null){

        let createdBy = await userService.getUserById(deed.toWeb().created_by);  

        [err, deedusers] = await to(Deedusers.findAll({where:{deed_id:req.body.deed_id}}));
        if (err) {return ReE(res, err);}

        // [err, approve] = await to(Deedusers.findOne({where:{deed_id:req.body.deed_id,user_id:req.user.id}}));
        // if (err) {return ReE(res, err);}

        // [err, deedhistory] = await to(Deedhistory.findAll({where:{deed_id:req.body.deed_id}}));
        // if (err) {return ReE(res, err);}

        // [err, deednotes] = await to(DeedNotes.findAll({where : { deed_id:req.body.deed_id }}));
        // if(err) return ReE(res, err, 422);  
        if(deed.toWeb().term_version > 0){
            termDetails     = await userService.getTermDetailsById(deed.toWeb().created_by,deed.toWeb().term_version); 
        } 
        if(deed.toWeb().term_version > 0){
            clausedetails   = await userService.getClauseDetailsById(deed.toWeb().created_by,deed.toWeb().clause_version);
        }

        if(deed.toWeb().special_clause != null && deed.toWeb().special_clause > 0){
            speicalclausedetails   = await userService.getSpecialClauseDetailsById(deed.toWeb().special_clause);  
        }
        
        let deedUsersArr = [];
        for( let i in deedusers){
            let deeduser = deedusers[i];
            let userDetailsObj = {};
            let userDetails = await userService.getUserById(deeduser.toWeb().user_id);         
            userDetailsObj.user_type = deeduser.toWeb().user_type;
            userDetailsObj.deeduser_tableid = deeduser.toWeb().id;
            userDetailsObj.acknowledgement  = deeduser.toWeb().acknowledgement;  
            userDetailsObj.user_detail = userDetails;        
            deedUsersArr.push(userDetailsObj); 
        }

        // let deedHistorysArr = [];
        // if(deedhistory != null){           
        //     for( let i in deedhistory){
        //         let deedhis = deedhistory[i];
        //         let userhistoryObj = {};
        //         let userDetails = await userService.getUserById(deedhis.toWeb().updated_by);         
        //         userhistoryObj.historyData = deedhis.toWeb();
        //         userhistoryObj.historyCreated = userDetails; 
        //         deedHistorysArr.push(userhistoryObj); 
        //     }
        // }       
        return ReS(res, { 
            deed: deed.toWeb(),
            createdBy:createdBy,
            deedUserDetails:deedUsersArr,
            //is_approve:approve,
            //history:deedHistorysArr,
            //deednotes:deednotes, 
            termDetail:termDetails,
            clausedetail:clausedetails,
            speicalclausedetail:speicalclausedetails,
            attachment:null
        }); 
    } else {
        return ReE(res, "Unable to found requested deed.");
    }
}

module.exports.getDeedDetailsForPDF = getDeedDetailsForPDF;

const filterHistory = async function(req, res){ 

    let err, deedhistory,body; 
    let searchobj = {};
    searchobj.deed_id = req.body.deed_id;
    if(req.body.start_date != "" && req.body.start_date != null){
        searchobj.createdAt = { [Op.gte]: req.body.start_date};
    } 
    if(req.body.end_date != "" && req.body.end_date != null){
        searchobj.updatedAt = { [Op.lte]: req.body.end_date};
    }
    if(req.body.updated_by != "" && req.body.updated_by != null){
        searchobj.updated_by = req.body.updated_by; 
    }
    if(req.body.type != "" && req.body.type != null){
        searchobj.type = req.body.type; 
    } 
    [err, deedhistory] = await to(Deedhistory.findAll({where:searchobj}));
    if (err) {return ReE(res, err);} 

    let deedHistorysArr = [];
    if(deedhistory != null){           
        for( let i in deedhistory){
            let deedhis = deedhistory[i];
            let userhistoryObj = {};
            let userDetails = await userService.getUserById(deedhis.toWeb().updated_by);         
            userhistoryObj.historyData = deedhis.toWeb();
            userhistoryObj.historyCreated = userDetails; 
            deedHistorysArr.push(userhistoryObj); 
        }
    }       
    return ReS(res, { deedHistorysArr:deedHistorysArr });  
}
module.exports.filterHistory = filterHistory;

/*
const addDeedAttachment = async function(req, res){ 

    let err, deedattachment,deedhistory;
    let user = req.user;
    let deed_info       = req.body.attachment; 
    deed_info.deed_id   = deed_info.deed_id;
    deed_info.content   = deed_info.content;
    deed_info.posted_by = user.id; 

    [err, deednote] = await to(DeedNotes.create(deed_info));    
    if(err) return ReE(res, err, 422);  
    [err, deednote] = await to(deednote.save());
    if(err) return ReE(res, err, 422); 

    let deedUserObj = {};
    deedUserObj.deed_id = deed_info.deed_id;
    deedUserObj.type = 'Added a note';
    deedUserObj.old = '--';
    deedUserObj.new = '--';
    deedUserObj.updated_by = user.id;

    deedUserObj.note = deed_info.content;
    [err, deedhistory] = await to(Deedhistory.create(deedUserObj)); 
    [err, deedhistory] = await to(deedhistory.save());
    return ReS(res, { deednote:deednote.toWeb() });      
}*/

const uploadDeedAttachemnt = async function(req, res, next) {

    let err, deedattachment,di;
    let user = req.user;
    let deed_info           = {}; 
    deed_info.deed_id       = req.body.deed_id;
    deed_info.attachment    = req.files[0].filename;
    deed_info.name          = req.files[0].originalname;
    deed_info.posted_by     = user.id; 

    [err, deedattachment] = await to(DeedAttachments.create(deed_info));    
    if(err) return ReE(res, err, 422);  
    [err, deedattachment] = await to(deedattachment.save());
    if(err) return ReE(res, err, 422); 

    [err, deedattachmentlist] = await to(DeedAttachments.findAll({where:{deed_id:req.body.deed_id}})); 
    if(err) return ReE(res, err, 422); 

    return ReS(res, { message: "Upload attachment successfully.", deedattachment: deedattachmentlist });
};
module.exports.uploadDeedAttachemnt = uploadDeedAttachemnt;

const removeDeedAttachemnt = async function(req, res, next) {
    [err, deedattachmentlist] = await to(DeedAttachments.destroy({where:{id:req.body.id}})); 
    if(err) return ReE(res, err, 422); 
    return ReS(res, { message: "Attachment removed successfully."});
};
module.exports.removeDeedAttachemnt = removeDeedAttachemnt;