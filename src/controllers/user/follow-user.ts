import {IUserModel} from "../../models/user";
import {AppError} from "../../models/app-error";
import {Follower} from "../../models/follow";

/**
 * Follow a user
 *
 * @param {IUserModel} byUser
 * @param {IUserModel} toUser
 * @returns {Promise<void>}
 */
export async function followUser(byUser: IUserModel, toUser: IUserModel) {
    if ( toUser._id.equals(byUser._id) ) {
        throw AppError.ErrorPerformingAction;
    }

    const alreadyFollowing = await Follower.count({following: toUser._id, follower: byUser._id});

    if ( alreadyFollowing ) {
        throw AppError.ObjectExist;
    }

    const follower = new Follower();
    follower.follower = byUser._id;
    follower.following = toUser._id;

    follower
        .save()
        .then(() => {})
        .catch((e) => {
            console.log("Follow user error", e);
        });
}

/**
 * Unfollow a user
 *
 * @param {IUserModel} byUser
 * @param {IUserModel} toUser
 * @returns {Promise<void>}
 */
export async function unfollowUser(byUser: IUserModel, toUser: IUserModel) {
    if ( toUser._id.equals(byUser._id) ) {
        throw AppError.ErrorPerformingAction;
    }

    const isFollowing = await Follower.count({following: toUser._id, follower: byUser._id});

    if ( ! isFollowing ) {
        throw AppError.ObjectDoesNotExist;
    }

    Follower.remove({following: toUser._id, follower: byUser._id})
        .then(() => {})
        .catch((e) => {
            console.log("Unfollow user error", e);
        });
}