
var _ = require('underscore'),
    $ = require('ore'),
    html = require('ore/html');

var KeyMap = require('./KeyManager').KeyMap,
    Navigator = require('./Navigator').Navigator,
    Slider = require('./Slider').Slider,
    List = require('./List').List,
    ListItem = require('./List').ListItem,
    ListSeparator = require('./List').ListSeparator,
    NumericInput = require('./Input').NumericInput;

// *************************************************************************************************

var Menu =
exports.Menu = Navigator('.menu', {onnavigating: '$onNavigating', oncommanded: '$onListCommanded'},
[
    List('.menu-root-list', {tabindex: '-1'}, [
        html.HERE,
    ]),
], {
    showing: $.event.dom('showing', true),
    shown: $.event.dom('shown', true),
    hidden: $.event.dom('hidden', true),

    // ---------------------------------------------------------------------------------------------

    get hotKeys() {
        if (!this._hotKeys) {
            this._hotKeys = new KeyMap([
                'ESC', _.bind(this.hide, this),
            ]);
            this._hotKeys.exclusive = true;
        }
        return this._hotKeys;
    },

    get visible() {
        return this.cssClass('visible');
    },

    get list() {
        return this.query('.menu-root-list');
    },

    // ---------------------------------------------------------------------------------------------
    // ore.Set

    focus: function() {
        return this.list.focus();
    },

    copy: function(doubleTap) {
        return this.list.copy(doubleTap);
    },

    // ---------------------------------------------------------------------------------------------

    show: function(anchorBox) {
        if (!this.parent().length) {
            anchorBox.parent().append(this);
        }

        this.updateCommands(this.list);

        var offset = anchorBox.offset();

        var anchorX = offset.left;
        var width = this.width();
        var right = (offset.left + width) - window.scrollX;
        if (right > window.innerWidth && width < window.innerWidth) {
            anchorX = (offset.left+offset.width) - width;
        }

        var anchorY = offset.top + offset.height;
        var height = this.height();
        var bottom = (offset.top + offset.height + height) - window.scrollY;
        if (bottom > window.innerHeight && height < window.innerHeight) {
            anchorY = offset.top - height;
        }

        var container = anchorBox.contained('container');
        return this.showAt(anchorX, anchorY, container, true);
    },

    showAt: function(anchorX, anchorY, container, dontUpdateCommands) {
        if (!this.onMouseDown) {
            this.showing({target: this});
        }

        if (!dontUpdateCommands) {
            this.updateCommands(this.list);
        }

        this.originalParent = this.parent();
        if (!container) {
            container = $(document.body);
        }
        container.append(this);

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
                var menu = $(event.target).contained('menu');
                if (!menu || !menu.equals(this)) {
                    event.stopPropagation();
                    this.hide();
                }
                // event.preventDefault();
            }, this);
            this.onMouseMove = _.bind(function(event) {
                var menu = $(event.target).contained('menu');
                if (!menu || !menu.equals(this)) {
                    event.stopPropagation();
                    event.preventDefault();
                }
            }, this);
            this.onWindowBlur = _.bind(function(event) {
                if (event.target == window) {
                    this.hide();
                }
            }, this);
            this.onMouseWheel = _.bind(function(event) {
                // event.stopPropagation();
                // event.preventDefault();
            }, this);
            $(window).listen('mousedown', this.onMouseDown, true)
                     .listen('mousemove', this.onMouseMove, false)
                     .listen('mousewheel', this.onMouseWheel, true)
                     .listen('blur', this.onWindowBlur, true);

            container.addClass('showing-menu');
            this.showingAtContainer = container;

            this.addClass('visible');
            this.focus();

            this.shown({target: this});
            return true;
        }
    },

    hide: function() {
        $(window).unlisten('mousedown', this.onMouseDown, true)
                 .unlisten('mousemove', this.onMouseMove, false)
                 .unlisten('mousewheel', this.onMouseWheel, true)
                 .unlisten('blur', this.onWindowBlur, true);
        delete this.onMouseDown;
        delete this.onMouseMove;
        delete this.onMouseWheel;
        delete this.onWindowBlur;

        this.showingAtContainer.removeClass('showing-menu');
        delete this.showingAtContainer;

        this.addClass('fade');

        var container = this.parent().closest('*[tabindex]');
        if (container.length) {
            container.focus();
        } else {
            this.val().blur();
        }

        setTimeout(_.bind(function() {
            this.removeClass('fade').removeClass('visible');

            this.select(null);

            if (this.originalParent) {
                this.originalParent.append(this, true);
            }
            this.hidden({target: this});
        }, this), 100);
    },

    updateCommands: function(page) {
        for (var parent = this; parent.length; parent = parent.parent()) {
            if (parent.keyManager) {
                var keyManager = parent.keyManager;
                page.query('.menu-item').each(_.bind(function(item) {
                    var command = item.cmd();
                    if (command) {
                        item.html(command.title);

                        if (item.cssClass('checkbox')) {
                            item.cssClass('checked', command.value);
                        }

                        var hotKey = keyManager.findHotKey(command.id);
                        if (hotKey) {
                            item.hotKey = hotKey;
                        }
                    }

                }, this));
                break;
            }
        }
    },

    populate: function(commands, selectedCommand, hideInvalidItems) {
        this.list.populate(commands, selectedCommand, hideInvalidItems, MenuItem, MenuSeparator,
                           MenuLabel);
    },

    select: function(item) {
        this.list.select(item);
    },

    selectHome: function() {
        this.list.selectHome();
    },

    selectEnd: function() {
        this.list.selectEnd();
    },

    selectUp: function() {
        this.list.selectUp();
    },

    selectDown: function() {
        this.list.selectDown();
    },

    navigateForward: function() {
        this.list.navigateForward();
    },

    navigateBack: function() {
        this.list.navigateBack();
    },

    enter: function() {
        this.list.enter();
    },

    // ---------------------------------------------------------------------------------------------

    onNavigating: function(event) {
        if (!event.back) {
            this.updateCommands(event.page);
        }
    },

    onListCommanded: function(event) {
        if (!event.defaultPrevented) {
            this.hide();
        }
    },
});

// *************************************************************************************************

var MenuItem =
exports.MenuItem = ListItem('.menu-item', {draggable: 'true'}, [
    html.HERE,
]);

// *************************************************************************************************

var MenuSeparator =
exports.MenuSeparator = ListSeparator('.menu-separator', {}, [], {});

// *************************************************************************************************

var MenuLabel =
exports.MenuLabel = html.div('.menu-label', {}, ['$label'], {});

// *************************************************************************************************

var MenuSliderItem =
exports.MenuSliderItem = html.div('.menu-slider-item', {}, [
    html.div('.menu-item-title'),
    Slider('.menu-item-slider', {onupdated: '$onSliderUpdated'}),
    NumericInput('.menu-item-input', {onupdated: '$onNumberUpdated'}),
], {
    updated: $.event,

    // ---------------------------------------------------------------------------------------------

    get value() {
        return this._value;
    },

    set value(value) {
        this._value = value;
        this.query('.menu-item-input').value = value;
        this.query('.menu-item-slider').value = value;
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

    // ---------------------------------------------------------------------------------------------

    onSliderUpdated: function(slider) {
        this.query('.menu-item-input').value = slider.value;
        this.updated(slider.value);
    },

    onNumberUpdated: function(input) {
        this.query('.menu-item-slider').value = input.value;
        this.updated(input.value);
    }
});
