export class Utilities {
    static randomString(length: number = 64, allowedCharacters: string = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789_:-"): string {
        let text = "";

        for (let i = 0; i < length; i++) {
            text += allowedCharacters.charAt(Math.floor(Math.random() * allowedCharacters.length));
        }

        return text;
    }

    static randomStringArguments(length: number = 64, includeLowercase: boolean = true, includeUppercase: boolean = true, includeDashes: boolean = false, includeSpecialCharacters: boolean = false): string {
        var allowedCharacters = "0123456789";

        if ( includeLowercase ) {
            allowedCharacters += "abcdefghijklmnopqrstuvwxyz";
        }

        if ( includeUppercase ) {
            allowedCharacters += "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
        }

        if ( includeDashes ) {
            allowedCharacters += "-_";
        }

        if ( includeSpecialCharacters ) {
            allowedCharacters += "!@#$%^&*()+=";
        }

        return Utilities.randomString(length, allowedCharacters);
    }

    static stringToRegExp(str: string): RegExp {
        const flags = str.replace(/.*\/([gimy]*)$/, "$1");
        const pattern = str.replace(new RegExp("^/(.*?)/" + flags + "$"), "$1");

        return new RegExp(pattern, flags);
    }

    private static _currentDate: Date;
    static currentDate(): Date {
        if ( ! Utilities._currentDate ) {
            Utilities._currentDate = new Date;
        }

        return Utilities._currentDate;
    }

    private static _emailRegex = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    static emailValid(email: string): boolean {
        return Utilities._emailRegex.test(email);
    }
}