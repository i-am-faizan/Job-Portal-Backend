import express from "express"
import { postJob, getASingleJob, getAllJobs, getMyJobs, deleteJob} from "../controllers/jobController.js";
import { isAuthenticated, isAuthorized } from "../middleware/auth.js";

const router = express.Router();

router.post("/post",isAuthenticated, isAuthorized("Employer") ,postJob);
router.get("/getall",getAllJobs);
router.get("/getmyjobs",isAuthenticated,isAuthorized("Employer"),getMyJobs);
router.delete("/delete/:id",isAuthenticated,isAuthorized("Employer"),deleteJob);
router.get("/get/:id",getASingleJob)


export default router;