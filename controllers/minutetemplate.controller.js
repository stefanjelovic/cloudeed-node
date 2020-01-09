const { MinuteTemplate,MinuteSection,MinuteTable,DigitalSignatureUser,Deedhistory } = require('../models');
const PDFController 	          = require('../controllers/pdf.controller');
const userService = require("../services/user.service");
const { to, ReE, ReS, emailUtil } = require('../services/util.service');
const Sequelize = require('sequelize');
const Op = Sequelize.Op 

const getListOfAllTempaltes = async function(req, res){ 

    let user = req.user; 
    /* Code for Pagination */
    let limit = 10;   // number of records per page
    let offset = 0;
    let countallTemplates;
    if(user.user_type == 1){
        countallTemplates = await to(MinuteTemplate.findAndCountAll());         
    } else {
        countallTemplates = await to(MinuteTemplate.findAndCountAll({where:{created_by:user.id,type:1}})); 
    }   
    
    let page = req.body.page;      // page number
    let order_by = req.body.order_by;  
    let order_by_ASC_DESC = req.body.order_by_ASC_DESC;
    let totalCount = countallTemplates[1].count; 
    let pages = Math.ceil(totalCount / limit);
    offset = limit * (page - 1); 
    let query = req.body.q; 
    /* End code for Pagination */

    let err, minutetemplate; 
    if(user.user_type == 1){
        if(query.trim() != "") { 
            [err, minutetemplate] = await to(MinuteTemplate.findAll({
                where : {title:{ [Op.like]: '%'+query.trim()+'%' }}, 
                limit: limit,
                offset: offset,
                order: [[order_by, order_by_ASC_DESC]]
            }));  
            pages = (minutetemplate.length > 0) ?  Math.ceil(minutetemplate.length / limit) : 1;
            totalCount = (minutetemplate.length > 0) ? minutetemplate.length : 1;
        } else {
            [err, minutetemplate] = await to(MinuteTemplate.findAll({                 
                limit: limit,
                offset: offset,
                order: [[order_by, order_by_ASC_DESC]]
            }));
        }
    } else { 
        if(query.trim() != "") { 
            [err, minutetemplate] = await to(MinuteTemplate.findAll({
                where : {created_by:user.id,title:{ [Op.like]: '%'+query.trim()+'%' }}, 
                limit: limit,
                offset: offset,
                order: [[order_by, order_by_ASC_DESC]]
            }));  
            pages = (minutetemplate.length > 0) ?  Math.ceil(minutetemplate.length / limit) : 1;
            totalCount = (minutetemplate.length > 0) ? minutetemplate.length : 1;
        } else {
            [err, minutetemplate] = await to(MinuteTemplate.findAll({ 
                where : {created_by:user.id}, 
                limit: limit,
                offset: offset,
                order: [[order_by, order_by_ASC_DESC]]
            }));
        } 
    }
    if(err){return ReE(res, err);} 
    let MinUsersArr = []; 
    for( let i in minutetemplate){       
        let minutetemplateuser = minutetemplate[i];  
        let userDetailsObj = minutetemplateuser.toWeb(); 
        let userDetails = await userService.getUserById(minutetemplateuser.toWeb().created_by);  
        userDetailsObj.updated_by_user_detail = userDetails;  
        MinUsersArr.push(userDetailsObj); 
    }
    return ReS(res, {minuteTemplates:MinUsersArr,'count': totalCount, 'pages': pages});     
}
module.exports.getListOfAllTempaltes = getListOfAllTempaltes; 

const listOfallTemplatePopUp = async function(req, res){
    let user = req.user; 
    let err, minutetemplates; 
    [err, minutetemplates] = await to(MinuteTemplate.findAll({where : {created_by:user.id,status:1,type:1}}));
    return ReS(res, {minutetemplates:minutetemplates}); 
}
module.exports.listOfallTemplatePopUp = listOfallTemplatePopUp; 

const addMinuteTemplate = async function(req, res){ 
    let err, minutetemplate;
    let user = req.user;  
    let minutetemplate_info = req.body.minute; 
    [err, version] = await to(MinuteTemplate.max('version',{where : {'created_by': user.id,type:1}}));   
    minutetemplate_info.version = version != undefined ? parseInt(version) + 1 : 1; 
    minutetemplate_info.created_by = user.id;
    minutetemplate_info.updated_by = user.id; 
    [err, minutetemplate] = await to(MinuteTemplate.create(minutetemplate_info));
    if(err) return ReE(res, err, 422);
    [err, minutetemplate] = await to(minutetemplate.save());
    if(err) return ReE(res, err, 422);

    let minutetemplate_json = minutetemplate.toWeb();
    let tableData           = minutetemplate_info.table;
     for(let i in minutetemplate_info.sections){
        let minuteSectionObj = {};
        minuteSectionObj.minute_id  = minutetemplate_json.id;
        minuteSectionObj.parent_id  = 0;
        minuteSectionObj.order      = parseInt(i)+1;
        minuteSectionObj.level      = "HEADING";
        minuteSectionObj.content    = minutetemplate_info.sections[i].heading.content;
        [err, minutesection] = await to(MinuteSection.create(minuteSectionObj));
        [err, minutesection] = await to(minutesection.save());

            for(let j in minutetemplate_info.sections[i].paragraphs){
                let minuteSectionParaObj = {};
                minuteSectionParaObj.minute_id  = minutetemplate_json.id;
                minuteSectionParaObj.parent_id  = minutesection.toWeb().id;
                minuteSectionParaObj.order      = parseInt(j)+1;
                minuteSectionParaObj.level      = "PARAGRAPH";
                minuteSectionParaObj.content    = minutetemplate_info.sections[i].paragraphs[j].content;
                [err, minuteparasection] = await to(MinuteSection.create(minuteSectionParaObj));
                [err, minuteparasection] = await to(minuteparasection.save());
            }  
    }  

    if(tableData.table_row > 0 && tableData.table_column > 0){
        let minuteTableObj = {};
        minuteTableObj.minute_id      = minutetemplate_json.id;
        minuteTableObj.table_row      = tableData.table_row;
        minuteTableObj.table_title      = tableData.table_title;
        minuteTableObj.table_column   = tableData.table_column;
        minuteTableObj.content        = JSON.stringify(tableData.content);
        [err, minutetable] = await to(MinuteTable.create(minuteTableObj));
        if(err) return ReE(res, err, 422);
        [err, minutetable] = await to(minutetable.save());
        if(err) return ReE(res, err, 422);
    }

    for(let i in minutetemplate_info.users){
        let minuteUserObj = {};
        minuteUserObj.minute_id  = minutetemplate_json.id;
        minuteUserObj.user_id    = minutetemplate_info.users[i];
        [err, minuteuser] = await to(DigitalSignatureUser.create(minuteUserObj));
        if(err) return ReE(res, err, 422);
        [err, minuteuser] = await to(minuteuser.save());
        if(err) return ReE(res, err, 422);
    } 
    return ReS(res, {minuteTemplate:minutetemplate_json});     
}
module.exports.addMinuteTemplate = addMinuteTemplate; 

const getDetailMinuteTemplate = async function(req, res){ 

    let err, minutetemplate,minutesectionsheading,minutetable,minuteusers;
    [err, minutetemplate] = await to(MinuteTemplate.findOne({where: {id:req.body.minute_id}}));
    if(err) return ReE(res, err, 422); 

    if(minutetemplate != null){

        let minutetemplateObj = minutetemplate.toWeb();
        [err, minutesectionsheading] = await to(MinuteSection.findAll({where: {minute_id:req.body.minute_id,level:'HEADING'},order: [['order', 'ASC']]}));
        if(err) return ReE(res, err, 422); 

        let sectionDataArr = [];
        for(let i in minutesectionsheading){        
            let sectionObj = {}; 
            sectionObj.heading = minutesectionsheading[i].toWeb();        
            [err, minutesectionspara] = await to(MinuteSection.findAll({where: {parent_id:sectionObj.heading.id,level:'PARAGRAPH'},order: [['order', 'ASC']]}));
            sectionObj.paragraphs = minutesectionspara;
            sectionDataArr.push(sectionObj)  
        }
        minutetemplateObj.sections = sectionDataArr;

        [err, minutetable] = await to(MinuteTable.findOne({where: {minute_id:req.body.minute_id}}));
        if(err) return ReE(res, err, 422);
        let tableDataObj = {};
        if(minutetable != null){
            tableDataObj.table_row = minutetable.toWeb().table_row;
            tableDataObj.table_column = minutetable.toWeb().table_column;
            tableDataObj.table_title = minutetable.toWeb().table_title;
            tableDataObj.content = JSON.parse(minutetable.toWeb().content);
        } else {
            tableDataObj.table_row = 0;
            tableDataObj.table_column = 0;
            tableDataObj.table_title = "Table 1";
            
            tableDataObj.content = {"rows" : [],"headers" : []};
        }
        minutetemplateObj.table = tableDataObj;

        [err, minuteusers] = await to(DigitalSignatureUser.findAll({where: {minute_id:req.body.minute_id}}));
        if(err) return ReE(res, err, 422);
        let selectedUSers=[] ; 
        for(var i in minuteusers){
            selectedUSers.push(minuteusers[i].user_id) ;
        }
        minutetemplateObj.users = selectedUSers;
        minutetemplateObj.userDetails = await userService.getUserById(minutetemplateObj.created_by);
        
        return ReS(res, {minuteTemplateData:minutetemplateObj});
    } else {
        return ReE(res, "Unable to get correct data.");
    }
}
module.exports.getDetailMinuteTemplate = getDetailMinuteTemplate; 

const removeMinuteTemplate = async function(req, res){ 
    let err, minutetemplate;
    [err, minutetemplate] = await to(MinuteTemplate.destroy({where: {id:req.body_minute_id}}));
    if(err) return ReE(res, err, 422); 
    return ReS(res, {message:"Template remove successfully."});  // If any template will remove then we have to manage on deed as well.
}
module.exports.removeMinuteTemplate = removeMinuteTemplate; 

const publishMinuteTemplate = async function(req, res){ 
    let err, minutetemplate;
    let user = req.user;  
    [err, minutetemplate] = await to(MinuteTemplate.update({status:2},{where: {status:1,created_by:user.id,version:req.body.version,type:1}}));
    [err, minutetemplate] = await to(MinuteTemplate.update({status:1},{where: {id:req.body_minute_id}}));
    if(err) return ReE(res, err, 422); 
    return ReS(res, {message:"Template remove successfully."});  // If any template will remove then we have to manage on deed as well.
}
module.exports.publishMinuteTemplate = publishMinuteTemplate; 

const copyMinuteTemplate = async function(req, res){ 

    let err, minutetemplate,minutesectionsheading,minutetable,minuteusers,minutetemplateArr = [];
    [err, minutetemplate] = await to(MinuteTemplate.findOne({where: {id:req.body.minute_id}}));
    if(err) return ReE(res, err, 422); 

    if(minutetemplate != null){
        let minutetemplateObj = minutetemplate.toWeb(); 
        [err, subversion] = await to(MinuteTemplate.max('sub_version',{where : {'version': minutetemplateObj.version,'created_by': req.user.id,type:1}}));   
        let minuteObj = {};
        minuteObj.title = minutetemplateObj.title;
        minuteObj.status = 3;
        minuteObj.type          = 1 ;
        minuteObj.version       = minutetemplateObj.version ;
        minuteObj.sub_version   = parseInt(subversion) + 1 ;
        minuteObj.listing = minutetemplateObj.listing;
        minuteObj.created_by = minutetemplateObj.created_by;
        minuteObj.updated_by = minutetemplateObj.created_by;   
        [err, minutetemplatenew] = await to(MinuteTemplate.create(minuteObj));
        if(err) return ReE(res, err, 422);
        [err, minutetemplatenew] = await to(minutetemplatenew.save());
        if(err) return ReE(res, err, 422); 

        [err, minutesectionsheading] = await to(MinuteSection.findAll({where: {minute_id:req.body.minute_id,level:'HEADING'},order: [['order', 'ASC']]}));
        if(err) return ReE(res, err, 422); 

        for(let i in minutesectionsheading){

            let sectionObj = minutesectionsheading[i].toWeb();
            let minuteSectionObj = {};
            minuteSectionObj.minute_id  = minutetemplatenew.toWeb().id;
            minuteSectionObj.parent_id  = 0;
            minuteSectionObj.order      = sectionObj.order;
            minuteSectionObj.level      = "HEADING";
            minuteSectionObj.content    = sectionObj.content;
            [err, minutesection] = await to(MinuteSection.create(minuteSectionObj));
            [err, minutesection] = await to(minutesection.save());
            
            [err, minutesectionspara] = await to(MinuteSection.findAll({where: {parent_id:sectionObj.id,level:'PARAGRAPH'},order: [['order', 'ASC']]}));
            if(minutesectionspara.length > 0){
                for(let j in minutesectionspara){
                    let paragraphObj = minutesectionspara[j].toWeb();
                    let minuteSectionParaObj = {};
                    minuteSectionParaObj.minute_id  = minutetemplatenew.toWeb().id;
                    minuteSectionParaObj.parent_id  = minutesection.toWeb().id;
                    minuteSectionParaObj.order      = paragraphObj.order;
                    minuteSectionParaObj.level      = "PARAGRAPH";
                    minuteSectionParaObj.content    = paragraphObj.content;
                    [err, minuteparasection] = await to(MinuteSection.create(minuteSectionParaObj));
                    [err, minuteparasection] = await to(minuteparasection.save());
                }  // Pragraph loop 
            } // Pragraph length check
        } // section heading loop

        [err, minutetable] = await to(MinuteTable.findOne({where: {minute_id:req.body.minute_id}}));
        if(err) return ReE(res, err, 422);

        let minuteTableObj = {};
        minuteTableObj.minute_id      = minutetemplatenew.toWeb().id;
        minuteTableObj.table_row      = minutetable.toWeb().table_row;
        minuteTableObj.table_column   = minutetable.toWeb().table_column;
        minuteTableObj.table_title   = minutetable.toWeb().table_title;
        minuteTableObj.content        = minutetable.toWeb().content;        
        [err, minutetable] = await to(MinuteTable.create(minuteTableObj));
        [err, minutetable] = await to(minutetable.save());

        [err, minuteusers] = await to(DigitalSignatureUser.findAll({where: {minute_id:req.body.minute_id}}));
        if(err) return ReE(res, err, 422);

        for(let i in minuteusers){            
            let minuteUserObj = {};
            minuteUserObj.minute_id  = minutetemplatenew.toWeb().id;
            minuteUserObj.user_id    = minuteusers[i].toWeb().user_id;
            [err, minuteuser] = await to(DigitalSignatureUser.create(minuteUserObj)); 
            [err, minuteuser] = await to(minuteuser.save()); 
        }
        return ReS(res, {minuteTemplate:minutetemplatenew.toWeb()});
    }  else {
        return ReE(res, "Unable to get correct data.");
    }
}
module.exports.copyMinuteTemplate = copyMinuteTemplate; 

const updateMinuteTemplate = async function(req, res){ 

    let err, minutetemplate, data; 
    let user = req.user;
    data = req.body.minute;  
    [err, minutetemplate] = await to(MinuteTemplate.findById(data.id)); 
    minutetemplate.set(data);
    [err, minutetemplate] = await to(minutetemplate.save());
    if (err) { return ReE(res, err);}

    if(data.status == 1){
        [err, minutetemplateUpdate] = await to(MinuteTemplate.update({status:2},{where: {status:1,created_by:user.id,version:data.version,type:1}}));
        [err, minutetemplateUpdatea] = await to(MinuteTemplate.update({status:1},{where: {id:data.id}}));
    }

    [err, minutetemplateSection] = await to(MinuteSection.destroy({where: {minute_id:data.id}}));
    if (err) { return ReE(res, err);}

    for(let i in data.sections){
        let minuteSectionObj = {};
        minuteSectionObj.minute_id  = data.id;
        minuteSectionObj.parent_id  = 0;
        minuteSectionObj.order      = parseInt(i)+1;
        minuteSectionObj.level      = "HEADING";
        minuteSectionObj.content    = data.sections[i].heading.content;
        [err, minutesection] = await to(MinuteSection.create(minuteSectionObj));
        [err, minutesection] = await to(minutesection.save());

            for(let j in data.sections[i].paragraphs){
                let minuteSectionParaObj = {};
                minuteSectionParaObj.minute_id  = data.id;
                minuteSectionParaObj.parent_id  = minutesection.toWeb().id;
                minuteSectionParaObj.order      = parseInt(j)+1;
                minuteSectionParaObj.level      = "PARAGRAPH";
                minuteSectionParaObj.content    = data.sections[i].paragraphs[j].content;
                [err, minuteparasection] = await to(MinuteSection.create(minuteSectionParaObj));
                [err, minuteparasection] = await to(minuteparasection.save());
            }  
    }  
    let tableData           = data.table;
    [err, minutetemplateTable] = await to(MinuteTable.destroy({where: {minute_id:data.id}}));
    if (err) { return ReE(res, err);}
    if(tableData.table_row > 0 && tableData.table_column > 0){        
        let minuteTableObj = {};
        minuteTableObj.minute_id      = data.id;
        minuteTableObj.table_row      = tableData.table_row;
        minuteTableObj.table_title      = tableData.table_title;
        minuteTableObj.table_column   = tableData.table_column;
        minuteTableObj.content        = JSON.stringify(tableData.content);
        [err, minutetable] = await to(MinuteTable.create(minuteTableObj));
        if(err) return ReE(res, err, 422);
        [err, minutetable] = await to(minutetable.save());
        if(err) return ReE(res, err, 422);
    }

    [err, minutetemplateUser] = await to(DigitalSignatureUser.destroy({where: {minute_id:data.id}}));
    if (err) { return ReE(res, err);}

    for(let i in data.users){
        let minuteUserObj = {};
        minuteUserObj.minute_id  = data.id;
        minuteUserObj.user_id    = data.users[i];
        [err, minuteuser] = await to(DigitalSignatureUser.create(minuteUserObj));
        if(err) return ReE(res, err, 422);
        [err, minuteuser] = await to(minuteuser.save());
        if(err) return ReE(res, err, 422);
    }
    return ReS(res, {minuteTemplate:minutetemplate.toWeb()});
}
module.exports.updateMinuteTemplate = updateMinuteTemplate; 

const addMinute = async function(req, res){ 

    let err, minutetemplate,minutetemplateupdate;
    let user = req.user;
    let minutetemplate_info = req.body.minute;    

    if(minutetemplate_info.status == 1){
        [err, minutetemplateupdate] = await to(MinuteTemplate.update({status:2},{where: {status:1,deed_id:minutetemplate_info.deed_id}}));
    }
    [err, version] = await to(MinuteTemplate.max('version',{where : {'created_by': user.id}}));   
    minutetemplate_info.version     = version != undefined ? parseInt(version) + 1 : 1; 
    minutetemplate_info.type        = 2;
    minutetemplate_info.created_by  = user.id;
    minutetemplate_info.updated_by  = user.id; 
    delete minutetemplate_info.id;
    [err, minutetemplate] = await to(MinuteTemplate.create(minutetemplate_info));
    if(err) return ReE(res, err, 422);
    [err, minutetemplate] = await to(minutetemplate.save());
    if(err) return ReE(res, err, 422);

    let minutetemplate_json = minutetemplate.toWeb();
    let tableData           = minutetemplate_info.table;
     for(let i in minutetemplate_info.sections){
        let minuteSectionObj = {};
        minuteSectionObj.minute_id  = minutetemplate_json.id;
        minuteSectionObj.parent_id  = 0;
        minuteSectionObj.order      = parseInt(i)+1;
        minuteSectionObj.level      = "HEADING";
        minuteSectionObj.content    = minutetemplate_info.sections[i].heading.content;
        [err, minutesection] = await to(MinuteSection.create(minuteSectionObj));
        [err, minutesection] = await to(minutesection.save());

            for(let j in minutetemplate_info.sections[i].paragraphs){
                let minuteSectionParaObj = {};
                minuteSectionParaObj.minute_id  = minutetemplate_json.id;
                minuteSectionParaObj.parent_id  = minutesection.toWeb().id;
                minuteSectionParaObj.order      = parseInt(j)+1;
                minuteSectionParaObj.level      = "PARAGRAPH";
                minuteSectionParaObj.content    = minutetemplate_info.sections[i].paragraphs[j].content;
                [err, minuteparasection] = await to(MinuteSection.create(minuteSectionParaObj));
                [err, minuteparasection] = await to(minuteparasection.save());
            }  
    }  

    if(tableData.table_row > 0 && tableData.table_column > 0){
        let minuteTableObj = {};
        minuteTableObj.minute_id      = minutetemplate_json.id;
        minuteTableObj.table_row      = tableData.table_row;
        minuteTableObj.table_title      = tableData.table_title;
        minuteTableObj.table_column   = tableData.table_column;
        minuteTableObj.content        = JSON.stringify(tableData.content);
        [err, minutetable] = await to(MinuteTable.create(minuteTableObj));
        if(err) return ReE(res, err, 422);
        [err, minutetable] = await to(minutetable.save());
        if(err) return ReE(res, err, 422);
    }

    for(let i in minutetemplate_info.users){
        let minuteUserObj = {};
        minuteUserObj.minute_id  = minutetemplate_json.id;
        minuteUserObj.user_id    = minutetemplate_info.users[i];
        [err, minuteuser] = await to(DigitalSignatureUser.create(minuteUserObj));
        if(err) return ReE(res, err, 422);
        [err, minuteuser] = await to(minuteuser.save());
        if(err) return ReE(res, err, 422);
    } 

    let deedUserObj = {};
    deedUserObj.deed_id = minutetemplate_info.deed_id;
    deedUserObj.type    = 'Added a minute';
    deedUserObj.title   = 'Added a minute';
    deedUserObj.old     = '--';
    deedUserObj.new     = '--';
    deedUserObj.minute_id = minutetemplate_json.id;
    deedUserObj.updated_by = user.id;
    deedUserObj.note = '---';
    PDFController.generatepdf(minutetemplate_info.deed_id) ;
    [err, deedhistory] = await to(Deedhistory.create(deedUserObj)); 
    
    [err, deedhistory] = await to(deedhistory.save()); 

    return ReS(res, {minuteTemplate:minutetemplate_json});     
}
module.exports.addMinute = addMinute; 