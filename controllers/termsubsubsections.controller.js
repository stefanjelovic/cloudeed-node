const { TermSubsubsection,TermAndClauseSection } = require('../models');
const userService = require("../services/user.service");
const { to, ReE, ReS } = require('../services/util.service');


const createTermSubSubSections = async function(req, res){ 

    let err, termsubsubsection;
    let user = req.user;   
    let termsubsubsection_info = req.body.termsubsubsection; 

    let termJson = {};
    termJson.parent_id  = termsubsubsection_info.sub_section_id;
    termJson.type       = 1; 
    termJson.level      = 'subsubsection'
    termJson.content    = termsubsubsection_info.content;
    termJson.heading    = termsubsubsection_info.heading;
    termJson.ordering    = 0;
    termJson.created_by  = user.id;
    
    [err, termsubsubsection] = await to(TermAndClauseSection.create(termJson));    
    if(err) return ReE(res, err, 422);  
    [err, termsubsubsection] = await to(termsubsubsection.save());
    if(err) return ReE(res, err, 422);
    let termsubsubsection_json = termsubsubsection.toWeb(); 
    [err, termsectionupdate] = await to(TermAndClauseSection.update({ordering:termsubsubsection_json.id},{where:{id:termsubsubsection_json.id}}));    
    return ReS(res, {termsubsubsection:termsubsubsection_json}, 201);  
}
module.exports.createTermSubSubSections = createTermSubSubSections;

const getTermSubSubSectionDetails = async function(req, res){ 
    let err, termsubsubsection;   
    [err, termsubsubsection] = await to(TermAndClauseSection.findById(req.body.id));
    if (err) return ReE(res, err, 422);
    return ReS(res, {termsubsubsection:termsubsubsection.toWeb()}, 201);
}
module.exports.getTermSubSubSectionDetails = getTermSubSubSectionDetails;

const updateTermSubSubSection = async function(req, res){ 
    let err, termsubsubsection, data; 
    data = req.body.termsubsubsection; 
    [err, termsubsubsection] = await to(TermAndClauseSection.findById(data.id));  
    if (err) return ReE(res, err, 422); 
    termsubsubsection.parent_id  = data.sub_section_id;
    termsubsubsection.set(data);
    [err, termsubsubsection] = await to(termsubsubsection.save());
    if (err) { return ReE(res, 'Error in updating termsubsubsection');}
    return ReS(res, { message: "Term sub sub section is successfully updated "}); 
}
module.exports.updateTermSubSubSection = updateTermSubSubSection;

const deleteTermSubSubSection = async function(req, res){ 
    let err, termsubsubsection;  
    [err, termsubsubsection] = await to(TermAndClauseSection.destroy({where : {id : req.body.id }}));  
    if (err) return ReE(res, err, 422);  
    return ReS(res, { message: "Section remove successfully."}); 
}
module.exports.deleteTermSubSubSection = deleteTermSubSubSection;

