import {IUserModel} from "./user";
import * as mongoose from "mongoose";

export interface IPost extends mongoose.Document {
    creator: IUserModel;
    video: IVideo;
    text?: string;

    viewers: mongoose.Types.Array<IUserModel>;
    bookmarked: mongoose.Types.Array<IUserModel>;
    reports: IPostReport[];

    views: number;
    uniqueViews: number;
    comments: number;
}

export interface IVideo {
    url: string;
    thumbnail: string;
    duration: number;
}

export const VideoSchema = new mongoose.Schema(
    {
        url: String,
        thumbnail: String,
        duration: Number
    }
);

export interface IPostReport {
    reason: PostReportReason;
    creator: IUserModel|mongoose.Types.ObjectId;
}

export const PostReportSchema = new mongoose.Schema(
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

const PostViewSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.SchemaTypes.ObjectId,
            ref: "User",
        }
    },
    {
        timestamps: true
    }
);

const BookmarkerSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.SchemaTypes.ObjectId,
            ref: "User",
            index: true
        }
    },
    {
        timestamps: true
    }
);

export const PostSchema = new mongoose.Schema(
    {
        creator: {
            type: mongoose.SchemaTypes.ObjectId,
            ref: "User",
            required: true,
            index: true
        },
        video: {
            type: VideoSchema,
            required: true
        },
        text: {
            type: String
        },
        viewers: [PostViewSchema],
        bookmarked: {
            type: [BookmarkerSchema],
            ref: "User"
        },
        uniqueViews: {
            type: Number,
            "default": 0
        },
        comments: {
            type: Number,
            "default": 0
        },
        reports: [PostReportSchema]
    },
    {
        timestamps: true
    }
);


PostSchema.methods.toJSON = function() {
    return {
        id: this._id,
        createdAt: this.createdAt,
        creator: this.creator ? this.creator.toForeignUser() : null,
        video: {
            url: this.video.url,
            thumbnail: this.video.thumbnail,
            duration: this.video.duration
        },
        views: this.viewers ? this.viewers.length : 0,
        uniqueViews: +this.uniqueViews,
        comments: +this.comments,
        text: this.text
    };
};

export const Post = mongoose.model<IPost>("Post", PostSchema, "posts");

export enum PostReportReason {
    Spam = 1,
    Inappropriate = 2,
    DontLike = 3
}