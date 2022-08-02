import { Collection, ObjectId } from 'mongodb';
import db from './database';

const numberTimeLimiters = {
    loginAttempt: {
        maxNumberOfFailedLogins: 8,
        timeWindowForFailedLogins: 60, //min
    },
    resetPasswordAttempt: {
        maxNumberOfFailedLogins: 6,
        timeWindowForFailedLogins: 30,
    },
};

type attemptName = 'loginAttempt' | 'resetPasswordAttempt';

export type IfailedAttempts = {
    _id: ObjectId;
    userId: ObjectId;
    loginAttempt: {
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

    if (
        diffTimeMin >= numberTimeLimiters[attemptName].timeWindowForFailedLogins
    )
        attemptsNumber = 1;

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

    return (
        attemptsNumber < numberTimeLimiters[attemptName].maxNumberOfFailedLogins
    );
};
