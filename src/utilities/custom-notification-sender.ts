import { NotificationSender } from "./notification-sender";
import { IUserModel } from "../models/user";
import { IPost } from "../models/post";

export class CustomNotificationSender extends NotificationSender {
    constructor(users: IUserModel|IUserModel[]) {
        let tokens: string[] = [];
        if ( users.constructor === Array ) {
            users = <Array<IUserModel>>users;

            for ( const user of users ) {
                tokens = tokens.concat(
                    CustomNotificationSender._getTokensFromUser(user)
                );
            }

            super(tokens);
            // this._users = users;
        }
        else {
            const user = <IUserModel>users;
            // this._users = [user];
            super(CustomNotificationSender._getTokensFromUser(user));
        }

        this.title(process.env.APP_NAME);
    }

    private static _getTokensFromUser(user: IUserModel): string[] {
        const tokens: string[] = [];

        for ( const userToken of user.tokens ) {
            if ( userToken.firebaseToken ) {
                tokens.push(userToken.firebaseToken);
            }
        }

        return tokens;
    }

    follow(byUser: IUserModel) {
        return this
            .type(NotificationType.Follow)
            .message("@" + byUser.username + " started following you")
            .additionalPayload({
                username: byUser.username
            });
    }

    comment(byUser: IUserModel, comment: IPost) {
        return this
            .type(NotificationType.Comment)
            .message("@" + byUser.username + " replied to your video")
            .additionalPayload({
                commentId: comment._id.toString(),
                postId: (<IPost>comment.parent)._id.toString()
            });
    }

    mention(byUser: IUserModel, comment: IPost) {
        return this
            .type(NotificationType.Mention)
            .message("@" + byUser.username + " mentioned you in a comment")
            .additionalPayload({
                commentId: comment._id.toString(),
                postId: (<IPost>comment.parent)._id.toString()
            });
    }

    fromCms(title = "", message: string) {
        this._sentFromCms = true;

        return this
            .type(NotificationType.General)
            .title(title)
            .message(message);
    }
}

export enum NotificationType {
    General = 0,
    Follow = 1,
    Comment = 2,
    Mention = 3,
    Share = 4
}