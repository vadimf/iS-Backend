import * as express from "express";

const router = express.Router();

/**
 * @api {patch} /notifications Save a push notification token
 * @apiName Save
 * @apiGroup Notifications
 *
 * @apiParam {String} token Push notification token
 */
router.patch("/", (req: express.Request, res: express.Response) => {
    req.authToken.firebaseToken = req.body.token;

    req.user
        .save()
        .then(() => {})
        .catch(() => {});

    res.response();
});

export default router;