import * as express from "express";
import {PostStub, postsWithPaginationResponseStub} from "../models/post";
import {CommentStub, commentsWithPaginationResponseStub} from "../models/comment";

const router = express.Router();


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
router.post("/", (req: express.Request, res: express.Response) => {
    res.response({post: PostStub});
});


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
router.get("/:post", (req: express.Request, res: express.Response) => {
    res.response({post: PostStub});
});


/**
 * @api {patch} /post/:post Edit a post
 * @apiName EditPost
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
router.patch("/:post", (req: express.Request, res: express.Response) => {
    res.response({post: PostStub});
});


/**
 * @api {delete} /post Remove a post
 * @apiName RemovePost
 * @apiGroup Post
 */
router.delete("/:post", (req: express.Request, res: express.Response) => {
    res.response();
});


/**
 * @api {get} /post/:post/comments Post's comments
 * @apiName GetComments
 * @apiGroup Post
 *
 * @apiParam {int} page Page
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


/**
 * @api {post} /post/bookmarked Bookmarked posts
 * @apiName Bookmarks
 * @apiGroup Post
 *
 * @apiParam {int} page Page
 *
 * @apiSuccess {Post[]}     post Post objects
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
router.get("/bookmarked", (req: express.Request, res: express.Response) => {
    res.response(postsWithPaginationResponseStub(req));
});


/**
 * @api {post} /post/:post/bookmark Bookmark a post
 * @apiName BookmarkPost
 * @apiGroup Post
 */
router.post("/:post/bookmark", (req: express.Request, res: express.Response) => {
    res.response();
});


/**
 * @api {delete} /post/:post/bookmark Remove post from bookmarks
 * @apiName UnBookmarkPost
 * @apiGroup Post
 */
router.delete("/:post/bookmark", (req: express.Request, res: express.Response) => {
    res.response();
});


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