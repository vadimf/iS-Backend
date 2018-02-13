import * as express from "express";
import { populateFollowing, User, UserReportReason } from "../../models/user";
import { AppError } from "../../models/app-error";
import { followUser, unfollowUser } from "./follow-user";
import { asyncMiddleware } from "../../server";
import { getFollowsByConditions } from "./user";
import { getPostsListByConditions } from "../post/post";
import { CustomNotificationSender } from "../../utilities/custom-notification-sender";

const router = express.Router({mergeParams: true});


/**
 * Get a user object by username
 *
 * @param {string} username
 * @returns Promise<IUserModel>
 */
export async function getUserByUsername(username: string) {
    const user = await User.findOne({username: username});

    if ( ! user ) {
        throw AppError.UserDoesNotExist;
    }

    return user;
}


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
 *
 * @apiUse UserDoesNotExist
 */
router.get("/", asyncMiddleware(async (req: express.Request, res: express.Response) => {
    const username: string = req.params.username;
    const foundUser = await getUserByUsername(username);

    await populateFollowing(foundUser, req.user);

    res.response({
        user: foundUser.toForeignUser()
    });
}));


/**
 * @api {post} /user/:username/report Report a user
 * @apiName ReportUser
 * @apiGroup User
 *
 * @apiParam {enum} reason User report reason enum (other = 1)
 */
router.post("/report", asyncMiddleware(async (req: express.Request, res: express.Response) => {
    const username: string = req.params.username;
    const user = await getUserByUsername(username);

    if ( user._id.equals(req.user._id) ) {
        throw AppError.ObjectDoesNotExist;
    }

    req.checkBody("reason", "Report reason must be numeric").isNumeric();

    if ( req.requestInvalid() ) {
        return;
    }

    const reason: UserReportReason = +req.body.reason;

    if ( ! user.reports ) {
        user.reports = [];
    }

    user.reports.push({
        creator: req.user._id,
        reason: reason
    });

    res.response();

    user.save()
        .then(() => {})
        .catch(() => {});
}));


router
    .route("/follow")

    /**
     * @api {post} /user/:username/follow Follow a user
     * @apiName FollowUser
     * @apiGroup User
     *
     * @apiUse UserDoesNotExist
     * @apiUse ObjectExist
     */
    .post(asyncMiddleware(async (req: express.Request, res: express.Response) => {
        const username: string = req.params.username;
        const foundUser = await getUserByUsername(username);

        await followUser(req.user, foundUser);

        (new CustomNotificationSender(foundUser))
            .follow(req.user)
            .send()
            .then(() => {})
            .catch(() => {});

        res.response();
    }))

    /**
     * @api {delete} /user/:username/follow Unfollow a user
     * @apiName UnfollowUser
     * @apiGroup User
     *
     * @apiUse UserDoesNotExist
     * @apiUse ObjectDoesNotExist
     */
    .delete(asyncMiddleware(async (req: express.Request, res: express.Response) => {
        const username: string = req.params.username;
        const foundUser = await getUserByUsername(username);

        await unfollowUser(req.user, foundUser);

        res.response();
    }));


/**
 * @api {get} /user/:username/following?page=1 Followed by user
 * @apiName FollowedByUser
 * @apiGroup User
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
 *
 * @apiUse UserDoesNotExist
 */
router.get("/following", asyncMiddleware(async (req: express.Request, res: express.Response) => {
    const username: string = req.params.username;
    const user = await getUserByUsername(username);

    await getFollowsByConditions({follower: user._id}, false, req, res);
}));


/**
 * @api {get} /user/:username/followers?page=1 User's followers
 * @apiName FollowingUser
 * @apiGroup User
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
 *
 * @apiUse UserDoesNotExist
 */
router.get("/followers", asyncMiddleware(async (req: express.Request, res: express.Response) => {
    const username: string = req.params.username;
    const user = await getUserByUsername(username);

    await getFollowsByConditions({following: user._id}, true, req, res);
}));


/**
 * @api {get} /user/:username/posts?page=1 User's posts
 * @apiName UserPosts
 * @apiGroup User
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
 * @apiSuccess {String}             posts.video.thumbnail Thumbnail URL
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
 *
 * @apiUse UserDoesNotExist
 */
router.get("/posts", asyncMiddleware(async (req: express.Request, res: express.Response) => {    const username: string = req.params.username;
    const user = await User.findOne({username: username});

    if ( ! user || user.blocked ) {
        throw AppError.ObjectDoesNotExist;
    }

    await getPostsListByConditions({creator: user._id, parent: null}, req, res);
}));

export default router;