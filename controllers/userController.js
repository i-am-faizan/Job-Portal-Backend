import { User } from "../models/userSchema.js";
import { catchAsyncErrors } from "../middleware/catchAsyncErrors.js"
import ErrorHandler from "../middleware/error.js";
import { v2 as cloudinary } from "cloudinary"
import { sendToken } from "../utils/jwt.js";

export const register = catchAsyncErrors(async (req, res, next) => {
    try {
        const {
            name,
            email,
            password,
            address,
            phone,
            role,
            firstNiche,
            secondNiche,
            thirdNiche,
            coverLetter
        } = req.body;

        if (!name || !email || !password || !address || !phone || !role) {
            return next(new ErrorHandler("All fileds are required.", 400))
        }

        if (role === "Job Seeker" && (!firstNiche || !secondNiche || !thirdNiche)) {
            return next(new ErrorHandler("Please provide your preffer job niche"))
        }
        if (role === "Employer" && (firstNiche || secondNiche || thirdNiche)) {
            return next(new ErrorHandler("Employer can't be give job niches"))
        }

        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return next(new ErrorHandler("Email already registered"))
        }

        const userData = {
            name,
            email,
            password,
            phone,
            address,
            role,
            niches: {
                firstNiche,
                secondNiche,
                thirdNiche
            },
            coverLetter,
        }


        // Cloudinary Function for resume
        if (req.files && req.files.resume) {
            const { resume } = req.files;
            if (resume) {
                try {
                    const cloudinaryResponse = await cloudinary.uploader.upload(
                        resume.tempFilePath,
                        {
                            resource_type: "auto",
                            folder: "Job_Seekers_Resume"
                        }
                    )
                    if (!cloudinaryResponse || cloudinaryResponse.error) {
                        return next(
                            new ErrorHandler("Failed to upload resume in cloud", 500)
                        )
                    }
                    userData.resume = {
                        public_id: cloudinaryResponse.public_id,
                        url: cloudinaryResponse.secure_url,
                    }
                } catch (error) {
                    return next(new ErrorHandler("Failed to upload resume", 500))
                }
            }
        }

        const user = await User.create(userData);
        sendToken(user, 201, res, "User Registered")

    } catch (error) {
        return next(error)
    }
})

export const login = catchAsyncErrors(async (req, res, next) => {
    try {
        const {
            email,
            password,
            role,
        } = req.body;

        if (!role || !password || !email) {
            return next(new ErrorHandler("All the filed must required", 400))
        }
        const user = await User.findOne({ email }).select("+password");
        if (!user) {
            return next(new ErrorHandler("Invalid Email or Password", 400))
        }

        const isPasswordMatch = await user.comparePassword(password);
        if (!isPasswordMatch) {
            return next(
                new ErrorHandler("Invalid Email or Password", 400)
            )
        }
        if (user.role !== role) {
            return next(new ErrorHandler("Invalid User Role", 400))
        }

        sendToken(user, 201, res, "User Loged In");
    } catch (error) {
        return next(error);

    }
})

export const logout = catchAsyncErrors(async (req, res, next) => {
    res.status(200).cookie("token", "", {
        expires: new Date(
            Date.now()
        )
    }).json({
        success: true,
        message: "User Logged Out",
    })
})

export const getUser = catchAsyncErrors(async (req, res, next) => {
    const user = req.user;
    res.status(200).json({
        success: true,
        user
    })
})

export const updateProfile = catchAsyncErrors(async(req, res, next)=>{
    const newUserData = {
        name: req.body.name,
        email: req.body.email,
        phone: req.body.phone,
        address: req.body.address,
        coverLetter: req.body.coverLetter,
        niches: {
            firstNiche: req.body.firstNiche,
            secondNiche: req.body.secondNiche,
            thirdNiche: req.body.thirdNiche,
        }
    }

    const {firstNiche, secondNiche, thirdNiche} = newUserData.niches;

    if(req.user.role === "Job Seeker" && (!firstNiche || !secondNiche || !thirdNiche)){
        return next(new ErrorHandler("Please full fill all the perefrence of you'r Niches"),400);
    }

    if(req.files){
        const resume = req.files.resume;
        if(resume){
            const currentResumeId = req.user.resume.public_id;
            if(currentResumeId){
                await cloudinary.uploader.destroy(currentResumeId);
            }
            const newResume = await cloudinary.uploader.upload(resume.tempFilePath,{
                folder: "Job_Seekers_Resume"
            })
            newUserData.resume = {
                public_id: newResume.public_id,
                url: newResume.secure_url
            }
        }
    }

    const user = await User.findByIdAndUpdate(req.user.id,newUserData,{
        new: true,
        runValidators: true,
        useFindAndModify: false
    });
    res.status(200).json({
        success: true,
        message: "Profile Updated",
        user,
    });


})

export const updatePassword = catchAsyncErrors(async(req, res, next)=>{
    const user =await User.findById(req.user.id).select("+password");

    const isPasswordMatch =await user.comparePassword(req.body.oldPassword);
    
    if(!isPasswordMatch){
        return next (new ErrorHandler("Old Password is incorrect", 400));
    }

    if(req.body.newPassword !== req.body.confirmPassword){
        return next (new ErrorHandler("New password & Confirm password do not matched",400));
    }

    user.password = req.body.newPassword;
    await user.save();
    sendToken(user,200,res,"Password Updated Successfuly")

})