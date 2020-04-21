import mongoose from 'mongoose';

const demographicsSchema = new mongoose.Schema({
    age: {
        type: Number,
        min: 0,
        max: 200,
    },
    sex: {
        type: String,
        enum: ['female', 'male'],
    },
});

const caseSchema = new mongoose.Schema({
    date: {
        type: Date,
        min: '2019-11-01',
        max: '2020-04-21',
        required: 'Enter a date.',
    },
    outcome: {
        type: String,
        enum: ['pending', 'recovered', 'death'],
        required: 'Enter an outcome.',
    },
    demographics: demographicsSchema,
});

interface Demographics {
    age: number;
    sex: string;
}

type CaseDocument = mongoose.Document & {
    date: Date;
    outcome: string;
    demographics: Demographics;
};

export const Case = mongoose.model<CaseDocument>('Case', caseSchema);
