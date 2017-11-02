import {IUserModel} from "./user";
import * as mongoose from "mongoose";
import {IPost} from "./post";


export interface ICommentModel extends mongoose.Document {
    creator: IUserModel | mongoose.Types.ObjectId;
    post: IPost | mongoose.Types.ObjectId;
    text?: string;
}

export const CommentSchema = new mongoose.Schema(
    {
        creator: {
            type: mongoose.SchemaTypes.ObjectId,
            ref: "User",
            required: true,
            index: true
        },
        post: {
            type: mongoose.SchemaTypes.ObjectId,
            ref: "Post",
            required: true,
            index: true
        },
        text: {
            type: String,
            required: true
        }
    },
    {
        timestamps: true
    }
);


CommentSchema.methods.toJSON = function() {
    return {
        id: this._id,
        createdAt: this.createdAt,
        creator: this.creator ? this.creator.toForeignUser() : null,
        text: this.text
    };
};

export const Comment = mongoose.model<ICommentModel>("Comment", CommentSchema, "comments");
