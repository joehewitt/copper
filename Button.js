
var $ = require('ore'),
    _ = require('underscore'),
    html = require('ore/html');

// *************************************************************************************************

exports.Button = html.div('.button', {}, [
], {
    value: null,

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

    toggle: function() {
        this.selected = !this.selected;
    },

    showMenu: function(menu) {
        var menuSelector = this.attr('menu');
        if (menuSelector) {
            var container = this.closest('.Container');
            if (!container.length) {
                container = $(document);
            }

            var menu = container.query(menuSelector);
            if (menu.length) {
                var onHidden = _.bind(function () {
                    this.removeClass('depressed');
                    menu.unlisten('hidden', onHidden);
                }, this);

                this.addClass('depressed');
                menu.listen('hidden', onHidden);
                return menu.show(this);
            }
        }
    }
});    

// *************************************************************************************************

exports.Checkbox = html.input('.Checkbox', {type: 'checkbox'}, [
], {
    value: null,

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

    toggle: function() {
        this.checked = !this.checked;
    }
});    
