import * as express from "express";
import {AppError} from "../models/app-error";
import {IAuthToken, User} from "../models/user";
import * as _ from "underscore";

export let isAuthenticated = (req: express.Request, res: express.Response, next: express.NextFunction) => {
    (async () => {
        const authToken: string = req.header("x-authorization");

        if ( authToken ) {
            req.user = await User.findOne({"tokens.authToken": authToken});

            if ( req.user ) {
                const filteredTokens = _.filter(
                    req.user.tokens,
                    (token: IAuthToken) => {
                        return token.authToken === authToken;
                    }
                );

                req.authToken = filteredTokens[0];

                next();
                return;
            }
        }

        res.error(AppError.NotAuthenticated);
        return false;
    })();
};