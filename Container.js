
var $ = require('ore/query'),
    html = require('ore/html');

exports.Container = html.div('.Container', {onmousedown: '$onMouseDown', onclick: '$onClick'}, [],
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
    }
});
