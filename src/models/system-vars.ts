const StaticPages = {
    about               : "http://www.globalbit.co.il/",
    privacy             : "http://www.globalbit.co.il/",
    terms               : "http://www.globalbit.co.il/",
    libraries           : "http://www.globalbit.co.il/"
};

const UsernameValidation = {
    minLength           : 4,
    maxLength           : 16,
    regex               : "^[a-z0-9_.]+$"
};

const FirstNameValidation = {
    minLength           : 4,
    maxLength           : 16,
    regex               : "/\\b[^\\d\\W]+\\b/"
};

const LastNameValidation = {
    minLength           : 4,
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
    minLength           : 1,
    maxLength           : 999
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