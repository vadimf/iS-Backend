import { IUserModel } from "./user";
import * as mongoose from "mongoose";

/*
POST ENUMS
 */
export enum PostReportReason {
    Spam = 1,
    Inappropriate = 2,
    DoNotLike = 3
}

/*
INTERFACES
 */
export interface IPost extends mongoose.Document {
    creator: IUserModel;
    video: IVideo;
    text?: string;
    parent?: IPost | mongoose.Types.ObjectId;

    viewers: mongoose.Types.Array<IUserModel>;
    bookmarked: mongoose.Types.Array<IUserModel>;
    reports: IPostReport[];

    views: number;
    uniqueViews: number;
    comments: number;

    currentUser?: IUserModel;
    didBookmark: () => boolean;
    didView: () => boolean;

    toAdministrators(): any;
}

export interface IVideo {
    url: string;
    thumbnail: string;
    duration: number;
}

export interface IPostReport {
    reason: PostReportReason;
    creator: IUserModel|mongoose.Types.ObjectId;
}

/*
SCHEMAS
 */
export const VideoSchema = new mongoose.Schema(
    {
        url: String,
        thumbnail: String,
        duration: Number
    }
);

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
        },
        completed: {
            type: Boolean,
            "default": false
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
        viewers: {
            type: [PostViewSchema],
            ref: "User"
        },
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
        reports: [PostReportSchema],
        parent: {
            type: mongoose.SchemaTypes.ObjectId,
            ref: "Post"
        }
    },
    {
        timestamps: true
    }
);

PostSchema.methods.didBookmark = function(): boolean {
    if ( ! this.currentUser ) {
        return false;
    }

    const userId = this.currentUser._id;

    return !!this.bookmarked.find((bookmark: mongoose.Types.ObjectId) => {
        return bookmark.equals(userId);
    });
};

PostSchema.methods.didView = function(): boolean {
    if ( ! this.currentUser ) {
        return false;
    }

    const userId = this.currentUser._id;

    return !!this.viewers.find((bookmark: mongoose.Types.ObjectId) => {
        return bookmark.equals(userId);
    });
};

PostSchema.methods.toJSON = function() {
    return {
        id: this._id,
        createdAt: this.createdAt,
        creator: this.creator ? this.creator.toForeignUser() : null,
        video: this.video,
        views: this.viewers ? this.viewers.length : 0,
        uniqueViews: +this.uniqueViews,
        comments: +this.comments,
        text: this.text,
        bookmarked: this.didBookmark(),
        viewed: this.didView()
    };
};

PostSchema.methods.toAdministrators = function() {
    const res = this.toJSON();

    const formattedReports: Array<any> = [];

    for ( const report of this.reports ) {
        formattedReports.push({
            creator: report.creator.toForeignUser(),
            createdAt: report.createdAt,
            reason: report.reason
        });
    }

    res.reports = formattedReports;

    return res;
};

export function postsToAdministrators(posts: IPost[]) {
    const formatted: Array<any> = [];

    for ( const post of posts ) {
        formatted.push(post.toAdministrators());
    }

    return formatted;
}

VideoSchema.methods.toJSON = function() {
    return {
        url: this.url,
        thumbnail: this.thumbnail,
        duration: this.duration
    };
};

export const Post = mongoose.model<IPost>("Post", PostSchema, "posts");