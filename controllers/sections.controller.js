const { Sections,TermAndClauseSection } = require('../models');
const userService = require("../services/user.service");
const { to, ReE, ReS } = require('../services/util.service');


const createSection = async function(req, res){ 

    let err, section;
    let user = req.user;   
    let section_info = req.body.section;
    let clauseJson = {};
    clauseJson.parent_id    = section_info.clause_id;
    clauseJson.type         = 2; 
    clauseJson.status       = 0;
    clauseJson.level        = 'section'
    clauseJson.heading      = section_info.heading;
    clauseJson.content      = section_info.content;
    clauseJson.ordering     = 0;
    clauseJson.created_by   = user.id; 

    [err, section] = await to(TermAndClauseSection.create(clauseJson));    
    if(err) return ReE(res, err, 422);  
    [err, section] = await to(section.save());
    if(err) return ReE(res, err, 422);
    let section_json = section.toWeb();
    [err, termsectionupdate] = await to(TermAndClauseSection.update({ordering:section_json.id},{where:{id:section_json.id}}));    
    return ReS(res, {section:section_json}, 201);  
}
module.exports.createSection = createSection;

const getSectionDetails = async function(req, res){ 
    let err, section;  
    //console.log(req.body);
    [err, section] = await to(TermAndClauseSection.findById(req.body.id));
    if (err) return ReE(res, err, 422);
    return ReS(res, {section:section.toWeb()}, 201);
}
module.exports.getSectionDetails = getSectionDetails;

const updateSection = async function(req, res){ 
    let err, section, data; 
    data = req.body.section; 
    [err, section] = await to(TermAndClauseSection.findById(data.id));  
    if (err) return ReE(res, err, 422); 
    section.parent_id = data.clause_id;
    section.set(data);
    [err, section] = await to(section.save());
    if (err) { return ReE(res, 'Error in updating section');}
    return ReS(res, { message: "Section is successfully updated "}); 
}
module.exports.updateSection = updateSection;

const deleteSection = async function(req, res){ 
    let err, section;  
    [err, section] = await to(TermAndClauseSection.destroy({where : {id : req.body.id }}));  
    [err,findsubsections] = await to(TermAndClauseSection.findAll({where : {parent_id : req.body.id,level:'subsection',type:2 }}));  
    for(let i in findsubsections){
        [err, subtermsection] = await to(TermAndClauseSection.destroy({where : {id : findsubsections[i].toWeb().id,level:'subsection',type:2 }}));  
        [err,findsubsubsections] = await to(TermAndClauseSection.findAll({where : {parent_id : req.body.id,level:'subsubsection',type:2 }}));
        for(let k in findsubsubsections){
            [err, subsubtermsection] = await to(TermAndClauseSection.destroy({where : {id : findsubsubsections[k].toWeb().id,level:'subsubsection',type:2 }}));  
        }
    }
    if (err) return ReE(res, err, 422); 
    return ReS(res, { message: "Section remove successfully."}); 
}
module.exports.deleteSection = deleteSection;

