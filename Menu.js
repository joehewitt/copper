
var _ = require('underscore'),
    $ = require('ore'),
    html = require('ore/html');

var KeyMap = require('./KeyManager').KeyMap,
    Navigator = require('./Navigator').Navigator,
    Slider = require('./Slider').Slider,
    List = require('./List').List,
    ListItem = require('./List').ListItem,
    ListSeparator = require('./List').ListSeparator,
    NumericInput = require('./Input').NumericInput,
    CMD = require('./Command').CMD;

// *************************************************************************************************

var Menu =
exports.Menu = Navigator('.menu', {}, [
    List('.menu-root-list', {tabindex: '-1', onselected: '$onListSelected',
                             oncommanded: '$onListCommanded'}, [
        html.HERE,
    ])
], {
    showing: $.event,
    shown: $.event,
    hidden: $.event,
    commanded: $.event,
    selected: $.event,

    get visible() {
        return this.cssClass('visible');
    },

    get list() {
        return this.query('.menu-root-list');
    },

    get hotKeys() {
        if (!this._hotKeys) {
            this._hotKeys = new KeyMap([
                'ESC', _.bind(this.hide, this),
            ]);
            this._hotKeys.exclusive = true;
        }
        return this._hotKeys;
    },

    // ---------------------------------------------------------------------------------------------

    focus: function() {
        return this.list.focus();
    },

    copy: function(doubleTap) {
        return this.list.copy(doubleTap);
    },

    // ---------------------------------------------------------------------------------------------

    select: function(item) {
        this.list.select(item);
    },

    populate: function(commands, selectedCommand) {
        this.list.populate(commands, selectedCommand, MenuItem, MenuSeparator);
    },

    show: function(anchorBox) {
        if (!this.onMouseDown) {
            this.showing({target: this});
        }

        for (var parent = this; parent.length; parent = parent.parent()) {
            if (parent.keyManager) {
                var keyManager = parent.keyManager;
                this.query('.menu-item').each(_.bind(function(item) {
                    var command = item.cmd();
                    if (command) {
                        var hotKey = keyManager.findHotKey(command.id);
                        if (hotKey) {
                            item.hotKey = hotKey;
                        }
                    }

                }, this));
                break;                
            }
        }

        if (!this.parent().length) {
            anchorBox.parent().append(this);
        }

        var offset = anchorBox.offset();
        var parentOffset = this.parent().offset();
        
        var anchorX = offset.left - parentOffset.left;
        var width = this.width();
        var right = (offset.left + width) - window.scrollX;
        if (right > window.innerWidth && width < window.innerWidth) {
            anchorX = ((offset.left+offset.width) - parentOffset.left) - width;
        }

        var anchorY = (offset.top - parentOffset.top) + offset.height;
        var height = this.height();
        var bottom = (offset.top + offset.height + height) - window.scrollY;
        if (bottom > window.innerHeight && height < window.innerHeight) {
            anchorY = (offset.top - parentOffset.top) - height;
        }

        this.showAt(anchorX, anchorY);
    },

    showAt: function(anchorX, anchorY, menuParent) {
        if (!this.onMouseDown) {
            this.showing({target: this});
        }

        if (menuParent) {
            menuParent.append(this);
        }

        var width = this.width();
        if (anchorX+width > window.innerWidth && width < window.innerWidth) {
            anchorX = anchorX - width;
        }

        var height = this.height();
        if (anchorY+height > window.innerHeight && height < window.innerHeight) {
            anchorY = anchorY - height;
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
            this.onMouseMove = _.bind(function(event) {
                if (!$(event.target).closest('.menu').equals(this)) {
                    event.stopPropagation();
                    event.preventDefault();
                }
            }, this);
            $(window).listen('mousedown', this.onMouseDown, true);
            $(window).listen('mousemove', this.onMouseMove, true);

            this.addClass('visible');
            this.focus();

            this.shown({target: this});
        }
    },
    
    hide: function() {        
        window.removeEventListener('mousedown', this.onMouseDown, true);
        delete this.onMouseDown;
        window.removeEventListener('mousemove', this.onMouseMove, true);
        delete this.onMouseMove;

        this.addClass('fade');

        setTimeout(_.bind(function() {
            var container = this.parent().closest('*[tabindex]');
            if (container.length) {
                container.focus();
            } else {
                this.val().blur();
            }

            var selected = this.query('.menu-item.selected');
            if (selected.length) {
                selected.removeClass('selected');
            }

            this.removeClass('fade').removeClass('visible');

            this.hidden({target: this});
        }, this), 100);
    },

    // ---------------------------------------------------------------------------------------------

    onListSelected: function(event) {
        this.selected(event);
    },

    onListCommanded: function(event) {
        this.commanded(event);
        this.hide();
    },
});    

// *************************************************************************************************

var MenuItem =
exports.MenuItem = ListItem('.menu-item', {}, [
    html.HERE,
]);    

// *************************************************************************************************

var MenuSeparator =
exports.MenuSeparator = ListSeparator('.menu-separator', {}, [], {});

// *************************************************************************************************

var MenuSliderItem =
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
