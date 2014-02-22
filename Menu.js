
var _ = require('underscore'),
    $ = require('ore'),
    html = require('ore/html');

var KeyMap = require('./KeyManager').KeyMap,
    Slider = require('./Slider').Slider,
    NumericInput = require('./Input').NumericInput;

// *************************************************************************************************

exports.Menu = html.div('.menu', {tabindex: '-1', onmouseover: '$onMouseOver',
                                  onmouseout: '$onMouseOut', onclick: '$onClick'}, [
], {
    showing: $.event,
    shown: $.event,
    hidden: $.event,
    commanded: $.event,
    selected: $.event,

    get visible() {
        return this.hasClass('visible');
    },

    get keyMap() {
        if (!this._keyMap) {
            this._keyMap = new KeyMap([
                'UP', _.bind(this.selectUp, this),
                'DOWN', _.bind(this.selectDown, this),
                'HOME', _.bind(this.selectHome, this),
                'END', _.bind(this.selectEnd, this),
                'ENTER', _.bind(this.enter, this),
                'CMD+ENTER', _.bind(this.multiEnter, this),
                'ESC', _.bind(this.hide, this),
            ]);
            this._keyMap.exclusive = true;
        }
        return this._keyMap;
    },

    select: function(item) {
        this.query('.menu-item.selected').removeClass('selected');
        if (item && item.length) {
            item.addClass('selected');     
            this.selected({target: item});
        } else {
            this.selected({target: null});            
        }
    },

    selectHome: function() {
        var items = this.query('.menu-item');
        this.select(items.get(0));
    },

    selectEnd: function() {
        var items = this.query('.menu-item');
        this.select(items.get(items.length-1));
    },

    selectUp: function() {
        var selected = this.query('.menu-item.selected');
        if (selected.length) {
            for (var prev = selected.previous(); prev.length; prev = prev.previous()) {
                if (prev.hasClass('menu-item')) {
                    this.select(prev);
                    break;
                }
            }
        } else {
            this.selectEnd();
        }
    },

    selectDown: function() {
        var selected = this.query('.menu-item.selected');
        if (selected.length) {
            for (var next = selected.next(); next.length; next = next.next()) {
                if (next.hasClass('menu-item')) {
                    this.select(next);
                    break;
                }
            }
        } else {
            this.selectHome();
        }
    },

    enter: function() {
        var selected = this.query('.menu-item.selected');
        if (selected.length) {
            this.enterItem(selected);
        }
    },

    multiEnter: function() {
        var selected = this.query('.menu-item.selected');
        if (selected.length) {
            this.enterItem(selected, true);
        }
    },

    enterItem: function(item, shouldNotHide) {
        var evt = {target: item};
        if (item.command) {
            item.command.command(evt);
        }
        if (item.commanded) {
            item.commanded(evt);
        }
        if (!evt.prevent) {
            this.commanded(evt);
        }
        if (!shouldNotHide && !evt.prevent) {
            this.hide();
        }
    },

    show: function(anchorBox) {
        if (!this.onMouseDown) {
            this.showing({target: this});
        }

        for (var parent = this; parent.length; parent = parent.parent()) {
            if (parent.keyManager) {
                var keyManager = parent.keyManager;
                this.query('.menu-item').each(function(item) {
                    var commandId = item.command ? item.command.id : null;
                    if (commandId) {
                        var shortcut = keyManager.findShortcut(commandId);
                        if (shortcut) {
                            item.keyboardShortcut = shortcut;
                        }
                    }

                })
                break;                
            }
        }

        var offset = anchorBox.offset();
        var parentOffset = this.parent().offset();
        
        var anchorX = offset.left - parentOffset.left;
        var width = this.width();
        var right = (offset.left + width) - window.scrollX;
        if (right > window.innerWidth && width < window.innerWidth-offset.left) {
            anchorX = (offset.left - parentOffset.left) - width;
        }

        var anchorY = (offset.top - parentOffset.top) + offset.height;
        var height = this.height();
        var bottom = (offset.top + offset.height + height) - window.scrollY;
        if (bottom > window.innerHeight && height < window.innerHeight) {
            anchorY = (offset.top - parentOffset.top) - height;
        }

        this.css('left', anchorX);
        this.css('top', anchorY);

        if (!this.onMouseDown) {
            this.onMouseDown = _.bind(function(event) {
                if (!$(event.target).closest('.menu').equals(this)) {
                    event.stopPropagation();
                    this.hide();
                }
                event.preventDefault();
            }, this);
            $(window).listen('mousedown', this.onMouseDown, true);

            this.addClass('visible');
            this.val().focus();

            this.shown({target: this});
        }
    },

    hide: function() {        
        if (this.equals($(document.activeElement))) {
            var container = this.parent().closest('*[tabindex]');
            if (container.length) {
                container.val().focus();
            } else {
                this.val().blur();
            }
        }

        this.removeClass('visible');

        var selected = this.query('.menu-item.selected');
        if (selected.length) {
            selected.removeClass('selected');
        }

        this.hidden({target: this});

        window.removeEventListener('mousedown', this.onMouseDown, true);
        delete this.onMouseDown;
    },
    
    // *********************************************************************************************

    onClick: function(event) {
        var item = $(event.target).closest('.menu-item');
        if (item.length) {
            this.enter(item);
            event.preventDefault();
        }
    },

    onMouseOver: function(event) {
        var item = $(event.target).closest('.menu-item');
        this.select(item.length ? item : null);
    },

    onMouseOut: function(event) {
        if (!$(event.toElement).closest('.menu').equals(this)) {
            this.select(null);
        }
    }
});    

// *************************************************************************************************

exports.MenuItem = html.div('.menu-item', {}, [
    html.div('.menu-item-title', [html.HERE]),
    html.div('.menu-item-key', []),
], {
    commanded: $.event,

    get keyboardShortcut() {
        return this.query('.menu-item-title').text();
    },

    set keyboardShortcut(value) {
        this.query('.menu-item-key').html(value);
        return value;
    },

    get title() {
        return this.query('.menu-item-title').text();
    },

    set title(value) {
        this.query('.menu-item-title').html(value);
        return value;
    },
});    

// *************************************************************************************************

exports.MenuSeparator = html.div('.menu-separator', {}, [], {});

// *************************************************************************************************

exports.MenuSliderItem = html.div('.menu-slider-item', {}, [
    html.div('.menu-item-title'),
    Slider('.menu-item-slider', {onupdated: '$onSliderUpdated'}),
    NumericInput('.menu-item-input', {onupdated: '$onNumberUpdated'}),
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

    set title(title) {
        this.query('.menu-item-title').text(title);
    },

    set min(value) {
        this.query('.menu-item-input').min = value;
        this.query('.menu-item-slider').min = value;
    },

    set max(value) {
        this.query('.menu-item-input').max = value;
        this.query('.menu-item-slider').max = value;
    },

    set increment(value) {
        this.query('.menu-item-input').increment = value;
        this.query('.menu-item-slider').increment = value;
    },

    set rounding(value) {
        this.query('.menu-item-input').rounding = value;
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
