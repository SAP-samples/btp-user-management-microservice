namespace user.mngr.db;

entity User {
    key userName       : String;
        btpId          : String;
        externalId     : String;
        firstName      : String;
        lastName       : String;
        displayName    : String;
        eMail          : String;
        origin         : Association to one IdP;
        authorizations : Composition of many UserAuthorization
                             on authorizations.parent = $self;
        isActive       : Boolean;
        isVerified     : Boolean;
};

entity UserAuthorization {
    key parent        : Association to one User;
    key authorization : Association to one Authorization;
};

@readonly
@cds.autoexpose
entity IdP {
    key originKey : String;
        name      : String;
}

@readonly
@cds.autoexpose
entity Authorization {
    key ID          : Integer;
        name        : String;
        description : String;
}
