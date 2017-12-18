import { NotificationLog } from "../models/notification-logs";
import { firebaseClient } from "./firebase-client";
import { User } from "../models/user";

export class NotificationSender {
    protected _tokens: string[];
    protected _title: string = "";
    protected _type: number = 0;
    protected _message: string = "";
    protected _payload: any = {};
    protected _sentFromCms = false;

    constructor(tokens: string|string[]) {
        this._tokens = tokens instanceof Array ? tokens : [...new Set(tokens)];
    }

    title(title: string) {
        this._title = title;
        return this;
    }

    type(type: number) {
        this._type = type;
        return this;
    }

    message(text: string) {
        this._message = text;
        return this;
    }

    additionalPayload(payload: any) {
        this._payload = Object.assign(this._payload, payload);
        return this;
    }

    private _wrappedPayload() {
        return {
            data: Object.assign(
                {
                    title: this._title,
                    message: this._message,
                    type: "" + this._type
                },
                this._payload
            )
        };
    }

    /**
     * @returns Promise<any> | Promise
     */
    send() {
        const that = this;

        return new Promise((resolve, reject) => {
            if ( ! this._tokens ) {
                return reject("No tokens");
            }

            const payload = that._wrappedPayload();

            const notificationLog = new NotificationLog;
            notificationLog.tokens = this._tokens;
            notificationLog.payload = payload;
            notificationLog.sentByAdministrator = this._sentFromCms;

            firebaseClient()
                .messaging()
                .sendToDevice(that._tokens, payload)
                .then(async (response) => {
                    notificationLog.success = response;
                    resolve(response);

                    const promisesList: Array<any> = [
                        notificationLog.save()
                    ];

                    if ( response.results ) {
                        const removeTokens: string[] = [];
                        const resultsWithIndexes = response.results.map((result, index) => ({ result, index }));

                        for ( const {result, index} of resultsWithIndexes ) {
                            if ( result.error && result.error.code === "messaging/registration-token-not-registered" ) {
                                removeTokens.push(this._tokens[index]);
                            }
                        }

                        if ( removeTokens.length > 0 ) {
                            const conditions = {
                                "tokens.firebaseToken": { $in: removeTokens }
                            };

                            const update = {
                                "$set": {
                                    "tokens.$.firebaseToken": ""
                                }
                            };

                            const options = {
                                multi: true
                            };

                            promisesList.push(User.update(conditions, update, options));
                        }
                    }

                    await Promise.all(promisesList);
                })
                .catch(async (error) => {
                    notificationLog.error = error;
                    reject(error);

                    await notificationLog.save();
                });
        });
    }
}