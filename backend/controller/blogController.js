const Joi=require('joi');
const fs=require('fs'); 
const mongoIdPattern= /^[0-9a-fA-F]{24}$/;
const Blog = require('../models/blog');
const {BACKEND_SERVER_PATH} = require('../config/index');
const BlogDTO=require('../dto/blog');
const blogController = {
async create (req, res,next){
//1- Validate Req Body

//2- handle photo storage and naming

//3- store blog record in db

//4- send response

//5- photo base 64 encoded -> backend photo decode -> store photo on path -> save photo path on db
const createBlogSchema= Joi.object({
    title: Joi.string().required(),
    author: Joi.string().regex(mongoIdPattern).required(),
    content: Joi.string().required(),
    photo: Joi.string().required()
});
const{error} = createBlogSchema.validate(req.body);
if(error){
    return next(error);
}

const {title, author, content, photo} = req.body;

//read as buffer
const buffer =Buffer.from(photo.replace(/^data:image\/(png|jpg|jpeg);base64,/,''),'base64');

//allocate random name
const imagePath=`${Date.now()}-${author}.png`;
//store locally
try{
fs.writeFileSync(`storage/${imagePath}`,buffer);
}
catch(error){
return next(error);
}

//save blog in db
let newBlog;
 try{
     newBlog=new Blog({
        title,
        author,
        content,
        photoPath: `${BACKEND_SERVER_PATH}/storage/${imagePath}` 
    });
    await newBlog.save();
 }
 catch(error){
 return next(error);
 }
const blogDto = new BlogDTO(newBlog);
 res.status(201).json({blog:blogDto});
},
async getAll (req,res,next){

},

async getById (req,res,next){

    
},

async update (req,res,next){

},

async delete (req,res,next){

},

}


module.exports=blogController;