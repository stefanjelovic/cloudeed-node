const { TermSections,TermAndClauseSection } = require('../models');
const userService = require("../services/user.service");
const { to, ReE, ReS } = require('../services/util.service');


const createTermSection = async function(req, res){ 

    let err, termsection;
    let user = req.user;   
    let termsection_info = req.body.termsection; 
    let termJson = {};
    termJson.parent_id  = termsection_info.term_id;
    termJson.type       = 1; 
    termJson.level      = 'section'
    termJson.heading    = termsection_info.heading;
    termJson.content    = termsection_info.content;
    termJson.ordering    = 0;
    termJson.created_by  = user.id; 

    [err, termsection] = await to(TermAndClauseSection.create(termJson));    
    if(err) return ReE(res, err, 422);  
    [err, termsection] = await to(termsection.save());
    if(err) return ReE(res, err, 422);
    let termsection_json = termsection.toWeb();
    [err, termsectionupdate] = await to(TermAndClauseSection.update({ordering:termsection_json.id},{where:{id:termsection_json.id}}));    
    return ReS(res, {termsection:termsection_json}, 201);  
}
module.exports.createTermSection = createTermSection;

const getTermSectionDetails = async function(req, res){ 
    let err, termsection;   
    [err, termsection] = await to(TermAndClauseSection.findById(req.body.id));
    if (err) return ReE(res, err, 422);
    return ReS(res, {termsection:termsection.toWeb()}, 201);
}
module.exports.getTermSectionDetails = getTermSectionDetails;

const updateTermSection = async function(req, res){ 
    let err, termsection, data; 
    data = req.body.termsection; 
    [err, termsection] = await to(TermAndClauseSection.findById(data.id));  
    if (err) return ReE(res, err, 422); 
    termsection.parent_id  = data.term_id;
    termsection.set(data);
    [err, termsection] = await to(termsection.save());
    if (err) {return ReE(res, 'Error in updating termsection'); }
    return ReS(res, { message: "Term section is successfully updated "}); 
}
module.exports.updateTermSection = updateTermSection;

const deleteTermSection = async function(req, res){ 
    let err, termsection;  
    [err, termsection] = await to(TermAndClauseSection.destroy({where : {id : req.body.id }}));  
    [err,findsubsections] = await to(TermAndClauseSection.findAll({where : {parent_id : req.body.id,level:'subsection',type:1 }}));  
    for(let i in findsubsections){
        [err, subtermsection] = await to(TermAndClauseSection.destroy({where : {id : findsubsections[i].toWeb().id,level:'subsection',type:1  }}));  
        [err,findsubsubsections] = await to(TermAndClauseSection.findAll({where : {parent_id : req.body.id,level:'subsubsection',type:1 }}));
        for(let k in findsubsubsections){
            [err, subsubtermsection] = await to(TermAndClauseSection.destroy({where : {id : findsubsubsections[k].toWeb().id,level:'subsubsection',type:1  }}));  
        }
    }
    if (err) return ReE(res, err, 422); 
    return ReS(res, { message: "Term section remove successfully."}); 
}
module.exports.deleteTermSection = deleteTermSection;

