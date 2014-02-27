
var $ = require('ore/query'),
    html = require('ore/html');


var Menu = require('./Menu').Menu;

exports.Container = html.div('.Container', {onmousedown: '$onMouseDown', onclick: '$onClick',
                                            oncontextmenu: '$onContextMenu'}, [],
{
    onMouseDown: function(event) {
        var button = $(event.target).closest('.button');
        if (button.length && !button.cssClass('disabled')) {
            if (button.attr('menu')) {
                button.showMenu();
                event.preventDefault();
                event.stopPropagation();
            }
        }
    },

    onClick: function(event) {
        var button = $(event.target).closest('.button');
        if (button.length && !button.cssClass('disabled')) {
            if (button.cssClass('checkbox')) {
                button.toggle();
            } else {
                var group = button.closest('.button-group');
                if (group.length) {
                    group.value = button.value;
                } else {             
                    var command = button.cmd();
                    if (command) {
                        command.command(event);
                    }
                }
            }
        }
    },

    onContextMenu: function(event) {
        var target = $(event.target);
        for (var node = target; node.length; node = node.parent()) {
            var cmd = node.cmd();
            var commands;
            if (cmd) {
                commands = cmd.actions;
            } else if (typeof(node.contextualCommands) == 'function') {
                commands = node.contextualCommands(target);
            }
            if (commands) {
                if (commands.length) {
                    var menu = new Menu();
                    menu.populate(commands);
                    menu.showAt(event.pageX, event.pageY, this);
                }

                event.stopPropagation();
                event.preventDefault();
                return;
            }
        }
    }
});
