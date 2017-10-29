import * as express from "express";
import {isNullOrUndefined} from "util";
import {Utilities} from "../../utilities/utilities";
import {SystemConfiguration} from "../../models/system-vars";
import {User} from "../../models/user";
import {AppError} from "../../models/app-error";
import fs = require("fs");
import sharp = require("sharp");

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
            await updateBio(req);
        }
    }
}

/**
 * Update the user's email address
 *
 * @param {e.Request} req
 */
function updateEmail(req: express.Request) {
    if ( req.body.user.email ) {
        req.checkBody({
            "user[email]": {
                isEmail: {
                    errorMessage: "Email is invalid"
                }
            }
        });

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

        req.user.profile.lastName = req.body.user.profile.lastName;
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
    if ( ! req.body.user.profile.picture ) {
        return;
    }

    req.checkBody({
        "user[profile][picture]": {
            isBase64: {
                errorMessage: "Base64 invalid"
            }
        }
    });

    if ( ! req.requestInvalid() ) {
        const imageBase64 = req.body.user.profile.picture;
        const buffer = new Buffer(imageBase64, "base64");

        if (!fs.existsSync(process.env.UPLOADS_PATH)) {
            fs.mkdir(process.env.UPLOADS_PATH, (err) => {
                if (err) {
                    console.log("Uploading error", err);
                    throw AppError.UploadingError;
                }
            });
        }

        const uploadsPath = process.env.UPLOADS_PATH + "/" + req.user._id;
        const uploadsUrl = process.env.UPLOADS_URL + "/" + req.user._id;

        if ( ! fs.existsSync(uploadsPath) ) {
            fs.mkdir(uploadsPath, (err) => {
                if (err) {
                    throw AppError.UploadingError;
                }
            });
        }

        const fileName = Utilities.randomString(32);
        const thumbnailFileName = fileName + ".thumb";
        const fileExtension = ".png";

        const filePath = uploadsPath + "/" + fileName + fileExtension;
        const thumbnailFilePath = uploadsPath + "/" + thumbnailFileName + fileExtension;

        const fileUrl = uploadsUrl + "/" + fileName + fileExtension;
        const thumbnailFileUrl = uploadsUrl + "/" + thumbnailFileName + fileExtension;

        if ( ! req.user.profile.picture ) {
            req.user.profile.picture = {};
        }
        else {
            if ( req.user.profile.picture.path ) {
                fs.unlink(req.user.profile.picture.path, (err) => {
                    if ( err) {
                        console.log("Error removing previous image", err);
                    }
                });
            }

            if ( req.user.profile.picture.thumbnailPath ) {
                fs.unlink(req.user.profile.picture.thumbnailPath, (err) => {
                    if ( err) {
                        console.log("Error removing previous thumbnail", err);
                    }
                });
            }
        }

        const thumbnailCreationPromise = sharp(buffer)
            .resize(200, 200)
            .toFile(thumbnailFilePath);
                //
        const imageSavingPromise = sharp(buffer)
            .toFile(filePath);

        try {
            await Promise.all([thumbnailCreationPromise, imageSavingPromise]);
        }
        catch (e) {
            throw AppError.ErrorPerformingAction;
        }

        req.user.profile.picture.thumbnail = thumbnailFileUrl;
        req.user.profile.picture.thumbnailPath = thumbnailFilePath;

        req.user.profile.picture.url = fileUrl;
        req.user.profile.picture.path = filePath;
    }
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
                options: Utilities.stringToRegExp(SystemConfiguration.validations.username.regex),
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