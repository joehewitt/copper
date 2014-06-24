
var $ = require('ore'),
    _ = require('underscore'),
    html = require('ore/html');

var Button = require('./Button').Button,
    Menu = require('./Menu').Menu,
    MenuItem = require('./Menu').MenuItem;

// *************************************************************************************************

exports.Dropdown = Button('.dropdown', {menu: 'self'}, [
    html.div('.dropdown-title', [
        html.HERE,
    ]),
    Menu('.dropdown-menu', {oncommanded: '$onMenuCommanded'}),
], {
    updated: $.event,
    
    // ---------------------------------------------------------------------------------------------
    
    get value() {
        return this._value;
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

    get selectedItem() {
        return this.menu.query('.menu-item.checked', true);
    },
    
    // ---------------------------------------------------------------------------------------------
    
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
    return value ? value.replace(/"/g, '\\"') : '';
}
