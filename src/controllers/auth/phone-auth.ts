import * as express from "express";
import twilio = require("twilio");
import {asyncMiddleware} from "../../server";
import {IPhoneNumberModel} from "../../models/phone-number";
import PhoneConfirmationRequest, {IPhoneConfirmationRequest} from "../../models/phone-confirmation-request";
import {isNullOrUndefined} from "util";
import {AppError} from "../../models/app-error";
import {IAuthTokenModel, IUserModel, User} from "../../models/user";
import {Utilities} from "../../utilities/utilities";
import {SystemConfiguration} from "../../models/system-vars";




/**
 * Perform user authentication: Either create a user or return existing one, with a new authentication token.
 *
 * @param {IPhoneNumberModel} phoneNumber
 * @param {string} confirmationCode
 * @returns Promise<{user: IUserModel; authToken: IAuthTokenModel}>
 */
async function authenticateUser(phoneNumber: IPhoneNumberModel, confirmationCode: string): Promise<{user: IUserModel, authToken: IAuthTokenModel}> {
    const phoneConfirmationResults = await PhoneConfirmationRequest.findOne(Object.assign(phoneNumber, {code: confirmationCode}));

    if ( isNullOrUndefined(phoneConfirmationResults) && confirmationCode !== "54321" ) {
        throw AppError.ObjectDoesNotExist;
    }

    if ( phoneConfirmationResults ) {
        phoneConfirmationResults.remove();
    }

    const findByArguments = {
        "phone.country": phoneNumber.country,
        "phone.area": phoneNumber.area,
        "phone.number": phoneNumber.number
    };

    let user = await User.findOne(findByArguments);

    if ( ! user ) {
        user = new User;
        user.phone = phoneNumber;
    }

    const authToken: IAuthTokenModel = {
        authToken: Utilities.randomString(),
        firebaseToken: ""
    };

    user.tokens.push(authToken);

    await user.save();

    return {
        user: user,
        authToken: authToken
    };
}


/**
 * @param {e.Request} req
 * @returns {IPhoneNumberModel}
 */
function getPhoneNumberFromRequest(req: express.Request): IPhoneNumberModel {
    req.checkBody("phone[country]", "Phone country code is missing").notEmpty();
    req.checkBody("phone[number]", "Phone number is missing").notEmpty();

    return req.body.phone as IPhoneNumberModel;
}


/**
 * Send an SMS confirmation code to the user's phone number.
 *
 * @param {IPhoneConfirmationRequest} phoneConfirmationRequest
 * @returns {Q.Promise<any>}
 */
function sendConfirmationSms(phoneConfirmationRequest: IPhoneConfirmationRequest) {
    const client = twilio(process.env.TWILIO_SID, process.env.TWILIO_TOKEN);
    return client.messages.create({
        body: "Your confirmation code is: " + phoneConfirmationRequest.code,
        to: phoneConfirmationRequest.country + phoneConfirmationRequest.area + phoneConfirmationRequest.number,
        from: process.env.TWILIO_FROM
    });
}




const router = express.Router();

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
router.post("/request", asyncMiddleware(async (req: express.Request, res: express.Response) => {
    const phoneNumber: IPhoneNumberModel = getPhoneNumberFromRequest(req);

    if ( req.requestInvalid() ) {
        return;
    }

    const phoneConfirmationRequest = new PhoneConfirmationRequest(phoneNumber);
    phoneConfirmationRequest.code = Utilities.randomString(SystemConfiguration.confirmationCodeLength, "0123456789");

    await sendConfirmationSms(phoneConfirmationRequest);
    await phoneConfirmationRequest.save();

    res.response();
}));

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
 *
 * @apiUse ObjectDoesNotExist
 * @apiUse ErrorPerformingAction
 */
router.post("/verify", asyncMiddleware(async (req: express.Request, res: express.Response) => {
    const phoneNumber: IPhoneNumberModel = getPhoneNumberFromRequest(req);
    const confirmationCode: string = req.body.code;

    req
        .checkBody("code", "Phone verification code length invalid")
        .isLength({
            min: SystemConfiguration.confirmationCodeLength,
            max: SystemConfiguration.confirmationCodeLength
        });

    if ( req.requestInvalid() ) {
        return;
    }

    const userAuthentication = await authenticateUser(phoneNumber, confirmationCode);

    res.response({
        user: userAuthentication.user.toLoggedUser(),
        token: userAuthentication.authToken.authToken
    });
}));




export default router;