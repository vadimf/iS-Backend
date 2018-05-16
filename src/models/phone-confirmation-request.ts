import * as mongoose from "mongoose";
import { IPhoneNumberModel } from "./phone-number";
import { IUserModel } from "./user";

export interface IPhoneConfirmationRequest extends mongoose.Document, IPhoneNumberModel {
    code: string;
    user?: IUserModel;
}

const PhoneConfirmationRequestSchema = new mongoose.Schema(
    {
        country:    String,
        area:       String,
        number:     String,
        code:       String,
        user:       {
            type: mongoose.SchemaTypes.ObjectId,
            ref: "User",
            "default": null
        }
    },
    {
        timestamps: true
    }
);
PhoneConfirmationRequestSchema.methods.toString = function() {
    return this.country + (this.area || "") + this.number;
};

const PhoneConfirmationRequest = mongoose.model<IPhoneConfirmationRequest>("PhoneConfirmationRequest", PhoneConfirmationRequestSchema);
export default PhoneConfirmationRequest;