export const SystemVarsStub = {
    pages: {
        "about": "http://www.globalbit.co.il/",
        "privacy": "http://www.globalbit.co.il/",
        "terms": "http://www.globalbit.co.il/",
        "libraries": "http://www.globalbit.co.il/"
    }
};

const StaticPages = {
    about               : "http://www.globalbit.co.il/",
    privacy             : "http://www.globalbit.co.il/",
    terms               : "http://www.globalbit.co.il/",
    libraries           : "http://www.globalbit.co.il/"
};

const UsernameValidation = {
    minLength           : 4,
    maxLength           : 16,
    regex               : "/^[a-z0-9_.]+$/i"
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

const BioValidation = {
    maxLength           : 250
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
            username: UsernameValidation,
            firstName: FirstNameValidation,
            lastName: LastNameValidation,
            bio: BioValidation
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