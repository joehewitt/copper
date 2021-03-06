
var _ = require('underscore'),
    $ = require('ore'),
    html = require('ore/html');

var KeyMap = require('./KeyManager').KeyMap;

// *************************************************************************************************

exports.Input = html.input('.input', {oninput: '$onInput',}, [
], {
    updated: $.event,
    entered: $.event,
    escaped: $.event,

    // ---------------------------------------------------------------------------------------------

    get value() {
        return this.val().value;
    },

    set value(value) {
        this.val().value = value;
    },

    get hotKeys() {
        if (!this._hotKeys) {
            this._hotKeys = new KeyMap([
                'ENTER', _.bind(function() { this.enter(); }, this),
                'ESC', _.bind(function() { this.escape(); }, this),
            ]);
            this._hotKeys.exclusive = true;
        }
        return this._hotKeys;
    },

    get disabled() {
        return this._disabled;
    },

    set disabled(disabled) {
        this._disabled = disabled;
        this.attr('disabled', disabled ? 'true' : null);
    },

    // ---------------------------------------------------------------------------------------------

    enter: function() {
        this.entered(this);
    },

    escape: function() {
        this.escaped(this);
    },

    // ---------------------------------------------------------------------------------------------

    onInput: function(event) {
        var evt = {target: this, value: this.value};
        this.updated(evt);
    },
});

// *************************************************************************************************

exports.NumericInput = exports.Input('.numeric-input', {onmousedown: '$onMouseDown',
                                                        onfocus: '$onFocus',
                                                        onblur: '$onBlur'}, [
], {
    shouldSnap: false,
    rounding: 100,
    pixelsPerIncrement: 5,

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
        return this.val().value = value;
    },

    get hotKeys() {
        if (!this._hotKeys) {
            this._hotKeys = new KeyMap([
                'UP', _.bind(function() { this.incrementNumber(this.increment); }, this),
                'DOWN', _.bind(function() { this.incrementNumber(-this.increment); }, this),
                'ENTER', _.bind(function() { this.enter(); }, this),
                'ESC', _.bind(function() { this.escape(); }, this),
            ]);
            this._hotKeys.exclusive = true;
        }
        return this._hotKeys;
    },

    // ---------------------------------------------------------------------------------------------

    reformat: function(value) {
        return Math.round(value*this.rounding)/this.rounding;
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

        var value = this.reformat(value);
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
            var value = this.value + increment;
            if (this.min !== undefined) {
                value = Math.max(value, this.min);
            }
            if (this.max !== undefined) {
                value = Math.min(value, this.max);
            }
            var previousValue = this.value;
            this.value = value;

            var evt = {target: this, value: value};
            this.updated(evt);
            if (evt.preventDefault) {
                this.value = previousValue;
            }
        }
    },

    // ---------------------------------------------------------------------------------------------

    onMouseDown: function(event) {
        if (this.increment !== undefined) {
            var startY = event.clientY;
            var startValue = this.value;
            var increment = -this.increment / this.pixelsPerIncrement;
            var previousValue = this.value;

            event.preventDefault();

            this.onMouseMove = _.bind(function(event) {
                var dy = event.clientY - startY;
                var diff = dy * increment;
                diff -= diff % this.increment;

                var newValue = this.formatValue(startValue + diff);
                this.value = newValue;
                var evt = {target: this, value: newValue};
                this.updated(evt);
                if (evt.preventDefault) {
                    this.value = previousValue;
                } else {
                    previousValue = newValue;
                }
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

        // $(window).listen('mousewheel', this.onMouseWheel, true);
    },

    onBlur: function() {
        this.value = this.formatValue(this.val().value);
        $(window).unlisten('mousewheel', this.onMouseWheel, true);
        delete this.onMouseWheel;
    },
});
