const { Subsections,TermAndClauseSection } = require('../models');
const userService = require("../services/user.service");
const { to, ReE, ReS } = require('../services/util.service');


const createSubSections = async function(req, res){ 

    // let err, subsection;
    // let user = req.user;   
    // let subsection_info = req.body.subsection;  
    // let clauseJson = {};
    // clauseJson.parent_id    = subsection_info.section_id;
    // clauseJson.type         = 2; 
    // clauseJson.status       = 0;
    // clauseJson.level        = 'subsection'
    // clauseJson.heading      = subsection_info.heading;
    // clauseJson.content      = subsection_info.content;
    // clauseJson.ordering     = 0;
    // clauseJson.created_by   = user.id; 
    
    // [err, subsection] = await to(TermAndClauseSection.create(clauseJson));    
    // if(err) return ReE(res, err, 422);  
    // [err, subsection] = await to(subsection.save());
    // if(err) return ReE(res, err, 422);
    // let subsection_json = subsection.toWeb();
    // [err, termsectionupdate] = await to(TermAndClauseSection.update({ordering:subsection_json.id},{where:{id:subsection_json.id}}));    
    // return ReS(res, {subsection:subsection_json}, 201);  

    /* ---------------------------------------------------------- */

    let err, subsection;
    let user = req.user;   
    let subsection_info = req.body.subsection;  

    [err, checksubsection] = await to(TermAndClauseSection.findOne({where:{id:subsection_info.section_id}}));    
    if(err) return ReE(res, err, 422);  
    let subsectionvar = (checksubsection.level == 'section') ? 'subsection' : 'subsubsection';

    let clauseJson = {};
    clauseJson.parent_id    = subsection_info.section_id;
    clauseJson.type         = 2; 
    clauseJson.status       = 0;
    clauseJson.level        = subsectionvar;
    clauseJson.heading      = subsection_info.heading;
    clauseJson.content      = subsection_info.content;
    clauseJson.ordering     = 0;
    clauseJson.created_by   = user.id; 
    
    [err, subsection] = await to(TermAndClauseSection.create(clauseJson));    
    if(err) return ReE(res, err, 422);  
    [err, subsection] = await to(subsection.save());
    if(err) return ReE(res, err, 422);
    let subsection_json = subsection.toWeb();
    [err, termsectionupdate] = await to(TermAndClauseSection.update({ordering:subsection_json.id},{where:{id:subsection_json.id}}));    
    return ReS(res, {subsection:subsection_json}, 201);  
}
module.exports.createSubSections = createSubSections;

const getSubSectionDetails = async function(req, res){ 
    let err, subsection;   
    [err, subsection] = await to(TermAndClauseSection.findById(req.body.id));
    if (err) return ReE(res, err, 422);
    return ReS(res, {subsection:subsection.toWeb()}, 201);
}
module.exports.getSubSectionDetails = getSubSectionDetails;

const updateSubSection = async function(req, res){ 
    let err, subsection, data; 
    data = req.body.subsection;
    [err, subsection] = await to(TermAndClauseSection.findById(data.id));  
    if (err) return ReE(res, err, 422); 
    subsection.parent_id = data.section_id
    subsection.set(data);
    [err, subsection] = await to(subsection.save());
    if (err) { return ReE(res, 'Error in updating subsection'); }
    return ReS(res, { message: "Sub section is successfully updated "}); 
}
module.exports.updateSubSection = updateSubSection;

const deleteSubSection = async function(req, res){ 
    let err, subsection;  
    [err, subsection] = await to(TermAndClauseSection.destroy({where : {id : req.body.id }}));  
    if (err) return ReE(res, err, 422); 
    [err, subsubtermsection] = await to(TermAndClauseSection.destroy({where : {parent_id : req.body.id,level:'subsubsection',type:2  }}));
    return ReS(res, { message: "Section remove successfully."}); 
}
module.exports.deleteSubSection = deleteSubSection;

