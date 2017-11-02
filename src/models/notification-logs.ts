import * as mongoose from "mongoose";

export interface INotificationLog extends mongoose.Document {
    tokens: string[];
    payload: any;
    success?: any;
    error?: any;
}

export const NotificationLogSchema = new mongoose.Schema(
    {
        tokens: {
            type: [String],
            required: true
        },
        payload: {
            type: Object,
            required: true
        },
        success: {
            type: Object,
            "default": null
        },
        error: {
            type: Object,
            "default": null
        }
    },
    {
        timestamps: true
    }
);

export const NotificationLog = mongoose.model<INotificationLog>("NotificationLog", NotificationLogSchema, "notification_logs");