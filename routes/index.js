var express = require('express');
var router = express.Router();

const md5 = require('blueimp-md5')
const {UserModel, ChatModel,JobModel} = require('../db/models')
const filter = {password: 0, __v: 0} // Specify the properties of the filter

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
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
  // Query the database users based on username and password, if not, return an error message, if yes, return a login success message (including user)
  UserModel.findOne({username, password:md5(password)}, filter, function (err, user) {
    if(user) { // Landed successfully
      // Generate a cookie (userid: user._id), and give it to the browser to save
      res.cookie('userid', user._id, {maxAge: 1000*60*60*24})
      // Return login success information (including user)
      res.send({code: 0, data: user})
    } else {//failed to login
      res.send({code: 1, msg: 'Incorrect username or password!'})
    }
  })
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
  // Read request parameter data
  const {jobTitle, jobType, content,company,position,posterId,postDate,expire} = req.body
  
      new JobModel({jobTitle, jobType,content,company,position,posterId,postDate,expire}).save(function (error, job) {              
        res.send({code: 0, job})
      })
  // Return response data
})


// Get job list (according to type)
router.get('/joblist', function (req, res) {
   // Get the userid from the requested cookie
   const {userid} = req.query
   //const userid = req.cookies.userid
   // If it does not exist, directly return a prompt message  
  JobModel.find({userid}, function (error, jobs) {
        res.send({code: 0, data: jobs})
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

module.exports = router;
