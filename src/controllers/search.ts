import * as express from "express";
import {Pagination} from "../models/pagination";
import {ForeignUserStub} from "../models/user";
import {postsWithPaginationResponseStub} from "../models/post";

const router = express.Router();

/**
 * @api {get} /search/posts Search posts by query
 * @apiName SearchPosts
 * @apiGroup Search
 *
 * @apiParam {int} page Page
 * @apiParam {String} query Query string
 *
 * @apiSuccess {Post[]}     posts Post object
 * @apiSuccess {String}         posts.id Post ID
 * @apiSuccess {String}         posts.createdAt Post creation date
 * @apiSuccess {String}         posts.creator Creator (user) object
 * @apiSuccess {String}             posts.creator.username Username
 * @apiSuccess {Profile}            posts.creator.profile User's profile metadata
 * @apiSuccess {String}                 posts.creator.profile.firstName First name
 * @apiSuccess {String}                 posts.creator.profile.lastName Last name
 * @apiSuccess {Object}                 posts.creator.profile.picture User's profile picture
 * @apiSuccess {String}                     posts.creator.profile.picture.url Url
 * @apiSuccess {String}                     posts.creator.profile.picture.thumbnail Thumbnail url
 * @apiSuccess {String}                 posts.creator.profile.bio Bio text
 * @apiSuccess {int}                posts.creator.following Following counter
 * @apiSuccess {int}                posts.creator.followers Followers counter
 * @apiSuccess {boolean}            posts.creator.isFollowing Already following this user
 * @apiSuccess {String}             posts.creator.createdAt Date registered
 *
 * @apiSuccess {Pagination}     pagination Pagination object
 * @apiSuccess {int}                pagination.page Current page
 * @apiSuccess {int}                pagination.pages Total pages
 * @apiSuccess {int}                pagination.results Total results
 * @apiSuccess {int}                pagination.resultsPerPage Displaying results per page
 * @apiSuccess {int}                pagination.offset Start offset
 */
router.get("/posts", (req: express.Request, res: express.Response) => {
    res.response(postsWithPaginationResponseStub(req));
});

/**
 * @api {get} /search/users Search users by query
 * @apiName SearchUsers
 * @apiGroup Search
 *
 * @apiParam {String} query Query string (username)
 * @apiParam {int} page Page
 *
 * @apiSuccess {User[]}     users Foreign user object
 * @apiSuccess {String}         users.username Username
 * @apiSuccess {Profile}        users.profile User's profile metadata
 * @apiSuccess {String}             users.profile.firstName First name
 * @apiSuccess {String}             users.profile.lastName Last name
 * @apiSuccess {Object}             users.profile.picture User's profile picture
 * @apiSuccess {String}                 users.profile.picture.url Url
 * @apiSuccess {String}                 users.profile.picture.thumbnail Thumbnail url
 * @apiSuccess {String}             users.profile.bio Bio text
 * @apiSuccess {int}            users.following Following counter
 * @apiSuccess {int}            users.followers Followers counter
 * @apiSuccess {boolean}        users.isFollowing Already following this user
 * @apiSuccess {String}         users.createdAt Date registered
 *
 * @apiSuccess {Pagination}     pagination Pagination object
 * @apiSuccess {int}                pagination.page Current page
 * @apiSuccess {int}                pagination.pages Total pages
 * @apiSuccess {int}                pagination.results Total results
 * @apiSuccess {int}                pagination.resultsPerPage Displaying results per page
 * @apiSuccess {int}                pagination.offset Start offset
 */
router.post("/users", (req: express.Request, res: express.Response) => {
    const pagination = new Pagination(1, 3, 50);

    res.response({
        users: [ForeignUserStub, ForeignUserStub, ForeignUserStub],
        pagination: pagination
    });
});

export default router;