
var $ = require('ore/query'),
    html = require('ore/html');

var Menu = require('./Menu').Menu;

// *************************************************************************************************

exports.Container = html.div('.container', {onmousedown: '$onMouseDown', onclick: '$onClick',
                                            onmouseup: '$onMouseUp',
                                            oncontextmenu: '$onContextMenu'}, [],
{
    onMouseDown: function(event) {
        if (event.button == 0) {
            var button = $(event.target).closest('.button');
            if (button.length && !button.cssClass('disabled')) {
                if (button.attr('menu')) {
                    if (this.showingMenu = button.showMenu()) {
                        event.preventDefault();
                        event.stopPropagation();
                    }
                }
            }
        }
    },

    onMouseUp: function(event) {
        if (this.showingMenu && $(event.target).closest('.menu').equals(this.showingMenu)) {
            this.showingMenu.enter();
        }
        this.showingMenu = null;
    },

    onClick: function(event) {
        var button = $(event.target).closest('.button');
        if (button.length && !button.cssClass('disabled')) {
            if (button.cssClass('checkbox')) {
                button.toggle();
            } else {
                var group = button.closest('.button-group');
                if (group.length) {
                    var value = button.value;
                    group.value = value;
                    group.updated({target: group, value: value});
                }
            }

            var command = button.cmd();
            if (command) {
                command();
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
                    menu.listen('hidden', function() {
                        menu.remove();
                    });
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
