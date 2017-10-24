import * as express from "express";
import {postsWithPaginationResponseStub} from "../../models/post";

const router = express.Router();

/**
 * @api {get} /feed Get posts feed
 * @apiName Get
 * @apiGroup Feed
 *
 * @apiParam {int} page Page
 *
 * @apiSuccess {Post[]}     post Post objects
 * @apiSuccess {String}         posts.id Post ID
 * @apiSuccess {String}         posts.createdAt Post creation date
 * @apiSuccess {User}           posts.creator Creator (user) object
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
 * @apiSuccess {Video}          posts.video Video object
 * @apiSuccess {String}             posts.video.url Video file URL
 * @apiSuccess {String[]}           posts.video.thumbnails Thumbnails URLs
 * @apiSuccess {int}                posts.video.duration Video duration (seconds)
 * @apiSuccess {int}            posts.views Post views
 * @apiSuccess {int}            posts.uniqueViews Post unique views
 * @apiSuccess {int}            posts.comments Post comments
 * @apiSuccess {String}         posts.text Post text
 *
 * @apiSuccess {Pagination}     pagination Pagination object
 * @apiSuccess {int}                pagination.page Current page
 * @apiSuccess {int}                pagination.pages Total pages
 * @apiSuccess {int}                pagination.results Total results
 * @apiSuccess {int}                pagination.resultsPerPage Displaying results per page
 * @apiSuccess {int}                pagination.offset Start offset
 */
router.get("/", (req: express.Request, res: express.Response) => {
    res.response(postsWithPaginationResponseStub(req));
});

export default router;