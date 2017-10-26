import * as express from "express";
import {ForeignUserStub} from "../../models/user";
import {Pagination} from "../../models/pagination";
import {postsWithPaginationResponseStub} from "../../models/post";
import {updateUserDetails} from "./update-user";
import {AppError} from "../../models/app-error";
import {Follower} from "../../models/follow";
import {default as ForeignUserRouter} from "./foreign-user-router";

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
    .patch(async (req: express.Request, res: express.Response) => {
        updateUserDetails(req)
            .then(() => {
                if ( req.requestInvalid() ) {
                    return;
                }

                if ( req.user.isModified() ) {
                    req.user.save();
                }

                res.response({user: req.user.toLoggedUser()});
            })
            .catch((error) => {
                res.error(error);
            });
    })

    /**
     * @api {delete} /user Disable a user
     * @apiName DisableMyUser
     * @apiGroup User
     *
     * @apiParam {String} reason Disable reason
     */
    .delete((req: express.Request, res: express.Response) => {
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
router.get("/following", async (req: express.Request, res: express.Response) => {
    try {
        const totalFollowing: number = await Follower.count({follower: req.user._id});
        const page: number = +req.query.page;

        const pagination = new Pagination(page, totalFollowing);

        const followingUsers = await Follower.find({follower: req.user._id});

        console.log(followingUsers);

        res.response({
            pagination: pagination
        });
    }
    catch (e) {
        res.error(AppError.ErrorPerformingAction, e);
    }

    // Follower
    //     .findOne({
    //         follower:
    //     })
    //     .populate("following")
    //     .then((f) => {
    //         console.log(f.following);
    //     })
    //     .catch(console.log);
    //
    //
    // const pagination = new Pagination(1, 3, 50);
    //
    // res.response({
    //     users: [ForeignUserStub, ForeignUserStub, ForeignUserStub],
    //     pagination: pagination
    // });
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


router.use("/:username", ForeignUserRouter);


export default router;