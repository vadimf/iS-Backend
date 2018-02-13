import * as express from "express";
import { asyncMiddleware } from "../../../server";
import { Pagination } from "../../../models/pagination";
import { User } from "../../../models/user";
import { IPost, Post, postsToAdministrators } from "../../../models/post";
import { getPostById } from "../../post/post";
import { AppError } from "../../../models/app-error";
import { blockUser } from "../user/user";

const router = express.Router();

router
    .get("/", asyncMiddleware(async (req: express.Request, res: express.Response) => {
        const conditions: any = {
            reports: {
                $exists: true,
                $ne: []
            }
        };

        const total = await Post.count(conditions);
        const page = +req.query.page;
        const resultsPerPage = req.query["results-per-page"] ? +req.query["results-per-page"] : 25;
        const pagination = new Pagination(page, total, resultsPerPage);

        const posts = await Post
            .find(conditions)
            .skip(pagination.offset)
            .limit(pagination.resultsPerPage)
            .populate("creator")
            .populate("reports.creator")
            .sort("-reports.createdAt");

        res.response({
            posts: postsToAdministrators(posts),
            pagination: pagination
        });
    }));

async function getPostByIdForAdministrator(postId: string): Promise<IPost> {
    const post = await getPostById(postId, false);

    if ( ! post.reports || ! post.reports.length ) {
        throw AppError.ObjectDoesNotExist;
    }

    return post;
}

router
    .route("/:post")
    .get(asyncMiddleware(async (req: express.Request, res: express.Response) => {
        const postId: string = req.params.post;
        const post = await getPostByIdForAdministrator(postId);

        res.response({
            post: post.toAdministrators()
        });
    }))

    .delete(asyncMiddleware(async (req: express.Request, res: express.Response) => {
        const postId: string = req.params.post;
        const post = await getPostByIdForAdministrator(postId);

        post.reports = [];
        await post.save();

        res.response();
    }));

router
    .post("/:post/block", asyncMiddleware(async (req: express.Request, res: express.Response) => {
        const postId: string = req.params.post;
        const post = await getPostByIdForAdministrator(postId);

        post.reports = [];

        const user = await User.findOne({_id: post.creator});

        await Promise.all([
            post.save(),
            blockUser(user)
        ]);

        res.response();
    }));

export default router;