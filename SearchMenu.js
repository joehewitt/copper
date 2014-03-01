
var _ = require('underscore'),
    $ = require('ore'),
    html = require('ore/html'),
    KeyMap = require('copper/KeyManager').KeyMap,
    BINDKEY = require('copper/KeyManager').BINDKEY,
    List = require('copper/List').List,
    Menu = require('copper/Menu').Menu,
    MenuItem = require('copper/Menu').MenuItem,
    MenuSeparator = require('copper/Menu').MenuSeparator;

// *************************************************************************************************

exports.SearchMenu = Menu('.search-menu', {onshowing: '$onMenuShowing',
                                           onshown: '$onMenuShown', onpushed: '$onPushed',
                                           onnavigated: '$onNavigated'}, [
], {
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

    construct: function() {
        this.commands = [];

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
            var pattern = new RegExp(text.split('').join('.*?') + '.*?', 'i');

            for (var i = 0, l = this.commands.length; i < l; ++i) {
                var commands = this.commands[i];
                var matches = commands.match(pattern);
                newCommands = newCommands.concat(matches);
            }

            this.showResults(newCommands);
            this.updateHotKeys(this.list);
        } else if (this.defaultCommand) {
            this.empty();
            this.populate(this.defaultCommand.children);
        }
    },

    addCommands: function(commands) {
        this.commands.push(commands);
    },

    removeCommands: function(commands) {
        var index = this.commands.indexOf(commands);
        if (index >= 0) {
            this.commands.splice(index, 1);
        }
    },

    findCommand: function(name) {
        for (var i = this.commands.length-1; i >= 0; --i) {
            var cmd = this.commands[i][name];
            if (cmd) {
                return cmd;
            }
        }
    },

    showResults: function(commands, selectedCommand) {
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
            page.populate(newCommands, newCommands[0], false, MenuItem, MenuSeparator);

            this.pushPage(page, command.title);
        }
    },

    onNavigated: function() {
        var page = this.currentPage;
        if (page == this.list) {
            this.input.focus();
        } else {
            page.focus();
        }
    },

    onMenuShowing: function() {
        this.activate();
    },

    onMenuShown: function() {
        this.input.focus();
    },
});    

// *************************************************************************************************

var SearchMenuInputBox = html.div('.search-menu-input-box', {}, [
    html.input('.search-menu-input', {}),
]);
