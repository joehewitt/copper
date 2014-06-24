
var _ = require('underscore');
var subclass = require('fool').subclass;

// *************************************************************************************************

function Command(base) {
    this.base = base;
}

Command.prototype = {
    title: null,
    className: null,
    value: null,
    actions: null,
    children: null,
    isCollapsible: false,
    isSearchable: true,
    condition: null,
    related: null,
    undo: null,
    redo: null,

    get sentence() {
        return [this.title];
    },

    get hasChildren() {
        return this.__lookupGetter__('children') || this.children;
    },

    get hasUndo() {
        return !!this.undo;
    },

    // ---------------------------------------------------------------------------------------------

    doIt: function(args) {
        if (this.hasUndo) {
            var instance = this.fold(args);
            this.manager.doCommand(instance);
            return instance;
        } else {
            this.execute(args);
        }
    },

    update: function() {
        this.manager.updateCommand(this);
    },

    fold: function(properties, defs) {
        if (!defs) {
            defs = properties;
            properties = null;
        }
        if (!defs) {
            defs = {};
        }

        defs.__proto__ = this;
        if (properties) {
            defs.properties = _.extend({}, this.properties, properties);        
        }
        if (defs.properties) {
            for (var name in defs.properties) {
                var type = defs.properties[name];
                var value = defs[name];
                type.assign(defs, name, value);
            }
        }
        return defs;
    },

    // ---------------------------------------------------------------------------------------------
    
    serialize: function() {
    },

    restore: function(serialized) {
    },

    validate: function() { 
        if (this.condition) {
            return this.manager.validateCondition(this.map.name + '.' + this.condition);
        } else {
            return true;            
        }
    },

    execute: function() { 
    },

    collapse: function(other) {
    },

    pre: function() {
    },

    post: function() {
    },

    hover: function(hovered) {
    },

    copy: function(doubleTap) {
    },
};

exports.Command = Command;

var baseCommand = new Command();
exports.CMD = _.bind(baseCommand.fold, baseCommand);

// *************************************************************************************************

exports.CMDGROUP = function() {
    var commands = new Array(arguments.length);
    for (var i = 0, l = arguments.length; i < l; ++i) {
        commands[i] = arguments[i];
    }
    var manager = commands[0].manager;
    return function() {
        manager.begin();
        for (var i = 0, l = commands.length; i < l; ++i) {
            commands[i].doIt();
        }
        manager.end();
    }
}
