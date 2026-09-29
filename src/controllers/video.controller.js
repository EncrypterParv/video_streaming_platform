import { Video } from "../models/video.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import mongoose from "mongoose";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";

const getAllVideos = asyncHandler(async (req, res) => {
    const {
        page = 1,
        limit = 10,
        query,
        sortBy,
        sortType,
        userId
    } = req.query;

    const aggregate = Video.aggregate([]);

    const match = {};

    if (query) {
        match.$or = [
            {
                title: {
                    $regex: query,
                    $options: "i"
                }
            },
            {
                description: {
                    $regex: query,
                    $options: "i"
                }
            }
        ];
    }

    if (userId) {
        if (!mongoose.Types.ObjectId.isValid(userId)) {
            throw new ApiError(400, "Invalid User id");
        }

        match.owner = new mongoose.Types.ObjectId(userId);
    }

    aggregate.match(match);

    if (sortBy) {
        aggregate.sort({
            [sortBy]: sortType === "asc" ? 1 : -1
        });
    }

    const videos = await Video.aggregatePaginate(aggregate, {
        page: Number(page),
        limit: Number(limit)
    });

    return res.status(200).json(
        new ApiResponse(
            200,
            videos,
            "Videos fetched successfully"
        )
    );
});

const publishVideo = asyncHandler(async (req, res) => {
    const { title, description } = req.body;

    const videoFile = req.files?.videoFile;
    const thumbnail = req.files?.thumbnail;

    if (!title?.trim() || !description?.trim()) {
        throw new ApiError(400, "Title and description are required");
    }

    if (!videoFile?.[0]) {
        throw new ApiError(400, "Video file is required");
    }

    if (!thumbnail?.[0]) {
        throw new ApiError(400, "Thumbnail is required");
    }

    const videoUpload = await uploadOnCloudinary(videoFile[0].path);
    const thumbnailUpload = await uploadOnCloudinary(thumbnail[0].path);

    if (!videoUpload || !thumbnailUpload) {
        throw new ApiError(500, "Error uploading files");
    }

    const video = await Video.create({
        videoFile: videoUpload.url,
        thumbnail: thumbnailUpload.url,
        title,
        description,
        duration: videoUpload.duration,
        owner: req.user._id
    });

    if (!video) {
        throw new ApiError(500, "Something went wrong while publishing video");
    }

    return res.status(201).json(
        new ApiResponse(
            201,
            video,
            "Video published successfully"
        )
    );
});

const getVideoById= asyncHandler(async(req,res)=>{
    const {videoId}= req.params;
    if(!mongoose.Types.ObjectId.isValid(videoId)){
        throw new ApiError(400,"Invalid video Id")
    }
    const video= await Video.findById(videoId);
    if(!video){
        throw new ApiError(404, "Video not found")
    }
    return res.status(200).json(
        new ApiResponse(
            200,
            video,
            "Videos fetched successfully"
        )
    )


})

const updateVideo= asyncHandler(async(req,res)=>{
    const {videoId}= req.params;
    const {title, description}= req.body;
    if(!mongoose.Types.ObjectId.isValid(videoId)){
        throw new ApiError(400, "Invalide video Id")
    }
    const video= await Video.findById(videoId);
    if(!video){
        throw new ApiError(404, "Video not found");
    }
    if(video.owner.toString()!== req.user._id.toString()){
        throw new ApiError(403, "Unauthorised Request")
    }
    if(title?.trim()){
        video.title= title;
    }
    if(description?.trim()){
        video.description= description;
    }
    if(req.file?.path){
        const thumbnailUpload= await uploadOnCloudinary(req.file.path);
        if(!thumbnailUpload){
            throw new ApiError(500, "Error updating the thumbnail")
        }
        video.thumbnail= thumbnailUpload.url;
    }
    await video.save();
    return res.status(200).json(
        new ApiResponse(
        200,
        video,
        "Video updated successfully"
    )
    )


})

const deleteVideo= asyncHandler(async(req,res)=>{
    const {videoId}= req.params;
    if(!mongoose.Types.ObjectId.isValid(videoId)){
        throw new ApiError(400,"Invalid video Id")
    }
    const video= await Video.findById(videoId)
    if(!video){
        throw new ApiError(404, "Video doesn't exist")
    }
    if(video.owner.toString()!== req.user._id.toString()){
        throw new ApiError(403, "Unauthorised Request")
    }
    await video.deleteOne();
    return res.status(200).json(
        new ApiResponse(
            200,
            {},
            "Video deleted successfully"
        )
    )
})
const togglePublishStatus= asyncHandler(async(req,res)=>{
    const {videoId}= req.params;
    if(!mongoose.Types.ObjectId.isValid(videoId)){
        throw new ApiError(400, "Invalid videoId")
    }
    const video= await Video.findById(videoId)
    if(!video){
        throw new ApiError(404, "Video not found")
    }
    if(video.owner.toString()!== req.user._id.toString()){
        throw new ApiError(403,"Video user not authorised")
    }
    video.isPublished= !video.isPublished;
    await video.save()
    return res.status(200).json(
        new ApiResponse(
            200,
            video,
            "Video publish status updated successfully"
        )
    )

})
export {
    getAllVideos,
    publishVideo,
    getVideoById,
    updateVideo,
    deleteVideo,
    togglePublishStatus
};