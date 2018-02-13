import * as express from "express";
import { asyncMiddleware } from "../../server";
import { Utilities } from "../../utilities/utilities";
import { SystemConfiguration } from "../../models/system-vars";
import { IUserModel, User } from "../../models/user";
import { getPostById } from "../post/post";
import { IPost } from "../../models/post";

const router = express.Router();


router.get("/:username/:post", asyncMiddleware(async (req: express.Request, res: express.Response) => {
    const postId: string = req.params.post;
    const sharingUsername: string = req.params.username;

    req.checkParams({
        "username": {
            matches: {
                options: Utilities.stringToRegExp("/" + SystemConfiguration.validations.username.regex + "/"),
                errorMessage: "Invalid sharing username"
            },
            isLength: {
                options: [{
                    min: SystemConfiguration.validations.username.minLength,
                    max: SystemConfiguration.validations.username.maxLength
                }],
                errorMessage: "Invalid sharing username"
            }
        },
        "post": {
            notEmpty: {
                errorMessage: "Missing shared post ID"
            }
        }
    });

    if ( req.requestInvalid() ) {
        return;
    }


    const promises: Array<any> = [
        getPostById(postId),
        User.findOne({username: sharingUsername})
    ];

    const promisesResponse = await Promise.all(promises);

    if ( ! promisesResponse[0] || ! promisesResponse[1] ) {
        res.render(
            "share/not-found",
            {
                title: "Post not found",
                brand: process.env.APP_NAME
            }
        );

        return;
    }

    const post: IPost = promisesResponse[0];
    const sharingUser: IUserModel = promisesResponse[1];

    res.render(
        "share/post",
        {
            title: "@" + post.creator.username,
            brand: process.env.APP_NAME,
            user: sharingUser,
            post: post,
            // postTypes: PostType,
            ta: require("time-ago")
        }
    );
}));


export default router;