
var $ = require('ore/query'),
    html = require('ore/html');

exports.Container = html.div('.Container', {onmousedown: '$onMouseDown', onclick: '$onClick'}, [],
{
    onMouseDown: function(event) {
        var button = $(event.target).closest('.button');
        if (button.length) {
            if (button.attr('menu')) {
                button.showMenu();
                event.preventDefault();
                event.stopPropagation();
            }
        }
    },

    onClick: function(event) {
        var button = $(event.target).closest('.button');
        if (button.length) {
            if (button.hasClass('checkbox')) {
                button.toggle();
            } else {
                var group = button.closest('.button-group');
                if (group.length) {
                    group.value = button.value;
                } else {
                    if (button.command) {
                        button.command(event);
                    }
                }
            }
        }
    }
});
