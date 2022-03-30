import mongoose, { Document } from 'mongoose';
import bcrypt from 'bcrypt';

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

    isValidPassword(password: string): Promise<boolean>;
    publicFields(): {
        id: string;
        name?: string;
        email: string;
        googleID: string;
        roles: string[];
        picture?: string;
        newsletterAccepted?: boolean;
        apiKey?: string;
    };
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

// Methods
userSchema.methods.isValidPassword = async function (
    password: string,
): Promise<boolean> {
    if (!this.password) return false;

    const compare = await bcrypt.compare(password, this.password);
    return compare;
};

export async function isUserPasswordValid(user: UserDocument, password: string): Promise<boolean> {
    if (!password) return false;
    if (!user.password) return false;
    const compare = await bcrypt.compare(password, user.password);
    return compare;
}

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

userSchema.methods.publicFields = function () {
    return {
        id: this.id,
        name: this.name,
        email: this.email,
        googleID: this.googleID,
        roles: this.roles,
        picture: this.picture,
        newsletterAccepted: this.newsletterAccepted,
        apiKey: this.apiKey,
    };
};

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
