import * as express from "express";
import {IPost, Post} from "../../models/post";
import {CommentStub, commentsWithPaginationResponseStub} from "../../models/comment";
import {SystemConfiguration} from "../../models/system-vars";
import {AppError} from "../../models/app-error";
import {IUserModel} from "../../models/user";
import {asyncMiddleware} from "../../server";
import {Pagination} from "../../models/pagination";

const router = express.Router();

/**
 * Get a post by it's ID
 *
 * @param {string} id
 * @returns Promise<IPost>
 */
async function getPostById(id: string) {
    let post;

    try {
        post = await Post
            .findOne({_id: id})
            .populate("creator");
    }
    catch (e) {
        throw AppError.ObjectDoesNotExist;
    }

    if ( ! post ) {
        throw AppError.ObjectDoesNotExist;
    }

    return post;
}

/**
 * Get a post owned by a user, by the post ID
 *
 * @param {string} id
 * @param {IUserModel} user
 * @returns {Promise<IPost>}
 */
async function getPostByIdOwnedByUser(id: string, user: IUserModel) {
    const post = await getPostById(id);

    if ( ! post.creator._id.equals(user._id) ) {
        throw AppError.ObjectDoesNotExist;
    }

    return post;
}

function hasUserViewedPost(user: IUserModel, post: IPost) {
    return post.viewers.some((view: any) => {
        return view._id.equals(user._id);
    });
}

function addViewToPost(post: IPost, user: IUserModel) {
    if ( post.creator._id.equals(user._id) ) {
        return;
    }

    if ( ! hasUserViewedPost(user, post) ) {
        post.uniqueViews++;
    }

    post.viewers.push(user._id);

    if ( post.isModified() ) {
        post.save()
            .then(() => {})
            .catch(() => {});
    }
}

/**
 * @api {post} /post Create a post
 * @apiName CreatePost
 * @apiGroup Post
 *
 * @apiParam {String} video Video <code>base64</code>
 * @apiParam {String} text Video text
 *
 * @apiSuccess {Post}     post Post object
 * @apiSuccess {String}         post.id Post ID
 * @apiSuccess {String}         post.createdAt Post creation date
 * @apiSuccess {User}           post.creator Creator (user) object
 * @apiSuccess {String}             post.creator.username Username
 * @apiSuccess {Profile}            post.creator.profile User's profile metadata
 * @apiSuccess {String}                 post.creator.profile.firstName First name
 * @apiSuccess {String}                 post.creator.profile.lastName Last name
 * @apiSuccess {Object}                 post.creator.profile.picture User's profile picture
 * @apiSuccess {String}                     post.creator.profile.picture.url Url
 * @apiSuccess {String}                     post.creator.profile.picture.thumbnail Thumbnail url
 * @apiSuccess {String}                 post.creator.profile.bio Bio text
 * @apiSuccess {int}                post.creator.following Following counter
 * @apiSuccess {int}                post.creator.followers Followers counter
 * @apiSuccess {boolean}            post.creator.isFollowing Already following this user
 * @apiSuccess {String}             post.creator.createdAt Date registered
 * @apiSuccess {Video}          post.video Video object
 * @apiSuccess {String}             post.video.url Video file URL
 * @apiSuccess {String[]}           post.video.thumbnails Thumbnails URLs
 * @apiSuccess {int}                post.video.duration Video duration (seconds)
 * @apiSuccess {int}            post.views Post views
 * @apiSuccess {int}            post.uniqueViews Post unique views
 * @apiSuccess {int}            post.comments Post comments
 * @apiSuccess {String}         post.text Post text
 */
router.post("/", asyncMiddleware(async (req: express.Request, res: express.Response) => {
    const text: string = req.body.text;

    req.checkBody({
        "text": {
            isLength: {
                options: [{
                    min: SystemConfiguration.validations.postText.minLength,
                    max: SystemConfiguration.validations.postText.maxLength
                }],
                errorMessage: "Post-text length is invalid"
            }
        }
    });

    if ( req.requestInvalid() ) {
        return;
    }

    const post = new Post();

    // TODO: Video file and thumbnail(s) uploading

    post.text = text;
    post.video = {
        url: "http://techslides.com/demos/sample-videos/small.mp4",
        thumbnails: [
            "http://images.media-allrecipes.com/userphotos/960x960/3757723.jpg",
            "https://www.thesun.co.uk/wp-content/uploads/2016/09/nintchdbpict000264481984.jpg?w=960",
            "https://mcdonalds.com.au/sites/mcdonalds.com.au/files/hero_pdt_hamburger.png"
        ],
        duration: 5
    };
    post.creator = req.user;

    await post.save();

    res.response({post: post});
}));

async function getPostsListByConditions(conditions: any, req: express.Request, res: express.Response) {
    const page: number = req.query.page;
    const total = await Post.count(conditions);
    const pagination = new Pagination(page, total);

    const posts = await Post
        .find(conditions)
        .sort("-createdAt")
        .populate("creator");

    console.log(posts);

    res.response({
        pagination: pagination,
        posts: posts
    });
}

/**
 * @api {post} /post/bookmarked?page=1 Bookmarked posts
 * @apiName Bookmarks
 * @apiGroup Post
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
router.get("/bookmarked", asyncMiddleware(async (req: express.Request, res: express.Response) => {
    await getPostsListByConditions({"bookmarked._id": req.user._id}, req, res);
}));

router
    .route("/:post")

    /**
     * @api {get} /post/:post Get post by ID
     * @apiName GetPost
     * @apiGroup Post
     *
     * @apiSuccess {Post}     post Post object
     * @apiSuccess {String}         post.id Post ID
     * @apiSuccess {String}         post.createdAt Post creation date
     * @apiSuccess {User}           post.creator Creator (user) object
     * @apiSuccess {String}             post.creator.username Username
     * @apiSuccess {Profile}            post.creator.profile User's profile metadata
     * @apiSuccess {String}                 post.creator.profile.firstName First name
     * @apiSuccess {String}                 post.creator.profile.lastName Last name
     * @apiSuccess {Object}                 post.creator.profile.picture User's profile picture
     * @apiSuccess {String}                     post.creator.profile.picture.url Url
     * @apiSuccess {String}                     post.creator.profile.picture.thumbnail Thumbnail url
     * @apiSuccess {String}                 post.creator.profile.bio Bio text
     * @apiSuccess {int}                post.creator.following Following counter
     * @apiSuccess {int}                post.creator.followers Followers counter
     * @apiSuccess {boolean}            post.creator.isFollowing Already following this user
     * @apiSuccess {String}             post.creator.createdAt Date registered
     * @apiSuccess {Video}          post.video Video object
     * @apiSuccess {String}             post.video.url Video file URL
     * @apiSuccess {String[]}           post.video.thumbnails Thumbnails URLs
     * @apiSuccess {int}                post.video.duration Video duration (seconds)
     * @apiSuccess {int}            post.views Post views
     * @apiSuccess {int}            post.uniqueViews Post unique views
     * @apiSuccess {int}            post.comments Post comments
     * @apiSuccess {String}         post.text Post text
     */
    .get(asyncMiddleware(async (req: express.Request, res: express.Response) => {
        const postId: string = req.params.post;
        const post = await getPostById(postId);

        res.response({post: post});

        addViewToPost(post, req.user);
    }))

    /**
     * @api {patch} /post/:post Edit a post
     * @apiName EditPost
     * @apiGroup Post
     *
     * @apiParam {String} text Video text
     *
     * @apiSuccess {Post}     post Post object
     * @apiSuccess {String}         post.id Post ID
     * @apiSuccess {String}         post.createdAt Post creation date
     * @apiSuccess {User}           post.creator Creator (user) object
     * @apiSuccess {String}             post.creator.username Username
     * @apiSuccess {Profile}            post.creator.profile User's profile metadata
     * @apiSuccess {String}                 post.creator.profile.firstName First name
     * @apiSuccess {String}                 post.creator.profile.lastName Last name
     * @apiSuccess {Object}                 post.creator.profile.picture User's profile picture
     * @apiSuccess {String}                     post.creator.profile.picture.url Url
     * @apiSuccess {String}                     post.creator.profile.picture.thumbnail Thumbnail url
     * @apiSuccess {String}                 post.creator.profile.bio Bio text
     * @apiSuccess {int}                post.creator.following Following counter
     * @apiSuccess {int}                post.creator.followers Followers counter
     * @apiSuccess {boolean}            post.creator.isFollowing Already following this user
     * @apiSuccess {String}             post.creator.createdAt Date registered
     * @apiSuccess {Video}          post.video Video object
     * @apiSuccess {String}             post.video.url Video file URL
     * @apiSuccess {String[]}           post.video.thumbnails Thumbnails URLs
     * @apiSuccess {int}                post.video.duration Video duration (seconds)
     * @apiSuccess {int}            post.views Post views
     * @apiSuccess {int}            post.uniqueViews Post unique views
     * @apiSuccess {int}            post.comments Post comments
     * @apiSuccess {String}         post.text Post text
     */
    .patch(asyncMiddleware(async (req: express.Request, res: express.Response) => {
        const postId: string = req.params.post;
        const text: string = req.body.text;
        const post = await getPostByIdOwnedByUser(postId, req.user);

        req.checkBody({
            "text": {
                isLength: {
                    options: [{
                        min: SystemConfiguration.validations.postText.minLength,
                        max: SystemConfiguration.validations.postText.maxLength
                    }],
                    errorMessage: "Post-text length is invalid"
                }
            }
        });

        if ( req.requestInvalid() ) {
            return;
        }

        post.text = text;

        if ( post.isModified() ) {
            post
                .save()
                .then(() => {})
                .catch(() => {});
        }

        res.response({post: post});
    }))

    /**
     * @api {delete} /post Remove a post
     * @apiName RemovePost
     * @apiGroup Post
     */
    .delete(asyncMiddleware(async (req: express.Request, res: express.Response) => {
        const postId: string = req.params.post;
        const post = await getPostByIdOwnedByUser(postId, req.user);

        // TODO: Remove post video file & thumbnails

        post.remove()
            .then(() => {})
            .catch(() => {});

        res.response();
    }));


/**
 * @api {get} /post/:post/comments?page=1 Post's comments
 * @apiName GetComments
 * @apiGroup Post
 *
 * @apiSuccess {Comment[]}  comments Comment object
 * @apiSuccess {String}         comments.id Comment ID
 * @apiSuccess {String}         comments.createdAt Comment creation date
 * @apiSuccess {User}           comments.creator Creator (user) object
 * @apiSuccess {String}             comments.creator.username Username
 * @apiSuccess {Profile}            comments.creator.profile User's profile metadata
 * @apiSuccess {String}                 comments.creator.profile.firstName First name
 * @apiSuccess {String}                 comments.creator.profile.lastName Last name
 * @apiSuccess {Object}                 comments.creator.profile.picture User's profile picture
 * @apiSuccess {String}                     comments.creator.profile.picture.url Url
 * @apiSuccess {String}                     comments.creator.profile.picture.thumbnail Thumbnail url
 * @apiSuccess {String}                 comments.creator.profile.bio Bio text
 * @apiSuccess {int}                comments.creator.following Following counter
 * @apiSuccess {int}                comments.creator.followers Followers counter
 * @apiSuccess {boolean}            comments.creator.isFollowing Already following this user
 * @apiSuccess {String}             comments.creator.createdAt Date registered
 * @apiSuccess {String}         comments.text Comment text
 *
 * @apiSuccess {Pagination}     pagination Pagination object
 * @apiSuccess {int}                pagination.page Current page
 * @apiSuccess {int}                pagination.pages Total pages
 * @apiSuccess {int}                pagination.results Total results
 * @apiSuccess {int}                pagination.resultsPerPage Displaying results per page
 * @apiSuccess {int}                pagination.offset Start offset
 */
router.get("/:post/comments", (req: express.Request, res: express.Response) => {
    res.response(commentsWithPaginationResponseStub(req));
});


/**
 * @api {post} /post/:post/view View a post
 * @apiName ViewPost
 * @apiGroup Post
 */
router.post("/:post/view", asyncMiddleware(async (req: express.Request, res: express.Response) => {
    const postId: string = req.params.post;
    const post = await getPostById(postId);

    addViewToPost(post, req.user);

    res.response();
}));


/**
 * @api {post} /post/:post/comment Comment on a post
 * @apiName CreateComment
 * @apiGroup Post
 *
 * @apiParam {String} text Comment text
 *
 * @apiSuccess {Comment}     comment Comment object
 * @apiSuccess {String}         comment.id Comment ID
 * @apiSuccess {String}         comment.createdAt Comment creation date
 * @apiSuccess {User}           comment.creator Creator (user) object
 * @apiSuccess {String}             comment.creator.username Username
 * @apiSuccess {Profile}            comment.creator.profile User's profile metadata
 * @apiSuccess {String}                 comment.creator.profile.firstName First name
 * @apiSuccess {String}                 comment.creator.profile.lastName Last name
 * @apiSuccess {Object}                 comment.creator.profile.picture User's profile picture
 * @apiSuccess {String}                     comment.creator.profile.picture.url Url
 * @apiSuccess {String}                     comment.creator.profile.picture.thumbnail Thumbnail url
 * @apiSuccess {String}                 comment.creator.profile.bio Bio text
 * @apiSuccess {int}                comment.creator.following Following counter
 * @apiSuccess {int}                comment.creator.followers Followers counter
 * @apiSuccess {boolean}            comment.creator.isFollowing Already following this user
 * @apiSuccess {String}             comment.creator.createdAt Date registered
 * @apiSuccess {String}         comment.text Comment text
 */
router.post("/:post/comment", (req: express.Request, res: express.Response) => {
    res.response({comment: CommentStub});
});

function hasUserBookmarkedPost(user: IUserModel, post: any) {
    if ( ! post.bookmarked || ! post.bookmarked.length ) {
        return false;
    }

    return post.bookmarked.some((bookmark: any) => {
        return bookmark._id.equals(user._id);
    });
}

router
    .route("/:post/bookmark")

    /**
     * @api {post} /post/:post/bookmark Bookmark a post
     * @apiName BookmarkPost
     * @apiGroup Post
     */
    .post(asyncMiddleware(async (req: express.Request, res: express.Response) => {
        const postId: string = req.params.post;
        const post = await getPostById(postId);

        if ( hasUserBookmarkedPost(req.user, post) ) {
            throw AppError.ObjectExist;
        }

        post.bookmarked.push(req.user._id);

        if ( post.isModified() ) {
            post.save()
                .then(() => {})
                .catch(() => {});
        }

        res.response();
    }))

    /**
     * @api {delete} /post/:post/bookmark Remove post from bookmarks
     * @apiName UnBookmarkPost
     * @apiGroup Post
     */
    .delete(asyncMiddleware(async (req: express.Request, res: express.Response) => {
        const postId: string = req.params.post;
        const post = await getPostById(postId);

        if ( ! hasUserBookmarkedPost(req.user, post) ) {
            throw AppError.ObjectDoesNotExist;
        }

        post.bookmarked.pull(req.user._id);

        if ( post.isModified() ) {
            post.save()
                .then(() => {})
                .catch(() => {});
        }

        res.response();
    }));


/**
 * @api {post} /post/:post/report Report a post
 * @apiName ReportPost
 * @apiGroup Post
 */
// TODO: Prepare report reason enum
router.post("/:post/report", (req: express.Request, res: express.Response) => {
    res.response();
});


export default router;