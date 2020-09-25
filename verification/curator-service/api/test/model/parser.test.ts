import { ParserDocument, parserSchema } from '../../src/model/parser';

import { Error } from 'mongoose';
import _ from 'lodash';
import fullModel from './data/parser.full.json';
import mongoose from 'mongoose';

const Parser = mongoose.model<ParserDocument>('Parser', parserSchema);

describe('validate', () => {
    it('a parser without an AWS lambda ARN is invalid', async () => {
        const missingArn = _.cloneDeep(fullModel);
        delete missingArn.awsLambdaArn;

        return new Parser(missingArn).validate((e) => {
            expect(e.name).toBe(Error.ValidationError.name);
        });
    });

    it('a fully specified parser is valid', async () => {
        return new Parser(fullModel).validate();
    });
});
