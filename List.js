
"style copper/List.css"

var $ = require('ore').query,
    html = require('ore/html');

exports.List = html.div('.List', {onclick: '$onClick'}, [
    html.div('.ListContainer.kinetic.vertical', [
        html.HERE
    ])
],
{
    selectedItem: null,
    
    onClick: function(event) {
        var item = $(event.target).closest('.ListItem');
        this.selectItem(item);
    },
    
    selectItem: function(item) {
        if (this.selectedItem) {
            this.selectedItem.removeClass('selected');
        }
        this.selectedItem = item;
        item.addClass('selected');
        this.selectitem(item);
    },
    
    selectitem: $.event
});
