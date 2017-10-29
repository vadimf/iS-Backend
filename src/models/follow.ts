import * as mongoose from "mongoose";
import {IForeignUser, IUserModel} from "./user";

export interface IFollowerModel extends mongoose.Document {
    following: IUserModel;
    follower: IUserModel;
}

export const FollowerSchema = new mongoose.Schema(
    {
        following: {
            type: mongoose.SchemaTypes.ObjectId,
            index: true,
            ref: "User"
        },
        follower: {
            type: mongoose.SchemaTypes.ObjectId,
            index: true,
            ref: "User"
        }
    },
    {
        timestamps: true
    }
);

export function followersToForeignUsersArray(followers: IFollowerModel[]): IForeignUser[] {
    const users: IForeignUser[] = [];

    for ( const follower of followers ) {
        users.push(follower.follower.toForeignUser());
    }

    return users;
}

export function followingUsersToForeignUsersArray(followingUsers: IFollowerModel[]): IForeignUser[] {
    const users: IForeignUser[] = [];

    for ( const following of followingUsers ) {
        users.push(following.following.toForeignUser());
    }

    return users;
}

export const Follower = mongoose.model<IFollowerModel>("Follow", FollowerSchema, "follows");

/**
 * @param conditions
 * @returns "mongoose".DocumentQuery<IFollowerModel[], IFollowerModel>
 */
export function getByConditions(conditions: any) {
    // TODO: Check if following, change the boolean accordingly.
    // TODO: Populate "followers" and "following" fields

    return Follower
        .find(conditions)
        .populate("follower")
        .populate("following");
}

/**
 *
 * @param conditions
 * @returns "mongoose".Query<number>
 */
export function countByConditions(conditions: any) {
    return Follower
        .count(conditions);
}