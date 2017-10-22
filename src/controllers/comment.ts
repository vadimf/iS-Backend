import * as express from "express";

const router = express.Router();

/**
 * @api {get} /comment/:comment Get comment by ID
 * @apiName Get
 * @apiGroup Comments
 *
 * @apiParam {String} vars Not ready yet...
 *
 * @apiSuccess {String} vars Not ready yet...
 */
router.get("/:comment", (req: express.Request, res: express.Response) => {
    res.response();
});


/**
 * @api {patch} /comment/:comment Edit a comment
 * @apiName Edit
 * @apiGroup Comments
 *
 * @apiParam {String} vars Not ready yet...
 *
 * @apiSuccess {String} vars Not ready yet...
 */
router.patch("/:comment", (req: express.Request, res: express.Response) => {
    res.response();
});


/**
 * @api {delete} /comment/:comment Remove a comment
 * @apiName Remove
 * @apiGroup Post
 */
router.delete("/:comment", (req: express.Request, res: express.Response) => {
    res.response();
});


export default router;