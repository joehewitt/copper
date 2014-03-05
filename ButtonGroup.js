
var _ = require('underscore'),
    $ = require('ore'),
    html = require('ore/html');

// *************************************************************************************************

exports.ButtonGroup = html.div('.button-group', [
], {
    updated: $.event,
    
    // ---------------------------------------------------------------------------------------------

    get value() {
        return this.query('.button.selected').value;
    },

    set value(value) {
        this.query('.button.selected').selected = false;
        this.query('.button').each(_.bind(function(button) {
            if (button.value == value) {
                button.selected = true;
            }
        }, this));
    },
});    
