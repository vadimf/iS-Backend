/**
 * Module dependencies.
 */
import * as express from "express";
import * as compression from "compression";  // compresses requests
import * as session from "express-session";
import * as bodyParser from "body-parser";
import * as logger from "morgan";
import * as errorHandler from "errorhandler";
import * as lusca from "lusca";
import * as dotenv from "dotenv";
import * as mongo from "connect-mongo";
import * as flash from "express-flash";
import * as path from "path";
import * as mongoose from "mongoose";
import * as passport from "passport";
import expressValidator = require("express-validator");


const MongoStore = mongo(session);

/**
 * Load environment variables from .env file, where API keys and passwords are configured.
 */
dotenv.config({ path: ".env" });

/**
 * API keys and Passport configuration.
 */
// import * as passportConfig from "./config/passport";
import {AppError} from "./models/app-error";

/**
 * Create Express server.
 */
const app = express();

/**
 * Connect to MongoDB.
 */
// mongoose.Promise = global.Promise;

mongoose.connect(process.env.MONGODB_URI || process.env.MONGOLAB_URI);

mongoose.connection.on("error", () => {
  console.log("MongoDB connection error. Please make sure MongoDB is running.");
  process.exit();
});

/**
 * Express configuration.
 */
app.set("port", process.env.PORT || 3000);
app.set("views", path.join(__dirname, "../views"));
app.set("view engine", "pug");
app.use(compression());
app.use(logger("dev"));
app.use(bodyParser.json({limit: "50mb"}));
app.use(bodyParser.urlencoded({
    extended: false
}));
app.use(expressValidator());
app.use(session({
  resave: true,
  saveUninitialized: true,
  secret: process.env.SESSION_SECRET,
  store: new MongoStore({
    url: process.env.MONGODB_URI || process.env.MONGOLAB_URI,
    autoReconnect: true
  })
}));
app.use(passport.initialize());
app.use(passport.session());
app.use(flash());
app.use(lusca.xframe("SAMEORIGIN"));
app.use(lusca.xssProtection(true));
app.use((req, res, next) => {
  res.locals.user = req.user;
  next();
});
app.use((req, res, next) => {
  // After successful login, redirect back to the intended page
  if (!req.user &&
      req.path !== "/login" &&
      req.path !== "/signup" &&
      !req.path.match(/^\/auth/) &&
      !req.path.match(/\./)) {
    req.session.returnTo = req.path;
  } else if (req.user &&
      req.path == "/account") {
    req.session.returnTo = req.path;
  }
  next();
});
app.use(express.static(path.join(__dirname, "public"), { maxAge: 31557600000 }));
app.use(function(req, res, next) {
    res.error = function(e: any, meta?: any) {
        let error: AppError;

        if ( e instanceof AppError ) {
            error = e;
        }
        else {
            error = AppError.ErrorPerformingAction;

            if ( ! meta ) {
                meta = e;
            }
        }

        return res.status(error.statusCode).json({
            errorCode: error.errorCode,
            errorDescription: error.errorDescription,
            meta: meta
        });
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


/**
 * Controllers (route handlers).
 */
import {default as AuthRouter} from "./controllers/auth/auth";
import {default as NotificationsRouter} from "./controllers/notifications/notifications";
import {default as UserRouter} from "./controllers/user/user";

import {default as FeedRouter} from "./controllers/feed/feed";
import {default as SearchRouter} from "./controllers/search/search";
import {default as PostRouter} from "./controllers/post/post";
import {default as CommentRouter} from "./controllers/comment/comment";
import {default as DiscoverRouter} from "./controllers/discover/discover";
import {default as SystemRouter} from "./controllers/system/system";
import {isAuthenticated} from "./config/passport";
import {error} from "util";


/**
 * Primary app routes.
 */
app.use("/v1/auth", AuthRouter);
app.use("/v1/system", SystemRouter);

// Protected requests
// TODO: Add authentication middleware to all of the routes below
app.use("/v1/notifications", NotificationsRouter);
app.use("/v1/user", isAuthenticated, UserRouter);
app.use("/v1/feed", FeedRouter);
app.use("/v1/search", SearchRouter);
app.use("/v1/post", PostRouter);
app.use("/v1/comment", CommentRouter);
app.use("/v1/discover", DiscoverRouter);


/**
 * Error Handler. Provides full stack - remove for production
 */
app.use(errorHandler());

/**
 * Start Express server.
 */
app.listen(app.get("port"), () => {
  console.log(("  App is running at http://localhost:%d in %s mode"), app.get("port"), app.get("env"));
  console.log("  Press CTRL-C to stop\n");
});

module.exports = app;