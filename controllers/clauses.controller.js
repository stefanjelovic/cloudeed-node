const { Clauses,Deeds,TermAndClauseSection,Deedusers, Deedhistory } = require('../models');
const userService = require("../services/user.service");
const PDFController 	          = require('../controllers/pdf.controller');
const { to, ReE, ReS } = require('../services/util.service');
const Sequelize = require('sequelize');
const Op = Sequelize.Op

const getListOfAllClauses = async function(req, res){ 
    let user = req.user; 
    /* Code for Pagination */
    let limit = 10;   // number of records per page
    let offset = 0;
    let countallUsers = await Clauses.findAndCountAll(); 
    let page = req.body.page;      // page number
    let order_by = req.body.order_by;  
    let order_by_ASC_DESC = req.body.order_by_ASC_DESC;
    let totalCount = countallUsers.count;
    let pages = Math.ceil(totalCount / limit);
    offset = limit * (page - 1); 
    let query = req.body.q; 
    /* End code for Pagination */

    if(user.user_type == 1){
        let err, clauses; 
        if(query.trim() != "") { 
            [err, clauses] = await to(Clauses.findAll({
              where:{ 
                [Op.or] : {
                    title:{ [Op.like]: '%'+query.trim()+'%' }
                }
              },
              limit: limit,
              offset: offset,
              order: [[order_by, order_by_ASC_DESC]]
            })); 
          } else {
            [err, clauses] = await to(Clauses.findAll({ 
              limit: limit,
              offset: offset,
              order: [[order_by, order_by_ASC_DESC]]
            })); 
          } 
        // [err, clauses] = await to(Clauses.findAll({where : {is_special:0 }}));  
        // console.log(clauses);
        if(err){return ReE(res, err);}

        let clauses_json =[]
        for( let i in clauses){
            let clause = clauses[i];  
            let clause_info = clause.toWeb();
            let userData = await userService.getUserById(clause_info.created_by);
            if(userData != null){
                clause_info.deed_provider_details = userData.dataValues;   
                clauses_json.push(clause_info);
            }
        }
        return ReS(res, {clauses:clauses_json,'count': totalCount, 'pages': pages});
    } else {
        return ReE(res, "Only Admin can see all list of clauses");
    }    
}
module.exports.getListOfAllClauses = getListOfAllClauses; 


const getListOfCompaniesClauses = async function(req, res){ 
    let user = req.user; 
    let err, clauses; 
     /* Code for Pagination */
    let limit = 10;   // number of records per page
    let offset = 0;
    let countallUsers = await Clauses.findAndCountAll({where:{created_by:req.body.created_by}}); 
    let page = req.body.page;      // page number
    let order_by = req.body.order_by;  
    let order_by_ASC_DESC = req.body.order_by_ASC_DESC;
    let totalCount = countallUsers.count;
    let pages = Math.ceil(totalCount / limit);
    offset = limit * (page - 1); 
    let query = req.body.q; 
    /* End code for Pagination */
    if(query.trim() != "") { 
        [err, clauses] = await to(Clauses.findAll({
            where:{ 
                created_by : req.body.created_by ,
                is_special:0,        
                [Op.or] : {
                    title:{ [Op.like]: '%'+query.trim()+'%' }
                }
            },
            limit: limit,
            offset: offset,
            order: [[order_by, order_by_ASC_DESC]]
        })); 
    } else {
        [err, clauses] = await to(Clauses.findAll({ 
            where:{ created_by : req.body.created_by,is_special:0  },
            limit: limit,
            offset: offset,
            order: [[order_by, order_by_ASC_DESC]]
        })); 
    } 
    // [err, clauses] = await to(Clauses.findAll({where : {created_by : req.body.created_by,is_special:0 }}));  
    if(err){return ReE(res, err);}
    let clauses_json = [] ;
    for(let k in clauses){
        let clause = clauses[k];  
        let clause_info = clause.toWeb();
        let userData = await userService.getUserById(clause_info.created_by);
        if(userData != null){
            clause_info.deed_provider_details = userData.dataValues;   
            clauses_json.push(clause_info);
        }       
    } 
    return ReS(res, {clauses:clauses_json,'count': totalCount, 'pages': pages});
}
module.exports.getListOfCompaniesClauses = getListOfCompaniesClauses; 

const createClauses = async function(req, res){ 

    let err, clauses,deed;
    let user = req.user;   
    let clauses_info = req.body.clause; 
    [err, version] = await to(Clauses.max('version',{where : {'created_by': user.id}}));    
    clauses_info.version = (isNaN(version)) ?  1 : parseInt(version) + 1 ;
    clauses_info.created_by = user.id;
    clauses_info.updated_by = user.id;
    if(clauses_info.description == undefined){
        clauses_info.description = '';
    }

    clauses_info.sub_version =0 ;

    if(clauses_info.status == 1){
        await to(userService.setClausesBlockedByCreatedBy(user.id));
    }
 
    [err, clauses] = await to(Clauses.create(clauses_info));    
    if(err) return ReE(res, err, 422);  
    [err, clauses] = await to(clauses.save());
    if(err) return ReE(res, err, 422);
    let clauses_json = clauses.toWeb();
    clauses_json.users = [{user:user.id}];
  
    if(clauses_info.is_special != undefined && clauses_info.is_special > 0){ 
        [err, deed] = await to(Deeds.findById(clauses_info.deed_id));
        if (err) return ReE(res, err, 422); 
        deed.set({special_clause : clauses_json.id});
        [err, deed] = await to(deed.save()); 
        let deedUserObj = {};
        deedUserObj.deed_id = deed.id;
        deedUserObj.type    = 'Added Special Condition';
        deedUserObj.title   = 'Added Special Condition';
        deedUserObj.old     = '--';
        deedUserObj.new     = clauses_json.title; 
        deedUserObj.updated_by = req.user.id;
        deedUserObj.note = '---'; 
        [err, deedhistory] = await to(Deedhistory.create(deedUserObj)); 
        [err, deedhistory] = await to(deedhistory.save());

    }
    return ReS(res, {clauses:clauses_json}, 201);  
}
module.exports.createClauses = createClauses;

const getClausesDetails = async function(req, res){ 
    let err, clauses,sections,subsections,subsubsections;  
    [err, clauses] = await to(Clauses.findOne({where : {id : req.body.id }}));    
    if (err) return ReE(res, err, 422);
    let clauses_json = [];
    let clauses_info = {"sections":[{"subsections":[{"subsubsections":[]}]}]};
    let popup_info = {"sections":[{"subsections":[]}]};
    [err, sections] = await to(TermAndClauseSection.findAll({where:{parent_id:req.body.id,type:2,level:'section'},order: [['ordering', 'ASC']]}));
    clauses_info.sections.pop();
    popup_info.sections.pop();
    let checkLength = sections.length; 
    if(checkLength > 0){
        for( let i in sections){
            let section = sections[i];  
            let section_info = section.toWeb();
            section_info.indexing = parseInt(i)+1;
            popup_info.sections.push(section_info);
            let tempSection ={"section":section_info,"subsections":[]} ;
            [err, subsections] = await to(TermAndClauseSection.findAll({where:{parent_id:section_info.id,type:2,level:'subsection'},order: [['ordering', 'ASC']]}));                
                let checkSubLength = subsections.length;
                if(checkSubLength > 0){
                    for( let p in subsections){ 
                        let subsection = subsections[p];  
                        let subsection_info = subsection.toWeb();
                        subsection_info.indexing = (parseInt(i)+1)+'.'+(parseInt(p)+1);
                        popup_info.sections.push(subsection_info);
                        let tempsubsection={"subsection":subsection_info,"subsubsection":[]} ;
                        [err, subsubsections] = await to(TermAndClauseSection.findAll({where:{parent_id:subsection_info.id,type:2,level:'subsubsection'},order: [['ordering', 'ASC']]}));
                        tempsubsection.subsubsection = subsubsections ;
                        tempSection.subsections.push(tempsubsection);
                    }
                } 
            clauses_info.sections.push(tempSection)
        } 
    }
    //console.log(clauses);
    return ReS(res, {clauses:clauses.toWeb(),clause_info:clauses_info,popup_info:popup_info}, 201);
}
module.exports.getClausesDetails = getClausesDetails;

const updateClauses = async function(req, res){ 
    let err, clauses, data; 
    data = req.body.clause; 
    [err, clauses] = await to(Clauses.findOne({where : {id : data.id }}));  
    if (err) return ReE(res, err, 422); 
    if(data.status == 1){
        await to(userService.setClausesBlockedByCreatedBy(data.created_by));
    }
    data.updated_by = req.user.id;
    clauses.set(data);
    [err, clauses] = await to(clauses.save());
    
    if (err) { return ReE(res, 'Error in updating clauses'); }
    return ReS(res, { message: "Clauses is successfully updated "}); 
}
module.exports.updateClauses = updateClauses;

const deleteClauses = async function(req, res){ 
    let err, clause;  
    [err, clause] = await to(Clauses.destroy({where : {id : req.body.id }}));  
    if (err) return ReE(res, err, 422); 
    return ReS(res, { message: "Clauses remove successfully."}); 
}
module.exports.deleteClauses = deleteClauses;

const copyClauses = async function(req, res){  

    let err, clause,clauseversion,clausesections;  
    [err, clause] = await to(Clauses.findByPk(req.body.id));  
    if (err) return ReE(res, err, 422); 
    let clause_json = clause.toWeb();

    [err, subversion] = await to(Clauses.max('sub_version',{where : {'version': clause_json.version,'created_by': req.user.id}}));   

    clause_json.title           = clause_json.title;
    clause_json.status          = 3;  
    clause_json.version         = clause_json.version;
    clause_json.sub_version     = parseInt(subversion) + 1 ;
    delete clause_json.id;  
    [err, clause] = await to(Clauses.create(clause_json));    
    if(err) return ReE(res, err, 422);  
    [err, clause] = await to(clause.save());
    if(err) return ReE(res, err, 422);

    [err, clausesections] = await to(TermAndClauseSection.findAll({where:{parent_id:req.body.id,type:2,level:'section'}}));  
    if(err) return ReE(res, err, 422);

    for(let s in clausesections){

        let clauseJson = {};
        clauseJson.parent_id    = clause.toWeb().id;
        clauseJson.type         = 2; 
        clauseJson.level        = 'section'
        clauseJson.heading      = clausesections[s].toWeb().heading;
        clauseJson.content      = clausesections[s].toWeb().content;
        clauseJson.ordering     = clausesections[s].toWeb().ordering;
        clauseJson.created_by   = clausesections[s].toWeb().created_by; 
        [err, sections] = await to(TermAndClauseSection.create(clauseJson));   
        [err, sections] = await to(sections.save());
        [err, clausesectionupdate] = await to(TermAndClauseSection.update({ordering:sections.toWeb().id},{where:{id:sections.toWeb().id}}));

        [err, subsections] = await to(TermAndClauseSection.findAll({where:{parent_id:clausesections[s].toWeb().id,type:2,level:'subsection'}}));  
        if(err) return ReE(res, err, 422);
        
        for(let k in subsections){

            let clausesubJson = {};
            clausesubJson.parent_id    = sections.toWeb().id;
            clausesubJson.type         = 2; 
            clausesubJson.level        = 'subsection'
            clausesubJson.heading      = subsections[k].toWeb().heading;
            clausesubJson.content      = subsections[k].toWeb().content;
            clausesubJson.ordering     = subsections[k].toWeb().ordering;
            clausesubJson.created_by   = subsections[k].toWeb().created_by; 
            [err, subsection] = await to(TermAndClauseSection.create(clausesubJson));   
            [err, subsection] = await to(subsection.save());
            [err, clausesectionupdate] = await to(TermAndClauseSection.update({ordering:subsection.toWeb().id},{where:{id:subsection.toWeb().id}}));
    
            [err, subsubsections] = await to(TermAndClauseSection.findAll({where:{parent_id:subsections[k].toWeb().id,type:2,level:'subsubsection'}}));  
            if(err) return ReE(res, err, 422);
            for(let p in subsubsections){
                let clausesubsubJson = {};
                clausesubsubJson.parent_id    = subsection.toWeb().id;
                clausesubsubJson.type         = 2; 
                clausesubsubJson.level        = 'subsubsection'
                clausesubsubJson.heading      = subsubsections[p].toWeb().heading;
                clausesubsubJson.content      = subsubsections[p].toWeb().content;
                clausesubsubJson.ordering     = subsubsections[p].toWeb().ordering;
                clausesubsubJson.created_by   = subsubsections[p].toWeb().created_by;
                [err, subsubsection] = await to(TermAndClauseSection.create(clausesubsubJson));   
                [err, subsubsection] = await to(subsubsection.save());
                [err, clausesectionupdate] = await to(TermAndClauseSection.update({ordering:subsubsection.toWeb().id},{where:{id:subsubsection.toWeb().id}}));
            }
        }
    }
    return ReS(res, { message: "Clauses is Copied successfully "}); 
}
module.exports.copyClauses = copyClauses;

const getClauseNumber = async function(req, res){ 
    let err, clause;
    [err, clause] = await to(Clauses.max('version',{where : {'is_special' : 0,created_by:req.user.id }}));  
    return ReS(res, {clause:clause}, 201); 
}
module.exports.getClauseNumber = getClauseNumber;

const publishClause = async function(req, res){ 
    let err, clause,termsectionupdateorder;      
    [err, getClause] = await to(Clauses.findByPk(req.body.clauseId));
    let getClauseData = getClause.toWeb();
    [err, clause] = await to(Clauses.update({ status:2 },{ where: {version:getClauseData.version}}));
    [err, clause] = await to(Clauses.update({ status:1 },{ where: {id: req.body.clauseId}}));
    // [err, deed] = await to(Deeds.update({ clause_version:req.body.clauseId },{ where: {created_by: req.user.id}}));   
    //PDFController.generatepdf(deed.toWeb().id) ; 
       
    [err, allDeeds] = await to(Deeds.findAll({ where: {created_by: req.user.id,clause_version:getClauseData.version}}));
    for( var k in allDeeds){ 
        var deedTemp =allDeeds[k].toWeb();
        let deedUserObj = {};
        deedUserObj.deed_id = deedTemp.id;
        deedUserObj.type    = 'Updated Clauses Version';
        deedUserObj.title   = 'Updated Clauses Version';
        deedUserObj.old     = '--';
        deedUserObj.new     = clause.title; 
        deedUserObj.updated_by = req.user.id;
        deedUserObj.note = '---'; 
        [err, deedhistory] = await to(Deedhistory.create(deedUserObj)); 
        [err, deedhistory] = await to(deedhistory.save());
        [err, approve] = await to(Deedusers.update({is_approve:0},{where:{deed_id:deedTemp.id}}));
        if (err) {return ReE(res, err);}
    }
    if(getClause.is_special>0){
        let deedUserObj = {};
        [err,deed] = await to(Deeds.findOne({where:{special_clause:getClause.id}}))
        deedUserObj.deed_id = deed.toWeb().id;
        deedUserObj.type    = 'Updated Special Clauses';
        deedUserObj.title   = 'Updated Special Clauses';
        deedUserObj.old     = '--';
        deedUserObj.new     = getClause.title; 
        deedUserObj.updated_by = req.user.id;
        deedUserObj.note = '---'; 
        [err, deedhistory] = await to(Deedhistory.create(deedUserObj)); 
        [err, deedhistory] = await to(deedhistory.save());
    }
    if(err) return ReE(res, err, 422);
    return ReS(res, {message:'Clause published successfully.'}); 
}
module.exports.publishClause = publishClause;

const updateOrderClause = async function(req, res){ 
    let err, clause; 
    let clause_info = req.body.clause_info;
    for(let i in clause_info.sections){
        clause_info.sections[i].ordering = i;
        [err, termsectionupdateorder] = await to(TermAndClauseSection.update({ ordering:parseInt(i)+1 },{ where: {id:clause_info.sections[i].section.id}}));
        for(let p in clause_info.sections[i].subsections){
            [err, termsectionupdateorder] = await to(TermAndClauseSection.update({ ordering:parseInt(p)+1 },{ where: {id:clause_info.sections[i].subsections[p].subsection.id}}));
            for(let k in clause_info.sections[i].subsections[p].subsubsection){
                [err, termsectionupdateorder] = await to(TermAndClauseSection.update({ ordering:parseInt(k)+1 },{ where: {id:clause_info.sections[i].subsections[p].subsubsection[k].id}}));
            }
        }
    } 
    return ReS(res, {message:'Clause reorder successfully.'}); 
}
module.exports.updateOrderClause = updateOrderClause;


const listOfSectionSubsections = async function(req, res){ 

    let err, sections,subsections;  
    let clauses_info = {"sections":[{"subsections":[]}]};
    [err, sections] = await to(TermAndClauseSection.findAll({where:{parent_id:req.body.id,type:2,level:'section'},order: [['ordering', 'ASC']]}));
    clauses_info.sections.pop();
    let checkLength = sections.length; 
    if(checkLength > 0){
        for( let i in sections){
            let section = sections[i];  
            let section_info = section.toWeb(); 
            clauses_info.sections.push(section_info);
            [err, subsections] = await to(TermAndClauseSection.findAll({where:{parent_id:section_info.id,type:2,level:'subsection'},order: [['ordering', 'ASC']]}));                
                let checkSubLength = subsections.length;
                if(checkSubLength > 0){
                    for( let p in subsections){ 
                        let subsection = subsections[p];  
                        let subsection_info = subsection.toWeb(); 
                        clauses_info.sections.push(subsection_info);
                    }
                } 
        } 
    }
    return ReS(res, {clause_info:clauses_info}, 201);

}
module.exports.listOfSectionSubsections = listOfSectionSubsections;


