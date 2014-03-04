
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
        if (selected) {
            this.addClass('selected');
        } else {
            this.removeClass('selected');
        }
        return selected;
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
                var container = this.closest('.container');
                if (!container.length) {
                    container = $(document);
                }
                var menu = container.query(menuSelector, true);
                return menu.length ? menu : null;
            }
        }
    },

    // ---------------------------------------------------------------------------------------------

    toggle: function() {
        this.selected = !this.selected;
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
            return menu.show(this);
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
        if (checked) {
            this.prop('checked', true);
        } else {
            this.prop('checked', false);
        }
        return checked;
    },

    // ---------------------------------------------------------------------------------------------
    
    toggle: function() {
        this.checked = !this.checked;
    }
});    
