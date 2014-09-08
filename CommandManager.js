
var $ = require('ore'),
    _ = require('underscore');

var CommandMap = require('./CommandMap').CommandMap;

// *************************************************************************************************

exports.CommandManager = function(container) {
    this.container = container;
    this.maps = {};
}

exports.CommandManager.prototype = {
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

    linkMaps: function() {
        for (var name in this.maps) {
            var map = this.maps[name];
            map.link();
        }
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

    validateCommand: function(commandId, subtree) {
        if (!subtree) {
            subtree = this.container;
        }
        var command = this.find(commandId);
        var valid = command.validate();
        var value = command.value;
        subtree.query('*[command="' + commandId + '"]').each(function(item) {
            item.cssClass('disabled', !valid);
            if (item.cssClass('checkbox')) {
                item.cssClass('checked', value);
            }
        })
    },

    validateConditions: function(subtree) {
        if (!subtree) {
            subtree = this.container;
        }

        subtree.query('*[command]').each(function(item) {
            var command = item.cmd();
            if (command) {
                var valid = command.validate();
                item.cssClass('disabled', !valid);

                if (item.cssClass('checkbox')) {
                    item.cssClass('checked', command.value);
                }
            }
        });
    },

    get: function(name) {
        return this.maps[name].defs;
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

    match: function(pattern, commandTree) {
        function searchObject(command) {
            if (typeof(command) == 'object') {
                if (command.id && command.id in cache) return;
                cache[command.id] = 1;

                var title = null;
                try {
                    title = command.title;
                } catch (exc) {}
                if (title) {
                    var m = pattern.exec(title);
                    if (m) {
                        matches.push({index: m.index, command: command});
                    }
                }

                if (command.isSearchable) {
                    var children = command.children;
                    if (children) {
                        for (var i = 0, l = children.length; i < l; ++i) {
                            searchObject(children[i]);
                        }
                    }
                }
            }
        }

        var cache = {};
        var matches = [];
        searchObject(commandTree);
        matches.sort(function(a,b) { return a.index > b.index ? 1 : -1; });
        return _.map(matches, function(m) { return m.command; });
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

    linkCondition: function(conditionId, command) {
        var condition = this.findCondition(conditionId);
        if (condition) {
            condition.commands.push(command);
        }
    },

    // ---------------------------------------------------------------------------------------------

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
};
