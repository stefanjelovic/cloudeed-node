const { TermSubsections,TermAndClauseSection } = require('../models');
const userService = require("../services/user.service");
const { to, ReE, ReS } = require('../services/util.service');


const createTermSubSections = async function(req, res){ 

    // let err, termsubsection;
    // let user = req.user;   
    // let termsubsection_info = req.body.termsubsection;

    // let termJson = {};
    // termJson.parent_id  = termsubsection_info.section_id;
    // termJson.type       = 1; 
    // termJson.level      = 'subsection'
    // termJson.heading    = termsubsection_info.heading;
    // termJson.content    = termsubsection_info.content;
    // termJson.ordering    = 0;
    // termJson.created_by  = user.id;

    // [err, termsubsection] = await to(TermAndClauseSection.create(termJson));    
    // if(err) return ReE(res, err, 422);  
    // [err, termsubsection] = await to(termsubsection.save());
    // if(err) return ReE(res, err, 422);
    // let termsubsection_json = termsubsection.toWeb(); 
    // [err, termsectionupdate] = await to(TermAndClauseSection.update({ordering:termsubsection_json.id},{where:{id:termsubsection_json.id}}));    
    // return ReS(res, {termsubsection:termsubsection_json}, 201);  

    /* ---------------------------------------------------------- */

    let err, termsubsection;
    let user = req.user;   
    let termsubsection_info = req.body.termsubsection;

    [err, checksubsection] = await to(TermAndClauseSection.findOne({where:{id:termsubsection_info.section_id}}));    
    if(err) return ReE(res, err, 422);  
    let subsectionvar = (checksubsection.level == 'section') ? 'subsection' : 'subsubsection';
    
    let termJson = {};
    termJson.parent_id  = termsubsection_info.section_id;
    termJson.type       = 1; 
    termJson.level      = subsectionvar
    termJson.heading    = termsubsection_info.heading;
    termJson.content    = termsubsection_info.content;
    termJson.ordering    = 0;
    termJson.created_by  = user.id;

    [err, termsubsection] = await to(TermAndClauseSection.create(termJson));    
    if(err) return ReE(res, err, 422);  
    [err, termsubsection] = await to(termsubsection.save());
    if(err) return ReE(res, err, 422);
    let termsubsection_json = termsubsection.toWeb(); 
    [err, termsectionupdate] = await to(TermAndClauseSection.update({ordering:termsubsection_json.id},{where:{id:termsubsection_json.id}}));    
    return ReS(res, {termsubsection:termsubsection_json}, 201); 


}
module.exports.createTermSubSections = createTermSubSections;

const getTermSubSectionDetails = async function(req, res){ 
    let err, termsubsection;   
    [err, termsubsection] = await to(TermAndClauseSection.findById(req.body.id));
    if (err) return ReE(res, err, 422);
    return ReS(res, {termsubsection:termsubsection.toWeb()}, 201);
}
module.exports.getTermSubSectionDetails = getTermSubSectionDetails;

const updateTermSubSection = async function(req, res){ 
    let err, termsubsection, data; 
    data = req.body.termsubsection; 
    [err, termsubsection] = await to(TermAndClauseSection.findById(data.id));  
    if (err) return ReE(res, err, 422); 
    termsubsection.parent_id  = data.section_id;
    termsubsection.set(data);
    [err, termsubsection] = await to(termsubsection.save());
    if (err) { return ReE(res, 'Error in updating termsubsection');}
    return ReS(res, { message: "Sub section is successfully updated "}); 
}
module.exports.updateTermSubSection = updateTermSubSection;

const deleteTermSubSection = async function(req, res){ 
    let err, termsubsection;  
    [err, termsubsection] = await to(TermAndClauseSection.destroy({where : {id : req.body.id }}));  
    [err, subsubtermsection] = await to(TermAndClauseSection.destroy({where : {parent_id : req.body.id,level:'subsubsection',type:1  }}));     
    if (err) return ReE(res, err, 422); 
    return ReS(res, { message: "Section remove successfully."}); 
}
module.exports.deleteTermSubSection = deleteTermSubSection;

