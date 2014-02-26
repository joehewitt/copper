
var _ = require('underscore'),
    $ = require('ore'),
    html = require('ore/html');

var KeyMap = require('./KeyManager').KeyMap,
    Slider = require('./Slider').Slider,
    NumericInput = require('./Input').NumericInput,
    CMD = require('./Command').CMD;

// *************************************************************************************************

var Menu =
exports.Menu = html.div('.menu', {tabindex: '-1', onmouseover: '$onMouseOver',
                                  onmouseout: '$onMouseOut', onclick: '$onClick'}, [
], {
    showing: $.event,
    shown: $.event,
    hidden: $.event,
    commanded: $.event,
    selected: $.event,

    get visible() {
        return this.cssClass('visible');
    },

    get hotKeys() {
        if (!this._hotKeys) {
            this._hotKeys = new KeyMap([
                'UP', _.bind(this.selectUp, this),
                'DOWN', _.bind(this.selectDown, this),
                'HOME', _.bind(this.selectHome, this),
                'END', _.bind(this.selectEnd, this),
                'ENTER', _.bind(this.enter, this),
                'CMD+ENTER', _.bind(this.multiEnter, this),
                'ESC', _.bind(this.hide, this),
            ]);
            this._hotKeys.exclusive = true;
        }
        return this._hotKeys;
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
                if (prev.cssClass('menu-item')) {
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
                if (next.cssClass('menu-item')) {
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
        var command = item.cmd();

        var evt = {target: item, command: command};
        if (command) {
            command.command(evt);
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

    populate: function(commands, selectedCommand) {
        for (var i = 0, l = commands.length; i < l; ++i) {
            var command = commands[i];
            if (command == CMD.SEPARATOR) {
                var separator = new MenuSeparator();
                this.append(separator);
            } else if (command.validate()) {
                var item = new MenuItem();
                var className = command.className;
                if (className == 'info') {
                    item.addClass('typeahead-menu-info');
                } else {
                    item.addClass('typeahead-menu-item');
                    if (className) {
                        item.addClass(className);
                    }
                }
                if (command.hasChildren) {
                    item.addClass('has-children');                            
                }
                item.title = command.title;
                item.cmd(command);
                
                if (command == selectedCommand) {
                    this.select(item);
                }
                this.append(item);
            }
        }            
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
            this.val().focus();

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
            if (this.equals($(document.activeElement))) {
                var container = this.parent().closest('*[tabindex]');
                if (container.length) {
                    container.val().focus();
                } else {
                    this.val().blur();
                }
            }

            var selected = this.query('.menu-item.selected');
            if (selected.length) {
                selected.removeClass('selected');
            }

            this.removeClass('fade').removeClass('visible');

            this.hidden({target: this});
        }, this), 100);
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
    },
});    

// *************************************************************************************************

var MenuItem =
exports.MenuItem = html.div('.menu-item', {}, [
    html.div('.menu-item-title', [html.HERE]),
    html.div('.menu-item-hotkey', []),
], {
    commanded: $.event,

    get hotKey() {
        return this.query('.menu-item-title').text();
    },

    set hotKey(value) {
        this.query('.menu-item-hotkey').html(value);
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

var MenuSeparator =
exports.MenuSeparator = html.div('.menu-separator', {}, [], {});

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
