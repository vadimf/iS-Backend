import * as express from "express";
import {isAuthenticated} from "../../config/passport";
import {default as PhoneAuthenticationRouter} from "./phone-auth";
import {default as ManualAuthenticationRouter} from "./manual-auth";
import {default as FacebookAuthenticationRouter} from "./facebook-auth";


const router = express.Router();

router.use("/phone", PhoneAuthenticationRouter);
router.use("/manual", ManualAuthenticationRouter);
router.use("/facebook", FacebookAuthenticationRouter);

/**
 * @api {delete} /auth Sign out
 * @apiName SignOut
 * @apiGroup Authentication
 */
router.delete("/", isAuthenticated, (req: express.Request, res: express.Response) => {
    req.user.tokens.pull(req.authToken._id);

    req.user
        .save()
        .then(() => {})
        .catch(() => {});

    res.response();
});


export default router;