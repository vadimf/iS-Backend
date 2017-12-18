import * as express from "express";
import { isNullOrUndefined } from "util";
import { Utilities } from "../../utilities/utilities";
import { SystemConfiguration } from "../../models/system-vars";
import { User } from "../../models/user";
import { AppError } from "../../models/app-error";
import { UploadProfilePicture } from "./upload-profile-picture";
import { StorageManager } from "../../utilities/storage-manager";

/**
 * Update all user details: Profile image, first name, last name, bio
 *
 * @param {e.Request} req
 * @returns {Promise<void>}
 */
export async function updateUserDetails(req: express.Request) {
    if ( req.body.user ) {
        await updateUsername(req);
        await updateEmail(req);

        if (req.body.user.profile) {
            if (!req.user.profile) {
                req.user.profile = {};
            }

            await updateProfileImage(req);
            await updateFirstName(req);
            await updateLastName(req);
            await updateWebsite(req);
            await updateBio(req);
        }
    }
}

/**
 * Update the user's email address
 *
 * @param {e.Request} req
 */
async function updateEmail(req: express.Request) {
    if ( req.body.user.email ) {
        req.checkBody({
            "user[email]": {
                isEmail: {
                    errorMessage: "Email is invalid"
                }
            }
        });

        const email: string = req.body.user.email.toLowerCase();

        if ( email ) {
            const foundUser = await User.findOne({email: email});

            if ( foundUser && ! foundUser._id.equals(req.user._id)) {
                throw AppError.EmailAlreadyTaken;
            }
        }

        req.user.email = req.body.user.email;
    }
}

/**
 * Update the user's first name
 *
 * @param {e.Request} req
 */
function updateFirstName(req: express.Request) {
    if ( ! isNullOrUndefined(req.body.user.profile.firstName) ) {
        if ( req.body.user.profile.firstName ) {
            req.checkBody({
                "user[profile][firstName]": {
                    matches: {
                        options: Utilities.stringToRegExp(SystemConfiguration.validations.firstName.regex),
                        errorMessage: "First-name doesn't match regex"
                    },
                    isLength: {
                        options: [{
                            min: SystemConfiguration.validations.firstName.minLength,
                            max: SystemConfiguration.validations.firstName.maxLength
                        }],
                        errorMessage: "First-name length is invalid"
                    }
                }
            });
        }

        req.user.profile.firstName = req.body.user.profile.firstName;
    }
}

/**
 * Update the user's last name
 *
 * @param {e.Request} req
 */
function updateLastName(req: express.Request) {
    if ( ! isNullOrUndefined(req.body.user.profile.lastName) ) {
        if ( req.body.user.profile.lastName ) {
            req.checkBody({
                "user[profile][lastName]": {
                    matches: {
                        options: Utilities.stringToRegExp(SystemConfiguration.validations.lastName.regex),
                        errorMessage: "Last-name doesn't match regex"
                    },
                    isLength: {
                        options: [{
                            min: SystemConfiguration.validations.lastName.minLength,
                            max: SystemConfiguration.validations.lastName.maxLength
                        }],
                        errorMessage: "Last-name length is invalid"
                    }
                }
            });
        }

        req.user.profile.lastName = req.body.user.profile.lastName;
    }
}

/**
 * Update the user's website
 *
 * @param {e.Request} req
 */
function updateWebsite(req: express.Request) {
    if ( ! isNullOrUndefined(req.body.user.profile.website) ) {
        if ( req.body.user.profile.website ) {
            req.checkBody({
                "user[profile][website]": {
                    matches: {
                        options: /^([\w\-\.]+[^#?\s]+)(.*)?(#[\w\-]+)?$/,
                        errorMessage: "Website URL invalid"
                    }
                }
            });
        }

        req.user.profile.website = req.body.user.profile.website;
    }
}

/**
 * Update the user's bio
 *
 * @param {e.Request} req
 */
function updateBio(req: express.Request) {
    if ( ! isNullOrUndefined(req.body.user.profile.bio) ) {
        req.checkBody({
            "user[profile][bio]": {
                isLength: {
                    options: [{
                        min: 0,
                        max: SystemConfiguration.validations.bio.maxLength
                    }],
                    errorMessage: "Last-name length is invalid"
                }
            }
        });

        req.user.profile.bio = req.body.user.profile.bio;
    }
}

/**
 * Update the user's profile image
 *
 * @param {e.Request} req
 * @returns {Promise<void>}
 */
async function updateProfileImage(req: express.Request) {
    if ( ! req.body.user.profile.picture || ! req.body.user.profile.picture.upload ) {
        return;
    }

    if ( req.validationErrors() ) {
        return;
    }

    const imageBase64 = req.body.user.profile.picture.upload;

    const uploadProfilePicture = new UploadProfilePicture(req.user._id.toString());

    let uploadedProfilePictureData: any;

    try {
        uploadedProfilePictureData = await uploadProfilePicture
            .base64(imageBase64)
            .uploadUserProfilePicture();
    }
    catch (e) {
        throw AppError.UploadingError;
    }

    if (!req.user.profile.picture) {
        req.user.profile.picture = {};
    }
    else {
        if (req.user.profile.picture.url) {
            StorageManager
                .removeFile(req.user.profile.picture.url)
                .then(() => {})
                .catch(() => {});
        }

        if (req.user.profile.picture.thumbnail) {
            StorageManager
                .removeFile(req.user.profile.picture.thumbnail)
                .then(() => {})
                .catch(() => {});
        }
    }

    req.user.profile.picture = {
        thumbnail: uploadedProfilePictureData.thumbnail,
        url: uploadedProfilePictureData.picture
    };
}

/**
 * Update the user's username
 *
 * @param {e.Request} req
 * @returns {Promise<void>}
 */
async function updateUsername(req: express.Request) {
    if ( ! req.body.user.username && req.user.username ) {
        return;
    }

    req.checkBody({
        "user[username]": {
            matches: {
                options: Utilities.stringToRegExp("/" + SystemConfiguration.validations.username.regex + "/"),
                errorMessage: "Username doesn't match regex"
            },
            isLength: {
                options: [{
                    min: SystemConfiguration.validations.username.minLength,
                    max: SystemConfiguration.validations.username.maxLength
                }],
                errorMessage: "Username length is invalid"
            }
        }
    });

    const username: String = req.body.user.username;

    const foundUser = await User.findOne({
        username: username
    });

    if ( foundUser && ! foundUser._id.equals(req.user._id)) {
        throw AppError.UsernameAlreadyTaken;
    }

    req.user.username = username;
}