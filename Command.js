
var _ = require('underscore');

// *************************************************************************************************

function Command(properties) {
    this._title = properties.title;
    this._value = properties.value;
    this._className = properties.className;

    this._execute = properties.execute;
    this._redo = properties.redo;
    this._undo = properties.undo;
    this._save = properties.save;
    this._children = properties.children;
    this._actions = properties.actions;
    
    this._hover = properties.hover;
    this._copy = properties.copy;

    this.hasUndo = !!properties.undo || !!properties.redo;
    this.hasChildren = !!properties.children;
    this.hasHover = !!properties.hover;
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
    get value() { 
        if (this._value) {
            return this._value.apply(this.self);
        }
    },    

    get title() { 
        if (typeof(this._title) == 'function') {
            return this._title.apply(this.self, [this.value]);
        } else {
            return this._title;
        }
    },

    get caption() { 
        if (typeof(this._caption) == 'function') {
            return this._caption.apply(this.self, [this.value]);
        } else {
            return '';
        }
    },    

    get className() { 
        if (typeof(this._className) == 'function') {
            return this._className.apply(this.self, [this.value]);
        } else {
            return this._className;
        }
    },    

    get actions() { 
        if (typeof(this._actions) == 'function') {
            return this._actions.apply(this.self, [this.value]);
        } else if (this._actions instanceof Array) {
            return expandCommands(this._actions, this.self);
        }
    },    

    get children() { 
        if (typeof(this._children) == 'function') {
            return this._children.apply(this.self, [this.value]);
        } else if (this._children instanceof Array) {
            return expandCommands(this._children, this.self);
        }
    },    

    // ---------------------------------------------------------------------------------------------
    
    validate: function() { 
        if (this._validate) {
            return this._validate.apply(this.self, [this.value]);
        } else {
            return true;
        }
    },    

    execute: function() { 
        if (this.hasUndo) {
            var state = this._save.apply(this.self, arguments);
            state.command = this;
            this.container.pushHistory(state);

            this._redo.apply(this.self, state.redo);
        } else if (this._execute) {
            return this._execute.apply(this.self, arguments);
        }
    },

    undo: function(state) {
        if (this.hasUndo) {
            var doer = this._undo || this._redo;
            doer.apply(this.self, state);
        }
    },

    redo: function(state) {
        if (this.hasUndo) {
            this._redo.apply(this.self, state);
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

exports.CommandMap = function(self, container, definitions) {
    this.container = container;

    var map = this.map = {};
    var conditionMap = this.conditionMap = {};

    for (var commandName in definitions) {
        var definition = definitions[commandName];
        var implementation = self[commandName];

        var command = CMD(implementation, self, definition);
        command.id = commandName;
        command.container = container;
        map[commandName] = command

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
    find: function(name) {
        var found = this.nextMap ? this.nextMap.find(name) : null;
        if (!found && name in this.map) {
            found = this.map[name]
        }
        return found;
    },

    match: function(pattern) {
        var matches = [];
        matchMap(this);
        matches.sort(function(a,b) { return a.index > b.index ? 1 : -1; });
        return _.map(matches, function(m) { return m.command; });

        function matchMap(map) {
            if (map.nextMap) {
                matchMap(map.nextMap);
            }
    
            for (var name in map.map) {
                var command = map.map[name];
                var title = command.title;
                if (title) {
                    var m = pattern.exec(title);
                    if (m) {
                        matches.push({index: m.index, command: command});
                    }
                }
            }
        }
    },

    add: function(map) {
        if (this.lastMap) {
            this.lastMap.nextMap = map;
        } else {
            this.nextMap = this.lastMap = map;
        }
        this.lastMap = map;
    },

    remove: function(map) {
        var previous;
        for (var sibling = this.nextMap; sibling; sibling = sibling.nextMap) {
            if (sibling == map) {
                if (previous) {
                    previous.nextMap = sibling.nextMap;
                } else {
                    this.nextMap = sibling.nextMap;
                }
                if (this.lastMap == map) {
                    this.lastMap = previous;
                }
            }
            previous = sibling;
        }
    },
};

// *************************************************************************************************

var CMD =
exports.CMD = function(implementation, self, properties) {
    var props = {self: self};
    if (properties) {
        props = _.extend(props, properties);
    }        
    if (typeof(implementation) == 'function') {
        props.execute = implementation;
    } else {
        props = _.extend(props, implementation);
    }

    return new Command(props);
}

var SEPARATOR =
exports.CMD.SEPARATOR = {};

// *************************************************************************************************

function expandCommands(menuData, self) {
    var commands = [];
    var needSeparator = false;
    for (var i = 0, l = menuData.length; i < l; ++i) {
        var name = menuData[i];
        var children = menuData[i+1];
        if (children instanceof Array) {
            if (needSeparator) {
                commands.push(SEPARATOR);
                needSeparator = false;
            }
            var command = expandCommand(name, children);
            commands.push(command);
            ++i;
        } else if (name == '-') {
            needSeparator = true;
        } else  {
            var command = self.cmd(undefined, name);
            if (command) {
                if (needSeparator) {
                    commands.push(SEPARATOR);
                    needSeparator = false;
                }
                commands.push(command);
            }
        }
    }
    return commands;

    function expandCommand(name, children) {
        return CMD(null, self, {
            title: name,
            children: children,
        });
    }
}
