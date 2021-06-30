import { Schema, Document, model } from 'mongoose';

export type TokenDocument = Document & {
    userId: Schema.Types.ObjectId;
    token: string;
    createtAt: Date;
};

const tokenSchema = new Schema<TokenDocument>({
    userId: {
        type: Schema.Types.ObjectId,
        required: true,
        ref: 'user',
    },
    token: {
        type: String,
        required: true,
    },
    createdAt: {
        type: Date,
        default: Date.now,
        expires: 3600, //expiry time in seconds
    },
});

export const Token = model<TokenDocument>('Token', tokenSchema);
