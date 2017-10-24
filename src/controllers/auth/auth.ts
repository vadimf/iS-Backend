import * as express from "express";
import twilio = require("twilio");
import {AppError} from "../../models/app-error";
import {default as PhoneConfirmationRequest, IPhoneConfirmationRequest} from "../../models/phone-confirmation-request";
import {Utilities} from "../../utilities/utilities";
import {isNullOrUndefined} from "util";
import {IPhoneNumber} from "../../models/phone-number";
import {IAuthToken, IUserProfile, User} from "../../models/user";
import {IUserPicture} from "../../models/picture";
import {SystemConfiguration} from "../../models/system-vars";


const router = express.Router();


/**
 * @param {e.Request} req
 * @returns {IPhoneNumber}
 */
function getPhoneNumberFromRequest(req: express.Request): IPhoneNumber {
    req.checkBody("phone[country]", "Phone country code is missing").notEmpty();
    req.checkBody("phone[number]", "Phone number is missing").notEmpty();

    return req.body.phone as IPhoneNumber;
}

/**
 * @param {IPhoneConfirmationRequest} phoneConfirmationRequest
 */
function sendConfirmationSms(phoneConfirmationRequest: IPhoneConfirmationRequest) {
    const client = twilio(process.env.TWILIO_SID, process.env.TWILIO_TOKEN);
    client.messages.create({
        body: "Your confirmation code is: " + phoneConfirmationRequest.code,
        to: phoneConfirmationRequest.country + phoneConfirmationRequest.area + phoneConfirmationRequest.number,
        from: process.env.TWILIO_FROM
    });
}

/**
 * @api {post} /auth/phone/request Authenticate via SMS
 * @apiName StartAuth
 * @apiGroup Authentication
 *
 * @apiParam {PhoneNumber} phone Phone number object.
 * @apiParam {String} phone.country Country code
 * @apiParam {String} phone.area Area code
 * @apiParam {String} phone.number Phone number
 *
 * @apiUse ErrorPerformingAction
 */
router.post("/phone/request", (req: express.Request, res: express.Response) => {
    const phoneNumber: IPhoneNumber = getPhoneNumberFromRequest(req);

    if ( req.requestInvalid() ) {
        return;
    }

    const phoneConfirmationRequest = new PhoneConfirmationRequest(phoneNumber);
    phoneConfirmationRequest.code = Utilities.randomString(SystemConfiguration.confirmationCodeLength, "0123456789");

    sendConfirmationSms(phoneConfirmationRequest);
    phoneConfirmationRequest
        .save()
        .catch(function () {
            res.error(AppError.ErrorPerformingAction);
        });

    res.response();
});

/**
 * @api {post} /auth/phone/verify Verify SMS authentication
 * @apiName CompleteAuth
 * @apiGroup Authentication
 *
 * @apiParam {PhoneNumber} phone Phone number object.
 * @apiParam {PhoneNumber} phone.country Country code
 * @apiParam {PhoneNumber} phone.area Area code
 * @apiParam {PhoneNumber} phone.number Phone number
 * @apiParam {String} code 4-digit verification code
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
 */
router.post("/phone/verify", (req: express.Request, res: express.Response) => {
    console.log(req.body);

    const phoneNumber: IPhoneNumber = getPhoneNumberFromRequest(req);
    const confirmationCode: string = req.body.code;

    req.checkBody("code", "Phone verification code is missing").notEmpty();
    req.checkBody("code", "Phone verification code length invalid").isLength({min: SystemConfiguration.confirmationCodeLength, max: SystemConfiguration.confirmationCodeLength});

    if ( req.requestInvalid() ) {
        return;
    }

    (async() => {
        try {
            const phoneConfirmationResults = await PhoneConfirmationRequest.findOne(Object.assign(phoneNumber, {code: confirmationCode}));

            if ( isNullOrUndefined(phoneConfirmationResults) && confirmationCode !== "54321" ) { // TODO: Remove on production
                res.error(AppError.ObjectDoesNotExist);
                return;
            }
            else {
                // if ( phoneConfirmationResults ) {
                //     phoneConfirmationResults.remove();
                // }

                const findByArguments = {
                    "phone.country": phoneNumber.country,
                    "phone.area": phoneNumber.area,
                    "phone.number": phoneNumber.number
                };

                let user = await User.findOne(findByArguments);
                console.log("Found user", user);

                if ( ! user ) {
                    user = new User;
                    user.phone = phoneNumber;
                }

                const authToken: IAuthToken = {
                    authToken: Utilities.randomString(),
                    firebaseToken: ""
                };

                // user.profile = <IUserProfile>{
                //     firstName: "Maty",
                //     lastName: "Michalsky",
                //     picture: <IUserPicture>{
                //         url: "https://scontent.fsdv2-1.fna.fbcdn.net/v/t1.0-9/19702223_10203302270553950_2168285220720904719_n.jpg?oh=341ab8c1a622361a854488368acbe7bd&oe=5A82EA0B",
                //         thumbnail: "https://scontent.fsdv2-1.fna.fbcdn.net/v/t1.0-9/19702223_10203302270553950_2168285220720904719_n.jpg?oh=341ab8c1a622361a854488368acbe7bd&oe=5A82EA0B"
                //     },
                //     bio: "Hello, It's me :)"
                // };

                user.tokens.push(authToken);


                user.save()
                    .then(() => {
                        res.response({
                            user: user.toLoggedUser(),
                            token: authToken.authToken
                        });
                    })
                    .catch((e) => {
                        res.error(AppError.ErrorPerformingAction, e.message);
                    });
            }
        }
        catch (e) {
            res.error(AppError.ErrorPerformingAction, e.message);
        }
    })();

    /*
        TODO:
        1. Find confirmations by phoneConfirmationRequest object (findOne(phoneConfirmationRequest))
        2. Find a user with this phone number (again, by using findOne(phoneNumber))
            - If there is no such user:
                1. Create it
                2. Add into the DB
        3. Return the user object to the client
     */

    // const user = new User();

    // res.status(200).json({user: user});
});

/*
TODO: Add authentication middleware
 */
/**
 * @api {delete} /auth Sign out
 * @apiName SignOut
 * @apiGroup Authentication
 */
router.delete("/", (req: express.Request, res: express.Response) => {
    res.response();
});

export default router;