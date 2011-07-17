
var $ = require('ore').query,
	html = require('ore/html');

exports.Tab = html.a('.Tab', {type: 'replace'}, [],
{
    select: function() {
        this.parent().selectTab(this);
    }
});
