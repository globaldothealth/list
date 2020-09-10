import mongoose from 'mongoose';

export const userRoles = ['admin', 'curator', 'reader'];

const userSchema = new mongoose.Schema({
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
});

export type UserDocument = mongoose.Document & {
    googleID: string;
    name?: string;
    email: string;
    roles: [string];
    picture?: string;
};

export const User = mongoose.model<UserDocument>('User', userSchema);

export const Session = mongoose.model<mongoose.Document>(
    'Session',
    new mongoose.Schema({}),
);
