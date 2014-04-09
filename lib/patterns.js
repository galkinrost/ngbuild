exports.directive={
    type: 'CallExpression',
    callee: { type: 'MemberExpression',
        object: { type: 'CallExpression'},
        property: { type: 'Identifier', name: 'directive' }
    }
};

exports.route={
    "type": "FunctionExpression",
    "params": [
        {
            "type": "Identifier",
            "name": "$routeProvider"
        }
    ],
    '**': {
        "type": "CallExpression",
        "callee": {
            "type": "MemberExpression",
            "property": {
                "type": "Identifier",
                "name": "when"
            }
        }
    }
};

exports.module={
    type: 'CallExpression',
    callee: { type: 'MemberExpression',
        object: { type: 'Identifier', name: 'angular' },
        property: { type: 'Identifier', name: 'module' }
    },
    arguments: [
        { type: 'Literal'},
        { type: 'ArrayExpression' }
    ]
};