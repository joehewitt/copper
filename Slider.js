
var _ = require('underscore'),
    $ = require('ore'),
    html = require('ore/html');

var KeyMap = require('./KeyManager').KeyMap,
    BINDKEY = require('./KeyManager').BINDKEY;

// *************************************************************************************************

exports.Slider = html.div('.slider', {onmousedown: '$onMouseDownTrack'}, [
    html.div('.track'),
    html.div('.buffer'),
    html.div('.thumb', {onmousedown: '$onMouseDownThumb'})
], {
    _value: 0,
    min: 0,
    max: 1,
    buffer: 0,

    updated: $.event,
    begandragging: $.event,
    endeddragging: $.event,

    // ---------------------------------------------------------------------------------------------

    get hotKeys() {
        if (!this._hotKeys) {
            this._hotKeys = new KeyMap([
                'HOME', BINDKEY(this.slideHome, this),
                'END', BINDKEY(this.slideEnd, this),
                'LEFT', BINDKEY(this.slideDown, this),
                'RIGHT', BINDKEY(this.slideUp, this),
            ]);
        }
        return this._hotKeys;
    },

    get isVertical() {
        return this.cssClass('vertical');
    },

    get thumb() { 
        return this.query('.thumb', true); 
    },

    get value() {
        return this._value;
    },

    set value(value) {
        if (!this.dragging && value >= this.min && value <= this.max) {
            this._value = value;
            this.layout();
        }
    },

    // ---------------------------------------------------------------------------------------------
    // ore.Tag

    construct: function() {
        setTimeout(_.bind(function() {
            this.layout();
        }, this));
    },

    // ---------------------------------------------------------------------------------------------

    setBuffer: function(buffer) {
        if (this.buffer == 1 && this.buffer < 1) {
            this.removeClass('buffered');
        }
        this.buffer = buffer;
        if (this.buffer == 1) {
            this.addClass('buffered');
        }
        this.layout();
    },

    setRange: function(min, max, increment, cb) {
        this.min = min;
        this.max = max;
        this.increment = increment;
        this._layoutTicks(cb);
    },

    slideHome: function() {
        this.value = this.min;
        this.updated(this);
    },

    slideEnd: function() {
        this.value = this.max;
        this.updated(this);
    },
    
    slideDown: function() {
        this.value -= this.increment;
        this.updated(this);
    },

    slideUp: function() {
        this.value += this.increment;
        this.updated(this);
    },

    layout: function() {
        var isVertical = this.isVertical;
        var size = isVertical ? this.height() : this.width();

        var buffer = $('.buffer', this);
        buffer.css('width', this.buffer * size);
        if (!this.dragging) {
            var thumb = this.thumb;
            var thumbSize = isVertical ? thumb.height() : thumb.width();
            var range = this.max - this.min;
            var value = range > 0 ? this.value / range : 0;
            thumb.css(isVertical ? 'top' : 'left', value * (size - thumbSize));
        }
    },

    // ---------------------------------------------------------------------------------------------

    _layoutTicks: function(cb) {
        this.query('.tickmark').remove();

        var thumb = this.thumb;

        var isVertical = this.isVertical;
        var maxSize = isVertical ? this.contentHeight() : this.contentWidth();
        var padding = (isVertical ? thumb.height() : thumb.width()) / 2;

        var tickmarkCount = ((this.max+this.increment) - this.min) / this.increment;
        if (this.max - this.min > 0) {
            var availableSize = maxSize-padding*2;
            var spacing = availableSize / (tickmarkCount-1);

            var pos = padding;
            for (var i = 0; i < tickmarkCount; ++i) {
                var tickmark = $(document.createElement('div'));
                tickmark.addClass('tickmark');
                tickmark.css(isVertical ? 'top' : 'left', pos);
                this.append(tickmark);
                if (cb) {
                    var color = cb(i);
                    if (color) {
                        tickmark.css('background', color);
                    }
                }

                pos += spacing;
            }
        }
    },

    // ---------------------------------------------------------------------------------------------

    onMouseDownTrack: function(event) {
        if ($(event.target).cssClass('thumb')) return;

        this.focus();
        event.preventDefault();

        var isVertical = this.isVertical;
        var offset = isVertical
            ? event.clientY - this.offset().top
            : event.clientX - this.offset().left;
        var maxSize = isVertical ? this.contentHeight() : this.contentWidth();

        var ratio = offset / maxSize;
        var range = this.max - this.min;
        var value = this.min + (range * ratio);

        if (this.increment) {
            var remainder = value % this.increment;
            if (remainder < 0.5) {
                value -= remainder;
            } else {
                value += 1 - remainder;
            }
        }

        this.value = value;
        this.updated(this);
    },

    onMouseDownThumb: function(event) {
        event.preventDefault();
        this.focus();

        var thumb = this.thumb;

        this.dragging = true;
        this.begandragging({target: this, value: this.value});

        var isVertical = this.isVertical;

        var touch = event;//.touches[0];
        var startPosThumb = isVertical ? thumb.position().top : thumb.position().left;
        var startPosMouse = isVertical ? touch.clientY : touch.clientX;
        var maxPos = isVertical ? this.height() : this.width();

        var size = isVertical ? this.height() : this.width();
        var thumbSize = isVertical ? thumb.height() : thumb.width();
        if (maxPos >= thumbSize) {
            maxPos -= thumbSize;
        }

        var onMouseMove = _.bind(function(event) {
            var touch = event;//.touches[0];
            var mousePos = isVertical ? touch.clientY : touch.clientX;
            var pos = startPosThumb + (mousePos - startPosMouse);
            if (pos < 0) {
                pos = 0;
            } else if (pos > maxPos) {
                pos = maxPos;
            }

            // thumb.css('left', left);
            var range = this.max - this.min;
            var value = this.min + ((pos/maxPos) * range);

            if (this.increment) {
                var remainder = value % this.increment;
                if (remainder < 0.5) {
                    value -= remainder;
                } else {
                    value += 1 - remainder;
                }
            }

            var pos = range > 0 ? value / range : 0;
            thumb.css(isVertical ? 'top': 'left', pos * (size - thumbSize));

            this._value = value;
            this.updated(this);
        }, this);

        var onMouseEnd = _.bind(function(event) {
            document.removeEventListener('mousemove', onMouseMove, false);
            document.removeEventListener('mouseup', onMouseEnd, false);
            this.dragging = false;
            this.endeddragging({target: this, value: this.value});
        }, this);

        document.addEventListener('mousemove', onMouseMove, false);
        document.addEventListener('mouseup', onMouseEnd, false);
    },
});    
