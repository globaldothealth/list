import { Upload } from '../../src/model/upload';

import fullModel from './data/upload.full.json';
import minimalModel from './data/upload.minimal.json';

describe('validate', () => {
    it('a minimal upload document is valid', async () => {
        return new Upload(minimalModel).validate();
    });

    it('a fully specified upload document is valid', async () => {
        return new Upload(fullModel).validate();
    });
});
