import fs from 'fs';

try {
    const data = fs.readFileSync('../export-data/functions/01-split/fields.txt', 'utf-8');
    const fieldNames = data.split(/\n/);
    const fieldsList = JSON.stringify(fieldNames);
    fs.writeFileSync('../../data-service/src/model/fields.json', fieldsList);
    console.log('Wrote the JSON file.');
    fs.writeFileSync('../../../verification/curator-service/ui/public/fields.txt', data);
    console.log('Wrote the data dictionary.');
    process.exit(0);
} catch (err) {
    console.error(`I couldn't prepare the fields json: ${err}`);
    process.exit(10);
}
