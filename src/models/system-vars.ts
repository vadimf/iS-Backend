const legalPagesLinkPrefix = process.env.BASE_URL + "legal/";

const StaticPages = {
    about               : legalPagesLinkPrefix + "about",
    privacy             : legalPagesLinkPrefix + "privacy",
    terms               : legalPagesLinkPrefix + "terms",
    libraries           : "http://globalbit.co.il/legal/libs/",
    postShare           : process.env.API_URL + "share/:post"
};

const UsernameValidation = {
    minLength           : 4,
    maxLength           : 16,
    regex               : "^[a-z0-9_.]+$"
};

const FirstNameValidation = {
    minLength           : 2,
    maxLength           : 16,
    regex               : "/\\b[^\\d\\W]+\\b/"
};

const LastNameValidation = {
    minLength           : 0,
    maxLength           : 16,
    regex               : "/\\b[^\\d\\W]+\\b/"
};

const PostTextValidation = {
    minLength           : 0,
    maxLength           : 255
};

const BioValidation = {
    minLength           : 0,
    maxLength           : 255
};

const PasswordValidation = {
    minLength           : 6,
    maxLength           : 24
};

const CommentTextValidation = {
    minLength           : 0,
    maxLength           : 255
};

export class SystemConfiguration {
    static get pages() {
        return StaticPages;
    }

    static get confirmationCodeLength(): number {
        return 5;
    }

    static get validations() {
        return {
            password: PasswordValidation,
            username: UsernameValidation,
            firstName: FirstNameValidation,
            lastName: LastNameValidation,
            bio: BioValidation,
            postText: PostTextValidation,
            commentText: CommentTextValidation
        };
    }

    static toJson() {
        return {
            pages: SystemConfiguration.pages,
            confirmationCodeLength: SystemConfiguration.confirmationCodeLength,
            validations: SystemConfiguration.validations
        };
    }
}