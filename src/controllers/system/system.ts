import * as express from "express";
import { SystemConfiguration } from "../../models/system-vars";
// import { Utilities } from "../../utilities/utilities";
// import { MimeType, StorageManager } from "../../utilities/storage-manager";
// import { WriteStreamOptions } from "google-cloud__storage";
// import * as buffer from "buffer";
// import { spawn } from "child_process";
// const ffmpeg = require("ffmpeg");
// const ffmpeg = require("fluent-ffmpeg");



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
    // const fileName = Utilities.randomStringArguments(32, true, true, true, false) + ".gif";
    //
    // // const storageManager = new StorageManager();
    //
    // const storageFile = StorageManager.getBucketFile(fileName);
    //
    // const stream = storageFile.createWriteStream({
    //     metadata: {
    //         contentType: MimeType.IMAGE_GIF
    //     }
    // });
    //
    // stream
    //     .on("error", (err: any) => {
    //         console.log("An error occurred: " + err.message);
    //     })
    //     .on("finish", async () => {
    //         await storageFile.makePublic();
    //         const url = StorageManager.getPublicUrl(fileName);
    //         console.log("Finished uploading file to:", url);
    //     });
    //
    // ffmpeg("https://storage.googleapis.com/isay-89efe.appspot.com/5aeed930ea4cea588815f465/zdsyvbp4_fgca7sg7n9e3lky.mp4")
    //     .format("gif")
    //     .size("320x?")
    //     .seekInput(0)
    //     .duration(3)
    //     .inputFPS(15)
    //     .stream(stream);
});


export default router;