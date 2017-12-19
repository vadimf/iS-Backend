import * as express from "express";
import { asyncMiddleware } from "../../../server";
import { SystemConfiguration } from "../../../models/system-vars";
import { Administrator, IAdministratorModel } from "../../../models/admin/administrator";
import { AppError } from "../../../models/app-error";
import { Pagination } from "../../../models/pagination";
import { Utilities } from "../../../utilities/utilities";
import * as nodemailer from "nodemailer";
import * as pug from "pug";

const router = express.Router();

router
    .route("/")
    .get(asyncMiddleware(async (req: express.Request, res: express.Response) => {
        res.response({
            administrator: req.user
        });
    }))

    .patch(asyncMiddleware(async (req: express.Request, res: express.Response) => {
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

        const newPassword: string = req.body.password;

        await Promise.all([req.user.password.setPassword(newPassword), req.user.save()]);

        res.response();
    }))

    .post(asyncMiddleware(async (req: express.Request, res: express.Response) => {
        req.checkBody({
            "email": {
                isEmail: {
                    errorMessage: "Invalid email address"
                }
            }
        });

        if ( req.requestInvalid() ) {
            return;
        }

        const email: string = req.body.email.toLowerCase();
        const password: string = generatePassword();

        if ( await Administrator.count({email: email}) > 0 ) {
            throw AppError.ObjectExist;
        }

        const administrator = new Administrator({email: email});

        console.log(await sendNewAdministratorEmail(administrator, password));
        await Promise.all([administrator.password.setPassword(password), administrator.save()]);

        res.response();
    }));

function generatePassword(): string {
    return Utilities.randomString(8);
}

function sendNewAdministratorEmail(admin: IAdministratorModel, password: string) {
    const path = __dirname + "/../../../../views/emails/new-administrator.pug";
    const renderedView = pug.renderFile(path, {
        brand: process.env.APP_NAME,
        admin: admin,
        password: password,
        link: process.env.ADMIN_URL
    });

    const mailOptions = {
        to: admin.email,
        subject: "(" + process.env.APP_NAME + ") You are now an administrator!",
        html: renderedView
    };

    return sendEmail(mailOptions);
}

function sendEmail(mailOptions: {from?: string, to: string, subject: string, html: string}) {
    if ( ! mailOptions.from ) {
        mailOptions.from = process.env.APP_NAME + " <" + process.env.EMAIL_FROM + ">";
    }

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

    return new Promise((resolve, reject) => {
        transporter.sendMail(mailOptions, (error?: Error, info?: nodemailer.SentMessageInfo) => {
            if (error) {
                console.log("Email error", error);
                reject(error);
                return;
            }

            resolve(info);
        });
    });
}

function sendPasswordResetEmail(admin: IAdministratorModel, password: string) {
    const path = __dirname + "/../../../../views/emails/new-administrator-password.pug";
    const renderedView = pug.renderFile(path, {
        brand: process.env.APP_NAME,
        admin: admin,
        password: password,
        link: process.env.ADMIN_URL
    });

    const mailOptions = {
        to: admin.email,
        subject: "(" + process.env.APP_NAME + ") Your password has changed!",
        html: renderedView
    };

    return sendEmail(mailOptions);
}

router
    .get("/all", asyncMiddleware(async (req: express.Request, res: express.Response) => {
        const total = await Administrator.count({});
        const page = +req.query.page;
        const resultsPerPage = req.query["results-per-page"] ? +req.query["results-per-page"] : 25;
        const pagination = new Pagination(page, total, resultsPerPage);

        const administrators = await Administrator
            .find()
            .sort("createdAt")
            .skip(pagination.offset)
            .limit(pagination.resultsPerPage);

        res.response({
            administrators: administrators,
            pagination: pagination
        });
    }));

async function getAdministratorById(id: string) {
    const administrator = await Administrator
        .findOne({_id: id});

    if ( ! administrator ) {
        throw AppError.ObjectDoesNotExist;
    }

    return administrator;
}

router
    .route("/:id")
    .get(asyncMiddleware(async (req: express.Request, res: express.Response) => {
        const administratorId: string = req.params.id;
        const administrator = await getAdministratorById(administratorId);

        res.response({
            administrator: administrator
        });
    }))
    .patch(asyncMiddleware(async (req: express.Request, res: express.Response) => {
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

        const administratorId: string = req.params.id;
        const administrator = await getAdministratorById(administratorId);
        const password: string = req.body.password;

        await Promise.all([administrator.password.setPassword(password), administrator.save()]);

        res.response({
            administrator: administrator
        });
    }))
    .delete(asyncMiddleware(async (req: express.Request, res: express.Response) => {
        const administratorId: string = req.params.id;
        const administrator = await getAdministratorById(administratorId);

        if ( administrator._id.equals(req.user._id) ) {
            throw AppError.CannotDeleteOwnUser;
        }

        await administrator.remove();

        res.response();
    }));


router
    .post("/:id/reset-password", asyncMiddleware(async (req: express.Request, res: express.Response) => {
        const administratorId: string = req.params.id;
        const administrator = await getAdministratorById(administratorId);

        const newPassword = generatePassword();

        await sendPasswordResetEmail(administrator, newPassword);
        await Promise.all([administrator.password.setPassword(newPassword), administrator.save()]);

        res.response();
    }));

export default router;