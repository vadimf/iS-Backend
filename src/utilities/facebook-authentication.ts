import { isString } from "util";

const FacebookGraph = require("facebookgraph/lib");

export class FacebookAuthentication {
    private _fields: string[] = [
        "id",
        "first_name",
        "last_name"
    ];

    private _graph: any;

    public constructor(
        private _accessToken: string
    ) {
        this._graph = new FacebookGraph(this.accessToken);
    }

    get accessToken(): string {
        return this._accessToken;
    }

    addField(field: string|string[]) {
        if ( isString(field) ) {
            this._fields.push(field);
        }
        else {
            this._fields = this._fields.concat(field);
        }

        return this;
    }

    async getUser(): Promise<IFacebookUser> {
        return await this._graph.get("me?fields=" + this._fields.join(","));
    }
}

interface FacebookPaging {
    cursors: {
        before: string,
        after: string
    };
}

export interface IFacebookUser {
    id: string;
    name?: string;
    first_name?: string;
    last_name?: string;
    email?: string;
    picture?: {
        data?: {
            height?: number,
            width?: number,
            is_silhouette?: boolean,
            url?: string
        }
    };
    friends?: {
        data: IFacebookUser[],
        paging?: FacebookPaging,
        summary: {
            total_count: number
        }
    };
}