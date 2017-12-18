import * as rp from "request-promise";

const buildUrl = require("build-url");

export class FirebaseDynamicLinkCreator {
    public static async createPostShareLink(postId: string) {
        const webUrl = buildUrl(process.env.API_URL.slice(0, -1), {
            path: "post/" + postId
        });
        const androidPackageName = process.env.ANDROID_PACKAGE_NAME;
        const firebaseDynamicLink = process.env.FIREBASE_DYNAMIC_LINK;

        return FirebaseDynamicLinkCreator._createLink(webUrl.toString(), firebaseDynamicLink, androidPackageName, null, null);
    }

    /**
     * @param {string} websiteUrl
     * @param {string} firebaseDynamicLink
     * @param {string} androidPackageName
     * @param {string} iosBundleId
     * @param {string} iosAppId
     * @returns {Promise<{shortLink: string, previewLink: string}>}
     * @private
     */
    private static async _createLink(websiteUrl: string, firebaseDynamicLink: string, androidPackageName: string, iosBundleId: string, iosAppId: string) {
        const queryParams: any = {
            link: websiteUrl
        };

        if ( androidPackageName ) {
            queryParams.apn = androidPackageName;
        }

        if ( iosBundleId ) {
            queryParams.ibi = iosBundleId;
        }

        if ( iosAppId ) {
            queryParams.isi = iosAppId;
        }

        const longDynamicLink = buildUrl(firebaseDynamicLink, {
            queryParams: queryParams
        });

        const postData = {
            longDynamicLink: longDynamicLink.toString()
        };

        const options = {
            method: "POST",
            uri: "https://firebasedynamiclinks.googleapis.com/v1/shortLinks?key=" + process.env.FIREBASE_WEB_API_KEY,
            body: postData,
            json: true
        };

        return await rp(options);
    }
}