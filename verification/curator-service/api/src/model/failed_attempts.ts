import { Collection, ObjectId } from 'mongodb';
import db from './database';

const numberTimeLimiters = {
    loginAttempt: {
        maxNumberOfFailedLogins: 8,
        timeWindowForFailedLogins: 60, //min
    },
    resetPasswordAttempt: {
        maxNumberOfFailedLogins: 8,
        timeWindowForFailedLogins: 60,
    },
    forgotPasswordAttempt: {
        maxNumberOfFailedLogins: 8,
        timeWindowForFailedLogins: 60,
    },
    resetPasswordWithTokenAttempt: {
        maxNumberOfFailedLogins: 8,
        timeWindowForFailedLogins: 60,
    },
};

export enum AttemptName {
    Login = 'loginAttempt',
    ResetPassword = 'resetPasswordAttempt',
    ForgotPassword = 'forgotPasswordAttempt',
    ResetPasswordWithToken = 'resetPasswordWithTokenAttempt',
}

export interface IFailedAttempts {
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
    forgotPasswordAttempt: {
        count: number;
        createdAt: Date;
    };
    resetPasswordWithTokenAttempt: {
        count: number;
        createdAt: Date;
    };
}

export const failedAttempts = () =>
    db().collection('failedAttempts') as Collection<IFailedAttempts>;

export const setupFailedAttempts = async (userId: ObjectId) => {
    await failedAttempts().insertOne({
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
        forgotPasswordAttempt: {
            count: 0,
            createdAt: new Date(),
        },
        resetPasswordWithTokenAttempt: {
            count: 0,
            createdAt: new Date(),
        },
    });
};

export const handleCheckFailedAttempts = async (
    userId: ObjectId,
    attemptName: AttemptName,
) => {
    let attempts = await failedAttempts().findOne({
        userId,
    });

    if (!attempts) {
        setupFailedAttempts(userId);
        attempts = (await failedAttempts().findOne({
            userId,
        })) as IFailedAttempts;
    }

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

    return {
        success:
            attemptsNumber <
            numberTimeLimiters[attemptName].maxNumberOfFailedLogins,
        attemptsNumber,
    };
};

export const updateFailedAttempts = async (
    userId: ObjectId,
    attemptName: AttemptName,
    attemptsNumber: number,
) => {
    await failedAttempts().updateOne(
        { userId },
        {
            $set: {
                [attemptName]: {
                    count: attemptsNumber,
                    createdAt: new Date(),
                },
            },
        },
    );
};
