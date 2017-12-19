import * as express         from "express";
import * as bodyParser      from "body-parser";
import * as logger          from "morgan";
import * as lusca           from "lusca";
import * as dotenv          from "dotenv";
import * as compression     from "compression";
import * as path            from "path";
import * as mongoose        from "mongoose";
import * as helmet          from "helmet";
import * as bluebird        from "bluebird";
import expressValidator     = require("express-validator");

/**
 * Load environment variables from .env file, where API keys and passwords are configured.
 */
dotenv.config({ path: ".env" });

/**
 * API keys and Passport configuration.
 */
import { AppError } from "./models/app-error";

/**
 * Create Express server.
 */
const app = express();

/**
 * Connect to MongoDB.
 */
const mongoDbUri = (process.env.MONGODB_URI || process.env.MONGOLAB_URI);

mongoose.connect(
    mongoDbUri,
    {
        useMongoClient: true,
        promiseLibrary: bluebird
    },
    (err: any) => {
        if ( err ) {
            console.log("MongoDB connection error. Please make sure MongoDB is running.", mongoDbUri);
            process.exit();
        }
    }
);

/**
 * Express configuration.
 */
app.set("port", process.env.PORT || 3000);
app.set("env", process.env.ENV || "development");
app.set("views", path.join(__dirname, "../views"));
app.set("view engine", "pug");
app.use(helmet());
app.use(compression());
app.use(logger("dev"));
app.use(bodyParser.json({limit: "50mb"}));
app.use(bodyParser.urlencoded({
    extended: false
}));
app.use((req: express.Request, res: express.Response, next: express.NextFunction) => {
    if ( req.method === "POST" && req.body._method ) {
        req.method = req.body._method;
    }

    next();
});
app.use(expressValidator({
    customValidators: {
        inEnum: (input: string|number, options: any) => {
            return input in options;
        },
        between: (input: number, options: {min: number, max: number}) => {
            return input >= options.min && input <= options.max;
        }
    }
}));

app.use(lusca.xframe("SAMEORIGIN"));
app.use(lusca.xssProtection(true));
app.use((req, res, next) => {
    res.locals.user = req.user;
    next();
});

app.use(function(req, res, next) {
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS, PUT, PATCH, DELETE");
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, X-Authorization");
    next();
});

app.use(express.static(path.join(__dirname, "public"), { maxAge: 31557600000 }));
app.use(function(req, res, next) {
    res.error = function(e: any, meta?: any) {
        if ( req.method !== "OPTIONS" ) {
            const contentType = req.header("content-type");

            const jsonResponse = contentType && contentType.indexOf("application/json") >= 0;

            let error: AppError;
            let message: string = "";

            if (e instanceof AppError) {
                error = e;
                message = e.errorDescription;

                console.log("System error", e);
            }
            else {
                error = AppError.ErrorPerformingAction;

                message = e.message ? e.message : "General error";

                if (!meta) {
                    meta = e;

                    console.log("System exception", e);
                }
            }

            if (jsonResponse) {
                return res.status(error.statusCode).json({
                    errorCode: error.errorCode,
                    errorDescription: error.errorDescription,
                    meta: !isNullOrUndefined(meta) && !isNullOrUndefined(meta.message) ? {
                        "exceptionMessage": meta.message
                    } : meta
                });
            }
            else {
                return res.render("fatal", {
                    brand: process.env.APP_NAME,
                    title: "Error",
                    message: message
                });
            }
        }
        else {
            this.response();
        }
    };

    res.response = function(data?: any) {
        return res.status(200).json(Object.assign({
            errorCode: AppError.Success.errorCode,
            errorDescription: AppError.Success.errorDescription,
        }, data));
    };

    req.requestInvalid = function(): boolean {
        const errors = req.validationErrors();

        if ( ! errors ) {
            return false;
        }

        res.error(AppError.RequestValidation, {fields: errors});
        return true;
    };

    next();
});

export const asyncMiddleware = (fn: (req: any, res: any, next: any) => Promise<any>) =>
    (req: express.Request, res: express.Response, next: express.NextFunction) => {
        Promise.resolve(fn(req, res, next))
            .catch(next);
    };


// Controllers (route handlers)
import {default as AuthRouter } from "./controllers/auth/auth";
import {default as NotificationsRouter } from "./controllers/notifications/notifications";
import {default as UserRouter } from "./controllers/user/user";

import {default as FeedRouter } from "./controllers/feed/feed";
import {default as SearchRouter } from "./controllers/search/search";
import {default as PostRouter } from "./controllers/post/post";
import {default as CommentRouter } from "./controllers/comment/comment";
import {default as DiscoverRouter } from "./controllers/discover/discover";
import {default as SystemRouter } from "./controllers/system/system";
import { isAuthenticated } from "./config/passport";
import { isNullOrUndefined } from "util";
import {default as AdminRouter } from "./controllers/admin/admin";

// Primary app routes.
app.use("/v1/auth", AuthRouter);
app.use("/v1/system", SystemRouter);

app.use("/v1/admin", AdminRouter);

// Protected requests
app.use("/v1/user",                 isAuthenticated,        UserRouter);
app.use("/v1/notifications",        isAuthenticated,        NotificationsRouter);
app.use("/v1/feed",                 isAuthenticated,        FeedRouter);
app.use("/v1/search",               isAuthenticated,      SearchRouter);
app.use("/v1/post",                 isAuthenticated,        PostRouter);
app.use("/v1/comment",              isAuthenticated,        CommentRouter);
app.use("/v1/discover",             isAuthenticated,        DiscoverRouter);


app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    if ( err ) {
        res.error(err);
    }
});

// Error Handler. Provides full stack - remove for production
// app.use(errorHandler());

// Start Express server.
app.listen(app.get("port"), () => {
    console.log(("  App is running at http://localhost:%d in %s mode"), app.get("port"), app.get("env"));
    console.log("  Press CTRL-C to stop\n");
});

module.exports = app;