import {ForeignUserStub, IUserModel} from "./user";
import * as express from "express";
import * as mongoose from "mongoose";
import {Pagination} from "./pagination";

export interface IPost extends mongoose.Document {
    creator: IUserModel;
    video: IVideo;
    text?: string;

    viewers: [{
        type: IUserModel,
        ref: "User"
    }];

    bookmarked: [{
        type: IUserModel,
        ref: "User"
    }];

    views: number;
    uniqueViews: number;
    comments: number;
}

export interface IVideo {
    url: string;
    thumbnails: string[];
    duration: number;
}

export const VideoSchema = new mongoose.Schema(
    {
        url: String,
        thumbnails: [String],
        duration: Number
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
            index: true
        }
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
            thumbnails: this.video.thumbnails,
            duration: this.video.duration
        },
        views: 1,
        uniqueViews: 1,
        comments: 1,
        text: this.text
    };
};

export const Post = mongoose.model<IPost>("Post", PostSchema, "posts");























const CreatedAtDateStub = new Date("2017-10-17T08:20:38.339Z");

export const PostStub = {
    "id": "jr0a1khg77f0zwfy",
    "createdAt": CreatedAtDateStub,
    "creator": ForeignUserStub,
    "video": {
        "url": "http://techslides.com/demos/sample-videos/small.mp4",
        "thumbnails": [
            "http://images.media-allrecipes.com/userphotos/960x960/3757723.jpg",
            "https://www.thesun.co.uk/wp-content/uploads/2016/09/nintchdbpict000264481984.jpg?w=960",
            "https://mcdonalds.com.au/sites/mcdonalds.com.au/files/hero_pdt_hamburger.png"
        ],
        "duration": 5
    },
    "views": 30,
    "uniqueViews": 15,
    "comments": 105,
    "text": "Hello friends, this is my first vlog. Have fun :)"
};

export function postsWithPaginationResponseStub(req: express.Request): any {
    const posts = [];
    const page = +req.query.page;

    if ( page == 1 ) {
        for ( let i = 0; i < 25; i++ ) {
            posts.push(PostStub);
        }
    }
    else if ( page == 2 ) {
        posts.push(PostStub);
    }

    const pagination = new Pagination(page, 26, 25);

    return {
        posts: posts,
        pagination: pagination
    };
}