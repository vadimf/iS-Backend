import * as express from "express";
import {ForeignUserStub, LoggedUserStub} from "../models/user";
import {Pagination} from "../models/pagination";
import {postsWithPaginationResponseStub} from "../models/post";

const router = express.Router();


/**
 * @api {get} /user Get your user details & profile
 * @apiName GetMyUser
 * @apiGroup User
 *
 * @apiSuccess {User}       user My user object
 * @apiSuccess {String}         user.username Username
 * @apiSuccess {String}         user.email Email
 * @apiSuccess {PhoneNumber}    user.phone PhoneNumber object
 * @apiSuccess {String}             user.phone.country Country code
 * @apiSuccess {String}             user.phone.area Area code
 * @apiSuccess {String}             user.phone.number Country code
 * @apiSuccess {Profile}        user.profile User's profile metadata
 * @apiSuccess {String}             user.profile.firstName First name
 * @apiSuccess {String}             user.profile.lastName Last name
 * @apiSuccess {Object}             user.profile.picture User's profile picture
 * @apiSuccess {String}                 user.profile.picture.url Url
 * @apiSuccess {String}                 user.profile.picture.thumbnail Thumbnail url
 * @apiSuccess {String}             user.profile.bio Bio text
 * @apiSuccess {int}            user.following Following counter
 * @apiSuccess {int}            user.followers Followers counter
 * @apiSuccess {String}         user.createdAt Date registered
 */
router.get("/", (req: express.Request, res: express.Response) => {
    res.response({user: LoggedUserStub});
});


/**
 * @api {patch} /user Update user details
 * @apiName UpdateMyUser
 * @apiGroup User
 *
 * @apiParam {User}       user User object
 * @apiParam {String}         user.username Username
 * @apiParam {String}         user.email Email
 * @apiParam {PhoneNumber}    user.phone PhoneNumber object
 * @apiParam {String}             user.phone.country Country code
 * @apiParam {String}             user.phone.area Area code
 * @apiParam {String}             user.phone.number Country code
 * @apiParam {Profile}        user.profile User's profile metadata
 * @apiParam {String}             user.profile.firstName First name
 * @apiParam {String}             user.profile.lastName Last name
 * @apiParam {String}             user.profile.picture User's profile picture <code>base64</code>
 *
 * @apiSuccess {User}       user My user object
 * @apiSuccess {String}         user.username Username
 * @apiSuccess {String}         user.email Email
 * @apiSuccess {PhoneNumber}    user.phone PhoneNumber object
 * @apiSuccess {String}             user.phone.country Country code
 * @apiSuccess {String}             user.phone.area Area code
 * @apiSuccess {String}             user.phone.number Country code
 * @apiSuccess {Profile}        user.profile User's profile metadata
 * @apiSuccess {String}             user.profile.firstName First name
 * @apiSuccess {String}             user.profile.lastName Last name
 * @apiSuccess {Object}             user.profile.picture User's profile picture
 * @apiSuccess {String}                 user.profile.picture.url Url
 * @apiSuccess {String}                 user.profile.picture.thumbnail Thumbnail url
 * @apiSuccess {String}             user.profile.bio Bio text
 * @apiSuccess {int}            user.following Following counter
 * @apiSuccess {int}            user.followers Followers counter
 * @apiSuccess {String}         user.createdAt Date registered
 */
router.patch("/", (req: express.Request, res: express.Response) => {
    res.response({user: LoggedUserStub});
});


/**
 * @api {delete} /user Disable a user
 * @apiName DisableMyUser
 * @apiGroup User
 *
 * @apiParam {String} reason Disable reason
 */
router.delete("/", (req: express.Request, res: express.Response) => {
    res.response();
});


/**
 * @api {get} /user/following Followed by me
 * @apiName FollowedByMe
 * @apiGroup User
 *
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
 * @apiSuccess {boolean}            users.isFollowing Already following this user
 * @apiSuccess {String}         users.createdAt Date registered
 *
 * @apiSuccess {Pagination}     pagination Pagination object
 * @apiSuccess {int}                pagination.page Current page
 * @apiSuccess {int}                pagination.pages Total pages
 * @apiSuccess {int}                pagination.results Total results
 * @apiSuccess {int}                pagination.resultsPerPage Displaying results per page
 * @apiSuccess {int}                pagination.offset Start offset
 */
router.get("/following", (req: express.Request, res: express.Response) => {
    const pagination = new Pagination(1, 3, 50);

    res.response({
        users: [ForeignUserStub, ForeignUserStub, ForeignUserStub],
        pagination: pagination
    });
});


/**
 * @api {get} /user/following Following me
 * @apiName FollowingMe
 * @apiGroup User
 *
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
router.get("/followers", (req: express.Request, res: express.Response) => {
    const pagination = new Pagination(1, 3, 50);

    res.response({
        users: [ForeignUserStub, ForeignUserStub, ForeignUserStub],
        pagination: pagination
    });
});


/**
 * @api {get} /user/posts My posts
 * @apiName MyPosts
 * @apiGroup User
 *
 * @apiParam {int} page Page
 *
 * @apiSuccess {Post[]}     posts Post objects
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
router.get("/posts", (req: express.Request, res: express.Response) => {
    res.response(postsWithPaginationResponseStub(req));
});


/**
 * @api {get} /user/:username Get user details
 * @apiName GetUser
 * @apiGroup User
 *
 * @apiSuccess {User}       user Foreign user object
 * @apiSuccess {String}         user.username Username
 * @apiSuccess {Profile}        user.profile User's profile metadata
 * @apiSuccess {String}             user.profile.firstName First name
 * @apiSuccess {String}             user.profile.lastName Last name
 * @apiSuccess {Object}             user.profile.picture User's profile picture
 * @apiSuccess {String}                 user.profile.picture.url Url
 * @apiSuccess {String}                 user.profile.picture.thumbnail Thumbnail url
 * @apiSuccess {String}             user.profile.bio Bio text
 * @apiSuccess {int}            user.following Following counter
 * @apiSuccess {int}            user.followers Followers counter
 * @apiSuccess {boolean}        user.isFollowing Already following this user
 * @apiSuccess {String}         user.createdAt Date registered
 */
router.get("/:username", (req: express.Request, res: express.Response) => {
    res.response({user: ForeignUserStub});
});


/**
 * @api {post} /user/:username/report Report a user
 * @apiName ReportUser
 * @apiGroup User
 *
 * @apiParam {String} vars Not ready yet...
 */
// TODO: Prepare report reason enum
router.post("/:username/report", (req: express.Request, res: express.Response) => {
    res.response();
});


/**
 * @api {post} /user/:username/follow Follow a user
 * @apiName FollowUser
 * @apiGroup User
 */
router.post("/:username/follow", (req: express.Request, res: express.Response) => {
    res.response();
});


/**
 * @api {delete} /user/:username/follow Unfollow a user
 * @apiName UnfollowUser
 * @apiGroup User
 */
router.delete("/:username/follow", (req: express.Request, res: express.Response) => {
    res.response();
});


/**
 * @api {get} /user/:username/following Followed by user
 * @apiName FollowedByUser
 * @apiGroup User
 *
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
router.get("/:username/following", (req: express.Request, res: express.Response) => {
    const pagination = new Pagination(1, 3, 50);

    res.response({
        users: [ForeignUserStub, ForeignUserStub, ForeignUserStub],
        pagination: pagination
    });
});


/**
 * @api {get} /user/:username/followers User's followers
 * @apiName FollowingUser
 * @apiGroup User
 *
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
router.get("/:username/followers", (req: express.Request, res: express.Response) => {
    const pagination = new Pagination(1, 3, 50);

    res.response({
        users: [ForeignUserStub, ForeignUserStub, ForeignUserStub],
        pagination: pagination
    });
});


/**
 * @api {get} /user/:username/posts User's posts
 * @apiName UserPosts
 * @apiGroup User
 *
 * @apiParam {int} page Page
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
router.get("/:username/posts", (req: express.Request, res: express.Response) => {
    res.response(postsWithPaginationResponseStub(req));
});


export default router;