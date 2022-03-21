import mongoose from 'mongoose';

const mongoClient = () => mongoose.connection.getClient();
export const cases = () => mongoClient().db().collection('cases');
export const restrictedCases = () => mongoClient().db().collection('restrictedcases');
