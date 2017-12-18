import * as express from "express";
import { asyncMiddleware } from "../../../server";
import { IPasswordModel } from "../../../models/user";
import { AppError } from "../../../models/app-error";
import { Utilities } from "../../../utilities/utilities";
import { SystemConfiguration } from "../../../models/system-vars";
import * as nodemailer from "nodemailer";
import * as pug from "pug";
import { Administrator, IAdministratorModel } from "../../../models/admin/administrator";

const router = express.Router();

async function getAdministratorByToken(token: string) {
    const user = await Administrator.findOne({"password.resetToken": token});

    if ( ! user ) {
        throw AppError.ObjectDoesNotExist;
    }

    return user;
}

router
    .route("/")
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

        let user: IAdministratorModel;
        user = await getAdministratorByToken(token);

        res.response({
            administrator: user
        });
    }))

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

        const email: string = req.body.email.toLowerCase();

        const user = await Administrator.findOne({email: email});
        if ( ! user ) {
            throw AppError.ObjectDoesNotExist;
        }

        if ( ! user.password ) {
            user.password = <IPasswordModel>{};
        }

        user.password.resetToken = Utilities.randomString(24);

        await user.save();

        res.response();

        sendPasswordRestorationEmail(user)
            .then(() => {})
            .catch((err) => {
                console.log("Email error", err);
            });
    }));

function sendPasswordRestorationEmail(user: IAdministratorModel) {
    const path = __dirname + "/../../../../views/emails/password-restoration.pug";
    const renderedView = pug.renderFile(path, {
        brand: process.env.APP_NAME,
        user: user,
        link: process.env.ADMIN_URL + "reset-password/?token=" + user.password.resetToken
    });

    const transporterOptions = {
        host: process.env.EMAIL_HOST,
        port: +process.env.EMAIL_PORT,
        secure: process.env.EMAIL_SECURE === "true",
        auth: {
            user: process.env.EMAIL_AUTH_USER,
            pass: process.env.EMAIL_AUTH_PASSWORD
        }
    };

    const transporter = nodemailer.createTransport(transporterOptions);

    const mailOptions = {
        from: process.env.APP_NAME + " <" + process.env.EMAIL_FROM + ">",
        to: user.email,
        subject: "(" + process.env.APP_NAME + ") Password recovery",
        html: renderedView
    };

    return new Promise((resolve, reject) => {
        transporter.sendMail(mailOptions, (error?: Error, info?: nodemailer.SentMessageInfo) => {
            if (error) {
                reject(error);
                return;
            }

            resolve(info);
        });
    });
}

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

    const user = await getAdministratorByToken(token);

    await user.password.setPassword(newPassword);
    user.password.resetToken = null;

    await user.save();

    res.response();
}));


export default router;