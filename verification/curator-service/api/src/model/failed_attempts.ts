import { Collection, ObjectId } from 'mongodb';
import db from './database';

/*
 * This is a minimal case schema to support some source-related behaviour.
 * The full schema for cases is in the data service.
 */

const maxNumberOfFailedLogins = 8;
const timeWindowForFailedLogins = 60; //min

type attemptName = 'loginAttempt' | 'registerAttempt' | 'resetPasswordAttempt';

export type IfailedAttempts = {
    _id: ObjectId;
    userId: ObjectId;
    loginAttempt: {
        count: number;
        createdAt: Date;
    };
    registerAttempt: {
        count: number;
        createdAt: Date;
    };
    resetPasswordAttempt: {
        count: number;
        createdAt: Date;
    };
};

export const failed_attempts = () =>
    db().collection('failed_attempts') as Collection<IfailedAttempts>;

export const setupFailedAttempts = async (userId: ObjectId) => {
    await failed_attempts().insertOne({
        _id: new ObjectId(),
        userId: userId,
        loginAttempt: {
            count: 0,
            createdAt: new Date(),
        },
        registerAttempt: {
            count: 0,
            createdAt: new Date(),
        },
        resetPasswordAttempt: {
            count: 0,
            createdAt: new Date(),
        },
    });
};

export const handleCheckFailedAttempts = async (
    userId: ObjectId,
    attemptName: attemptName,
) => {
    const attempts = (await failed_attempts().findOne({
        userId: userId,
    })) as IfailedAttempts;

    let attemptsNumber = attempts[attemptName].count + 1;

    const diffTimeMin =
        Math.floor(
            Math.abs(Date.now() - attempts[attemptName].createdAt.getTime()) /
                1000,
        ) / 60;

    if (diffTimeMin >= timeWindowForFailedLogins) attemptsNumber = 1;

    if (attemptsNumber > maxNumberOfFailedLogins) {
        await failed_attempts().updateOne(
            { userId: userId },
            {
                $set: {
                    [attemptName]: {
                        count: attemptsNumber,
                        createdAt: new Date(),
                    },
                },
            },
        );

        return { success: false, attemptsNumber };
    }

    return { success: true, attemptsNumber };
};
