
var _ = require('underscore'),
    $ = require('ore'),
    html = require('ore/html'),
    Slider = require('./Slider').Slider,
    NumericInput = require('./Input').NumericInput;

exports.Menu = html.div('.menu', {}, [
], {
    showing: $.event,
    shown: $.event,
    hidden: $.event,
    command: $.event,

    get visible() {
        return this.hasClass('visible');
    },

    show: function(anchorBox) {
        if (!this.onMouseDown) {
            this.showing({target: this});
        }

        var offset = anchorBox.offset();
        var parentOffset = this.parent().offset();
        
        var anchorX = offset.left - parentOffset.left;
        var width = this.width();
        var right = offset.left + width;
        if (right > window.innerWidth && width < window.innerWidth-offset.left) {
            anchorX = (offset.left - parentOffset.left) - width;
        }

        var anchorY = (offset.top - parentOffset.top) + offset.height;
        var height = this.height();
        var bottom = offset.top + height;
        if (bottom > window.innerHeight && height < window.innerHeight) {
            anchorY = (offset.top - parentOffset.top) - height;
        }

        this.css('left', anchorX);
        this.css('top', anchorY);

        if (!this.onMouseDown) {
            this.onClick = _.bind(function(event) {
                var target = $(event.target);
                var item = target.closest('.menu-item');
                if (item.length) {
                    var evt = {target: item};
                    if (item.command) {
                        item.command(evt);
                    }
                    if (!evt.prevent) {
                        this.command(evt);
                    }
                    if (!evt.prevent) {
                        this.hide();
                    }
                    // event.stopPropagation();
                    event.preventDefault();
                }
            }, this);
            this.onMouseDown = _.bind(function(event) {
                var target = $(event.target);
                var item = target.closest('.menu-item');
                if (!item.length && !target.contains(this)) {
                    this.hide();
                }
                // event.stopPropagation();
                event.preventDefault();
            }, this);
            window.addEventListener('mousedown', this.onMouseDown, true);
            window.addEventListener('click', this.onClick, true);

            this.addClass('visible');
            this.shown({target: this});
        }
    },

    hide: function() {
        this.removeClass('visible');
        this.hidden({target: this});

        window.removeEventListener('mousedown', this.onMouseDown, true);
        window.removeEventListener('click', this.onClick, true);
        delete this.onMouseDown;
    },
});    

// *************************************************************************************************

exports.MenuItem = html.div('.menu-item', {}, [
], {
    command: $.event,
});    

// *************************************************************************************************

exports.MenuSeparator = html.div('.menu-separator', {}, [], {});

// *************************************************************************************************

exports.MenuSliderItem = html.div('.menu-slider-item', {}, [
    html.div('.menu-item-title'),
    Slider('.menu-item-slider', {_increment: 1, onupdated: '$onSliderUpdated'}),
    NumericInput('.menu-item-input', {_rounding: 1, onupdated: '$onNumberUpdated'}),
], {
    updated: $.event,

    get value() {
        return this._value;
    },

    set value(value) {
        this._value = value;
        this.query('.menu-item-input').value = value;
        this.query('.menu-item-slider').setValue(value);
    },

    set min(value) {
        this.query('.menu-item-slider').min = value;
    },

    set max(value) {
        this.query('.menu-item-slider').max = value;
    },

    set title(title) {
        this.query('.menu-item-title').text(title);
    },

    onSliderUpdated: function(slider) {
        this.query('.menu-item-input').value = slider.value;
        this.updated(slider.value);
    },

    onNumberUpdated: function(input) {
        this.query('.menu-item-slider').setValue(input.value);
        this.updated(input.value);
    }
});    
