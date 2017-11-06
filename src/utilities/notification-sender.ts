import * as admin from "firebase-admin";
import {NotificationLog} from "../models/notification-logs";
import * as fs from "fs";

export class NotificationSender {
    private static _initialized = false;
    protected _tokens: string[];
    protected _title: string = "";
    protected _type: number = 0;
    protected _message: string = "";
    protected _payload: any = {};

    constructor(tokens: string|string[]) {
        if ( ! NotificationSender._initialized ) {
            fs.readFile(__dirname + "/../../firebase.pem", "utf8", (err, data) => {
                if ( ! err ) {
                    admin.initializeApp({
                        credential: admin.credential.cert({
                            projectId: process.env.FIREBASE_PROJECT_ID,
                            privateKey: data,
                            clientEmail: process.env.FIREBASE_CLIENT_EMAIL
                        }),
                        databaseURL: process.env.FIREBASE_DATABASE_URL
                    });

                    NotificationSender._initialized = true;
                }
                else {
                    throw new Error("Unable to read firebase.pem file from " + __dirname + "/../../firebase.pem");
                }
            });
        }

        this._tokens = tokens instanceof Array ? tokens : [tokens];
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

            admin
                .messaging()
                .sendToDevice(that._tokens, payload)
                .then(async (response) => {
                    notificationLog.success = response;
                    resolve(response);

                    await notificationLog.save();
                })
                .catch(async (error) => {
                    notificationLog.error = error;
                    reject(error);

                    await notificationLog.save();
                });
        });
    }
}