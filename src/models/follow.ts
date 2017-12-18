import * as mongoose from "mongoose";
import { IForeignUser, IUserModel, populateFollowing } from "./user";

export interface IFollowerModel extends mongoose.Document {
    following: IUserModel | mongoose.Types.ObjectId;
    follower: IUserModel | mongoose.Types.ObjectId;
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

export async function followersToForeignUsersArray(followingUsers: IFollowerModel[], currentUser: IUserModel, isFollowing = false): Promise<IForeignUser[]> {
    const users: IUserModel[] = [];

    for ( const following of followingUsers ) {
        users.push(<IUserModel>(isFollowing ? following.following : following.follower));
    }

    await populateFollowing(users, currentUser);

    const foreignUsersOutput: IForeignUser[] = [];

    for ( const user of users ) {
        foreignUsersOutput.push(user.toForeignUser());
    }

    return foreignUsersOutput;
}

export const Follower = mongoose.model<IFollowerModel>("Follow", FollowerSchema, "follows");

/**
 *
 * @param conditions
 * @returns "mongoose".Query<number>
 */
export function countByConditions(conditions: any) {
    return Follower
        .count(conditions);
}