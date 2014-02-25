
var $ = require('ore').query,
	html = require('ore/html');

exports.Tab = html.a('.Tab', {type: 'replace'}, [],
{
    get selected() {
        return this.cssClass('selected');
    },
    
    select: function() {
        this.parent().value = this.attr('value');
    }
});
