
var _ = require('underscore'),
    $ = require('ore'),
    html = require('ore/html');

// *************************************************************************************************

exports.NumericInput = html.input('.numeric-input', {oninput: '$onInput',
                                     onkeydown: '$onKeyPress', onmousedown: '$onMouseDown'}, [
], {
    increment: 1,
    pixelsPerIncrement: 20,
    rounding: 100,

    updated: $.event,

    get value() {
        return parseFloat(this.val().value);
    },

    set value(value) {
        return this.val().value = value;
    },

    formatValue: function(value) {
        return Math.round(value*this.rounding)/this.rounding;
    },

    onInput: function(event) {
        var newValue = this.value;
        var constrainedValue = this.formatValue(newValue);
        if (newValue != constrainedValue) {
            this.value = constrainedValue;
            this.updated(this);
        }
    },
    
    onKeyPress: function(event) {
        var increment = this.increment;

        if (event.keyCode == 38) {
            var newValue = this.value+increment;
            newValue = this.formatValue(newValue);

            this.value = newValue;
            this.updated(this);
            event.preventDefault();
        } else if (event.keyCode == 40) {
            var newValue = this.value-increment;
            newValue = this.formatValue(newValue);

            this.value = newValue;
            this.updated(this);
            event.preventDefault();
        }
    },

    onMouseDown: function(event) {
        var startX = event.clientX;
        var startValue = this.value;
        var increment = this.increment / this.pixelsPerIncrement;

        event.preventDefault();

        this.onMouseMove = _.bind(function(event) {
            var dx = event.clientX - startX;
            var newValue = startValue + (dx * increment);
            newValue = this.formatValue(newValue);

            this.value = newValue
            this.updated(this);
        }, this);

        this.onMouseUp = _.bind(function(event) {
            if (event.target == this.val()) {
                this.val().focus();
            }
            $(window).unlisten('mousemove', this.onMouseMove, true)
                     .unlisten('mouseup', this.onMouseUp);
        }, this);

        $(window).listen('mousemove', this.onMouseMove, true)
                 .listen('mouseup', this.onMouseUp);
    },    
});    

