import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.model.js";
import { uploadFilePath  } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";

const registerUser= asyncHandler(async function(req,res){
    //take user details from frontend
    //check validation: fields are not empty
    //check if user already exists
    //check images and avatars
    //upload images and avatar on cloudinary 
    //add user to db
    //remove password and refresh tokens from response
    //check if user created
    //return res
    
    const {fullName, email, username, password}= req.body;
    console.log(`email : ${email}, fullName: ${fullName}`)
    
    if(
        [fullName, email, username, password].some((field)=>
        field?.trim()==="")
    ){
        throw new ApiError(400, "All fields are required")
    }
    const existedUser= User.findOne({
        $or:[{username}, {email}]
    })
    if(existedUser){
        throw new ApiError(409, "user already exists")
    }

    const avatarLocalPath= req.files?.avatar[0]?.path;
    const coverImageLocalPath=req.files?.coverImage[0]?.path;
    if(!avatarLocalPath){
        throw new ApiError(400, "Avatar file is required")
    }
    const avatar=await uploadFilePath(avatarLocalPath);
    const coverImage= await uploadFilePath(coverImageLocalPath);
    if (!avatar){
        throw new ApiError(400, "Avatar file is required")
    }
    const user = await User.create({
        fullName: fullName,
        avatar: avatar.url,
        coverImage: coverImage?.url || "",
        email: email,
        password: password,
        username: username.toLowerCase()
    })

    const createdUser= await User.findById(user._id).select(
        "-password -refreshTokens"
    )
    if(!createdUser){
        throw new ApiError(500, "Something went wrong while registering the user")
    }

    return res.status(201).json(
        new ApiResponse(200, createdUser, "User Registered Successfully ")
    )
}) 

export {registerUser};