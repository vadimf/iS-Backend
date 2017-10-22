// import * as mongoose from "mongoose";
// import {IAuthToken, IUserProfile, User} from "./User";
//
// type BasePost = {
//     createdAt: Date,
//     updatedAt: Date,
//
//     creator: User
// };
//
// export type PostType = mongoose.Document & BasePost & {
//     text: string,
//     video: Video
//
//     comments: Comment[],
//     likes: Like[]
// };
//
// export type Video = mongoose.Document & {
//     url: string,
//     thumbnail: string,
//     duration: number
// };
//
// export type Comment = mongoose.Document & BasePost & {
//     text: string
// };
//
// export type Like = mongoose.Document & BasePost;
//
// const postSchema = new mongoose.Schema(
//     {
//         creator: {
//             type: mongoose.Schema.Types.ObjectId,
//             ref: "FullUser"
//         },
//         text: String,
//         video: {
//             url: {
//                 type: String,
//                 required: true,
//                 default: ""
//             },
//             thumbnail: {
//                 type: String,
//                 required: true,
//                 default: ""
//             },
//             duration: {
//                 type: Number,
//                 required: true,
//                 default: 0
//             }
//         },
//
//         comments: [{
//             creator: {
//                 type: mongoose.Schema.Types.ObjectId,
//                 ref: "FullUser"
//             },
//             text: {
//                 type: String,
//                 required: true,
//                 default: ""
//             }
//         }],
//
//         likes: [{
//             creator: {
//                 type: mongoose.Schema.Types.ObjectId,
//                 ref: "FullUser"
//             },
//         }]
//     },
//     {
//         timestamps: true
//     }
// );
//
// const Post = mongoose.model<PostType>("Post", postSchema);
// export default Post;