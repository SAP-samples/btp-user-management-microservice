const { getData, beforeNewUser, beforeSaveUser, beforePatchUser, afterCreateUser, afterUpdateUser, beforeDeletUser, refreshData } = require('./lib/handlers');

module.exports = cds.service.impl(async function () {
    const {
        User,
        UserAuthorization,
        IdP,
        Authorization
    } = this.entities;

    /*** BEFORE HANDLERS ***/

    this.before('READ', User, getData);
    this.before('READ', UserAuthorization, getData);
    this.before('READ', IdP, getData);
    this.before('READ', Authorization, getData);
    this.before('NEW', User, beforeNewUser);
    this.before('SAVE', User, beforeSaveUser);
    this.before('PATCH', User, beforePatchUser);
    this.before('DELETE', User, beforeDeletUser);

    /*** AFTER HANDLERS ***/

    this.after('CREATE', User, afterCreateUser);
    this.after('UPDATE', User, afterUpdateUser);

    /*** FUNCTION HANDLERS ***/

    this.on('refreshData', refreshData);
});