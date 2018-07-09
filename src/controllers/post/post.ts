import * as express from "express";
import { IPost, IPostReport, IPostView, IVideo, IVideoDimensions, Post, PostReportReason } from "../../models/post";
import { SystemConfiguration } from "../../models/system-vars";
import { AppError } from "../../models/app-error";
import { IUserModel, populateFollowing } from "../../models/user";
import { asyncMiddleware } from "../../server";
import { Pagination } from "../../models/pagination";
import { countPostComments } from "../comment/comment";
import * as _ from "underscore";
import { CustomNotificationSender } from "../../utilities/custom-notification-sender";
import * as multer from "multer";
import { MimeType, StorageManager } from "../../utilities/storage-manager";
import { Utilities } from "../../utilities/utilities";
import { Administrator } from "../../models/admin/administrator";
import * as nodemailer from "nodemailer";
import * as pug from "pug";
import * as mongoose from "mongoose";
import * as moment from "moment";
// const getDuration = require("get-video-duration");
const ffmpeg = require("fluent-ffmpeg");

const storage = multer.memoryStorage();
const upload = multer({
    storage: storage,
    limits: {
        fileSize: 52428800
    }
});
const router = express.Router();

/**
 * Get a post by it's ID
 *
 * @param {string} id
 * @param filterBlockedUsers
 * @returns Promise<IPost>
 */
export async function getPostById(id: string, filterBlockedUsers: boolean = true) {
    let post;

    try {
        post = await Post
            .findOne({_id: id})
            .populate("creator")
            .populate("reports.creator");
    }
    catch (e) {
        throw AppError.ObjectDoesNotExist;
    }

    if ( ! post ) {
        throw AppError.ObjectDoesNotExist;
    }

    // if ( post.creator.blocked && filterBlockedUsers ) {
    //     throw AppError.ObjectDoesNotExist;
    // }

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
    post.currentUser = user;
    return post.didView();
}

function addViewToPost(post: IPost, user: IUserModel) {
    if ( ! hasUserViewedPost(user, post) ) {
        post.uniqueViews++;
    }

    if ( ! post.viewers ) {
        post.viewers = [] as IPostView[];
    }

    addDailyViewToPost(post, user);

    post.viewers = post.viewers.concat([
        {
            user: user._id
        } as IPostView,
    ]);

    if ( post.isModified() ) {
        post.save()
            .then(() => {})
            .catch(() => {});
    }
}

function addDailyViewToPost(post: IPost, user: IUserModel) {
    const existingView = post.viewers && post.viewers.length ?
        post.viewers.find((view: IPostView) => {
            const postViewerId = view.user as mongoose.Types.ObjectId;
            return postViewerId.equals(user._id) && moment(view.createdAt).add(24, "hours").toDate().getTime() > Date.now();
        }) :
        null;

    if ( ! existingView ) {
        if ( ! post.dailyViews ) {
            post.dailyViews = 0;
        }

        post.dailyViews++;
    }
}

function convertVideoToGif(videoUrl: string, gifFileName: string, videoDuration: number, gifDuration: number): Promise<string> {
    let from = 0;

    videoDuration = Math.floor(videoDuration);

    if ( videoDuration > gifDuration ) {
        from = Math.floor((videoDuration - gifDuration) / 2);
    }
    else if ( videoDuration < gifDuration ) {
        from = 0;
    }

    gifFileName = gifFileName + ".gif";
    const storageFile = StorageManager.getBucketFile(gifFileName);

    const stream = storageFile.createWriteStream({
        metadata: {
            contentType: MimeType.IMAGE_GIF
        }
    });

    return new Promise<string>((resolve, reject) => {
        stream
            .on("error", (err: any) => {
                reject(err);
            })
            .on("finish", async () => {
                await storageFile.makePublic();
                const url = StorageManager.getPublicUrl(gifFileName);
                console.log("Gif uploaded to:", url);
                resolve(url);
            });

        ffmpeg(videoUrl)
            .format("gif")
            .size("320x?")
            .seekInput(from)
            .duration(gifDuration)
            .inputFPS(25)
            .stream(stream);
    });
}

interface IUploadedFile {
    fieldname: string;
    buffer: Buffer;
    mimetype: string;
    size: number;
}

/**
 * @api {post} /post Create a post
 * @apiName CreatePost
 * @apiGroup Post
 *
 * @apiParam {Multipart}        video               Video file
 * @apiParam {Multipart}        thubmnail           Video thumbnail image file
 * @apiParam {Int}              duration            Video duration (seconds)
 * @apiParam {String}           text                Video text
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
 * @apiSuccess {String}             post.video.thumbnail Thumbnail URLs
 * @apiSuccess {int}                post.video.duration Video duration (seconds)
 * @apiSuccess {int}            post.views Post views
 * @apiSuccess {int}            post.uniqueViews Post unique views
 * @apiSuccess {int}            post.comments Post comments
 * @apiSuccess {String}         post.text Post text
 */
router.post("/", upload.fields([{name: "video", maxCount: 1}, {name: "thumbnail", maxCount: 1}]), asyncMiddleware(async (req: express.Request, res: express.Response) => {
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

    const text = req.body.text as string;
    const tags = req.body.tags instanceof Array ? req.body.tags as string[] : (req.body.tags ? [String(req.body.tags)] : []);

    const post = new Post();
    post.text = text;
    post.creator = req.user;

    if ( text ) {
        post.tags = tags; // getTagsByText(text);
    }

    const fileName = req.user._id.toString() + "/" + Utilities.randomStringArguments(
        24,
        true,
        false,
        true,
        false
    );

    post.video = await uploadVideo(req, fileName);
    await post.save();

    uploadSample(req, post, fileName)
        .then(() => {})
        .catch(() => {
            console.warn("Gif uploading failed", post._id);
        });

    res.response({post: post});
}));

export async function uploadVideo(req: express.Request, fileName: string): Promise<IVideo> {
    const videoFilesArray: IUploadedFile[] = (<any>req.files)["video"];
    const thumbnailFilesArray: IUploadedFile[] = (<any>req.files)["thumbnail"];
    const videoFile = videoFilesArray && videoFilesArray.length > 0 ? videoFilesArray[0] as IUploadedFile : null;
    const thumbnailFile = thumbnailFilesArray && thumbnailFilesArray.length > 0 ? thumbnailFilesArray[0] : null;
    const duration = Number(req.body.duration || 0);
    const height = Number(req.body.height || 0);
    const width = Number(req.body.width || 0);

    req.setTimeout(0, null);

    if ( ! videoFile || ! thumbnailFile ) {
        throw AppError.UploadingError;
    }

    const fileStorageManager = new StorageManager();

    const thumbnailUploadingPromise = fileStorageManager
        .fileName(fileName + ".thumb")
        .fromBuffer(
            thumbnailFile.buffer,
            {
                allowedMimeTypes: [MimeType.IMAGE_JPEG, MimeType.IMAGE_GIF, MimeType.IMAGE_PNG]
            }
        );

    const videoUploadingPromise = fileStorageManager
        .fileName(fileName)
        .fromBuffer(
            videoFile.buffer,
            {
                allowedMimeTypes: [MimeType.VIDEO_MP4],
                knownData: {
                    mime: videoFile.mimetype,
                    ext: "mp4"
                }
            }
        );

    const videoFilesUploadingPromises = await Promise.all([thumbnailUploadingPromise, videoUploadingPromise]);

    return {
        url: videoFilesUploadingPromises[1].url,
        thumbnail: videoFilesUploadingPromises[0].url,
        duration: duration,
        dimensions: {
            height: height,
            width: width,
        } as IVideoDimensions,
    } as IVideo;
}

export async function uploadSample(req: express.Request, post: IPost, fileName: string) {
    post.video.gif = await convertVideoToGif(post.video.url, fileName + ".animated", post.video.duration, 6);
    return post.save();
}

export async function getPostsListByConditions(conditions: any, req: express.Request, res: express.Response) {
    const page: number = req.query.page;
    const total = await Post.count(conditions);
    const pagination = new Pagination(page, total);

    const posts = await Post
        .find(conditions)
        .sort("-createdAt")
        .populate("creator")
        .skip(pagination.offset)
        .limit(pagination.resultsPerPage);

    await populateFollowing(posts, req.user, "creator");

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
router.get("/bookmarked", asyncMiddleware(async (req: express.Request, res: express.Response) => {
    await getPostsListByConditions({"bookmarked._id": req.user._id, parent: null}, req, res);
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
     * @apiSuccess {String}             post.video.thumbnail Thumbnail URL
     * @apiSuccess {int}                post.video.duration Video duration (seconds)
     * @apiSuccess {int}            post.views Post views
     * @apiSuccess {int}            post.uniqueViews Post unique views
     * @apiSuccess {int}            post.comments Post comments
     * @apiSuccess {String}         post.text Post text
     */
    .get(asyncMiddleware(async (req: express.Request, res: express.Response) => {
        const postId: string = req.params.post;
        const post = await getPostById(postId);

        await populateFollowing(post, req.user, "creator");

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
     * @apiSuccess {String}             post.video.thumbnail Thumbnail URL
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

        res.response();

        const removeVideoFilePromise = StorageManager.removeFile(post.video.url);
        const removeVideoThumbnailPromise = StorageManager.removeFile(post.video.thumbnail);

        Promise.all([removeVideoFilePromise, removeVideoThumbnailPromise])
            .then(() => {})
            .catch(() => {});

        await post.remove();

        if ( post.parent ) {
            const parentPostId = post.parent as mongoose.Types.ObjectId;
            const parentPost = await getPostById(parentPostId.toString());

            if ( parentPost ) {
                parentPost.comments = await Post.count({parent: parentPostId});
                await parentPost.save();
            }
        }
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
 * @apiSuccess {String}                 comments.creator.profile.firstName First namenpm
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
router.get("/:post/comments", asyncMiddleware(async (req: express.Request, res: express.Response) => {
    const postId: string = req.params.post;
    const post = await getPostById(postId);
    const page: number = req.query.page;
    const total: number = await Post.count({parent: post._id});
    const pagination = new Pagination(page, total);
    const comments = await Post
        .find({parent: post._id})
        .sort("-createdAt")
        .skip(pagination.offset)
        .limit(pagination.resultsPerPage)
        .populate("creator");

    await populateFollowing(comments, req.user, "creator");

    res.response({
        comments: comments,
        pagination: pagination
    });
}));


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
router.post("/:post/comment", upload.fields([{name: "video", maxCount: 1}, {name: "thumbnail", maxCount: 1}]), asyncMiddleware(async (req: express.Request, res: express.Response) => {
    const postId: string = req.params.post;
    const post = await getPostById(postId);

    req.checkBody({
        "text": {
            isLength: {
                options: [{
                    min: SystemConfiguration.validations.commentText.minLength,
                    max: SystemConfiguration.validations.commentText.maxLength
                }],
                errorMessage: "Comment-text length is invalid"
            }
        }
    });

    if ( req.requestInvalid() ) {
        return;
    }

    const text: string = req.body.text;

    const comment = new Post();
    comment.parent = post;
    comment.creator = req.user;
    comment.text = text;
    if ( text ) {
        comment.tags = getTagsByText(text);
    }

    const fileName = req.user._id.toString() + "/" + Utilities.randomStringArguments(
        24,
        true,
        false,
        true,
        false
    );

    comment.video = await uploadVideo(req, fileName);

    res.response({comment: comment});

    comment
        .save()
        .then(async() => {
            post.comments = await countPostComments(post._id.toString());
            await post.save();

            // const mentionedUsernames = getUsernameMentionsByText(text);
            //
            // if (mentionedUsernames.length) {
            //     const mentionedUsers = await User.find({
            //         username: {$in: mentionedUsernames},
            //         _id: {$ne: post.creator._id}
            //     });
            //
            //     if (mentionedUsers.length) {
            //         await sendCommentMentionsNotification(mentionedUsers, req.user, comment);
            //     }
            // }

            if ( ! (post.creator as IUserModel)._id.isEqual(req.user._id) ) {
                await sendNewCommentNotification(post.creator, req.user, comment);
            }
        })
        .catch(() => {});
}));

/**
 * Send a notification about new comment in a post to the post's creator
 *
 * @param {IUserModel} toUser
 * @param {IUserModel} byUser
 * @param {Post} comment
 * @returns {Promise<any>}
 */
async function sendNewCommentNotification(toUser: IUserModel, byUser: IUserModel, comment: IPost) {
    return await (new CustomNotificationSender(toUser))
        .comment(byUser, comment)
        .send();
}

// /**
//  * Send a notification about comment mentions in a post to the mentioned users
//  *
//  * @param {IUserModel[]} toUsers
//  * @param {IUserModel} byUser
//  * @param {ICommentModel} comment
//  * @returns {Promise<any>}
//  */
// async function sendCommentMentionsNotification(toUsers: IUserModel[], byUser: IUserModel, comment: IPost) {
//     return await (new CustomNotificationSender(toUsers))
//         .mention(byUser, comment)
//         .send();
// }
//
// /**
//  * @param {string} text
//  * @returns {any}
//  */
// function getUsernameMentionsByText(text: string) {
//     if ( ! text ) {
//         return [];
//     }
//
//     const mentionsRegex = new RegExp("@([a-z0-9_.]+\\b)", "mg");
//
//     let matches = text.match(mentionsRegex);
//     if (matches && matches.length) {
//         matches = matches.map(function(match) {
//             return match.slice(1);
//         });
//         return _.uniq(matches);
//     } else {
//         return [];
//     }
// }

/**
 * @param {string} text
 * @returns {any}
 */
function getTagsByText(text: string) {
    const mentionsRegex = new RegExp("#([a-z0-9_.]+\\b)", "mg");

    let matches = text.match(mentionsRegex);
    if (matches && matches.length) {
        matches = matches.map(function(match) {
            return match.slice(1);
        });
        return _.uniq(matches);
    } else {
        return [];
    }
}

/**
 * Check whether the user has already bookmarked a post
 *
 * @param {IUserModel} user
 * @param post
 * @returns {boolean}
 */
function hasUserBookmarkedPost(user: IUserModel, post: any) {
    if ( ! post.bookmarked || ! post.bookmarked.length ) {
        return false;
    }

    return post.didBookmark() || post.bookmarked.some((bookmark: any) => {
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

        if ( ! post.bookmarked ) {
            post.bookmarked = [];
        }

        post.bookmarked = (post.bookmarked as mongoose.Types.ObjectId[]).concat([req.user._id]);

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

        if ( ! post.bookmarked ) {
            post.bookmarked = [];
        }

        post.bookmarked = (post.bookmarked as mongoose.Types.ObjectId[]).filter((item: mongoose.Types.ObjectId) => {
            return item.equals(req.user._id);
        });

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
 *
 * @apiParam {enum} reason Report reason enum (Spam = 1, Inappropriate = 2, DontLike = 3)
 */
router.post("/:post/report", asyncMiddleware(async (req: express.Request, res: express.Response) => {
    const postId: string = req.params.post;
    const post = await getPostById(postId);

    if ( post.creator._id.equals(req.user._id) ) {
        throw AppError.ObjectDoesNotExist;
    }

    req.checkBody("reason", "Report reason must be numeric").isNumeric();

    if ( req.requestInvalid() ) {
        return;
    }

    const reason: PostReportReason = +req.body.reason;

    if ( ! post.reports ) {
        post.reports = [];
    }

    post.reports = post.reports.concat([
        {
            creator: req.user._id,
            reason: reason
        } as IPostReport
    ]);

    await Promise.all([
        post.save(),
        sendReportEmail(post, req.user)
    ]);

    res.response();
}));

async function sendReportEmail(post: IPost, user: IUserModel) {
    const path = __dirname + "/../../../views/emails/post-report.pug";
    const renderedView = pug.renderFile(path, {
        brand: process.env.APP_NAME,
        user: user,
        link: process.env.ADMIN_URL + "reports/" + post._id.toString()
    });

    const transporterOptions = {
        host: process.env.EMAIL_HOST,
        port: +process.env.EMAIL_PORT,
        secure: process.env.EMAIL_SECURE === "true",
        auth: {
            user: process.env.EMAIL_AUTH_USER,
            pass: process.env.EMAIL_AUTH_PASSWORD
        }
    };

    const transporter = nodemailer.createTransport(transporterOptions);

    const administrators = await Administrator.find();

    const emails: Array<string> = [];

    for ( const admin of administrators ) {
        emails.push(admin.email);
    }

    const mailOptions = {
        from: process.env.APP_NAME + " <" + process.env.EMAIL_FROM + ">",
        to: emails.join(", "),
        subject: "(" + process.env.APP_NAME + ") New post report",
        html: renderedView
    };

    return new Promise((resolve, reject) => {
        transporter.sendMail(mailOptions, (error?: Error, info?: nodemailer.SentMessageInfo) => {
            if (error) {
                reject(error);
                return;
            }

            resolve(info);
        });
    });
}

export default router;