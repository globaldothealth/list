import { ObjectId } from 'mongodb';
import {
    awsRuleDescriptionForSource,
    awsRuleNameForSource,
    awsRuleTargetIdForSource,
    awsStatementIdForSource,
    sources,
    ISource,
} from '../../src/model/source';
import minimalSource from './data/source.minimal.json';

describe('helper functions', () => {
    it('awsStatementIdForSource returns formatted source ID', () => {
        const s = {
            _id: new ObjectId(),
            ...minimalSource,
        };
        expect(awsStatementIdForSource(s as ISource)).toContain(
            s._id.toString(),
        );
    });
    it('awsRuleDescriptionForSource returns formatted source name', () => {
        const s = {
            _id: new ObjectId(),
            ...minimalSource,
        };
        expect(awsRuleDescriptionForSource(s as ISource)).toContain(s.name);
    });
    it('awsRuleNameForSource returns formatted source ID', () => {
        const s = {
            _id: new ObjectId(),
            ...minimalSource,
        };
        expect(awsRuleNameForSource(s as ISource)).toContain(s._id.toString());
    });
    it('awsRuleTargetIdForSource returns formatted source ID', () => {
        const s = {
            _id: new ObjectId(),
            ...minimalSource,
        };
        expect(awsRuleTargetIdForSource(s as ISource)).toContain(
            s._id.toString(),
        );
    });
});
