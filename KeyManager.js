
var _ = require('underscore'),
    $ = require('ore');

var Command = require('./CommandManager').Command;

// *************************************************************************************************

exports.KeyManager = function(rootElement) {
    this.rootElement = rootElement;
    this.keyMaps = [];
    this.keysDown = [];

    this._onKeyDown = _.bind(this._onKeyDown, this);
    this._onKeyPress = _.bind(this._onKeyPress, this);
    this._onKeyUp = _.bind(this._onKeyUp, this);
    this._onFocusIn = _.bind(this._onFocusIn, this);
    this._onFocusOut = _.bind(this._onFocusOut, this);
    this._onWindowBlur = _.bind(this._onWindowBlur, this);
    
    this.activate();
}

exports.KeyManager.MODIFIER_FALSE = false;
exports.KeyManager.MODIFIER_TRUE = true;
exports.KeyManager.MODIFIER_EITHER = 2;

var namedKeys =
exports.KeyManager.namedKeys = {
    UP: 38,
    DOWN: 40,
    LEFT: 37,
    RIGHT: 39,
    SPACE: 32,
    PAGEUP: 33,
    PAGEDOWN: 34,
    HOME: 36,
    END: 35,
    ESC: 27,
    BACKSPACE: 8,
    DEL: 46,
    TAB: 9,
    BACKTICK: 192,
    ENTER: 13,
    RETURN: 13,
    SHIFT: 16,
    CMD: 91,
    COMMAND: 91,
    OPT: 18,
    OPTION: 18,
    ALT: 19,
    CTRL: 17,
    CONTROL: 17,
};

var modifierKeys =
exports.KeyManager.modifierKeys = {
    16: 'SHIFT',
    91: 'COMMAND',
    93: 'COMMAND',
    18: 'OPTION',
    19: 'ALT',
    17: 'CONTROL',
};

exports.BINDKEY = function(fn, self) {
    return function() {
        fn.apply(self, arguments);
        return true;
    }
}

// *************************************************************************************************

exports.KeyManager.prototype = {
    activate: function() {
        if (window.document) {
            if (1 || jQuery.browser.safari) {
                this.rootElement.listen("keydown", this._onKeyDown)
                                .listen("keypress", this._onKeyPress);
            } else {
                this.rootElement.listen("keypress", this._onKeyDown)
                                .listen("keypress", this._onKeyPress);
            }

            this.rootElement.listen("keyup", this._onKeyUp)
                            .listen("focusin", this._onFocusIn)
                            .listen("focusout", this._onFocusOut);
            $(window).listen("blur", this._onWindowBlur, true);
        }
    },
    
    deactivate: function() {
        if (1 || jQuery.browser.safari) {
            this.rootElement.unlisten("keydown", this._onKeyDown)
                            .unlisten("keypress", this._onKeyPress);
        } else {
            this.rootElement.unlisten("keypress", this._onKeyDown)
                            .unlisten("keypress", this._onKeyPress);
        }

        this.rootElement.unlisten("keyup", this._onKeyUp)
                        .unlisten("focusin", this._onFocusIn)
                        .unlisten("focusout", this._onFocusOut);
        $(window).unlisten("blur", this._onWindowBlur, true);
    },
    
    findHotKey: function(commandId) {
        var keyMaps = this._activeKeyMaps;
        for (var i = 0, l = keyMaps.length; i < l; ++i) {
            var keyMap = keyMaps[i];
            var combo = keyMap.commandMap[commandId];
            if (combo) {
                return formatCombo(combo);
            }
        }
    },

    processKey: function(event, keyCode, shift, meta, alt, ctrl, up, forceDefault) {
        if (up) {
            var index = this.keysDown.indexOf(keyCode);
            if (index >= 0) {
                this.keysDown.splice(index, 1);
            }
        } else if (keyCode != this.keysDown[this.keysDown.length-1]) {
            this.keysDown.push(keyCode);
        }

        var keyMaps = this._activeKeyMaps;
        for (var i = 0, l = keyMaps.length; i < l; ++i) {
            if (this._processKeyMap(keyMaps[i], event, keyCode, shift, meta, alt, ctrl, up,
                                    forceDefault)) {
                break;
            }
        }
    },

    processChar: function(event, charCode) {
        var caught = false;

        var keyMaps = this._activeKeyMaps;
        for (var i = 0, l = keyMaps.length; i < l; ++i) {
            var keyMap = keyMaps[i];
            if (keyMap.processChar(event, charCode)) {
                caught = true;
            }
            if (keyMap.exclusive) {
                break;
            }
        }

        return caught;
    },
    
    redispatchSequence: function() {
        var keyMaps = this._activeKeyMaps;
        for (var i = 0, l = keyMaps.length; i < l; ++i) {
            var keyMap = keyMaps[i];
            if (keyMap.processSequenceKey(null, this.keysDown, true)) {
                break;
            }
        }
    },

    add: function(keyMap) {
        keyMap.manager = this;
        this.keyMaps.push(keyMap);
    },
    
    remove: function(keyMap) {
        var keyMaps = this.keyMaps;
        var index = keyMaps.indexOf(keyMap);
        if (index >= 0) {
            keyMaps.splice(index, 1);
        }
        keyMap.processSequenceKey(null, [], true);
    },

    // ---------------------------------------------------------------------------------------------

    get _activeKeyMaps() {
        var activeKeyMaps = [];

        var keyMaps = this.keyMaps;
        for (var i = keyMaps.length-1; i >= 0; --i) {
            var keyMap = keyMaps[i];
            for (var map = keyMap.lastSibling; map; map = map.previousSibling) {
                activeKeyMaps.push(map);
            }
            activeKeyMaps.push(keyMap);
        }
        
        keyMaps = this.focusedKeyMaps;
        for (var i = 0, l =keyMaps ? keyMaps.length : 0; i < l; ++i) {
            var keyMap = keyMaps[i];
            for (var map = keyMap.lastSibling; map; map = map.previousSibling) {
                activeKeyMaps.push(map);
            }
            activeKeyMaps.push(keyMap);
        }

        return activeKeyMaps;
    },

    get _modeKeysDown() {
        var keyMaps = this._activeKeyMaps;
        for (var i = 0, l = keyMaps.length; i < l; ++i) {
            var keyMap = keyMaps[i];
            if (keyMap.modeKeysDown) {
                return true;
            } else if (keyMap.exclusive) {
                break;
            }
        }
    },

    _keyMapsForTarget: function(target) {
        var keyMaps = [];

        if (target) {
            for (var target = $(target); target.length; target = target.parent()) {
                var keyMap = target.hotKeys;
                if (keyMap) {
                    keyMaps.push(keyMap);
                }
            }
        }
        return keyMaps;
    },
    
    _processKeyMap: function(keyMap, event, keyCode, shift, meta, alt, ctrl, up, forceDefault) {
        if (keyMap.processSequenceKey(event, this.keysDown, forceDefault)) {
            return true;
        } else {
            var result = keyMap.processComboKey(event, keyCode, shift, meta, alt, ctrl, up);
            if (result.caught || keyMap.exclusive) {
                return true;
            }
        }
    },

    _releaseAllKeys: function() {
        for (var i = this.keysDown.length-1; i >= 0; --i) {
            this.processKey(null, this.keysDown[i], false, false, false, false, true, true);
        }        
    },

    // ---------------------------------------------------------------------------------------------
    
    _onKeyDown: function(event) {
        var keyCode = translateKey(event.keyCode);
        // D&&D("DOWN", keyCode, event.metaKey);
        this.processKey(event, keyCode,
                        event.shiftKey, event.metaKey && !event.ctrlKey, event.altKey,
                        event.ctrlKey, false);

        // On OS X, while the Command key is held down you stop getting keyup events for
        // non-modifier keys, so we have to simulate the keyup right after the keydown
        if (event.metaKey && !(keyCode in modifierKeys)) {
        this.processKey(null, keyCode,
                        event.shiftKey, event.metaKey && !event.ctrlKey, event.altKey,
                        event.ctrlKey, true);
        }
    },

    _onKeyPress: function(event) {
        var keyCode = translateKey(event.keyCode);
        // D&&D("PRESS", keyCode, event.charCode);
        if (!event.metaKey && !event.ctrlKey && !event.altKey && keyCode < 6000) {
            if (this.processChar(event, event.charCode) || this._modeKeysDown) {
                event.preventDefault();
            }
        }
    },    

    _onKeyUp: function(event) {
        var keyCode = translateKey(event.keyCode);
        // D&&D("UP", keyCode, event.metaKey);
        this.processKey(event, keyCode,
                        event.shiftKey, event.metaKey && !event.ctrlKey, event.altKey,
                        event.ctrlKey, true);
    },

    _onFocusIn: function(event) {
        // D&&D('focus', event.target.className);
        this.focusedKeyMaps = this._keyMapsForTarget(event.target);
    },

    _onFocusOut: function(event) {
        // D&&D('blur', event.target);
        this.focusedKeyMaps = null;
    },

    _onWindowBlur: function(event) {
        if (event.target == window) {
            this._releaseAllKeys();
        }
    }
};

// *************************************************************************************************

exports.KeyMap = function(source) {
    this.source = source;
    this.activeSequence = null;
    this.modeKeysDown = false;
    this.sequenceMap = {};
    this.commandMap = {};
    this.combos = {};
    this.modes = {};
    this._parseMap(source);
}

exports.KeyMap.prototype = {
    add: function(keyMap) {
        if (this.lastSibling) {
            keyMap.previousSibling = this.lastSibling;
        }
        this.lastSibling = keyMap;
    },

    remove: function(keyMap) {
        var before;
        for (var map = this.lastSibling; map; map = map.previousSibling) {
            if (map == keyMap) {
                if (before) {
                    before.previousSibling = map.previousSibling;
                } else {
                    this.lastSibling = map.previousSibling;
                }
                break;
            }
            before = map;
        }
        keyMap.processSequenceKey(null, [], true);
    },

    processSequenceKey: function(event, keyCodes, forceDefault) {
        var map = this.sequenceMap;
        for (var i = 0, l = keyCodes.length; i < l; ++i) {
            var keyCode = keyCodes[i];
            map = map[keyCode];
            if (!map) {
                break;
            }
        }   

        var forcedDefault = false;
        if (!map && forceDefault) {
            map = this.sequenceMap;
            forcedDefault = true;
        }

        if (map && map != this.activeSequence) {
            if (this.activeSequence && this.activeSequence.bindings) {
                _.each(this.activeSequence.bindings, function(fn) { fn(false); });
            }

            this.activeSequence = map;

            if (map && map.bindings) {
                if (event) {
                    event.preventDefault();
                    event.stopPropagation();            
                }

                this.modeKeysDown = !forcedDefault;

                _.each(map.bindings, function(fn) {
                    fn(true);
                });
                return !forcedDefault;
            }
        }
    },

    processComboKey: function(event, keyCode, shift, meta, alt, ctrl, up) {
        // Remove the redundant modifier when the acting key is a modifier itself
        if (keyCode == namedKeys.SHIFT) {
            shift = false;
        } else if (keyCode == namedKeys.COMMAND) {
            meta = false;
        } else if (keyCode == namedKeys.OPTION) {
            alt = false;
        } else if (keyCode == namedKeys.CTRL) {
            ctrl = false;
        }

        if (!up && this.override) {
            this.override(event);
        }

        return this.processCombo(event, keyCode, shift, meta, alt, ctrl, up);
    },

    processCombo: function(event, keyCode, shift, meta, alt, ctrl, up) {
        var caught = false;
        var handled = false;
        var combos = this.combos[keyCode];
        if (combos) {
            for (var j = 0; j < combos.length; ++j) {
                var combo = combos[j];
                if (this.mode) {
                    if (keyCode == this.mode.keyCode) {
                        if (this.mode.down == !up) {
                            // Ignore repeated keyDowns 
                            continue;
                        } else {
                            this.mode.down = !up;
                        }
                    } else if (this.mode.modifiers && keyCode in this.mode.modifiers) {
                        var modifier = this.mode.modifiers;
                        if (modifier.down == !up) {
                            // Ignore repeated keyDowns 
                            continue;
                        } else {
                            modifier.down = !up;
                        }
                    } else if (this.mode.down && !up) {
                        // Ignore other keys while a mode key is held down
                        continue;
                    } else if (combo.mode) {
                        this.mode = {keyCode: combo.mode, modifiers: combo.modifiers, down: true};
                    }
                } else if (combo.mode) {
                    this.mode = {keyCode: combo.mode, modifiers: combo.modifiers, down: true};
                }

                if ((combo.shift == shift || combo.shift == exports.KeyManager.MODIFIER_EITHER)
                    && (combo.meta == meta || combo.meta == exports.KeyManager.MODIFIER_EITHER)
                    && (combo.alt == alt || combo.alt == exports.KeyManager.MODIFIER_EITHER)
                    && (combo.ctrl == ctrl || combo.ctrl == exports.KeyManager.MODIFIER_EITHER)) {
                    if (combo.up == up) {
                        handled = true;
                        event.preventDefault();
                        event.stopPropagation();

                        if (combo.binding(event)) {
                            caught = true;
                            break;
                        }
                    }
                }
            }
        }
            
        if (!caught && modifierKeys[keyCode] && this.onModifier) {
            this.onModifier(event);
        } else if (!up && !caught && this.catchAll) {
            if (this.catchAll(event)) {
                caught = true;
            }
        }
        return {caught: caught, handled: handled};
    },
    
    processChar: function(event, charCode) {
        if (this.typed) {
            return !this.typed(event);
        }
    },
    
    _parseMap: function(source) {
        for (var i = 0; i < source.length; i += 2) {
            var keys = source[i];
            var handler = source[i+1];
            var commandId = handler instanceof Command ? handler.id : null;

            if (keys == "+") {
                this.override = wrapHandler(handler);
            } else if (keys == "*") {
                this.catchAll = wrapHandler(handler);
            } else if (keys == "&") {
                this.onModifier = wrapHandler(handler);
            } else if (keys == "") {
                this.typed = wrapHandler(handler);
            } else if (keys[0] == '>') {
                this._parseSequence(keys.substr(1), wrapHandler(handler), commandId);
            } else {
                this._parseCombo(keys, wrapHandler(handler), commandId);
            }
        }
    },

    _parseSequence: function(keys, binding, commandId) {
        var parts = keys.toUpperCase().split(">");
        var map = this.sequenceMap;
        for (var i = 0, l = parts.length; i < l; ++i) {
            var part = parts[i];
            var key = identifyKey(part);
            if (key) {
                if (!(key.code in map)) {
                    map[key.code] = {};
                }
                map = map[key.code];
            }
        }

        if (!map.bindings) {
            map.bindings = [binding];
        } else {
            map.bindings.push(binding);
        }
    },

    _parseCombo: function(keys, binding, commandId) {
        var keyCode = 0;
        var shift = exports.KeyManager.MODIFIER_FALSE;
        var meta = exports.KeyManager.MODIFIER_FALSE;
        var ctrl = exports.KeyManager.MODIFIER_FALSE;
        var alt = exports.KeyManager.MODIFIER_FALSE;
        var up = false;

        if (keys[0] == '-') {
            up = true;
            keys = keys.substr(1);
        }
        
        var parts = keys.toUpperCase().split("+");
        if (parts.length > 1) {
            for (var i = 0; i < parts.length-1; ++i) {
                var part = parts[i];
                
                var state;
                if (part == "?") {
                    shift = exports.KeyManager.MODIFIER_EITHER;
                    meta = exports.KeyManager.MODIFIER_EITHER;
                    ctrl = exports.KeyManager.MODIFIER_EITHER;
                    alt = exports.KeyManager.MODIFIER_EITHER;
                } else {
                    if (part[part.length-1] == "?") {
                        state = exports.KeyManager.MODIFIER_EITHER;
                        part = part.substr(0, part.length-1);
                    } else {
                        state = exports.KeyManager.MODIFIER_TRUE;
                    }

                    if (part == "SHIFT") {
                        shift = state;
                    } else if (part == "CMD" || part == "COMMAND") {
                        meta = state;
                    } else if (part == "OPT" || part == "OPTION" || part == "ALT") {
                        alt = state;
                    } else if (part == "CTRL" || part == "CONTROL") {
                        ctrl = state;
                    }
                }
            }
        }
        
        var part = parts[parts.length-1];
        var key = identifyKey(part);

        var combo = {
            key: key.code, c: key.c,
            shift: shift, meta: meta, alt: alt, ctrl: ctrl, up: up,
            binding: binding};
        if (commandId) {
            this.commandMap[commandId] = combo;
        }
        if (key.code in this.combos) {
            this.combos[key.code].push(combo);
        } else {
            this.combos[key.code] = [combo];
        }
    },
};

// *************************************************************************************************

function translateKey(keyCode) {
    if (keyCode == 93) {
        return 91;
    } else {
        return keyCode;
    }
}

function identifyKey(name) {
    if (name.length > 1) {
        var c1 = name.charAt(0);
        var code;
        if (c1 >= '0' && c1 <= '9') {
            code = parseInt(name);
        } else {
            code = exports.KeyManager.namedKeys[name];
        }
        return {code: code, c: null};
    } else if (name.length == 1) {
        var c = name.charAt(0);
        var code = name.charCodeAt(0);
        return {code: code, c: c};
    }
}

function wrapHandler(handler) {
    if (handler instanceof Command) {
        return function(event) {
            if (handler.validate()) {
                return handler.execute.apply(handler, arguments);
            }
        }
    } else {
        return function(event) {
            return handler.apply(self, arguments);
        }
    }
}

function formatCombo(combo) {
    var parts = [];
    if (combo.ctrl) {
        parts.push('^');
    }
    if (combo.shift) {
        parts.push('⇧'); // &#x21E7; – &#8679;
    }
    if (combo.alt) {
        parts.push('⌥'); // &#x2325; – &#8997;
    }
    if (combo.meta) {
        parts.push('⌘'); // &#x2318; – &#8984;
    }

    if (combo.key == namedKeys.TAB) {
        parts.push('');
    } else if (combo.key == namedKeys.RETURN || combo.key == namedKeys.ENTER) {
        parts.push('⏎'); // &#x23ce; – &#9166;
    } else if (combo.key == namedKeys.ESC) {
        parts.push('⎋'); // &#x238B; – &#9099;
    } else if (combo.key == namedKeys.LEFT) {
        parts.push('&#8592;');
    } else if (combo.key == namedKeys.RIGHT) {
        parts.push('&#8594;');
    } else if (combo.key == namedKeys.UP) {
        parts.push('&#8593;');
    } else if (combo.key == namedKeys.DOWN) {
        parts.push('&#8595;');
    } else if (combo.key == namedKeys.DEL || combo.key == namedKeys.BACKSPACE) {
        parts.push('⌫'); // &#x232b; – &#9003;
    } else if (combo.key) {
        parts.push(String.fromCharCode(combo.key));
    }

    return parts.join('');
}
