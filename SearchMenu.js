
var _ = require('underscore'),
    $ = require('ore'),
    html = require('ore/html');

var KeyMap = require('./KeyManager').KeyMap,
    BINDKEY = require('./KeyManager').BINDKEY,
    List = require('./List').List,
    Menu = require('./Menu').Menu,
    MenuItem = require('./Menu').MenuItem,
    MenuSeparator = require('./Menu').MenuSeparator,
    MenuLabel = require('./Menu').MenuLabel;

// *************************************************************************************************

exports.SearchMenu = Menu('.search-menu', {onshowing: '$onMenuShowing',
                                           onshown: '$onMenuShown', onpushed: '$onPushed',
                                           onnavigated: '$onNavigated',
                                           ondragstart: '$onDragStart'}, [
], {
    searched: $.event,

    get value() {
        return this.input.val().value;
    },

    set value(value) {
        return this.input.val().value = value;
    },

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
                'ESC', _.bind(this.hide, this),
            ]);
            this._hotKeys.exclusive = true;
        }
        return this._hotKeys;
    },

    // ---------------------------------------------------------------------------------------------
    // ore.Tag

    construct: function() {
        var inputBox = new SearchMenuInputBox();
        this.input = inputBox.query('.search-menu-input');
        this.input.listen('input', _.bind(this.onInput, this));

        var list = this.list;
        list.addClass('quasifocus');
        list.attr('tabindex', null);
        list.remove();
        this.replacePage(list, inputBox);
    },

    // ---------------------------------------------------------------------------------------------

    activate: function() {
        this.value = '';
        this.popPage(true, true);

        if (this.defaultCommand) {
            this.empty();
            this.populate(this.defaultCommand.children);
        }
    },

    search: function(text) {
        var newCommands = [];

        text = text.trim();
        if (text.length) {
            this.searched({text: text, results: newCommands});
            this.showResults(newCommands);
            this.updateCommands(this.list);
        } else if (this.defaultCommand) {
            this.empty();
            this.populate(this.defaultCommand.children);
        }
    },

    showResults: function(commands, selectedCommand) {
        this.list.select();
        this.empty();
        this.populate(commands, selectedCommand, true);
        if (!selectedCommand) {
            var firstItem = this.query('.menu-item:not(.disabled)', true);
            if (firstItem.length) {
                this.list.select(firstItem);
            }
        }
    },

    // ---------------------------------------------------------------------------------------------

    onInput: function(event) {
        this.search(this.value);
    },

    onPushed: function(event) {
        var command = event.detail.item.cmd();
        if (command && command.hasChildren) {
            var page = new List();
            page.attr('tabindex', -1);
            var newCommands = command.children;
            page.populate(newCommands, newCommands[0], false, MenuItem, MenuSeparator, MenuLabel);

            this.pushPage(page, command.title);
        }
    },

    onNavigated: function(event) {
        var page = this.currentPage;
        if (page == this.list) {
            this.input.focus();
        } else {
            page.focus();
        }
    },

    onMenuShowing: function(event) {
        this.activate();
    },

    onMenuShown: function(event) {
        this.input.focus();
    },

    onDragStart: function(event) {
        var item = $(event.target).contained('list-item');
        var command = item ? item.cmd() : null;
        if (command && command.hasDrag) {
            if (command.drag(event.dataTransfer)) {
                event.dataTransfer.setDragImage(item.nodes[0], 0, 0);
                return;
            }
        }
        event.preventDefault();
    }
});

// *************************************************************************************************

var SearchMenuInputBox = html.div('.search-menu-input-box', {}, [
    html.input('.search-menu-input', {}),
]);
