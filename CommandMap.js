
var _ = require('underscore');

// *************************************************************************************************

exports.CommandMap = function(name, defs, conditions, manager) {
    this.name = name;
    this.defs = defs;
    this.conditions = conditions;
    this.manager = manager;

    var conditionMap = this.conditionMap = {};

    for (var conditionName in this.conditions) {
        var fn = this.conditions[conditionName];
        this.conditionMap[conditionName] = {validate: fn, commands: []};
    }
}    

exports.CommandMap.prototype = {
    link: function() {
        var container = this.manager.container;
        for (var commandName in this.defs) {
            var command = this.defs[commandName];
            command.id = this.name + '.' + commandName;
            command.map = this;
            command.manager = this.manager;
            
            var binding = _.bind(command.canEvaluate ? command.instantiate : command.doIt, command);
            binding.create = _.bind(command.create, command);
            binding.extend = _.bind(command.extend, command);
            container[commandName] = binding;

            var conditionName = command.condition;
            if (conditionName) {
                this.manager.linkCondition(conditionName, command);
            }
        }
    },

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
