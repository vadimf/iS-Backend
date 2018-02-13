import * as express from "express";
import { IPost, Post } from "../../models/post";
import { IUserModel, User } from "../../models/user";
import { asyncMiddleware } from "../../server";
import { Pagination } from "../../models/pagination";
import { populateFollowing } from "../../models/user";

const router = express.Router();

async function feedQuery(conditions?: any, additionalAggregations?: any) {
    if ( ! conditions ) {
        conditions = {};
    }

    conditions = Object.assign(conditions, {
        "creator.blocked": {$ne: true},
        "parent": null,
    });

    let aggregations = [
        {
            $lookup: {
                from: "users",
                localField: "creator",
                foreignField: "_id",
                as: "creator"
            }
        },
        {
            $unwind: "$creator"
        },
        {
            $lookup: {
                from: "follows",
                localField: "creator._id",
                foreignField: "following",
                as: "creator.followersUsers"
            }
        },
        {
            $match: conditions
        }
    ];

    if ( additionalAggregations ) {
        aggregations = aggregations.concat(additionalAggregations);
    }

    console.log(aggregations);

    return await Post.aggregate(aggregations);
}

async function countFeedPosts(conditions?: any) {
    const results = await feedQuery(conditions, [
        {
            $count: "total"
        }
    ]);

    return results && results[0] ? (<{total: number}>results[0]).total : 0;
}

async function getFeedPosts(pagination: Pagination, conditions?: any, sorting?: any) {
    if ( ! sorting ) {
        sorting = {
            createdAt: -1
        };
    }

    return await feedQuery(conditions, [
        {
            $sort: sorting
        },
        {
            $limit: pagination.resultsPerPage
        },
        {
            $skip: pagination.offset
        }
    ]);
}

async function reformatPostFromObject(post: any, currentUser: IUserModel) {
    post.creator = new User(post.creator);
    post.currentUser = currentUser;
    return new Post(post);
}

/**
 * @api {get} /feed?page=1 Get posts feed
 * @apiName Get
 * @apiGroup Feed
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
 */
router.get("/following", asyncMiddleware(async (req: express.Request, res: express.Response) => {
    const feedQueryConditions: any = {
        "creator.blocked": {$ne: true},
        "parent": null,
        $or: [
            {
                "creator._id": req.user._id,
            },
            {
                "creator.followersUsers.follower": req.user._id
            }
        ]
    };

    await getPostsByConditions(feedQueryConditions, req, res);
}));

router.get("/popular", asyncMiddleware(async (req: express.Request, res: express.Response) => {
    const feedQueryConditions: any = {
        $or: [
            {
                "creator._id": req.user._id,
            },
            {
                "creator.followersUsers.follower": req.user._id
            }
        ]
    };

    await getPostsByConditions(
        feedQueryConditions,
        req,
        res,
        {
            createdAt: -1,
            comments: -1,
            uniqueViews: -1
        },
    );
}));

export async function getPostsByConditions(conditions: any, req: express.Request, res: express.Response, sorting?: any) {
    const page: number = req.query.page;
    const total = await countFeedPosts(conditions);
    const pagination = new Pagination(page, total);

    const postsTmp: any[] = await getFeedPosts(pagination, conditions, sorting);

    const posts: IPost[] = [];
    for ( const post of postsTmp ) {
        posts.push(await reformatPostFromObject(post, req.user));
    }

    await populateFollowing(posts, req.user, "creator");

    res.response({
        posts: posts,
        pagination: pagination
    });
}

export default router;