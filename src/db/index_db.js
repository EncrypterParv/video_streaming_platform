import mongoose from "mongoose";
import {DB_NAME} from "../constants.js";

const connectDB= async function(){
    try{
        const connectionInstance= await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`)
        console.log(`\n Mongodb connected to DB Host : ${connectionInstance.connection.host}`); 

    }catch(error){
        console.error(error);
        process.exit(1);
    }
}
export default connectDB;