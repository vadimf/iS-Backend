import * as express from "express";

const router = express.Router();

/**
 * @api {get} /feed Get posts feed
 * @apiName Get
 * @apiGroup Feed
 *
 * @apiParam {String} vars Not ready yet...
 *
 * @apiSuccess {String} vars Not ready yet...
 */
router.post("/", (req: express.Request, res: express.Response) => {
    res.response();
});

export default router;