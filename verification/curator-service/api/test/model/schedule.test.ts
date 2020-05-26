import { ScheduleDocument, scheduleSchema } from '../../src/model/schedule';

import { Error } from 'mongoose';
import fullModel from './data/schedule.full.json';
import mongoose from 'mongoose';

const Schedule = mongoose.model<ScheduleDocument>('Schedule', scheduleSchema);

describe('validate', () => {
    it('a schedule without an AWS rule ARN is invalid', async () => {
        const missingArn = { ...fullModel };
        delete missingArn.awsRuleArn;

        return new Schedule(missingArn).validate((e) => {
            expect(e.name).toBe(Error.ValidationError.name);
        });
    });

    it('a schedule with a misformated AWS rule ARN is invalid', async () => {
        const badArn = { ...fullModel };
        badArn.awsRuleArn = 'invalid:arn:aws:events:region:rule/field';

        return new Schedule(badArn).validate((e) => {
            expect(e.name).toBe(Error.ValidationError.name);
        });
    });

    it('a fully specified schedule is valid', async () => {
        return new Schedule(fullModel).validate();
    });
});
