import * as mongoose from "mongoose";
import {IUserPicture, UserPictureSchema} from "./picture";
import {IPhoneNumberModel, PhoneNumberSchema} from "./phone-number";
import * as bcrypt from "bcrypt-nodejs";

export interface IUserProfileModel {
    firstName: string;
    lastName: string;
    picture: IUserPicture;
    bio: string;
}

export const ProfileSchema = new mongoose.Schema(
    {
        firstName: String,
        lastName: String,
        picture: {
            type: UserPictureSchema
        },
        bio: String
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
            unique: true,
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

interface IPasswordModel extends mongoose.Document {
    hash: string;

    compare: (candidatePassword: string) => Promise<any>;
    setPassword: (newPassword: string) => Promise<any>;
}

const PasswordSchema = new mongoose.Schema({
    hash: {
        type: String
    }
});
PasswordSchema.methods.compare = function(candidatePassword: string, cb: (err: any, isMatch: any) => {}) {
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

    toLoggedUser(): ILoggedUser;
    toForeignUser(): IForeignUser;
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
        tokens: {
            type: [AuthTokenSchema],
            required: true,
            unique: true,
            index: true,
            sparse: true
        },
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
        isFollowing: false,
        createdAt: this.createdAt
    };
};


const CreatedAtDateStub = new Date("2017-10-17T08:20:38.339Z");


export const ForeignUserStub = {
    "username": "matymichalsky",
    "profile": {
        "firstName": "Maty",
        "lastName": "Michalsky",
        "picture": {
            "url": "https://scontent.fsdv2-1.fna.fbcdn.net/v/t1.0-9/19702223_10203302270553950_2168285220720904719_n.jpg?oh=341ab8c1a622361a854488368acbe7bd&oe=5A82EA0B",
            "thumbnail": "https://scontent.fsdv2-1.fna.fbcdn.net/v/t1.0-9/19702223_10203302270553950_2168285220720904719_n.jpg?oh=341ab8c1a622361a854488368acbe7bd&oe=5A82EA0B"
        },
        "bio": "Hello, It's me :)"
    },
    "followers": 0,
    "following": 0,
    "isFollowing": false,
    "createdAt": CreatedAtDateStub
};

export function foreignUsersArray(users: IUserModel[]): IForeignUser[] {
    const parsedUsers: IForeignUser[] = [];

    for ( const user of users ) {
        parsedUsers.push(user.toForeignUser());
    }

    return parsedUsers;
}


export const User = mongoose.model<IUserModel>("User", UserSchema, "users");