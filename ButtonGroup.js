
var _ = require('underscore'),
    $ = require('ore'),
    html = require('ore/html');

// *************************************************************************************************

exports.ButtonGroup = html.div('.button-group', [
], {
    updated: $.event,

    // construct: function() {
    //     setTimeout(_.bind(function() {
    //         this.setValue(this.value);
    //     }, this));
    // },

    get value() {
        return this._value;
    },

    set value(value) {
        this.query('.button.selected').selected = false;
        this.query('.button').each(_.bind(function(button) {
            if (button.value == value) {
                button.selected = true;
            }
        }, this));

        this._value = value;

        this.updated({target: this, value: value});
    },
});    