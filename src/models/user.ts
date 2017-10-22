import * as mongoose from "mongoose";
import {IUserPicture, UserPictureSchema} from "./picture";
import {IPhoneNumber, PhoneNumberSchema} from "./phone-number";

export interface IUserProfile {
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

export interface IAuthToken {
    authToken: string;
    firebaseToken: string;
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
            unique: true
        }
    },
    {
        timestamps: true
    }
);

export interface IUserModel extends mongoose.Document {
    username?: string;
    email?: string;
    facebookId?: string;
    phone: IPhoneNumber;
    tokens: IAuthToken[];
    profile: IUserProfile;

    toLoggedUser(): ILoggedUser;
    toForeignUser(): IForeignUser;
}

export interface ILoggedUser {
    username?: string;
    email?: string;
    phone: IPhoneNumber;
    profile: IUserProfile;
    followers: Number;
    following: Number;
}


export interface IForeignUser {
    username?: string;
    profile: IUserProfile;
    followers: Number;
    following: Number;
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
            default: ""
        },
        phone: {
            type: PhoneNumberSchema,
            unique: true,
            required: true,
            index: true
        },
        tokens: {
            type: [AuthTokenSchema],
            required: true,
            unique: true,
            index: true
        },
        profile: {
            type: ProfileSchema
        }
    },
    {
        timestamps: true
    }
);
UserSchema.methods.toLoggedUser = function(): ILoggedUser {
    return {
        username: this.username,
        email: this.email,
        phone: this.phone,
        profile: this.profile,
        followers: 0,
        following: 0
    };
};
UserSchema.methods.toForeignUser = function(): IForeignUser {
    return {
        username: this.username,
        profile: this.profile,
        followers: 0,
        following: 0
    };
};




export const LoggedUserStub: ILoggedUser = {
    "username": "matymichalsky",
    "email": "maty@globalbit.co.il",
    "phone": {
        "country": "+972",
        "area": "52",
        "number": "8330112"
    },
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
    "following": 0
};

export const ForeignUserStub: IForeignUser = {
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
    "following": 0
};


export const User = mongoose.model<IUserModel>("User", UserSchema, "users");