import mongoose from 'mongoose';

export const dateSchema = {
    type: Date,
    min: '2019-11-01',
    max: Date.now,
};
