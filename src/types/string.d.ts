// tslint:disable-next-line:interface-name
declare interface String {
    emailRegex: RegExp;
    isEmail: () => boolean;
    toRegex: () => RegExp;
    searchToRegex: (start?: boolean, end?: boolean) => RegExp;
    padStart: (padWith: string, length: number) => string;
    padEnd: (padWith: string, length: number) => string;
    parseJson: () => any;
    isMongoId: () => boolean;
    encodeHtml: () => string;
    decodeHtml: () => string;
}
