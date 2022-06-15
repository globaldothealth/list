/**
 * This script deletes the externally-specified age range information from any case that has it,
 * so that the only information about the age for a case is the bucketed age ranges.
 * Run this after ../migrations/20220506100633-remove-age-range.js to remove the (now unused,
 * and unexpected for validation) stale data.
 */

print(new Date() + "Deleting old age ranges");
db.cases.updateMany({ 'demographics.ageRange': { $exists: true }}, { $unset: { 'demographics.ageRange': 0 }});
print(new Date() + "Done");