import cron from "node-cron";
import { Job } from "../models/jobSchema.js";
import { User } from "../models/userSchema.js";
import { sendEmail } from "../utils/sendEmail.js";

export const newsLetterCron = () => {
    cron.schedule("*/1 * * * *", async () => {
        const jobs = await Job.find({ newsLettersSent: false });
        for (const job of jobs) {
            try {
                const filterUsers = await User.find({
                    $or: [
                        { "niches.firstNiche": job.jobNiche },
                        { "niches.secondNiche": job.jobNiche },
                        { "niches.thirdNiche": job.jobNiche },
                    ]
                })
                for (const user of filterUsers) {
                    const subject = `Hot Job Alert: ${job.title} in ${job.jobNiche} Available Now`;
                    const message = `Hi ${user.name || "there"},\n\nGreat news! A new job has just been posted that matches your interest in ${job.jobNiche}.\n\n**Job Title:** ${job.title}\n**Company:** ${job.companyName}\n**Location:** ${job.location || "Not specified"}\n**Job Type:** ${job.jobType || "N/A"}\n**Salary:**${job.salary}\n**Posted On:** ${new Date(job.createdAt).toLocaleDateString()}\n\nBrief Description:\n${job.description?.slice(0, 150) || "Check out the full details below."}...\n\nDont't wait too long! Job openings like these are filled quickly. \n\nWe're here to support you in your job search. Best of luck!\n\nBest Regards,\nCareerCraft Team`;
                    sendEmail({
                        email: user.email,
                        subject,
                        message
                    })
                }
                job.newsLettersSent = true;
                await job.save()
            } catch (error) {
                console.log("Erron on node cron catch block");
                return next(console.error(error || "some error in cron"));
            }
        }
    })

}