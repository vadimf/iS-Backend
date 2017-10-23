import {ForeignUserStub} from "./user";
import * as express from "express";
import {Pagination} from "./pagination";

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