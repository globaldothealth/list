import mongoose, { Document } from 'mongoose';
import bcrypt from 'bcrypt';

export const userRoles = ['admin', 'curator'];

export type UserDocument = Document & {
    googleID: string;
    name?: string;
    email: string;
    password?: string;
    roles: [string];
    picture?: string;
    newsletterAccepted?: boolean;
    downloads?: [{ timestamp: Date }];

    isValidPassword(password: string): Promise<boolean>;
    publicFields(): {
        id: string;
        name?: string;
        email: string;
        googleID: string;
        roles: string[];
        picture?: string;
        newsletterAccepted?: boolean;
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
    downloads: [
        {
            timestamp: Date,
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

userSchema.methods.publicFields = function () {
    return {
        id: this.id,
        name: this.name,
        email: this.email,
        googleID: this.googleID,
        roles: this.roles,
        picture: this.picture,
        newsletterAccepted: this.newsletterAccepted,
    };
};

export const User = mongoose.model<UserDocument>('User', userSchema);

export const Session = mongoose.model<mongoose.Document>(
    'Session',
    new mongoose.Schema({}),
);
