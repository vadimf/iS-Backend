import * as express from "express";

const router = express.Router();

/**
 * @api {post} /post Create a post
 * @apiName Create
 * @apiGroup Posts
 *
 * @apiParam {String} vars Not ready yet...
 *
 * @apiSuccess {String} vars Not ready yet...
 */
router.post("/", (req: express.Request, res: express.Response) => {
    res.response();
});


/**
 * @api {get} /post/:post Get post by ID
 * @apiName Get
 * @apiGroup Posts
 *
 * @apiSuccess {String} vars Not ready yet...
 */
router.get("/:post", (req: express.Request, res: express.Response) => {
    res.response();
});


/**
 * @api {patch} /post/:post Edit a post
 * @apiName Edit
 * @apiGroup Post
 *
 * @apiParam {String} vars Not ready yet...
 *
 * @apiSuccess {String} vars Not ready yet...
 */
router.patch("/:post", (req: express.Request, res: express.Response) => {
    res.response();
});


/**
 * @api {delete} /post Remove a post
 * @apiName Remove
 * @apiGroup Post
 */
router.delete("/:post", (req: express.Request, res: express.Response) => {
    res.response();
});


/**
 * @api {get} /post/:post/likes Get post likes
 * @apiName GetLikes
 * @apiGroup Post
 *
 * @apiParam {String} vars Not ready yet...
 *
 * @apiSuccess {String} vars Not ready yet...
 */
router.get("/:post/likes", (req: express.Request, res: express.Response) => {
    res.response();
});


/**
 * @api {post} /post/:post/like Like a postttt....
 * @apiName LikePost
 * @apiGroup Post
 */
router.post("/:post/like", (req: express.Request, res: express.Response) => {
    res.response();
});


/**
 * @api {delete} /post/:post/like Un-like a post
 * @apiName UnlikePost
 * @apiGroup Post
 */
router.delete("/:post/like", (req: express.Request, res: express.Response) => {
    res.response();
});


/**
 * @api {get} /post/:post/comments Post's comments
 * @apiName GetComments
 * @apiGroup Post
 *
 * @apiSuccess {String} vars Not ready yet...
 */
router.get("/:post/comments", (req: express.Request, res: express.Response) => {
    res.response();
});


/**
 * @api {post} /post/:post/comment Comment on a post
 * @apiName CreateComment
 * @apiGroup Post
 *
 * @apiParam {String} vars Not ready yet...
 *
 * @apiSuccess {String} vars Not ready yet...
 */
router.post("/:post/comment", (req: express.Request, res: express.Response) => {
    res.response();
});

export default router;