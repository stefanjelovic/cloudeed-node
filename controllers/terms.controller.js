const { Terms ,TermAndClauseSection,Deeds,Deedusers,Deedhistory} = require('../models');
const userService = require("../services/user.service");
const PDFController 	          = require('../controllers/pdf.controller');
const { to, ReE, ReS } = require('../services/util.service');
const Sequelize = require('sequelize');
const Op = Sequelize.Op
const getListOfAllTerms = async function(req, res){  
     /* Code for Pagination */
  let limit = 10;   // number of records per page
  let offset = 0;
  let countallUsers = await Terms.findAndCountAll(); 
  let page = req.body.page;      // page number
  let order_by = req.body.order_by;  
  let order_by_ASC_DESC = req.body.order_by_ASC_DESC;
  let totalCount = countallUsers.count;
  let pages = Math.ceil(totalCount / limit);
  offset = limit * (page - 1); 
  let query = req.body.q; 
  /* End code for Pagination */

    let user = req.user; 
    if(user.user_type == 1){
        let err, terms;  
        if(query.trim() != "") { 
            [err, terms] = await to(Terms.findAll({
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
            [err, terms] = await to(Terms.findAll({ 
                limit: limit,
                offset: offset,
                order: [[order_by, order_by_ASC_DESC]]
            })); 
          }  
        // [err, terms] = await to(Terms.findAll());  
        if(err){
            return ReE(res, err);
        }
        let term_json =[]
        for( let i in terms){
            let term = terms[i];  
            let term_info = term.toWeb();
            let userData = await userService.getUserById(term_info.created_by);
            if(userData != null){
                term_info.deed_provider_details = userData.dataValues;   
                term_json.push(term_info);
            }
        }
        return ReS(res, {terms:term_json ,'count': totalCount, 'pages': pages});
    } else {
        return ReE(res, "Only Admin can see all list of terms");
    }
}
module.exports.getListOfAllTerms = getListOfAllTerms; 

const getListOfCompaniesTerms = async function(req, res){ 
    let user = req.user; 
    let err, terms; 
    /* Code for Pagination */
    let limit = 10;   // number of records per page
    let offset = 0;
    let countallUsers = await Terms.findAndCountAll({where:{created_by : req.body.created_by}}); 
    let page = req.body.page;      // page number
    let order_by = req.body.order_by;  
    let order_by_ASC_DESC = req.body.order_by_ASC_DESC;
    let totalCount = countallUsers.count;
    let pages = Math.ceil(totalCount / limit);
    offset = limit * (page - 1); 
    let query = req.body.q; 
    /* End code for Pagination */
    //console.log("query.trim()",query.trim()) ;

            if(query.trim() != "") { 
                [err, terms] = await to(Terms.findAll({
                    where:{ 
                        created_by : req.body.created_by ,
                        [Op.or] : {                    
                        title:{ [Op.like]: '%'+query.trim()+'%' }
                        }
                    },
                    limit: limit,
                    offset: offset,
                    order: [[order_by, order_by_ASC_DESC]]
                })); 
            } else {
                [err, terms] = await to(Terms.findAll({ 
                    where:{ created_by : req.body.created_by  },
                    limit: limit,
                    offset: offset,
                    order: [[order_by, order_by_ASC_DESC]]
                })); 
            }  
    // [err, terms] = await to(Terms.findAll({where : {created_by : req.body.created_by }}));  
    if(err){return ReE(res, err);}
    
    let term_json =[]
    for( let i in terms){
        let term = terms[i];  
        let term_info = term.toWeb();
        let userData = await userService.getUserById(term_info.created_by);
        if(userData != null){
            term_info.deed_provider_details = userData.dataValues;   
            term_json.push(term_info);
        }
    }
    return ReS(res, {terms:term_json,'count': totalCount, 'pages': pages});
}
module.exports.getListOfCompaniesTerms = getListOfCompaniesTerms; 

const createTerm = async function(req, res){ 

    let err, terms;
    let user = req.user;  

    [err, version] = await to(Terms.max('version',{where : {'created_by': user.id}})); 

    let term_info = req.body.term; 
    term_info.version = (isNaN(version)) ?  1 : parseInt(version) + 1 ;
    term_info.created_by = user.id;
    term_info.updated_by = user.id;
    term_info.sub_version =0 ;
    if(term_info.status == 1){
        await to(userService.setTermBlockedByCreatedBy(user.id));
    }
    [err, terms] = await to(Terms.create(term_info));    
    if(err) return ReE(res, err, 422);  
    [err, terms] = await to(terms.save());
    if(err) return ReE(res, err, 422);
    let term_json = terms.toWeb();
    term_json.users = [{user:user.id}];

    return ReS(res, {term:term_json}, 201);
}
module.exports.createTerm = createTerm; 

const getTermsDetails = async function(req, res){ 

    let err, term,termsections,termsubsections,termsubsubsections;  
    [err, term] = await to(Terms.findOne({where : {id : req.body.id }}));
    if (err) return ReE(res, err, 422);
    let term_json = [];
    let term_info = {"termsections":[{"termsubsections":[{"termsubsubsections":[]}]}]};
    let popup_info = {"sections":[{"subsections":[]}]};
    [err, termsections] = await to(TermAndClauseSection.findAll({where:{parent_id:req.body.id,type:1,level:'section'},order: [['ordering', 'ASC']]}));
    term_info.termsections.pop();
    popup_info.sections.pop();
    let checkLength = termsections.length; 
    if(checkLength > 0){
        for( let i in termsections){
            let section = termsections[i];  
            let section_info = section.toWeb();
            section_info.indexing = parseInt(i)+1;
            popup_info.sections.push(section_info);
            let tempSection ={"termsection":section_info,"termsubsections":[]} ;
            [err, termsubsections] = await to(TermAndClauseSection.findAll({where:{parent_id:section_info.id,type:1,level:'subsection'},order: [['ordering', 'ASC']]}));  
                let checkSubLength = termsubsections.length;
                if(checkSubLength > 0){
                    for( let p in termsubsections){ 
                        let termsubsection = termsubsections[p];  
                        let subsection_info = termsubsection.toWeb();
                        subsection_info.indexing = (parseInt(i)+1)+'.'+(parseInt(p)+1);
                        popup_info.sections.push(subsection_info);
                        let tempsubsection={"termsubsection":subsection_info,"termsubsubsection":[]} ;
                        [err, termsubsubsections] = await to(TermAndClauseSection.findAll({where:{parent_id:subsection_info.id,type:1,level:'subsubsection'},order: [['ordering', 'ASC']]}));
                        tempsubsection.termsubsubsection = termsubsubsections ;
                        tempSection.termsubsections.push(tempsubsection);
                    }
                } 
                term_info.termsections.push(tempSection)
        }   
    }
    return ReS(res, {term:term.toWeb(),term_info:term_info,popup_info:popup_info}, 201);
}
module.exports.getTermsDetails = getTermsDetails;

const updateTerm = async function(req, res){ 
    let err, term, data; 
    data = req.body.terms;  
    [err, term] = await to(userService.getTermById(data.id));
    if (err) return ReE(res, err, 422); 
    if(data.status == 1){
        await to(userService.setTermBlockedByCreatedBy(data.created_by));
    }
    data.updated_by = req.user.id;
    term.set(data);
    [err, term] = await to(term.save());
    if (err) {return ReE(res, 'Error in updating term');}
    return ReS(res, { message: "Term is successfully updated "});
}
module.exports.updateTerm = updateTerm;

const deleteTerm = async function(req, res){ 
    let err, term;  
    [err, term] = await to(Terms.destroy({where : {id : req.body.id }}));  
    if (err) return ReE(res, err, 422); 
    return ReS(res, { message: "Term remove successfully."}); 
}
module.exports.deleteTerm = deleteTerm;

const copyTerm = async function(req, res){ 

    let err, term,termversion;  
    [err, term] = await to(Terms.findById(req.body.id));  
    if (err) return ReE(res, err, 422); 
    let term_json = term.toWeb();
    [err, subversion] = await to(Terms.max('sub_version',{where : {'version': term_json.version,'created_by': req.user.id}}));
    term_json.title         = term_json.title;
    term_json.status        = 3;        
    term_json.version       = term_json.version;    
    term_json.sub_version   = parseInt(subversion) + 1 ;
    delete term_json.id;  

    [err, term] = await to(Terms.create(term_json));    
    if(err) return ReE(res, err, 422);  
    [err, term] = await to(term.save());
    if(err) return ReE(res, err, 422);

    [err, termsections] = await to(TermAndClauseSection.findAll({where:{parent_id:req.body.id,type:1,level:'section'}}));  
    if(err) return ReE(res, err, 422);

    for(let s in termsections){
        let termJson = {};
        termJson.parent_id    = term.toWeb().id;
        termJson.type         = 1; 
        termJson.level        = 'section'
        termJson.heading      = termsections[s].toWeb().heading;
        termJson.content      = termsections[s].toWeb().content;
        termJson.ordering     = 0;
        termJson.created_by   = termsections[s].toWeb().created_by; 
        [err, termsection] = await to(TermAndClauseSection.create(termJson));   
        [err, termsection] = await to(termsection.save());
        [err, termsectionupdate] = await to(TermAndClauseSection.update({ordering:termsection.toWeb().id},{where:{id:termsection.toWeb().id}}));
        [err, termsubsections] = await to(TermAndClauseSection.findAll({where:{parent_id:termsections[s].toWeb().id,type:1,level:'subsection'}}));  
        if(err) return ReE(res, err, 422);
        
        for(let k in termsubsections){ 
            let termSubJson = {};
            termSubJson.parent_id    = termsection.toWeb().id;
            termSubJson.type         = 1; 
            termSubJson.level        = 'subsection'
            termSubJson.heading      = termsubsections[k].toWeb().heading;
            termSubJson.content      = termsubsections[k].toWeb().content;
            termSubJson.ordering     = 0;
            termSubJson.created_by   = termsubsections[k].toWeb().created_by;  
            [err, termsubsection] = await to(TermAndClauseSection.create(termSubJson));   
            [err, termsubsection] = await to(termsubsection.save());
            [err, termsectionupdate] = await to(TermAndClauseSection.update({ordering:termsubsection.toWeb().id},{where:{id:termsubsection.toWeb().id}}));    

            [err, termsubsubsections] = await to(TermAndClauseSection.findAll({where:{parent_id:termsubsections[k].toWeb().id,type:1,level:'subsubsection'}}));  
            if(err) return ReE(res, err, 422);
            for(let p in termsubsubsections){

                let termSubSubJson = {};
                termSubSubJson.parent_id    = termsubsection.toWeb().id;
                termSubSubJson.type         = 1; 
                termSubSubJson.level        = 'subsubsection'
                termSubSubJson.heading      = termsubsubsections[p].toWeb().heading;
                termSubSubJson.content      = termsubsubsections[p].toWeb().content;
                termSubSubJson.ordering     = 0;
                termSubSubJson.created_by   = termsubsubsections[p].toWeb().created_by;  
                [err, termsubsubsection] = await to(TermAndClauseSection.create(termSubSubJson));   
                [err, termsubsubsection] = await to(termsubsubsection.save());
                [err, termsectionupdate] = await to(TermAndClauseSection.update({ordering:termsubsubsection.toWeb().id},{where:{id:termsubsubsection.toWeb().id}}));    
            }
        }
    }
    return ReS(res, { message: "Term is Copied successfully "}); 
}
module.exports.copyTerm = copyTerm;

const getTermNumber = async function(req, res){ 
    let err, term;
    [err, term] = await to(Terms.max('version',{where : {created_by:req.user.id }}));  
    return ReS(res, {term:term}, 201); 
}
module.exports.getTermNumber = getTermNumber;

const publishTerm = async function(req, res){ 
    let err, term,allDeeds; 
    [err, getTerm] = await to(Terms.findByPk(req.body.termId));
    let getTermData = getTerm.toWeb();
    [err, term] = await to(Terms.update({ status:2 },{ where: {version:getTermData.version}}));
    [err, term] = await to(Terms.update({ status:1 },{ where: {id: req.body.termId}}));
    // [err, deed] = await to(Deeds.update({ term_version:req.body.termId },{ where: {created_by: req.user.id}}));
   
    [err, allDeeds] = await to(Deeds.findAll({ where: {created_by: req.user.id,term_version:getTermData.version}}));
    for( var k in allDeeds){
        var deedTemp =allDeeds[k].toWeb();
        let deedUserObj = {};
        deedUserObj.deed_id = deedTemp.id;
        deedUserObj.type    = 'Updated Terms Version';
        deedUserObj.title   = 'Updated Terms Version';
        deedUserObj.old     = '--';
        deedUserObj.new     = term.title;  
        deedUserObj.updated_by = req.user.id;
        deedUserObj.note = '---'; 
        console.log("here") ;
        [err, deedhistory] = await to(Deedhistory.create(deedUserObj)); 
        [err, deedhistory] = await to(deedhistory.save());
        [err, approve] = await to(Deedusers.update({is_approve:0},{where:{deed_id:deedTemp.id}}));
        console.log("approve ",approve) ;
    }
    // PDFController.generatepdf(deed.toWeb().id) ;
    if(err) return ReE(res, err, 422);
    return ReS(res, {message:'Term published successfully.'}); 
}
module.exports.publishTerm = publishTerm;

const updateOrderTerm = async function(req, res){ 
    let err, clause; 
    let term_info = req.body.term_info;
    for(let i in term_info.termsections){
        term_info.termsections[i].ordering = i;
        [err, termsectionupdateorder] = await to(TermAndClauseSection.update({ ordering:parseInt(i)+1 },{ where: {id:term_info.termsections[i].termsection.id}}));
        for(let p in term_info.termsections[i].termsubsections){
            [err, termsectionupdateorder] = await to(TermAndClauseSection.update({ ordering:parseInt(p)+1 },{ where: {id:term_info.termsections[i].termsubsections[p].termsubsection.id}}));
            for(let k in term_info.termsections[i].termsubsections[p].termsubsubsection){
                [err, termsectionupdateorder] = await to(TermAndClauseSection.update({ ordering:parseInt(k)+1 },{ where: {id:term_info.termsections[i].termsubsections[p].termsubsubsection[k].id}}));
            }
        }
    } 
    return ReS(res, {message:'Clause reorder successfully.'}); 
}
module.exports.updateOrderTerm = updateOrderTerm;