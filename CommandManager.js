
var $ = require('ore'),
    _ = require('underscore');

// var D = null;

// *************************************************************************************************

exports.CommandManager = function(container) {
    this.container = container;
    this.history = [];
    this.groupStack = [];
    this.maps = {};
}

exports.CommandManager.prototype = {
    isDoing: false,
    historyCursor: -1,
    collapseTime: 550,
    
    // ---------------------------------------------------------------------------------------------

    didCommand: $.event.create(true),
    redidCommand: $.event.create(true),
    undidCommand: $.event.create(true),
    collapsedCommand: $.event.create(true),
    updatedCommand: $.event.create(true),

    // ---------------------------------------------------------------------------------------------

    createMap: function(name, creator, args) {
        var defs = {};
        var conditions = {};
        var allArgs = [defs, conditions];
        allArgs.push.apply(allArgs, args);
        creator.apply(this, allArgs);

        var commandMap = new CommandMap(name, defs, conditions, this);
        this.maps[name] = commandMap;
        return commandMap;
    },

    findMap: function(name) {
        return this.maps[name];
    },

    validateCondition: function(conditionId, subtree) {
        if (!subtree) {
            subtree = this.container;
        }
        var condition = this.findCondition(conditionId);
        if (condition) {
            return this._validateCondition(condition, subtree);
        }
    },

    _validateCondition: function(condition, subtree) {
        var truth = condition && condition.validate ? condition.validate() : false;
        var commands = condition.commands;
        for (var i = 0, l = commands.length; i < l; ++i) {
            var command = commands[i];
            subtree.query('*[command="' + command.id + '"]').each(function(target) {
                target.cssClass('disabled', !truth);
            });
        }
        return truth;
    },

    validateConditions: function(subtree) {
        var commands = this.container.commands;
        if (commands) {
            if (!subtree) {
                subtree = this.container;
            }
            for (var name in commands.conditionMap) {
                var condition = commands.conditionMap[name];
                this._validateCondition(condition, subtree);
            }
        }
    },

    serialize: function() {
        var commands = [];
        for (var i = 0, l = this.history.length; i < l; ++i) {
            var command = this.history[i];
            var serialized = command.serialize();
            serialized.id = command.id;
            serialized.time = command.time;
            commands[commands.length] = serialized;
        }
        return {cursor: this.historyCursor, commands: commands};
    },

    restore: function(serialized) {
        var commands = serialized.commands;

        this.historyCursor = serialized.cursor >= commands.length
                             ? commands.length-1
                             : serialized.cursor;

        for (var i = 0, l = commands.length; i < l; ++i) {
            var serialCommand = commands[i];
            var commandType = this.find(serialCommand.id);
            if (commandType) {
                var command = commandType.restore(serialCommand);
                command.id = serialCommand.id;
                command.time = serialCommand.time;
                this.history[this.history.length] = command;                
            }
        }
    },

    find: function(commandId) {
        var parts = commandId.split('.');
        var mapName = parts[0];
        var commandName = parts[1];
        var map = this.maps[mapName];
        if (map) {
            return map.find(mapName, commandName);
        }
    },

    findCondition: function(conditionId) {
        var parts = conditionId.split('.');
        var mapName = parts[0];
        var conditionName = parts[1];
        var map = this.maps[mapName];
        if (map) {
            return map.findCondition(mapName, conditionName);
        }
    },

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
        var command = this.historyCursor >= 0 ? this.history[this.historyCursor] : null;
        if (command) {
            while (command && command.history) {
                command = command.history[0];
            }
            return command.title;
        }
    },

    get nextRedoTitle() {
        var command = this.historyCursor < this.history.length-1
            ? this.history[this.historyCursor+1] : null;
        if (command) {
            while (command && command.history) {
                command = command.history[0];
            }
            return command.title;
        }
    },

    // ---------------------------------------------------------------------------------------------

    begin: function(onCancel) {
        this.groupStack[this.groupStack.length] = {last: null, onCancel: onCancel};

        D&&D('begin', this.groupStack.length);
    },

    end: function() {
        var group = this.groupStack.pop();
        D&&D('end', this.groupStack.length);
        return group.onCancel;
    },

    doCommand: function(command) {
        var now = Date.now();
        var collapseCommand = this.shouldCollapse(command, now);
        if (collapseCommand) {
            D&&D('collapse', command.id);

            --this.historyCursor;
            this.collapseCommand(collapseCommand, command);
        } else {
            command.time = now;

            command.pre();
            if (command.save && command.save() === true) {
                return;
            }

            var related = !!command.related;
            if (related) {
                --this.historyCursor;
                this.begin();
                command.related();
                ++this.historyCursor;
            }

            for (var i = 0, l = this.groupStack.length; i < l; ++i) {
                var group = this.groupStack[i];
                if (group.last) {
                    group.last.next = command;
                    command.previous = group.last;
                }
                group.last = command;
            }

            this.history[this.history.length] = command;        
            D&&D('do', command.id, this.historyCursor + '/' + this.history.length
                  + '/' + this.groupStack.length);

            command.redo();
            command.post();

            this.didCommand({command: command, cursor: this.historyCursor});

            if (related) {
                this.end();
            }
        }
    },

    collapseCommand: function(collapseCommand, command, now) {
        collapseCommand.time = now || Date.now();
        collapseCommand.pre();
        collapseCommand.collapse(command);
        collapseCommand.post();

        this.collapsedCommand({command: collapseCommand, cursor: this.historyCursor});
    },

    updateCommand: function(command, now) {
        command.time = now || Date.now();
        command.post();

        this.updatedCommand({command: command, cursor: this.historyCursor});
    },

    undoCommand: function(shouldntUndoGroups) {
        if (this.isDoing) return;
        this.isDoing = true;

        if (this.groupStack.length) {
            while (this.groupStack.length > 1) {
                var onCancel = this.end();
                if (onCancel) {
                    onCancel();
                }
            }
        }

        while (this.historyCursor >= 0) {
            var command = this.history[this.historyCursor--];
            this._undoState(command);
            command = command.previous;
            if (!command || shouldntUndoGroups) {
                break;
            }
        }

        this.isDoing = false;
    },

    redoCommand: function(shouldntUndoGroups) {
        if (this.isDoing) return;
        this.isDoing = true;

        while (1) {
            var command = this.history[++this.historyCursor];
            this._redoState(command);
            command = command.next;
            if (!command || shouldntUndoGroups) {
                break;
            }
        }

        this.isDoing = false;
    },

    shouldCollapse: function(command, now) {
        if (!this._clipHistory() && this.history.length && command.isCollapsible) {
            var topCommand = this.history[this.history.length-1];
            if (topCommand && command.id == topCommand.id) {
                if (now - topCommand.time < this.collapseTime) {
                    return topCommand;
                }
            }
        }        
    },

    // ---------------------------------------------------------------------------------------------

    _clipHistory: function() {
        var cursor = ++this.historyCursor;
        if (cursor < this.history.length) {
            this.history = this.history.slice(0, cursor);
            return true;
        }
    },

    _undoState: function(command) {
        D&&D('undo', command.id, this.historyCursor + '/' + this.history.length
              + '/' + this.groupStack.length);

        if (command.history) {
            for (var i = command.history.length-1; i >= 0; --i) {
                this._undoState(command.history[i]);
            }
        } else {
            command.pre();
            command.undo();
            command.post();
        }        

        this.undidCommand({command: command, cursor: this.historyCursor});
    },

    _redoState: function(command) {
        D&&D('redo', command.id, this.historyCursor + '/' + this.history.length
              + '/' + this.groupStack.length);

        if (command.history) {
            for (var i = 0, l = command.history.length; i < l; ++i) {
                this._redoState(command.history[i]);
            }
        } else {
            command.pre();
            command.redo();
            command.post();
        }        

        this.redidCommand({command: command, cursor: this.historyCursor});
    },
};

// *************************************************************************************************

var CommandMap =
exports.CommandMap = function(name, defs, conditions, manager) {
    this.name = name;
    this.defs = defs;
    this.manager = manager;
    var container = manager.container;
    var conditionMap = this.conditionMap = {};

    for (var conditionName in conditions) {
        var fn = conditions[conditionName];
        this.conditionMap[conditionName] = {validate: fn, commands: []};
    }

    for (var commandName in defs) {
        var command = defs[commandName];
        command.id = name + '.' + commandName;
        command.map = this;
        command.manager = manager;

        container[commandName] = _.bind(command.doIt, command);

        var conditionName = command.condition;
        if (conditionName) {
            if (conditionName in conditionMap) {
                conditionMap[conditionName].commands.push(command);
            }
        }
    }
};

exports.CommandMap.prototype = {
    find: function(mapName, commandName) {
        if (mapName == this.name) {
            return this.defs[commandName];
        } else {

        }
        return this.nextMap ? this.nextMap.find(mapName, commandName) : null;
    },

    findCondition: function(mapName, conditionName) {
        if (mapName == this.name) {
            return this.conditionMap[conditionName];
        } else {

        }
        return this.nextMap ? this.nextMap.findCondition(mapName, conditionName) : null;
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
    
            for (var name in map.defs) {
                var command = map.defs[name];
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
