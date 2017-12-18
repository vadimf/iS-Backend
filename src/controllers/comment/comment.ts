import * as express from "express";
import { AppError } from "../../models/app-error";
import { Comment } from "../../models/comment";
import { asyncMiddleware } from "../../server";
import { IUserModel, populateFollowing } from "../../models/user";
import { SystemConfiguration } from "../../models/system-vars";
import { Post } from "../../models/post";

const router = express.Router();

/**
 * Count number of comments in a post
 *
 * @param {string} postId
 * @returns {Promise<number>}
 */
export async function countPostComments(postId: string) {
    return await Comment.count({post: postId});
}

/**
 * Get a comment object by it's ID
 *
 * @param {string} commentId
 * @returns {Promise<ICommentModel>}
 */
async function getCommentById(commentId: string) {
    const comment = await Comment.findOne({_id: commentId}).populate("creator");

    if ( ! comment ) {
        throw AppError.ObjectDoesNotExist;
    }

    return comment;
}

/**
 * Get a comment object by it's ID
 *
 * @param {string} commentId
 * @param user
 * @returns {Promise<ICommentModel>}
 */
async function getCommentByIdOwnedByUser(commentId: string, user: IUserModel) {
    const comment = await Comment.findOne({_id: commentId}).populate("creator");
    const creatorId = (<IUserModel>comment.creator)._id;

    if ( ! creatorId.equals(user._id) ) {
        throw AppError.ObjectDoesNotExist;
    }

    return comment;
}

/**
 * @api {get} /comment/:comment Get comment by ID
 * @apiName Get
 * @apiGroup Comments
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
router.get("/:comment", asyncMiddleware(async (req: express.Request, res: express.Response) => {
    const commentId: string = req.params.comment;
    const comment = await getCommentById(commentId);

    await populateFollowing(comment, req.user, "creator");

    res.response({comment: comment});
}));


/**
 * @api {patch} /comment/:comment Edit a comment
 * @apiName Edit
 * @apiGroup Comments
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
router.patch("/:comment", asyncMiddleware(async (req: express.Request, res: express.Response) => {
    const commentId: string = req.params.comment;
    const comment = await getCommentByIdOwnedByUser(commentId, req.user);

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

    comment.text = <string>req.body.text;

    if ( comment.isModified() ) {
        comment
            .save()
            .then(() => {})
            .catch(() => {});
    }

    res.response({comment: comment});
}));


/**
 * @api {delete} /comment/:comment Remove a comment
 * @apiName Remove
 * @apiGroup Post
 */
router.delete("/:comment", asyncMiddleware(async (req: express.Request, res: express.Response) => {
    const commentId: string = req.params.comment;
    const comment = await getCommentByIdOwnedByUser(commentId, req.user);
    const postId = comment.post;

    res.response();

    comment
        .remove()
        .then(async () => {
            const post = await Post.findOne({_id: postId});

            if ( post ) {
                post.comments = await countPostComments(post._id);

                if ( post.isModified() ) {
                    await post.save();
                }
            }
        })
        .catch(() => {});
}));


export default router;