export class Utilities {
    static randomString(length: number = 64, allowedCharacters: string = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789_:-"): string {
        let text = "";

        for (let i = 0; i < length; i++) {
            text += allowedCharacters.charAt(Math.floor(Math.random() * allowedCharacters.length));
        }

        return text;
    }
}