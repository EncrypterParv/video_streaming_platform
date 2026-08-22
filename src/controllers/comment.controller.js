import mongoose from "mongoose";
import { Comment } from "../models/comment.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";

const getVideoComments= asyncHandler(async(req, res)=>{
    const {videoId}= req.params; //get video id from req url
    const { page=1, limit=10 }= req.query;
    if(!mongoose.Types.ObjectId.isValid(videoId)){
        throw new ApiError(400, "Invalid video id")
    }
    
    const aggregate= Comment.aggregate([
        {
            $match:{
                video: new mongoose.Types.ObjectId(videoId)
            }
        }
    ])
    const comments= await Comment.aggregatePaginate(aggregate,{
        page: Number(page),
        limit: Number(limit)
    })
    return res.status(200).json(
        new ApiResponse(
            200,
            comments,
            "Comments fetched successfully"
        )
    )

})

const addComment= asyncHandler(async(req, res)=>{
    const {videoId}= req.params;
    const {content}= req.body;
    if (!mongoose.Types.ObjectId.isValid(videoId)){
        throw new ApiError(400, "Invalid video Id")
    }
    if(!content?.trim()){
        throw new ApiError(400, "Content is required");
    }
    const comment= await Comment.create({
        content: content,
        video: videoId,
        owner: req.user._id,
    })
    return res.status(201).json(
        new ApiResponse(
            201,
            comment,
            "Comment added Successfully"
        )
    );
})

const updateComment= asyncHandler(async(req,res)=>{
    const {commentId}= req.params;
    const {content}= req.body;
    if(!mongoose.Types.ObjectId.isValid(commentId)){
        throw new ApiError(400, "Invalid comment Id")
    }
    if(!content?.trim()){
        throw new ApiError(400, "Content is required")
    }
    const comment= await Comment.findById(commentId);
    if(!comment){
        throw new ApiError(404,"Comment not found")
    }
    if(comment.owner.toString()!== req.user._id.toString()){
        throw new ApiError(403, "Unauthorised request")
    }
    comment.content= content;
    await comment.save({validateBeforeSave: false});
    return res.status(200).json(
        new ApiResponse(
            200,
            comment,
            "Comment Updated Successfully"
        )
    )
})

const deleteComment= asyncHandler(async(req, res)=>{
    const {commentId}= req.params;
    if(!mongoose.Types.ObjectId.isValid(commentId)){
        throw new ApiError(400, "Invalid comment Id")
    }
    const comment= await Comment.findById(commentId);
    if(!comment){
        throw new ApiError(404, "Comment doesn't exist")
    }
    if(comment.owner.toString()!== req.user._id.toString()){
        throw new ApiError(403, "Unauthorised request")
    }
    await comment.deleteOne()
    return res.status(200).json(
        new ApiResponse(
            200,
            {},
            "Comment deleted successfully"
        )
    )
})

export {getVideoComments,
        addComment,
        updateComment,
        deleteComment
        }   