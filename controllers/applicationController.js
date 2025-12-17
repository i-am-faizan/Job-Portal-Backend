import { catchAsyncErrors } from "../middleware/catchAsyncErrors.js";
import ErrorHandler from "../middleware/error.js";
import { Application } from "../models/applicationSchema.js";
import { Job } from "../models/jobSchema.js";
import {v2 as cloudinary} from "cloudinary"

export const postApplication = catchAsyncErrors(async(req ,res , next)=>{
    const {id} = req.params;

    const {
        name,
        email,
        phone,
        address,
        coverLetter
    }= req.body;

    if(!name || !email || !phone || !address || !coverLetter){
        return next (new ErrorHandler("Please provide all the details", 400))
    }

    const jobSeekerInfo = {
        id : req.user._id,
        name,
        email,
        phone,
        address,
        coverLetter,
        role: "Job Seeker",
    };

    const jobDetails = await Job.findById(id);

    if(!jobDetails){
        return next (new ErrorHandler("Job not found", 404))
    }
    
     const isAlreadyApplied = await Application.findOne({
        "jobInfo.jobID" : id,
        "jobSeekerInfo.id" : req.user._id 
    })

    if(isAlreadyApplied){
        return next (new ErrorHandler("You have already applied for this job", 400))
    }

    if(req.files && req.files.resume){
        const {resume} = req.files;
        try {
            const cloudenaryResponse = await cloudinary.uploader.upload(resume.tempFilePath,{
                folder: "Job_Seekers_Resume"
            });

            if(!cloudenaryResponse || cloudenaryResponse.error){
                return next (new ErrorHandler("Failed to upload resume in cloudinary"))
            }
            jobSeekerInfo.resume={
                public_id : cloudenaryResponse.public_id,
                url : cloudenaryResponse.secure_url
            }
        } catch (error) {
            return next (new ErrorHandler("Failed to upload resume", 500))  
        }
    }else{
        if(req.user && !req.user.resume.url){
            return next (new ErrorHandler("Please upload your resume", 500))
        }
        jobSeekerInfo.resume = {
            public_id: req.user && req.user.resume.public_id,
            url: req.user && req.user.resume.url
        }
    }

    const employerInfo = {
        id: jobDetails.postedBy,
        role: "Employer",   
    }

    const jobInfo ={
        jobID: id,
        jobTitle: jobDetails.title,
    }
    const application = await Application.create({
        jobSeekerInfo,
        employerInfo,
        jobInfo
    });
    res.status(200).json({
        success: true,
        message:"Application Posted",
        application
    })
})

export const employerGetAllApplication = catchAsyncErrors(async(req ,res , next)=>{
    const {_id} = req.user;
    const applications = await Application.find({
        "employerInfo.id" : _id,
    "deletedBy.employer": false,
    })
        
    res.status(200).json({
        success: true,
        applications,
    })
})

export const jobSeekerGetAllApplication = catchAsyncErrors(async(req ,res , next)=>{
    const {_id} = req.user;
    const applications = await Application.find({
        "jobSeekerInfo.id" : _id,
        "deletedBy.jobSeeker": false,
    })
    res.status(200).json({
        success: true,
        applications,
    })
})

export const deleteApplication = catchAsyncErrors(async(req ,res , next)=>{
    const {id} = req.params;
    const application = await Application.findById(id);
    if(!application){
        return next (new ErrorHandler("Application Not Found! ", 404))
    }
    const {role} =  req.user;
    switch (role) {
        case "Job Seeker":
            application.deletedBy.jobSeeker = true
            await application.save();
            break;
        case "Employer": 
            application.deletedBy.employer = true;
            await application.save()    
    
        default:
            console.log("Application default case");
            break;
    }

    if(
        application.deletedBy.jobSeeker === true &&
        application.deletedBy.employer ===true
    ){
        await application.deleteOne()
    }
    res.status(200).json({
        success:true,
        message: "Application Deleted"
    })
})