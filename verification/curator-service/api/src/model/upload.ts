import { IUploadSummary } from './upload-summary';

import { ObjectId } from 'mongodb';

export type IUpload = {
    _id: ObjectId,
    status: string,
    summary: IUploadSummary,
    created: Date,
};
