import * as mongoose from "mongoose";
import {IPhoneNumberModel} from "./phone-number";

// export type IPhoneConfirmationRequest2 = mongoose.Document & {
//     country: string
//     area: string
//     number: string
//     code: string
//
// };

export interface IPhoneConfirmationRequest extends mongoose.Document, IPhoneNumberModel {
    code: string;
}

const PhoneConfirmationRequestSchema = new mongoose.Schema(
    {
        country:    String,
        area:       String,
        number:     String,
        code:       String
    },
    {
        timestamps: true
    }
);

const PhoneConfirmationRequest = mongoose.model<IPhoneConfirmationRequest>("PhoneConfirmationRequest", PhoneConfirmationRequestSchema);
export default PhoneConfirmationRequest;