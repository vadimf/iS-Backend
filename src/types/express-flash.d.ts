
/// <reference types="express" />

// Add RequestValidation Interface on to Express's Request Interface.
declare namespace Express {
    interface Request extends Flash {
        performValidation(): boolean;
    }
    interface Response {
        error?: any;
        response?: any;
    }
}

interface Flash {
    flash(type: string, message: any): void;
}

declare module 'express-flash';

