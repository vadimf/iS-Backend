import * as mongoose from "mongoose";
import { IUserPicture, UserPictureSchema } from "./picture";
import { IPhoneNumberModel, PhoneNumberSchema } from "./phone-number";
import * as bcrypt from "bcrypt-nodejs";
import { isBoolean } from "util";
import { Follower, IFollowerModel } from "./follow";
import * as _ from "underscore";

export interface IUserProfileModel {
    firstName: string;
    lastName: string;
    picture: IUserPicture;
    bio: string;
    website: string;
}

export const ProfileSchema = new mongoose.Schema(
    {
        firstName: String,
        lastName: String,
        picture: {
            type: UserPictureSchema
        },
        bio: String,
        website: String
    },
    {
        toJSON: {
            transform: function (doc: any, ret: any) {
                delete ret._id;
            }
        }
    }
);

export interface IAuthTokenModel {
    authToken: string;
    firebaseToken?: string;
}

export const AuthTokenSchema = new mongoose.Schema(
    {
        authToken: {
            type: String,
            required: true
        },
        firebaseToken: {
            type: String,
            "default": null,
            sparse: true
        }
    },
    {
        timestamps: true
    }
);

export interface IPasswordModel extends mongoose.Document {
    hash: string;
    resetToken?: string;

    compare: (candidatePassword: string) => Promise<any>;
    setPassword: (newPassword: string) => Promise<any>;
}

export const PasswordSchema = new mongoose.Schema({
    hash: {
        type: String
    },
    resetToken: {
        type: String
    }
});
PasswordSchema.methods.compare = function(candidatePassword: string) {
    const that = this;
    return new Promise(function (resolve, reject) {
        bcrypt.compare(candidatePassword, that.hash, (err: mongoose.Error, isMatch: boolean) => {
            if ( err ) {
                reject(err);
            }
            else {
                return resolve(isMatch);
            }
        });
    });
};

/**
 * @param {string} newPassword
 * @returns {Promise<void>}
 */
PasswordSchema.methods.setPassword = function(newPassword: string) {
    const that = this;

    return new Promise(function (resolve, reject) {
        bcrypt.genSalt(10, (saltingError: Error, salt: string) => {
            if ( saltingError ) {
                reject(saltingError);
            }
            else {
                bcrypt.hash(
                    newPassword,
                    salt,
                    null,
                    (hashingError: Error, newHash: string) => {
                        if ( hashingError ) {
                            reject(hashingError);
                        }
                        else {
                            that.hash = newHash;
                            resolve();
                        }
                    }
                );
            }
        });
    });
};



export const UserReportSchema = new mongoose.Schema(
    {
        reason: {
            type: Number,
            required: true
        },
        creator: {
            type: mongoose.SchemaTypes.ObjectId,
            required: true,
            ref: "User",
            index: true
        }
    },
    {
        timestamps: true
    }
);

export interface IUserReport {
    reason: UserReportReason;
    creator: IUserModel|mongoose.Types.ObjectId;
}

export interface IUserModel extends mongoose.Document {
    username?: string;
    email?: string;
    facebookId?: string;
    phone: IPhoneNumberModel;
    tokens: IAuthTokenModel[];
    profile: IUserProfileModel;
    followers: number;
    following: number;
    password: IPasswordModel;
    isFollowing: boolean;
    reports: IUserReport[];
    blocked?: boolean;

    toLoggedUser(): ILoggedUser;
    toForeignUser(): IForeignUser;
    toAdministrators(): IUserToAdministrator;
}

export interface ILoggedUser {
    username?: string;
    email?: string;
    phone: IPhoneNumberModel;
    profile: IUserProfileModel;
    followers: Number;
    following: Number;
    createdAt: Date;
}

export interface IForeignUser {
    username?: string;
    profile: IUserProfileModel;
    followers: Number;
    following: Number;
    isFollowing: boolean;
    createdAt: Date;
}

export interface IUserToAdministrator {
    username?: string;
    email?: string;
    facebookId?: string;
    phone?: IPhoneNumberModel;
    profile: IUserProfileModel;
    followers: Number;
    following: Number;
    createdAt: Date;
    blocked: boolean;
}

export const UserSchema = new mongoose.Schema(
    {
        username: {
            type: String,
            lowercase: true,
            unique: true,
            sparse: true
        },
        email: {
            type: String,
            lowercase: true,
            unique: true,
            sparse: true
        },
        phone: {
            type: PhoneNumberSchema,
            unique: true,
            sparse: true,
            index: true
        },
        tokens: [AuthTokenSchema],
        profile: {
            type: ProfileSchema
        },
        followers: {
            type: Number,
            "default": 0
        },
        following: {
            type: Number,
            "default": 0
        },
        facebookId: {
            type: String,
            sparse: true,
            index: true,
            unique: true
        },
        password: {
            type: PasswordSchema,
            "default": {
                hash: ""
            }
        },
        reports: [UserReportSchema],
        blocked: {
            type: Boolean,
            "default": false
        }
    },
    {
        timestamps: true
    }
);
UserSchema.methods.toLoggedUser = function(): ILoggedUser {
    return {
        username: this.username ? this.username : "",
        email: this.email ? this.email : "",
        phone: this.phone ? this.phone : null,
        profile: <IUserProfileModel>this.profile,
        followers: +this.followers,
        following: +this.following,
        createdAt: this.createdAt
    };
};
UserSchema.methods.toForeignUser = function(): IForeignUser {
    return {
        username: this.username ? this.username : "",
        profile: this.profile ? this.profile : null,
        followers: +this.followers,
        following: +this.following,
        isFollowing: ! isBoolean(this.isFollowing) ? false : this.isFollowing,
        createdAt: this.createdAt
    };
};
UserSchema.methods.toAdministrators = function(): IUserToAdministrator {
    return {
        username: this.username ? this.username : "",
        email: this.email || "",
        phone: this.phone,
        facebookId: this.facebookId,
        profile: this.profile ? this.profile : null,
        followers: +this.followers,
        following: +this.following,
        createdAt: this.createdAt,
        blocked: !!this.blocked
    };
};

export function foreignUsersArray(users: IUserModel[]): IForeignUser[] {
    const parsedUsers: IForeignUser[] = [];

    for ( const user of users ) {
        parsedUsers.push(user.toForeignUser());
    }

    return parsedUsers;
}

export function usersToAdministratorsArray(users: IUserModel[]): IUserToAdministrator[] {
    const parsedUsers: IUserToAdministrator[] = [];

    for ( const user of users ) {
        parsedUsers.push(user.toAdministrators());
    }

    return parsedUsers;
}

function getObjectPropertyFromString(obj: any, field: string): any {
    if ( ! field ) {
        return obj;
    }
    else if ( obj[field] ) {
        return obj[field];
    }

    return null;
}

/**
 * @param {Array<any>} objects
 * @param {string} field
 * @param {IUserModel} currentUser
 * @returns {Promise<void>}
 */
export async function populateFollowing(objects: any, currentUser: IUserModel, field?: string) {
    const userIds: string[] = [];

    if ( objects.length ) {
        for (const obj of objects) {
            const userObject = getObjectPropertyFromString(obj, field);

            if (userObject && userObject._id && !isBoolean(userObject.isFollowing)) {
                userIds.push(userObject._id.toString());
            }
        }
    }
    else {
        const userObject = getObjectPropertyFromString(objects, field);

        if (userObject && userObject._id && !isBoolean(userObject.isFollowing)) {
            userIds.push(userObject._id.toString());
        }
    }

    let followingUsers: IFollowerModel[];

    if ( userIds.length ) {
        followingUsers = await Follower.find({follower: currentUser._id, following: {$in: _.uniq(userIds)}});
    }

    const followingUserIds: Map<string, boolean> = new Map([]);

    if ( followingUsers && followingUsers.length ) {
        for ( const follow of followingUsers ) {
            const followingUserId = (<mongoose.Types.ObjectId>follow.following).toString();
            followingUserIds.set(followingUserId, true);
        }

        if ( objects.length ) {
            for (const obj of objects) {
                const userObject = getObjectPropertyFromString(obj, field);

                if (userObject && userObject._id && !( isBoolean(userObject.isFollowing) || userObject.isFollowing ) && followingUserIds.get(userObject._id.toString())) {
                    userObject.isFollowing = true;
                }
            }
        }
        else {
            const userObject = getObjectPropertyFromString(objects, field);

            if (userObject && userObject._id && !( isBoolean(userObject.isFollowing) || userObject.isFollowing ) && followingUserIds.get(userObject._id.toString())) {
                userObject.isFollowing = true;
            }
        }
    }
}

export const User = mongoose.model<IUserModel>("User", UserSchema, "users");

export enum UserReportReason {
    Other = 1
}