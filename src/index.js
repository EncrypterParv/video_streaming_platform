import 'dotenv/config';
import connectDB from './db/index_db.js';

connectDB()
.then(()=>{
    app.listen(process.env.PORT || 1321, ()=>{
        console.log(`server is running at port ${process.env.PORT}`)
    })
})
.catch((err)=>{
    console.log("Mongodb connection failed!!!", err)
})


















/*
import mongoose from "mongoose";
import {DB_NAME} from "./constants";
import express from "express";
const app= express()
;(async ()=>{
    try{
        await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`)
        app.on("errror", (error)=>{
            console.log("there is an erro connecting your database")
            throw error
        });
        app.listen(process.env.PORT, ()=>{
            console.log("App is listening on port :", process.env.PORT )
        })
    }catch(error){
        console.log("ERROR: ",error);
        throw err
    }
})()
*/