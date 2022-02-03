/*
 * This script should have been run before the migration 20211222101904-iso-country-codes.js
 * (which imposes the validation constraint that country fields must be two characters long).
 * Well, it shouldn't have been needed. The script batch_countries.js should migrate all cases
 * to the ISO-codes model, but in practice did not run to completion in prod, so I wrote this script.
 * I'm committing it so that we have a record and something we can adapt to future use if needed.
 */

// as I knew which country names to patch up, I didn't use the i18-iso-countries library for this.
const locationCountries = [
    ['Albania', 'AL'],
    ['Algeria', 'DZ'],
    ['Algiers', 'DZ'],
    ['Andorra', 'AD'],
    ['Angola', 'AO'],
    ['Argentina', 'AR'],
    ['Cabo Verde', 'CV'],
    ['New Zealand', 'NZ'],
    ['North Macedonia', 'MK'],
    ['Republic of Congo', 'CG'],
    ['Switzerland', 'CH'],
    ['Taiwan', 'TW'],
    ['United Kingdom', 'UK']
];

for (const [name, code] of locationCountries) {
    print(`Updating location ${name} to ${code}`);
    db.cases.updateMany({'location.country': name}, {$set: {'location.country': code}});
}


const travelHistoryCountries = [
    ['Bolivia', 'BO'],
    ['Brazil', 'BR'],
    ['Chile', 'CL'],
    ['Colombia', 'CO'],
    ['Congo [Republic]', 'CG'],
    ['France', 'FR'],
    ['Iran', 'IR'],
    ['Italy', 'IT'],
    ['Macedonia [FYROM]', 'MK'],
    ['Mexico', 'MX'],
    ['Paraguay', 'PY'],
    ['Peru', 'PE'],
    ['Portugal', 'PT'],
    ['Republic of Congo', 'CG'],
    ['Senegal', 'SN'],
    ['Sint Maarten', 'SX'],
    ['Spain', 'ES'],
    ['United States', 'US'],
    ['Uruguay', 'UY'],
    ['Vatican City', 'VA'],
    ['Venezuela', 'VE'],
    ['Vietnam', 'VN'],
];

for (const [name, code] of travelHistoryCountries) {
    print(`Updating travel history ${name} to ${code}`);
    db.cases.updateMany({'travelHistory.travel.location.country': name}, {$set: {'travelHistory.travel.$.location.country': code}});
}
