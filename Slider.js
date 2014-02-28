
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
    min: 0,
    max: 1,
    value: 0,
    buffer: 0,

    updated: $.event,
    begandragging: $.event,
    endeddragging: $.event,

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

    construct: function() {
        setTimeout(_.bind(function() {
            this.setValue(this.value);    
        }, this));
    },

    reset: function() {
        this.value = 0;
        this.buffer = 0;
        this.update();
    },

    setValue: function(value) {
        if (!this.dragging && value >= this.min && value <= this.max) {
            this.value = value;
            this.update();
        }
    },

    setBuffer: function(buffer) {
        if (this.buffer == 1 && this.buffer < 1) {
            this.removeClass('buffered');
        }
        this.buffer = buffer;
        if (this.buffer == 1) {
            this.addClass('buffered');
        }
        this.update();
    },

    setRange: function(min, max, increment, cb) {
        this.min = min;
        this.max = max;
        this.increment = increment;
        this._updateTicks(cb);
    },

    slideHome: function() {
        this.setValue(this.min);
        this.updated(this);
    },

    slideEnd: function() {
        this.setValue(this.max);
        this.updated(this);
    },
    
    slideDown: function() {
        this.setValue(this.value + -this.increment);
        this.updated(this);
    },

    slideUp: function() {
        this.setValue(this.value + this.increment);
        this.updated(this);
    },

    update: function() {
        var buffer = $('.buffer', this);
        buffer.css('width', this.buffer * this.width());
        if (!this.dragging) {
            var thumb = $('.thumb', this);
            var range = this.max - this.min;
            var value = range > 0 ? this.value / range : 0;
            thumb.css('left', value * (this.width() - thumb.width()));
        }
    },

    // *********************************************************************************************

    _updateTicks: function(cb) {
        this.query('.tickmark').remove();

        var thumb = this.query('.thumb');

        var padding = thumb.width()/2;
        var tickmarkCount = ((this.max+this.increment) - this.min) / this.increment;
        if (this.max - this.min > 0) {
            var availableWidth = this.contentWidth()-padding*2;
            var spacing = availableWidth / (tickmarkCount-1);

            var left = padding;
            for (var i = 0; i < tickmarkCount; ++i) {
                var tickmark = $(document.createElement('div'));
                tickmark.addClass('tickmark');
                tickmark.css('left', left);
                this.append(tickmark);
                if (cb) {
                    var color = cb(i);
                    if (color) {
                        tickmark.css('background', color);
                    }
                }

                left += spacing;
            }
        }
    },

    // *********************************************************************************************

    onMouseDownTrack: function(event) {
        if ($(event.target).cssClass('thumb')) return;

        this.focus();
        event.preventDefault();

        var offsetX = event.clientX - this.offset().left;
        var maxLeft = this.width();
        var ratio = offsetX / this.contentWidth();
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
        this.update();
        this.updated(this);
    },

    onMouseDownThumb: function(event) {
        event.preventDefault();
        this.focus();

        var thumb = $('.thumb', this);

        this.dragging = true;
        this.begandragging({target: this, value: this.value});

        var touch = event;//.touches[0];
        var startLeft = thumb.position().left;
        var startX = touch.clientX;
        var maxLeft = this.width();
        if (maxLeft >= thumb.width()) {
            maxLeft -= thumb.width();
        }

        var onMouseMove = _.bind(function(event) {
            var touch = event;//.touches[0];
            var left = startLeft + (touch.clientX - startX);
            if (left < 0) {
                left = 0;
            } else if (left > maxLeft) {
                left = maxLeft;
            }

            // thumb.css('left', left);
            var range = this.max - this.min;
            var value = this.min + ((left/maxLeft) * range);

            if (this.increment) {
                var remainder = value % this.increment;
                if (remainder < 0.5) {
                    value -= remainder;
                } else {
                    value += 1 - remainder;
                }
            }

            var pos = range > 0 ? value / range : 0;
            thumb.css('left', pos * (this.width() - thumb.width()));

            this.value = value;
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
