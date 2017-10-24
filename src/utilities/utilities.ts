export class Utilities {
    static randomString(length: number = 64, allowedCharacters: string = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789_:-"): string {
        let text = "";

        for (let i = 0; i < length; i++) {
            text += allowedCharacters.charAt(Math.floor(Math.random() * allowedCharacters.length));
        }

        return text;
    }

    static stringToRegExp(str: string): RegExp {
        const flags = str.replace(/.*\/([gimy]*)$/, "$1");
        const pattern = str.replace(new RegExp("^/(.*?)/" + flags + "$"), "$1");

        return new RegExp(pattern, flags);
    }
}