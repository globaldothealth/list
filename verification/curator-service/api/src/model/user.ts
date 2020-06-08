import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
    name: String,
    email: {
        type: String,
        required: 'User must have an email',
    },
    googleID: String,
    roles: {
        type: [String],
        enum: ['reader', 'curator', 'admin'],
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
