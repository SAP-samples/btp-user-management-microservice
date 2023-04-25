const { getData, beforeSaveUser, beforePatchUser, afterCreateUser, afterUpdateUser, beforeDeletUser, refreshData } = require('./lib/handlers');

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
    this.before('SAVE', User, beforeSaveUser);
    this.before('PATCH', User, beforePatchUser);
    this.before('DELETE', User, beforeDeletUser);

    this.before('NEW', User, async (req) => {
        console.log(req.params);
        console.log(req.data);
        try {
            const user = await cds.tx(req).run(SELECT.one.from(User, { userName: req.data.userName, origin_originKey: req.data.origin_originKey }).columns(['btpId']));
            if (user) {
                req.error(400, 'User "' + req.data.userName + '" already exists in IdP "' + req.data.origin_originKey + '".');
            }
        } catch (err) {
            req.error(400, err.message);
        }
    });

    /*** AFTER HANDLERS ***/

    this.after('CREATE', User, afterCreateUser);
    this.after('UPDATE', User, afterUpdateUser);

    /*** FUNCTION HANDLERS ***/

    this.on('refreshData', refreshData);
});