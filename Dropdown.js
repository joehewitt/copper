
var $ = require('ore'),
    _ = require('underscore'),
    html = require('ore/html');

var Button = require('./Button').Button,
    Menu = require('./Menu').Menu,
    MenuItem = require('./Menu').MenuItem;

// *************************************************************************************************

exports.Dropdown = Button('.dropdown', {menu: 'self'}, [
    html.div('.dropdown-title'),
    Menu('.dropdown-menu', {oncommanded: '$onMenuCommanded'}, [
        html.HERE,
    ]),
], {
    updated: $.event,
    
    get menu() {
        return this.openedMenu || this.query('.dropdown-menu', true);
    },

    get value() {
        return this._value;
    },

    get selectedItem() {
        return this.menu.query('.menu-item.checked', true);
    },

    set value(value) {
        this._value = value;

        var item = this.selectedItem;
        if (item.length) {
            item.removeClass('checked');
        }

        item = this.menu.query('.menu-item[value="' + escapeValue(value) + '"]');
        if (item.length) {
            item.addClass('checked');
            this.updateTitle(item);
        } 

        return value;
    },
    
    updateTitle: function(item) {
        var caption = item.attr('caption');
        this.query('.dropdown-title', true).html(caption);
    },

    // ---------------------------------------------------------------------------------------------

    onMenuCommanded: function(event) {
        var value = event.detail.target.attr('value');
        this.value = value;

        this.updated({target: this, value: value});
    }
});    

// *************************************************************************************************

function escapeValue(value) {
    // XXXjoe Escape quotes
    return value;
}
