export enum StatusCode {
    Success = 200,

    Created = 201,
    NoContent = 203,

    BadRequest = 400,
    Unauthorized = 401,
    Forbidden = 403,
    NotFound = 404,
    MethodNotAllowed = 405,
    Conflict = 409,
    Gone = 410,
    UnsupportedMediaType = 415,
    UpgradeRequired = 426,

    InternalServerError = 500,
    NotImplemented = 501,
    ServiceUnavailable = 503
}

export class AppError {
    statusCode: number;
    errorCode: number;
    errorDescription: string;

    constructor(statusCode: number, errorCode: number, errorDescription: string) {
        this.statusCode = statusCode;
        this.errorCode = errorCode;
        this.errorDescription = errorDescription;
    }

    static Success = new AppError(StatusCode.Success, 0, "Success");

    /**
     * @apiDefine ErrorPerformingAction
     * @apiError 100 The requested action could not be completed
     */
    static ErrorPerformingAction = new AppError(StatusCode.InternalServerError, 100, "Error performing action");
    /**
     * @apiDefine ObjectDoesNotExist
     * @apiError 200 The requested object doesn't exist
     */
    static ObjectDoesNotExist = new AppError(StatusCode.NotFound, 200, "Object doesn't exist");
    /**
     * @apiDefine ErrorPerformingAction
     * @apiError 100 The requested action could not be completed
     */
    static NotAuthenticated = new AppError(StatusCode.Unauthorized, 300, "Not authenticated/authorized");
    /**
     * @apiDefine RequestValidation
     * @apiError 500 The requested couldn't be completed due to insufficient permissions, or lack of authentication
     */
    static RequestValidation = new AppError(StatusCode.BadRequest, 500, "Request validation error");
}