import mongoose, { Document } from 'mongoose';
import bcrypt from 'bcrypt';
import { ObjectId } from 'mongodb';

export const userRoles = ['admin', 'curator'];

interface IUserPublicFields {
    id: string,
    name?: string,
    email: string,
    googleID?: string,
    roles: [string],
    picture?: string,
    newsletterAccepted?: boolean,
    apiKey?: string,
};

export type IUser = IUserPublicFields & {
    _id: ObjectId;
    password?: string;
    downloads?: [{
        timestamp: Date,
        format?: String,
        query?: String,
    }];
};

export type UserDocument = Document & IUser;

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

export async function isUserPasswordValid(user: UserDocument, password: string): Promise<boolean> {
    if (!password) return false;
    if (!user.password) return false;
    const compare = await bcrypt.compare(password, user.password);
    return compare;
}

export function userPublicFields(user: UserDocument | undefined): IUserPublicFields | undefined {
    if (!user) return undefined;
    return {
        id: user._id.toHexString(),
        name: user.name,
        email: user.email,
        googleID: user.googleID,
        roles: user.roles,
        picture: user.picture,
        newsletterAccepted: user.newsletterAccepted,
        apiKey: user.apiKey,
    };
}
export const User = mongoose.model<UserDocument>('User', userSchema);

export const Session = mongoose.model<mongoose.Document>(
    'Session',
    new mongoose.Schema({}),
);

const db = () => mongoose.connection.getClient().db();
export const users = () => db().collection('users');
