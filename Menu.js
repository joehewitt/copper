
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

    get visible() {
        return this.hasClass('visible');
    },

    show: function(anchorBox) {
        this.showing({target: this});

        var offset = anchorBox.offset();
        var parentOffset = this.parent().offset();
        var anchorX = offset.left - parentOffset.left;
        var anchorY = (offset.top - parentOffset.top) + offset.height;
        this.css('left', anchorX);
        this.css('top', anchorY);1

        this.onClick = _.bind(function(event) {
            var target = $(event.target);
            var item = target.closest('.menu-item');
            if (item.length) {
                item.command({target: item});
                this.hide();
                event.stopPropagation();
                event.preventDefault();
            } else if (!target.contains(this)) {
                this.hide();
                event.stopPropagation();
                event.preventDefault();
            }
        }, this);
        window.addEventListener('click', this.onClick, true);

        this.addClass('visible');
        this.shown({target: this});
    },

    hide: function() {
        this.removeClass('visible');
        this.hidden({target: this});

        window.removeEventListener('click', this.onClick, true);
        delete this.onClick;
    },
});    

// *************************************************************************************************

exports.MenuItem = html.div('.menu-item', {}, [
], {
    command: $.event,
});    

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
