import * as express from "express";
import {SystemConfiguration, SystemVarsStub} from "../../models/system-vars";

const router = express.Router();


/**
 * @api {get} /system User's followers
 * @apiName FollowingUser
 * @apiGroup User
 *
 * @apiSuccess {SystemVars}     vars System variables object
 * @apiSuccess {Pages}              vars.pages Static pages collection
 * @apiSuccess {String}                 vars.pages.about About the application page URL
 * @apiSuccess {String}                 vars.pages.privacy Privacy policy page URL
 * @apiSuccess {String}                 vars.pages.terms Terms of use URL
 * @apiSuccess {String}                 vars.pages.libraries Third party libraries URL
 */
router.get("/", (req: express.Request, res: express.Response) => {
    res.response({
        vars: SystemConfiguration.toJson()
    });
});


export default router;