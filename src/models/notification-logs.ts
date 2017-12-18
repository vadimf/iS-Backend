import * as mongoose from "mongoose";

export interface INotificationLog extends mongoose.Document {
    tokens: string[];
    payload: any;
    success?: any;
    error?: any;
    sentByAdministrator?: boolean;
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
        },
        sentByAdministrator: {
            type: Boolean,
            "default": false,
            index: true
        }
    },
    {
        timestamps: true
    }
);
NotificationLogSchema.methods.toJSON = function () {
    const devices = this.tokens.length;

    return {
        id: this._id,
        createdAt: this.createdAt,
        title: "" + this.payload.data.title,
        message: "" + this.payload.data.message,
        devices: devices,
        failures: +this.success.failureCount
    };
};

export const NotificationLog = mongoose.model<INotificationLog>("NotificationLog", NotificationLogSchema, "notification_logs");