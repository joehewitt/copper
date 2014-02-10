
var $ = require('ore'),
    _ = require('underscore'),
    html = require('ore/html');

// *************************************************************************************************

exports.Dropdown = html.select('.Dropdown', {onchange: '$onChange'}, [
], {
    updated: $.event,
    
    get selectedItem() {
        var elt = this.val();
        return $(elt.options[elt.selectedIndex]);
    },

    get value() {
        return this.val().value;
    },

    set value(value) {
        return this.val().value = value;
    },

    onChange: function(event) {
        this.updated(event);
    }
});    

// *************************************************************************************************

exports.DropdownItem = html.option('.DropdownItem', {_value: '$value'}, [
    '$text',
], {
    get value() {
        return this.val().value;
    },

    set value(value) {
        return this.val().value = value;
    },
});    
