
var _ = require('underscore'),
    $ = require('ore/query'),
    html = require('ore/html');

var Button = require('./Button').Button,
    KeyMap = require('./KeyManager').KeyMap,
    BINDKEY = require('./KeyManager').BINDKEY;

// *************************************************************************************************

exports.Dialog = html.div('.dialog', {}, [
    html.div('.dialog-cover'),
    html.div('.dialog-window', {tabindex: '-1'}, [
        html.HERE,

        html.div('.dialog-buttons', [
            html.div('.flexer'),
            Button('.cancel-button', {onclick: '$onClickCancel'}, ['Cancel']),
            Button('.confirm-button', {onclick: '$onClickAccept'}, ['$okMessage']),
        ]),
    ]),
], {
    get hotKeys() {
        if (!this._hotKeys) {
            this._hotKeys = new KeyMap([
                'ENTER', BINDKEY(this.accept, this),
                'ESC', BINDKEY(this.cancel, this),
            ]);
            this._hotKeys.exclusive = true;
        }
        return this._hotKeys;
    },

    get okMessage() {
        return 'Ok';
    },

    show: function(cb) {
        this.callback = cb;
        this._show();
    },

    hide: function() {
        this.remove();
    },

    accept: function() {
        this._accept();
    },

    cancel: function() {
        this._respond(1);
    },

    didShow: function() {
        var win = this.query('.dialog-window', true);
        setTimeout(function() { win.focus(); });
    },

    // ---------------------------------------------------------------------------------------------

    _show: function() {
        app.append(this);
        this.didShow();
    },

    _accept: function(result) {
        this._respond(0, result);
    },

    _respond: function(err, url) {
        if (this.callback) {
            var cb = this.callback;
            this.callback = null;
            cb(err, url);
        }
        this.hide();
    },

    // ---------------------------------------------------------------------------------------------

    onClickCancel:function() {
        this.cancel();
    },

    onClickAccept: function() {
        this.accept();
    },
});

// *************************************************************************************************

exports.InfoDialog = exports.Dialog('.info-dialog', {}, [
    html.div('.dialog-title'),
    html.div('.dialog-message'),
], {
    populate: function(title, message) {
        this.query('.dialog-title', true).html(title);
        this.query('.dialog-message', true).html(message);
    }
});

exports.InfoDialog.show = function(title, message, cb) {
    var dialog = new exports.InfoDialog({});
    dialog.populate(title, message);
    dialog.show(cb);
}
