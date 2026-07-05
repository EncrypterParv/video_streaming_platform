import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.model.js";
import { uploadFilePath  } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import jwt, { decode } from "jsonwebtoken"


const generateAccessAndRefreshToken= async function(userId){
    try{
        const user= await User.findById(userId)
        const accessToken= user.createAccessToken()
        const refreshToken= user.createRefreshToken()
        user.refreshToken= refreshToken
        await user.save({validateBeforeSave: false})
        return {accessToken, refreshToken}
    }catch(err){
        throw new ApiError(500, `Something went wrong while creating access and refresh Tokens-- ${err}`)
    }
}

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
    const existedUser= await User.findOne({
        $or:[{username}, {email}]
    })
    if(existedUser){
        throw new ApiError(409, "user already exists") 
    }
    console.log(req.files)
    const avatarLocalPath= req.files?.avatar?.[0]?.path;
    const coverImageLocalPath=req.files?.coverImage?.[0]?.path;
    if(!avatarLocalPath){
        throw new ApiError(400, "Avatar file path is pending")
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

const loginUser= asyncHandler(async(req,res)=>{
    //req body -> data
    //auth using username or email
    //find the user
    //check password
    //send access and refresh token in the form of cookie

    const {email ,username ,password }= req.body
    if(!username && !email){
        throw new ApiError(400, "username or password is required")
    }
    const user= await User.findOne({
        $or: [{username},{email}]
    }) 
    if(!user){
        throw new ApiError(404, "user does not exist")
    }
    const isPasswordValid= await user.isPasswordCorrect(password)
    
    if(!isPasswordValid){
        throw new ApiError(401, "Invalid User Credentials ")
    }
    const {accessToken, refreshToken}= await generateAccessAndRefreshToken(user._id)
    const loggedInUser= await User.findById(user._id).
    select("-password -refreshToken")

    const options= {
        httpOnly: true,
        secure: true
    }

    return res
    .status(200)
    .cookie("accessToken", accessToken,options)
    .cookie("refreshToken", refreshToken, options)
    .json(
        new ApiResponse(200, {
            user: loggedInUser,accessToken, refreshToken
        },
    "User logged in Successfully")
    )

    

})
const logOutUser= asyncHandler(async(req,res)=>{
        await User.findByIdAndUpdate(
            req.user._id,
            {
                $set: {
                    refreshToken: undefined
                }
            },
            {
                new: true
            }
        )
        const options= {
        httpOnly: true,
        secure: true
        } 
        return res.status(200)
        .clearCookie("accessToken",options)
        .clearCookie("refreshToken", options)
        .json( new ApiResponse(200,{}, "User LoggedOut Successfully" ))
    })

const refreshAccessToken= asyncHandler(async(req, res)=>{
    const incomingRefreshToken= req.cookies.refreshToken || req.body.refreshAccessToken

    if (!incomingRefreshToken) {
        throw new ApiError(401, "Unauthorised request")
    }
    try {
        const decodedToken= jwt.verify(incomingRefreshToken, process.env.REFRESH_TOKEN)
    
        const user= await User.findById(decodedToken?._id)
        if(!user){
            throw new ApiError(401, "Invalid refreshToken ")
        }
        if(incomingRefreshToken !== user?.refreshToken){
            throw new ApiError(401, "Refresh Token is expired or used")
        }
        const options= {
            httpOnly: true,
            secure: true
        }
        const {accessToken, newRefreshToken}= await generateAccessAndRefreshToken(user._id);
    
        res.status(200)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", newRefreshToken, options)
        .json(
            new ApiResponse(200,{
                user, accessToken, refreshToken: newRefreshToken
            },"Access Token Refreshed Successfully")
        )
    } catch (error) {
        throw new ApiError(401, error?.message|| "Invalid refresh token")
    }
    
    })
export {registerUser,loginUser, logOutUser, refreshAccessToken};