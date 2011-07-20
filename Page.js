
"style copper/Page.css"

var $ = require('ore'),
    html = require('ore/html'),
    routes = require('ore/routes');

exports.Page = html.div('.Page', {}, [],
{
    ready: function(constructor) {
        $.each(this.routes, $.bind(function(callback, pattern) {
            routes.add(pattern, function(args, isBack) {
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
            });
        }, this));
    }
});
