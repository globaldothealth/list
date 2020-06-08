import mongoose from 'mongoose';

export const userRoles = ['admin', 'curator', 'reader'];

const userSchema = new mongoose.Schema({
    name: {
        type: String,
    },
    email: {
        type: String,
        required: 'User must have an email',
    },
    googleID: {
        type: String,
        // Note: we can relax that requirement if we start
        // supporting more identity platforms.
        required: 'User must be logged-in with Google',
    },
    roles: {
        type: [String],
        enum: userRoles,
    },
});

export type UserDocument = mongoose.Document & {
    googleID: string;
    name: string;
    email: string;
    roles: [string];
};

export const User = mongoose.model<UserDocument>('User', userSchema);

export const Session = mongoose.model<mongoose.Document>(
    'Session',
    new mongoose.Schema({}),
);
