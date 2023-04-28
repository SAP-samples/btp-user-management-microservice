using user.mngr.srv.UserMngrService as srv from './service';

annotate srv.User with @(UI : {
    Identification  : [{Value : userName}],
    HeaderInfo      : {
        $Type          : 'UI.HeaderInfoType',
        TypeName       : 'User',
        TypeNamePlural : 'Users',
        Title          : {
            $Type : 'UI.DataField',
            Value : userName
        },
        Description    : {
            $Type : 'UI.DataField',
            Value : displayName
        }
    },
    SelectionFields : [
        externalId,
        userName,
        firstName,
        lastName
    ],
    LineItem        : [
        {
            $Type : 'UI.DataField',
            Value : externalId
        },
        {
            $Type : 'UI.DataField',
            Value : userName
        },
        {
            $Type : 'UI.DataField',
            Value : displayName
        },
        {
            $Type : 'UI.DataField',
            Value : eMail
        },
        {
            $Type : 'UI.DataField',
            Value : origin.name
        },
        {
            $Type : 'UI.DataField',
            Value : isActive
        },
        {
            $Type : 'UI.DataField',
            Value : isVerified
        },
        {
            $Type              : 'UI.DataFieldForAction',
            Label              : 'Refresh',
            Action             : 'user.mngr.srv.UserMngrService.refreshData',
            InvocationGrouping : #Isolated
        }
    ]
});

annotate srv.User with actions {
    refreshData @(
        cds.odata.bindingparameter.name: '_it',
        Core.OperationAvailable : true,
        Common                          : {
            IsActionCritical : false,
            SideEffects      : {
                $Type          : 'Common.SideEffectsType',
                TargetEntities : ['_it']
            }
        }
    )
};

annotate srv.User with @(UI : {
    FieldGroup #General : {
        $Type : 'UI.FieldGroupType',
        Data  : [
            {
                $Type : 'UI.DataField',
                Value : externalId,
            },
            {
                $Type : 'UI.DataField',
                Value : firstName,
            },
            {
                $Type : 'UI.DataField',
                Value : lastName,
            },
            {
                $Type : 'UI.DataField',
                Value : eMail,
            },
            {
                $Type : 'UI.DataField',
                Value : isActive,
            },
            {
                $Type : 'UI.DataField',
                Value : isVerified,
            },
            {
                $Type : 'UI.DataField',
                Value : origin_originKey,
            }
        ]
    },
    Facets              : [
        {
            $Type  : 'UI.ReferenceFacet',
            ID     : 'General',
            Label  : 'General',
            Target : '@UI.FieldGroup#General',
        },
        {
            $Type  : 'UI.ReferenceFacet',
            Label  : 'Authorizations',
            ID     : 'Authorizations',
            Target : 'authorizations/@UI.LineItem#Authorizations',
        }
    ]
});

annotate srv.UserAuthorization with @(UI : {
    HeaderInfo               : {
        $Type          : 'UI.HeaderInfoType',
        TypeName       : 'Authorization',
        TypeNamePlural : 'Authorizations',
        Title          : {
            $Type : 'UI.DataField',
            Value : authorization.name
        },
        Description    : {
            $Type : 'UI.DataField',
            Value : authorization.description
        }
    },
    LineItem #Authorizations : [
        {
            $Type : 'UI.DataField',
            Value : authorization_ID
        },
        {
            $Type : 'UI.DataField',
            Value : authorization.description
        }
    ]
});

annotate srv.UserAuthorization with @(UI : {
    FieldGroup #General : {
        $Type : 'UI.FieldGroupType',
        Data  : [
            {
                $Type : 'UI.DataField',
                Value : authorization_ID,
            },
            {
                $Type : 'UI.DataField',
                Value : authorization.description,
            }
        ]
    },
    Facets              : [{
        $Type  : 'UI.ReferenceFacet',
        ID     : 'General',
        Label  : 'General',
        Target : '@UI.FieldGroup#General',
    }]
});

annotate srv.User with {
    userName    @(
        title               : 'User Name',
        Common.FieldControl : #Mandatory
    );
    externalId  @(
        title               : 'External ID',
        Common.FieldControl : #Mandatory
    );
    btpId       @(
        title     : 'BTP ID',
        UI.Hidden : true
    );
    firstName   @(
        title               : 'First Name',
        Common.FieldControl : #Mandatory
    );
    lastName    @(
        title               : 'Last Name',
        Common.FieldControl : #Mandatory
    );
    displayName @(title : 'Name')  @readonly;
    eMail       @(
        title               : 'e-Mail',
        Common.FieldControl : #Mandatory
    );
    origin      @(
        title  : 'Origin IdP',
        Common : {
            Text                     : {
                $value                 : origin.name,
                ![@UI.TextArrangement] : #TextOnly
            },
            ValueList                : {
                $Type          : 'Common.ValueListType',
                CollectionPath : 'IdP',
                Parameters     : [{
                    $Type             : 'Common.ValueListParameterInOut',
                    LocalDataProperty : origin_originKey,
                    ValueListProperty : 'originKey',
                }]
            },
            ValueListWithFixedValues : true,
            FieldControl             : #Mandatory
        }
    );
    isActive    @(title : 'Is Active');
    isVerified  @(title : 'Is Verified');
};

annotate srv.User @(Common.SideEffects #NameChanged : {
    $Type            : 'Common.SideEffectsType',
    SourceProperties : [
        firstName,
        lastName
    ],
    TargetProperties : ['displayName']
});

annotate srv.UserAuthorization with {
    parent        @(
        title     : 'User Name',
        UI.Hidden : true
    );
    authorization @(
        title  : 'Authorization',
        Common : {
            Text                     : {
                $value                 : authorization.name,
                ![@UI.TextArrangement] : #TextOnly
            },
            ValueList                : {
                $Type          : 'Common.ValueListType',
                CollectionPath : 'Authorization',
                Parameters     : [{
                    $Type             : 'Common.ValueListParameterInOut',
                    LocalDataProperty : authorization_ID,
                    ValueListProperty : 'ID',
                }, ],
            },
            ValueListWithFixedValues : true,
            FieldControl             : #Mandatory
        }
    );
};

annotate srv.UserAuthorization @(Common.SideEffects #AuthorizationChanged : {
    $Type            : 'Common.SideEffectsType',
    SourceProperties : [authorization_ID],
    TargetEntities   : [authorization]
});

annotate srv.UserAuthorization @(Capabilities : {
    SearchRestrictions : {
        $Type      : 'Capabilities.SearchRestrictionsType',
        Searchable : false
    },
    Insertable         : true,
    Deletable          : true,
    Updatable          : true
});

annotate srv.IdP with {
    originKey @(
        title       : 'IdP Key',
        Common.Text : {
            $value                 : name,
            ![@UI.TextArrangement] : #TextOnly
        }
    );
    name      @(title : 'Origin IdP');
};

annotate srv.Authorization with {
    ID          @(
        title       : 'Authorization',
        Common.Text : {
            $value                 : name,
            ![@UI.TextArrangement] : #TextOnly
        }
    );
    name        @(
        title     : 'Authorization',
        Ui.Hidden : true
    )           @readonly;
    description @(title : 'Description')  @readonly;
};
