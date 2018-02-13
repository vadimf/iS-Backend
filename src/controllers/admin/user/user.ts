import * as express from "express";
import { asyncMiddleware } from "../../../server";
import { Pagination } from "../../../models/pagination";
import {IUserModel, User, usersToAdministratorsArray} from "../../../models/user";
import { getUserByUsername } from "../../user/foreign-user-router";
import { Utilities } from "../../../utilities/utilities";

const router = express.Router();

class Sorting {
    field: string = "created";
    direction: string = "desc";

    constructor(field: string, direction: string) {
        switch (direction) {
            case "desc":
                this.direction = "desc";
                break;
            default:
                this.direction = "asc";
                break;
        }

        switch (field) {
            case "username":
                this.field = "username";
                break;
            case "first-name":
            case "firstname":
                this.field = "firstname";
                break;
            case "last-name":
            case "lastname":
                this.field = "lastname";
                break;
            case "email":
                this.field = "email";
                break;
            case "blocked":
                this.field = "blocked";
                break;
            case "following":
                this.field = "following";
                break;
            case "followers":
                this.field = "followers";
                break;
            default:
                this.field = "created";
                break;
        }
    }

    toString() {
        let sortingQuery = "";

        switch (this.direction) {
            case "desc":
                sortingQuery += "-";
                break;
            default:
                sortingQuery += "";
                break;
        }

        switch (this.field) {
            case "username":
                sortingQuery += "username";
                break;
            case "firstname":
                sortingQuery += "profile.firstName";
                break;
            case "lastname":
                sortingQuery += "profile.lastName";
                break;
            case "email":
                sortingQuery += "email";
                break;
            case "blocked":
                sortingQuery += "blocked";
                break;
            case "following":
                sortingQuery += "following";
                break;
            case "followers":
                sortingQuery += "followers";
                break;
            default:
                sortingQuery += "createdAt";
                break;
        }

        return sortingQuery;
    }
}

router
    .get("/", asyncMiddleware(async (req: express.Request, res: express.Response) => {
        const search: string = req.query.search;
        const searchRegex = Utilities.stringToRegExp("/.*" + search + ".*/i");
        const sorting = new Sorting(
            req.query["sort-field"] || "created",
            req.query["sort-field"] && req.query["sort-direction"] ? req.query["sort-direction"] : "desc"
        );

        let conditions: any = {};
        if ( search ) {
            conditions = {
                $or: [
                    {
                        username: searchRegex
                    },
                    {
                        email: searchRegex
                    },
                    {
                        "profile.firstName": searchRegex
                    },
                    {
                        "profile.lastName": searchRegex
                    }
                ]
            };
        }

        const total = await User.count(conditions);
        const page = +req.query.page;
        const resultsPerPage = req.query["results-per-page"] ? +req.query["results-per-page"] : 25;
        const pagination = new Pagination(page, total, resultsPerPage);

        const users = await User
            .find(conditions)
            .skip(pagination.offset)
            .limit(pagination.resultsPerPage)
            .sort(sorting.toString());

        res.response({
            users: usersToAdministratorsArray(users),
            pagination: pagination,
            sort: sorting
        });
    }));

router
    .route("/:username")
    .get(asyncMiddleware(async (req: express.Request, res: express.Response) => {
        const username: string = req.params.username;
        const user = await getUserByUsername(username);

        res.response({
            user: user.toAdministrators()
        });
    }));

export async function blockUser(user: IUserModel): Promise<boolean> {
    user.blocked = true;
    user.tokens = [];

    await user.save();

    return true;
}

router
    .route("/:username/block")
    .post(asyncMiddleware(async (req: express.Request, res: express.Response) => {
        const username: string = req.params.username;
        const user = await getUserByUsername(username);

        await blockUser(user);

        res.response();
    }))
    .delete(asyncMiddleware(async (req: express.Request, res: express.Response) => {
        const username: string = req.params.username;
        const user = await getUserByUsername(username);

        user.blocked = false;

        await user.save();

        res.response();
    }));

export default router;