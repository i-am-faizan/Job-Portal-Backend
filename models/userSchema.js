import mongoose from "mongoose";
import jwt from "jsonwebtoken"
import bcrypt from "bcrypt"
import validator from "validator"

const userSchema = mongoose.Schema({
    name: {
        type: String,
        require: true,
        minLength: [3, "Name must contain atleast 3 letters"],
        maxLength: [32, "Name can't be exceed more than 32 letters"],
    },

    email:{
        type: String,
        require: true,
        validate: [validator.isEmail, "Please Provide a Valid email"]
    },

    phone:{
        type: Number,
        require: true
    },
    
    password:{
        type: String,
        require: true,
        minLength: [8, "Password must contain atleast 8 letters"],
        maxLength: [32, "Password can't be exceed more than 32 letters"],
        select: false,
    },

    address:{
        type: String,
        require:true,
    },

    niches:{
        firstNiche: String,
        secondNiche: String,
        thirdNiche: String
    },

    resume:{
        public_id:String,
        url: String,
    },

    coverLetter:{
        type: String
    },

    role:{
        type: String,
        require: true,
        enum: ["Job Seeker", "Employer"]
    },

    createdAt:{
        type: Date,
        default: Date.now,
    },
})

userSchema.pre("save", async function (next) {
    if(!this.isModified("password")){
        next();
    }
    this.password = await bcrypt.hash(this.password, 10);    
})

userSchema.methods.comparePassword = async function (enteredPassword) {    
    return await bcrypt.compare(enteredPassword,this.password)
}

userSchema.methods.getJWTToken = function(){
    return jwt.sign({id: this._id}, process.env.JWT_SECRECT_KEY,{
        expiresIn: process.env.JWT_EXPIRE,
    })
}

export const User = mongoose.model ("User", userSchema);