import * as express from "express";

const router = express.Router();

/**
 * @api {post} /notifications Save a push notification token
 * @apiName Save
 * @apiGroup Notifications
 *
 * @apiParam {String} token Push notification token
 */
router.post("/", (req: express.Request, res: express.Response) => {
    res.response();
});

export default router;