
var $ = require('ore'),
    _ = require('underscore'),
    html = require('ore/html');

// *************************************************************************************************

exports.Button = html.div('.button', {}, [
], {
    value: null,

    openingmenu: $.event.dom('openingmenu', true),
    closingmenu: $.event.dom('closingmenu', true),

    // ---------------------------------------------------------------------------------------------

    get group() {
        return this.attr('group');
    },

    set group(group) {
        this.attr('group', group);
        this.selected = group == this.attr('value');
    },

    get selected() {
        return this.cssClass('selected');
    },

    set selected(selected) {
        this.cssClass('selected', selected);
    },

    get checked() {
        return this.cssClass('checked');
    },

    set checked(checked) {
        this.cssClass('checked', checked);
    },

    get menu() {
        if (this.openedMenu) {
            return this.openedMenu;
        }

        var menuSelector = this.attr('menu');
        if (menuSelector) {
            if (menuSelector == 'self') {
                var menu = this.query('.menu', true);
                if (!menu.length) {
                    menu = this.createMenu();
                    if (menu) {
                        this.append(menu, true);
                        return menu;
                    }
                } else {
                    return menu;
                }
            } else {
                var menu = this.query(menuSelector, true);
                if (!menu.length) {
                    var container = this.contained('container');
                    if (!container) {
                        container = $(document);
                    }
                    menu = container.query(menuSelector, true);
                    return menu.length ? menu : null;
                }
            }
        }
    },

    // ---------------------------------------------------------------------------------------------

    toggle: function() {
        this.checked = !this.checked;
    },

    createMenu: function() {
    },

    showMenu: function(menu) {
        var menu = this.menu;
        if (menu) {
            this.openedMenu = menu;
            this.openingmenu({target: this, menu: menu});

            var onHidden = _.bind(function () {
                this.openedMenu = null;
                this.removeClass('depressed');
                menu.unlisten('hidden', onHidden);
                this.closingmenu({target: this, menu: menu});
            }, this);

            this.addClass('depressed');
            menu.listen('hidden', onHidden);
            return menu.show(this) ? menu : null;
        }
    }
});

// *************************************************************************************************

exports.Checkbox = html.input('.checkbox', {type: 'checkbox'}, [
], {
    value: null,

    // ---------------------------------------------------------------------------------------------

    get checked() {
        return this.prop('checked');
    },

    set checked(checked) {
        this.prop('checked', !!checked);
    },

    // ---------------------------------------------------------------------------------------------

    toggle: function() {
        this.checked = !this.checked;
    }
});
