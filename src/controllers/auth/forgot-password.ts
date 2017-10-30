import * as express from "express";
import {asyncMiddleware} from "../../server";
import {IPasswordModel, User} from "../../models/user";
import {AppError} from "../../models/app-error";
import {Utilities} from "../../utilities/utilities";
import {SystemConfiguration} from "../../models/system-vars";

const router = express.Router();

async function getUserByToken(token: string) {
    const user = await User.findOne({"password.resetToken": token});

    if ( ! user ) {
        throw AppError.ObjectDoesNotExist;
    }

    return user;
}

router
    .route("/")

    /**
     * @api {get} /auth/forgot-password?token=FORGOT_PASSWORD_TOKEN Get user by forgotten password token
     * @apiName GetForgotPassword
     * @apiGroup Authentication
     *
     * @apiSuccess {User}       user My user object
     * @apiSuccess {String}         user.username Username
     * @apiSuccess {String}         user.email Email
     * @apiSuccess {PhoneNumber}    user.phone PhoneNumber object
     * @apiSuccess {String}             user.phone.country Country code
     * @apiSuccess {String}             user.phone.area Area code
     * @apiSuccess {String}             user.phone.number Country code
     * @apiSuccess {Profile}        user.profile User's profile metadata
     * @apiSuccess {String}             user.profile.firstName First name
     * @apiSuccess {String}             user.profile.lastName Last name
     * @apiSuccess {Object}             user.profile.picture User's profile picture
     * @apiSuccess {String}                 user.profile.picture.url Url
     * @apiSuccess {String}                 user.profile.picture.thumbnail Thumbnail url
     * @apiSuccess {String}             user.profile.bio Bio text
     * @apiSuccess {int}            user.following Following counter
     * @apiSuccess {int}            user.followers Followers counter
     * @apiSuccess {String}         user.createdAt Date registered
     *
     * @apiUse ObjectDoesNotExist
     * @apiUse ErrorPerformingAction
     */
    .get(asyncMiddleware(async (req: express.Request, res: express.Response) => {
        req.checkQuery({
            "token": {
                notEmpty: {
                    errorMessage: "No forgot-password token given"
                }
            }
        });

        if ( req.requestInvalid() ) {
            return;
        }

        const token: string = req.query.token;
        const user = await getUserByToken(token);

        res.response({
            user: user.toLoggedUser()
        });
    }))

    /**
     * @api {post} /auth/forgot-password Forgot password
     * @apiName ForgotPassword
     * @apiGroup Authentication
     *
     * @apiParam {String} email User's email
     *
     * @apiUse ObjectDoesNotExist
     * @apiUse ErrorPerformingAction
     */
    .post(asyncMiddleware(async (req: express.Request, res: express.Response) => {
        req.checkBody({
            "email": {
                isEmail: {
                    errorMessage: "Email is invalid"
                }
            }
        });

        if ( req.requestInvalid() ) {
            return;
        }

        const email: string = req.body.email;

        const user = await User.findOne({email: email});
        if ( ! user ) {
            throw AppError.ObjectDoesNotExist;
        }

        if ( ! user.password ) {
            user.password = <IPasswordModel>{};
        }

        user.password.resetToken = Utilities.randomString(24);

        await user.save();

        res.response();
    }));

/**
 * @api {get} /auth/forgot-password?token=FORGOT_PASSWORD_TOKEN Get user by forgotten password token
 * @apiName GetForgotPassword
 * @apiGroup Authentication
 *
 * @apiSuccess {String}     password New password
 *
 * @apiUse ObjectDoesNotExist
 * @apiUse ErrorPerformingAction
 */
router.patch("/reset", asyncMiddleware(async (req: express.Request, res: express.Response) => {
    req.checkQuery({
        "token": {
            notEmpty: {
                errorMessage: "No forgot-password token given"
            }
        }
    });

    req.checkBody({
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

    const token: string = req.query.token;
    const newPassword: string = req.body.password;

    const user = await getUserByToken(token);

    await user.password.setPassword(newPassword);
    user.password.resetToken = null;

    await user.save();

    res.response();
}));


export default router;