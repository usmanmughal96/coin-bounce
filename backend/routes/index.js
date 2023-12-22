const express = require('express');
const router = express.Router();
const authController = require('../controller/authController');
const blogController = require('../controller/blogController');
const auth=require('../middlewares/auth');

//testing 
router.get('/test',(req,res)=>res.json({msg:'Working'}));

//user


//register
router.post('/register',authController.register);

//login
router.post('/login', authController.login);

//logout
router.post('/logout', auth, authController.logout);


//refresh
router.get('/refresh',authController.refresh);

//blog


//create blog
router.post('/blog',auth,blogController.create);

//get all blogs
router.get('/blog/all',auth,blogController.getAll);


//get blog by id
router.get('/blog/:id',auth,blogController.getById);


//update blog
router.put('/blog',auth, blogController.update);

//delete blog
router.delete('/blog/:id',auth, blogController.delete);


//comments
//create comment
//read comments

module.exports=router;