import * as mongoose from "mongoose";

export interface IPhoneNumberModel {
    country: string;
    area: string;
    number: string;
}

export const PhoneNumberSchema = new mongoose.Schema(
    {
        country: String,
        area: String,
        number: String
    },
    {
        toJSON: {
            transform: function (doc: any, ret: any) {
                delete ret._id;
            }
        }
    }
);