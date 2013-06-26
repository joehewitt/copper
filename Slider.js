
var _ = require('underscore'),
    $ = require('ore'),
    html = require('ore/html');

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
        if (!this.dragging) {
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

    update: function() {
        var buffer = $('.buffer', this);
        buffer.css('width', this.buffer * this.width());
        if (!this.dragging) {
            var thumb = $('.thumb', this);
            var value = this.value / (this.max - this.min);
            thumb.css('left', value * (this.width() - thumb.width()));
        }
    },

    onMouseDownTrack: function(event) {
        if ($(event.target).hasClass('thumb')) return;

        event.preventDefault();

        var offsetX = event.clientX - this.offset().left;
        var maxLeft = this.width();
        var ratio = offsetX / this.contentWidth();
        var value = this.min + ((this.max - this.min) * ratio);

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

        var thumb = $('.thumb', this);

        this.dragging = true;

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
            var value = this.min + ((left/maxLeft) * (this.max - this.min));

            if (this.increment) {
                var remainder = value % this.increment;
                if (remainder < 0.5) {
                    value -= remainder;
                } else {
                    value += 1 - remainder;
                }
            }

            var pos = value / (this.max - this.min);
            thumb.css('left', pos * (this.width() - thumb.width()));

            this.value = value;
            this.updated(this);
        }, this);

        var onMouseEnd = _.bind(function(event) {
            document.removeEventListener('mousemove', onMouseMove, false);
            document.removeEventListener('mouseup', onMouseEnd, false);
            this.dragging = false;
        }, this);

        document.addEventListener('mousemove', onMouseMove, false);
        document.addEventListener('mouseup', onMouseEnd, false);
    },
});    
