import fs = require("fs");
import {Utilities} from "../../utilities/utilities";
import sharp = require("sharp");
import * as request from "request";
import {StorageManager, MimeType} from "../../utilities/storage-manager";

export class UploadProfilePicture {
    private _buffer: Buffer;
    private _url: string;

    constructor(private _userId: string) {}

    base64(base64: string) {
        this._buffer = new Buffer(base64, "base64");
        return this;
    }

    url(url: string) {
        this._url = url;
        return this;
    }

    private async _urlToBuffer() {
        const that = this;
        return new Promise((resolve, reject) => {
            request({url: this._url, encoding: null}, function (error, response, body) {
                if ( error ) {
                    reject(error);
                }
                else {
                    that._buffer = body;
                    resolve();
                }
            });
        });
    }

    async uploadUserProfilePicture() {
        if ( ! this._buffer && this._url ) {
            await this._urlToBuffer();
        }

        if ( ! this._buffer ) {
            throw new Error("No buffer to upload image");
        }

        const storageManager = new StorageManager();
        const fileName = Utilities.randomString(24);
        const thumbnailFileName = fileName + ".thumb";

        const thumbnailCreationBuffer = await sharp(this._buffer)
            .resize(200, 200)
            .toBuffer();

        const allowedMimeTypes = [
            MimeType.IMAGE_JPEG,
            MimeType.IMAGE_PNG
        ];

        const profileImageUploadingPromise = storageManager
            .directory(this._userId)
            .fileName(fileName)
            .fromBuffer(
                this._buffer,
                {
                    allowedMimeTypes: allowedMimeTypes
                }
            );

        const thumbnailUploadingPromise = storageManager
            .directory(this._userId)
            .fileName(thumbnailFileName)
            .fromBuffer(
                thumbnailCreationBuffer,
                {
                    allowedMimeTypes: allowedMimeTypes
                }
            );

        const promisesResponse = await Promise.all([profileImageUploadingPromise, thumbnailUploadingPromise]);

        return {
            picture: promisesResponse[0].url,
            thumbnail: promisesResponse[1].url
        };
    }
}