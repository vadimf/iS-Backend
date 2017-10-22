import * as express from "express";
import {ForeignUserStub, LoggedUserStub} from "../models/user";
import {Pagination} from "../models/pagination";

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
 * @apiSuccess {int}            user.following Following counter
 * @apiSuccess {int}            user.followers Followers counter
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
 * @apiSuccess {int}            user.following Following counter
 * @apiSuccess {int}            user.followers Followers counter
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
 * @apiSuccess {int}            users.following Following counter
 * @apiSuccess {int}            users.followers Followers counter
 *
 * @apiSuccess {Pagination}     pagination Pagination object
 * @apiSuccess {int}                pagination.page Current page
 * @apiSuccess {int}                pagination.pages Total pages
 * @apiSuccess {int}                pagination.results Total results
 * @apiSuccess {int}                pagination.resultsPerPage Displaying results per page
 * @apiSuccess {int}                pagination.offset Start offset
 */
router.get("/following", (req: express.Request, res: express.Response) => {
    res.response();
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
 * @apiSuccess {int}            users.following Following counter
 * @apiSuccess {int}            users.followers Followers counter
 *
 * @apiSuccess {Pagination}     pagination Pagination object
 * @apiSuccess {int}                pagination.page Current page
 * @apiSuccess {int}                pagination.pages Total pages
 * @apiSuccess {int}                pagination.results Total results
 * @apiSuccess {int}                pagination.resultsPerPage Displaying results per page
 * @apiSuccess {int}                pagination.offset Start offset
 */
router.get("/followers", (req: express.Request, res: express.Response) => {
    const pagination = new Pagination();
    pagination.page = 1;
    pagination.results = 3;
    pagination.resultsPerPage = 50;
    pagination.resultsCurrentPage = 3;
    pagination.pages = 1;

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
 * @apiParam {String} vars Not ready yet...
 *
 * @apiSuccess {String} vars Not ready yet...
 */
router.get("/posts", (req: express.Request, res: express.Response) => {
    res.response();
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
 * @apiSuccess {int}            user.following Following counter
 * @apiSuccess {int}            user.followers Followers counter
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
 *
 * @apiSuccess {String} vars Not ready yet...
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
 * @apiParam {String} vars Not ready yet...
 *
 * @apiSuccess {String} vars Not ready yet...
 */
router.get("/:username/following", (req: express.Request, res: express.Response) => {
    res.response();
});


/**
 * @api {get} /user/:username/followers User's followers
 * @apiName FollowingUser
 * @apiGroup User
 *
 * @apiParam {String} vars Not ready yet...
 *
 * @apiSuccess {String} vars Not ready yet...
 */
router.get("/:username/followers", (req: express.Request, res: express.Response) => {
    res.response();
});


/**
 * @api {get} /user/:username/posts User's posts
 * @apiName UserPosts
 * @apiGroup User
 *
 * @apiParam {String} vars Not ready yet...
 *
 * @apiSuccess {String} vars Not ready yet...
 */
router.get("/:username/posts", (req: express.Request, res: express.Response) => {
    res.response();
});


export default router;