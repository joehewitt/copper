
var _ = require('underscore'),
    $ = require('ore'),
    html = require('ore/html');

var KeyMap = require('./KeyManager').KeyMap;

// *************************************************************************************************

exports.NumericInput = html.input('.numeric-input', {onmousedown: '$onMouseDown',
                                                     onfocus: '$onFocus',
                                                     onblur: '$onBlur',
                                                     oninput: '$onInput',}, [
], {
    shouldSnap: false,
    rounding: 100,
    pixelsPerIncrement: 5,

    updated: $.event,

    // ---------------------------------------------------------------------------------------------
    
    get value() {
        var value = parseFloat(this.val().value);
        if (isNaN(value)) {
            return 0;
        } else {
            return value;
        }
    },

    set value(value) {
        return this.val().value = this.formatValue(value);
    },

    get hotKeys() {
        if (!this._hotKeys) {
            this._hotKeys = new KeyMap([
                'UP', _.bind(function() { this.incrementNumber(this.increment); }, this),
                'DOWN', _.bind(function() { this.incrementNumber(-this.increment); }, this),
            ]);
            this._hotKeys.exclusive = true;
        }
        return this._hotKeys;
    },

    // ---------------------------------------------------------------------------------------------

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
            this.value = this.value+increment;
            this.updated(this);
        }
    },

    // ---------------------------------------------------------------------------------------------

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

                this.value = newValue
                this.updated(this);
            }, this);

            this.onMouseUp = _.bind(function(event) {
                if (event.target == this.val()) {
                    this.focus();
                }
                $(document.body).removeClass('dragging-number');
                this.removeClass('dragging');
                $(window).unlisten('mousemove', this.onMouseMove, true)
                         .unlisten('mouseup', this.onMouseUp, true);
                delete this.onMouseMove;
                delete this.onMouseUp;
            }, this);

            $(document.body).addClass('dragging-number');
            this.addClass('dragging');
            $(window).listen('mousemove', this.onMouseMove, true)
                     .listen('mouseup', this.onMouseUp, true);
        }
    },    

    onFocus: function() {
        this.onMouseWheel = _.bind(function(event) {
            if (event.deltaY > 0) {
                this.incrementNumber(this.increment);
                event.preventDefault();
            } else if (event.deltaY < 0) {
                this.incrementNumber(-this.increment);
                event.preventDefault();
            }
        }, this);

        $(window).listen('mousewheel', this.onMouseWheel, true);
    },

    onBlur: function() {
        this.val().value = this.formatValue(this.val().value);
        $(window).unlisten('mousewheel', this.onMouseWheel, true);
        delete this.onMouseWheel;
    },

    onInput: function(event) {
        this.updated(this);
    },
});    
