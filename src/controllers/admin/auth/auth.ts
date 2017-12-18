import * as express from "express";
import { isAdministrator } from "../../../config/passport";
import { asyncMiddleware } from "../../../server";
import { SystemConfiguration } from "../../../models/system-vars";
import { IAuthTokenModel } from "../../../models/user";
import { AppError } from "../../../models/app-error";
import { Utilities } from "../../../utilities/utilities";
import { Administrator } from "../../../models/admin/administrator";
import {default as ForgotPasswordRouter } from "./forgot-password";

const router = express.Router();

router.post("/signin", asyncMiddleware(async (req: express.Request, res: express.Response) => {
    req.checkBody({
        "email": {
            isEmail: {
                errorMessage: "Email is invalid"
            }
        },
        "password": {
            isLength: {
                options: [{
                    min: SystemConfiguration.validations.password.minLength,
                    max: SystemConfiguration.validations.password.maxLength
                }],
                errorMessage: "Post-text length is invalid"
            }
        }
    });

    if ( req.requestInvalid() ) {
        return;
    }

    const email: string = req.body.email.toLowerCase();
    const password: string = req.body.password;

    const userByEmail = await Administrator.findOne({email: email});
    if ( ! userByEmail ) {
        throw AppError.ObjectDoesNotExist;
    }

    let passwordMatches: boolean = false;
    try {
        passwordMatches = await userByEmail.password.compare(password);
    }
    catch (e) {
        passwordMatches = false;
    }

    if ( ! passwordMatches ) {
        throw AppError.PasswordDoesNotMatch;
    }

    const authToken: IAuthTokenModel = {
        authToken: Utilities.randomString(),
        firebaseToken: ""
    };

    userByEmail.tokens.push(authToken);

    await userByEmail.save();

    res.response({
        administrator: userByEmail,
        token: authToken.authToken
    });
}));

/**
 * @api {delete} /auth Sign out
 * @apiName SignOut
 * @apiGroup Authentication
 */
router.delete("/", isAdministrator, (req: express.Request, res: express.Response) => {
    req.user.tokens.pull(req.authToken._id);

    req.user
        .save()
        .then(() => {})
        .catch(() => {});

    res.response();
});

router.use("/forgot-password", ForgotPasswordRouter);

export default router;