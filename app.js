import express from 'express';
import mongoose from 'mongoose';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import {config} from 'dotenv'
import userRouter from './routes/userRoter.js';
import jobRouter from './routes/jobRouter.js'
import applicationRouter from './routes/applicationRouter.js'
import bodyParser from "body-parser"
import fileUpload from 'express-fileupload';
import { newsLetterCron } from './automation/newsLetterCron.js';
import {errorMiddleware} from './middleware/error.js'

const app = express();

app.use(cors({
    origin: "http://localhost:5173",
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true
}))

app.use(cookieParser())
app.use(express.json())
app.use(bodyParser.json());
app.use(express.urlencoded({extended:true}))

// for getting file/resume file
app.use(fileUpload({
    useTempFiles: true,
    tempFileDir:"/tmp/"
}))
app.use("/api/v1/user",userRouter);
app.use("/api/v1/job",jobRouter);
app.use("/api/v1/application",applicationRouter);

config({path:"./config/config.env"});

newsLetterCron()

// Data Base Connection //
mongoose.connect(process.env.MONGO_URL)
.then(()=>{
    console.log("Data Base Connected Succesfully")
})
.catch((err)=>{
    console.log(`Data Base Is Not Connecting Occured Some Error = ${err}`)
})

app.use(errorMiddleware);

export default app;