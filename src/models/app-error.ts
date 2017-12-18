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
     * @apiDefine UserDoesNotExist
     * @apiError 201 The requested user doesn't exist
     */
    static UserDoesNotExist = new AppError(StatusCode.NotFound, 201, "User doesn't exist");
    /**
     * @apiDefine ObjectExist
     * @apiError 202 The requested object already exist
     */
    static ObjectExist = new AppError(StatusCode.Conflict, 202, "Object already exist");
    /**
     * @apiDefine ErrorPerformingAction
     * @apiError 300 The requested action could not be completed
     */
    static NotAuthenticated = new AppError(StatusCode.Unauthorized, 300, "Not authenticated/authorized");
    /**
     * @apiDefine UserBlocked
     * @apiError 301 The requested action could not be completed
     */
    static UserBlocked = new AppError(StatusCode.Unauthorized, 301, "User blocked");
    /**
     * @apiDefine RequestValidation
     * @apiError 500 The requested couldn't be completed due to insufficient permissions, or lack of authentication
     */
    static RequestValidation = new AppError(StatusCode.BadRequest, 500, "Request validation error");
    /**
     * @apiDefine UsernameAlreadyTaken
     * @apiError 1000 Username is already in use
     */
    static UsernameAlreadyTaken = new AppError(StatusCode.Conflict, 1000, "Username is already in use");
    /**
     * @apiDefine EmailAlreadyTaken
     * @apiError 1001 Email is already in use
     */
    static EmailAlreadyTaken = new AppError(StatusCode.Conflict, 1001, "Email is already in use");
    /**
     * @apiDefine UploadingError
     * @apiError 2000 Uploading error
     */
    static UploadingError = new AppError(StatusCode.Forbidden, 2000, "Uploading error");
    /**
     * @apiDefine CannotAuthenticateViaThisMethod
     * @apiError 3000 The password given doesn't match the user's password
     */
    static CannotAuthenticateViaThisMethod = new AppError(StatusCode.Unauthorized, 3000, "Cannot authenticate via this method");
    /**
     * @apiDefine PasswordDoesNotMatch
     * @apiError 3001 The password given doesn't match the user's password
     */
    static PasswordDoesNotMatch = new AppError(StatusCode.Unauthorized, 3001, "Password doesn't match");
    /**
     * @apiDefine FacebookAuthenticationError
     * @apiError 3002 There's been a problem authenticating with facebook
     */
    static FacebookAuthenticationError = new AppError(StatusCode.Unauthorized, 3002, "There's been a problem authenticating with facebook");

    static CannotDeleteOwnUser = new AppError(StatusCode.Unauthorized, 100001, "Cannot remove yourself");
}