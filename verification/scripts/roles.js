const {matchedCount} = db.users.updateOne({email: email}, {$set: {roles: roles}});
if (matchedCount != 1) {
    throw email + ' is not in the DB'
}