
"style copper/Page.css"

var $ = require('ore'),
    _ = require('underscore'),
    html = require('ore/html'),
    routes = require('ore/routes');

exports.Page = html.div('.Page', {}, [],
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
    }
});
