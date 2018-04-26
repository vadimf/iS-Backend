import * as express from "express";
import { Pagination } from "../../models/pagination";
import { foreignUsersArray, IUserModel, populateFollowing, User } from "../../models/user";
import { Post } from "../../models/post";
import { Utilities } from "../../utilities/utilities";
import { asyncMiddleware } from "../../server";
import { IPhoneNumberModel } from "../../models/phone-number";
import { AppError } from "../../models/app-error";

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
    // const searchRegex = searchQuery.searchToRegex();
    const page: number = +req.query.page;

    const conditions: any = {
        "creator.blocked": {$ne: true}
    };

    if ( searchQuery ) {
        searchQuery
            .split(" ")
            .forEach((searchString: string) => {
                if ( ! conditions.$or ) {
                    conditions.$or = [];
                }

                const searchRegex = searchString.searchToRegex();

                conditions.$or.push(
                    {
                        text: searchRegex,
                    },
                    {
                        tags: searchRegex,
                    }
                );
            });
    }

    const totalResults = await Post.count(conditions);
    const pagination = new Pagination(page, totalResults);

    const posts = await Post
        .find(conditions)
        .populate("creator")
        .skip(pagination.offset)
        .limit(pagination.resultsPerPage);

    await populateFollowing(posts, req.user, "creator");

    res.response({
        posts: posts,
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
    const searchRegex = searchQuery.searchToRegex();
    const page: number = +req.query.page;

    const conditions = {
        _id: {$ne: req.user._id},
        blocked: {$ne: true},
        username: searchRegex
    };

    const totalResults = await User.count(conditions);
    const pagination = new Pagination(page, totalResults);

    const users = await User
        .find(conditions)
        .skip(pagination.offset)
        .limit(pagination.resultsPerPage);

    await populateFollowing(users, req.user);

    res.response({
        users: foreignUsersArray(users),
        pagination: pagination
    });
}));


function reformatPhoneNumber(phoneNumber: IPhoneNumberModel, currentUser: IUserModel) {
    phoneNumber.number = phoneNumber.number.replace(/[^a-z +\d\s]+/gi, "");

    if ( ! phoneNumber.country ) {
        if (phoneNumber.number.startsWith("+")) {
            let phoneNumberSplit = phoneNumber.number.split(" ", 2);

            if (phoneNumberSplit.length == 1) {
                phoneNumberSplit = phoneNumber.number.split("-", 2);
            }

            if (phoneNumberSplit.length > 1) {
                phoneNumber.country = phoneNumberSplit[0];
                phoneNumber.number = phoneNumberSplit[1];

            }
        }

        if ( ! phoneNumber.country && currentUser.phone && currentUser.phone.country ) {
            if ( phoneNumber.number.lastIndexOf(currentUser.phone.country, 0) === 0 ) {
                phoneNumber.country = currentUser.phone.country;
                phoneNumber.number = phoneNumber.number.replace(currentUser.phone.country, "");
            }
            else {
                phoneNumber.country = currentUser.phone.country;
            }
        }
    }

    if ( phoneNumber.number.startsWith("0") ) {
        phoneNumber.number = phoneNumber.number.substr(1);
    }

    phoneNumber.number = phoneNumber.number.replace(/\D/g, "");

    if ( ! phoneNumber.country && phoneNumber.number ) {
        phoneNumber.country = "+972";
    }
}


/**
 * @api {search} /search/contacts?page=1 Find users from your contacts list
 * @apiName UserContacts
 * @apiGroup Search
 *
 * @apiParam    {String[]}          emails Array of email addresses
 * @apiParam    {PhoneNumber[]}     phones Array of phone number objects
 * @apiParam    {String}                phones.country      Country code <code>(required. for example: +972)</code>
 * @apiParam    {String}                phones.area         Area code <code>(optional. for example: 52)</code>
 * @apiParam    {String}                phones.number       Phone suffix <code>(required. for example: 8330112)</code>
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
router.post("/contacts", asyncMiddleware(async (req: express.Request, res: express.Response) => {
    const emails: String[] = req.body.emails;
    const phoneNumbers: IPhoneNumberModel[] = req.body.phones;

    if ( ! emails.length && ! phoneNumbers.length ) {
        throw AppError.RequestValidation;
    }

    let emailConditions: any = {};
    let phoneNumberConditions: any = {};

    if ( phoneNumbers.length ) {
        const phoneNumbersForConditions: {"phone.number": string, "phone.country": string, "phone.area"?: string}[] = [];

        for (const phoneNumber of phoneNumbers) {
            reformatPhoneNumber(phoneNumber, req.user);

            if ( phoneNumber.country && phoneNumber.number ) {
                const conditions: {"phone.number": string, "phone.country": string, "phone.area"?: string} = {
                    "phone.number": phoneNumber.number,
                    "phone.country": phoneNumber.country
                };

                if ( phoneNumber.area ) {
                    conditions["phone.area"] = phoneNumber.area;
                }

                phoneNumbersForConditions.push(conditions);
            }
        }

        if ( phoneNumbersForConditions.length ) {
            phoneNumberConditions = phoneNumbersForConditions;
        }
    }

    if ( emails.length ) {
        const formattedEmails: string[] = [];

        for ( const email of emails ) {
            if ( Utilities.emailValid(email.toLowerCase()) ) {
                formattedEmails.push(email.toLowerCase());
            }
        }

        emailConditions = {
            email: {
                $in: formattedEmails.filter(function(item, i, ar) { return ar.indexOf(item) === i; })
            }
        };
    }

    const page: number = +req.query.page;
    let searchConditions = {};

    if ( phoneNumberConditions && emailConditions ) {
        searchConditions = phoneNumberConditions.concat(emailConditions);
    }
    else if ( emailConditions ) {
        searchConditions = emailConditions;
    }
    else if ( phoneNumberConditions ) {
        searchConditions = phoneNumberConditions;
    }
    else {
        const pagination = new Pagination(page, 0);

        res.response({
            users: [],
            pagination: pagination
        });

        return;
    }

    const conditions = {
        _id: {$ne: req.user._id},
        blocked: {$ne: true},
        $or: searchConditions
    };

    const total = await User.count(conditions);
    const pagination = new Pagination(page, total);

    const users = await User
        .find(conditions)
        .skip(pagination.offset)
        .limit(pagination.resultsPerPage);

    await populateFollowing(users, req.user);

    res.response({
        users: foreignUsersArray(users),
        pagination: pagination
    });
}));

export default router;