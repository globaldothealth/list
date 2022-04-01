import { ObjectId } from 'mongodb';
import { Schema, Document, model } from 'mongoose';
import db from './database';

export interface IToken {
    _id: ObjectId;
    userId: ObjectId;
    token: string;
    createAt: Date;
}

export type TokenDocument = Document & IToken;

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
export const tokens = () => db().collection('tokens');
