import * as express from "express";
import { SystemConfiguration } from "../../models/system-vars";
import { spawn } from "child_process";

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

    const ls = spawn("ffmpeg", ["-i", "../../../ge7-vf3rlt2ucusk0lo8j4zc.mp4", "pipe:1"]);

    ls.stdout.on("data", (data) => {
        console.log(`stdout: ${data}`);
    });

    ls.stderr.on("data", (data) => {
        console.log(`stderr: ${data}`);
    });

    ls.on("close", (code) => {
        console.log(`child process exited with code ${code}`);
    });
});


export default router;