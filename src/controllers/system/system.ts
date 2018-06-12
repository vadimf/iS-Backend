import * as express from "express";
import { SystemConfiguration } from "../../models/system-vars";
// import * as buffer from "buffer";
// import { spawn } from "child_process";
// const ffmpeg = require("ffmpeg");
const ffmpeg = require("fluent-ffmpeg");



const router = express.Router();


/**
 * @api {get} /system User's followers
 * @apiName FollowingUser
 * @apiGroup User
 *
 * @apiSuccess {SystemVars}     vars System variables object
 */
router.get("/", (req: express.Request, res: express.Response) => {
    res.response({
        vars: SystemConfiguration.toJson()
    });

    const file = "/home/maty/server/ge7-vf3rlt2ucusk0lo8j4zc.mp4";

    // const ls = spawn("ffmpeg", ["-i", "/home/maty/server/ge7-vf3rlt2ucusk0lo8j4zc.mp4", "pipe:1"]);
    //
    // ls.stdout.on("data", (data) => {
    //     console.log(`stdout: ${data}`);npm
    // });
    //
    // ls.stderr.on("data", (data) => {
    //     console.log(`stderr: ${data}`);
    // });
    //
    // ls.on("close", (code) => {
    //     console.log(`child process exited with code ${code}`);
    // });

    // try {
    //     const process = new ffmpeg(file);
    //     process.then((video: any) => {
    //         // video
    //         //     .format("gif")
    //         //     .size("640x360")
    //         //     .duration("0:15")
    //         //     .inputFPS(8)
    //         //     .save("/home/maty/server/dist/public/images/gif.gif", (error: any, file: any) => {
    //         //         if ( ! error ) {
    //         //             console.log("Video file: " + file);
    //         //         }
    //         //         console.log("save error", error);
    //         //     });
    //
    //         console.log(video);
    //     });
    // }
    // catch (e) {
    //     console.log("e", e);
    // }

    ffmpeg(file)
        .format("gif")
        .size("620x?")
        .duration("320")
        .inputFPS(15)
        .on("error", (err: any) => {
            console.log("An error occurred: " + err.message);
        })
        .on("end", (f: any) => {
            console.log("Processing finished !", f);
        })
        .save("/home/maty/server/public/images/gif.gif");
});


export default router;