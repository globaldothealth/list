import mongoose from 'mongoose';

export default () => mongoose.connection.getClient().db();
