import * as express from "express";
import { asyncMiddleware } from "../../server";
import { IPhoneNumberModel } from "../../models/phone-number";
import { generatePhoneConfirmationRequest, getPhoneNumberFromRequest, sendConfirmationSms } from "../auth/phone-auth";
import { User } from "../../models/user";
import { AppError } from "../../models/app-error";
import { SystemConfiguration } from "../../models/system-vars";
import PhoneConfirmationRequest from "../../models/phone-confirmation-request";

const router = express.Router({mergeParams: true});

/**
 * @api {post} /user/phone/request Request phone verification for user
 * @apiName RequestPhoneVerificationForUser
 * @apiGroup User
 *
 * @apiParam {PhoneNumber}    phone PhoneNumber object
 * @apiParam {String}         phone.country   Phone country code <code>(for example: +972)</code>
 * @apiParam {String}         phone.area      Phone area code <code>(optional, for example: 52)</code>
 * @apiParam {String}         phone.number    Phone number <code>(for example: 8330112)</code>
 *
 * @apiUse ObjectExist
 */
router.post("/request", asyncMiddleware(async (req: express.Request, res: express.Response) => {
    const phoneNumber: IPhoneNumberModel = getPhoneNumberFromRequest(req);

    if ( req.requestInvalid() ) {
        return;
    }

    const conditions: {"phone.number": string, "phone.country": string, "phone.area"?: string} = {
        "phone.number": phoneNumber.number,
        "phone.country": phoneNumber.country
    };

    if ( phoneNumber.area ) {
        conditions["phone.area"] = phoneNumber.area;
    }

    const usersByPhone = await User.count(conditions);

    if ( usersByPhone ) {
        throw AppError.ObjectExist;
    }

    const phoneConfirmationRequest = generatePhoneConfirmationRequest(phoneNumber);
    phoneConfirmationRequest.user = req.user;

    await sendConfirmationSms(phoneConfirmationRequest);
    await phoneConfirmationRequest.save();

    res.response();
}));

/**
 * @api {post} /user/phone/verify Verify phone number for user by code
 * @apiName VerifyPhoneNumberForUser
 * @apiGroup User
 *
 * @apiParam {String}         code Phone confirmation code received via SMS
 *
 * @apiUse ObjectDoesNotExist
 * @apiUse ObjectExist
 */
router.post("/verify", asyncMiddleware(async (req: express.Request, res: express.Response) => {
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

    const phoneConfirmation = await PhoneConfirmationRequest.findOne({user: req.user._id, code: confirmationCode});

    if ( ! phoneConfirmation ) {
        throw AppError.ObjectDoesNotExist;
    }

    const phoneNumber: IPhoneNumberModel = {
        country: phoneConfirmation.country,
        area: phoneConfirmation.area,
        number: phoneConfirmation.number
    };

    const userByPhone = await User.count(phoneNumber);

    if ( userByPhone ) {
        removePhoneConfirmationRequestByPhoneNumber(phoneNumber)
            .then(() => {})
            .catch(() => {});

        throw AppError.ObjectExist;
    }

    req.user.phone = phoneNumber;
    const Promises = [
        removePhoneConfirmationRequestByPhoneNumber(phoneNumber),
        req.user.save()
    ];


    await Promise.all(Promises);


    res.response();
}));

/**
 * @param {IPhoneNumberModel} phoneNumber
 * @returns {Promise<"mongoose".Query<void>>}
 */
async function removePhoneConfirmationRequestByPhoneNumber(phoneNumber: IPhoneNumberModel) {
    return PhoneConfirmationRequest.remove(phoneNumber);
}

export default router;