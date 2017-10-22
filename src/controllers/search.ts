import * as express from "express";

const router = express.Router();

/**
 * @api {get} /search/posts Search posts by query
 * @apiName SearchPosts
 * @apiGroup Search
 *
 * @apiParam {String} vars Not ready yet...
 *
 * @apiSuccess {String} vars Not ready yet...
 */
router.post("/", (req: express.Request, res: express.Response) => {
    res.response();
});

/**
 * @api {get} /search/users Search users by query
 * @apiName SearchUsers
 * @apiGroup Search
 *
 * @apiParam {String} vars Not ready yet...
 *
 * @apiSuccess {String} vars Not ready yet...
 */
router.post("/", (req: express.Request, res: express.Response) => {
    res.response();
});

export default router;