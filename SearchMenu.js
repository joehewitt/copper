
var $ = require('ore'),
    _ = require('underscore'),
    html = require('ore/html'),
    KeyMap = require('copper/KeyManager').KeyMap,
    BINDKEY = require('copper/KeyManager').BINDKEY,
    Command = require('copper/Command').Command,
    CMD = require('copper/Command').CMD,
    CommandMap  = require('copper/Command').CommandMap,
    NavigationBar = require('copper/Navigator').NavigationBar,
    List = require('copper/List').List,
    MenuItem = require('copper/Menu').MenuItem,
    MenuSeparator = require('copper/Menu').MenuSeparator,
    Menu = require('copper/Menu').Menu;

// *************************************************************************************************

exports.SearchMenu = Menu('.search-menu', {onshowing: '$onMenuShowing', onhidden: '$onMenuHidden',
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
        this.resultStack = [];

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

    activate: function(commands) {
        this.value = '';
        this.resultStack = [];
        this.popPage(true, true);

        if (commands) {
            this.pushResults(commands, null, true);
        } else if (this.defaultCommand) {
            this.empty();
            this.populate(this.defaultCommand.children);
        }
    },

    search: function(text) {
        var newCommands = [];

        text = text.trim();
        if (text.length) {
            var pattern = new RegExp(text.split('').join('.*?') + '.*?', 'i');

            var searchSet = this.searchCommands ? this.searchCommands : this.commands;
            for (var i = 0, l = searchSet.length; i < l; ++i) {
                var commands = searchSet[i];
                var matches = commands.match(pattern);
                newCommands = newCommands.concat(matches);
            }

            this.replaceResults(newCommands);
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

    replaceResults: function(commands) {
        if (this.resultStack.length) {
            this.resultStack[this.resultStack.length-1] = {commands: commands};
        } else {
            this.resultStack.push({commands: commands});
        }
        this.showResults(commands);
    },

    pushResults: function(commands, selectedCommand, isNewSearch) {
        if (this.resultStack.length) {
            this.resultStack[this.resultStack.length-1].selected = selectedCommand;
        }
        this.resultStack.push({commands: commands, isNewSearch: isNewSearch});
        if (isNewSearch) {
            this.searchCommands = [commands];
        } else {
            this.searchCommands = null;
        }
        this.showResults(commands);
    },

    popResults: function() {        
        if (this.resultStack.length >= 2) {
            this.resultStack.pop();
            if (this.resultStack.length) {
                var info = this.resultStack[this.resultStack.length-1];
                if (info.isNewSearch) {
                    this.searchCommands = [info.commands];
                } else {
                    this.searchCommands = null;
                }
                this.showResults(info.commands, info.selected);
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

    hover: function(command) {
        if (this.hoveredCommand) {
            this.hoveredCommand.hover(false);
        }
        if (command) {
            this.hoveredCommand = command;
            command.hover(true);
        } else {
            this.hoveredCommand = null;
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

    onMenuHidden: function() {
        this.hover();

        this.searchCommands = null;
        this.resultStack = [];
    },
});    

// *************************************************************************************************

var SearchMenuInputBox = html.div('.search-menu-input-box', {}, [
    html.input('.search-menu-input', {}),
]);

