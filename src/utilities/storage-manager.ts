import { Utilities } from "./utilities";
import * as FileType from "file-type";
import * as Stream from "stream";
import { firebaseClient } from "./firebase-client";
import { Bucket } from "google-cloud__storage";

export class StorageManager {
    private static _bucket: Bucket;
    private _fileName: string;
    private _directory: string;

    private static _initializeBucket() {
        StorageManager._bucket = firebaseClient().storage().bucket(StorageManager._getBucketName());
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

    directory(directory: string) {
        this._directory = directory;
        return this;
    }

    fileName(fileName: string) {
        this._fileName = fileName;
        return this;
    }

    /**
     * Upload file from buffer
     *
     * @param {Buffer} buffer
     * @param options
     * @returns {Promise<{url: string}>}
     */
    fromBuffer(buffer: Buffer, options?: {allowedMimeTypes?: string[], knownData?: {ext: string, mime: string}}): Promise<{url: string}> {
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

            let fileType: {ext: string, mime: string};
            if ( options.knownData && options.knownData.ext && options.knownData.mime ) {
                fileType = options.knownData;
            }
            else {
                fileType = FileType(buffer);
            }

            if ( ! fileType ) {
                return reject({
                    uploadingError: "Unable to retrieve mime-type from file (expected: " + options.allowedMimeTypes.join(", ") + ")"
                });
            }

            if ( options.allowedMimeTypes && ! (options.allowedMimeTypes.indexOf(fileType.mime.toString()) > -1) ) {
                return reject({
                    uploadingError: "File type '" + fileType.mime.toString() + "' isn't allowed. (Allowed types" + options.allowedMimeTypes.join(", ") + ")"
                });
            }

            const fileName = that._fileName + "." + fileType.ext;
            const fullFileName = (this._directory ? this._directory + "/" : "") + fileName;
            const bucketFile = StorageManager.getBucketFile(fullFileName);

            const stream = StorageManager.getWritableStream(
                fullFileName,
                fileType.mime
            );

            stream
                .on("error", (e: any) => {
                    return reject({
                        uploadingError: "Unable to upload to firebase storage",
                        error: e
                    });
                })
                .on("finish", async () => {
                    await bucketFile.makePublic();
                    const url = StorageManager.getPublicUrl(fullFileName);
                    console.log("Finished uploading file to:", url);
                    return resolve({
                        url: url
                    });
                })
                .end(buffer);
        });
    }

    static getBucketFile(fullFileName: string) {
        return StorageManager.bucket.file(fullFileName);
    }

    static getWritableStream(fullFileName: string, mime: string) {
        return StorageManager.getBucketFile(fullFileName)
            .createWriteStream({
                metadata: {
                    contentType: mime
                }
            });
    }

    // public getBucketFile(options: {ext: string, mime: string}) {
    //     if ( ! this._fileName ) {
    //         this.fileName(Utilities.randomString(24));
    //     }
    //
    //     const fileName = this._fileName + "." + options.ext;
    //     const fullFileName = (this._directory ? this._directory + "/" : "") + fileName;
    //     return StorageManager.bucket.file(fullFileName);
    // }

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
            const fullFileName = (this._directory ? this._directory + "/" : "") + fileName;
            const bucketFile = StorageManager.bucket.file(fullFileName);
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
                    const url = StorageManager.getPublicUrl(fullFileName);
                    console.log("Finished uploading file to:", url);
                    return resolve({
                        url: url
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