import * as he from "he";

export class Utilities {
    static randomString(length: number = 64, allowedCharacters: string = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789_:-"): string {
        let text = "";

        for (let i = 0; i < length; i++) {
            text += allowedCharacters.charAt(Math.floor(Math.random() * allowedCharacters.length));
        }

        return text;
    }

    static randomStringArguments(length: number = 64, includeLowercase: boolean = true, includeUppercase: boolean = true, includeDashes: boolean = false, includeSpecialCharacters: boolean = false): string {
        let allowedCharacters = "0123456789";

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

    private static _emailRegex = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    static emailValid(email: string): boolean {
        return Utilities._emailRegex.test(email);
    }
}

/**
 * Retrieve an object from hash-map, by it's recursive key (given by string, formatted with square brackets or dots
 *
 * @param o
 * @param {string} s
 * @returns {any}
 */
Object.byString = (o: any, s: string) => {
    s = s.replace(/\[(\w+)]/g, ".$1"); // convert indexes to properties
    s = s.replace(/^\./, "");           // strip a leading dot
    const a = s.split(".");
    for (let i = 0, n = a.length; i < n; ++i) {
        const k = a[i];
        if (k in o) {
            o = o[k];
        } else {
            return;
        }
    }
    return o;
};

/**
 * Round a number into a price format (two decimal points)
 *
 * @returns {number}
 */
Number.prototype.roundPrice = function(): number {
    return +this.toFixed(2);
};

/**
 * Check if a number is between two numbers (including the numbers themselves)
 * @param {number} from
 * @param {number} to
 * @returns {boolean}
 */
Number.prototype.between = function(from: number, to: number): boolean {
    return this >= from && this <= to;
};

/**
 * Adding percents to a number
 * @param {number} percent
 * @returns {number}
 */
Number.prototype.addPercent = function(percent: number): number {
    if ( ! this ) {
        return 0;
    }

    if ( percent <= 0 ) {
        return this;
    }

    return this * (1 + (percent / 100));
};

/**
 * Remove an item from an array
 *
 * @param item
 * @returns {number} New array length
 */
Array.prototype.removeItem = function(item: any): number {
    const index = this.indexOf(item);

    if ( index !== -1 ) {
        this.splice(index, 1);
    }

    return this.length;
};

/**
 * Map & convert an array of strings to an array of numbers
 *
 * @returns {number[]}
 */
Array.prototype.convertStringToNumber = function(): number[] {
    if ( ! this.isOfType("string") ) {
        return null;
    }

    return this.map((val: any) => Number(val));
};

/**
 * Check if an item exists inside the array
 *
 * @param item
 * @returns {boolean} Exists in array
 */
Array.prototype.itemExists = function(item: any): boolean {
    return this.indexOf(item) !== -1;
};

/**
 * Check if an item exists inside the array (alias)
 *
 * @param item
 * @returns {boolean} Exists in array
 */
Array.prototype.hasItem = function(item: any): boolean {
    return this.itemExists(item);
};

/**
 * Returns only unique values of a given array
 *
 * @returns {Array<any>} Exists in array
 */
Array.prototype.unique = function(): any[] {
    return this.filter((v: any, i: any, a: any[]) => a.indexOf(v) === i);
};

/**
 * Check whether the array consists of a given type of objects
 *
 * @param {string} type
 * @returns {boolean}
 */
Array.prototype.isOfType = function(type: string): boolean {
    type = type.toLowerCase();

    let typeCorrect = false;

    this.forEach((item: any) => {
        if ( ! typeCorrect && (typeof item).toLowerCase() === type ) {
            typeCorrect = true;
            return;
        }
    });

    return typeCorrect;
};

/**
 * Remove an remove by it's index
 *
 * @param {string} index
 * @returns {number}
 */
Array.prototype.removeByIndex = function(index: number): number {
    delete this[index];
    this.clean();

    return this.length;
};

/**
 * Clean the array from undefined or empty items
 *
 * @returns {Array<any>}
 */
Array.prototype.clean = function() {
    for ( let i = 0; i < this.length; i++ ) {
        if ( this[i] === undefined ) {
            this.splice(i, 1);
            i--;
        }
    }

    return this;
};

/**
 * Email validation regex
 * @type {RegExp}
 */
String.prototype.emailRegex = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;

/**
 * Check if current string is email.
 *
 * @returns {boolean}
 */
String.prototype.isEmail = function(): boolean {
    return this.emailRegex.test(this);
};

/**
 * Convert a string into a regular expression object
 *
 * @returns {RegExp}
 */
String.prototype.toRegex = function(): RegExp {
    const flags = this.replace(/.*\/([gimy]*)$/, "$1");
    const pattern = this.replace(new RegExp("^/(.*?)/" + flags + "$"), "$1");

    return new RegExp(pattern, flags);
};

/**
 * Create search regex prepared for querying
 *
 * @returns {RegExp}
 */
String.prototype.searchToRegex = function(start = true, end = true): RegExp {
    const searchString = this.replace(/[&\/\\#,+()$~%.'":*?<>{}]/g, "");
    return ("/" + (start ? ".*" : "") + searchString + (end ? ".*" : "") + "/i").toRegex();
};

/**
 * Add characters to the beginning of the string
 *
 * @param {string} padWith
 * @param {number} length
 * @returns {String}
 */
String.prototype.padStart = function(padWith: string, length: number): string {
    let str = this;
    while (str.length < length) { str = padWith + str; }
    return str;
};

/**
 * Add characters to the end of the string
 *
 * @param {string} padWith
 * @param {number} length
 * @returns {String}
 */
String.prototype.padEnd = function(padWith: string, length: number): string {
    let str = this;
    while (str.length < length) { str = str + padWith; }
    return str;
};

/**
 * Parse a JSON string into an object
 *
 * @returns {any}
 */
String.prototype.parseJson = function(): any {
    return JSON.parse(this);
};

/**
 * Check if a string is a valid mongo ID
 *
 * @returns {boolean}
 */
String.prototype.isMongoId = function(): boolean {
    const matches = this.match(/^[0-9a-fA-F]{24}$/);
    return !!matches;
};

/**
 * Decode a string that contains HTML
 *
 * @returns {boolean}
 */
String.prototype.decodeHtml = function(): string {
    return he.decode(this);
};

/**
 * Encode a string that contains HTML
 *
 * @returns {boolean}
 */
String.prototype.encodeHtml = function(): string {
    return he.encode(this);
};

/**
 * Get age (years passed) by date
 *
 * @returns {number}
 */
Date.prototype.getAge = function(): number {
    const timeDiff = Math.abs(Date.now() - this.getTime());
    return Math.floor((timeDiff / (1000 * 3600 * 24)) / 365.25);
};

/**
 * Convert a map into an array of objects (without indexes)
 *
 * @returns {any[]}
 */
Map.prototype.toArray = function(): any[] {
    return Array.from(this).map((item: [any, any]) => {
        return item[1] || undefined;
    });
};
