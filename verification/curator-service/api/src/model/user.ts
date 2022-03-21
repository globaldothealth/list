import mongoose, { Document } from 'mongoose';

export const userRoles = ['admin', 'curator'];

export type UserDocument = Document & {
    googleID?: string | undefined;
    name?: string;
    email: string;
    password?: string;
    apiKey?: string;
    roles: [string];
    picture?: string;
    newsletterAccepted?: boolean;
    downloads?: [{
        timestamp: Date,
        format?: String,
        query?: String,
    }];
};

const userSchema = new mongoose.Schema<UserDocument>({
    name: String,
    email: {
        type: String,
        required: 'User must have an email',
    },
    googleID: String,
    roles: {
        type: [String],
        enum: userRoles,
    },
    picture: String,
    newsletterAccepted: Boolean,
    password: String,
    apiKey: String,
    downloads: [
        {
            timestamp: Date,
            format: String,
            query: String,
        },
    ],
});

export const User = mongoose.model<UserDocument>('User', userSchema);

export const Session = mongoose.model<mongoose.Document>(
    'Session',
    new mongoose.Schema({}),
);

const mongoClient = () => mongoose.connection.getClient();
export const users = () => mongoClient().db().collection("users");
