
var $ = require('ore'),
    _ = require('underscore'),
    html = require('ore/html');

var Button = require('./Button').Button,
    Menu = require('./Menu').Menu,
    MenuItem = require('./Menu').MenuItem;

// *************************************************************************************************

exports.Dropdown = Button('.dropdown', {menu: 'self', onopeningmenu: '$onMenuOpening',
                                        onclosingmenu: '$onMenuClosing'}, [
    html.div('.dropdown-title', []),
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
        } else {
            this.updateCaption(value);
        }

        return value;
    },

    get selectedItem() {
        return this.menu.query('.menu-item.checked', true);
    },

    createMenu: function() {
        var menu = new Menu();
        menu.addClass('dropdown-menu');
        return menu;
    },

    // ---------------------------------------------------------------------------------------------

    updateTitle: function(item) {
        var caption = item.attr('caption');
        if (!caption) {
            caption = item.text();
        }
        this.query('.dropdown-title', true).text(caption);
    },

    updateCaption: function(caption) {
        this.query('.dropdown-title', true).text(caption);
    },

    // ---------------------------------------------------------------------------------------------

    onMenuOpening: function(event) {
        this._commanded = _.bind(this.onMenuCommanded, this);

        var fontSize = this.style('fontSize');

        var menu = event.detail.menu;

        menu.query('.menu-item.checked').removeClass('checked');

        var item = menu.query('.menu-item[value="' + escapeValue(this._value) + '"]');
        item.addClass('checked');

        menu.css('fontSize', fontSize);
        menu.listen('commanded', this._commanded);
    },

    onMenuClosing: function(event) {
        var menu = event.detail.menu;
        menu.unlisten('commanded', this._commanded);
        this._commanded = null;
    },

    onMenuCommanded: function(event) {
        var value = event.detail.target.attr('value');
        this.value = value;
        this.updated({target: this, value: value});
    },
});

// *************************************************************************************************

function escapeValue(value) {
    return value ? value.replace(/"/g, '\\"') : '';
}
