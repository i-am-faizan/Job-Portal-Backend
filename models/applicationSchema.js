import mongoose from "mongoose"
import validator from "validator"

const applicationSchema = mongoose.Schema({
    jobSeekerInfo: {
        id: {
            type: mongoose.Schema.Types.ObjectId,
            require: true
        },
        name: {
            type: String,
            require: true,
        },
        email: {
            type: String,
            require: true,
            validate: [validator.isEmail, "Please provide a valide email"],
        },
        phone: {
            type: Number,
            required: true,
        },
        address: {
            type: String,
            required: true
        },
        resume: {
            public_id: String,
            url: String,
        },
        coverLetter:{
            type:String,
            require:true,
        },
        role:{
            type:String,
            enum:["Job Seeker"],
            require: true,
        }
    },
    employerInfo:{
        id:{
            type:mongoose.Schema.Types.ObjectId,
            ref:"User",
            require: true
        },
        role:{
            type:String,
            enum:["Employer"],
            require: true,
        }
    },
    jobInfo:{
        jobID:{
            type:mongoose.Schema.Types.ObjectId,
            require: true,
        },
        jobTitle:{
            type: String,
            require:true,
        }
    },
    deletedBy:{
        jobSeeker:{
            type:Boolean,
            default: false,
        },
        employer:{
            type:Boolean,
            default: false,
        }
    }

})

export const Application = mongoose.model("Application", applicationSchema);