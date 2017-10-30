import * as express from "express";
import {asyncMiddleware} from "../../server";
import {FacebookAuthentication, IFacebookUser} from "../../utilities/facebook-authentication";
import {AppError} from "../../models/app-error";
import {IAuthTokenModel, IUserModel, IUserProfileModel, User} from "../../models/user";
import {UploadProfilePicture} from "../user/upload-profile-picture";
import {IUserPicture} from "../../models/picture";
import {Utilities} from "../../utilities/utilities";

const router = express.Router();


/**
 * @api {post} /auth/facebook Facebook connect
 * @apiName FacebookConnect
 * @apiGroup Authentication
 *
 * @apiParam {String} facebookToken Facebook token
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
 * @apiUse FacebookAuthenticationError
 * @apiUse UploadingError
 * @apiUse ErrorPerformingAction
 */
router.post("/", asyncMiddleware(async (req: express.Request, res: express.Response) => {
    req.checkBody({
        "facebookToken": {
            notEmpty: {
                errorMessage: "Facebook token is empty"
            }
        }
    });

    if ( req.requestInvalid() ) {
        return;
    }

    const facebookAccessToken: string = req.body.facebookToken;

    const facebookAuthentication = new FacebookAuthentication(facebookAccessToken);

    const facebookUser = await facebookAuthentication
        .addField([
            "email",
            "picture.height(1080).width(1080).redirect(false)"
        ])
        .getUser();

    if ( ! facebookUser || ! facebookUser.id ) {
        throw AppError.FacebookAuthenticationError;
    }

    let user = await User.findOne({facebookId: facebookUser.id});
    if ( ! user ) {
        user = await createUserByFacebookUser(facebookUser);
    }

    const authToken: IAuthTokenModel = {
        authToken: Utilities.randomString(),
        firebaseToken: ""
    };

    user.tokens.push(authToken);

    await user.save();

    res.response({
        user: user.toLoggedUser(),
        token: authToken.authToken
    });
}));

/**
 * @param {IFacebookUser} facebookUser
 * @returns Promise<User | IUserModel>
 */
async function createUserByFacebookUser(facebookUser: IFacebookUser): Promise<IUserModel> {
    let user = null;

    if ( facebookUser.email ) {
        user = await User.findOne({email: facebookUser.email});
    }

    if ( ! user ) {
        user = new User();
    }

    user.email = facebookUser.email;
    user.facebookId = facebookUser.id;

    if ( ! user.profile ) {
        user.profile = <IUserProfileModel>{};
    }

    user.profile.firstName = facebookUser.first_name;
    user.profile.lastName = facebookUser.last_name;

    if ( ! ( user.profile.picture && user.profile.picture.url) && facebookUser.picture && facebookUser.picture.data && facebookUser.picture.data.url ) {
        const uploadProfilePicture = new UploadProfilePicture(user._id.toString());

        try {
            const uploadedProfilePictureData = await uploadProfilePicture
                .url(facebookUser.picture.data.url)
                .uploadUserProfilePicture();

            user.profile.picture = <IUserPicture>{};

            user.profile.picture.url = uploadedProfilePictureData.picture.url;
            user.profile.picture.path = uploadedProfilePictureData.picture.path;

            user.profile.picture.thumbnail = uploadedProfilePictureData.thumbnail.url;
            user.profile.picture.thumbnailPath = uploadedProfilePictureData.thumbnail.path;
        }
        catch (e) {
            throw AppError.UploadingError;
        }
    }

    return user;
}

export default router;