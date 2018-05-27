import * as express from "express";
import { asyncMiddleware } from "../../server";
import { IAuthTokenModel, User } from "../../models/user";
import { SystemConfiguration } from "../../models/system-vars";
import { AppError } from "../../models/app-error";
import { Utilities } from "../../utilities/utilities";

const router = express.Router();

/**
 * @api {post} /auth/manual/signup Sign-up
 * @apiName SignUp
 * @apiGroup Authentication
 *
 * @apiParam {String} email Email
 * @apiParam {String} password Password
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
 * @apiSuccess {String}     auth Authentication token to send in header
 *
 * @apiUse ObjectExist
 * @apiUse ErrorPerformingAction
 */
router.post("/signup", asyncMiddleware(async (req: express.Request, res: express.Response) => {
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

    const userByEmail = await User.findOne({email: email});
    if ( userByEmail ) {
        throw AppError.ObjectExist;
    }

    const user = new User();
    user.email = email;
    await user.password.setPassword(password);

    const authToken: IAuthTokenModel = {
        authToken: Utilities.randomString(),
        firebaseToken: ""
    };

    if ( ! user.tokens ) {
        user.tokens = [];
    }

    user.tokens = user.tokens.concat([authToken]);

    await user.save();

    res.response({
        user: user.toLoggedUser(),
        token: authToken.authToken
    });
}));


/**
 * @api {post} /auth/manual/signin Sign-in
 * @apiName SignIn
 * @apiGroup Authentication
 *
 * @apiParam {String} email Email
 * @apiParam {String} password Password
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
 * @apiSuccess {String}     auth Authentication token to send in header
 *
 * @apiUse ObjectDoesNotExist
 * @apiUse ErrorPerformingAction
 */
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

    const userByEmail = await User.findOne({email: email});
    if ( ! userByEmail ) {
        throw AppError.ObjectDoesNotExist;
    }

    if ( userByEmail.blocked ) {
        throw AppError.UserBlocked;
    }

    if ( ! userByEmail.password || ! userByEmail.password.hash ) {
        throw AppError.CannotAuthenticateViaThisMethod;
    }

    let passwordMatches: boolean = false;
    try {
        passwordMatches = await userByEmail.password.compare(password);
    }
    catch (e) {
        throw AppError.CannotAuthenticateViaThisMethod;
    }

    if ( ! passwordMatches ) {
        throw AppError.PasswordDoesNotMatch;
    }

    const authToken: IAuthTokenModel = {
        authToken: Utilities.randomString(),
        firebaseToken: ""
    };

    if ( ! userByEmail.tokens ) {
        userByEmail.tokens = [];
    }

    userByEmail.tokens = userByEmail.tokens.concat([authToken]);

    await userByEmail.save();

    res.response({
        user: userByEmail.toLoggedUser(),
        token: authToken.authToken
    });
}));


export default router;