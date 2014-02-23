
var _ = require('underscore');

// *************************************************************************************************

function Command(properties) {
    this._title = properties.title;
    this._className = properties.className;
    this._command = properties.command;
    this._children = properties.children;
    this._actions = properties.actions;
    this._hover = properties.hover;
    this._caption = properties.caption;
    this._copy = properties.copy;
    this.hasCommand = properties.command || false;
    this.hasChildren = properties.children || false;
    this.hasHover = properties.hover || false;
    this.isPrompt = properties.isPrompt || false;
    this.self = properties.self || this;

    if (typeof(properties.validate) == 'string') {
        this.conditionId = properties.validate;
        this._validate = _.bind(this.self[properties.validate], this.self);
    } else {
        this.conditionId = null;
        this._validate = properties.validate;
    }
}

exports.Command = Command;

Command.prototype = {
    get title() { 
        if (typeof(this._title) == 'function') {
            return this._title.apply(this.self);
        } else {
            return this._title;
        }
    },

    get caption() { 
        if (typeof(this._caption) == 'function') {
            return this._caption.apply(this.self);
        } else {
            return '';
        }
    },    

    get className() { 
        if (typeof(this._className) == 'function') {
            return this._className.apply(this.self);
        } else {
            return this._className;
        }
    },    

    get actions() { 
        if (this._actions) {
            return this._actions.apply(this.self);
        }
    },    

    get children() { 
        if (this._children) {
            return this._children.apply(this.self);
        }
    },    

    validate: function() { 
        if (this._validate) {
            return this._validate.apply(this.self);
        } else {
            return true;
        }
    },    

    command: function() { 
        if (this._command) {
            return this._command.apply(this.self, arguments);
        }
    },

    hover: function(hovered) {
        if (this._hover) {
            this._hover.apply(this.self, [hovered]);
        }
    },

    copy: function(doubleTap) {
        if (this._copy) {
            return this._copy.apply(this.self, [doubleTap]);
        }
    }    
}

// *************************************************************************************************

exports.CommandMap = function(self, definitions) {
    var commandSet = this.commandSet = [];
    var conditionMap = this.conditionMap = {};

    for (var commandName in definitions) {
        var definition = definitions[commandName];
        var fn = self[commandName];
        
        var command = CMD(fn, self, definition);
        command.id = commandName;

        this[commandName] = command
        commandSet.push(command);

        var conditionId = command.conditionId;
        if (conditionId) {
            if (conditionId in conditionMap) {
                conditionMap[conditionId].commands.push(command)
            } else {
                conditionMap[conditionId] = {validate: command._validate, commands: [command]};
            }
        }
    }
}

exports.CommandMap.prototype = {
};

// *************************************************************************************************

var CMD =
exports.CMD = function(command, self, properties) {
    var props = {command: command, self: self};
    if (properties) {
        props = _.extend(props, properties);
    }
    return new Command(props);
}

exports.CMD.SEPARATOR = {};
