import {IUserModel} from "../../models/user";
import {AppError} from "../../models/app-error";
import {Follower} from "../../models/follow";

/**
 * Update followed user "followed" counter, and following user "following" counter
 *
 * @param {IUserModel} byUser
 * @param {IUserModel} toUser
 * @returns {Promise<void>}
 */
async function updateCounters(byUser: IUserModel, toUser: IUserModel) {
    // update byUser's following counter
    Follower
        .count({follower: byUser._id})
        .then((following: number) => {
            byUser.following = following;
            byUser.save()
                .then(() => {})
                .catch(() => {});
        })
        .catch(() => {});


    // update toUsers's followers counter
    Follower
        .count({following: toUser._id})
        .then((followers: number) => {
            toUser.followers = followers;
            toUser.save()
                .then(() => {})
                .catch(() => {});
        })
        .catch(() => {});
}

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
        .then(async () => {
            await updateCounters(byUser, toUser);
        })
        .catch(() => {});
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
        .then(async () => {
            await updateCounters(byUser, toUser);
        })
        .catch(() => {});
}