import { ObjectId } from 'mongodb';
import db from './database';

export interface IToken {
    _id: ObjectId;
    userId: ObjectId;
    token: string;
    createAt: Date;
}

export const tokens = () => db().collection('tokens');
