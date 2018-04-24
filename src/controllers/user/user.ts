import * as express from "express";
import { Pagination } from "../../models/pagination";
import { updateUserDetails } from "./update-user";
import { countByConditions, Follower, followersToForeignUsersArray } from "../../models/follow";
import {default as ForeignUserRouter } from "./foreign-user-router";
import { asyncMiddleware } from "../../server";
import { getPostsListByConditions } from "../post/post";
import { User, IForeignUser } from "../../models/user";
import { Utilities } from "../../utilities/utilities";
import { SystemConfiguration } from "../../models/system-vars";

const router = express.Router();


router
    .route("/")

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
     * @apiSuccess {String}             user.profile.website User's website URL
     * @apiSuccess {int}            user.following Following counter
     * @apiSuccess {int}            user.followers Followers counter
     * @apiSuccess {String}         user.createdAt Date registered
     */
    .get((req: express.Request, res: express.Response) => {
        res.response({user: req.user.toLoggedUser()});
    })

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
     * @apiParam {String}             user.profile.picture.upload User's profile picture <code>base64</code>
     * @apiParam {String}             user.profile.bio User's bio
     * @apiParam {String}             user.profile.website User's website
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
     * @apiSuccess {String}             user.profile.website User's website URL
     * @apiSuccess {int}            user.following Following counter
     * @apiSuccess {int}            user.followers Followers counter
     * @apiSuccess {String}         user.createdAt Date registered
     *
     * @apiUse UsernameAlreadyTaken
     * @apiUse EmailAlreadyTaken
     * @apiUse UploadingError
     * @apiUse RequestValidation
     */
    .patch(asyncMiddleware(async (req: express.Request, res: express.Response) => {
        await updateUserDetails(req);

        if ( req.requestInvalid() ) {
            return;
        }

        if ( req.user.isModified() ) {
            req.user.save();
        }

        res.response({user: req.user.toLoggedUser()});
    }));

/**
 * Get follows by conditions
 *
 * @param conditions any
 * @param {boolean} followers
 * @param {e.Request} req
 * @param {e.Response} res
 * @returns {Promise<void>}
 */
export async function getFollowsByConditions(conditions: any, followers = false, req: express.Request, res: express.Response) {
    const page: number = +req.query.page;
    const totalFollows = await countByConditions(conditions);
    const pagination = new Pagination(page, totalFollows);

    const follows = await Follower
        .find(conditions)
        .populate("follower")
        .populate("following")
        .skip(pagination.offset)
        .limit(pagination.resultsPerPage);

    let responseUsers: IForeignUser[];

    responseUsers = await followersToForeignUsersArray(follows, req.user, ! followers);

    res.response({
        users: responseUsers,
        pagination: pagination
    });
}

/**
 * @api {get} /user/following?page=1 Followed by me
 * @apiName FollowedByMe
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
 * @apiSuccess {String}             user.profile.website User's website URL
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
router.get("/following", asyncMiddleware(async (req: express.Request, res: express.Response) => {
    await getFollowsByConditions({follower: req.user._id}, false, req, res);
}));


/**
 * @api {get} /user/followers?page=1 Following me
 * @apiName FollowingMe
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
 * @apiSuccess {String}             users.profile.website User's website URL
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
router.get("/followers", asyncMiddleware(async (req: express.Request, res: express.Response) => {
    await getFollowsByConditions({following: req.user._id}, true, req, res);
}));


/**
 * @api {get} /user/posts?page=1 My posts
 * @apiName MyPosts
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
 * @apiSuccess {String}                 posts.creator.profile.website User's website URL
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
 */
router.get("/posts", asyncMiddleware(async (req: express.Request, res: express.Response) => {
    await getPostsListByConditions({creator: req.user._id, parent: null}, req, res);
}));


router.get("/username-exists", asyncMiddleware(async (req: express.Request, res: express.Response) => {
    req.checkQuery({
        "username": {
            matches: {
                options: Utilities.stringToRegExp("/" + SystemConfiguration.validations.username.regex + "/"),
                errorMessage: "Username doesn't match regex"
            },
            isLength: {
                options: [{
                    min: SystemConfiguration.validations.username.minLength,
                    max: SystemConfiguration.validations.username.maxLength
                }],
                errorMessage: "Username length is invalid"
            }
        }
    });

    if ( req.requestInvalid() ) {
        return;
    }

    const username: String = ("" + req.query.username).toLowerCase();

    const usernameExists = await User.count({username: username});

    res.response({
        exists: usernameExists > 0
    });
}));


router.use("/:username", ForeignUserRouter);


export default router;