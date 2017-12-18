import * as express from "express";
import { Pagination } from "../../models/pagination";
import { foreignUsersArray, IUserModel, populateFollowing, User } from "../../models/user";
import { FacebookAuthentication } from "../../utilities/facebook-authentication";
import { asyncMiddleware } from "../../server";
import { AppError } from "../../models/app-error";

const router = express.Router();

/**
 * @api {get} /discover/suggestions?page=1 Suggestions
 * @apiName DiscoverSuggestions
 * @apiGroup Discover
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
router.get("/suggestions", asyncMiddleware(async (req: express.Request, res: express.Response) => {
    const total = await User.count({});
    const page: number = +req.query.page;
    const pagination = new Pagination(page, total);

    const users = await User
        .find({username: { $nin: [ null, "" ] }, _id: {$ne: req.user._id}})
        .sort("-followers")
        .limit(pagination.resultsPerPage)
        .skip(pagination.offset);

    await populateFollowing(users, req.user);

    res.response({
        users: foreignUsersArray(users),
        pagination: pagination
    });
}));

/**
 * @api {get} /discover/facebook?facebookToken=USER_FACEBOOK_TOKEN&pageToken=PAGE_TOKEN Get Facebook friends
 * @apiName GetFacebookFriends
 * @apiGroup Discover
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
 * @apiSuccess {String}         pageToken Next page token
 */
router.get("/facebook", asyncMiddleware(async (req: express.Request, res: express.Response) => {
    req.checkQuery({
        "facebookToken": {
            notEmpty: {
                errorMessage: "Facebook token is empty"
            }
        }
    });

    if ( req.requestInvalid() ) {
        return;
    }

    const facebookAccessToken: string = req.query.facebookToken;
    const page: string = <string>req.query.pageToken;
    const facebookAuthentication = new FacebookAuthentication(facebookAccessToken);

    const facebookUser = await facebookAuthentication
        .addField([
            "friends.limit(50)" + (page ? ".after(" + page + ")" : "")
        ])
        .getUser();


    if ( ! facebookUser || ! facebookUser.id ) {
        throw AppError.FacebookAuthenticationError;
    }

    let userSuggestions: IUserModel[] = [];
    let nextPage = "";

    if ( facebookUser.friends && facebookUser.friends.data ) {
        const facebookUserIds: string[] = [];

        for ( const facebookFriend of facebookUser.friends.data ) {
            facebookUserIds.push(facebookFriend.id);
        }

        userSuggestions = await User.find({facebookId: {$in: facebookUserIds}});
        await populateFollowing(userSuggestions, req.user);

        if ( facebookUser.friends.paging ) {
            nextPage = facebookUser.friends.paging.cursors.after;
        }

        if ( ! req.user.facebookId ) {
            User.findOne({facebookId: facebookUser.id})
                .then((userWithSameFacebookId) => {
                    if (!userWithSameFacebookId) {
                        req.user.facebookId = facebookUser.id;
                        req.user.save();
                    }
                })
                .catch(() => {
                });
        }
    }

    res.response({
        users: foreignUsersArray(userSuggestions),
        pageToken: nextPage
    });
}));


export default router;