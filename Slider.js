
"style copper/Slider.css";

var $ = require('ore').query,
    html = require('ore/html');

exports.Slider = html.div('.Slider', [
    html.div('.track'),
    html.div('.buffer'),
    html.div('.thumb', {ontouchstart: '$onTouchStart'})
], {
    min: 0,
    max: 1,
    value: 0,
    buffer: 0,

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

    update: function() {
        var buffer = $('.buffer', this);
        buffer.css('width', this.buffer * this.width());
        if (!this.dragging) {
            var thumb = $('.thumb', this);
            thumb.css('left', this.value * (this.width() - thumb.width()));
        }
    },

    onTouchStart: function(event) {
        event.preventDefault();

        var slider = $('.slider', this);
        var thumb = $('.thumb', this);

        slider.dragging = true;

        var touch = event.touches[0];
        var startLeft = thumb.position().left;
        var startX = touch.clientX;
        var maxLeft = slider.width();
        if (maxLeft >= thumb.width()) {
            maxLeft -= thumb.width();
        }

        var onTouchMove = $.bind(function(event) {
            var touch = event.touches[0];
            var left = startLeft + (touch.clientX - startX);
            if (left < 0) {
                left = 0;
            } else if (left > maxLeft) {
                left = maxLeft;
            }

            thumb.css('left', left);
            this.value = left/maxLeft;

            this.updated();
        }, slider);

        var onTouchEnd = $.bind(function(event) {
            document.removeEventListener('touchmove', onTouchMove, false);
            document.removeEventListener('touchend', onTouchEnd, false);
            slider.dragging = false;
        }, slider);

        document.addEventListener('touchmove', onTouchMove, false);
        document.addEventListener('touchend', onTouchEnd, false);
    },
    
    updated: $.event,
});    
