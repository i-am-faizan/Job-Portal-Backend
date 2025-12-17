import jwt from "jsonwebtoken";
import { User } from "../models/userSchema.js";
import { catchAsyncErrors } from "./catchAsyncErrors.js";
import ErrorHandler from "./error.js";

export const isAuthenticated = catchAsyncErrors(async(req, res, next)=>{
    const {token} = req.cookies;

    if(!token){
        return next(
            new ErrorHandler("User Not Authenticated", 401)
        )
    }

    const decode = jwt.verify(token,process.env.JWT_SECRECT_KEY);
    req.user = await User.findById(decode.id);

    next()
})


export const isAuthorized = (...Roles)=> {
    return (req,res,next)=>{
        if(!Roles.includes(req.user.role)){
            return next (new ErrorHandler(`${req.user.role} can not access this functionality `))
        }
        next()
    }
}