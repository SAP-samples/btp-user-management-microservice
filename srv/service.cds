using user.mngr.db as db from '../db/schema';

namespace user.mngr.srv;

service UserMngrService @(
    path     : 'usr-mngr',
    requires : 'UserAdmin'
) {
    @odata.draft.enabled
    entity User as projection on db.User actions {
        @cds.odata.bindingparameter.collection
        action refreshData() returns Boolean;
    };
}
