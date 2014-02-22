
var _ = require('underscore'),
    $ = require('ore'),
    html = require('ore/html');

var KeyMap = require('./KeyManager').KeyMap;

// *************************************************************************************************

exports.NumericInput = html.input('.numeric-input', {oninput: '$onInput',
                                                     onmousedown: '$onMouseDown'}, [
], {
    shouldSnap: false,
    rounding: 100,
    pixelsPerIncrement: 20,

    updated: $.event,

    get value() {
        return parseFloat(this.val().value);
    },

    set value(value) {
        return this.val().value = value;
    },

    get keyMap() {
        if (!this._keyMap) {
            this._keyMap = new KeyMap([
                'UP', _.bind(function() { this.incrementNumber(this.increment); }, this),
                'DOWN', _.bind(function() { this.incrementNumber(-this.increment); }, this),
            ]);
            this._keyMap.exclusive = true;
        }
        return this._keyMap;
    },

    formatValue: function(value) {
        if (this.min !== undefined) {
            value = Math.max(value, this.min);
        }
        if (this.max !== undefined) {
            value = Math.min(value, this.max);
        }
        if (this.shouldSnap && this.increment !== undefined) {
            value -= value % this.increment;
        }

        var value = Math.round(value*this.rounding)/this.rounding;
        if (isNaN(value)) {
            if (this.min !== undefined) {
                return this.min;
            } else {
                return 0;
            }
        } else {
            return value;            
        }
    },

    incrementNumber: function(increment) {
        if (this.increment !== undefined) {
            this.value = this.formatValue(this.value+increment);
            this.updated(this);
        }
    },

    onInput: function(event) {
        var newValue = this.value;
        var constrainedValue = this.formatValue(newValue);
        if (newValue != constrainedValue) {
            this.value = constrainedValue; 
        }
        this.updated(this);
    },

    onMouseDown: function(event) {
        if (this.increment !== undefined) {
            var startY = event.clientY;
            var startValue = this.value;
            var increment = -this.increment / this.pixelsPerIncrement;

            event.preventDefault();

            this.onMouseMove = _.bind(function(event) {
                var dy = event.clientY - startY;
                var diff = dy * increment;
                diff -= diff % this.increment;
                
                var newValue = startValue + diff;
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
        }
    },    
});    

