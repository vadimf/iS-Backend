import * as express from "express";
import {AppError} from "../models/app-error";
import {User} from "../models/user";

export let isAuthenticated = (req: express.Request, res: express.Response, next: express.NextFunction) => {
    (async () => {
        const authToken: string = req.header("x-authorization");

        if ( authToken ) {
            req.user = await User.findOne({"tokens.authToken": authToken});

            if ( req.user ) {
                next();
                return;
            }
        }

        res.error(AppError.NotAuthenticated);
        return false;
    })();
};