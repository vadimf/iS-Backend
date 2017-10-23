export const SystemVarsStub = {
    pages: {
        "about": "http://www.globalbit.co.il/",
        "privacy": "http://www.globalbit.co.il/",
        "terms": "http://www.globalbit.co.il/",
        "libraries": "http://www.globalbit.co.il/"
    }
};

class StaticPagesUrl {
    about               = "http://www.globalbit.co.il/";
    privacy             = "http://www.globalbit.co.il/";
    terms               = "http://www.globalbit.co.il/";
    libraries           = "http://www.globalbit.co.il/";
}

export class SystemConfiguration {
    private static _pages = new StaticPagesUrl();
    private static _confirmationCodeLength = 5;

    static get pages(): StaticPagesUrl {
        return this._pages;
    }

    static get confirmationCodeLength(): number {
        return this._confirmationCodeLength;
    }

    static toJson() {
        return {
            pages: SystemConfiguration.pages,
            confirmationCodeLength: SystemConfiguration.confirmationCodeLength
        };
    }
}