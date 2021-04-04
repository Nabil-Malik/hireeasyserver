var express = require('express');
var router = express.Router();

const md5 = require('blueimp-md5')
const {UserModel, ChatModel,JobModel,ReportModel} = require('../db/models')
const filter = {password: 0, __v: 0} // Specify the properties of the filter

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: ' Hire Easy Express Server' });    
});

// Registered route
router.post('/register', function (req, res) {
  // Read request parameter data
  const {username, password, type} = req.body
  // Processing: Determine whether the user already exists, if it exists, return an error message, if it does not exist, save
    // Query (according to username)
  UserModel.findOne({username}, function (err, user) {
    // If user has a value (already exists)
    if(user) {
      //Return the error message
      res.send({code: 1, msg: 'This user already exists'})
    } else { 
      
      new UserModel({username, type, password:md5(password)}).save(function (error, user) {

        // Generate a cookie (userid: user._id), and give it to the browser to save
        res.cookie('userid', user._id, {maxAge: 1000*60*60*24})
        // Return json data containing user
        const data = {username, type, _id: user._id} // Do not carry password in the response data
        res.send({code: 0, data})
      })
    }
  })
  // Return response data
})

// Login route
router.post('/login', function (req, res) {
  const {username, password} = req.body
  if(username=='admin'&&password=='password'){
    res.send({code:3,data:{type:'admin'}})
  }
  else{
    // Query the database users based on username and password, if not, return an error message, if yes, return a login success message (including user)
    UserModel.findOne({username, password:md5(password)}, filter, function (err, user) {
      if(user) { // Landed successfully
        if(!user.isBlock){
          // Generate a cookie (userid: user._id), and give it to the browser to save
          res.cookie('userid', user._id, {maxAge: 1000*60*60*24})
          // Return login success information (including user)
          res.send({code: 0, data: user})
        }
        else{
          res.send({code: 1, msg: 'Oops, Your account has been locked'})
        }
      } else {//failed to login
        res.send({code: 1, msg: 'Incorrect username or password!'})
      }
    })
  }
})

// Route to update user information
router.post('/update', function (req, res) {
  // Get the userid from the requested cookie
  const userid = req.cookies.userid
  // If it does not exist, directly return a prompt message
  if(!userid) {
    return res.send({code: 1, msg: 'Please login first'})
  }
  // Exist, update the corresponding user document data according to userid
  // Get submitted user data
  const user = req.body 
  UserModel.findByIdAndUpdate({_id: userid}, user, function (error, oldUser) {

    if(!oldUser) {
      // Notify browser to delete userid cookie
      res.clearCookie('userid')
      // Return a reminder message
      res.send({code: 1, msg: 'Please login first'})
    } else {
      // Prepare a returned user data object
      const {_id, username, type} = oldUser
      const data = Object.assign({_id, username, type}, user)
      // return
      res.send({code: 0, data})
    }
  })
})

// Route to get user information (according to userid in cookie)
router.get('/user', function (req, res) {
  // Get the userid from the requested cookie
  const userid = req.cookies.userid
  // If it does not exist, directly return a prompt message
  if(!userid) {
    return res.send({code: 1, msg: 'Please login first'})
  }
  
  // Query the corresponding user according to userid
  UserModel.findOne({_id: userid}, filter, function (error, user) {
    if(user) {
      res.send({code: 0, data: user})
    } else {
      // Notify browser to delete userid cookie
      res.clearCookie('userid')
      res.send({code: 1, msg: 'Please login first'})
    }

  })
})

// Get user list (according to type)
router.get('/userlist', function (req, res) {
  const {type} = req.query
  UserModel.find({type}, filter, function (error, users) {
    res.send({code: 0, data: users})
  })
})

// Create job route
router.post('/createJob', function (req, res) { 
  console.log("==== createJob ===");
  console.log(req.body);
  // Read request parameter data
  const {jobTitle, jobType, content, company, position, postCode, postDate, expire} = req.body;
  const posterId= req.cookies.userid; // overwride posterId from requst header
  console.log("the posterId will be override to the correct value " + posterId);
  console.log(jobTitle + " has been created");
  
  new JobModel({jobTitle, jobType, content, company, position, postCode, posterId, postDate, expire}).save(function (error, job) {  
    if(!error){
      console.log( " Failed to save in Database:" + error );
      res.send({code: 500,  job });
      return;
    }            
    res.send({code: 0, job })
    console.log(jobTitle + " has been saved in database");
  })
  // Return response data
})

let jobId
router.post('/jobDetail', function (req, res) { 
   jobId=req.body.jobId;
  console.log("jobId "+jobId);
  JobModel.findOne({_id: jobId},function (error, job) {
    if(job) {
      res.send({code: 0, data: job})
    } else {
      // Notify browser to delete userid cookie
      res.send({code: 1, msg: 'Job not exist'})
    }
  })
})
router.post('/updateJob', function (req, res) {
  console.log("==== updateJob ===");
  console.log(req.body);
  console.log("========="); 
  JobModel.findByIdAndUpdate({_id: jobId},req.body,function (error, oldJob) {
    if(!oldJob) {
      res.send({code: 1, msg: 'Job not exist'})
    } else {
      // Notify browser to delete userid cookie
      res.send({code: 0, data: 'Job has been updated'})
    }
  })
})

router.post('/deleteJob', function (req, res) {
  JobModel.findByIdAndRemove({_id: jobId},function (error, job) {
    if(!job) {
      res.send({code: 1, msg: 'Job not exist'})
    } else {
      // Notify browser to delete userid cookie
      res.send({code: 0, data: 'Job has been deleted'})
    }
  })
})

// Get job list 
router.get('/getJobs', function (req, res) {
 JobModel.find( function (error, jobs) {
       res.send({code: 0, data: jobs})
     })  
})

// Get job list (according to type)
router.get('/joblist', function (req, res) {  
   const posterId= req.cookies.userid;
   console.log("userId: " +posterId);
   // If it does not exist, directly return a prompt message  
  JobModel.find({posterId}, function (error, jobs) {
        res.send({code: 0, data: jobs})
      })  
})

// Get job list (according to type)
router.post('/getJobPoster', function (req, res) {
  const posterId=req.body.posterId;
  console.log("posterId: " +posterId);
  console.log("req.body: " +req.body);  
  // If it does not exist, directly return a prompt message  
  UserModel.find({_id:posterId}, function (error, users) {               
        res.send({code: 0, data: users})
      })  
})

router.get('/viewCandidates',function(req,res){
  const {jobId} = req.query
  console.log(jobId);
  UserModel.find({appliedJob:jobId},function(err,users){    
    if(users){
      console.log(users.length)
      res.send({code:0,data:users})
    }
    else{
      res.send('not found')
    }
  })
})
/*
Get a list of all related chat information of the current user
 */
router.get('/msglist', function (req, res) {
  // Get the userid in the cookie
  const userid = req.cookies.userid
  // Query to get an array of all user documents
  UserModel.find(function (err, userDocs) {
    // Use objects to store all user information: key is the _id of user, val is the user object composed of name and header
    /*const users = {} // Object container
    userDocs.forEach(doc => {
      users[doc._id] = {username: doc.username, header: doc.header}
    })*/

    const users = userDocs.reduce((users, user) => {
      users[user._id] = {username: user.username, header: user.header}
      return users
    } , {})
   
    ChatModel.find({'$or': [{from: userid}, {to: userid}]}, filter, function (err, chatMsgs) {
      // Return data containing all chat messages related to all users and the current user
      res.send({code: 0, data: {users, chatMsgs}})
    })
  })
})

/*
Modify the specified message as read
 */
router.post('/readmsg', function (req, res) {
  //Get the from and to in the request
  const from = req.body.from
  const to = req.cookies.userid

  ChatModel.update({from, to, read: false}, {read: true}, {multi: true}, function (err, doc) {
    console.log('/readmsg', doc)
    res.send({code: 0, data: doc.nModified}) // Number of updates
  })
})
//Route for getting apply history
router.get('/applyHistory',function(req,res){
  const userId=req.cookies.userid
  JobModel.find({applicant:userId},function(err,jobs){
    res.send({code:0,data:jobs})
  })
})
//Route for postting report
router.post('/reportUser',function(req,res){
  reportDate=Date.now()
  const {reportTitle, reportedUserName, reportReason} = req.body
  new ReportModel({reportTitle, reportedUserName, reportDate, reportReason}).save(function (error, report) {
    if(report){
      res.send({code: 0, data:report})
      console.log(report)
    }
    else{
      res.send({code:1,msg:'Fail to report user'})
    }
  })
})

// ('/reportList')
// export const reqFindUser= (username) => ajax('/findUser'
router.get('/reportList',function(req,res){
  ReportModel.find(function (error, reports) {
    res.send({code: 0, data: reports})
  })  
})

router.post('/findUser',function(req,res){
  const username=req.body.username
  UserModel.findOne({username:username},function(err,user){
    if(user){
      res.send({code:0,data:user})
    }
    else{
      res.send({code:1,msg:'Can not find user'})
    }
  })
})

router.post('/lockAccount',function(req,res){
  const user = req.body 
  console.log(user)
  const userId=user._id
  UserModel.findByIdAndUpdate({_id: userId}, user,filter,function (error, oldUser) {
      // Prepare a returned user data object
      if(oldUser){
        // return
        console.log('oldUser')
        console.log(oldUser)
        res.send({code: 0, data:oldUser})
      }
      else{
        res.send({code:1, msg:'Can not find user'})
      }
  })
})
module.exports = router;
