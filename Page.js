
"style copper/Page.css"

var $ = require('ore'),
    _ = require('underscore'),
    html = require('ore/html'),
    routes = require('ore/routes');

exports.Page = html.div('.Page', {onmousedown: '$onMouseDown', onclick: '$onClick'}, [],
{
    ready: function(constructor) {
        _.each(this.routes, _.bind(function(callback, pattern) {
            if (pattern == 404) {
                routes.errorHandler = installRoute;
            } else {
                routes.add(pattern, installRoute);
            }

            function installRoute(args, isBack) {
                var params;
                if (callback) {
                    params = callback.apply(window, args);
                } else {
                    params = {};
                }
                
                function creator() { return new constructor(params); }
                if (isBack) {
                    routes.pop(creator);
                } else {
                    routes.push(creator);
                }
            }            
        }, this));
    },

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
