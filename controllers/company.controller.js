const { Company,CompanyAdmin,CompanyDirector } = require('../models');
const PDFController 	          = require('../controllers/pdf.controller');
const userService = require("../services/user.service");
const { to, ReE, ReS } = require('../services/util.service');
const Sequelize = require('sequelize');
const Op = Sequelize.Op

const createDPCompany = async function(req, res){
    let err, company;
    let user = req.user;  
    let company_info = req.body.company; 
    company_info.latitude = 0;
    company_info.longitude = 0;
    company_info.is_active = 1;
    company_info.remove_by_admin = 0;
    [err, company] = await to(Company.create(company_info));
    if(err) return ReE(res, err, 422);
    [err, company] = await to(company.save());
    if(err) return ReE(res, err, 422);

    let company_json = company.toWeb();
    let companyAdmin = {};  
    companyAdmin.company_id = company_json.id;
    companyAdmin.user_id    = company_info.admin_id;
    [err, company_admin] = await to(CompanyAdmin.create(companyAdmin));
    if(err) return ReE(res, err, 422);
    [err, company_admin] = await to(company_admin.save());
    if(err) return ReE(res, err, 422);    

    return ReS(res, {company:company_json}, 201);
}
module.exports.createDPCompany = createDPCompany;


const createCustomerCompany = async function(req, res){
    let err, company;
    let user = req.user;  
    let company_info = req.body.company; 
    company_info.latitude = 0;
    company_info.longitude = 0;
    company_info.is_active = 1;
    company_info.remove_by_admin = 0;
    [err, company] = await to(Company.create(company_info));
    if(err) return ReE(res, err, 422);
    [err, company] = await to(company.save());
    if(err) return ReE(res, err, 422);

    let company_json = company.toWeb();
    for(let i in company_info.customers_id){
        let comapnyDir = {};
        comapnyDir.company_id = company_json.id;
        comapnyDir.user_id    = company_info.customers_id[i];
        comapnyDir.created_by    = user.id;
        [err, companyDirector] = await to(CompanyDirector.create(comapnyDir));
        if(err) return ReE(res, err, 422);
        [err, companyDirector] = await to(companyDirector.save());
        if(err) return ReE(res, err, 422);    
    }

    return ReS(res, {company:company_json}, 201);
}
module.exports.createCustomerCompany = createCustomerCompany;

const getAll = async function(req, res){ 
    let user = req.user; 
    let err, companies = []; 

    /* Code for Pagination */
    let limit = 10;   // number of records per page
    let offset = 0;    
    let page = req.body.page;      // page number
    let order_by = req.body.order_by;  
    let order_by_ASC_DESC = req.body.order_by_ASC_DESC;    
    offset = limit * (page - 1); 
    let query = req.body.q; 
    let totalCount,pages;
    /* End code for Pagination */

    if(user.user_type == 1){

        let countallCompanies = await to(Company.findAndCountAll({where:{isArchived:0}})); 
        totalCount = countallCompanies[1].count; 
        pages = Math.ceil(totalCount / limit);
        if(query.trim() != "") {  
            [err, companies] = await to(Company.findAll({
                where : {[Op.or] : {company_name:{ [Op.like]: '%'+query.trim()+'%' },company_number:{ [Op.like]: '%'+query.trim()+'%' }},isArchived:0}, 
                limit: limit,
                offset: offset,
                order: [[order_by, order_by_ASC_DESC]]
            }));
            pages = (companies.length > 0) ?  Math.ceil(companies.length / limit) : 1;
            totalCount = (companies.length > 0) ? companies.length : 1;
        } else { 
            [err, companies] = await to(Company.findAll({
                where : {isArchived:0}, 
                limit: limit,
                offset: offset,
                order: [[order_by, order_by_ASC_DESC]]
            }));
        }    
    } else { 

        [err, company_directors] = await to( CompanyDirector.aggregate('company_id', 'DISTINCT', {plain: false,where:{created_by:user.id}}));
        let companyArr = [];
        if(query.trim() != "") {
            for(let i in company_directors){ 
                companyArr.push(company_directors[i].DISTINCT); 
            }

            [err, companies] = await to(Company.findAll({
                where: {id:{[Op.in] : companyArr},isArchived:0,
                    [Op.or] : {
                            company_name:{ [Op.like]: '%'+query.trim()+'%' },
                            company_number:{ [Op.like]: '%'+query.trim()+'%' }
                        }
                    },
                limit: limit,
                offset: offset,    
                order: [[order_by, order_by_ASC_DESC]]
            }));
            

        } else { 
            for(let i in company_directors){
                companyArr.push(company_directors[i].DISTINCT); 
            }
            [err, companies] = await to(Company.findAll({
                    where: {
                        id:{[Op.in] : companyArr},isArchived:0
                    },
                    limit: limit,
                    offset: offset,
                    order: [[order_by, order_by_ASC_DESC]]
                }
            )); 
        } 
        let countallCompanies = companies.length; 
        totalCount = countallCompanies;
        pages = Math.ceil(totalCount / limit); 
        // let companiesReturn =[] ;  
        // for(let i = page*limit-limit;i<page*limit;i++){ 
        //     companiesReturn.push(companies[i]) ;
        // } 
        // companies = companiesReturn;
    }
    let companies_json =[]
    for( let i in companies){
        let company = companies[i];  
        if(company != null){
            let company_info = company.toWeb();
            let userData;
            if(company_info.company_type == 1){
                userData = await userService.getAdminCountByID(company_info.id); 
            } else if(company_info.company_type == 2){
                userData = await userService.getDirectorsCountByID(company_info.id); 
            }
            company_info.count = userData.count;  
            companies_json.push(company_info);
        }
    }
    return ReS(res, {companies:companies_json,'count': totalCount, 'pages': pages});
}
module.exports.getAll = getAll;

const getListOfArchivedCompanies = async function(req, res){ 
    let user = req.user; 
    let err, companies = []; 

    /* Code for Pagination */
    let limit = 10;   // number of records per page
    let offset = 0;    
    let page = req.body.page;      // page number
    let order_by = req.body.order_by;  
    let order_by_ASC_DESC = req.body.order_by_ASC_DESC;    
    offset = limit * (page - 1); 
    let query = req.body.q; 
    let totalCount,pages;
    /* End code for Pagination */

    if(user.user_type == 1){

        let countallCompanies = await to(Company.findAndCountAll({where:{isArchived:1}})); 
        totalCount = countallCompanies[1].count; 
        pages = Math.ceil(totalCount / limit);
        if(query.trim() != "") {  
            [err, companies] = await to(Company.findAll({
                where : {[Op.or] : {company_name:{ [Op.like]: '%'+query.trim()+'%' },company_number:{ [Op.like]: '%'+query.trim()+'%' }},isArchived:1}, 
                limit: limit,
                offset: offset,
                order: [[order_by, order_by_ASC_DESC]]
            }));
            pages = (companies.length > 0) ?  Math.ceil(companies.length / limit) : 1;
            totalCount = (companies.length > 0) ? companies.length : 1;
        } else { 
            [err, companies] = await to(Company.findAll({
                where : {isArchived:1}, 
                limit: limit,
                offset: offset,
                order: [[order_by, order_by_ASC_DESC]]
            }));
        }    
    } else { 

        [err, company_directors] = await to( CompanyDirector.aggregate('company_id', 'DISTINCT', {plain: false,where:{created_by:user.id}}));
        let companyArr = [];
        if(query.trim() != "") {
            for(let i in company_directors){ 
                companyArr.push(company_directors[i].DISTINCT); 
            }

            [err, companies] = await to(Company.findAll({
                where: {id:{[Op.in] : companyArr},isArchived:1,
                    [Op.or] : {
                            company_name:{ [Op.like]: '%'+query.trim()+'%' },
                            company_number:{ [Op.like]: '%'+query.trim()+'%' }
                        }
                    },
                limit: limit,
                offset: offset,    
                order: [[order_by, order_by_ASC_DESC]]
            }));
            

        } else { 
            for(let i in company_directors){
                companyArr.push(company_directors[i].DISTINCT); 
            }
            [err, companies] = await to(Company.findAll({
                    where: {
                        id:{[Op.in] : companyArr},isArchived:1
                    },
                    limit: limit,
                    offset: offset,
                    order: [[order_by, order_by_ASC_DESC]]
                }
            )); 
        } 
        let countallCompanies = companies.length; 
        totalCount = countallCompanies;
        pages = Math.ceil(totalCount / limit); 
        // let companiesReturn =[] ;  
        // for(let i = page*limit-limit;i<page*limit;i++){ 
        //     companiesReturn.push(companies[i]) ;
        // } 
        // companies = companiesReturn;
    }
    let companies_json =[]
    for( let i in companies){
        let company = companies[i];  
        if(company != null){
            let company_info = company.toWeb();
            let userData;
            if(company_info.company_type == 1){
                userData = await userService.getAdminCountByID(company_info.id); 
            } else if(company_info.company_type == 2){
                userData = await userService.getDirectorsCountByID(company_info.id); 
            }
            company_info.count = userData.count;  
            companies_json.push(company_info);
        }
    }
    return ReS(res, {companies:companies_json,'count': totalCount, 'pages': pages});
}
module.exports.getListOfArchivedCompanies = getListOfArchivedCompanies;

const getAllSystemCompanies = async function(req, res){ 

    let user = req.user; 
    let err, companies = [];  
    if(user.user_type == 1){         
        [err, companies] = await to(Company.findAll({}));  
    } else { 
        [err, company_directors] = await to( CompanyDirector.aggregate('company_id', 'DISTINCT', {plain: false,where:{created_by:user.id}})); 
        for(let i in company_directors){
            [err, company] = await to(Company.findOne({where: {id:company_directors[i].DISTINCT} }));   
            companies.push(company);
        }
    }
    let companies_json =[]
    for( let i in companies){
        let company = companies[i];  
        if(company != null){
            let company_info = company.toWeb();
            let userData;
            if(company_info.company_type == 1){
                userData = await userService.getAdminCountByID(company_info.id); 
            } else if(company_info.company_type == 2){
                userData = await userService.getDirectorsCountByID(company_info.id); 
            }
            company_info.count = userData.count;  
            companies_json.push(company_info);
        }
    }
    return ReS(res, {companies:companies_json}); 
}
module.exports.getAllSystemCompanies = getAllSystemCompanies;

const getCompanyDetail = async function(req, res){ 
    let err, company,userData;  
    [err, company] = await to(Company.findById(req.body.id));  
    if(err){return ReE(res, err);}     
    if(company != null){
        let company_info = company.toWeb(); 
        if(company_info.company_type == 1){
            userData = await userService.getlistofAllAdminIds(company_info.id); 
        } else if(company_info.company_type == 2){
            userData = await userService.getlistofAllDirectorsIds(company_info.id);
        } 
        let companies_Obj ={}
        companies_Obj.company   = company.toWeb();
        companies_Obj.user      = userData;   
        return ReS(res, {company:companies_Obj});
    } else {
        err = "Company id is not exist!";
        return ReE(res, err);
    }
}
module.exports.getCompanyDetail = getCompanyDetail;

const update = async function(req, res) {
    let err, company, data; 
    data = req.body.company;
    let user = req.user;
    [err, company] = await to(userService.getCompanyById(data.id));
    if (err) return ReE(res, err, 422);  
    company.set(data);
    [err, company] = await to(company.save());
    
    if(data.company_type == 1){

        let removeAdmins =  await to(userService.removeAllAdminOfAssCompany(data.id));
        for(let i in data.admin_id){
            let comapnyDir = {};
            comapnyDir.company_id = data.id;
            comapnyDir.user_id    = data.admin_id[i];
            [err, companyAdmin] = await to(CompanyAdmin.create(comapnyDir));
            if(err) return ReE(res, err, 422);
            [err, companyAdmin] = await to(companyAdmin.save());
            if(err) return ReE(res, err, 422);    
        }

    } else if(data.company_type == 2){
        let removeDirectors =  await to(userService.removeAllDirectorsOfAssCompany(data.id));
        for(let i in data.customers_id){
            let comapnyDir = {};
            comapnyDir.company_id   = data.id;
            comapnyDir.user_id      = data.customers_id[i];
            comapnyDir.created_by   = user.id;
            [err, companyDirector]  = await to(CompanyDirector.create(comapnyDir));
            if(err) return ReE(res, err, 422);
            [err, companyDirector] = await to(companyDirector.save());
            if(err) return ReE(res, err, 422);    
        }
    }
    if (err)return ReE(res, 'Error in updating company');
    return ReS(res, { message: "Updated company successfully."});
}
module.exports.update = update;

const remove = async function(req, res){
    let company, err;
    company = req.company;
    [err, company] = await to(company.destroy());
    if(err) return ReE(res, 'error occured trying to delete the company');
    return ReS(res, {message:'Deleted Company'}, 204);
}
module.exports.remove = remove;

const getUserCompanies = async function(req, res){ 
    let err, companies = [];
    let user = req.user;

    [err, company_directors] = await to(CompanyDirector.findAll({where:{created_by:user.id}}));
    for(let i in company_directors){
        [err, company] = await to(Company.findOne({where: {id:company_directors[i].company_id} }));   
        companies.push(company);
    }     

    let companies_json =[]
    for( let i in companies){
        let company = companies[i];  
        let company_info = company.toWeb();
        let userData;
        if(company_info.company_type == 1){
            userData = await userService.getAdminCountByID(company_info.id); 
        } else if(company_info.company_type == 2){
            userData = await userService.getDirectorsCountByID(company_info.id); 
        }
        company_info.count = userData.count;  
        companies_json.push(company_info);
    } 
    return ReS(res, {company:companies_json});
}
module.exports.getUserCompanies = getUserCompanies;

const getListOfDirectors = async function(req, res){ 
    let err, listOfDirectors, company;
    [err, company] = await to(Company.findOne({where: {id:req.body.company_id} }));  
    if(err){return ReE(res, err);}  
    if(company.toWeb().company_type == 1){ 
        listOfDirectors =  await userService.getlistofAllAdminIds(req.body.company_id); 
    } else if(company.toWeb().company_type == 2){
        listOfDirectors = await userService.getlistofAllDirectorsIds(req.body.company_id); 
    }   
    let directors_json =[];
    for( let i in listOfDirectors){ 
        let userData = await userService.getUserById(listOfDirectors[i]);  
        if(userData != null){
            let directors_info = userData.toWeb()
            directors_json.push(directors_info);
        }
    }  
    return ReS(res, {company:company,listOfDirectors:directors_json});
}
module.exports.getListOfDirectors = getListOfDirectors;

const getMyCompany = async function(req, res){ 
    let err, companies = [];
        [err, company_admins] = await to(CompanyAdmin.findAll({where:{user_id:req.body.id}}));
    for(let i in company_admins){
        [err, company] = await to(Company.findOne({where: {id:company_admins[i].company_id} }));
        companies.push(company);
    }     

    let companies_json =[]
    for( let i in companies){
        let company = companies[i];  
        let company_info = company.toWeb();
        let userData;
        if(company_info.company_type == 1){
            userData = await userService.getAdminCountByID(company_info.id); 
        } else if(company_info.company_type == 2){
            userData = await userService.getDirectorsCountByID(company_info.id); 
        }
        company_info.count = userData.count;  
        companies_json.push(company_info);
    } 
    return ReS(res, {company:companies_json});
}
module.exports.getMyCompany = getMyCompany;

const getMyCompanyAdmins = async function(req, res){ 
    let err, company ,company_id,temp;
    [err, temp] = await to(CompanyAdmin.findOne({where: {user_id:req.user.id} }));  
    if(temp != null){
    company_id = temp.toWeb().company_id ;
    [err, company] = await to(Company.findOne({where: {id:company_id} }));  
    if(err){
        return ReE(res, err);
    }  
    if(company != null){
        if(company.toWeb().company_type == 1){ 
            listOfDirectors =  await userService.getlistofAllAdminIds(company_id); 
        } else if(company.toWeb().company_type == 2){
            listOfDirectors = await userService.getlistofAllDirectorsIds(company_id); 
        }   
        let comp = {} ;
        comp.company = company ;
        comp.listOfDirectors =[] ;
        for(var k in listOfDirectors){
            comp.listOfDirectors.push(listOfDirectors[k]) ;
        }
        return ReS(res, {company:comp});

    } else {
        return ReS(res, {company:'No Company'});
    }
    } else {
        return ReS(res, {company:'No Company'});
    }
    
}
module.exports.getMyCompanyAdmins = getMyCompanyAdmins;




const makeUnarchivedCompanies = async function(req, res){ 
    let err, company;
    let body = req.body.companyIds;
    for(let i in body){
        [err, company] = await to(Company.update({ isArchived:0 },{ where: {id: body[i]}}));
    }
    return ReS(res, {message:'Done'});    
}
module.exports.makeUnarchivedCompanies = makeUnarchivedCompanies;

const makeArchivedCompanies = async function(req, res){ 
    let err, company;
    let body = req.body.companyIds;
    for(let i in body){
        [err, company] = await to(Company.update({ isArchived:1 },{ where: {id: body[i]}}));
    }
    return ReS(res, {message:'Done'});    
}
module.exports.makeArchivedCompanies = makeArchivedCompanies;

 