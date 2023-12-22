// mongodb+srv://admin:<password>@cluster0.5qcdxug.mongodb.net/?retryWrites=true&w=majority

const mongoose = require('mongoose');
const {MONGODB_CONNECTION_STRING} = require('../config/index');

const dbConnect  = async () => {
    try{
     const conn =  await mongoose.connect(MONGODB_CONNECTION_STRING);
        console.log("DB is connected to host:"+conn.connection.host);
    }
    catch(error){
        console.log("DB not connected. Error is: "+error); 
    }
    
}


module.exports = dbConnect;