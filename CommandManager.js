
var _ = require('underscore');

var D = null;

// *************************************************************************************************

exports.CommandManager = function(container) {
    this.history = [];
    this.stack = [this.history];
}

exports.CommandManager.prototype = {
    isDoing: false,
    historyCursor: -1,
    collapseTime: 550,

    // ---------------------------------------------------------------------------------------------

    get canUndo() {
        return this.historyCursor >= 0;
    },

    get canRedo() {
        return this.historyCursor < this.history.length-1;
    },

    get nextUndoCommand() {
        return this.historyCursor >= 0 ? this.history[this.historyCursor].command : null;
    },

    get nextRedoCommand() {
        return this.historyCursor < this.history.length-1
            ? this.history[this.historyCursor+1].command : null;
    },

    get nextUndoTitle() {
        var state = this.historyCursor >= 0 ? this.history[this.historyCursor] : null;
        if (state) {
            while (state && state.history) {
                state = state.history[0];
            }
            return state.title ? state.title() : state.command.title;
        }
    },

    get nextRedoTitle() {
        var state = this.historyCursor < this.history.length-1
            ? this.history[this.historyCursor+1] : null;
        if (state) {
            while (state && state.history) {
                state = state.history[0];
            }
            return state.title ? state.title() : state.command.title;
        }
    },

    // ---------------------------------------------------------------------------------------------

    begin: function(onCancel) {
        var newHistory = [];
        var state = {history: newHistory, onCancel: onCancel};
        this.pushState(state);

        this.stack.push(newHistory);
        D&&D('begin', this.stack.length);

        this.history = newHistory;
    },

    end: function() {
        this.stack.pop();
        D&&D('end', this.stack.length);

        this.history = this.stack[this.stack.length-1];

        var state = this.history[this.history.length-1];
        var onCancel = state.onCancel;
        state.onCancel = null;
        return onCancel;
    },

    undoCommand: function() {
        if (this.isDoing) return;
        this.isDoing = true;

        if (this.stack.length > 1) {
            while (this.stack.length > 1) {
                var onCancel = this.end();
                if (!onCancel || !onCancel()) {
                    var state = this.history[this.history.length-1];
                    for (var i = state.history.length-1; i >= 0; --i) {
                        this._undoState(state.history[i]);
                    }
                }
            }
            // Discard the state for the incomplete history so it can't be redone
            this.history.pop();
            --this.historyCursor;
        } else {
            var state = this.history[this.historyCursor--];
            this._undoState(state);
        }
        this.isDoing = false;
    },

    redoCommand: function() {
        if (this.isDoing) return;
        this.isDoing = true;

        if (this.stack.length == 1) {
            var state = this.history[++this.historyCursor];
            this._redoState(state);
        }
        this.isDoing = false;
    },

    pushState: function(state) {
        var now = Date.now();
        state.time = now;

        if (!this._clipHistory() && this.history.length) {
            var top = this.history[this.history.length-1];
            if (now - top.time < this.collapseTime) {
                if (state.command && top.command && state.command.id == top.command.id) {
                    return this._collapseStates(state, top);
                }
            }
        }

        this.history.push(state);
        D&&D('do', state.command ? state.command.id : '',
             this.historyCursor + '/' + this.stack.length);
    },

    // ---------------------------------------------------------------------------------------------

    _clipHistory: function() {
        if (this.stack.length == 1) {
            var cursor = ++this.historyCursor;
            if (cursor < this.history.length) {
                this.history = this.stack[0] = this.history.slice(0, cursor);
                return true;
            }
        }
    },

    _undoState: function(state) {
        D&&D('undo', state.command ? state.command.id : '',
             this.historyCursor + '/' + this.stack.length);

        if (state.command) {
            state.command.undo(state);
        } else if (state.history) {
            for (var i = state.history.length-1; i >= 0; --i) {
                this._undoState(state.history[i]);
            }
        }        
    },

    _redoState: function(state) {
        D&&D('redo', state.command ? state.command.id : '',
             this.historyCursor + '/' + this.stack.length);

        if (state.command) {
            state.command.redo(state);
        } else if (state.history) {
            for (var i = 0, l = state.history.length; i < l; ++i) {
                this._redoState(state.history[i]);
            }
        }        
    },

    _collapseStates: function(state, topState) {
        D&&D('collapse', state.command.id);

        if (this.stack.length == 1) {
            --this.historyCursor;
        }
        
        topState.time = state.time;
        if (state.substates) {
            for (var i = 0, l = state.substates.length; i < l; ++i) {
                topState.substates[i].redo = state.substates[i].redo;                        
            }
        } else {
            topState.redo = state.redo;
        }
    },
};

// *************************************************************************************************

exports.CommandMap = function(self, manager, definitions) {
    this.manager = manager;

    var map = this.map = {};
    var conditionMap = this.conditionMap = {};

    for (var commandName in definitions) {
        var definition = definitions[commandName];
        var implementation = self[commandName];

        var command = CMD(implementation, self, definition);
        command.id = commandName;
        command.manager = manager;
        map[commandName] = command
        
        if (command.hasUndo) {
            var wrapped = wrapUndoable(command);
            wrapped.save = _.bind(command.save, command);
            wrapped.each = _.bind(command.each, command);
            self[commandName] = wrapped;
        }

        var conditionId = command.conditionId;
        if (conditionId) {
            if (conditionId in conditionMap) {
                conditionMap[conditionId].commands.push(command)
            } else {
                conditionMap[conditionId] = {validate: command._validate, commands: [command]};
            }
        }
    }
};

function wrapUndoable(command) {
    return function() {
        command.execute.apply(command, arguments);
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
                if (command.isSearchable) {
                    var title = command.title;
                    if (title) {
                        var m = pattern.exec(title);
                        if (m) {
                            matches.push({index: m.index, command: command});
                        }
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

var Command = 
exports.Command = function(properties) {
    this.self = properties.self || this;

    this._title = properties.title;
    this._value = properties.value;
    this._className = properties.className;

    this._execute = properties.execute;
    this._save = properties.save;
    this._pre = properties.pre;
    this._post = properties.post;
    this._redo = properties.redo;
    this._undo = properties.undo;
    this._children = properties.children;
    this._actions = properties.actions;
    
    this._hover = properties.hover;
    this._copy = properties.copy;

    this.hasUndo = !!properties.undo || !!properties.redo;
    this.hasChildren = !!properties.children;
    this.hasHover = !!properties.hover;
    
    if ('isSearchable' in properties) {
        this.isSearchable = properties.isSearchable;    
    } else {
        var doer = this._execute || this._save || this._redo;
        this.isSearchable = doer && !doer.length;        
    }

    if (typeof(properties.validate) == 'string') {
        this.conditionId = properties.validate;
        this._validate = _.bind(this.self[properties.validate], this.self);
    } else {
        this.conditionId = null;
        this._validate = properties.validate;
    }
}

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
            var state = this.save.apply(this, arguments);
            if (this._pre) {
                this._pre.call(this.self);
            }
            this._redo.apply(this.self, state.redo);
            if (this._post) {
                this._post.call(this.self);
            }
        } else if (this._execute) {
            return this._execute.apply(this.self, arguments);
        }
    },

    save: function() { 
        if (this.hasUndo) {
            var state = this._save
                ? this._save.apply(this.self, arguments)
                : {redo: Array.prototype.slice.call(arguments, 0) };
            state.command = this;
            this.manager.pushState(state);
            return state;
        }
    },

    each: function(zippedArgs, saveOnly) {
        if (this.hasUndo) {
            var save = this._save;
            var self = this.self;
            var substates = _.map(zippedArgs, function(args) {
                return save ? save.apply(self, args) : {redo: args};
            });

            var state = {command: this, substates: substates};
            this.manager.pushState(state);

            if (!saveOnly) {
                this.redo(state);
            }
        }
    },

    undo: function(state) {
        if (this.hasUndo) {
            if (this._pre) {
                this._pre.call(this.self, true);
            }

            var self = this.self;
            var doer = this._undo || this._redo;
            if (state.substates) {
                _.each(state.substates, function(substate) {
                    doer.apply(self, substate.undo || substate.redo);
                });
            } else {
                doer.apply(self, state.undo || state.redo);
            }

            if (this._post) {
                this._post.call(this.self, true);
            }            
        }
    },

    redo: function(state) {
        if (this.hasUndo) {
            if (this._pre) {
                this._pre.apply(this.self);
            }

            var self = this.self;
            var doer = this._redo;
            if (state.substates) {
                _.each(state.substates, function(substate) {
                    doer.apply(self, substate.redo);
                });
            } else {
                doer.apply(self, state.redo);
            }

            if (this._post) {
                this._post.apply(this.self);
            }            
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
