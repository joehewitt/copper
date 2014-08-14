
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
