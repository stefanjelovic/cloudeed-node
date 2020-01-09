const { Subsubsection,TermAndClauseSection } = require('../models');
const userService = require("../services/user.service");
const { to, ReE, ReS } = require('../services/util.service');


const createSubSubSections = async function(req, res){ 

    let err, subsubsection;
    let user = req.user;   
    let subsubsection_info = req.body.subsubsection;
    let clauseJson = {};
    clauseJson.parent_id    = subsubsection_info.sub_section_id;
    clauseJson.type         = 2; 
    clauseJson.status       = 0;
    clauseJson.level        = 'subsubsection'
    clauseJson.heading      = subsubsection_info.heading;
    clauseJson.content      = subsubsection_info.content;
    clauseJson.ordering     = 0;
    clauseJson.created_by   = user.id;  
    
    [err, subsubsection] = await to(TermAndClauseSection.create(clauseJson));    
    if(err) return ReE(res, err, 422);  
    [err, subsubsection] = await to(subsubsection.save());
    if(err) return ReE(res, err, 422);
    let subsubsection_json = subsubsection.toWeb();
    [err, termsectionupdate] = await to(TermAndClauseSection.update({ordering:subsubsection_json.id},{where:{id:subsubsection_json.id}}));    
    return ReS(res, {subsubsection:subsubsection_json}, 201);  
}
module.exports.createSubSubSections = createSubSubSections;

const getSubSubSectionDetails = async function(req, res){ 
    let err, subsubsection;   
    [err, subsubsection] = await to(TermAndClauseSection.findById(req.body.id));
    if (err) return ReE(res, err, 422);
    return ReS(res, {subsubsection:subsubsection.toWeb()}, 201);
}
module.exports.getSubSubSectionDetails = getSubSubSectionDetails;

const updateSubSubSection = async function(req, res){ 
    let err, subsubsection, data; 
    data = req.body.subsubsection;    
    [err, subsubsection] = await to(TermAndClauseSection.findById(data.id));  
    if (err) return ReE(res, err, 422); 
    subsubsection.parent_id = data.sub_section_id;
    subsubsection.set(data);
    [err, subsubsection] = await to(subsubsection.save());
    if (err) { return ReE(res, 'Error in updating subsubsection');}
    return ReS(res, { message: "Sub sub section is successfully updated "}); 
}
module.exports.updateSubSubSection = updateSubSubSection;

const deleteSubSubSection = async function(req, res){ 
    let err, subsubsection;  
    [err, subsubsection] = await to(TermAndClauseSection.destroy({where : {id : req.body.id }}));  
    if (err) return ReE(res, err, 422); 
    return ReS(res, { message: "Section remove successfully."}); 
}
module.exports.deleteSubSubSection = deleteSubSubSection;

