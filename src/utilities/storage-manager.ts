import * as admin from "firebase-admin";
import {Bucket} from "../../node_modules/firebase-admin/node_modules/@types/google-cloud__storage/index";
import {Utilities} from "./utilities";
import * as FileType from "file-type";
import * as Stream from "stream";

export class StorageManager {
    private static _bucket: Bucket;
    private _fileName: string;

    private static _initializeBucket() {
        admin.initializeApp({
            credential: admin.credential.cert({
                projectId: process.env.FIREBASE_PROJECT_ID,
                privateKey: process.env.FIREBASE_PRIVATE_KEY,
                clientEmail: process.env.FIREBASE_CLIENT_EMAIL
            }),
            databaseURL: process.env.FIREBASE_DATABASE_URL
        });

        StorageManager._bucket = admin.storage().bucket(StorageManager._getBucketName());
    }

    static get bucket(): Bucket {
        if ( ! StorageManager._bucket ) {
            StorageManager._initializeBucket();
        }

        return this._bucket;
    }

    private static _getBucketName() {
        return process.env.FIREBASE_PROJECT_ID + ".appspot.com";
    }

    fileName(fileName: string) {
        this._fileName = fileName;
        return this;
    }

    /**
     * Upload file from buffer
     *
     * @param {Buffer} buffer
     * @param {Array<string>} allowedMimeTypes
     * @returns {Promise<{url: string}>}
     */
    fromBuffer(buffer: Buffer, allowedMimeTypes: Array<string>): Promise<{url: string}> {
        const that = this;

        return new Promise((resolve, reject) => {
            if ( ! that._fileName ) {
                that.fileName(Utilities.randomString(24));
            }

            if ( ! buffer ) {
                return reject({
                    uploadingError: "No buffer to upload"
                });
            }

            const fileType = FileType(buffer);

            if ( ! (allowedMimeTypes.indexOf(fileType.mime.toString()) > -1) ) {
                return reject({
                    uploadingError: "Extension '" + fileType.ext + "' isn't allowed"
                });
            }

            const fileName = that._fileName + "." + fileType.ext;
            const bucketFile = StorageManager.bucket.file(fileName);
            const stream = bucketFile
                .createWriteStream({
                    metadata: {
                        contentType: fileType.mime
                    }
                });

            stream
                .on("error", () => {
                    return reject({
                        uploadingError: "Unable to upload to firebase storage"
                    });
                })
                .on("finish", async () => {
                    await bucketFile.makePublic();
                    return resolve({
                        url: StorageManager.getPublicUrl(fileName)
                    });
                })
                .end(buffer);
        });
    }

    /**
     *
     * @param {"stream".internal} stream
     * @param options
     */
    fromStream(stream: Stream, options: {ext: string, mime: string}): Promise<{url: string}> {
        const that = this;

        return new Promise((resolve, reject) => {
            if ( ! that._fileName ) {
                that.fileName(Utilities.randomString(24));
            }

            const fileName = that._fileName + "." + options.ext;
            const bucketFile = StorageManager.bucket.file(fileName);
            const bucketStream = bucketFile
                .createWriteStream({
                    metadata: {
                        contentType: options.mime
                    }
                });

            bucketStream
                .on("error", () => {
                    return reject({
                        uploadingError: "Unable to upload to firebase storage"
                    });
                })
                .on("finish", async () => {
                    await bucketFile.makePublic();
                    return resolve({
                        url: StorageManager.getPublicUrl(fileName)
                    });
                });

            stream.pipe(bucketStream);
        });
    }

    static getPublicUrl(fileName: string): string {
        return "https://storage.googleapis.com/" + StorageManager._getBucketName() + "/" + fileName;
    }

    static getFilenameFromPublicUrl(publicUrl: string): string {
        return publicUrl.replace("https://storage.googleapis.com/" + StorageManager._getBucketName() + "/", "");
    }

    static removeFile(fileUrl: string) {
        return StorageManager.bucket.file(StorageManager.getFilenameFromPublicUrl(fileUrl)).delete();
    }
}

export class MimeType {
    static VIDEO_MP4 = "video/mp4";
    static IMAGE_GIF = "image/gif";
    static IMAGE_PNG = "image/png";
    static IMAGE_JPEG = "image/jpeg";
}

export interface IFile {
    mimetype: string;
    buffer: Buffer;
    size: number;
}