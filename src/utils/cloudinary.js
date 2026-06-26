import {v2 as cloudinary} from "cloudinary";
import fs from "fs";

cloudinary.config({ 
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
        api_key: process.env.CLOUDINARY_API_KEY, 
        api_secret: process.env.CLOUDINARY_API_SECRET
})

const uploadFilePath= async function(localfilepath){
    try {
        
        if(!localfilepath){
            return null
        }
        //file upload on cloudinary
        const response= await cloudinary.uploader.upload(localfilepath,{
            resource_type: "auto"
        })
        //file uploaded successfully

        
        fs.unlinkSync(localfilepath)
        return response
    } catch (error) {
         console.error("Cloudinary Error:", error);

        if (fs.existsSync(localfilepath)) {
        fs.unlinkSync(localfilepath);
        }

        return null;
    }
}

export {uploadFilePath}