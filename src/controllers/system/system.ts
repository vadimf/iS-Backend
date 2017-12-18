import * as express from "express";
import { SystemConfiguration } from "../../models/system-vars";

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
});


export default router;