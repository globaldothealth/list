import { ObjectId } from 'mongodb';
import db from './database';

export interface IToken {
    _id: ObjectId;
    userId: ObjectId;
    token: string;
    createdAt: Date;
}

export const tokens = () => db().collection('tokens');
