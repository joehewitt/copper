
var _ = require('underscore'),
    $ = require('ore'),
    html = require('ore/html');

var KeyMap = require('./KeyManager').KeyMap,
    BINDKEY = require('./KeyManager').BINDKEY,
    CMD = require('./Command').CMD;

// *************************************************************************************************

exports.List = html.div('.list', {onmouseover: '$onMouseOver', onmouseout: '$onMouseOut',
                                  onclick: '$onClick'}, [], {
    commanded: $.event,
    selected: $.event,
    pushed: $.event.dom('pushed', true),
    popped: $.event.dom('popped', true),

    get hotKeys() {
        if (!this._hotKeys) {
            this._hotKeys = new KeyMap([
                'HOME', BINDKEY(this.selectHome, this),
                'END', BINDKEY(this.selectEnd, this),
                'UP', BINDKEY(this.selectUp, this),
                'DOWN', BINDKEY(this.selectDown, this),
                'LEFT', BINDKEY(this.navigateBack, this),
                'RIGHT', BINDKEY(this.navigateForward, this),
                'ENTER', BINDKEY(this.enter, this),
                '*', _.bind(this.onInput, this),
            ]);
        }
        return this._hotKeys;
    },

    // ---------------------------------------------------------------------------------------------

    select: function(item) {
        var previousItems = this.query('.list-item.selected');
        previousItems.removeClass('selected').each(function(item) {
            var command = item.cmd();
            if (command) {
                command.hover(false);
            }
        });
        if (item && item.length) {
            item.addClass('selected').each(function(item) {
                var command = item.cmd();
                if (command) {
                    command.hover(true);
                }
            });
            this.selected({target: item});
        } else {
            this.selected({target: null});            
        }
    },

    selectByText: function(text) {
        var pattern = new RegExp(text.split('').join('.*?') + '.*?', 'i');
        var item = this.query('.list-item.selected').next();
        if (!item.length) {
            item = this.query('.list-item', true);
        }

        for (; item.length; item = item.next()) {
            var text = item.text();
            if (pattern.exec(text)) {
                this.select(item);
                break;
            }
        }
    },

    selectHome: function() {
        var items = this.query('.list-item');
        this.select(items.get(0));
    },

    selectEnd: function() {
        var items = this.query('.list-item');
        this.select(items.get(items.length-1));
    },

    selectUp: function() {
        var selected = this.query('.list-item.selected');
        if (selected.length) {
            for (var prev = selected.previous(); prev.length; prev = prev.previous()) {
                if (prev.cssClass('list-item')) {
                    this.select(prev);
                    break;
                }
            }
        } else {
            this.selectEnd();
        }
    },

    selectDown: function() {
        var selected = this.query('.list-item.selected');
        if (selected.length) {
            for (var next = selected.next(); next.length; next = next.next()) {
                if (next.cssClass('list-item')) {
                    this.select(next);
                    break;
                }
            }
        } else {
            this.selectHome();
        }
    },

    navigateForward: function() {
        var selected = this.query('.list-item.selected');
        this.pushed({target: this, item: selected});
    },

    navigateBack: function() {
        var selected = this.query('.list-item.selected');
        this.popped({target: this, item: selected});
    },

    enter: function() {
        var selected = this.query('.list-item.selected');
        if (selected.length) {
            this.enterItem(selected);
        }
    },

    enterItem: function(item) {
        var command = item.cmd();
        if (command && command.hasChildren) {
            this.navigateForward();
        } else {
            var evt = {target: item, command: command};
            if (command) {
                command.command(evt);
            }
            if (!evt.prevent && typeof(item.commanded) == 'function') {
                item.commanded(evt);
            }
            if (!evt.prevent) {
                this.commanded(evt);
            }
        }
    },

    copy: function(doubleTap) {
        var selected = this.query('.list-item.selected');
        if (selected.length) {
            var command = selected.cmd();
            if (command) {
                return command.copy(doubleTap);
            }
        }
    },

    populate: function(commands, selectedCommand, itemType, separatorType) {
        if (!itemType) {
            itemType = ListItem;
        }
        if (!separatorType) {
            separatorType = ListSeparator;
        }

        for (var i = 0, l = commands.length; i < l; ++i) {
            var command = commands[i];
            if (command == CMD.SEPARATOR) {
                var separator = new separatorType();
                this.append(separator);
            } else if (command.validate()) {
                var className = command.className;
                if (className == 'info') {
                    var item = new html.div()
                    item.addClass('list-info');
                    item.html(command.title);
                    this.append(item);
                } else {
                    var item = new itemType();
                    item.title = command.title;
                    item.cmd(command);

                    if (className) {
                        item.addClass(className);
                    }
                    if (command.hasChildren) {
                        item.addClass('has-children');
                    }                
                    if (command == selectedCommand) {
                        this.select(item);
                    }
                    this.append(item);
                }
            }
        }            
    },
    
    // ---------------------------------------------------------------------------------------------

    onClick: function(event) {
        var item = $(event.target).closest('.list-item');
        if (item.length) {
            this.enterItem(item);
            event.preventDefault();
        }
    },

    onMouseOver: function(event) {
        var item = $(event.target).closest('.list-item');
        this.select(item.length ? item : null);
    },

    onMouseOut: function(event) {
        if (!$(event.toElement).closest('.list').equals(this)) {
            this.select(null);
        }
    },

    onInput: function(event) {
        var c = event.keyCode;
        if (!event.metaKey && !event.shiftKey && !event.ctrlKey && !event.altKey)
        if ((c >= 65 && c <= 90) || (c >= 48 && c <= 57)) {
            this.selectByText(String.fromCharCode(c));
            return true;
        }
    },    
});    

// *************************************************************************************************

var ListItem =
exports.ListItem = html.div('.list-item', {}, [
    html.div('.list-item-title', [html.HERE]),
    html.div('.list-item-hotkey', []),
], {
    commanded: $.event,

    get hotKey() {
        return this.query('.list-item-title').text();
    },

    set hotKey(value) {
        this.query('.list-item-hotkey').html(value);
        return value;
    },

    get title() {
        return this.query('.list-item-title').text();
    },

    set title(value) {
        this.query('.list-item-title').html(value);
        return value;
    },
});    

// *************************************************************************************************

var ListSeparator =
exports.ListSeparator = html.div('.list-separator', {}, [], {});
