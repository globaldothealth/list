import { ScheduleDocument, scheduleSchema } from '../../src/model/schedule';

import { Error } from 'mongoose';
import fullModel from './data/schedule.full.json';
import minimalModel from './data/schedule.minimal.json';
import mongoose from 'mongoose';
import _ from 'lodash';

const Schedule = mongoose.model<ScheduleDocument>('Schedule', scheduleSchema);

describe('validate', () => {
    it('a schedule with a misformatted AWS rule ARN is invalid', async () => {
        const badArn = _.cloneDeep(fullModel);
        badArn.awsRuleArn = 'invalid:arn:aws:events:region:rule/field';

        return new Schedule(badArn).validate((e) => {
            expect(e.name).toBe(Error.ValidationError.name);
        });
    });

    it('a schedule without an AWS schedule expression is invalid', async () => {
        const missingExpression = _.cloneDeep(fullModel);
        delete missingExpression.awsScheduleExpression;

        return new Schedule(missingExpression).validate((e) => {
            expect(e.name).toBe(Error.ValidationError.name);
        });
    });

    it('a schedule with a misformatted AWS schedule expression is invalid', async () => {
        const badSchedule = _.cloneDeep(fullModel);
        badSchedule.awsScheduleExpression = 'rate(1 hour';

        return new Schedule(badSchedule).validate((e) => {
            expect(e.name).toBe(Error.ValidationError.name);
        });
    });

    it('a minimal schedule is valid', async () => {
        return new Schedule(minimalModel).validate();
    });

    it('a fully specified schedule is valid', async () => {
        return new Schedule(fullModel).validate();
    });
});
