import * as express from "express";
import { Pagination } from "../../models/pagination";
import { foreignUsersArray, populateFollowing, User } from "../../models/user";
import { Post } from "../../models/post";
import { Utilities } from "../../utilities/utilities";
import { asyncMiddleware } from "../../server";

const router = express.Router();

/**
 * @api {get} /search/posts?query=Maty&page=1 Search posts by query
 * @apiName SearchPosts
 * @apiGroup Search
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
router.get("/posts", asyncMiddleware(async (req: express.Request, res: express.Response) => {
    const searchQuery: string = req.query.query;
    const searchRegex = Utilities.stringToRegExp("/.*" + searchQuery + ".*/i");
    const page: number = +req.query.page;
    const totalResults = await Post.count({text: searchRegex});
    const pagination = new Pagination(page, totalResults);

    const posts = await Post
        .find({text: searchRegex})
        .populate("creator")
        .limit(pagination.resultsPerPage)
        .skip(pagination.offset);

    await populateFollowing(posts, req.user, "creator");

    res.response({
        users: posts,
        pagination: pagination
    });
}));

/**
 * @api {search} /search/users?query=Maty&page=1 Search users by query
 * @apiName SearchUsers
 * @apiGroup Search
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
router.get("/users", asyncMiddleware(async (req: express.Request, res: express.Response) => {
    const searchQuery: string = req.query.query;
    const searchRegex = Utilities.stringToRegExp("/.*" + searchQuery + ".*/i");
    const page: number = +req.query.page;
    const totalResults = await User.count({username: searchRegex});
    const pagination = new Pagination(page, totalResults);

    const users = await User
        .find({username: searchRegex})
        .limit(pagination.resultsPerPage)
        .skip(pagination.offset);

    await populateFollowing(users, req.user);

    res.response({
        users: foreignUsersArray(users),
        pagination: pagination
    });
}));

export default router;