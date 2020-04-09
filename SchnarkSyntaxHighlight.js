/**
   Copied from https://de.wikipedia.org/wiki/Benutzer:Schnark/js/syntaxhighlight.js
   Author: Schnark
   Licensed under CC BY-SA 3.0 International
   Not modified
**/
'use strict';
(function($, mw, libs) {
    "use strict";
    var map, protocols, wikiSyntax, cssSyntax, jsSyntax, jsonSyntax, luaSyntax, defaultWikitextColors, defaultCssColors, defaultJsColors, strongColors, hasOwn = Object.prototype.hasOwnProperty,
        requestAnimationFrame = window.requestAnimationFrame || window.mozRequestAnimationFrame || window.webkitRequestAnimationFrame || function(f) {
            f()
        };
    map = {
        opera: [
            ['>=', 15]
        ],
        msie: false
    };

    function clone(array) {
        return [Array.prototype.slice.call(array[0]), Array.prototype.slice.call(array[1])]
    }

    function Parser(syntax) {
        var re, res = [];
        this.syntax = {};
        this.syntax.noparse = syntax.noparse || {};
        this.syntax.fn = [];
        for (re in syntax.parse) {
            if (hasOwn.call(syntax.parse, re)) {
                res.push('(' + re + ')');
                this.syntax.fn.push(syntax.parse[re])
            }
        }
        this.syntax.re = new RegExp(res.join('|'), 'g');
        this.syntax.eol = syntax.eol || function(o) {
            return o
        };
        this.syntax.parens = syntax.parens || {
            open: '([{',
            close: ')]}'
        };
        this.syntax.parens.all = this.syntax.parens.open + this.syntax.parens.close;
        this.cache = {}
    }
    Parser.prototype = {
        open: function open(type) {
            this.openTags.push(type)
        },
        close: function close(type) {
            if (this.openTags.length === 0) {
                return
            }
            if (this.openTags[this.openTags.length - 1] === type) {
                this.openTags.pop();
                return
            }
            var i = this.openTags.lastIndexOf(type);
            if (i > -1) {
                this.openTags.length = i
            }
        },
        closeUntil: function closeUntil(type) {
            if (this.openTags.length === 0) {
                return
            }
            if (this.openTags[this.openTags.length - 1] === type) {
                return
            }
            var i = this.openTags.lastIndexOf(type);
            if (i > -1) {
                this.openTags.length = i + 1
            }
        },
        isOpen: function isOpen(type) {
            if (this.openTags.length === 0) {
                return false
            }
            if (this.openTags[this.openTags.length - 1] === type) {
                return true
            }
            return this.openTags.lastIndexOf(type) > -1
        },
        current: function current() {
            return this.openTags[this.openTags.length - 1] || ''
        },
        noparse: function noparse() {
            return this.syntax.noparse[this.current()] || false
        },
        updateNoparse: function updateNoparse(type, re) {
            this.syntax.noparse[type] = re
        },
        exec: function exec(re) {
            re.lastIndex = this.pos;
            return re.exec(this.text)
        },
        getText: function getText(l) {
            return this.text.slice(this.pos, this.pos + l)
        },
        write: function write(text) {
            if (text === '') {
                return
            }
            this.pos += text.length;
            this.output.push([text, this.current()])
        },
        parse: function parse(text) {
            if (text === this.oldText) {
                return this.oldParse
            }
            this.oldText = text;
            this.oldParse = [];
            var i, open = [],
                ret, par = text.split('\n');
            for (i = 0; i < par.length; i++) {
                ret = this.parseParagraph(par[i], open);
                this.oldParse = this.oldParse.concat(ret[0]);
                open = this.syntax.eol(ret[1])
            }
            return this.oldParse
        },
        parseParagraph: function parseParagraph(par, open) {
            if (par === '') {
                return [
                    [
                        ['\n', open[open.length - 1] || '']
                    ], open
                ]
            }
            var key = open.join('|');
            if (!this.cache[key]) {
                this.cache[key] = {}
            }
            if (!this.cache[key][par + '\n']) {
                this.cache[key][par + '\n'] = this.reallyParseParagraph(par, open)
            }
            return clone(this.cache[key][par + '\n'])
        },
        reallyParseParagraph: function reallyParseParagraph(par, open) {
            var noparse, result, i, word;
            this.output = [];
            this.openTags = open;
            this.text = par;
            this.pos = 0;
            while (this.pos < this.text.length) {
                noparse = this.noparse();
                if (noparse) {
                    result = this.exec(noparse);
                    if (result) {
                        this.write(this.getText(result.index + result[0].length - this.pos));
                        this.close(this.current())
                    } else {
                        this.write(this.text.slice(this.pos))
                    }
                } else {
                    result = this.exec(this.syntax.re);
                    if (result) {
                        this.write(this.getText(result.index - this.pos));
                        for (i = 0; i < this.syntax.fn.length; i++) {
                            if (result[i + 1]) {
                                word = result[i + 1];
                                this.syntax.fn[i].call(this, word, this.text.slice(this.pos + word.length), this.text.slice(0, this.pos));
                                break
                            }
                        }
                    } else {
                        this.write(this.text.slice(this.pos))
                    }
                }
            }
            this.write('\n');
            return clone([this.output, this.openTags])
        },
        findMatchingParen: function findMatchingParen(text, pos) {
            var me = text.charAt(pos - 1),
                other, myPos = pos - 1,
                dir, depth = 1;
            if (me === '' || this.syntax.parens.all.indexOf(me) === -1) {
                me = text.charAt(pos);
                myPos = pos
            }
            if (me === '' || this.syntax.parens.all.indexOf(me) === -1) {
                return false
            }
            dir = this.syntax.parens.open.indexOf(me) === -1 ? -1 : 1;
            other = this.syntax.parens[dir === 1 ? 'close' : 'open'].charAt(this.syntax.parens[dir === 1 ? 'open' : 'close'].indexOf(me));
            pos = myPos;
            do {
                pos += dir;
                if (text.charAt(pos) === me) {
                    depth++
                } else if (text.charAt(pos) === other) {
                    depth--;
                    if (depth === 0) {
                        return [Math.min(pos, myPos), Math.max(pos, myPos)]
                    }
                }
            } while (text.charAt(pos) !== '');
            return false
        },
        parseWithParen: function parseWithParen(text, pos) {
            var output = this.parse(text),
                parens = this.findMatchingParen(text, pos),
                newOutput = [],
                i, j = 0,
                oldLen = 0,
                newLen, t;
            if (!parens) {
                return output
            }
            parens.push(Infinity);
            for (i = 0; i < output.length; i++) {
                t = output[i][0];
                newLen = oldLen + t.length;
                while (parens[j] < newLen) {
                    if (parens[j] > oldLen) {
                        newOutput.push([t.slice(0, parens[j] - oldLen), output[i][1]]);
                        t = t.slice(parens[j] - oldLen)
                    }
                    newOutput.push([t[0], 'matching-paren']);
                    t = t.slice(1);
                    oldLen = parens[j] + 1;
                    j++
                }
                if (t) {
                    newOutput.push([t, output[i][1]])
                }
                oldLen = newLen
            }
            return newOutput
        }
    };

    function makeParserFunctionOpen(type) {
        return function(text) {
            this.open(type);
            this.write(text)
        }
    }

    function makeParserFunctionType(type) {
        return function(text) {
            this.open(type);
            this.write(text);
            this.close(type)
        }
    }

    function makeParserFunctionClose(type) {
        return function(text) {
            this.write(text);
            this.close(type)
        }
    }

    function makeNoparseTags(other, tags) {
        var i, tag;
        for (i = 0; i < tags.length; i++) {
            tag = tags[i];
            other['<' + tag + '>'] = new RegExp('</' + tag + '>', 'gi')
        }
        return other
    }
    protocols = new RegExp('^(?:' + mw.config.get('wgUrlProtocols') + ')');

    function parsePlainLink(proto, text) {
        var link = /[^ <>|\[\]]*/.exec(text)[0],
            punc = ',;.:!?',
            curly = link.indexOf('}');
        if (curly > -1 && this.isOpen('template')) {
            link = link.slice(0, curly)
        }
        if (link.indexOf('(') === -1) {
            punc += ')'
        }
        while (link && punc.indexOf(link.charAt(link.length - 1)) !== -1) {
            link = link.slice(0, -1)
        }
        this.open('externalLink');
        this.write(proto + link);
        this.close('externalLink')
    }

    function keywords(words, type) {
        var i, syntax = {};
        for (i = 0; i < words.length; i++) {
            syntax['\\b' + words[i] + '\\b'] = makeParserFunctionType(type || 'keyword')
        }
        return syntax
    }
    wikiSyntax = {
        noparse: makeNoparseTags({
            'comment': /-->/g
        }, ['categorytree', 'ce', 'charinsert', 'chem', 'graph', 'hiero', 'inputbox', 'mapframe', 'maplink', 'math', 'nowiki', 'pre', 'section', 'score', 'source', 'syntaxhighlight', 'templatedata', 'timeline']),
        parse: {
            '^=': makeParserFunctionOpen('heading'),
            '^ *:*\\{\\|': makeParserFunctionOpen('table'),
            '^ ': function _() {
                if (!this.isOpen('template') && !this.isOpen('table')) {
                    this.open('pre')
                }
                this.write(' ')
            },
            '^[*#:;]+': makeParserFunctionType('listAndIndent'),
            '^-{4,}': makeParserFunctionType('hr'),
            '\\[\\[': makeParserFunctionOpen('wikilink'),
            '\\[': function _(x, text) {
                if (protocols.test(text)) {
                    this.close('externalLink');
                    this.open('externalLink');
                    this.write('[' + text[0]);
                    return
                }
                this.write('[')
            },
            '\\]': function _(x, text) {
                if (this.isOpen('externalLink')) {
                    this.closeUntil('externalLink');
                    this.write(']');
                    this.close('externalLink')
                } else if (text[0] === ']') {
                    this.closeUntil('wikilink');
                    this.write(']]');
                    this.close('wikilink')
                } else {
                    this.write(']')
                }
            },
            '<!--': makeParserFunctionOpen('comment'),
            '</?[a-zA-Z]+[^>]*>': function aZAZ(tag) {
                var tagParts = /<(\/?)([a-z]+)([^>]*)>/i.exec(tag),
                    tagname = tagParts[2].toLowerCase(),
                    selfclosing = tagParts[3] && tagParts[3].charAt(tagParts[3].length - 1) === '/',
                    singleTag = ['br', 'hr', 'wbr', 'mapframe', 'maplink', 'nowiki', 'ref', 'references', 'section'],
                    selfclosingTag = ['br', 'hr', 'wbr'];
                if (tagParts[1]) {
                    this.closeUntil('<' + tagname + '>');
                    this.write(tag);
                    this.close('<' + tagname + '>')
                } else if (selfclosing && singleTag.indexOf(tagname) > -1 || selfclosingTag.indexOf(tagname) > -1) {
                    this.open('<' + tagname + '>');
                    this.write(tag);
                    this.close('<' + tagname + '>')
                } else {
                    this.open('<' + tagname + '>');
                    this.write(tag)
                }
            },
            '\\{\\{+': function _(braces, text) {
                var isTemplate = text[0] === '#' || text[0] === '!' && text.indexOf('!}}') === 0,
                    count = braces.length - (isTemplate ? 2 : 0),
                    i;
                if (count === 1) {
                    this.write('{')
                } else {
                    switch (count % 3) {
                        case 1:
                            this.open('template');
                            this.write('{{');
                            count -= 2;
                        case 2:
                            this.open('template');
                            this.write('{{');
                            count -= 2;
                        case 0:
                            for (i = 0; i < count / 3; i++) {
                                this.open('parameter');
                                this.write('{{{')
                            }
                    }
                } if (isTemplate) {
                    this.open('template');
                    this.write('{{')
                }
            },
            '\\}': function _(x, text, before) {
                var closeTable = /^ *\|$/.test(before),
                    count = 1,
                    i;
                if (text[0] === '}') {
                    count = 2;
                    if (text.charAt(1) === '}') {
                        count = 3
                    }
                }
                if (count === 1) {
                    this.write('}');
                    if (closeTable) {
                        this.close('table')
                    }
                    return
                }
                if (count === 3 && this.current() !== 'template' && this.isOpen('parameter')) {
                    this.closeUntil('parameter');
                    this.write('}}}');
                    this.close('parameter');
                    return
                }
                if (!closeTable || !this.isOpen('table')) {
                    this.closeUntil('template');
                    this.write('}}');
                    this.close('template');
                    return
                }
                if (!this.isOpen('template')) {
                    this.write('}');
                    this.close('table');
                    return
                }
                for (i = this.openTags.length - 1; i >= 0; i--) {
                    if (this.openTags[i] === 'table') {
                        this.write('}');
                        this.close('table');
                        return
                    } else if (this.openTags[i] === 'template') {
                        this.closeUntil('template');
                        this.write('}}');
                        this.close('template');
                        return
                    }
                }
            },
            '^\\|-+|^\\|\\+|^[|!]|\\|\\||!!': function _(s, next) {
                if (this.current() === 'table' && !(s === '|' && next[0] === '}')) {
                    this.open('table-syntax');
                    this.write(s);
                    this.close('table-syntax')
                } else {
                    this.write(s)
                }
            },
            '~{3,5}': makeParserFunctionType('signature'),
            'https?://': parsePlainLink,
            '\'\'+': function _(apos, next) {
                var b = this.isOpen('bold'),
                    i = this.isOpen('italic');
                if (apos.length === 4) {
                    this.write('\'');
                    apos = '\'\'\''
                } else if (apos.length > 5) {
                    this.write(apos.slice(5));
                    apos = '\'\'\'\'\''
                } else if (apos.length === 3 && !b && next.indexOf('\'\'\'') === -1 && (i || next.indexOf('\'\'') !== -1)) {
                    this.write('\'');
                    apos = '\'\''
                }
                if (apos.length === 2) {
                    if (i) {
                        this.write('\'\'');
                        this.close('italic')
                    } else {
                        this.open('italic');
                        this.write('\'\'')
                    }
                } else if (apos.length === 3) {
                    if (b) {
                        this.write('\'\'\'');
                        this.close('bold')
                    } else {
                        this.open('bold');
                        this.write('\'\'\'')
                    }
                } else {
                    if (b && i) {
                        for (i = this.openTags.length - 1; i >= 0; i--) {
                            if (this.openTags[i] === 'bold') {
                                this.write('\'\'\'');
                                this.close('bold');
                                this.write('\'\'');
                                this.close('italic');
                                return
                            } else if (this.openTags[i] === 'italic') {
                                this.write('\'\'');
                                this.close('italic');
                                this.write('\'\'\'');
                                this.close('bold');
                                return
                            }
                        }
                    } else if (!b && !i) {
                        if (next.indexOf('\'\'') === next.indexOf('\'\'\'')) {
                            this.open('italic');
                            this.write('\'\'');
                            this.open('bold');
                            this.write('\'\'\'')
                        } else {
                            this.open('bold');
                            this.write('\'\'\'');
                            this.open('italic');
                            this.write('\'\'')
                        }
                    } else if (b) {
                        this.write('\'\'\'');
                        this.close('bold');
                        this.open('italic');
                        this.write('\'\'')
                    } else {
                        this.write('\'\'');
                        this.close('italic');
                        this.open('bold');
                        this.write('\'\'\'')
                    }
                }
            },
            '&(?:#\\d+|#[xX][a-fA-F0-9]+|\\w+);': makeParserFunctionType('entity'),
            '__[A-Z_]+__': makeParserFunctionType('magic'),
            '\u2013': makeParserFunctionType('char-endash'),
            '\u2014': makeParserFunctionType('char-emdash'),
            '\u2212': makeParserFunctionType('char-minus')
        },
        eol: function eol(open) {
            var i;
            for (i = 0; i < open.length; i++) {
                if (['externalLink', 'bold', 'italic', 'heading', 'pre'].indexOf(open[i]) !== -1) {
                    open.length = i;
                    break
                }
            }
            return open
        }
    };
    cssSyntax = {
        noparse: {
            'comment': /\*\//g
        },
        parse: {
            '/\\*': makeParserFunctionOpen('comment'),
            '!important': function important() {
                if (!this.isOpen('decleration')) {
                    this.write('!important');
                    return
                }
                this.open('important');
                this.write('!important');
                this.close('important')
            },
            '#[^ ,.*#:>{\\[~]*': function _(id) {
                if (this.isOpen('decleration')) {
                    this.write('#');
                    return
                }
                this.open('id');
                this.write(id);
                this.close('id')
            },
            '\\.[^ ,.*#:>{\\[~]*': function _(cls) {
                if (this.isOpen('decleration')) {
                    this.write('.');
                    return
                }
                this.open('class');
                this.write(cls);
                this.close('class')
            },
            ':[^ ,.*#:>{\\[~]*': function _(pseudo, text) {
                var i = 0;
                if (this.isOpen('decleration')) {
                    if (pseudo === ':') {
                        while (text.charAt(i++) === ' ') {
                            pseudo += ' '
                        }
                    } else {
                        pseudo = ':'
                    }
                    this.write(pseudo);
                    this.open('value');
                    return
                }
                this.open('pseudo');
                this.write(pseudo);
                this.close('pseudo')
            },
            '@\\S*': function S(at) {
                if (this.isOpen('decleration')) {
                    this.write('@');
                    return
                }
                this.open('at');
                this.write(at);
                this.close('at')
            },
            '\\[': function _() {
                if (this.isOpen('decleration')) {
                    this.write('[');
                    return
                }
                this.open('attr');
                this.write('[')
            },
            '\\]': function _() {
                this.write(']');
                this.close('attr')
            },
            '\\{': function _() {
                this.open('decleration');
                this.write('{')
            },
            '\\}': function _() {
                this.close('value');
                this.write('}');
                this.close('decleration')
            },
            ';': function _() {
                this.close('value');
                this.write(';')
            },
            'url\\([^)]*\\)?': makeParserFunctionType('string'),
            '"(?:[^\\\\"]+|\\\\.)*"?': makeParserFunctionType('string'),
            '\'(?:[^\\\\\']+|\\\\.)*\'?': makeParserFunctionType('string')
        }
    };
    jsSyntax = {
        noparse: {
            'comment': /\*\//g
        },
        parse: $.extend({
            '"(?:[^\\\\"]+|\\\\.)*"?': makeParserFunctionType('string'),
            '\'(?:[^\\\\\']+|\\\\.)*\'?': makeParserFunctionType('string'),
            '//': function _(c, text) {
                this.open('comment');
                this.write(c + text);
                this.close('comment')
            },
            '/\\*': makeParserFunctionOpen('comment'),
            '/(?:[^\\\\/]+|\\\\.)*/?': function _(re, after, before) {
                if (/[)\]\w]\s*$/.test(before)) {
                    this.write('/')
                } else {
                    this.open('regexp');
                    this.write(re);
                    this.close('regexp')
                }
            },
            '\\[': makeParserFunctionOpen('array'),
            '\\]': makeParserFunctionClose('array')
        }, keywords(['break', 'case', 'catch', 'continue', 'debugger', 'default', 'delete', 'else', 'finally', 'for', 'function', 'if', 'instanceof', 'new', 'return', 'switch', 'this', 'throw', 'try', 'typeof', 'var', 'void', 'while'], 'reserved'), keywords(['Array', 'Boolean', 'Date', 'Error', 'eval', 'false', 'Function', 'Infinity', 'isFinite', 'isNaN', 'JSON', 'Math', 'NaN', 'null', 'Number', 'Object', 'parseInt', 'parseFloat', 'RegExp', 'String', 'true', 'undefined'], 'global'), keywords(['abs', 'addEventListener', 'appendChild', 'apply', 'call', 'ceil', 'charAt', 'charCodeAt', 'clearInterval', 'clearTimeout', 'concat', 'console', 'createElement', 'decodeURIComponent', 'decodeURI', 'document', 'encodeURIComponent', 'encodeURI', 'exec', 'floor', 'fromCharCode', 'getElementById', 'getElementsByTagName', 'indexOf', 'insertBefore', 'join', 'lastIndexOf', 'length', 'match', 'max', 'min', 'parentNode', 'pop', 'push', 'random', 'removeEventListener', 'replace', 'reverse', 'round', 'search', 'setInterval', 'setTimeout', 'shift', 'slice', 'sort', 'splice', 'split', 'sqrt', 'substr', 'substring', 'test', 'toLowerCase', 'toString', 'toUpperCase', 'unshift', 'valueOf', 'window'], 'common'), keywords(['class', 'const', 'enum', 'export', 'extends', 'implements', 'import', 'interface', 'let', 'package', 'private', 'protected', 'public', 'static', 'super', 'with', 'yield'], 'future'), keywords(['do', 'in'], 'reserved'))
    };
    jsonSyntax = {
        parse: {
            '"(?:[^\\\\"]+|\\\\.)*"?': makeParserFunctionType('string'),
            '\\btrue\\b': makeParserFunctionType('global'),
            '\\bfalse\\b': makeParserFunctionType('global'),
            '\\bnull\\b': makeParserFunctionType('global')
        }
    };
    luaSyntax = {
        parse: $.extend({
            '--\\[=*\\[': function _(c) {
                this.open('comment');
                this.write(c);
                this.updateNoparse('comment', new RegExp(c.replace(/--/, '').replace(/\[/g, '\\]'), 'g'))
            },
            '--': function _(c, text) {
                this.open('comment');
                this.write(c + text);
                this.close('comment')
            },
            '"(?:[^\\\\"]+|\\\\.)*"?': makeParserFunctionType('string'),
            '\'(?:[^\\\\\']+|\\\\.)*\'?': makeParserFunctionType('string'),
            '\\[=*\\[': function _(s) {
                this.open('string');
                this.write(s);
                this.updateNoparse('string', new RegExp(s.replace(/\[/g, '\\]'), 'g'))
            },
            '\\[': makeParserFunctionOpen('array'),
            '\\]': makeParserFunctionClose('array'),
            '\\{': makeParserFunctionOpen('array'),
            '\\}': makeParserFunctionClose('array')
        }, keywords(['and', 'break', 'do', 'elseif', 'else', 'end', 'false', 'for', 'function', 'if', 'in', 'local', 'nil', 'not', 'or', 'repeat', 'return', 'then', 'true', 'until', 'while'], 'reserved'), keywords(['ipairs', 'next', 'pairs', 'select', 'tonumber', 'tostring', 'type', 'unpack', '_VERSION', 'coroutine', 'module', 'require', 'string', 'table', 'math'], 'common'))
    };

    function DebugParser() {}
    DebugParser.prototype = {
        parse: function parse(text) {
            return [
                [text, '']
            ]
        },
        parseWithParen: function parseWithParen(text) {
            return [
                [text, '']
            ]
        }
    };

    function BasicHighlighter(syntax, colors, box, prefix) {
        this.parser = syntax ? new Parser(syntax) : new DebugParser();
        this.colors = syntax ? colors : {};
        this.box = box;
        this.prefix = prefix;
        this.stylesheet = document.getElementsByTagName('head')[0].appendChild(document.createElement('style'));
        this.spanCount = 0
    }
    BasicHighlighter.prototype = {
        enable: function enable() {
            this.stylesheet.disabled = false
        },
        disable: function disable() {
            this.stylesheet.disabled = true
        },
        destroy: function destroy() {
            this.stylesheet.parentNode.removeChild(this.stylesheet)
        },
        makeSpans: function makeSpans(n) {
            for (; this.spanCount < n; this.spanCount++) {
                this.box.appendChild(document.createElement('span')).id = this.prefix + this.spanCount
            }
        },
        getColor: function getColor(type) {
            if (hasOwn.call(this.colors, type)) {
                return this.colors[type]
            }
            if (type[0] === '<') {
                return this.colors.tag
            }
        },
        getCSS: function getCSS(syntax) {
            var lastColor = false,
                css = [],
                spans = -1,
                color, text, i;
            for (i = 0; i < syntax.length; i++) {
                color = this.getColor(syntax[i][1]);
                text = syntax[i][0].replace(/(\\|")/g, '\\$1').replace(/\n/g, '\\A ');
                if (color !== lastColor) {
                    if (lastColor !== false) {
                        css.push('"}')
                    }
                    spans++;
                    lastColor = color;
                    if (color) {
                        color = 'background-color:' + color + ';'
                    } else {
                        color = ''
                    }
                    css.push('#' + this.prefix + Math.floor(spans / 2) + (spans % 2 === 0 ? ':before' : ':after') + '{' + color + 'content:"')
                }
                css.push(text)
            }
            css.push('"}');
            this.makeSpans(Math.floor(spans / 2) + 1);
            return css.join('').replace(/\\A "/g, '\\A"')
        },
        hasChanged: function hasChanged(text, pos) {
            if (this.lastText === text && this.lastPos === pos) {
                return false
            }
            this.lastText = text;
            this.lastPos = pos;
            return true
        },
        highlight: function highlight(text, pos) {
            var css;
            if (!this.hasChanged(text, pos)) {
                return
            }
            if (pos === undefined) {
                css = this.getCSS(this.parser.parse(text))
            } else {
                css = this.getCSS(this.parser.parseWithParen(text, pos))
            } if (css === this.lastCSS) {
                return
            }
            this.lastCSS = css;
            requestAnimationFrame(function() {
                this.stylesheet.textContent = css
            }.bind(this))
        }
    };

    function getStyles(el, styles) {
        var computedStyle = window.getComputedStyle(el, null),
            ret = {},
            i;
        for (i = 0; i < styles.length; i++) {
            ret[styles[i]] = computedStyle[styles[i]]
        }
        return ret
    }

    function setStyles(el, styles) {
        var s;
        for (s in styles) {
            if (hasOwn.call(styles, s)) {
                el.style[s] = styles[s]
            }
        }
    }

    function addPx(length, d) {
        var l = Number(length.replace(/px$/, '')) + d;
        if (isNaN(l)) {
            return length
        }
        return String(l) + 'px'
    }

    function randomId() {
        return 'id' + String(mw.now()).replace(/\D/g, '')
    }

    function Highlighter(syntax, colors, textarea, paren) {
        if (!syntax) {
            this.debug = true
        }
        this.textarea = textarea;
        this.isDiv = textarea.tagName.toLowerCase() !== 'textarea';
        this.initBoxes();
        this.basicHighlighter = new BasicHighlighter(syntax, colors, this.highlightbox, (textarea.id || randomId()) + '-');
        this.onoff = $.noop;
        this.reportTime = $.noop;
        this.getPos = $.noop;
        this.paren = paren;
        if (paren) {
            if (this.isDiv) {
                this.getPos = function() {
                    var sel = window.getSelection(),
                        par, i, c, l, pos = 0;
                    if (!sel.isCollapsed || !sel.anchorNode) {
                        return false
                    }
                    par = sel.anchorNode.parentNode;
                    if (!par || par.parentNode !== this.textarea) {
                        return false
                    }
                    c = this.textarea.children;
                    l = c.length;
                    for (i = 0; i < l; i++) {
                        if (c[i] === par) {
                            break
                        }
                        pos += c[i].textContent.length + 1
                    }
                    return pos + sel.anchorOffset
                }.bind(this)
            } else {
                this.$textarea = $(this.textarea);
                mw.loader.using('jquery.textSelection').done(function() {
                    this.getPos = function() {
                        return this.$textarea.textSelection('getCaretPosition')
                    }.bind(this)
                }.bind(this))
            }
        }
        this.enable()
    }
    Highlighter.prototype = {
        isEnabled: function isEnabled() {
            return this.enabled
        },
        enable: function enable() {
            if (this.isEnabled()) {
                return
            }
            this.bindHandlers();
            this.basicHighlighter.enable();
            this.enabled = true;
            this.highlight();
            this.syncScroll();
            this.onoff(true)
        },
        disable: function disable() {
            if (!this.isEnabled()) {
                return
            }
            this.unbindHandlers();
            this.basicHighlighter.disable();
            this.enabled = false;
            this.onoff(false)
        },
        destroy: function destroy() {
            var scrolltop, focus;
            focus = this.textarea === this.textarea.ownerDocument.activeElement;
            scrolltop = this.textarea.scrollTop;
            this.disable();
            this.basicHighlighter.destroy();
            this.container.parentNode.insertBefore(this.textarea, this.container);
            this.container.parentNode.removeChild(this.container);
            setStyles(this.textarea, this.oldStyle);
            this.textarea.scrollTop = scrolltop;
            if (focus) {
                this.textarea.focus()
            }
        },
        initBoxes: function initBoxes() {
            var scrolltop, focus, style, commonStyle, bugfixStyle = {},
                profile = $.client.profile();
            this.container = document.createElement('div');
            this.oldStyle = getStyles(this.textarea, ['backgroundColor', 'display', 'height', 'left', 'marginTop', 'marginRight', 'marginBottom', 'marginLeft', 'overflowX', 'overflowY', 'position', 'resize', 'top', 'whiteSpace', 'width', 'MozBoxSizing', 'WebkitBoxSizing', 'boxSizing']);
            focus = this.textarea === this.textarea.ownerDocument.activeElement;
            scrolltop = this.textarea.scrollTop;
            this.highlightbox = document.createElement('div');
            commonStyle = {
                display: 'block',
                height: '100%',
                margin: '0px',
                overflowX: 'auto',
                overflowY: this.isDiv ? 'auto' : 'scroll',
                resize: 'none',
                whiteSpace: 'pre-wrap',
                width: '100%',
                MozBoxSizing: 'border-box',
                WebkitBoxSizing: 'border-box',
                boxSizing: 'border-box'
            };
            setStyles(this.textarea, $.extend({
                backgroundColor: 'transparent',
                position: this.isDiv ? 'static' : 'absolute',
                left: 0,
                top: 0
            }, commonStyle));
            setStyles(this.textarea, getStyles(this.textarea, ['fontSize', 'lineHeight']));
            style = getStyles(this.textarea, ['MozAppearance', 'WebkitAppearance', 'borderTopWidth', 'borderRightWidth', 'borderBottomWidth', 'borderLeftWidth', 'direction', 'fontFamily', 'fontSize', 'fontStyle', 'fontVariant', 'fontWeight', 'letterSpacing', 'lineHeight', 'paddingTop', 'paddingRight', 'paddingBottom', 'paddingLeft', 'MozTabSize', 'tabSize', 'textAlign', 'textIndent', 'textTransform', 'unicodeBidi', 'verticalAlign', 'wordSpacing', 'wordWrap']);
            if (!this.isDiv && profile.layout === 'gecko' && profile.versionNumber < 29) {
                bugfixStyle.paddingLeft = addPx(style.paddingLeft, 1);
                bugfixStyle.paddingRight = addPx(style.paddingRight, 1)
            } else if (this.isDiv) {
                bugfixStyle.lineHeight = getStyles(this.textarea.firstChild || this.textarea, ['lineHeight']).lineHeight
            }
            setStyles(this.highlightbox, $.extend({
                backgroundColor: this.oldStyle.backgroundColor,
                borderColor: 'transparent',
                borderStyle: 'solid',
                color: this.debug ? 'black' : 'transparent',
                position: this.isDiv ? 'absolute' : 'static',
                left: 0,
                top: 0,
                zIndex: this.isDiv ? -1 : 'auto'
            }, style, commonStyle, bugfixStyle));
            this.highlightbox.lang = this.textarea.lang;
            if (this.debug) {
                this.oldStyle.color = getStyles(this.textarea, ['color']).color;
                setStyles(this.textarea, {
                    color: this.oldStyle.backgroundColor
                });
                setStyles(this.highlightbox, getStyles(this.textarea, ['text-rendering']))
            }
            setStyles(this.container, {
                height: this.isDiv ? 'auto' : this.oldStyle.height,
                marginTop: this.oldStyle.marginTop,
                marginRight: this.oldStyle.marginRight,
                marginBottom: this.oldStyle.marginBottom,
                marginLeft: this.oldStyle.marginLeft,
                position: 'relative'
            });
            this.textarea.parentNode.insertBefore(this.container, this.textarea);
            this.container.appendChild(this.highlightbox);
            this.container.appendChild(this.textarea);
            this.textarea.scrollTop = scrolltop;
            if (focus) {
                this.textarea.focus()
            }
        },
        proxy: function proxy(f) {
            if (!this.proxyCache) {
                this.proxyCache = {}
            }
            if (!hasOwn.call(this.proxyCache, f)) {
                this.proxyCache[f] = function() {
                    this[f].apply(this)
                }.bind(this)
            }
            return this.proxyCache[f]
        },
        bindHandlers: function bindHandlers() {
            this.textarea.addEventListener('input', this.proxy('onInput'), false);
            if (this.paren) {
                this.textarea.addEventListener('keyup', this.proxy('onInput'), false)
            }
            this.textarea.addEventListener('scroll', this.proxy('syncScroll'), false);
            this.intervalID1 = window.setInterval(this.proxy('highlight'), 500);
            this.intervalID2 = window.setInterval(this.proxy('syncScroll'), 500)
        },
        unbindHandlers: function unbindHandlers() {
            this.textarea.removeEventListener('input', this.proxy('onInput'), false);
            if (this.paren) {
                this.textarea.removeEventListener('keyup', this.proxy('onInput'), false)
            }
            this.textarea.removeEventListener('scroll', this.proxy('syncScroll'), false);
            window.clearInterval(this.intervalID1);
            window.clearInterval(this.intervalID2)
        },
        syncScroll: function syncScroll() {
            if (this.highlightbox.scrollLeft !== this.textarea.scrollLeft) {
                this.highlightbox.scrollLeft = this.textarea.scrollLeft
            }
            if (this.highlightbox.scrollTop !== this.textarea.scrollTop) {
                this.highlightbox.scrollTop = this.textarea.scrollTop
            }
        },
        onInput: function onInput() {
            window.setTimeout(this.proxy('highlight'), 0)
        },
        getContent: function getContent() {
            return this.isDiv ? $.map(this.textarea.children, function(line) {
                return line.textContent
            }).join('\n') : this.textarea.value
        },
        highlight: function highlight() {
            var time = mw.now();
            this.basicHighlighter.highlight(this.getContent(), this.getPos());
            this.reportTime(mw.now() - time)
        }
    };

    function makeCheckboxVE(label, highlighter) {
        var $label, $checkbox, $span;
        $label = $('<label>', {
            'for': 'syntaxhighlight'
        }).text(label);
        $checkbox = $('<input id="syntaxhighlight" type="checkbox" checked="checked" />');
        highlighter.onoff = function(on) {
            $checkbox.prop('checked', on)
        };
        $checkbox.change(function() {
            if ($checkbox.prop('checked')) {
                highlighter.enable()
            } else {
                highlighter.disable()
            }
        });
        $('#syntaxhighlight, label[for="syntaxhighlight"]').remove();
        $span = $('<span>').append($checkbox).append('\n').append($label);
        $('#footer').prepend($span);
        mw.hook('ve.deactivate').add(function() {
            $span.remove()
        })
    }

    function makeCheckboxEdit(label, highlighter) {
        mw.loader.using('oojs-ui-core').done(function() {
            var checkbox = new OO.ui.CheckboxInputWidget({
                    selected: true
                }),
                field = new OO.ui.FieldLayout(checkbox, {
                    id: 'syntaxhighlight',
                    label: label,
                    align: 'inline'
                });
            highlighter.onoff = function(on) {
                checkbox.setSelected(on)
            };
            checkbox.on('change', function() {
                if (checkbox.isSelected()) {
                    highlighter.enable()
                } else {
                    highlighter.disable()
                }
            });
            $('.editCheckboxes > .oo-ui-layout').append(field.$element)
        })
    }

    function makeHighlighter(syntax, colors, id, label) {
        var textarea = id ? document.getElementById(id) : $('.ve-ui-mwWikitextSurface .ve-ce-documentNode')[0],
            highlighter;
        if (!textarea) {
            return
        }
        highlighter = new Highlighter(syntax, colors, textarea, true);
        if (label) {
            if (id) {
                makeCheckboxEdit(label, highlighter)
            } else {
                makeCheckboxVE(label, highlighter)
            }
        }
        if (mw.util.getParamValue('logTime')) {
            highlighter.reportTime = function(ms) {
                if (ms) {
                    window.console.log(ms + ' ms (#' + id + ')')
                }
            }
        }
        return highlighter
    }
    defaultWikitextColors = {
        bold: '#E5E5E5',
        'char-emdash': '#FFE6FF',
        'char-endash': '#E5E5E5',
        'char-minus': '#FFFFCC',
        comment: '#E6FFE6',
        entity: '#E6FFE6',
        externalLink: '#E6FFFF',
        italic: '#E5E5E5',
        heading: '#E5E5E5',
        hr: '#E5E5E5',
        listAndIndent: '#E6FFE6',
        magic: '#E5E5E5',
        'matching-paren': '#FFCCCC',
        parameter: '#FFCC66',
        pre: '#E5E5E5',
        signature: '#FFCC66',
        tag: '#FFE6FF',
        table: '#FFFFCC',
        'table-syntax': '#FFCC66',
        template: '#FFFFCC',
        wikilink: '#E6E6FF'
    };
    defaultCssColors = {
        at: '#FFE6FF',
        attr: '#FFE6FF',
        'class': '#FFE6FF',
        comment: '#E6FFE6',
        decleration: '#FFFFCC',
        id: '#E6E6FF',
        important: '#E6E6FF',
        'matching-paren': '#FFCCCC',
        pseudo: '#FFE6FF',
        string: '#FFCC66',
        value: '#E5E5E5'
    };
    defaultJsColors = {
        array: '#FFFFCC',
        comment: '#E6FFE6',
        common: '#E6FFFF',
        future: '#FFE6FF',
        global: '#E6FFE6',
        'matching-paren': '#FFCCCC',
        regexp: '#FFFFCC',
        reserved: '#E6E6FF',
        string: '#FFCC66'
    };
    strongColors = {
        at: 'pink',
        array: 'yellow',
        attr: 'pink',
        bold: 'gray',
        'char-emdash': 'pink',
        'char-endash': 'gray',
        'char-minus': 'yellow',
        'class': 'pink',
        comment: 'green',
        common: 'cyan',
        decleration: 'yellow',
        entity: 'green',
        externalLink: 'cyan',
        future: 'pink',
        global: 'green',
        id: '#55f',
        important: '#55f',
        italic: 'gray',
        heading: 'gray',
        hr: 'gray',
        listAndIndent: 'green',
        magic: 'gray',
        'matching-paren': 'red',
        parameter: 'orange',
        pre: 'gray',
        pseudo: 'pink',
        regexp: 'yellow',
        reserved: '#55f',
        signature: 'orange',
        string: 'orange',
        tag: 'pink',
        table: 'yellow',
        'table-syntax': 'orange',
        template: 'yellow',
        value: 'gray',
        wikilink: '#55f'
    };

    function getId() {
        if (mw.config.get('wgCanonicalSpecialPageName') === 'Upload') {
            return 'wpUploadDescription'
        }
        if ($('html.ve-activating, html.ve-active').length) {
            return ''
        }
        return 'wpTextbox1'
    }

    function initHighlighter(ext, additional) {
        var word, id, debug, colors, syntax, highlighter;
        id = getId();
        debug = !!mw.util.getParamValue('debugSyntaxhighlight');
        if (!debug) {
            colors = getColors(ext);
            syntax = getSyntax(ext)
        }
        if (!debug && additional) {
            for (word in additional) {
                if (hasOwn.call(additional, word)) {
                    colors['additional-' + word] = additional[word];
                    additional[word] = makeParserFunctionType('additional-' + word)
                }
            }
            syntax = $.extend({}, additional, syntax)
        }
        highlighter = makeHighlighter(syntax, colors, id, mw.msg('schnark-syntaxhighlight-enable'));
        if (!debug && id === 'wpTextbox1') {
            makeHighlighter(syntax, colors, 'wpTextbox2')
        }
        return function() {
            highlighter.destroy();
            $('#syntaxhighlight, label[for="syntaxhighlight"]').remove()
        }
    }

    function getColors(ext) {
        if (mw.config.get('wgServer') === 'http://localhost') {
            return strongColors
        }
        if (ext === '') {
            return defaultWikitextColors
        }
        if (ext === 'css') {
            return defaultCssColors
        }
        if (ext === 'js' || ext === 'json' || ext === 'lua') {
            return defaultJsColors
        }
    }

    function getSyntax(ext) {
        if (ext === '') {
            return wikiSyntax
        }
        if (ext === 'css') {
            return cssSyntax
        }
        if (ext === 'js') {
            return jsSyntax
        }
        if (ext === 'json') {
            return jsonSyntax
        }
        if (ext === 'lua') {
            return luaSyntax
        }
    }

    function allowTabs() {
        $(function() {
            var $textarea = $('#wpTextbox1'),
                scrolltop;
            $textarea.keypress(function(e) {
                if (e.keyCode === 9 && !(e.ctrlKey || e.altKey)) {
                    e.preventDefault();
                    var text = $textarea.textSelection('getSelection'),
                        sel = $textarea.textSelection('getCaretPosition', {
                            startAndEnd: true
                        }),
                        lines = text.split('\n'),
                        i, len = 0;
                    if (text === '') {
                        if (e.shiftKey) {
                            text = $textarea.textSelection('getContents');
                            if (text.charAt(sel[0] - 1) !== '\t') {
                                return
                            }
                            text = text.slice(0, sel[0] - 1) + text.slice(sel[0]);
                            scrolltop = $textarea[0].scrollTop;
                            $textarea.textSelection('setContents', text);
                            $textarea.textSelection('setSelection', {
                                start: sel[0] - 1,
                                end: sel[0] - 1
                            });
                            $textarea[0].scrollTop = scrolltop
                        } else {
                            $textarea.textSelection('encapsulateSelection', {
                                pre: '\t'
                            })
                        }
                        return
                    }
                    for (i = 0; i < lines.length; i++) {
                        if (e.shiftKey) {
                            if (lines[i][0] === '\t') {
                                lines[i] = lines[i].slice(1);
                                len--
                            }
                        } else {
                            if (lines[i] !== '') {
                                lines[i] = '\t' + lines[i];
                                len++
                            }
                        }
                    }
                    if (len !== 0) {
                        $textarea.textSelection('encapsulateSelection', {
                            peri: lines.join('\n'),
                            replace: true
                        });
                        $textarea.textSelection('setSelection', {
                            start: sel[0],
                            end: sel[1] + len
                        })
                    }
                }
            })
        })
    }

    function createHighlighter(deps, ext) {
        mw.loader.using(deps).done(function() {
            $(function() {
                window.setTimeout(function() {
                    removeHighlighter = initHighlighter(ext, mw.user.options.get('schnark-syntaxhighlight-additional', false))
                }, 0)
            })
        })
    }

    function removeHighlighter() {}

    function killCodeEditor() {
        mw.config.set('wgCodeEditorCurrentLanguage', false);
        $(function() {
            try {
                var context = $('#wpTextbox1').data('wikiEditorContext');
                $('.tool[rel="codeEditor"]').remove();
                context.fn.disableCodeEditor();
                if (String(mw.user.options.get('usecodeeditor')) !== '0') {
                    context.fn.setCodeEditorPreference(false)
                }
            } catch (e) {}
        })
    }

    function handleCodeEditor(deps, ext, ceEnabled) {
        var $button = $('.tool[rel=codeEditor]'),
            $clone = $button.clone(true).removeClass('tool');
        $button.off('click').click(function() {
            if (ceEnabled) {
                $clone.click();
                ceEnabled = false;
                createHighlighter(deps, ext)
            } else {
                removeHighlighter();
                $clone.click();
                ceEnabled = true
            }
        })
    }

    function initL10N(l10n) {
        var i, chain = mw.language.getFallbackLanguageChain();
        for (i = chain.length - 1; i >= 0; i--) {
            if (chain[i] in l10n) {
                mw.messages.set(l10n[chain[i]])
            }
        }
    }

    function init(ve) {
        initL10N({
            en: {
                'schnark-syntaxhighlight-enable': 'Enable syntax highlighter'
            },
            de: {
                'schnark-syntaxhighlight-enable': 'Syntaxhervorhebung aktivieren'
            }
        });
        if (!$.client.test(map) && !mw.util.getParamValue('ignoreBlacklist')) {
            return
        }
        if (ve && !mw.user.options.get('userjs-schnark-syntaxhighlight-nwe')) {
            return
        }
        var modelToExt = {
                javascript: 'js',
                css: 'css',
                Scribunto: 'lua',
                wikitext: ''
            },
            ext, deps = [],
            hasCodeEditor = 0;
        if (!ve && mw.config.get('wgCanonicalSpecialPageName') !== 'Upload' && mw.user.options.get('usebetatoolbar')) {
            deps.push('ext.wikiEditor');
            mw.util.addCSS('.tool-select .options {z-index: 5;}')
        }
        ext = hasOwn.call(modelToExt, mw.config.get('wgPageContentModel')) ? modelToExt[mw.config.get('wgPageContentModel')] : 'json';
        if (hasOwn.call(mw.user.options.get('schnark-syntaxhighlight-exclude', {}), ext)) {
            return
        }
        if (ext) {
            mw.loader.using('jquery.textSelection').done(allowTabs)
        }
        if (ext && mw.user.options.get('usebetatoolbar')) {
            if (mw.user.options.exists('usecodeeditor')) {
                if (String(mw.user.options.get('usecodeeditor')) !== '0') {
                    hasCodeEditor = 2
                } else {
                    hasCodeEditor = 1
                }
            } else {
                hasCodeEditor = mw.loader.getState('ext.codeEditor') ? 2 : 0
            }
        }
        if (hasCodeEditor && mw.user.options.get('userjs-schnark-syntaxhighlight-no-code-editor')) {
            killCodeEditor();
            hasCodeEditor = 0
        }
        if (hasCodeEditor) {
            mw.loader.using('ext.codeEditor').done(function() {
                $(function() {
                    handleCodeEditor(deps, ext, hasCodeEditor === 2)
                })
            })
        }
        if (hasCodeEditor !== 2) {
            createHighlighter(deps, ext)
        }
    }
    if (['edit', 'submit'].indexOf(mw.config.get('wgAction')) !== -1 || mw.config.get('wgCanonicalSpecialPageName') === 'Upload') {
        mw.loader.using(['jquery.client', 'mediawiki.util', 'mediawiki.language', 'user.options']).done(function() {
            init()
        })
    }
    mw.hook('ve.activationComplete').add(function() {
        mw.loader.using(['jquery.client', 'mediawiki.util', 'mediawiki.language', 'user.options']).done(function() {
            init(true)
        })
    });
    if (libs.qunit) {
        libs.qunit.Parser = Parser;
        libs.qunit.wikiSyntax = wikiSyntax;
        libs.qunit.jsSyntax = jsSyntax;
        libs.qunit.cssSyntax = cssSyntax;
        libs.qunit.luaSyntax = luaSyntax
    }
})(jQuery, mediaWiki, mediaWiki.libs);
//</nowiki>