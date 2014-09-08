
var $ = require('ore'),
    _ = require('underscore'),
    html = require('ore/html');

// *************************************************************************************************

exports.Button = html.div('.button', {}, [
], {
    value: null,

    // ---------------------------------------------------------------------------------------------

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
                return menu.length ? menu : null;
            } else {
                var menu = this.query(menuSelector, true);
                if (!menu.length) {
                    var container = this.closest('.container');
                    if (!container.length) {
                        container = $(document);
                    }
                    menu = container.query(menuSelector, true);
                }

                return menu.length ? menu : null;
            }
        }
    },

    // ---------------------------------------------------------------------------------------------

    toggle: function() {
        this.checked = !this.checked;
    },

    showMenu: function(menu) {
        var menu = this.menu;
        if (menu) {
            this.openedMenu = menu;

            var onHidden = _.bind(function () {
                this.openedMenu = null;
                this.removeClass('depressed');
                menu.unlisten('hidden', onHidden);
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
