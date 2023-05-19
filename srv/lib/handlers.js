const cds = require('@sap/cds');
const xsenv = require('@sap/xsenv');

/*** MODULE INITIALIZATION ***/

let xsuaa = null;
let service_domain = null;
let api_def = null;

(async function () {
    // Get service binding info
    xsenv.loadEnv();
    const services = xsenv.getServices({
        xsuaa: { label: 'xsuaa' }
    });
    const url = services.xsuaa.url.split('.');
    service_domain = url.splice(1, url.length-1).join('.');

    // Load binding definition
    api_def = cds.env.requires['xsuaa-bind'];

    // Connect to external services
    xsuaa = await cds.connect.to('xsuaa-api');
})();

/*** GLOBAL CONSTANTS ***/

const db_namespace = 'user.mngr.db.';
const srv_namespace = 'user.mngr.srv.UserMngrService.';

/*** CONTROL FLAGS ***/

const tenants = {};

/*** HELPERS ***/

// Check whether the SQLite in-memory DB is deployed
async function resetDB(req) {
    try {
        // Whenever a FIRST READ attempt is done in the current request context,
        // we check whether the tables exist in the SQLite in-memory DB 
        await cds.tx(req).run(DELETE.from(db_namespace + 'UserAuthorization'));
        await cds.tx(req).run(DELETE.from(db_namespace + 'User'));
        await cds.tx(req).run(DELETE.from(db_namespace + 'IdP'));
        await cds.tx(req).run(DELETE.from(db_namespace + 'Authorization'));
    } catch (err) {
        // Read failed, so at least one table does not exist in the SQLite in-memory DB,
        // then we explicitly deploy the DB structure and reset the first read control flag
        const csn = await cds.compile('file:./srv/csn.json');
        const ddl = cds.compile(csn).to.sql({ dialect: 'sqlite' });
        await cds.tx(req).run(ddl);
    }
}

// Find a BTP user based on the User Name
async function findUser(userName, origin) {
    // Load all BTP users
    const xsuaaResp = await xsuaa.get('/Users?count=500');
    const xsuaaUsers = xsuaaResp.resources;

    // Search for the BTP user with the given User Name / IdP and, if found, fetch the BTP ID
    var btpId = null;
    const user = xsuaaUsers.find(user => user.userName.toLowerCase() === userName.toLowerCase() && user.origin === origin);
    if (user) {
        btpId = user.id;
    }

    return btpId;
}

// Create a new user in BTP
async function createUser(user, groups) {
    // Create the user and fetch it's ID in BTP
    const newUser = await xsuaa.post('/Users', user);
    const btpId = newUser.id;

    // Assign the user's role collections
    await assignUserGroups(btpId, user, groups);

    return btpId;
}

// Assign roloe collections to a user
async function assignUserGroups(btpId, user, groups) {
    // Build the member object following the API payload
    const member = {
        origin: user.origin,
        type: 'USER',
        value: btpId
    };

    // Add the member to the provided groups (role collection)
    for (var i = 0; i < groups.length; i++) {
        await xsuaa.post('/Groups/' + groups[i] + '/members', member);
    }
}

// Remove a user from the specified role collections (groups)
async function removeUserGroups(btpId, groups) {
    for (var i = 0; i < groups.length; i++) {
        await xsuaa.delete('/Groups/' + groups[i] + '/members/' + btpId);
    }
}

// Update a user in BTP
async function updateUser(user, groups) {
    // Patch the user info in BTP
    const btpUser = await xsuaa.send('PATCH', '/Users/' + user.id, user, { 'If-Match': '*' });

    // Fetch the current user's currently assigned role collections (groups) - only those belonging to the app
    const auths = getAuthorizationsAsJSON();
    const userAuth = [];
    if (btpUser.groups) {
        btpUser.groups.forEach(group => {
            if (group.value in auths) {
                userAuth.push(group.value);
            }
        });
    }

    // Check for added role collections (groups)
    const toAdd = [];
    groups.forEach(group => {
        const auth = userAuth.find(auth => auth === group);
        if (!auth) {
            toAdd.push(group);
        }
    });

    // Check for removed role collections (groups)
    const toRemove = [];
    userAuth.forEach(auth => {
        const group = groups.find(group => group === auth);
        if (!group) {
            toRemove.push(auth);
        }
    });

    // Assign added role collections (groups)
    if (toAdd.length > 0) {
        await assignUserGroups(btpUser.id, user, toAdd);
    }

    // Unassign removed role collections (groups)
    if (toRemove.length > 0) {
        await removeUserGroups(btpUser.id, toRemove);
    }
}

// From an app stand point, user deletions is just removal of all app's role collections (groups)
async function deleteUser(btpId, groups) {
    for (var i = 0; i < groups.length; i++) {
        await xsuaa.delete('/Groups/' + groups[i].name + '/members/' + btpId);
    }
}

// Fetch all BTP users which are assigned to the app's role collections
async function getUsers() {
    // Fetch all BTP users
    const xsuaaResp = await xsuaa.get('/Users?count=500');
    const xsuaaUsers = xsuaaResp.resources;

    // Filter only users assigned to the app's role collections 
    const users = [];
    const usersAuth = [];
    xsuaaUsers.forEach(user => {
        const groups = user.groups;
        if (groups && groups.length && groups.length > 0) {
            const auths = getAuthorizationsAsJSON();
            const userAuth = [];
            groups.forEach(group => {
                if (group.value in auths) {
                    userAuth.push(
                        {
                            parent_userName: user.userName,
                            parent_origin_originKey: user.origin,
                            authorization_ID: auths[group.value]
                        }
                    );
                }
            });
            if (userAuth.length > 0) {
                users.push(
                    {
                        userName: user.userName,
                        externalId: user.externalId,
                        btpId: user.id,
                        firstName: user.name.givenName,
                        lastName: user.name.familyName,
                        displayName: user.name.givenName + ' ' + user.name.familyName,
                        eMail: (user.emails && user.emails.length != undefined && user.emails.length > 0) ? user.emails[0].value : null,
                        origin_originKey: user.origin,
                        isActive: user.active,
                        isVerified: user.verified
                    }
                );
                userAuth.forEach(auth => {
                    usersAuth.push(auth);
                });
            }
        }
    });

    return { users: users, usersAuth: usersAuth };
}

// Fetch the IdPs registered in BTP for authentication
async function getIdPs() {
    // Fetch IdPs from BTP
    const xsuaaResp = await xsuaa.get('/sap/rest/identity-providers');
    const xsuaaIdPs = xsuaaResp;

    // Convert fetched data into the service data model
    const IdPs = [];
    xsuaaIdPs.forEach(IdP => {
        IdPs.push(
            {
                originKey: IdP.originKey,
                name: IdP.name
            }
        );
    });

    return IdPs;
}

// Fetch the authorizations configured in the environment variables
function getAuthorizations() {
    const authSetting = process.env.APP_AUTHS.split('|');
    const auths = [];
    authSetting.forEach(auth => {
        auths.push(JSON.parse(auth));
    });
    return auths;
}

// Fetch the authorizations configured in the environment variables as JSON
function getAuthorizationsAsJSON() {
    const auths = getAuthorizations();
    const authsJSON = {};
    auths.forEach(auth => {
        authsJSON[auth.name] = auth.ID;
    });
    return authsJSON;
}

// Load the app's users into the SQLite in-mebory DB
async function loadUsers(req) {
    // Fetch Users from the BTP subaccount
    const result = await getUsers();

    // Insert Users and their corresponding Role Collections (authorizations) into SQLite in-memory DB
    const users = result.users;
    const usersAuth = result.usersAuth;
    if (users.length > 0) {
        await cds.tx(req).run(INSERT.into(db_namespace + 'User').entries(users));
        await cds.tx(req).run(INSERT.into(db_namespace + 'UserAuthorization').entries(usersAuth));
    }
}

// Load BTP IdPs into the SQLite in-mebory DB
async function loadIdPs(req) {
    // Fetch Users from the BTP subaccount
    const IdPs = await getIdPs();
    // Insert IdPs into SQLite in-memory DB
    if (IdPs.length > 0) {
        await cds.tx(req).run(INSERT.into(db_namespace + 'IdP').entries(IdPs));
    }
}

// Load app's authorizations (role collections) into the SQLite in-memory DB
async function loadAuthorizations(req) {
    // Fetch Users from the BTP subaccount
    const auths = getAuthorizations();
    // Insert Authorizations into SQLite in-memory DB
    if (auths.length > 0) {
        await cds.tx(req).run(INSERT.into(db_namespace + 'Authorization').entries(auths));
    }
}

// Read authorizations from SQLite in-memory DB
async function readAuthorizations(authorizations, req) {
    const groups = [];
    for (var i = 0; i < authorizations.length; i++) {
        const auth = await cds.tx(req).run(SELECT.one.from(db_namespace + 'Authorization', { ID: authorizations[i].authorization_ID }).columns(['name']));
        groups.push(auth.name);
    }
    return groups;
}

/*** HANDLERS ***/
async function userInfo(req) {
    try {
        // Set URL according to subscriber tenant
        const url = new URL(req.headers.referer);
        api_def.credentials.url = url.protocol + '//' + url.hostname.replace('-' + process.env.APP_URI, '.' + service_domain);

        // Connect to XSUAA bound service
        const xsuaa_bind = await cds.connect.to(api_def);

        // Fetch user info
        const userInfo = await xsuaa_bind.get('/userinfo');
        const externalId = (userInfo.sub_idp.trim() === "") ? 'N/A' : userInfo.sub_idp;

        // Respond with user info
        req.info(200, 'External ID: ' + externalId + '\n\nUser name: ' + userInfo.user_name + '\n\nName: ' + userInfo.name + '\n\ne-mail: ' + userInfo.email + '\n\nLogon time: ' + new Date(userInfo.previous_logon_time).toString());
        return true;
    } catch (err) {
        req.error(err.message);
    }
}

// Populate the SQLite in-memory DB at first read operation 
async function getData(req) {
    try {
        if (!(req.tenant in tenants)) {
            // Make sure the SQLite in-memory DB is deployed
            await resetDB(req);

            // Load users into memory DB 
            await loadUsers(req);
            // Load IdPs into memory DB 
            await loadIdPs(req);
            // Load authorizations into memory DB 
            await loadAuthorizations(req);

            // Reset control flag
            tenants[req.tenant] = true;
        }
        return req;
    } catch (err) {
        req.error(err.code, err.message);
    }
}

// User's BEFORE NEW event handler (for Fiori Elements compatibility) 
async function beforeNewUser(req) {
    try {
        const user = await cds.tx(req).run(SELECT.one.from(db_namespace + 'User', { userName: req.data.userName, origin_originKey: req.data.origin_originKey }).columns(['btpId']));
        if (user) {
            req.error(400, 'User "' + req.data.userName + '" already exists in IdP "' + req.data.origin_originKey + '".');
        }
    } catch (err) {
        req.error(400, err.message);
    }
}

// User's BEFORE SAVE event handler (for Fiori Elements compatibility) 
function beforeSaveUser(req) {
    try {
        // Update the display name according to the first and last names
        req.data.displayName = req.data.firstName + ' ' + req.data.lastName;

        // If no authorization has been assigned, then the configured default authorization is
        // automatically assigned
        if (req.data.authorizations.length === 0) {
            req.data.authorizations.push(
                {
                    parent_userName: req.data.userName,
                    parent_origin_originKey: req.data.origin_originKey,
                    authorization_ID: process.env.DEFAULT_AUTH
                }
            );
        }

        // Null flags are automatically converted to "false" (those properties are mandatory)
        req.data.isActive = (req.data.isActive === null) ? false : req.data.isActive;
        req.data.isVerified = (req.data.isVerified === null) ? false : req.data.isVerified;
    } catch (err) {
        req.error(err.code, err.message);
    }
    return req;
}

// User's BEFORE PATCH event handler (for Fiori Elements compatibility, using the "SideEffects" annotation) 
async function beforePatchUser(req) {
    try {
        // If either first name or last name have been patched, the display name is updated accordingly
        if (req.data.firstName || req.data.lastName) {
            const user = await cds.tx(req).run(SELECT.one.from(srv_namespace + 'User.drafts', { userName: req.data.userName, origin_originKey: req.data.origin_originKey }).columns(['firstName', 'lastName']).where({ IsActiveEntity: false }));
            const displayName = (req.data.firstName) ? req.data.firstName + ' ' + ((user.lastName === null) ? '' : user.lastName) : ((user.firstName === null) ? '' : user.firstName) + ' ' + req.data.lastName;
            await cds.tx(req).run(UPDATE.entity(srv_namespace + 'User.drafts', { userName: req.data.userName, origin_originKey: req.data.origin_originKey }).with({ displayName: displayName }).where({ IsActiveEntity: false }));
        }
    } catch (err) {
        req.error(err.code, err.message);
    }
    return req;
}

// User's AFTER CREATE event handler 
async function afterCreateUser(data, req) {
    try {
        // Read authorizations from SQLite in-memory DB
        const groups = await readAuthorizations(data.authorizations, req);

        // Search for user in BTP based on User Name
        const btpId = await findUser(data.userName, data.origin_originKey);
        if (btpId === null) {
            // If user does not exist in BTP, then it's created and the correponding ID in BTP
            // is updated in the SQLite in-memory DB. The users' cache is also updated. 
            const user = {
                externalId: data.externalId,
                userName: data.userName,
                name: {
                    familyName: data.lastName,
                    givenName: data.firstName
                },
                emails: [
                    {
                        value: data.eMail,
                        primary: true
                    }
                ],
                active: data.isActive,
                verified: data.isVerified,
                origin: data.origin_originKey
            };

            const btpId = await createUser(user, groups);
            await cds.tx(req).run(UPDATE.entity(db_namespace + 'User', { userName: data.userName, origin_originKey: data.origin_originKey }).with({ btpId: btpId }));
        } else {
            // If the user exists in BTP, then it's data is updated in BTP (properties and groups - role collections),
            // and, as the entity in the SQLite in-memory DB has null BTP ID, it's updated with the user ID from BTP
            const user = {
                id: btpId,
                externalId: data.externalId,
                name: {
                    familyName: data.lastName,
                    givenName: data.firstName
                },
                emails: [
                    {
                        value: data.eMail,
                        primary: true
                    }
                ],
                active: data.isActive,
                verified: data.isVerified,
                origin: data.origin_originKey
            };

            await updateUser(user, groups);
            await cds.tx(req).run(UPDATE.entity(db_namespace + 'User', { userName: data.userName, origin_originKey: data.origin_originKey }).with({ btpId: btpId }));
        }
    } catch (err) {
        req.error(err.code, err.message);
    }
}

// User's AFTER UPDATE event handler
async function afterUpdateUser(data, req) {
    try {
        // Read authorizations from SQLite in-memory DB
        const groups = await readAuthorizations(data.authorizations, req);

        // Build user object for update as per the payload of the API
        const user = {
            id: data.btpId,
            externalId: data.externalId,
            name: {
                familyName: data.lastName,
                givenName: data.firstName
            },
            emails: [
                {
                    value: data.eMail,
                    primary: true
                }
            ],
            active: data.isActive,
            verified: data.isVerified,
            origin: data.origin_originKey
        };

        // Update the user in BTP
        await updateUser(user, groups);
    } catch (err) {
        req.error(err.code, err.message);
    }
}

// User's BEFORE DELETE event handler
async function beforeDeletUser(req) {
    try {
        // Fetch user's groups (role collections)
        const user = await cds.tx(req).run(SELECT.one.from(db_namespace + 'User', { userName: req.data.userName, origin_originKey: req.data.origin_originKey }).columns(['btpId']));
        const userAuth = await cds.tx(req).run(SELECT.from(db_namespace + 'UserAuthorization').columns(['authorization_ID as ID']).where({ parent_userName: req.data.userName }).and({ parent_origin_originKey: req.data.origin_originKey }));
        const auths = [];
        userAuth.forEach(auth => { auths.push(auth.ID) });
        const groups = await cds.tx(req).run(SELECT.from(db_namespace + 'Authorization').columns(['name']).where({ ID: { 'IN': auths } }));

        // Unassign all role collections (groups) from user
        await deleteUser(user.btpId, groups);
    } catch (err) {
        req.error(err.code, err.message);
    }
}

// refreshData function handler
async function refreshData(req) {
    try {
        // Reset control flag
        delete tenants[req.tenant];

        // Reload data
        await getData(req);

        return true;
    } catch (err) {
        req.error(err.code, err.message);
    }
}

// Exported functions
module.exports = {
    userInfo,
    getData,
    beforeNewUser,
    beforeSaveUser,
    beforePatchUser,
    afterCreateUser,
    afterUpdateUser,
    beforeDeletUser,
    refreshData
}