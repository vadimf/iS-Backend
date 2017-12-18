import * as mongoose from "mongoose";
import { AuthTokenSchema, IAuthTokenModel, IPasswordModel, PasswordSchema } from "../user";

export interface IAdministratorModel extends mongoose.Document {
    email?: string;
    tokens: IAuthTokenModel[];
    password: IPasswordModel;
}

export const AdministratorSchema = new mongoose.Schema(
    {
        email: {
            type: String,
            lowercase: true,
            unique: true,
            required: true
        },
        tokens: [{
            type: AuthTokenSchema
        }],
        password: {
            type: PasswordSchema,
            "default": {
                hash: ""
            }
        }
    },
    {
        timestamps: true
    }
);

AdministratorSchema.methods.toJSON = function() {
    return {
        id: this._id,
        email: this.email
    };
};

export const Administrator = mongoose.model<IAdministratorModel>("Administrator", AdministratorSchema, "admins");