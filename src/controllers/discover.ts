import * as express from "express";
import {Pagination} from "../models/pagination";
import {ForeignUserStub} from "../models/user";

const router = express.Router();

/**
 * @api {get} /search/users Search users by query
 * @apiName SearchUsers
 * @apiGroup Search
 *
 * @apiParam {PhoneNumber[]} phones Phone number object array
 * @apiParam {String} phones.country Country code
 * @apiParam {String} phones.area Area code
 * @apiParam {String} phones.number Phone number
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
 */
router.post("/contacts", (req: express.Request, res: express.Response) => {
    res.response({
        users: [ForeignUserStub, ForeignUserStub, ForeignUserStub]
    });
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
router.get("/suggestions", (req: express.Request, res: express.Response) => {
    const pagination = new Pagination(1, 3, 50);

    res.response({
        users: [ForeignUserStub, ForeignUserStub, ForeignUserStub],
        pagination: pagination
    });
});


export default router;