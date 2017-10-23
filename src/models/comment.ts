import {ForeignUserStub} from "./user";
import * as express from "express";
import {Pagination} from "./pagination";

const CreatedAtDateStub = new Date("2017-10-17T08:20:38.339Z");

export const CommentStub = {
    "id": "jr0a122hg77f0zwfy",
    "createdAt": CreatedAtDateStub,
    "creator": ForeignUserStub,
    "text": "Hello friends, this is my first vlog. Have fun :)"
};

export function commentsWithPaginationResponseStub(req: express.Request): any {
    const comments = [];
    const page = +req.query.page;

    if ( page < 5 ) {
        for ( let i = 0; i < 25; i++ ) {
            comments.push(CommentStub);
        }
    }
    else if ( page == 5 ) {
        comments.push(CommentStub);
    }

    const pagination = new Pagination(page, 105, 25);

    return {
        comments: comments,
        pagination: pagination
    };
}