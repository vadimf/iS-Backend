import * as mongoose from "mongoose";

export interface IUserPicture {
    url: string;
    thumbnail: string;
}

export const UserPictureSchema = new mongoose.Schema(
    {
        url: String,
        path: String,
        thumbnail: String,
        thumbnailPath: String
    },
    {
        toJSON: {
            transform: function (doc: any, ret: any) {
                delete ret._id;
                delete ret.path;
                delete ret.thumbnailPath;
            }
        }
    }
);