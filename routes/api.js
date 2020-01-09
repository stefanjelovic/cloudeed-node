
const bodyParser 	= require('body-parser');
const express 		= require('express');
const router 			= express.Router();

const UserController 	          = require('../controllers/user.controller');
const CompanyController         = require('../controllers/company.controller');
const TermsController           = require('../controllers/terms.controller');
const HomeController 	          = require('../controllers/home.controller');
const ClausesController 	      = require('../controllers/clauses.controller');
const SectionsController 	      = require('../controllers/sections.controller');
const SubSectionsController 	  = require('../controllers/subsections.controller');
const SubSubSectionsController 	= require('../controllers/subsubsections.controller');
const TermSectionsController 	  = require('../controllers/termsections.controller');
const TermSubSectionsController 	  = require('../controllers/termsubsections.controller');
const TermSubSubSectionsController 	= require('../controllers/termsubsubsections.controller');
const PDFController 	          = require('../controllers/pdf.controller');
const DeedController 	          = require('../controllers/deeds.controller');
const MinuteTemplateController  = require('../controllers/minutetemplate.controller');
const FeatureUpdateController   = require('../controllers/featureupdate.controller');
const multer = require('multer');

const custom 	        = require('./../middleware/custom');
const passport      	= require('passport');
const path            = require('path');  

var storage = multer.diskStorage({destination:function(req,file,cb){
  cb(null,'public/uploads') ;
},
filename:function(req,file,cb){
  cb(null,Date.now()+file.originalname) ;
}})
var upload = multer({storage:storage} ) ; 

require('./../middleware/passport')(passport)
/* GET home page. */
router.get('/', function(req, res, next) {
  res.json({status:"success", message:"Server is running...", data:{"version_number":"v1.0.0"}})
});

//********* COMMON API's **********
router.post(    '/login',                   UserController.login);
router.post(    '/forgetpassword',          UserController.forgetPassword);
router.post(    '/resetpasswordapplied',    UserController.getPasswordApplied);
router.post(    '/adduser',                 UserController.signup);   
router.post(     '/user/active',      UserController.activeRegisteredUser);

//********* USER CRUD **********
router.post(    '/users/adduserbyadmin',            passport.authenticate('jwt', {session:false}), UserController.createUser);
router.post(    '/uploadattachment',                upload.any(), UserController.uploadCommonAttachemnt);
router.post(    '/users/listofdeedprovidersusers',  passport.authenticate('jwt', {session:false}), UserController.listOfDeedProvidersUsers);   
router.post(    '/users/profile',                   passport.authenticate('jwt', {session:false}), UserController.setProfile);        
router.post(    '/users/all',                       passport.authenticate('jwt', {session:false}), UserController.getAllUsers); 
router.post(    '/users/allsystemusers',            passport.authenticate('jwt', {session:false}), UserController.getAllSystemUsers);       
router.post(    '/users/userdetail',                passport.authenticate('jwt', {session:false}), UserController.getUserDetail);     
router.post(    '/users/updateuserdetail',          passport.authenticate('jwt', {session:false}), UserController.update);     
router.post(    '/users/remove',                     passport.authenticate('jwt', {session:false}), UserController.remove);  
router.post(    '/users/changestatus',              passport.authenticate('jwt', {session:false}), UserController.changeStatus);     
router.post(    '/users/changepassword',            passport.authenticate('jwt', {session:false}), UserController.changePassword);  
router.post(    '/users/archiveuser',               passport.authenticate('jwt', {session:false}), UserController.archiveUsers);  //*


router.post(    '/listofarchiveduser',   passport.authenticate('jwt', {session:false}), UserController.getListOfArchivedUsers);  
router.post(    '/makeunarchiveduser',     passport.authenticate('jwt', {session:false}), UserController.makeUnarchivedUsers); 
router.post(    '/makearchiveduser',       passport.authenticate('jwt', {session:false}), UserController.makeArchivedUsers);  

//********* COMPANY CRUD **********
router.post(    '/companybyuser',                 passport.authenticate('jwt', {session:false}), CompanyController.getMyCompany);
router.post(    '/mycompanyadmins',           passport.authenticate('jwt', {session:false}), CompanyController.getMyCompanyAdmins); 
router.post(    '/usercompanies',             passport.authenticate('jwt', {session:false}), CompanyController.getUserCompanies);  
router.post(    '/adddeedprovidercompany',    passport.authenticate('jwt', {session:false}), CompanyController.createDPCompany);  
router.post(    '/addcustomercompany',        passport.authenticate('jwt', {session:false}), CompanyController.createCustomerCompany);                               
router.post(    '/companies/all',             passport.authenticate('jwt', {session:false}), CompanyController.getAll); 
router.post(    '/companies/allsystemcompanies', passport.authenticate('jwt', {session:false}), CompanyController.getAllSystemCompanies);                               
router.post(    '/companiesdetail',           passport.authenticate('jwt', {session:false}), CompanyController.getCompanyDetail);     
router.post(    '/companies/updatecompany',   passport.authenticate('jwt', {session:false}), CompanyController.update);
router.delete(  '/companies/:company_id',     passport.authenticate('jwt', {session:false}), custom.company, CompanyController.remove);
router.post(    '/listofdirectors',           passport.authenticate('jwt', {session:false}), CompanyController.getListOfDirectors);  

router.post(    '/listofarchivedcompany',     passport.authenticate('jwt', {session:false}), CompanyController.getListOfArchivedCompanies);  
router.post(    '/makeunarchivedcompany',     passport.authenticate('jwt', {session:false}), CompanyController.makeUnarchivedCompanies); 
router.post(    '/makearchivedcompany',       passport.authenticate('jwt', {session:false}), CompanyController.makeArchivedCompanies);  

//********* TERM CRUD **********
router.post(    '/listofallterms',        passport.authenticate('jwt', {session:false}), TermsController.getListOfAllTerms);  
router.post(    '/listofcompanyterms',    passport.authenticate('jwt', {session:false}), TermsController.getListOfCompaniesTerms);  
router.post(    '/addterms',              passport.authenticate('jwt', {session:false}), TermsController.createTerm);    
router.post(    '/termsdetails',          passport.authenticate('jwt', {session:false}), TermsController.getTermsDetails);                               
router.post(    '/updateterms',           passport.authenticate('jwt', {session:false}), TermsController.updateTerm);   
router.post(    '/gettermnumber',         passport.authenticate('jwt', {session:false}), TermsController.getTermNumber); 
router.post(    '/publishterm',           passport.authenticate('jwt', {session:false}), TermsController.publishTerm); 
router.post(    '/copyterm',              passport.authenticate('jwt', {session:false}), TermsController.copyTerm); 
router.post(    '/updateorderterm',       passport.authenticate('jwt', {session:false}), TermsController.updateOrderTerm);
router.post(    '/removeterms',           passport.authenticate('jwt', {session:false}), TermsController.deleteTerm);

//********* Section CRUD ********** 
router.post(    '/addtermsection',            passport.authenticate('jwt', {session:false}), TermSectionsController.createTermSection);   
router.post(    '/termsectiondetails',        passport.authenticate('jwt', {session:false}), TermSectionsController.getTermSectionDetails);                               
router.post(    '/updatetermsection',         passport.authenticate('jwt', {session:false}), TermSectionsController.updateTermSection);   
router.post(    '/removetermsection',         passport.authenticate('jwt', {session:false}), TermSectionsController.deleteTermSection);
 
//********* Sub Section CRUD ********** 
router.post(    '/addtermsubsection',            passport.authenticate('jwt', {session:false}), TermSubSectionsController.createTermSubSections);   
router.post(    '/termsubsectiondetails',        passport.authenticate('jwt', {session:false}), TermSubSectionsController.getTermSubSectionDetails);                               
router.post(    '/updatetermsubsection',         passport.authenticate('jwt', {session:false}), TermSubSectionsController.updateTermSubSection);   
router.post(    '/removetermsubsection',         passport.authenticate('jwt', {session:false}), TermSubSectionsController.deleteTermSubSection);

//********* Sub Sub Section CRUD ********** 
router.post(    '/addtermsubsubsection',            passport.authenticate('jwt', {session:false}), TermSubSubSectionsController.createTermSubSubSections);   
router.post(    '/termsubsubsectiondetails',        passport.authenticate('jwt', {session:false}), TermSubSubSectionsController.getTermSubSubSectionDetails);                               
router.post(    '/updatetermsubsubsection',         passport.authenticate('jwt', {session:false}), TermSubSubSectionsController.updateTermSubSubSection);   
router.post(    '/removetermsubsubsection',         passport.authenticate('jwt', {session:false}), TermSubSubSectionsController.deleteTermSubSubSection);

//********* CLAUSES CRUD **********
router.post(    '/listofallclauses',      passport.authenticate('jwt', {session:false}), ClausesController.getListOfAllClauses); 
router.post(    '/listofcompanyclauses',  passport.authenticate('jwt', {session:false}), ClausesController.getListOfCompaniesClauses);  
router.post(    '/addclauses',            passport.authenticate('jwt', {session:false}), ClausesController.createClauses);   
router.post(    '/clausesdetails',        passport.authenticate('jwt', {session:false}), ClausesController.getClausesDetails);                               
router.post(    '/updateclauses',         passport.authenticate('jwt', {session:false}), ClausesController.updateClauses);   
router.post(    '/removeclauses',         passport.authenticate('jwt', {session:false}), ClausesController.deleteClauses); 
router.post(    '/copyclauses',           passport.authenticate('jwt', {session:false}), ClausesController.copyClauses); 
router.post(    '/getclausenumber',       passport.authenticate('jwt', {session:false}), ClausesController.getClauseNumber); 
router.post(    '/publishclause',         passport.authenticate('jwt', {session:false}), ClausesController.publishClause); 
router.post(    '/updateorderclause',     passport.authenticate('jwt', {session:false}), ClausesController.updateOrderClause); 
router.post(    '/listofsectionsubsections',           passport.authenticate('jwt', {session:false}), ClausesController.listOfSectionSubsections);   

//********* Section CRUD ********** 
router.post(    '/addsection',            passport.authenticate('jwt', {session:false}), SectionsController.createSection);   
router.post(    '/sectiondetails',        passport.authenticate('jwt', {session:false}), SectionsController.getSectionDetails);                               
router.post(    '/updatesection',         passport.authenticate('jwt', {session:false}), SectionsController.updateSection);   
router.post(    '/removesection',         passport.authenticate('jwt', {session:false}), SectionsController.deleteSection);

//********* Sub Section CRUD ********** 
router.post(    '/addsubsection',            passport.authenticate('jwt', {session:false}), SubSectionsController.createSubSections);   
router.post(    '/subsectiondetails',        passport.authenticate('jwt', {session:false}), SubSectionsController.getSubSectionDetails);                               
router.post(    '/updatesubsection',         passport.authenticate('jwt', {session:false}), SubSectionsController.updateSubSection);   
router.post(    '/removesubsection',         passport.authenticate('jwt', {session:false}), SubSectionsController.deleteSubSection);

//********* Sub Sub Section CRUD ********** 
router.post(    '/addsubsubsection',            passport.authenticate('jwt', {session:false}), SubSubSectionsController.createSubSubSections);   
router.post(    '/subsubsectiondetails',        passport.authenticate('jwt', {session:false}), SubSubSectionsController.getSubSubSectionDetails);                               
router.post(    '/updatesubsubsection',         passport.authenticate('jwt', {session:false}), SubSubSectionsController.updateSubSubSection);   
router.post(    '/removesubsubsection',         passport.authenticate('jwt', {session:false}), SubSubSectionsController.deleteSubSubSection);
 
//********* Deed CRUD ********** 

router.post(    '/listofalldeeds',        passport.authenticate('jwt', {session:false}), DeedController.getListOfAllDeeds);   
router.post(    '/listofdeeds',           passport.authenticate('jwt', {session:false}), DeedController.getListOfDeeds);   
router.post(    '/adddeed',               passport.authenticate('jwt', {session:false}), DeedController.createDeed);   
router.post(    '/getrefnumber',          passport.authenticate('jwt', {session:false}), DeedController.getRefNumber);   
router.post(    '/deeddetails',           passport.authenticate('jwt', {session:false}), DeedController.getDeedDetails);       
router.post(    '/singlehistory',         passport.authenticate('jwt', {session:false}), DeedController.getSingleHistoryData);       
router.post(    '/updatedeed',            passport.authenticate('jwt', {session:false}), DeedController.updateDeed);    
router.post(    '/changedeedstatus',      passport.authenticate('jwt', {session:false}), DeedController.changeStatusOfDeed);
router.post(    '/sendreminder',          passport.authenticate('jwt', {session:false}), DeedController.sendRemiderForDeed);    
router.post(    '/sendapprovalreminder',  passport.authenticate('jwt', {session:false}), DeedController.sendApprovalReminder);
router.post(    '/listofacknowledgementusersofdeed',  passport.authenticate('jwt', {session:false}), DeedController.listOfAcknowledgementUsersOfDeed);
router.post(    '/adddeednote',           passport.authenticate('jwt', {session:false}), DeedController.addDeedNote);
router.post(    '/getdeednote',           passport.authenticate('jwt', {session:false}), DeedController.getDeedNote);
router.post(    '/getdeeddetailsforpdf',  DeedController.getDeedDetailsForPDF);
router.post(    '/filterhistory',         passport.authenticate('jwt', {session:false}), DeedController.filterHistory);  
router.post(    '/adddeedattachment',     passport.authenticate('jwt', {session:false}),upload.any(), DeedController.uploadDeedAttachemnt);
router.post(    '/removedeedattachment',  passport.authenticate('jwt', {session:false}), DeedController.removeDeedAttachemnt);
    

/* Stack holder section */
router.post(    '/listofassigneddeeds',     passport.authenticate('jwt', {session:false}), DeedController.listOfAssignedDeeds);
router.post(    '/listofmyupdatedddeeds',   passport.authenticate('jwt', {session:false}), DeedController.listOfMyUpdatedDeeds);
router.post(    '/listofmyupdatedddeedssh',       passport.authenticate('jwt', {session:false}), DeedController.listOfMyUpdatedDeedsForStackHolder);
router.post(    '/listofmychangesindeeds',        passport.authenticate('jwt', {session:false}), DeedController.listOfMyChangesInDeeds);
router.post(    '/acknowledgementbystackholder',  passport.authenticate('jwt', {session:false}), DeedController.acknowledgementByStackholder); // Call by mobile when SH open deed.
router.post(    '/approvalbystackholder',   passport.authenticate('jwt', {session:false}), DeedController.approvalByStackholder); // Call by mobile when SH open deed.
router.get(     '/generatepdf/:id',         PDFController.generatepdf); // Call by mobile when SH open deed.

/* Template CRUD section */
router.post(    '/listofalltemplates',    passport.authenticate('jwt', {session:false}), MinuteTemplateController.getListOfAllTempaltes);
router.post(    '/listofactivetemplates', passport.authenticate('jwt', {session:false}), MinuteTemplateController.listOfallTemplatePopUp); 
router.post(    '/addtemplate',           passport.authenticate('jwt', {session:false}), MinuteTemplateController.addMinuteTemplate); 
router.post(    '/detailtemplate',        passport.authenticate('jwt', {session:false}), MinuteTemplateController.getDetailMinuteTemplate); 
router.post(    '/deletetemplate',        passport.authenticate('jwt', {session:false}), MinuteTemplateController.removeMinuteTemplate); 
router.post(    '/publishtemplate',       passport.authenticate('jwt', {session:false}), MinuteTemplateController.publishMinuteTemplate); 
router.post(    '/copytemplate',          passport.authenticate('jwt', {session:false}), MinuteTemplateController.copyMinuteTemplate); 
router.post(    '/updatetemplate',        passport.authenticate('jwt', {session:false}), MinuteTemplateController.updateMinuteTemplate); 
router.post(    '/addminute',             passport.authenticate('jwt', {session:false}), MinuteTemplateController.addMinute); 


router.post(    '/featureupdate/all',             passport.authenticate('jwt', {session:false}), FeatureUpdateController.getAll); 
router.post(    '/featureupdate/getfeaturebyId',             passport.authenticate('jwt', {session:false}), FeatureUpdateController.getFeatureById); 
router.delete(  '/featureupdate/:id',     passport.authenticate('jwt', {session:false}), custom.company, FeatureUpdateController.deleteFeatureUpdate);
router.post(    '/featureupdate/activedeactive',             passport.authenticate('jwt', {session:false}), FeatureUpdateController.activeDeactive); 
router.post(    '/featureupdate/viewfeature',             passport.authenticate('jwt', {session:false}), FeatureUpdateController.viewFeature); 

router.post(    '/featureupdate/addfeature',             passport.authenticate('jwt', {session:false}), FeatureUpdateController.addFeature);
router.post(    '/featureupdate/editfeature',             passport.authenticate('jwt', {session:false}), FeatureUpdateController.EditFeature);
router.get(    '/featureupdate/fetchdatadeedpandstackh',             passport.authenticate('jwt', {session:false}), FeatureUpdateController.fetchDataDeedpandStackh);
router.get(    '/featureupdate/getgiftlist',              FeatureUpdateController.getGiftList);
router.get(    '/featureupdate/getfeaturegiftlist',             passport.authenticate('jwt', {session:false}),  FeatureUpdateController.getFeatureGiftList);



router.get('/dash', passport.authenticate('jwt', {session:false}),HomeController.Dashboard)

module.exports = router; 


