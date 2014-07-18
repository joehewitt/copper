
var _ = require('underscore');

// *************************************************************************************************

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
