import fs = require("fs");
import {Utilities} from "../../utilities/utilities";
import sharp = require("sharp");
import * as request from "request";

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

    private _createDirectoryIfDoesNotExists(directory: string) {
        return new Promise(((resolve, reject) => {
            fs.exists(directory, (exists => {
                if ( exists ) {
                    resolve();
                }
                else {
                    fs.mkdir(directory, (err) => {
                        if ( err ) {
                            reject(err);
                        }
                        else {
                            resolve();
                        }
                    });
                }
            }));
        }));
    }

    async uploadUserProfilePicture() {
        if ( ! this._buffer && this._url ) {
            await this._urlToBuffer();
        }

        if ( ! this._buffer ) {
            throw new Error("No buffer to upload image");
        }

        const uploadsPath = process.env.UPLOADS_PATH + "/" + this._userId;
        const uploadsUrl = process.env.UPLOADS_URL + "/" + this._userId;

        await this._createDirectoryIfDoesNotExists(process.env.UPLOADS_PATH);
        await this._createDirectoryIfDoesNotExists(uploadsPath);

        const fileName = Utilities.randomString(32);
        const thumbnailFileName = fileName + ".thumb";
        const fileExtension = ".png";

        const filePath = uploadsPath + "/" + fileName + fileExtension;
        const thumbnailFilePath = uploadsPath + "/" + thumbnailFileName + fileExtension;

        const fileUrl = uploadsUrl + "/" + fileName + fileExtension;
        const thumbnailFileUrl = uploadsUrl + "/" + thumbnailFileName + fileExtension;

        const thumbnailCreationPromise = sharp(this._buffer)
            .resize(200, 200)
            .toFile(thumbnailFilePath);

        const imageSavingPromise = sharp(this._buffer)
            .toFile(filePath);

        await Promise.all([thumbnailCreationPromise, imageSavingPromise]);

        return {
            picture: {
                url: fileUrl,
                path: filePath,
            },
            thumbnail: {
                url: thumbnailFileUrl,
                path: thumbnailFilePath
            }
        };
    }
}