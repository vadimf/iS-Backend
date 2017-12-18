import * as express from "express";
import { asyncMiddleware } from "../../../server";
import { Pagination } from "../../../models/pagination";
import { NotificationLog } from "../../../models/notification-logs";
import { User } from "../../../models/user";
import { CustomNotificationSender } from "../../../utilities/custom-notification-sender";

const router = express.Router();

router
    .route("/")
    .get(asyncMiddleware(async (req: express.Request, res: express.Response) => {
        const conditions = {
            sentByAdministrator: true
        };

        const total = await NotificationLog.count(conditions);
        const page = +req.query.page;
        const resultsPerPage = req.query["results-per-page"] ? +req.query["results-per-page"] : 25;
        const pagination = new Pagination(page, total, resultsPerPage);

        const notifications = await NotificationLog
            .find(conditions)
            .sort("-createdAt")
            .skip(pagination.offset)
            .limit(pagination.resultsPerPage);

        res.response({
            pagination: pagination,
            notifications: notifications
        });
    }))
    .post(asyncMiddleware(async (req: express.Request, res: express.Response) => {
        req.checkBody({
            "message": {
                notEmpty: {
                    errorMessage: "You must fill in a notification message"
                }
            }
        });

        if ( req.requestInvalid() ) {
            return;
        }

        res.response();

        const title: string = req.body.title ? req.body.title : process.env.APP_NAME;
        const message: string = req.body.message;

        (async () => {

            const users = await User.find({blocked: {$ne: false}});

            const notificationSender = new CustomNotificationSender(users);
            await notificationSender
                .fromCms(title, message)
                .send();

        })();
    }));


export default router;