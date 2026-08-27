(() => {
  var __create = Object.create;
  var __defProp = Object.defineProperty;
  var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
  var __getOwnPropNames = Object.getOwnPropertyNames;
  var __getProtoOf = Object.getPrototypeOf;
  var __hasOwnProp = Object.prototype.hasOwnProperty;
  var __commonJS = (cb, mod) => function __require() {
    try {
      return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
    } catch (e) {
      throw mod = 0, e;
    }
  };
  var __copyProps = (to, from, except, desc) => {
    if (from && typeof from === "object" || typeof from === "function") {
      for (let key of __getOwnPropNames(from))
        if (!__hasOwnProp.call(to, key) && key !== except)
          __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
    }
    return to;
  };
  var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
    // If the importer is in node compatibility mode or this is not an ESM
    // file that has been converted to a CommonJS file using a Babel-
    // compatible transform (i.e. "__esModule" has not been set), then set
    // "default" to the CommonJS "module.exports" for node compatibility.
    isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
    mod
  ));

  // node_modules/highlight.js/lib/core.js
  var require_core = __commonJS({
    "node_modules/highlight.js/lib/core.js"(exports, module) {
      function deepFreeze(obj) {
        if (obj instanceof Map) {
          obj.clear = obj.delete = obj.set = function() {
            throw new Error("map is read-only");
          };
        } else if (obj instanceof Set) {
          obj.add = obj.clear = obj.delete = function() {
            throw new Error("set is read-only");
          };
        }
        Object.freeze(obj);
        Object.getOwnPropertyNames(obj).forEach((name) => {
          const prop = obj[name];
          const type = typeof prop;
          if ((type === "object" || type === "function") && !Object.isFrozen(prop)) {
            deepFreeze(prop);
          }
        });
        return obj;
      }
      var Response = class {
        /**
         * @param {CompiledMode} mode
         */
        constructor(mode) {
          if (mode.data === void 0) mode.data = {};
          this.data = mode.data;
          this.isMatchIgnored = false;
        }
        ignoreMatch() {
          this.isMatchIgnored = true;
        }
      };
      function escapeHTML(value) {
        return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#x27;");
      }
      function inherit$1(original, ...objects) {
        const result = /* @__PURE__ */ Object.create(null);
        for (const key in original) {
          result[key] = original[key];
        }
        objects.forEach(function(obj) {
          for (const key in obj) {
            result[key] = obj[key];
          }
        });
        return (
          /** @type {T} */
          result
        );
      }
      var SPAN_CLOSE = "</span>";
      var emitsWrappingTags = (node) => {
        return !!node.scope;
      };
      var scopeToCSSClass = (name, { prefix }) => {
        if (name.startsWith("language:")) {
          return name.replace("language:", "language-");
        }
        if (name.includes(".")) {
          const pieces = name.split(".");
          return [
            `${prefix}${pieces.shift()}`,
            ...pieces.map((x3, i) => `${x3}${"_".repeat(i + 1)}`)
          ].join(" ");
        }
        return `${prefix}${name}`;
      };
      var HTMLRenderer = class {
        /**
         * Creates a new HTMLRenderer
         *
         * @param {Tree} parseTree - the parse tree (must support `walk` API)
         * @param {{classPrefix: string}} options
         */
        constructor(parseTree, options) {
          this.buffer = "";
          this.classPrefix = options.classPrefix;
          parseTree.walk(this);
        }
        /**
         * Adds texts to the output stream
         *
         * @param {string} text */
        addText(text2) {
          this.buffer += escapeHTML(text2);
        }
        /**
         * Adds a node open to the output stream (if needed)
         *
         * @param {Node} node */
        openNode(node) {
          if (!emitsWrappingTags(node)) return;
          const className = scopeToCSSClass(
            node.scope,
            { prefix: this.classPrefix }
          );
          this.span(className);
        }
        /**
         * Adds a node close to the output stream (if needed)
         *
         * @param {Node} node */
        closeNode(node) {
          if (!emitsWrappingTags(node)) return;
          this.buffer += SPAN_CLOSE;
        }
        /**
         * returns the accumulated buffer
        */
        value() {
          return this.buffer;
        }
        // helpers
        /**
         * Builds a span element
         *
         * @param {string} className */
        span(className) {
          this.buffer += `<span class="${className}">`;
        }
      };
      var newNode = (opts = {}) => {
        const result = { children: [] };
        Object.assign(result, opts);
        return result;
      };
      var TokenTree = class _TokenTree {
        constructor() {
          this.rootNode = newNode();
          this.stack = [this.rootNode];
        }
        get top() {
          return this.stack[this.stack.length - 1];
        }
        get root() {
          return this.rootNode;
        }
        /** @param {Node} node */
        add(node) {
          this.top.children.push(node);
        }
        /** @param {string} scope */
        openNode(scope) {
          const node = newNode({ scope });
          this.add(node);
          this.stack.push(node);
        }
        closeNode() {
          if (this.stack.length > 1) {
            return this.stack.pop();
          }
          return void 0;
        }
        closeAllNodes() {
          while (this.closeNode()) ;
        }
        toJSON() {
          return JSON.stringify(this.rootNode, null, 4);
        }
        /**
         * @typedef { import("./html_renderer").Renderer } Renderer
         * @param {Renderer} builder
         */
        walk(builder) {
          return this.constructor._walk(builder, this.rootNode);
        }
        /**
         * @param {Renderer} builder
         * @param {Node} node
         */
        static _walk(builder, node) {
          if (typeof node === "string") {
            builder.addText(node);
          } else if (node.children) {
            builder.openNode(node);
            node.children.forEach((child) => this._walk(builder, child));
            builder.closeNode(node);
          }
          return builder;
        }
        /**
         * @param {Node} node
         */
        static _collapse(node) {
          if (typeof node === "string") return;
          if (!node.children) return;
          if (node.children.every((el) => typeof el === "string")) {
            node.children = [node.children.join("")];
          } else {
            node.children.forEach((child) => {
              _TokenTree._collapse(child);
            });
          }
        }
      };
      var TokenTreeEmitter = class extends TokenTree {
        /**
         * @param {*} options
         */
        constructor(options) {
          super();
          this.options = options;
        }
        /**
         * @param {string} text
         */
        addText(text2) {
          if (text2 === "") {
            return;
          }
          this.add(text2);
        }
        /** @param {string} scope */
        startScope(scope) {
          this.openNode(scope);
        }
        endScope() {
          this.closeNode();
        }
        /**
         * @param {Emitter & {root: DataNode}} emitter
         * @param {string} name
         */
        __addSublanguage(emitter, name) {
          const node = emitter.root;
          if (name) node.scope = `language:${name}`;
          this.add(node);
        }
        toHTML() {
          const renderer = new HTMLRenderer(this, this.options);
          return renderer.value();
        }
        finalize() {
          this.closeAllNodes();
          return true;
        }
      };
      function source2(re) {
        if (!re) return null;
        if (typeof re === "string") return re;
        return re.source;
      }
      function lookahead2(re) {
        return concat2("(?=", re, ")");
      }
      function anyNumberOfTimes(re) {
        return concat2("(?:", re, ")*");
      }
      function optional(re) {
        return concat2("(?:", re, ")?");
      }
      function concat2(...args) {
        const joined = args.map((x3) => source2(x3)).join("");
        return joined;
      }
      function stripOptionsFromArgs2(args) {
        const opts = args[args.length - 1];
        if (typeof opts === "object" && opts.constructor === Object) {
          args.splice(args.length - 1, 1);
          return opts;
        } else {
          return {};
        }
      }
      function either2(...args) {
        const opts = stripOptionsFromArgs2(args);
        const joined = "(" + (opts.capture ? "" : "?:") + args.map((x3) => source2(x3)).join("|") + ")";
        return joined;
      }
      function countMatchGroups(re) {
        return new RegExp(re.toString() + "|").exec("").length - 1;
      }
      function startsWith(re, lexeme) {
        const match = re && re.exec(lexeme);
        return match && match.index === 0;
      }
      var BACKREF_RE = new RegExp(either2(
        /\[(?:[^\\\]]|\\.)*\]/,
        // a character class, inside which ( and \ lose their meaning
        /\(\?<(?![=!])[^>]+>/,
        // a named capture group `(?<name>` (not a lookbehind `(?<=` / `(?<!`)
        /\(\?'[^']+'/,
        // a named capture group `(?'name'`
        /\(\??/,
        // an opening parenthesis, capturing or non-capturing / lookahead
        /\\([1-9][0-9]*)/,
        // a backreference like `\1`
        /\\./
        // any other escape sequence
      ));
      function _rewriteBackreferences(regexps, { joinWith }) {
        let numCaptures = 0;
        return regexps.map((regex) => {
          numCaptures += 1;
          const offset = numCaptures;
          let re = source2(regex);
          let out = "";
          while (re.length > 0) {
            const match = BACKREF_RE.exec(re);
            if (!match) {
              out += re;
              break;
            }
            out += re.substring(0, match.index);
            re = re.substring(match.index + match[0].length);
            if (match[0][0] === "\\" && match[1]) {
              out += "\\" + String(Number(match[1]) + offset);
            } else {
              out += match[0];
              if (match[0] === "(" || /^\(\?[<']/.test(match[0])) {
                numCaptures++;
              }
            }
          }
          return out;
        }).map((re) => `(${re})`).join(joinWith);
      }
      var MATCH_NOTHING_RE = /\b\B/;
      var IDENT_RE3 = "[a-zA-Z]\\w*";
      var UNDERSCORE_IDENT_RE = "[a-zA-Z_]\\w*";
      var NUMBER_RE = "\\b\\d+(\\.\\d+)?";
      var C_NUMBER_RE = "(-?)(\\b0[xX][a-fA-F0-9]+|(\\b\\d+(\\.\\d*)?|\\.\\d+)([eE][-+]?\\d+)?)";
      var BINARY_NUMBER_RE = "\\b(0b[01]+)";
      var RE_STARTERS_RE = "!|!=|!==|%|%=|&|&&|&=|\\*|\\*=|\\+|\\+=|,|-|-=|/=|/|:|;|<<|<<=|<=|<|===|==|=|>>>=|>>=|>=|>>>|>>|>|\\?|\\[|\\{|\\(|\\^|\\^=|\\||\\|=|\\|\\||~";
      var SHEBANG = (opts = {}) => {
        const beginShebang = /^#![ ]*\//;
        if (opts.binary) {
          opts.begin = concat2(
            beginShebang,
            /.*\b/,
            opts.binary,
            /\b.*/
          );
        }
        return inherit$1({
          scope: "meta",
          begin: beginShebang,
          end: /$/,
          relevance: 0,
          /** @type {ModeCallback} */
          "on:begin": (m3, resp) => {
            if (m3.index !== 0) resp.ignoreMatch();
          }
        }, opts);
      };
      var BACKSLASH_ESCAPE = {
        begin: "\\\\[\\s\\S]",
        relevance: 0
      };
      var APOS_STRING_MODE = {
        scope: "string",
        begin: "'",
        end: "'",
        illegal: "\\n",
        contains: [BACKSLASH_ESCAPE]
      };
      var QUOTE_STRING_MODE = {
        scope: "string",
        begin: '"',
        end: '"',
        illegal: "\\n",
        contains: [BACKSLASH_ESCAPE]
      };
      var PHRASAL_WORDS_MODE = {
        begin: /\b(a|an|the|are|I'm|isn't|don't|doesn't|won't|but|just|should|pretty|simply|enough|gonna|going|wtf|so|such|will|you|your|they|like|more)\b/
      };
      var COMMENT = function(begin, end, modeOptions = {}) {
        const mode = inherit$1(
          {
            scope: "comment",
            begin,
            end,
            contains: []
          },
          modeOptions
        );
        mode.contains.push({
          scope: "doctag",
          // hack to avoid the space from being included. the space is necessary to
          // match here to prevent the plain text rule below from gobbling up doctags
          begin: "[ ]*(?=(TODO|FIXME|NOTE|BUG|OPTIMIZE|HACK|XXX):)",
          end: /(TODO|FIXME|NOTE|BUG|OPTIMIZE|HACK|XXX):/,
          excludeBegin: true,
          relevance: 0
        });
        const ENGLISH_WORD = either2(
          // list of common 1 and 2 letter words in English
          "I",
          "a",
          "is",
          "so",
          "us",
          "to",
          "at",
          "if",
          "in",
          "it",
          "on",
          // note: this is not an exhaustive list of contractions, just popular ones
          /[A-Za-z]+['](d|ve|re|ll|t|s|n)/,
          // contractions - can't we'd they're let's, etc
          /[A-Za-z]+[-][a-z]+/,
          // `no-way`, etc.
          /[A-Za-z][a-z]{2,}/
          // allow capitalized words at beginning of sentences
        );
        mode.contains.push(
          {
            // TODO: how to include ", (, ) without breaking grammars that use these for
            // comment delimiters?
            // begin: /[ ]+([()"]?([A-Za-z'-]{3,}|is|a|I|so|us|[tT][oO]|at|if|in|it|on)[.]?[()":]?([.][ ]|[ ]|\))){3}/
            // ---
            // this tries to find sequences of 3 english words in a row (without any
            // "programming" type syntax) this gives us a strong signal that we've
            // TRULY found a comment - vs perhaps scanning with the wrong language.
            // It's possible to find something that LOOKS like the start of the
            // comment - but then if there is no readable text - good chance it is a
            // false match and not a comment.
            //
            // for a visual example please see:
            // https://github.com/highlightjs/highlight.js/issues/2827
            begin: concat2(
              /[ ]+/,
              // necessary to prevent us gobbling up doctags like /* @author Bob Mcgill */
              "(",
              ENGLISH_WORD,
              /[.]?[:]?([.][ ]|[ ])/,
              "){3}"
            )
            // look for 3 words in a row
          }
        );
        return mode;
      };
      var C_LINE_COMMENT_MODE = COMMENT("//", "$");
      var C_BLOCK_COMMENT_MODE = COMMENT("/\\*", "\\*/");
      var HASH_COMMENT_MODE = COMMENT("#", "$");
      var NUMBER_MODE = {
        scope: "number",
        begin: NUMBER_RE,
        relevance: 0
      };
      var C_NUMBER_MODE = {
        scope: "number",
        begin: C_NUMBER_RE,
        relevance: 0
      };
      var BINARY_NUMBER_MODE = {
        scope: "number",
        begin: BINARY_NUMBER_RE,
        relevance: 0
      };
      var REGEXP_MODE = {
        scope: "regexp",
        begin: /\/(?=[^/\n]*\/)/,
        end: /\/[gimuy]*/,
        contains: [
          BACKSLASH_ESCAPE,
          {
            begin: /\[/,
            end: /\]/,
            relevance: 0,
            contains: [BACKSLASH_ESCAPE]
          }
        ]
      };
      var TITLE_MODE = {
        scope: "title",
        begin: IDENT_RE3,
        relevance: 0
      };
      var UNDERSCORE_TITLE_MODE = {
        scope: "title",
        begin: UNDERSCORE_IDENT_RE,
        relevance: 0
      };
      var METHOD_GUARD = {
        // excludes method names from keyword processing
        begin: "\\.\\s*" + UNDERSCORE_IDENT_RE,
        relevance: 0
      };
      var END_SAME_AS_BEGIN = function(mode) {
        return Object.assign(
          mode,
          {
            /** @type {ModeCallback} */
            "on:begin": (m3, resp) => {
              resp.data._beginMatch = m3[1];
            },
            /** @type {ModeCallback} */
            "on:end": (m3, resp) => {
              if (resp.data._beginMatch !== m3[1]) resp.ignoreMatch();
            }
          }
        );
      };
      var MODES2 = /* @__PURE__ */ Object.freeze({
        __proto__: null,
        APOS_STRING_MODE,
        BACKSLASH_ESCAPE,
        BINARY_NUMBER_MODE,
        BINARY_NUMBER_RE,
        COMMENT,
        C_BLOCK_COMMENT_MODE,
        C_LINE_COMMENT_MODE,
        C_NUMBER_MODE,
        C_NUMBER_RE,
        END_SAME_AS_BEGIN,
        HASH_COMMENT_MODE,
        IDENT_RE: IDENT_RE3,
        MATCH_NOTHING_RE,
        METHOD_GUARD,
        NUMBER_MODE,
        NUMBER_RE,
        PHRASAL_WORDS_MODE,
        QUOTE_STRING_MODE,
        REGEXP_MODE,
        RE_STARTERS_RE,
        SHEBANG,
        TITLE_MODE,
        UNDERSCORE_IDENT_RE,
        UNDERSCORE_TITLE_MODE
      });
      function skipIfHasPrecedingDot(match, response) {
        const before = match.input[match.index - 1];
        if (before === ".") {
          response.ignoreMatch();
        }
      }
      function scopeClassName(mode, _parent) {
        if (mode.className !== void 0) {
          mode.scope = mode.className;
          delete mode.className;
        }
      }
      function beginKeywords(mode, parent) {
        if (!parent) return;
        if (!mode.beginKeywords) return;
        mode.begin = "\\b(" + mode.beginKeywords.split(" ").join("|") + ")(?!\\.)(?=\\b|\\s)";
        mode.__beforeBegin = skipIfHasPrecedingDot;
        mode.keywords = mode.keywords || mode.beginKeywords;
        delete mode.beginKeywords;
        if (mode.relevance === void 0) mode.relevance = 0;
      }
      function compileIllegal(mode, _parent) {
        if (!Array.isArray(mode.illegal)) return;
        mode.illegal = either2(...mode.illegal);
      }
      function compileMatch(mode, _parent) {
        if (!mode.match) return;
        if (mode.begin || mode.end) throw new Error("begin & end are not supported with match");
        mode.begin = mode.match;
        delete mode.match;
      }
      function compileRelevance(mode, _parent) {
        if (mode.relevance === void 0) mode.relevance = 1;
      }
      var beforeMatchExt = (mode, parent) => {
        if (!mode.beforeMatch) return;
        if (mode.starts) throw new Error("beforeMatch cannot be used with starts");
        const originalMode = Object.assign({}, mode);
        Object.keys(mode).forEach((key) => {
          delete mode[key];
        });
        mode.keywords = originalMode.keywords;
        mode.begin = concat2(originalMode.beforeMatch, lookahead2(originalMode.begin));
        mode.starts = {
          relevance: 0,
          contains: [
            Object.assign(originalMode, { endsParent: true })
          ]
        };
        mode.relevance = 0;
        delete originalMode.beforeMatch;
      };
      var COMMON_KEYWORDS = [
        "of",
        "and",
        "for",
        "in",
        "not",
        "or",
        "if",
        "then",
        "parent",
        // common variable name
        "list",
        // common variable name
        "value"
        // common variable name
      ];
      var DEFAULT_KEYWORD_SCOPE = "keyword";
      function compileKeywords(rawKeywords, caseInsensitive, scopeName = DEFAULT_KEYWORD_SCOPE) {
        const compiledKeywords = /* @__PURE__ */ Object.create(null);
        if (typeof rawKeywords === "string") {
          compileList(scopeName, rawKeywords.split(" "));
        } else if (Array.isArray(rawKeywords)) {
          compileList(scopeName, rawKeywords);
        } else {
          Object.keys(rawKeywords).forEach(function(scopeName2) {
            Object.assign(
              compiledKeywords,
              compileKeywords(rawKeywords[scopeName2], caseInsensitive, scopeName2)
            );
          });
        }
        return compiledKeywords;
        function compileList(scopeName2, keywordList) {
          if (caseInsensitive) {
            keywordList = keywordList.map((x3) => x3.toLowerCase());
          }
          keywordList.forEach(function(keyword) {
            const pair = keyword.split("|");
            compiledKeywords[pair[0]] = [scopeName2, scoreForKeyword(pair[0], pair[1])];
          });
        }
      }
      function scoreForKeyword(keyword, providedScore) {
        if (providedScore) {
          return Number(providedScore);
        }
        return commonKeyword(keyword) ? 0 : 1;
      }
      function commonKeyword(keyword) {
        return COMMON_KEYWORDS.includes(keyword.toLowerCase());
      }
      var seenDeprecations = {};
      var error = (message) => {
        console.error(message);
      };
      var warn = (message, ...args) => {
        console.log(`WARN: ${message}`, ...args);
      };
      var deprecated = (version2, message) => {
        if (seenDeprecations[`${version2}/${message}`]) return;
        console.log(`Deprecated as of ${version2}. ${message}`);
        seenDeprecations[`${version2}/${message}`] = true;
      };
      var MultiClassError = new Error();
      function remapScopeNames(mode, regexes, { key }) {
        let offset = 0;
        const scopeNames = mode[key];
        const emit = {};
        const positions = {};
        for (let i = 1; i <= regexes.length; i++) {
          positions[i + offset] = scopeNames[i];
          emit[i + offset] = true;
          offset += countMatchGroups(regexes[i - 1]);
        }
        mode[key] = positions;
        mode[key]._emit = emit;
        mode[key]._multi = true;
      }
      function beginMultiClass(mode) {
        if (!Array.isArray(mode.begin)) return;
        if (mode.skip || mode.excludeBegin || mode.returnBegin) {
          error("skip, excludeBegin, returnBegin not compatible with beginScope: {}");
          throw MultiClassError;
        }
        if (typeof mode.beginScope !== "object" || mode.beginScope === null) {
          error("beginScope must be object");
          throw MultiClassError;
        }
        remapScopeNames(mode, mode.begin, { key: "beginScope" });
        mode.begin = _rewriteBackreferences(mode.begin, { joinWith: "" });
      }
      function endMultiClass(mode) {
        if (!Array.isArray(mode.end)) return;
        if (mode.skip || mode.excludeEnd || mode.returnEnd) {
          error("skip, excludeEnd, returnEnd not compatible with endScope: {}");
          throw MultiClassError;
        }
        if (typeof mode.endScope !== "object" || mode.endScope === null) {
          error("endScope must be object");
          throw MultiClassError;
        }
        remapScopeNames(mode, mode.end, { key: "endScope" });
        mode.end = _rewriteBackreferences(mode.end, { joinWith: "" });
      }
      function scopeSugar(mode) {
        if (mode.scope && typeof mode.scope === "object" && mode.scope !== null) {
          mode.beginScope = mode.scope;
          delete mode.scope;
        }
      }
      function MultiClass(mode) {
        scopeSugar(mode);
        if (typeof mode.beginScope === "string") {
          mode.beginScope = { _wrap: mode.beginScope };
        }
        if (typeof mode.endScope === "string") {
          mode.endScope = { _wrap: mode.endScope };
        }
        beginMultiClass(mode);
        endMultiClass(mode);
      }
      function compileLanguage(language) {
        function langRe(value, global) {
          return new RegExp(
            source2(value),
            "m" + (language.case_insensitive ? "i" : "") + (language.unicodeRegex ? "u" : "") + (global ? "g" : "")
          );
        }
        class MultiRegex {
          constructor() {
            this.matchIndexes = {};
            this.regexes = [];
            this.matchAt = 1;
            this.position = 0;
          }
          // @ts-ignore
          addRule(re, opts) {
            opts.position = this.position++;
            this.matchIndexes[this.matchAt] = opts;
            this.regexes.push([opts, re]);
            this.matchAt += countMatchGroups(re) + 1;
          }
          compile() {
            if (this.regexes.length === 0) {
              this.exec = () => null;
            }
            const terminators = this.regexes.map((el) => el[1]);
            this.matcherRe = langRe(_rewriteBackreferences(terminators, { joinWith: "|" }), true);
            this.lastIndex = 0;
          }
          /** @param {string} s */
          exec(s) {
            this.matcherRe.lastIndex = this.lastIndex;
            const match = this.matcherRe.exec(s);
            if (!match) {
              return null;
            }
            const i = match.findIndex((el, i2) => i2 > 0 && el !== void 0);
            const matchData = this.matchIndexes[i];
            match.splice(0, i);
            return Object.assign(match, matchData);
          }
        }
        class ResumableMultiRegex {
          constructor() {
            this.rules = [];
            this.multiRegexes = [];
            this.count = 0;
            this.lastIndex = 0;
            this.regexIndex = 0;
          }
          // @ts-ignore
          getMatcher(index) {
            if (this.multiRegexes[index]) return this.multiRegexes[index];
            const matcher = new MultiRegex();
            this.rules.slice(index).forEach(([re, opts]) => matcher.addRule(re, opts));
            matcher.compile();
            this.multiRegexes[index] = matcher;
            return matcher;
          }
          resumingScanAtSamePosition() {
            return this.regexIndex !== 0;
          }
          considerAll() {
            this.regexIndex = 0;
          }
          // @ts-ignore
          addRule(re, opts) {
            this.rules.push([re, opts]);
            if (opts.type === "begin") this.count++;
          }
          /** @param {string} s */
          exec(s) {
            const m3 = this.getMatcher(this.regexIndex);
            m3.lastIndex = this.lastIndex;
            let result = m3.exec(s);
            if (this.resumingScanAtSamePosition()) {
              if (result && result.index === this.lastIndex) ;
              else {
                const m22 = this.getMatcher(0);
                m22.lastIndex = this.lastIndex + 1;
                result = m22.exec(s);
              }
            }
            if (result) {
              this.regexIndex += result.position + 1;
              if (this.regexIndex === this.count) {
                this.considerAll();
              }
            }
            return result;
          }
        }
        function buildModeRegex(mode) {
          const mm = new ResumableMultiRegex();
          mode.contains.forEach((term) => mm.addRule(term.begin, { rule: term, type: "begin" }));
          if (mode.terminatorEnd) {
            mm.addRule(mode.terminatorEnd, { type: "end" });
          }
          if (mode.illegal) {
            mm.addRule(mode.illegal, { type: "illegal" });
          }
          return mm;
        }
        function compileMode(mode, parent) {
          const cmode = (
            /** @type CompiledMode */
            mode
          );
          if (mode.isCompiled) return cmode;
          [
            scopeClassName,
            // do this early so compiler extensions generally don't have to worry about
            // the distinction between match/begin
            compileMatch,
            MultiClass,
            beforeMatchExt
          ].forEach((ext) => ext(mode, parent));
          language.compilerExtensions.forEach((ext) => ext(mode, parent));
          mode.__beforeBegin = null;
          [
            beginKeywords,
            // do this later so compiler extensions that come earlier have access to the
            // raw array if they wanted to perhaps manipulate it, etc.
            compileIllegal,
            // default to 1 relevance if not specified
            compileRelevance
          ].forEach((ext) => ext(mode, parent));
          mode.isCompiled = true;
          let keywordPattern = null;
          if (typeof mode.keywords === "object" && mode.keywords.$pattern) {
            mode.keywords = Object.assign({}, mode.keywords);
            keywordPattern = mode.keywords.$pattern;
            delete mode.keywords.$pattern;
          }
          keywordPattern = keywordPattern || /\w+/;
          if (mode.keywords) {
            mode.keywords = compileKeywords(mode.keywords, language.case_insensitive);
          }
          cmode.keywordPatternRe = langRe(keywordPattern, true);
          if (parent) {
            if (!mode.begin) mode.begin = /\B|\b/;
            cmode.beginRe = langRe(cmode.begin);
            if (!mode.end && !mode.endsWithParent) mode.end = /\B|\b/;
            if (mode.end) cmode.endRe = langRe(cmode.end);
            cmode.terminatorEnd = source2(cmode.end) || "";
            if (mode.endsWithParent && parent.terminatorEnd) {
              cmode.terminatorEnd += (mode.end ? "|" : "") + parent.terminatorEnd;
            }
          }
          if (mode.illegal) cmode.illegalRe = langRe(
            /** @type {RegExp | string} */
            mode.illegal
          );
          if (!mode.contains) mode.contains = [];
          mode.contains = [].concat(...mode.contains.map(function(c3) {
            return expandOrCloneMode(c3 === "self" ? mode : c3);
          }));
          mode.contains.forEach(function(c3) {
            compileMode(
              /** @type Mode */
              c3,
              cmode
            );
          });
          if (mode.starts) {
            compileMode(mode.starts, parent);
          }
          cmode.matcher = buildModeRegex(cmode);
          return cmode;
        }
        if (!language.compilerExtensions) language.compilerExtensions = [];
        if (language.contains && language.contains.includes("self")) {
          throw new Error("ERR: contains `self` is not supported at the top-level of a language.  See documentation.");
        }
        language.classNameAliases = inherit$1(language.classNameAliases || {});
        return compileMode(
          /** @type Mode */
          language
        );
      }
      function dependencyOnParent(mode) {
        if (!mode) return false;
        return mode.endsWithParent || dependencyOnParent(mode.starts);
      }
      function expandOrCloneMode(mode) {
        if (mode.variants && !mode.cachedVariants) {
          mode.cachedVariants = mode.variants.map(function(variant) {
            return inherit$1(mode, { variants: null }, variant);
          });
        }
        if (mode.cachedVariants) {
          return mode.cachedVariants;
        }
        if (dependencyOnParent(mode)) {
          return inherit$1(mode, { starts: mode.starts ? inherit$1(mode.starts) : null });
        }
        if (Object.isFrozen(mode)) {
          return inherit$1(mode);
        }
        return mode;
      }
      var version = "11.12.0";
      var HTMLInjectionError = class extends Error {
        constructor(reason, html2) {
          super(reason);
          this.name = "HTMLInjectionError";
          this.html = html2;
        }
      };
      var escape = escapeHTML;
      var inherit = inherit$1;
      var NO_MATCH = /* @__PURE__ */ Symbol("nomatch");
      var MAX_KEYWORD_HITS = 7;
      var HLJS = function(hljs2) {
        const languages = /* @__PURE__ */ Object.create(null);
        const aliases = /* @__PURE__ */ Object.create(null);
        const plugins = [];
        let SAFE_MODE = true;
        const LANGUAGE_NOT_FOUND = "Could not find the language '{}', did you forget to load/include a language module?";
        const PLAINTEXT_LANGUAGE = { disableAutodetect: true, name: "Plain text", contains: [] };
        let options = {
          ignoreUnescapedHTML: false,
          throwUnescapedHTML: false,
          noHighlightRe: /^(no-?highlight)$/i,
          languageDetectRe: /\blang(?:uage)?-([\w-]+)\b/i,
          classPrefix: "hljs-",
          cssSelector: "pre code",
          languages: null,
          // beta configuration options, subject to change, welcome to discuss
          // https://github.com/highlightjs/highlight.js/issues/1086
          __emitter: TokenTreeEmitter
        };
        function shouldNotHighlight(languageName) {
          return options.noHighlightRe.test(languageName);
        }
        function blockLanguage(block) {
          let classes = block.className + " ";
          classes += block.parentNode ? block.parentNode.className : "";
          const match = options.languageDetectRe.exec(classes);
          if (match) {
            const language = getLanguage(match[1]);
            if (!language) {
              warn(LANGUAGE_NOT_FOUND.replace("{}", match[1]));
              warn("Falling back to no-highlight mode for this block.", block);
            }
            return language ? match[1] : "no-highlight";
          }
          return classes.split(/\s+/).find((_class) => shouldNotHighlight(_class) || getLanguage(_class));
        }
        function highlight2(codeOrLanguageName, optionsOrCode, ignoreIllegals) {
          let code = "";
          let languageName = "";
          if (typeof optionsOrCode === "object") {
            code = codeOrLanguageName;
            ignoreIllegals = optionsOrCode.ignoreIllegals;
            languageName = optionsOrCode.language;
          } else {
            deprecated("10.7.0", "highlight(lang, code, ...args) has been deprecated.");
            deprecated("10.7.0", "Please use highlight(code, options) instead.\nhttps://github.com/highlightjs/highlight.js/issues/2277");
            languageName = codeOrLanguageName;
            code = optionsOrCode;
          }
          if (ignoreIllegals === void 0) {
            ignoreIllegals = true;
          }
          const context = {
            code,
            language: languageName
          };
          fire("before:highlight", context);
          const result = context.result ? context.result : _highlight(context.language, context.code, ignoreIllegals);
          result.code = context.code;
          fire("after:highlight", result);
          return result;
        }
        function _highlight(languageName, codeToHighlight, ignoreIllegals, continuation) {
          const keywordHits = /* @__PURE__ */ Object.create(null);
          function keywordData(mode, matchText) {
            return mode.keywords[matchText];
          }
          function processKeywords() {
            if (!top.keywords) {
              emitter.addText(modeBuffer);
              return;
            }
            let lastIndex = 0;
            top.keywordPatternRe.lastIndex = 0;
            let match = top.keywordPatternRe.exec(modeBuffer);
            let buf = "";
            while (match) {
              buf += modeBuffer.substring(lastIndex, match.index);
              const word = language.case_insensitive ? match[0].toLowerCase() : match[0];
              const data = keywordData(top, word);
              if (data) {
                const [kind, keywordRelevance] = data;
                emitter.addText(buf);
                buf = "";
                keywordHits[word] = (keywordHits[word] || 0) + 1;
                if (keywordHits[word] <= MAX_KEYWORD_HITS) relevance += keywordRelevance;
                if (kind.startsWith("_")) {
                  buf += match[0];
                } else {
                  const cssClass = language.classNameAliases[kind] || kind;
                  emitKeyword(match[0], cssClass);
                }
              } else {
                buf += match[0];
              }
              lastIndex = top.keywordPatternRe.lastIndex;
              match = top.keywordPatternRe.exec(modeBuffer);
            }
            buf += modeBuffer.substring(lastIndex);
            emitter.addText(buf);
          }
          function processSubLanguage() {
            if (modeBuffer === "") return;
            let result2 = null;
            if (typeof top.subLanguage === "string") {
              if (!languages[top.subLanguage]) {
                emitter.addText(modeBuffer);
                return;
              }
              result2 = _highlight(top.subLanguage, modeBuffer, true, continuations[top.subLanguage]);
              continuations[top.subLanguage] = /** @type {CompiledMode} */
              result2._top;
            } else {
              result2 = highlightAuto(modeBuffer, top.subLanguage.length ? top.subLanguage : null);
            }
            if (top.relevance > 0) {
              relevance += result2.relevance;
            }
            emitter.__addSublanguage(result2._emitter, result2.language);
          }
          function processBuffer() {
            if (top.subLanguage != null) {
              processSubLanguage();
            } else {
              processKeywords();
            }
            modeBuffer = "";
          }
          function emitKeyword(keyword, scope) {
            if (keyword === "") return;
            emitter.startScope(scope);
            emitter.addText(keyword);
            emitter.endScope();
          }
          function emitMultiClass(scope, match) {
            let i = 1;
            const max = match.length - 1;
            while (i <= max) {
              if (!scope._emit[i]) {
                i++;
                continue;
              }
              const klass = language.classNameAliases[scope[i]] || scope[i];
              const text2 = match[i];
              if (klass) {
                emitKeyword(text2, klass);
              } else {
                modeBuffer = text2;
                processKeywords();
                modeBuffer = "";
              }
              i++;
            }
          }
          function startNewMode(mode, match) {
            if (mode.scope && typeof mode.scope === "string") {
              emitter.openNode(language.classNameAliases[mode.scope] || mode.scope);
            }
            if (mode.beginScope) {
              if (mode.beginScope._wrap) {
                emitKeyword(modeBuffer, language.classNameAliases[mode.beginScope._wrap] || mode.beginScope._wrap);
                modeBuffer = "";
              } else if (mode.beginScope._multi) {
                emitMultiClass(mode.beginScope, match);
                modeBuffer = "";
              }
            }
            top = Object.create(mode, { parent: { value: top } });
            return top;
          }
          function endOfMode(mode, match, matchPlusRemainder) {
            let matched = startsWith(mode.endRe, matchPlusRemainder);
            if (matched) {
              if (mode["on:end"]) {
                const resp = new Response(mode);
                mode["on:end"](match, resp);
                if (resp.isMatchIgnored) matched = false;
              }
              if (matched) {
                while (mode.endsParent && mode.parent) {
                  mode = mode.parent;
                }
                return mode;
              }
            }
            if (mode.endsWithParent) {
              return endOfMode(mode.parent, match, matchPlusRemainder);
            }
          }
          function doIgnore(lexeme) {
            if (top.matcher.regexIndex === 0) {
              modeBuffer += lexeme[0];
              return 1;
            } else {
              resumeScanAtSamePosition = true;
              return 0;
            }
          }
          function doBeginMatch(match) {
            const lexeme = match[0];
            const newMode = match.rule;
            const resp = new Response(newMode);
            const beforeCallbacks = [newMode.__beforeBegin, newMode["on:begin"]];
            for (const cb of beforeCallbacks) {
              if (!cb) continue;
              cb(match, resp);
              if (resp.isMatchIgnored) return doIgnore(lexeme);
            }
            if (newMode.skip) {
              modeBuffer += lexeme;
            } else {
              if (newMode.excludeBegin) {
                modeBuffer += lexeme;
              }
              processBuffer();
              if (!newMode.returnBegin && !newMode.excludeBegin) {
                modeBuffer = lexeme;
              }
            }
            startNewMode(newMode, match);
            return newMode.returnBegin ? 0 : lexeme.length;
          }
          function doEndMatch(match) {
            const lexeme = match[0];
            const matchPlusRemainder = codeToHighlight.substring(match.index);
            const endMode = endOfMode(top, match, matchPlusRemainder);
            if (!endMode) {
              return NO_MATCH;
            }
            const origin = top;
            if (top.endScope && top.endScope._wrap) {
              processBuffer();
              emitKeyword(lexeme, top.endScope._wrap);
            } else if (top.endScope && top.endScope._multi) {
              processBuffer();
              emitMultiClass(top.endScope, match);
            } else if (origin.skip) {
              modeBuffer += lexeme;
            } else {
              if (!(origin.returnEnd || origin.excludeEnd)) {
                modeBuffer += lexeme;
              }
              processBuffer();
              if (origin.excludeEnd) {
                modeBuffer = lexeme;
              }
            }
            do {
              if (top.scope) {
                emitter.closeNode();
              }
              if (!top.skip && !top.subLanguage) {
                relevance += top.relevance;
              }
              top = top.parent;
            } while (top !== endMode.parent);
            if (endMode.starts) {
              startNewMode(endMode.starts, match);
            }
            return origin.returnEnd ? 0 : lexeme.length;
          }
          function processContinuations() {
            const list = [];
            for (let current = top; current !== language; current = current.parent) {
              if (current.scope) {
                list.unshift(current.scope);
              }
            }
            list.forEach((item) => emitter.openNode(item));
          }
          let lastMatch = {};
          function processLexeme(textBeforeMatch, match) {
            const lexeme = match && match[0];
            modeBuffer += textBeforeMatch;
            if (lexeme == null) {
              processBuffer();
              return 0;
            }
            if (lastMatch.type === "begin" && match.type === "end" && lastMatch.index === match.index && lexeme === "") {
              modeBuffer += codeToHighlight.slice(match.index, match.index + 1);
              if (!SAFE_MODE) {
                const err = new Error(`0 width match regex (${languageName})`);
                err.languageName = languageName;
                err.badRule = lastMatch.rule;
                throw err;
              }
              return 1;
            }
            lastMatch = match;
            if (match.type === "begin") {
              return doBeginMatch(match);
            } else if (match.type === "illegal" && !ignoreIllegals) {
              const err = new Error('Illegal lexeme "' + lexeme + '" for mode "' + (top.scope || "<unnamed>") + '"');
              err.mode = top;
              throw err;
            } else if (match.type === "end") {
              const processed = doEndMatch(match);
              if (processed !== NO_MATCH) {
                return processed;
              }
            }
            if (match.type === "illegal" && lexeme === "") {
              if (match.index === codeToHighlight.length) ;
              else {
                modeBuffer += "\n";
              }
              return 1;
            }
            if (iterations > 1e5 && iterations > match.index * 3) {
              const err = new Error("potential infinite loop, way more iterations than matches");
              throw err;
            }
            modeBuffer += lexeme;
            return lexeme.length;
          }
          const language = getLanguage(languageName);
          if (!language) {
            error(LANGUAGE_NOT_FOUND.replace("{}", languageName));
            throw new Error('Unknown language: "' + languageName + '"');
          }
          const md = compileLanguage(language);
          let result = "";
          let top = continuation || md;
          const continuations = {};
          const emitter = new options.__emitter(options);
          processContinuations();
          let modeBuffer = "";
          let relevance = 0;
          let index = 0;
          let iterations = 0;
          let resumeScanAtSamePosition = false;
          try {
            if (!language.__emitTokens) {
              top.matcher.considerAll();
              for (; ; ) {
                iterations++;
                if (resumeScanAtSamePosition) {
                  resumeScanAtSamePosition = false;
                } else {
                  top.matcher.considerAll();
                }
                top.matcher.lastIndex = index;
                const match = top.matcher.exec(codeToHighlight);
                if (!match) break;
                const beforeMatch = codeToHighlight.substring(index, match.index);
                const processedCount = processLexeme(beforeMatch, match);
                index = match.index + processedCount;
              }
              processLexeme(codeToHighlight.substring(index));
            } else {
              language.__emitTokens(codeToHighlight, emitter);
            }
            emitter.finalize();
            result = emitter.toHTML();
            return {
              language: languageName,
              value: result,
              relevance,
              illegal: false,
              _emitter: emitter,
              _top: top
            };
          } catch (err) {
            if (err.message && err.message.includes("Illegal")) {
              return {
                language: languageName,
                value: escape(codeToHighlight),
                illegal: true,
                relevance: 0,
                _illegalBy: {
                  message: err.message,
                  index,
                  context: codeToHighlight.slice(index - 100, index + 100),
                  mode: err.mode,
                  resultSoFar: result
                },
                _emitter: emitter
              };
            } else if (SAFE_MODE) {
              return {
                language: languageName,
                value: escape(codeToHighlight),
                illegal: false,
                relevance: 0,
                errorRaised: err,
                _emitter: emitter,
                _top: top
              };
            } else {
              throw err;
            }
          }
        }
        function justTextHighlightResult(code) {
          const result = {
            value: escape(code),
            illegal: false,
            relevance: 0,
            _top: PLAINTEXT_LANGUAGE,
            _emitter: new options.__emitter(options)
          };
          result._emitter.addText(code);
          return result;
        }
        function highlightAuto(code, languageSubset) {
          languageSubset = languageSubset || options.languages || Object.keys(languages);
          const plaintext2 = justTextHighlightResult(code);
          const results = languageSubset.filter(getLanguage).filter(autoDetection).map(
            (name) => _highlight(name, code, false)
          );
          results.unshift(plaintext2);
          const sorted = results.sort((a, b3) => {
            if (a.relevance !== b3.relevance) return b3.relevance - a.relevance;
            if (a.language && b3.language) {
              if (getLanguage(a.language).supersetOf === b3.language) {
                return 1;
              } else if (getLanguage(b3.language).supersetOf === a.language) {
                return -1;
              }
            }
            return 0;
          });
          const [best, secondBest] = sorted;
          const result = best;
          result.secondBest = secondBest;
          return result;
        }
        function updateClassName(element, currentLang, resultLang) {
          const language = currentLang && aliases[currentLang] || resultLang;
          element.classList.add("hljs");
          element.classList.add(`language-${language}`);
        }
        function highlightElement(element) {
          let node = null;
          const language = blockLanguage(element);
          if (shouldNotHighlight(language)) return;
          fire(
            "before:highlightElement",
            { el: element, language }
          );
          if (element.dataset.highlighted) {
            console.log("Element previously highlighted. To highlight again, first unset `dataset.highlighted`.", element);
            return;
          }
          if (element.children.length > 0) {
            if (!options.ignoreUnescapedHTML) {
              console.warn("One of your code blocks includes unescaped HTML. This is a potentially serious security risk.");
              console.warn("https://github.com/highlightjs/highlight.js/wiki/security");
              console.warn("The element with unescaped HTML:");
              console.warn(element);
            }
            if (options.throwUnescapedHTML) {
              const err = new HTMLInjectionError(
                "One of your code blocks includes unescaped HTML.",
                element.innerHTML
              );
              throw err;
            }
          }
          node = element;
          const text2 = node.textContent;
          const result = language ? highlight2(text2, { language, ignoreIllegals: true }) : highlightAuto(text2);
          element.innerHTML = result.value;
          element.dataset.highlighted = "yes";
          updateClassName(element, language, result.language);
          element.result = {
            language: result.language,
            // TODO: remove with version 11.0
            re: result.relevance,
            relevance: result.relevance
          };
          if (result.secondBest) {
            element.secondBest = {
              language: result.secondBest.language,
              relevance: result.secondBest.relevance
            };
          }
          fire("after:highlightElement", { el: element, result, text: text2 });
        }
        function configure(userOptions) {
          options = inherit(options, userOptions);
        }
        const initHighlighting = () => {
          highlightAll();
          deprecated("10.6.0", "initHighlighting() deprecated.  Use highlightAll() now.");
        };
        function initHighlightingOnLoad() {
          highlightAll();
          deprecated("10.6.0", "initHighlightingOnLoad() deprecated.  Use highlightAll() now.");
        }
        let wantsHighlight = false;
        function highlightAll() {
          function boot() {
            highlightAll();
          }
          if (document.readyState === "loading") {
            if (!wantsHighlight) {
              window.addEventListener("DOMContentLoaded", boot, false);
            }
            wantsHighlight = true;
            return;
          }
          const blocks = document.querySelectorAll(options.cssSelector);
          blocks.forEach(highlightElement);
        }
        function registerLanguage(languageName, languageDefinition) {
          let lang = null;
          try {
            lang = languageDefinition(hljs2);
          } catch (error$1) {
            error("Language definition for '{}' could not be registered.".replace("{}", languageName));
            if (!SAFE_MODE) {
              throw error$1;
            } else {
              error(error$1);
            }
            lang = PLAINTEXT_LANGUAGE;
          }
          if (!lang.name) lang.name = languageName;
          languages[languageName] = lang;
          lang.rawDefinition = languageDefinition.bind(null, hljs2);
          if (lang.aliases) {
            registerAliases(lang.aliases, { languageName });
          }
        }
        function unregisterLanguage(languageName) {
          delete languages[languageName];
          for (const alias of Object.keys(aliases)) {
            if (aliases[alias] === languageName) {
              delete aliases[alias];
            }
          }
        }
        function listLanguages() {
          return Object.keys(languages);
        }
        function getLanguage(name) {
          name = (name || "").toLowerCase();
          return languages[name] || languages[aliases[name]];
        }
        function registerAliases(aliasList, { languageName }) {
          if (typeof aliasList === "string") {
            aliasList = [aliasList];
          }
          aliasList.forEach((alias) => {
            aliases[alias.toLowerCase()] = languageName;
          });
        }
        function autoDetection(name) {
          const lang = getLanguage(name);
          return lang && !lang.disableAutodetect;
        }
        function upgradePluginAPI(plugin) {
          if (plugin["before:highlightBlock"] && !plugin["before:highlightElement"]) {
            plugin["before:highlightElement"] = (data) => {
              plugin["before:highlightBlock"](
                Object.assign({ block: data.el }, data)
              );
            };
          }
          if (plugin["after:highlightBlock"] && !plugin["after:highlightElement"]) {
            plugin["after:highlightElement"] = (data) => {
              plugin["after:highlightBlock"](
                Object.assign({ block: data.el }, data)
              );
            };
          }
        }
        function addPlugin(plugin) {
          upgradePluginAPI(plugin);
          plugins.push(plugin);
        }
        function removePlugin(plugin) {
          const index = plugins.indexOf(plugin);
          if (index !== -1) {
            plugins.splice(index, 1);
          }
        }
        function fire(event, args) {
          const cb = event;
          plugins.forEach(function(plugin) {
            if (plugin[cb]) {
              plugin[cb](args);
            }
          });
        }
        function deprecateHighlightBlock(el) {
          deprecated("10.7.0", "highlightBlock will be removed entirely in v12.0");
          deprecated("10.7.0", "Please use highlightElement now.");
          return highlightElement(el);
        }
        Object.assign(hljs2, {
          highlight: highlight2,
          highlightAuto,
          highlightAll,
          highlightElement,
          // TODO: Remove with v12 API
          highlightBlock: deprecateHighlightBlock,
          configure,
          initHighlighting,
          initHighlightingOnLoad,
          registerLanguage,
          unregisterLanguage,
          listLanguages,
          getLanguage,
          registerAliases,
          autoDetection,
          inherit,
          addPlugin,
          removePlugin
        });
        hljs2.debugMode = function() {
          SAFE_MODE = false;
        };
        hljs2.safeMode = function() {
          SAFE_MODE = true;
        };
        hljs2.versionString = version;
        hljs2.regex = {
          concat: concat2,
          lookahead: lookahead2,
          either: either2,
          optional,
          anyNumberOfTimes
        };
        for (const key in MODES2) {
          if (typeof MODES2[key] === "object") {
            deepFreeze(MODES2[key]);
          }
        }
        Object.assign(hljs2, MODES2);
        return hljs2;
      };
      var highlight = HLJS({});
      highlight.newInstance = () => HLJS({});
      module.exports = highlight;
      highlight.HighlightJS = highlight;
      highlight.default = highlight;
    }
  });

  // node_modules/marked/lib/marked.esm.js
  function C() {
    return { async: false, breaks: false, extensions: null, gfm: true, hooks: null, pedantic: false, renderer: null, silent: false, tokenizer: null, walkTokens: null };
  }
  var R = C();
  function j(l3) {
    R = l3;
  }
  var z = { exec: () => null };
  function A(l3) {
    let e = [];
    return (t) => {
      let n = Math.max(0, Math.min(3, t - 1)), s = e[n];
      return s || (s = l3(n), e[n] = s), s;
    };
  }
  function k(l3, e = "") {
    let t = typeof l3 == "string" ? l3 : l3.source, n = { replace: (s, r) => {
      let i = typeof r == "string" ? r : r.source;
      return i = i.replace(m.caret, "$1"), t = t.replace(s, i), n;
    }, getRegex: () => new RegExp(t, e) };
    return n;
  }
  var Te = ((l3 = "") => {
    try {
      return !!new RegExp("(?<=1)(?<!1)" + l3);
    } catch {
      return false;
    }
  })();
  var m = { codeRemoveIndent: /^(?: {1,4}| {0,3}\t)/gm, outputLinkReplace: /\\([\[\]])/g, indentCodeCompensation: /^(\s+)(?:```)/, beginningSpace: /^\s+/, endingHash: /#$/, startingSpaceChar: /^ /, endingSpaceChar: / $/, nonSpaceChar: /[^ ]/, newLineCharGlobal: /\n/g, tabCharGlobal: /\t/g, multipleSpaceGlobal: /\s+/g, blankLine: /^[ \t]*$/, doubleBlankLine: /\n[ \t]*\n[ \t]*$/, blockquoteStart: /^ {0,3}>/, blockquoteSetextReplace: /\n {0,3}((?:=+|-+) *)(?=\n|$)/g, blockquoteSetextReplace2: /^ {0,3}>[ \t]?/gm, listReplaceNesting: /^ {1,4}(?=( {4})*[^ ])/g, listIsTask: /^\[[ xX]\] +\S/, listReplaceTask: /^\[[ xX]\] +/, listTaskCheckbox: /\[[ xX]\]/, anyLine: /\n.*\n/, hrefBrackets: /^<(.*)>$/, tableDelimiter: /[:|]/, tableAlignChars: /^\||\| *$/g, tableRowBlankLine: /\n[ \t]*$/, tableAlignRight: /^ *-+: *$/, tableAlignCenter: /^ *:-+: *$/, tableAlignLeft: /^ *:-+ *$/, startATag: /^<a /i, endATag: /^<\/a>/i, startPreScriptTag: /^<(pre|code|kbd|script)(\s|>)/i, endPreScriptTag: /^<\/(pre|code|kbd|script)(\s|>)/i, startAngleBracket: /^</, endAngleBracket: />$/, pedanticHrefTitle: /^([^'"]*[^\s])\s+(['"])(.*)\2/, unicodeAlphaNumeric: /[\p{L}\p{N}]/u, escapeTest: /[&<>"']/, escapeReplace: /[&<>"']/g, escapeTestNoEncode: /[<>"']|&(?!(#\d{1,7}|#[Xx][a-fA-F0-9]{1,6}|\w+);)/, escapeReplaceNoEncode: /[<>"']|&(?!(#\d{1,7}|#[Xx][a-fA-F0-9]{1,6}|\w+);)/g, caret: /(^|[^\[])\^/g, percentDecode: /%25/g, findPipe: /\|/g, splitPipe: / \|/, slashPipe: /\\\|/g, carriageReturn: /\r\n|\r/g, spaceLine: /^ +$/gm, notSpaceStart: /^\S*/, endingNewline: /\n$/, listItemRegex: (l3) => new RegExp(`^( {0,3}${l3})((?:[	 ][^\\n]*)?(?:\\n|$))`), nextBulletRegex: A((l3) => new RegExp(`^ {0,${l3}}(?:[*+-]|\\d{1,9}[.)])((?:[ 	][^\\n]*)?(?:\\n|$))`)), hrRegex: A((l3) => new RegExp(`^ {0,${l3}}((?:- *){3,}|(?:_ *){3,}|(?:\\* *){3,})(?:\\n+|$)`)), fencesBeginRegex: A((l3) => new RegExp(`^ {0,${l3}}(?:\`\`\`|~~~)`)), headingBeginRegex: A((l3) => new RegExp(`^ {0,${l3}}#`)), htmlBeginRegex: A((l3) => new RegExp(`^ {0,${l3}}<(?:[a-z].*>|!--)`, "i")), blockquoteBeginRegex: A((l3) => new RegExp(`^ {0,${l3}}>`)) };
  var Oe = /^(?:[ \t]*(?:\n|$))+/;
  var we = /^((?: {4}| {0,3}\t)[^\n]+(?:\n(?:[ \t]*(?:\n|$))*)?)+/;
  var ye = /^ {0,3}(`{3,}(?=[^`\n]*(?:\n|$))|~{3,})([^\n]*)(?:\n|$)(?:|([\s\S]*?)(?:\n|$))(?: {0,3}\1[~`]* *(?=\n|$)|$)/;
  var q = /^ {0,3}((?:-[\t ]*){3,}|(?:_[ \t]*){3,}|(?:\*[ \t]*){3,})(?:\n+|$)/;
  var Pe = /^ {0,3}(#{1,6})(?=\s|$)(.*)(?:\n+|$)/;
  var U = / {0,3}(?:[*+-]|\d{1,9}[.)])/;
  var oe = /^(?!bull |blockCode|fences|blockquote|heading|html|table)((?:.|\n(?!\s*?\n|bull |blockCode|fences|blockquote|heading|html|table))+?)\n {0,3}(=+|-+) *(?:\n+|$)/;
  var ae = k(oe).replace(/bull/g, U).replace(/blockCode/g, /(?: {4}| {0,3}\t)/).replace(/fences/g, / {0,3}(?:`{3,}|~{3,})/).replace(/blockquote/g, / {0,3}>/).replace(/heading/g, / {0,3}#{1,6}(?:\s|$)/).replace(/html/g, / {0,3}<[^\n>]+>\n/).replace(/\|table/g, "").getRegex();
  var Se = k(oe).replace(/bull/g, U).replace(/blockCode/g, /(?: {4}| {0,3}\t)/).replace(/fences/g, / {0,3}(?:`{3,}|~{3,})/).replace(/blockquote/g, / {0,3}>/).replace(/heading/g, / {0,3}#{1,6}(?:\s|$)/).replace(/html/g, / {0,3}<[^\n>]+>\n/).replace(/table/g, / {0,3}\|?(?:[:\- ]*\|)+[\:\- ]*\n/).getRegex();
  var K = /^([^\n]+(?:\n(?!hr|heading|lheading|blockquote|fences|list|html|table|[ \t]+\n)[^\n]+)*)/;
  var _e = /^[^\n]+/;
  var W = /(?!\s*\])(?:\\[\s\S]|[^\[\]\\])+/;
  var $e = k(/^ {0,3}\[(label)\]: *(?:\n[ \t]*)?([^<\s][^\s]*|<.*?>)(?:(?: +(?:\n[ \t]*)?| *\n[ \t]*)(title))? *(?:\n+|$)/).replace("label", W).replace("title", /(?:"(?:\\"?|[^"\\])*"|'[^'\n]*(?:\n[^'\n]+)*\n?'|\([^()]*\))/).getRegex();
  var Le = k(/^(bull)([ \t][^\n]*?)?(?:\n|$)/).replace(/bull/g, U).getRegex();
  var Q = "address|article|aside|base|basefont|blockquote|body|caption|center|col|colgroup|dd|details|dialog|dir|div|dl|dt|fieldset|figcaption|figure|footer|form|frame|frameset|h[1-6]|head|header|hr|html|iframe|legend|li|link|main|menu|menuitem|meta|nav|noframes|ol|optgroup|option|p|param|search|section|summary|table|tbody|td|tfoot|th|thead|title|tr|track|ul";
  var X = /<!--(?:-?>|[\s\S]*?(?:-->|$))/;
  var Me = k("^ {0,3}(?:<(script|pre|style|textarea)[\\s>][\\s\\S]*?(?:</\\1>[^\\n]*\\n*|$)|comment[^\\n]*(\\n+|$)|<\\?[\\s\\S]*?(?:\\?>[^\\n]*\\n*|$)|<![A-Z][\\s\\S]*?(?:>[^\\n]*\\n*|$)|<!\\[CDATA\\[[\\s\\S]*?(?:\\]\\]>[^\\n]*\\n*|$)|</?(tag)(?: +|\\n|/?>)[\\s\\S]*?(?:(?:\\n[ 	]*)+\\n|$)|<(?!script|pre|style|textarea)([a-z][\\w-]*)(?:attribute)*? */?>(?=[ \\t]*(?:\\n|$))[\\s\\S]*?(?:(?:\\n[ 	]*)+\\n|$)|</(?!script|pre|style|textarea)[a-z][\\w-]*\\s*>(?=[ \\t]*(?:\\n|$))[\\s\\S]*?(?:(?:\\n[ 	]*)+\\n|$))", "i").replace("comment", X).replace("tag", Q).replace("attribute", / +[a-zA-Z:_][\w.:-]*(?: *= *"[^"\n]*"| *= *'[^'\n]*'| *= *[^\s"'=<>`]+)?/).getRegex();
  var le = (l3) => k(K).replace("hr", q).replace("heading", " {0,3}#{1,6}(?:\\s|$)").replace("|lheading", "").replace("|table", "").replace("blockquote", " {0,3}>").replace("fences", " {0,3}(?:`{3,}(?=[^`\\n]*\\n)|~~~)[^\\n]*\\n").replace("list", l3).replace("html", "</?(?:tag)(?: +|\\n|/?>)|<(?:script|pre|style|textarea|!--)").replace("tag", Q).getRegex();
  var ze = le(/ {0,3}(?:[*+-]|1[.)])[ \t]+[^ \t\n]/);
  var Ee = le(/ {0,3}(?:[*+-]|\d{1,9}[.)])(?:[ \t]|\n|$)/);
  var Ce = k(/^( {0,3}> ?(paragraph|[^\n]*)(?:\n|$))+/).replace("paragraph", Ee).getRegex();
  var J = { blockquote: Ce, code: we, def: $e, fences: ye, heading: Pe, hr: q, html: Me, lheading: ae, list: Le, newline: Oe, paragraph: ze, table: z, text: _e };
  var se = k("^ *([^\\n ].*)\\n {0,3}((?:\\| *)?:?-+:? *(?:\\| *:?-+:? *)*(?:\\| *)?)(?:\\n((?:(?! *\\n|hr|heading|blockquote|code|fences|list|html).*(?:\\n|$))*)\\n*|$)").replace("hr", q).replace("heading", " {0,3}#{1,6}(?:\\s|$)").replace("blockquote", " {0,3}>").replace("code", "(?: {4}| {0,3}	)[^\\n]").replace("fences", " {0,3}(?:`{3,}(?=[^`\\n]*\\n)|~~~)[^\\n]*\\n").replace("list", " {0,3}(?:[*+-]|1[.)])[ \\t]").replace("html", "</?(?:tag)(?: +|\\n|/?>)|<(?:script|pre|style|textarea|!--)").replace("tag", Q).getRegex();
  var Ae = { ...J, lheading: Se, table: se, paragraph: k(K).replace("hr", q).replace("heading", " {0,3}#{1,6}(?:\\s|$)").replace("|lheading", "").replace("table", se).replace("blockquote", " {0,3}>").replace("fences", " {0,3}(?:`{3,}(?=[^`\\n]*\\n)|~~~)[^\\n]*\\n").replace("list", " {0,3}(?:[*+-]|1[.)])[ \\t]+[^ \\t\\n]").replace("html", "</?(?:tag)(?: +|\\n|/?>)|<(?:script|pre|style|textarea|!--)").replace("tag", Q).getRegex() };
  var Ie = { ...J, html: k(`^ *(?:comment *(?:\\n|\\s*$)|<(tag)[\\s\\S]+?</\\1> *(?:\\n{2,}|\\s*$)|<tag(?:"[^"]*"|'[^']*'|\\s[^'"/>\\s]*)*?/?> *(?:\\n{2,}|\\s*$))`).replace("comment", X).replace(/tag/g, "(?!(?:a|em|strong|small|s|cite|q|dfn|abbr|data|time|code|var|samp|kbd|sub|sup|i|b|u|mark|ruby|rt|rp|bdi|bdo|span|br|wbr|ins|del|img)\\b)\\w+(?!:|[^\\w\\s@]*@)\\b").getRegex(), def: /^ *\[([^\]]+)\]: *<?([^\s>]+)>?(?: +(["(][^\n]+[")]))? *(?:\n+|$)/, heading: /^(#{1,6})(.*)(?:\n+|$)/, fences: z, lheading: /^(.+?)\n {0,3}(=+|-+) *(?:\n+|$)/, paragraph: k(K).replace("hr", q).replace("heading", ` *#{1,6} *[^
]`).replace("lheading", ae).replace("|table", "").replace("blockquote", " {0,3}>").replace("|fences", "").replace("|list", "").replace("|html", "").replace("|tag", "").getRegex() };
  var Be = /^\\([!"#$%&'()*+,\-./:;<=>?@\[\]\\^_`{|}~])/;
  var De = /^(`+)([^`]|[^`][\s\S]*?[^`])\1(?!`)/;
  var pe = /^( {2,}|\\)\n(?!\s*$)/;
  var qe = /^(`+|[^`])(?:(?= {2,}\n)|[\s\S]*?(?:(?=[\\<!\[`*_]|\b_|$)|[^ ](?= {2,}\n)))/;
  var _ = /[\p{P}\p{S}]/u;
  var I = /[\s\p{P}\p{S}]/u;
  var v = /[^\s\p{P}\p{S}]/u;
  var ve = k(/^((?![*_])punctSpace)/, "u").replace(/punctSpace/g, I).getRegex();
  var He = /[\p{Pi}\p{Ps}"']/u;
  var ue = /(?!~)[\p{P}\p{S}]/u;
  var Ze = /(?!~)[\s\p{P}\p{S}]/u;
  var Ge = /(?:[^\s\p{P}\p{S}]|~)/u;
  var Qe = k(/link|precode-code|html/, "g").replace("link", /\[(?:[^\[\]`]|(?<a>`+)[^`]+\k<a>(?!`))*?\]\((?:\\[\s\S]|[^\\\(\)]|\((?:\\[\s\S]|[^\\\(\)])*\))*\)/).replace("precode-", Te ? "(?<!`)()" : "(^^|[^`])").replace("code", /(?<b>`+)[^`]+\k<b>(?!`)/).replace("html", /<(?! )[^<>]*?>/).getRegex();
  var ce = /^(?:\*+(?:((?!\*)punct)|([^\s*]))?)|^_+(?:((?!_)punct)|([^\s_]))?/;
  var Ne = k(ce, "u").replace(/punct/g, _).getRegex();
  var je = k(ce, "u").replace(/punct/g, ue).getRegex();
  var Fe = /^(?:\*+(?:((?!\*)(?!openQuote)punct)|([^\s*]))?)|^_+(?:((?!_)(?!openQuote)punct)|([^\s_]))?/;
  var Ue = k(Fe, "u").replace(/openQuote/g, He).replace(/punct/g, _).getRegex();
  var he = "^[^_*]*?__[^_*]*?\\*[^_*]*?(?=__)|[^*]+(?=[^*])|(?!\\*)punct(\\*+)(?=[\\s]|$)|notPunctSpace(\\*+)(?!\\*)(?=punctSpace|$)|(?!\\*)punctSpace(\\*+)(?=notPunctSpace)|[\\s](\\*+)(?!\\*)(?=punct)|(?!\\*)punct(\\*+)(?!\\*)(?=punct)|notPunctSpace(\\*+)(?=notPunctSpace)";
  var Ke = k(he, "gu").replace(/notPunctSpace/g, v).replace(/punctSpace/g, I).replace(/punct/g, _).getRegex();
  var We = k(he, "gu").replace(/notPunctSpace/g, Ge).replace(/punctSpace/g, Ze).replace(/punct/g, ue).getRegex();
  var Xe = "^[^_*]*?__[^_*]*?\\*[^_*]*?(?=__)|[^*]+(?=[^*])|(?!\\*)punct(\\*+)(?=[\\s]|$)|notPunctSpace(\\*+)(?!\\*)(?=punctSpace|$)|(?!\\*)[\\s](\\*+)(?=notPunctSpace)|[\\s](\\*+)(?!\\*)(?=punct)|(?!\\*)punct(\\*+)(?!\\*)(?=punct)|(?:(?!\\*)punct|notPunctSpace)(\\*+)(?!\\*)(?=notPunctSpace)";
  var Je = k(Xe, "gu").replace(/notPunctSpace/g, v).replace(/punctSpace/g, I).replace(/punct/g, _).getRegex();
  var Ve = k("^[^_*]*?\\*\\*[^_*]*?_[^_*]*?(?=\\*\\*)|[^_]+(?=[^_])|(?!_)punct(_+)(?=[\\s]|$)|notPunctSpace(_+)(?!_)(?=punctSpace|$)|(?!_)punctSpace(_+)(?=notPunctSpace)|[\\s](_+)(?!_)(?=punct)|(?!_)punct(_+)(?!_)(?=punct)", "gu").replace(/notPunctSpace/g, v).replace(/punctSpace/g, I).replace(/punct/g, _).getRegex();
  var Ye = "^[^_*]*?\\*\\*[^_*]*?_[^_*]*?(?=\\*\\*)|[^_]+(?=[^_])|(?!_)punct(_+)(?=[\\s]|$)|notPunctSpace(_+)(?!_)(?=punctSpace|$)|(?!_)[\\s](_+)(?=notPunctSpace)|[\\s](_+)(?!_)(?=punct)|(?!_)punct(_+)(?!_)(?=punct)|(?:(?!_)punct|notPunctSpace)(_+)(?!_)(?=notPunctSpace)";
  var et = k(Ye, "gu").replace(/notPunctSpace/g, v).replace(/punctSpace/g, I).replace(/punct/g, _).getRegex();
  var tt = k(/^~~?(?:((?!~)punct)|[^\s~])/, "u").replace(/punct/g, _).getRegex();
  var nt = "^[^~]+(?=[^~])|(?!~)punct(~~?)(?=[\\s]|$)|notPunctSpace(~~?)(?!~)(?=punctSpace|$)|(?!~)punctSpace(~~?)(?=notPunctSpace)|[\\s](~~?)(?!~)(?=punct)|(?!~)punct(~~?)(?!~)(?=punct)|notPunctSpace(~~?)(?=notPunctSpace)";
  var rt = k(nt, "gu").replace(/notPunctSpace/g, v).replace(/punctSpace/g, I).replace(/punct/g, _).getRegex();
  var st = k(/\\(punct)/, "gu").replace(/punct/g, _).getRegex();
  var it = k(/^<(scheme:[^\s\x00-\x1f<>]*|email)>/).replace("scheme", /[a-zA-Z][a-zA-Z0-9+.-]{1,31}/).replace("email", /[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+(@)[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+(?![-_])/).getRegex();
  var ot = k(X).replace("(?:-->|$)", "-->").getRegex();
  var at = k("^comment|^</[a-zA-Z][\\w:-]*\\s*>|^<[a-zA-Z][\\w-]*(?:attribute)*?\\s*/?>|^<\\?[\\s\\S]*?\\?>|^<![a-zA-Z]+\\s[\\s\\S]*?>|^<!\\[CDATA\\[[\\s\\S]*?\\]\\]>").replace("comment", ot).replace("attribute", /\s+[a-zA-Z:_][\w.:-]*(?:\s*=\s*"[^"]*"|\s*=\s*'[^']*'|\s*=\s*[^\s"'=<>`]+)?/).getRegex();
  var G = /(?:\[(?:\\[\s\S]|[^\[\]\\])*\]|\\[\s\S]|`+(?!`)[^`]*?`+(?!`)|``+(?=\])|[^\[\]\\`])*?/;
  var lt = k(/^!?\[(label)\]\(\s*(href)(?:(?:[ \t]+(?:\n[ \t]*)?|\n[ \t]*)(title))?\s*\)/).replace("label", G).replace("href", /<(?:\\.|[^\n<>\\])+>|[^ \t\n\x00-\x1f]+|(?=\))/).replace("title", /"(?:\\"?|[^"\\])*"|'(?:\\'?|[^'\\])*'|\((?:\\\)?|[^)\\])*\)/).getRegex();
  var de = k(/^!?\[(label)\]\[(ref)\]/).replace("label", G).replace("ref", W).getRegex();
  var ke = k(/^!?\[(ref)\](?:\[\])?/).replace("ref", W).getRegex();
  var pt = k("reflink|nolink(?!\\()", "g").replace("reflink", de).replace("nolink", ke).getRegex();
  var ie = /[hH][tT][tT][pP][sS]?|[fF][tT][pP]/;
  var V = { _backpedal: z, anyPunctuation: st, autolink: it, blockSkip: Qe, br: pe, code: De, del: z, delLDelim: z, delRDelim: z, emStrongLDelim: Ne, emStrongRDelimAst: Ke, emStrongRDelimUnd: Ve, escape: Be, link: lt, nolink: ke, punctuation: ve, reflink: de, reflinkSearch: pt, tag: at, text: qe, url: z };
  var ut = { ...V, emStrongLDelim: Ue, emStrongRDelimAst: Je, emStrongRDelimUnd: et, link: k(/^!?\[(label)\]\((.*?)\)/).replace("label", G).getRegex(), reflink: k(/^!?\[(label)\]\s*\[([^\]]*)\]/).replace("label", G).getRegex() };
  var F = { ...V, emStrongRDelimAst: We, emStrongLDelim: je, delLDelim: tt, delRDelim: rt, url: k(/^((?:protocol):\/\/|www\.)(?:[a-zA-Z0-9\-]+\.?)+[^\s<]*|^email/).replace("protocol", ie).replace("email", /[A-Za-z0-9._+-]+(@)[a-zA-Z0-9-_]+(?:\.[a-zA-Z0-9-_]*[a-zA-Z0-9])+(?![-_])/).getRegex(), _backpedal: /(?:[^?!.,:;*_'"~()&]+|\([^)]*\)|&(?![a-zA-Z0-9]+;$)|[?!.,:;*_'"~)]+(?!$))+/, del: /^(~~?)(?=[^\s~])((?:\\[\s\S]|[^\\])*?(?:\\[\s\S]|[^\s~\\]))\1(?=[^~]|$)/, text: k(/^(`+|~+|[^`~])(?:(?=[`~])|(?= {2,}\n)|(?=[a-zA-Z0-9.!#$%&'*+\/=?_`{\|}~-]+@)|[\s\S]*?(?:(?=[\\<!\[`*~_]|\b_|protocol:\/\/|www\.|$)|[^ ](?= {2,}\n)|[^a-zA-Z0-9.!#$%&'*+\/=?_`{\|}~-](?=[a-zA-Z0-9.!#$%&'*+\/=?_`{\|}~-]+@)))/).replace("protocol", ie).getRegex() };
  var ct = { ...F, br: k(pe).replace("{2,}", "*").getRegex(), text: k(F.text).replace("\\b_", "\\b_| {2,}\\n").replace(/\{2,\}/g, "*").getRegex() };
  var H2 = { normal: J, gfm: Ae, pedantic: Ie };
  var B = { normal: V, gfm: F, breaks: ct, pedantic: ut };
  var ht = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" };
  var ge = (l3) => ht[l3];
  function O(l3, e) {
    if (e) {
      if (m.escapeTest.test(l3)) return l3.replace(m.escapeReplace, ge);
    } else if (m.escapeTestNoEncode.test(l3)) return l3.replace(m.escapeReplaceNoEncode, ge);
    return l3;
  }
  function Y(l3) {
    try {
      l3 = encodeURI(l3).replace(m.percentDecode, "%");
    } catch {
      return null;
    }
    return l3;
  }
  function ee(l3, e) {
    let t = l3.replace(m.findPipe, (r, i, o) => {
      let p2 = false, a = i;
      for (; --a >= 0 && o[a] === "\\"; ) p2 = !p2;
      return p2 ? "|" : " |";
    }), n = t.split(m.splitPipe), s = 0;
    if (n[0].trim() || n.shift(), n.length > 0 && !n.at(-1)?.trim() && n.pop(), e) if (n.length > e) n.splice(e);
    else for (; n.length < e; ) n.push("");
    for (; s < n.length; s++) n[s] = n[s].trim().replace(m.slashPipe, "|");
    return n;
  }
  function $(l3, e, t) {
    let n = l3.length;
    if (n === 0) return "";
    let s = 0;
    for (; s < n; ) {
      let r = l3.charAt(n - s - 1);
      if (r === e && !t) s++;
      else if (r !== e && t) s++;
      else break;
    }
    return l3.slice(0, n - s);
  }
  function te(l3) {
    let e = l3.split(`
`), t = e.length - 1;
    for (; t >= 0 && m.blankLine.test(e[t]); ) t--;
    return e.length - t <= 2 ? l3 : e.slice(0, t + 1).join(`
`);
  }
  function fe(l3, e) {
    if (l3.indexOf(e[1]) === -1) return -1;
    let t = 0;
    for (let n = 0; n < l3.length; n++) if (l3[n] === "\\") n++;
    else if (l3[n] === e[0]) t++;
    else if (l3[n] === e[1] && (t--, t < 0)) return n;
    return t > 0 ? -2 : -1;
  }
  function me(l3, e = 0) {
    let t = e, n = "";
    for (let s of l3) if (s === "	") {
      let r = 4 - t % 4;
      n += " ".repeat(r), t += r;
    } else n += s, t++;
    return n;
  }
  function xe(l3, e, t, n, s) {
    let r = e.href, i = e.title || null, o = l3[1].replace(s.other.outputLinkReplace, "$1");
    n.state.inLink = true;
    let p2 = { type: l3[0].charAt(0) === "!" ? "image" : "link", raw: t, href: r, title: i, text: o, tokens: n.inlineTokens(o) };
    return n.state.inLink = false, p2;
  }
  function dt(l3, e, t) {
    let n = l3.match(t.other.indentCodeCompensation);
    if (n === null) return e;
    let s = n[1];
    return e.split(`
`).map((r) => {
      let i = r.match(t.other.beginningSpace);
      if (i === null) return r;
      let [o] = i;
      return o.length >= s.length ? r.slice(s.length) : r;
    }).join(`
`);
  }
  var y = class {
    options;
    rules;
    lexer;
    constructor(e) {
      this.options = e || R;
    }
    space(e) {
      let t = this.rules.block.newline.exec(e);
      if (t && t[0].length > 0) return { type: "space", raw: t[0] };
    }
    code(e) {
      let t = this.rules.block.code.exec(e);
      if (t) {
        let n = this.options.pedantic ? t[0] : te(t[0]), s = n.replace(this.rules.other.codeRemoveIndent, "");
        return { type: "code", raw: n, codeBlockStyle: "indented", text: s };
      }
    }
    fences(e) {
      let t = this.rules.block.fences.exec(e);
      if (t) {
        let n = t[0], s = dt(n, t[3] || "", this.rules);
        return { type: "code", raw: n, lang: t[2] ? t[2].trim().replace(this.rules.inline.anyPunctuation, "$1") : t[2], text: s };
      }
    }
    heading(e) {
      let t = this.rules.block.heading.exec(e);
      if (t) {
        let n = t[2].trim();
        if (this.rules.other.endingHash.test(n)) {
          let s = $(n, "#");
          (this.options.pedantic || !s || this.rules.other.endingSpaceChar.test(s)) && (n = s.trim());
        }
        return { type: "heading", raw: $(t[0], `
`), depth: t[1].length, text: n, tokens: this.lexer.inline(n) };
      }
    }
    hr(e) {
      let t = this.rules.block.hr.exec(e);
      if (t) return { type: "hr", raw: $(t[0], `
`) };
    }
    blockquote(e) {
      let t = this.rules.block.blockquote.exec(e);
      if (t) {
        let n = $(t[0], `
`).split(`
`), s = "", r = "", i = [];
        for (; n.length > 0; ) {
          let o = false, p2 = [], a;
          for (a = 0; a < n.length; a++) if (this.rules.other.blockquoteStart.test(n[a])) p2.push(n[a]), o = true;
          else if (!o) p2.push(n[a]);
          else break;
          n = n.slice(a);
          let u2 = p2.join(`
`), c3 = u2.replace(this.rules.other.blockquoteSetextReplace, `
    $1`).replace(this.rules.other.blockquoteSetextReplace2, "");
          s = s ? `${s}
${u2}` : u2, r = r ? `${r}
${c3}` : c3;
          let h2 = this.lexer.state.top;
          if (this.lexer.state.top = true, this.lexer.blockTokens(c3, i, true), this.lexer.state.top = h2, n.length === 0) break;
          let d2 = i.at(-1);
          if (d2?.type === "code") break;
          if (d2?.type === "blockquote") {
            let T2 = d2, g2 = n.join(`
`), w2 = T2.raw + `
` + g2.replace(this.rules.other.blockquoteSetextReplace2, ""), M2 = this.blockquote(w2);
            i[i.length - 1] = M2, s = `${s}
${g2}`, r = r.substring(0, r.length - T2.text.length) + M2.text;
            break;
          } else if (d2?.type === "list") {
            let T2 = d2, g2 = T2.raw + `
` + n.join(`
`), w2 = this.list(g2);
            i[i.length - 1] = w2, s = s.substring(0, s.length - d2.raw.length) + w2.raw, r = r.substring(0, r.length - T2.raw.length) + w2.raw, n = g2.substring(i.at(-1).raw.length).split(`
`);
            continue;
          }
        }
        return { type: "blockquote", raw: s, tokens: i, text: r };
      }
    }
    list(e) {
      let t = this.rules.block.list.exec(e);
      if (t) {
        let n = t[1].trim(), s = n.length > 1, r = { type: "list", raw: "", ordered: s, start: s ? +n.slice(0, -1) : "", loose: false, items: [] };
        n = s ? `\\d{1,9}\\${n.slice(-1)}` : `\\${n}`, this.options.pedantic && (n = s ? n : "[*+-]");
        let i = this.rules.other.listItemRegex(n), o = false;
        for (; e; ) {
          let a = false, u2 = "", c3 = "";
          if (!(t = i.exec(e)) || this.rules.block.hr.test(e)) break;
          u2 = t[0], e = e.substring(u2.length);
          let h2 = me(t[2].split(`
`, 1)[0], t[1].length), d2 = e.split(`
`, 1)[0], T2 = !h2.trim(), g2 = 0;
          if (this.options.pedantic ? (g2 = 2, c3 = h2.trimStart()) : T2 ? g2 = t[1].length + 1 : (g2 = h2.search(this.rules.other.nonSpaceChar), g2 = g2 > 4 ? 1 : g2, c3 = h2.slice(g2), g2 += t[1].length), T2 && this.rules.other.blankLine.test(d2) && (u2 += d2 + `
`, e = e.substring(d2.length + 1), a = true), !a) {
            let w2 = this.rules.other.nextBulletRegex(g2), M2 = this.rules.other.hrRegex(g2), ne2 = this.rules.other.fencesBeginRegex(g2), re = this.rules.other.headingBeginRegex(g2), be = this.rules.other.htmlBeginRegex(g2), Re = this.rules.other.blockquoteBeginRegex(g2);
            for (; e; ) {
              let N2 = e.split(`
`, 1)[0], D2;
              if (d2 = N2, this.options.pedantic ? (d2 = d2.replace(this.rules.other.listReplaceNesting, "  "), D2 = d2) : D2 = d2.replace(this.rules.other.tabCharGlobal, "    "), ne2.test(d2) || re.test(d2) || be.test(d2) || Re.test(d2) || w2.test(d2) || M2.test(d2)) break;
              if (D2.search(this.rules.other.nonSpaceChar) >= g2 || !d2.trim()) c3 += `
` + D2.slice(g2);
              else {
                if (T2 || h2.replace(this.rules.other.tabCharGlobal, "    ").search(this.rules.other.nonSpaceChar) >= 4 || ne2.test(h2) || re.test(h2) || M2.test(h2)) break;
                c3 += `
` + d2;
              }
              T2 = !d2.trim(), u2 += N2 + `
`, e = e.substring(N2.length + 1), h2 = D2.slice(g2);
            }
          }
          r.loose || (o ? r.loose = true : this.rules.other.doubleBlankLine.test(u2) && (o = true)), r.items.push({ type: "list_item", raw: u2, task: !!this.options.gfm && this.rules.other.listIsTask.test(c3), loose: false, text: c3, tokens: [] }), r.raw += u2;
        }
        let p2 = r.items.at(-1);
        if (p2) p2.raw = p2.raw.trimEnd(), p2.text = p2.text.trimEnd();
        else return;
        r.raw = r.raw.trimEnd();
        for (let a of r.items) {
          this.lexer.state.top = false, a.tokens = this.lexer.blockTokens(a.text, []);
          let u2 = a.tokens[0];
          if (a.task && (u2?.type === "text" || u2?.type === "paragraph")) {
            a.text = a.text.replace(this.rules.other.listReplaceTask, ""), u2.raw = u2.raw.replace(this.rules.other.listReplaceTask, ""), u2.text = u2.text.replace(this.rules.other.listReplaceTask, "");
            for (let h2 = this.lexer.inlineQueue.length - 1; h2 >= 0; h2--) if (this.rules.other.listIsTask.test(this.lexer.inlineQueue[h2].src)) {
              this.lexer.inlineQueue[h2].src = this.lexer.inlineQueue[h2].src.replace(this.rules.other.listReplaceTask, "");
              break;
            }
            let c3 = this.rules.other.listTaskCheckbox.exec(a.raw);
            if (c3) {
              let h2 = { type: "checkbox", raw: c3[0] + " ", checked: c3[0] !== "[ ]" };
              a.checked = h2.checked, r.loose ? a.tokens[0] && ["paragraph", "text"].includes(a.tokens[0].type) && "tokens" in a.tokens[0] && a.tokens[0].tokens ? (a.tokens[0].raw = h2.raw + a.tokens[0].raw, a.tokens[0].text = h2.raw + a.tokens[0].text, a.tokens[0].tokens.unshift(h2)) : a.tokens.unshift({ type: "paragraph", raw: h2.raw, text: h2.raw, tokens: [h2] }) : a.tokens.unshift(h2);
            }
          } else a.task && (a.task = false);
          if (!r.loose) {
            let c3 = a.tokens.filter((d2) => d2.type === "space"), h2 = c3.length > 0 && c3.some((d2) => this.rules.other.anyLine.test(d2.raw));
            r.loose = h2;
          }
        }
        if (r.loose) for (let a of r.items) {
          a.loose = true;
          for (let u2 of a.tokens) u2.type === "text" && (u2.type = "paragraph");
        }
        return r;
      }
    }
    html(e) {
      let t = this.rules.block.html.exec(e);
      if (t) {
        let n = te(t[0]);
        return { type: "html", block: true, raw: n, pre: t[1] === "pre" || t[1] === "script" || t[1] === "style", text: n };
      }
    }
    def(e) {
      let t = this.rules.block.def.exec(e);
      if (t) {
        let n = t[1].toLowerCase().replace(this.rules.other.multipleSpaceGlobal, " "), s = t[2] ? t[2].replace(this.rules.other.hrefBrackets, "$1").replace(this.rules.inline.anyPunctuation, "$1") : "", r = t[3] ? t[3].substring(1, t[3].length - 1).replace(this.rules.inline.anyPunctuation, "$1") : t[3];
        return { type: "def", tag: n, raw: $(t[0], `
`), href: s, title: r };
      }
    }
    table(e) {
      let t = this.rules.block.table.exec(e);
      if (!t || !this.rules.other.tableDelimiter.test(t[2])) return;
      let n = ee(t[1]), s = t[2].replace(this.rules.other.tableAlignChars, "").split("|"), r = t[3]?.trim() ? t[3].replace(this.rules.other.tableRowBlankLine, "").split(`
`) : [], i = { type: "table", raw: $(t[0], `
`), header: [], align: [], rows: [] };
      if (n.length === s.length) {
        for (let o of s) this.rules.other.tableAlignRight.test(o) ? i.align.push("right") : this.rules.other.tableAlignCenter.test(o) ? i.align.push("center") : this.rules.other.tableAlignLeft.test(o) ? i.align.push("left") : i.align.push(null);
        for (let o = 0; o < n.length; o++) i.header.push({ text: n[o], tokens: this.lexer.inline(n[o]), header: true, align: i.align[o] });
        for (let o of r) i.rows.push(ee(o, i.header.length).map((p2, a) => ({ text: p2, tokens: this.lexer.inline(p2), header: false, align: i.align[a] })));
        return i;
      }
    }
    lheading(e) {
      let t = this.rules.block.lheading.exec(e);
      if (t) {
        let n = t[1].trim();
        return { type: "heading", raw: $(t[0], `
`), depth: t[2].charAt(0) === "=" ? 1 : 2, text: n, tokens: this.lexer.inline(n) };
      }
    }
    paragraph(e) {
      let t = this.rules.block.paragraph.exec(e);
      if (t) {
        let n = t[1].charAt(t[1].length - 1) === `
` ? t[1].slice(0, -1) : t[1];
        return { type: "paragraph", raw: t[0], text: n, tokens: this.lexer.inline(n) };
      }
    }
    text(e) {
      let t = this.rules.block.text.exec(e);
      if (t) return { type: "text", raw: t[0], text: t[0], tokens: this.lexer.inline(t[0]) };
    }
    escape(e) {
      let t = this.rules.inline.escape.exec(e);
      if (t) return { type: "escape", raw: t[0], text: t[1] };
    }
    tag(e) {
      let t = this.rules.inline.tag.exec(e);
      if (t) return !this.lexer.state.inLink && this.rules.other.startATag.test(t[0]) ? this.lexer.state.inLink = true : this.lexer.state.inLink && this.rules.other.endATag.test(t[0]) && (this.lexer.state.inLink = false), !this.lexer.state.inRawBlock && this.rules.other.startPreScriptTag.test(t[0]) ? this.lexer.state.inRawBlock = true : this.lexer.state.inRawBlock && this.rules.other.endPreScriptTag.test(t[0]) && (this.lexer.state.inRawBlock = false), { type: "html", raw: t[0], inLink: this.lexer.state.inLink, inRawBlock: this.lexer.state.inRawBlock, block: false, text: t[0] };
    }
    link(e) {
      let t = this.rules.inline.link.exec(e);
      if (t) {
        let n = t[2].trim();
        if (!this.options.pedantic && this.rules.other.startAngleBracket.test(n)) {
          if (!this.rules.other.endAngleBracket.test(n)) return;
          let i = $(n.slice(0, -1), "\\");
          if ((n.length - i.length) % 2 === 0) return;
        } else {
          let i = fe(t[2], "()");
          if (i === -2) return;
          if (i > -1) {
            let p2 = (t[0].indexOf("!") === 0 ? 5 : 4) + t[1].length + i;
            t[2] = t[2].substring(0, i), t[0] = t[0].substring(0, p2).trim(), t[3] = "";
          }
        }
        let s = t[2], r = "";
        if (this.options.pedantic) {
          let i = this.rules.other.pedanticHrefTitle.exec(s);
          i && (s = i[1], r = i[3]);
        } else r = t[3] ? t[3].slice(1, -1) : "";
        return s = s.trim(), this.rules.other.startAngleBracket.test(s) && (this.options.pedantic && !this.rules.other.endAngleBracket.test(n) ? s = s.slice(1) : s = s.slice(1, -1)), xe(t, { href: s && s.replace(this.rules.inline.anyPunctuation, "$1"), title: r && r.replace(this.rules.inline.anyPunctuation, "$1") }, t[0], this.lexer, this.rules);
      }
    }
    reflink(e, t) {
      let n;
      if ((n = this.rules.inline.reflink.exec(e)) || (n = this.rules.inline.nolink.exec(e))) {
        let s = (n[2] || n[1]).replace(this.rules.other.multipleSpaceGlobal, " "), r = t[s.toLowerCase()];
        if (!r) {
          let i = n[0].charAt(0);
          return { type: "text", raw: i, text: i };
        }
        return xe(n, r, n[0], this.lexer, this.rules);
      }
    }
    emStrong(e, t, n = "") {
      let s = this.rules.inline.emStrongLDelim.exec(e);
      if (!s || !s[1] && !s[2] && !s[3] && !s[4] || s[4] && n.match(this.rules.other.unicodeAlphaNumeric)) return;
      if (!(s[1] || s[3] || "") || !n || this.rules.inline.punctuation.exec(n)) {
        let i = [...s[0]].length - 1, o, p2, a = i, u2 = 0, c3 = s[0][0], h2 = n === c3, d2 = c3 === "*" ? this.rules.inline.emStrongRDelimAst : this.rules.inline.emStrongRDelimUnd;
        for (d2.lastIndex = 0, t = t.slice(-1 * e.length + i); (s = d2.exec(t)) !== null; ) {
          if (o = s[1] || s[2] || s[3] || s[4] || s[5] || s[6], !o) continue;
          if (p2 = [...o].length, s[3] || s[4]) {
            a += p2;
            continue;
          } else if (s[5] || s[6]) {
            if (i % 3 && !((i + p2) % 3)) {
              u2 += p2;
              continue;
            }
            if (h2) break;
          }
          if (a -= p2, a > 0) continue;
          p2 = Math.min(p2, p2 + a + u2);
          let T2 = [...s[0]][0].length, g2 = e.slice(0, i + s.index + T2 + p2);
          if (Math.min(i, p2) % 2) {
            let M2 = g2.slice(1, -1);
            return { type: "em", raw: g2, text: M2, tokens: this.lexer.inlineTokens(M2) };
          }
          let w2 = g2.slice(2, -2);
          return { type: "strong", raw: g2, text: w2, tokens: this.lexer.inlineTokens(w2) };
        }
      }
    }
    codespan(e) {
      let t = this.rules.inline.code.exec(e);
      if (t) {
        let n = t[2].replace(this.rules.other.newLineCharGlobal, " "), s = this.rules.other.nonSpaceChar.test(n), r = this.rules.other.startingSpaceChar.test(n) && this.rules.other.endingSpaceChar.test(n);
        return s && r && (n = n.substring(1, n.length - 1)), { type: "codespan", raw: t[0], text: n };
      }
    }
    br(e) {
      let t = this.rules.inline.br.exec(e);
      if (t) return { type: "br", raw: t[0] };
    }
    del(e, t, n = "") {
      let s = this.rules.inline.delLDelim.exec(e);
      if (!s) return;
      if (!(s[1] || "") || !n || this.rules.inline.punctuation.exec(n)) {
        let i = [...s[0]].length - 1, o, p2, a = i, u2 = this.rules.inline.delRDelim;
        for (u2.lastIndex = 0, t = t.slice(-1 * e.length + i); (s = u2.exec(t)) !== null; ) {
          if (o = s[1] || s[2] || s[3] || s[4] || s[5] || s[6], !o || (p2 = [...o].length, p2 !== i)) continue;
          if (s[3] || s[4]) {
            a += p2;
            continue;
          }
          if (a -= p2, a > 0) continue;
          p2 = Math.min(p2, p2 + a);
          let c3 = [...s[0]][0].length, h2 = e.slice(0, i + s.index + c3 + p2), d2 = h2.slice(i, -i);
          return { type: "del", raw: h2, text: d2, tokens: this.lexer.inlineTokens(d2) };
        }
      }
    }
    autolink(e) {
      let t = this.rules.inline.autolink.exec(e);
      if (t) {
        let n, s;
        return t[2] === "@" ? (n = t[1], s = "mailto:" + n) : (n = t[1], s = n), { type: "link", raw: t[0], text: n, href: s, tokens: [{ type: "text", raw: n, text: n }] };
      }
    }
    url(e) {
      let t;
      if (t = this.rules.inline.url.exec(e)) {
        let n, s;
        if (t[2] === "@") n = t[0], s = "mailto:" + n;
        else {
          let r;
          do
            r = t[0], t[0] = this.rules.inline._backpedal.exec(t[0])?.[0] ?? "";
          while (r !== t[0]);
          n = t[0], t[1] === "www." ? s = "http://" + t[0] : s = t[0];
        }
        return { type: "link", raw: t[0], text: n, href: s, tokens: [{ type: "text", raw: n, text: n }] };
      }
    }
    inlineText(e) {
      let t = this.rules.inline.text.exec(e);
      if (t) {
        let n = this.lexer.state.inRawBlock;
        return { type: "text", raw: t[0], text: t[0], escaped: n };
      }
    }
  };
  var x = class l {
    tokens;
    options;
    state;
    inlineQueue;
    tokenizer;
    constructor(e) {
      this.tokens = [], this.tokens.links = /* @__PURE__ */ Object.create(null), this.options = e || R, this.options.tokenizer = this.options.tokenizer || new y(), this.tokenizer = this.options.tokenizer, this.tokenizer.options = this.options, this.tokenizer.lexer = this, this.inlineQueue = [], this.state = { inLink: false, inRawBlock: false, top: true };
      let t = { other: m, block: H2.normal, inline: B.normal };
      this.options.pedantic ? (t.block = H2.pedantic, t.inline = B.pedantic) : this.options.gfm && (t.block = H2.gfm, this.options.breaks ? t.inline = B.breaks : t.inline = B.gfm), this.tokenizer.rules = t;
    }
    static get rules() {
      return { block: H2, inline: B };
    }
    static lex(e, t) {
      return new l(t).lex(e);
    }
    static lexInline(e, t) {
      return new l(t).inlineTokens(e);
    }
    lex(e) {
      e = e.replace(m.carriageReturn, `
`), this.blockTokens(e, this.tokens);
      for (let t = 0; t < this.inlineQueue.length; t++) {
        let n = this.inlineQueue[t];
        this.inlineTokens(n.src, n.tokens);
      }
      return this.inlineQueue = [], this.tokens;
    }
    blockTokens(e, t = [], n = false) {
      this.tokenizer.lexer = this, this.options.pedantic && (e = e.replace(m.tabCharGlobal, "    ").replace(m.spaceLine, ""));
      let s = 1 / 0;
      for (; e; ) {
        if (e.length < s) s = e.length;
        else {
          this.infiniteLoopError(e.charCodeAt(0));
          break;
        }
        let r;
        if (this.options.extensions?.block?.some((o) => (r = o.call({ lexer: this }, e, t)) ? (e = e.substring(r.raw.length), t.push(r), true) : false)) continue;
        if (r = this.tokenizer.space(e)) {
          e = e.substring(r.raw.length);
          let o = t.at(-1);
          r.raw.length === 1 && o !== void 0 ? o.raw += `
` : t.push(r);
          continue;
        }
        if (r = this.tokenizer.code(e)) {
          e = e.substring(r.raw.length);
          let o = t.at(-1);
          o?.type === "paragraph" || o?.type === "text" ? (o.raw += (o.raw.endsWith(`
`) ? "" : `
`) + r.raw, o.text += `
` + r.text, this.inlineQueue.at(-1).src = o.text) : t.push(r);
          continue;
        }
        if (r = this.tokenizer.fences(e)) {
          e = e.substring(r.raw.length), t.push(r);
          continue;
        }
        if (r = this.tokenizer.heading(e)) {
          e = e.substring(r.raw.length), t.push(r);
          continue;
        }
        if (r = this.tokenizer.hr(e)) {
          e = e.substring(r.raw.length), t.push(r);
          continue;
        }
        if (r = this.tokenizer.blockquote(e)) {
          e = e.substring(r.raw.length), t.push(r);
          continue;
        }
        if (r = this.tokenizer.list(e)) {
          e = e.substring(r.raw.length), t.push(r);
          continue;
        }
        if (r = this.tokenizer.html(e)) {
          e = e.substring(r.raw.length), t.push(r);
          continue;
        }
        if (r = this.tokenizer.def(e)) {
          e = e.substring(r.raw.length);
          let o = t.at(-1);
          o?.type === "paragraph" || o?.type === "text" ? (o.raw += (o.raw.endsWith(`
`) ? "" : `
`) + r.raw, o.text += `
` + r.raw, this.inlineQueue.at(-1).src = o.text) : this.tokens.links[r.tag] || (this.tokens.links[r.tag] = { href: r.href, title: r.title }, t.push(r));
          continue;
        }
        if (r = this.tokenizer.table(e)) {
          e = e.substring(r.raw.length), t.push(r);
          continue;
        }
        if (r = this.tokenizer.lheading(e)) {
          e = e.substring(r.raw.length), t.push(r);
          continue;
        }
        let i = e;
        if (this.options.extensions?.startBlock) {
          let o = 1 / 0, p2 = e.slice(1), a;
          this.options.extensions.startBlock.forEach((u2) => {
            a = u2.call({ lexer: this }, p2), typeof a == "number" && a >= 0 && (o = Math.min(o, a));
          }), o < 1 / 0 && o >= 0 && (i = e.substring(0, o + 1));
        }
        if (this.state.top && (r = this.tokenizer.paragraph(i))) {
          let o = t.at(-1);
          n && o?.type === "paragraph" ? (o.raw += (o.raw.endsWith(`
`) ? "" : `
`) + r.raw, o.text += `
` + r.text, this.inlineQueue.pop(), this.inlineQueue.at(-1).src = o.text) : t.push(r), n = i.length !== e.length, e = e.substring(r.raw.length);
          continue;
        }
        if (r = this.tokenizer.text(e)) {
          e = e.substring(r.raw.length);
          let o = t.at(-1);
          o?.type === "text" ? (o.raw += (o.raw.endsWith(`
`) ? "" : `
`) + r.raw, o.text += `
` + r.text, this.inlineQueue.pop(), this.inlineQueue.at(-1).src = o.text) : t.push(r);
          continue;
        }
        if (e) {
          this.infiniteLoopError(e.charCodeAt(0));
          break;
        }
      }
      return this.state.top = true, t;
    }
    inline(e, t = []) {
      return this.inlineQueue.push({ src: e, tokens: t }), t;
    }
    inlineTokens(e, t = []) {
      this.tokenizer.lexer = this;
      let n = e;
      if (this.tokens.links) {
        let o = Object.keys(this.tokens.links);
        o.length > 0 && (n = n.replace(this.tokenizer.rules.inline.reflinkSearch, (p2) => o.includes(p2.slice(p2.lastIndexOf("[") + 1, -1)) ? "[" + "a".repeat(p2.length - 2) + "]" : p2));
      }
      n = n.replace(this.tokenizer.rules.inline.anyPunctuation, "++"), n = n.replace(this.tokenizer.rules.inline.blockSkip, (o, p2, a) => {
        let u2 = a ? a.length : 0;
        return o.slice(0, u2) + "[" + "a".repeat(o.length - u2 - 2) + "]";
      }), n = this.options.hooks?.emStrongMask?.call({ lexer: this }, n) ?? n;
      let s = false, r = "", i = 1 / 0;
      for (; e; ) {
        if (e.length < i) i = e.length;
        else {
          this.infiniteLoopError(e.charCodeAt(0));
          break;
        }
        s || (r = ""), s = false;
        let o;
        if (this.options.extensions?.inline?.some((a) => (o = a.call({ lexer: this }, e, t)) ? (e = e.substring(o.raw.length), t.push(o), true) : false)) continue;
        if (o = this.tokenizer.escape(e)) {
          e = e.substring(o.raw.length), t.push(o);
          continue;
        }
        if (o = this.tokenizer.tag(e)) {
          e = e.substring(o.raw.length), t.push(o);
          continue;
        }
        if (o = this.tokenizer.link(e)) {
          e = e.substring(o.raw.length), t.push(o);
          continue;
        }
        if (o = this.tokenizer.reflink(e, this.tokens.links)) {
          e = e.substring(o.raw.length);
          let a = t.at(-1);
          o.type === "text" && a?.type === "text" ? (a.raw += o.raw, a.text += o.text) : t.push(o);
          continue;
        }
        if (o = this.tokenizer.emStrong(e, n, r)) {
          e = e.substring(o.raw.length), t.push(o);
          continue;
        }
        if (o = this.tokenizer.codespan(e)) {
          e = e.substring(o.raw.length), t.push(o);
          continue;
        }
        if (o = this.tokenizer.br(e)) {
          e = e.substring(o.raw.length), t.push(o);
          continue;
        }
        if (o = this.tokenizer.del(e, n, r)) {
          e = e.substring(o.raw.length), t.push(o);
          continue;
        }
        if (o = this.tokenizer.autolink(e)) {
          e = e.substring(o.raw.length), t.push(o);
          continue;
        }
        if (!this.state.inLink && (o = this.tokenizer.url(e))) {
          e = e.substring(o.raw.length), t.push(o);
          continue;
        }
        let p2 = e;
        if (this.options.extensions?.startInline) {
          let a = 1 / 0, u2 = e.slice(1), c3;
          this.options.extensions.startInline.forEach((h2) => {
            c3 = h2.call({ lexer: this }, u2), typeof c3 == "number" && c3 >= 0 && (a = Math.min(a, c3));
          }), a < 1 / 0 && a >= 0 && (p2 = e.substring(0, a + 1));
        }
        if (o = this.tokenizer.inlineText(p2)) {
          e = e.substring(o.raw.length), o.raw.slice(-1) !== "_" && (r = o.raw.slice(-1)), s = true;
          let a = t.at(-1);
          a?.type === "text" ? (a.raw += o.raw, a.text += o.text) : t.push(o);
          continue;
        }
        if (e) {
          this.infiniteLoopError(e.charCodeAt(0));
          break;
        }
      }
      return t;
    }
    infiniteLoopError(e) {
      let t = "Infinite loop on byte: " + e;
      if (this.options.silent) console.error(t);
      else throw new Error(t);
    }
  };
  var P = class {
    options;
    parser;
    constructor(e) {
      this.options = e || R;
    }
    space(e) {
      return "";
    }
    code({ text: e, lang: t, escaped: n }) {
      let s = (t || "").match(m.notSpaceStart)?.[0], r = e.replace(m.endingNewline, "") + `
`;
      return s ? '<pre><code class="language-' + O(s) + '">' + (n ? r : O(r, true)) + `</code></pre>
` : "<pre><code>" + (n ? r : O(r, true)) + `</code></pre>
`;
    }
    blockquote({ tokens: e }) {
      return `<blockquote>
${this.parser.parse(e)}</blockquote>
`;
    }
    html({ text: e }) {
      return e;
    }
    def(e) {
      return "";
    }
    heading({ tokens: e, depth: t }) {
      return `<h${t}>${this.parser.parseInline(e)}</h${t}>
`;
    }
    hr(e) {
      return `<hr>
`;
    }
    list(e) {
      let t = e.ordered, n = e.start, s = "";
      for (let o = 0; o < e.items.length; o++) {
        let p2 = e.items[o];
        s += this.listitem(p2);
      }
      let r = t ? "ol" : "ul", i = t && n !== 1 ? ' start="' + n + '"' : "";
      return "<" + r + i + `>
` + s + "</" + r + `>
`;
    }
    listitem(e) {
      return `<li>${this.parser.parse(e.tokens)}</li>
`;
    }
    checkbox({ checked: e }) {
      return "<input " + (e ? 'checked="" ' : "") + 'disabled="" type="checkbox"> ';
    }
    paragraph({ tokens: e }) {
      return `<p>${this.parser.parseInline(e)}</p>
`;
    }
    table(e) {
      let t = "", n = "";
      for (let r = 0; r < e.header.length; r++) n += this.tablecell(e.header[r]);
      t += this.tablerow({ text: n });
      let s = "";
      for (let r = 0; r < e.rows.length; r++) {
        let i = e.rows[r];
        n = "";
        for (let o = 0; o < i.length; o++) n += this.tablecell(i[o]);
        s += this.tablerow({ text: n });
      }
      return s && (s = `<tbody>${s}</tbody>`), `<table>
<thead>
` + t + `</thead>
` + s + `</table>
`;
    }
    tablerow({ text: e }) {
      return `<tr>
${e}</tr>
`;
    }
    tablecell(e) {
      let t = this.parser.parseInline(e.tokens), n = e.header ? "th" : "td";
      return (e.align ? `<${n} align="${e.align}">` : `<${n}>`) + t + `</${n}>
`;
    }
    strong({ tokens: e }) {
      return `<strong>${this.parser.parseInline(e)}</strong>`;
    }
    em({ tokens: e }) {
      return `<em>${this.parser.parseInline(e)}</em>`;
    }
    codespan({ text: e }) {
      return `<code>${O(e, true)}</code>`;
    }
    br(e) {
      return "<br>";
    }
    del({ tokens: e }) {
      return `<del>${this.parser.parseInline(e)}</del>`;
    }
    link({ href: e, title: t, tokens: n }) {
      let s = this.parser.parseInline(n), r = Y(e);
      if (r === null) return s;
      e = r;
      let i = '<a href="' + e + '"';
      return t && (i += ' title="' + O(t) + '"'), i += ">" + s + "</a>", i;
    }
    image({ href: e, title: t, text: n, tokens: s }) {
      s && (n = this.parser.parseInline(s, this.parser.textRenderer));
      let r = Y(e);
      if (r === null) return O(n);
      e = r;
      let i = `<img src="${e}" alt="${O(n)}"`;
      return t && (i += ` title="${O(t)}"`), i += ">", i;
    }
    text(e) {
      return "tokens" in e && e.tokens ? this.parser.parseInline(e.tokens) : "escaped" in e && e.escaped ? e.text : O(e.text);
    }
  };
  var L = class {
    strong({ text: e }) {
      return e;
    }
    em({ text: e }) {
      return e;
    }
    codespan({ text: e }) {
      return e;
    }
    del({ text: e }) {
      return e;
    }
    html({ text: e }) {
      return e;
    }
    text({ text: e }) {
      return e;
    }
    link({ text: e }) {
      return "" + e;
    }
    image({ text: e }) {
      return "" + e;
    }
    br() {
      return "";
    }
    checkbox({ raw: e }) {
      return e;
    }
  };
  var b = class l2 {
    options;
    renderer;
    textRenderer;
    constructor(e) {
      this.options = e || R, this.options.renderer = this.options.renderer || new P(), this.renderer = this.options.renderer, this.renderer.options = this.options, this.renderer.parser = this, this.textRenderer = new L();
    }
    static parse(e, t) {
      return new l2(t).parse(e);
    }
    static parseInline(e, t) {
      return new l2(t).parseInline(e);
    }
    parse(e) {
      this.renderer.parser = this;
      let t = "";
      for (let n = 0; n < e.length; n++) {
        let s = e[n];
        if (this.options.extensions?.renderers?.[s.type]) {
          let i = s, o = this.options.extensions.renderers[i.type].call({ parser: this }, i);
          if (o !== false || !["space", "hr", "heading", "code", "table", "blockquote", "list", "checkbox", "html", "def", "paragraph", "text"].includes(i.type)) {
            t += o || "";
            continue;
          }
        }
        let r = s;
        switch (r.type) {
          case "space": {
            t += this.renderer.space(r);
            break;
          }
          case "hr": {
            t += this.renderer.hr(r);
            break;
          }
          case "heading": {
            t += this.renderer.heading(r);
            break;
          }
          case "code": {
            t += this.renderer.code(r);
            break;
          }
          case "table": {
            t += this.renderer.table(r);
            break;
          }
          case "blockquote": {
            t += this.renderer.blockquote(r);
            break;
          }
          case "list": {
            t += this.renderer.list(r);
            break;
          }
          case "checkbox": {
            t += this.renderer.checkbox(r);
            break;
          }
          case "html": {
            t += this.renderer.html(r);
            break;
          }
          case "def": {
            t += this.renderer.def(r);
            break;
          }
          case "paragraph": {
            t += this.renderer.paragraph(r);
            break;
          }
          case "text": {
            t += this.renderer.text(r);
            break;
          }
          default: {
            let i = 'Token with "' + r.type + '" type was not found.';
            if (this.options.silent) return console.error(i), "";
            throw new Error(i);
          }
        }
      }
      return t;
    }
    parseInline(e, t = this.renderer) {
      this.renderer.parser = this;
      let n = "";
      for (let s = 0; s < e.length; s++) {
        let r = e[s];
        if (this.options.extensions?.renderers?.[r.type]) {
          let o = this.options.extensions.renderers[r.type].call({ parser: this }, r);
          if (o !== false || !["escape", "html", "link", "image", "checkbox", "strong", "em", "codespan", "br", "del", "text"].includes(r.type)) {
            n += o || "";
            continue;
          }
        }
        let i = r;
        switch (i.type) {
          case "escape": {
            n += t.text(i);
            break;
          }
          case "html": {
            n += t.html(i);
            break;
          }
          case "link": {
            n += t.link(i);
            break;
          }
          case "image": {
            n += t.image(i);
            break;
          }
          case "checkbox": {
            n += t.checkbox(i);
            break;
          }
          case "strong": {
            n += t.strong(i);
            break;
          }
          case "em": {
            n += t.em(i);
            break;
          }
          case "codespan": {
            n += t.codespan(i);
            break;
          }
          case "br": {
            n += t.br(i);
            break;
          }
          case "del": {
            n += t.del(i);
            break;
          }
          case "text": {
            n += t.text(i);
            break;
          }
          default: {
            let o = 'Token with "' + i.type + '" type was not found.';
            if (this.options.silent) return console.error(o), "";
            throw new Error(o);
          }
        }
      }
      return n;
    }
  };
  var S = class {
    options;
    block;
    constructor(e) {
      this.options = e || R;
    }
    static passThroughHooks = /* @__PURE__ */ new Set(["preprocess", "postprocess", "processAllTokens", "emStrongMask"]);
    static passThroughHooksRespectAsync = /* @__PURE__ */ new Set(["preprocess", "postprocess", "processAllTokens"]);
    preprocess(e) {
      return e;
    }
    postprocess(e) {
      return e;
    }
    processAllTokens(e) {
      return e;
    }
    emStrongMask(e) {
      return e;
    }
    provideLexer(e = this.block) {
      return e ? x.lex : x.lexInline;
    }
    provideParser(e = this.block) {
      return e ? b.parse : b.parseInline;
    }
  };
  var Z = class {
    defaults = C();
    options = this.setOptions;
    parse = this.parseMarkdown(true);
    parseInline = this.parseMarkdown(false);
    Parser = b;
    Renderer = P;
    TextRenderer = L;
    Lexer = x;
    Tokenizer = y;
    Hooks = S;
    constructor(...e) {
      this.use(...e);
    }
    walkTokens(e, t) {
      let n = [];
      for (let s of e) switch (n = n.concat(t.call(this, s)), s.type) {
        case "table": {
          let r = s;
          for (let i of r.header) n = n.concat(this.walkTokens(i.tokens, t));
          for (let i of r.rows) for (let o of i) n = n.concat(this.walkTokens(o.tokens, t));
          break;
        }
        case "list": {
          let r = s;
          n = n.concat(this.walkTokens(r.items, t));
          break;
        }
        default: {
          let r = s;
          this.defaults.extensions?.childTokens?.[r.type] ? this.defaults.extensions.childTokens[r.type].forEach((i) => {
            let o = r[i].flat(1 / 0);
            n = n.concat(this.walkTokens(o, t));
          }) : r.tokens && (n = n.concat(this.walkTokens(r.tokens, t)));
        }
      }
      return n;
    }
    use(...e) {
      let t = this.defaults.extensions || { renderers: {}, childTokens: {} };
      return e.forEach((n) => {
        let s = { ...n };
        if (s.async = this.defaults.async || s.async || false, n.extensions && (n.extensions.forEach((r) => {
          if (!r.name) throw new Error("extension name required");
          if ("renderer" in r) {
            let i = t.renderers[r.name];
            i ? t.renderers[r.name] = function(...o) {
              let p2 = r.renderer.apply(this, o);
              return p2 === false && (p2 = i.apply(this, o)), p2;
            } : t.renderers[r.name] = r.renderer;
          }
          if ("tokenizer" in r) {
            if (!r.level || r.level !== "block" && r.level !== "inline") throw new Error("extension level must be 'block' or 'inline'");
            let i = t[r.level];
            i ? i.unshift(r.tokenizer) : t[r.level] = [r.tokenizer], r.start && (r.level === "block" ? t.startBlock ? t.startBlock.push(r.start) : t.startBlock = [r.start] : r.level === "inline" && (t.startInline ? t.startInline.push(r.start) : t.startInline = [r.start]));
          }
          "childTokens" in r && r.childTokens && (t.childTokens[r.name] = r.childTokens);
        }), s.extensions = t), n.renderer) {
          let r = this.defaults.renderer || new P(this.defaults);
          for (let i in n.renderer) {
            if (!(i in r)) throw new Error(`renderer '${i}' does not exist`);
            if (["options", "parser"].includes(i)) continue;
            let o = i, p2 = n.renderer[o], a = r[o];
            r[o] = (...u2) => {
              let c3 = p2.apply(r, u2);
              return c3 === false && (c3 = a.apply(r, u2)), c3 || "";
            };
          }
          s.renderer = r;
        }
        if (n.tokenizer) {
          let r = this.defaults.tokenizer || new y(this.defaults);
          for (let i in n.tokenizer) {
            if (!(i in r)) throw new Error(`tokenizer '${i}' does not exist`);
            if (["options", "rules", "lexer"].includes(i)) continue;
            let o = i, p2 = n.tokenizer[o], a = r[o];
            r[o] = (...u2) => {
              let c3 = p2.apply(r, u2);
              return c3 === false && (c3 = a.apply(r, u2)), c3;
            };
          }
          s.tokenizer = r;
        }
        if (n.hooks) {
          let r = this.defaults.hooks || new S();
          for (let i in n.hooks) {
            if (!(i in r)) throw new Error(`hook '${i}' does not exist`);
            if (["options", "block"].includes(i)) continue;
            let o = i, p2 = n.hooks[o], a = r[o];
            S.passThroughHooks.has(i) ? r[o] = (u2) => {
              if (this.defaults.async && S.passThroughHooksRespectAsync.has(i)) return (async () => {
                let h2 = await p2.call(r, u2);
                return a.call(r, h2);
              })();
              let c3 = p2.call(r, u2);
              return a.call(r, c3);
            } : r[o] = (...u2) => {
              if (this.defaults.async) return (async () => {
                let h2 = await p2.apply(r, u2);
                return h2 === false && (h2 = await a.apply(r, u2)), h2;
              })();
              let c3 = p2.apply(r, u2);
              return c3 === false && (c3 = a.apply(r, u2)), c3;
            };
          }
          s.hooks = r;
        }
        if (n.walkTokens) {
          let r = this.defaults.walkTokens, i = n.walkTokens;
          s.walkTokens = function(o) {
            let p2 = [];
            return p2.push(i.call(this, o)), r && (p2 = p2.concat(r.call(this, o))), p2;
          };
        }
        this.defaults = { ...this.defaults, ...s };
      }), this;
    }
    setOptions(e) {
      return this.defaults = { ...this.defaults, ...e }, this;
    }
    lexer(e, t) {
      return x.lex(e, t ?? this.defaults);
    }
    parser(e, t) {
      return b.parse(e, t ?? this.defaults);
    }
    parseMarkdown(e) {
      return (n, s) => {
        let r = { ...s }, i = { ...this.defaults, ...r }, o = this.onError(!!i.silent, !!i.async);
        if (this.defaults.async === true && r.async === false) return o(new Error("marked(): The async option was set to true by an extension. Remove async: false from the parse options object to return a Promise."));
        if (typeof n > "u" || n === null) return o(new Error("marked(): input parameter is undefined or null"));
        if (typeof n != "string") return o(new Error("marked(): input parameter is of type " + Object.prototype.toString.call(n) + ", string expected"));
        if (i.hooks && (i.hooks.options = i, i.hooks.block = e), i.async) return (async () => {
          let p2 = i.hooks ? await i.hooks.preprocess(n) : n, u2 = await (i.hooks ? await i.hooks.provideLexer(e) : e ? x.lex : x.lexInline)(p2, i), c3 = i.hooks ? await i.hooks.processAllTokens(u2) : u2;
          i.walkTokens && await Promise.all(this.walkTokens(c3, i.walkTokens));
          let d2 = await (i.hooks ? await i.hooks.provideParser(e) : e ? b.parse : b.parseInline)(c3, i);
          return i.hooks ? await i.hooks.postprocess(d2) : d2;
        })().catch(o);
        try {
          i.hooks && (n = i.hooks.preprocess(n));
          let a = (i.hooks ? i.hooks.provideLexer(e) : e ? x.lex : x.lexInline)(n, i);
          i.hooks && (a = i.hooks.processAllTokens(a)), i.walkTokens && this.walkTokens(a, i.walkTokens);
          let c3 = (i.hooks ? i.hooks.provideParser(e) : e ? b.parse : b.parseInline)(a, i);
          return i.hooks && (c3 = i.hooks.postprocess(c3)), c3;
        } catch (p2) {
          return o(p2);
        }
      };
    }
    onError(e, t) {
      return (n) => {
        if (n.message += `
Please report this to https://github.com/markedjs/marked.`, e) {
          let s = "<p>An error occurred:</p><pre>" + O(n.message + "", true) + "</pre>";
          return t ? Promise.resolve(s) : s;
        }
        if (t) return Promise.reject(n);
        throw n;
      };
    }
  };
  var E = new Z();
  function f(l3, e) {
    return E.parse(l3, e);
  }
  f.options = f.setOptions = function(l3) {
    return E.setOptions(l3), f.defaults = E.defaults, j(f.defaults), f;
  };
  f.getDefaults = C;
  f.defaults = R;
  function kt(...l3) {
    return E.use(...l3), f.defaults = E.defaults, j(f.defaults), f;
  }
  f.use = kt;
  f.walkTokens = function(l3, e) {
    return E.walkTokens(l3, e);
  };
  f.parseInline = E.parseInline;
  f.Parser = b;
  f.parser = b.parse;
  f.Renderer = P;
  f.TextRenderer = L;
  f.Lexer = x;
  f.lexer = x.lex;
  f.Tokenizer = y;
  f.Hooks = S;
  f.parse = f;
  var nn = f.options;
  var rn = f.setOptions;
  var sn = f.walkTokens;
  var on = f.parseInline;
  var ln = b.parse;
  var pn = x.lex;

  // node_modules/highlight.js/es/core.js
  var import_core = __toESM(require_core(), 1);
  var core_default = import_core.default;

  // node_modules/highlight.js/es/languages/javascript.js
  var IDENT_RE = "[A-Za-z$_][0-9A-Za-z$_]*";
  var KEYWORDS = [
    "as",
    // for exports
    "in",
    "of",
    "if",
    "for",
    "while",
    "finally",
    "var",
    "new",
    "function",
    "do",
    "return",
    "void",
    "else",
    "break",
    "catch",
    "instanceof",
    "with",
    "throw",
    "case",
    "default",
    "try",
    "switch",
    "continue",
    "typeof",
    "delete",
    "let",
    "yield",
    "const",
    "class",
    // JS handles these with a special rule
    // "get",
    // "set",
    "debugger",
    "async",
    "await",
    "static",
    "import",
    "from",
    "export",
    "extends",
    // It's reached stage 3, which is "recommended for implementation":
    "using"
  ];
  var LITERALS = [
    "true",
    "false",
    "null",
    "undefined",
    "NaN",
    "Infinity"
  ];
  var TYPES = [
    // Fundamental objects
    "Object",
    "Function",
    "Boolean",
    "Symbol",
    // numbers and dates
    "Math",
    "Date",
    "Number",
    "BigInt",
    // text
    "String",
    "RegExp",
    // Indexed collections
    "Array",
    "Float32Array",
    "Float64Array",
    "Int8Array",
    "Uint8Array",
    "Uint8ClampedArray",
    "Int16Array",
    "Int32Array",
    "Uint16Array",
    "Uint32Array",
    "BigInt64Array",
    "BigUint64Array",
    // Keyed collections
    "Set",
    "Map",
    "WeakSet",
    "WeakMap",
    // Structured data
    "ArrayBuffer",
    "SharedArrayBuffer",
    "Atomics",
    "DataView",
    "JSON",
    // Control abstraction objects
    "Promise",
    "Generator",
    "GeneratorFunction",
    "AsyncFunction",
    // Reflection
    "Reflect",
    "Proxy",
    // Internationalization
    "Intl",
    // WebAssembly
    "WebAssembly"
  ];
  var ERROR_TYPES = [
    "Error",
    "EvalError",
    "InternalError",
    "RangeError",
    "ReferenceError",
    "SyntaxError",
    "TypeError",
    "URIError"
  ];
  var BUILT_IN_GLOBALS = [
    "setInterval",
    "setTimeout",
    "clearInterval",
    "clearTimeout",
    "require",
    "exports",
    "eval",
    "isFinite",
    "isNaN",
    "parseFloat",
    "parseInt",
    "decodeURI",
    "decodeURIComponent",
    "encodeURI",
    "encodeURIComponent",
    "escape",
    "unescape"
  ];
  var BUILT_IN_VARIABLES = [
    "arguments",
    "this",
    "super",
    "console",
    "window",
    "document",
    "localStorage",
    "sessionStorage",
    "module",
    "self",
    "global"
    // Node.js
  ];
  var BUILT_INS = [].concat(
    BUILT_IN_GLOBALS,
    TYPES,
    ERROR_TYPES
  );
  function javascript(hljs2) {
    const regex = hljs2.regex;
    const hasClosingTag = (match, { after }) => {
      const tag = "</" + match[0].slice(1);
      const pos = match.input.indexOf(tag, after);
      return pos !== -1;
    };
    const IDENT_RE$1 = IDENT_RE;
    const FRAGMENT = {
      begin: "<>",
      end: "</>"
    };
    const XML_SELF_CLOSING = /<[A-Za-z0-9\\._:-]+\s*\/>/;
    const XML_TAG = {
      begin: /<[A-Za-z0-9\\._:-]+/,
      end: /\/[A-Za-z0-9\\._:-]+>|\/>/,
      /**
       * @param {RegExpMatchArray} match
       * @param {CallbackResponse} response
       */
      isTrulyOpeningTag: (match, response) => {
        const afterMatchIndex = match[0].length + match.index;
        const nextChar = match.input[afterMatchIndex];
        if (
          // HTML should not include another raw `<` inside a tag
          // nested type?
          // `<Array<Array<number>>`, etc.
          nextChar === "<" || // the , gives away that this is not HTML
          // `<T, A extends keyof T, V>`
          nextChar === ","
        ) {
          response.ignoreMatch();
          return;
        }
        if (nextChar === ">") {
          if (!hasClosingTag(match, { after: afterMatchIndex })) {
            response.ignoreMatch();
          }
        }
        let m3;
        const afterMatch = match.input.substring(afterMatchIndex);
        if (m3 = afterMatch.match(/^\s*=/)) {
          response.ignoreMatch();
          return;
        }
        if (m3 = afterMatch.match(/^\s+extends\s+/)) {
          if (m3.index === 0) {
            response.ignoreMatch();
            return;
          }
        }
      }
    };
    const KEYWORDS$1 = {
      $pattern: IDENT_RE,
      keyword: KEYWORDS,
      literal: LITERALS,
      built_in: BUILT_INS,
      "variable.language": BUILT_IN_VARIABLES
    };
    const decimalDigits3 = "[0-9](_?[0-9])*";
    const frac3 = `\\.(${decimalDigits3})`;
    const decimalInteger = `0|[1-9](_?[0-9])*|0[0-7]*[89][0-9]*`;
    const NUMBER = {
      className: "number",
      variants: [
        // DecimalLiteral
        { begin: `(\\b(${decimalInteger})((${frac3})|\\.)?|(${frac3}))[eE][+-]?(${decimalDigits3})\\b` },
        { begin: `\\b(${decimalInteger})\\b((${frac3})\\b|\\.)?|(${frac3})\\b` },
        // DecimalBigIntegerLiteral
        { begin: `\\b(0|[1-9](_?[0-9])*)n\\b` },
        // NonDecimalIntegerLiteral
        { begin: "\\b0[xX][0-9a-fA-F](_?[0-9a-fA-F])*n?\\b" },
        { begin: "\\b0[bB][0-1](_?[0-1])*n?\\b" },
        { begin: "\\b0[oO][0-7](_?[0-7])*n?\\b" },
        // LegacyOctalIntegerLiteral (does not include underscore separators)
        // https://tc39.es/ecma262/#sec-additional-syntax-numeric-literals
        { begin: "\\b0[0-7]+n?\\b" }
      ],
      relevance: 0
    };
    const SUBST = {
      className: "subst",
      begin: "\\$\\{",
      end: "\\}",
      keywords: KEYWORDS$1,
      contains: []
      // defined later
    };
    const HTML_TEMPLATE = {
      begin: ".?html`",
      end: "",
      starts: {
        end: "`",
        returnEnd: false,
        contains: [
          hljs2.BACKSLASH_ESCAPE,
          SUBST
        ],
        subLanguage: "xml"
      }
    };
    const CSS_TEMPLATE = {
      begin: ".?css`",
      end: "",
      starts: {
        end: "`",
        returnEnd: false,
        contains: [
          hljs2.BACKSLASH_ESCAPE,
          SUBST
        ],
        subLanguage: "css"
      }
    };
    const GRAPHQL_TEMPLATE = {
      begin: ".?gql`",
      end: "",
      starts: {
        end: "`",
        returnEnd: false,
        contains: [
          hljs2.BACKSLASH_ESCAPE,
          SUBST
        ],
        subLanguage: "graphql"
      }
    };
    const TEMPLATE_STRING = {
      className: "string",
      begin: "`",
      end: "`",
      contains: [
        hljs2.BACKSLASH_ESCAPE,
        SUBST
      ]
    };
    const JSDOC_COMMENT = hljs2.COMMENT(
      /\/\*\*(?!\/)/,
      "\\*/",
      {
        relevance: 0,
        contains: [
          {
            begin: "(?=@[A-Za-z]+)",
            relevance: 0,
            contains: [
              {
                className: "doctag",
                begin: "@[A-Za-z]+"
              },
              {
                className: "type",
                begin: "\\{",
                end: "\\}",
                excludeEnd: true,
                excludeBegin: true,
                relevance: 0
              },
              {
                className: "variable",
                begin: IDENT_RE$1 + "(?=\\s*(-)|$)",
                endsParent: true,
                relevance: 0
              },
              // eat spaces (not newlines) so we can find
              // types or variables
              {
                begin: /(?=[^\n])\s/,
                relevance: 0
              }
            ]
          }
        ]
      }
    );
    const COMMENT = {
      className: "comment",
      variants: [
        JSDOC_COMMENT,
        hljs2.C_BLOCK_COMMENT_MODE,
        hljs2.C_LINE_COMMENT_MODE
      ]
    };
    const SUBST_INTERNALS = [
      hljs2.APOS_STRING_MODE,
      hljs2.QUOTE_STRING_MODE,
      HTML_TEMPLATE,
      CSS_TEMPLATE,
      GRAPHQL_TEMPLATE,
      TEMPLATE_STRING,
      // Skip numbers when they are part of a variable name
      { match: /\$\d+/ },
      NUMBER
      // This is intentional:
      // See https://github.com/highlightjs/highlight.js/issues/3288
      // hljs.REGEXP_MODE
    ];
    SUBST.contains = SUBST_INTERNALS.concat({
      // we need to pair up {} inside our subst to prevent
      // it from ending too early by matching another }
      begin: /\{/,
      end: /\}/,
      keywords: KEYWORDS$1,
      contains: [
        "self"
      ].concat(SUBST_INTERNALS)
    });
    const SUBST_AND_COMMENTS = [].concat(COMMENT, SUBST.contains);
    const PARAMS_CONTAINS = SUBST_AND_COMMENTS.concat([
      // eat recursive parens in sub expressions
      {
        begin: /(\s*)\(/,
        end: /\)/,
        keywords: KEYWORDS$1,
        contains: ["self"].concat(SUBST_AND_COMMENTS)
      }
    ]);
    const PARAMS = {
      className: "params",
      // convert this to negative lookbehind in v12
      begin: /(\s*)\(/,
      // to match the parms with
      end: /\)/,
      excludeBegin: true,
      excludeEnd: true,
      keywords: KEYWORDS$1,
      contains: PARAMS_CONTAINS
    };
    const CLASS_OR_EXTENDS = {
      variants: [
        // class Car extends vehicle
        {
          match: [
            /class/,
            /\s+/,
            IDENT_RE$1,
            /\s+/,
            /extends/,
            /\s+/,
            regex.concat(IDENT_RE$1, "(", regex.concat(/\./, IDENT_RE$1), ")*")
          ],
          scope: {
            1: "keyword",
            3: "title.class",
            5: "keyword",
            7: "title.class.inherited"
          }
        },
        // class Car
        {
          match: [
            /class/,
            /\s+/,
            IDENT_RE$1
          ],
          scope: {
            1: "keyword",
            3: "title.class"
          }
        }
      ]
    };
    const CLASS_REFERENCE = {
      relevance: 0,
      match: regex.either(
        // Hard coded exceptions
        /\bJSON/,
        // Float32Array, OutT
        /\b[A-Z][a-z]+([A-Z][a-z]*|\d)*/,
        // CSSFactory, CSSFactoryT
        /\b[A-Z]{2,}([A-Z][a-z]+|\d)+([A-Z][a-z]*)*/,
        // FPs, FPsT
        /\b[A-Z]{2,}[a-z]+([A-Z][a-z]+|\d)*([A-Z][a-z]*)*/
        // P
        // single letters are not highlighted
        // BLAH
        // this will be flagged as a UPPER_CASE_CONSTANT instead
      ),
      className: "title.class",
      keywords: {
        _: [
          // se we still get relevance credit for JS library classes
          ...TYPES,
          ...ERROR_TYPES
        ]
      }
    };
    const USE_STRICT = {
      label: "use_strict",
      className: "meta",
      relevance: 10,
      begin: /^\s*['"]use (strict|asm)['"]/
    };
    const FUNCTION_DEFINITION = {
      variants: [
        {
          match: [
            /function/,
            /\s+/,
            IDENT_RE$1,
            /(?=\s*\()/
          ]
        },
        // anonymous function
        {
          match: [
            /function/,
            /\s*(?=\()/
          ]
        }
      ],
      className: {
        1: "keyword",
        3: "title.function"
      },
      label: "func.def",
      contains: [PARAMS],
      illegal: /%/
    };
    const UPPER_CASE_CONSTANT = {
      relevance: 0,
      match: /\b[A-Z][A-Z_0-9]+\b/,
      className: "variable.constant"
    };
    function noneOf(list) {
      return regex.concat("(?!", list.join("|"), ")");
    }
    const FUNCTION_CALL = {
      match: regex.concat(
        /\b/,
        noneOf([
          ...BUILT_IN_GLOBALS,
          "super",
          "import",
          "await"
        ].map((x3) => `${x3}\\s*\\(`)),
        IDENT_RE$1,
        regex.lookahead(/\s*\(/)
      ),
      className: "title.function",
      relevance: 0
    };
    const PROPERTY_ACCESS = {
      begin: regex.concat(/\./, regex.lookahead(
        regex.concat(IDENT_RE$1, /(?![0-9A-Za-z$_(])/)
      )),
      end: IDENT_RE$1,
      excludeBegin: true,
      keywords: "prototype",
      className: "property",
      relevance: 0
    };
    const GETTER_OR_SETTER = {
      match: [
        /get|set/,
        /\s+/,
        IDENT_RE$1,
        /(?=\()/
      ],
      className: {
        1: "keyword",
        3: "title.function"
      },
      contains: [
        {
          // eat to avoid empty params
          begin: /\(\)/
        },
        PARAMS
      ]
    };
    const FUNC_LEAD_IN_RE = "(\\([^()]*(\\([^()]*(\\([^()]*\\)[^()]*)*\\)[^()]*)*\\)|" + hljs2.UNDERSCORE_IDENT_RE + ")\\s*=>";
    const FUNCTION_VARIABLE = {
      match: [
        /const|var|let/,
        /\s+/,
        IDENT_RE$1,
        /\s*/,
        /=\s*/,
        /(async\s*)?/,
        // async is optional
        regex.lookahead(FUNC_LEAD_IN_RE)
      ],
      keywords: "async",
      className: {
        1: "keyword",
        3: "title.function"
      },
      contains: [
        PARAMS
      ]
    };
    return {
      name: "JavaScript",
      aliases: ["js", "jsx", "mjs", "cjs"],
      keywords: KEYWORDS$1,
      // this will be extended by TypeScript
      exports: { PARAMS_CONTAINS, CLASS_REFERENCE },
      illegal: /#(?![$_A-Za-z])/,
      contains: [
        hljs2.SHEBANG({
          label: "shebang",
          binary: "node",
          relevance: 5
        }),
        USE_STRICT,
        hljs2.APOS_STRING_MODE,
        hljs2.QUOTE_STRING_MODE,
        HTML_TEMPLATE,
        CSS_TEMPLATE,
        GRAPHQL_TEMPLATE,
        TEMPLATE_STRING,
        COMMENT,
        // Skip numbers when they are part of a variable name
        { match: /\$\d+/ },
        NUMBER,
        CLASS_REFERENCE,
        {
          scope: "attr",
          match: IDENT_RE$1 + regex.lookahead(":"),
          relevance: 0
        },
        FUNCTION_VARIABLE,
        {
          // "value" container
          begin: "(" + hljs2.RE_STARTERS_RE + "|\\b(case|return|throw)\\b)\\s*",
          keywords: "return throw case",
          relevance: 0,
          contains: [
            COMMENT,
            hljs2.REGEXP_MODE,
            {
              className: "function",
              // we have to count the parens to make sure we actually have the
              // correct bounding ( ) before the =>.  There could be any number of
              // sub-expressions inside also surrounded by parens.
              begin: FUNC_LEAD_IN_RE,
              returnBegin: true,
              end: "\\s*=>",
              contains: [
                {
                  className: "params",
                  variants: [
                    {
                      begin: hljs2.UNDERSCORE_IDENT_RE,
                      relevance: 0
                    },
                    {
                      className: null,
                      begin: /\(\s*\)/,
                      skip: true
                    },
                    {
                      begin: /(\s*)\(/,
                      end: /\)/,
                      excludeBegin: true,
                      excludeEnd: true,
                      keywords: KEYWORDS$1,
                      contains: PARAMS_CONTAINS
                    }
                  ]
                }
              ]
            },
            {
              // could be a comma delimited list of params to a function call
              begin: /,/,
              relevance: 0
            },
            {
              match: /\s+/,
              relevance: 0
            },
            {
              // JSX
              variants: [
                { begin: FRAGMENT.begin, end: FRAGMENT.end },
                { match: XML_SELF_CLOSING },
                {
                  begin: XML_TAG.begin,
                  // we carefully check the opening tag to see if it truly
                  // is a tag and not a false positive
                  "on:begin": XML_TAG.isTrulyOpeningTag,
                  end: XML_TAG.end
                }
              ],
              subLanguage: "xml",
              contains: [
                {
                  begin: XML_TAG.begin,
                  end: XML_TAG.end,
                  skip: true,
                  contains: ["self"]
                }
              ]
            }
          ]
        },
        FUNCTION_DEFINITION,
        {
          // prevent this from getting swallowed up by function
          // since they appear "function like"
          beginKeywords: "while if switch catch for"
        },
        {
          // we have to count the parens to make sure we actually have the correct
          // bounding ( ).  There could be any number of sub-expressions inside
          // also surrounded by parens.
          begin: "\\b(?!function)" + hljs2.UNDERSCORE_IDENT_RE + "\\([^()]*(\\([^()]*(\\([^()]*\\)[^()]*)*\\)[^()]*)*\\)\\s*\\{",
          // end parens
          returnBegin: true,
          label: "func.def",
          contains: [
            PARAMS,
            hljs2.inherit(hljs2.TITLE_MODE, { begin: IDENT_RE$1, className: "title.function" })
          ]
        },
        // catch ... so it won't trigger the property rule below
        {
          match: /\.\.\./,
          relevance: 0
        },
        PROPERTY_ACCESS,
        // hack: prevents detection of keywords in some circumstances
        // .keyword()
        // $keyword = x
        {
          match: "\\$" + IDENT_RE$1,
          relevance: 0
        },
        {
          match: [/\bconstructor(?=\s*\()/],
          className: { 1: "title.function" },
          contains: [PARAMS]
        },
        FUNCTION_CALL,
        UPPER_CASE_CONSTANT,
        CLASS_OR_EXTENDS,
        GETTER_OR_SETTER,
        {
          match: /\$[(.]/
          // relevance booster for a pattern common to JS libs: `$(something)` and `$.something`
        }
      ]
    };
  }

  // node_modules/highlight.js/es/languages/typescript.js
  var IDENT_RE2 = "[A-Za-z$_][0-9A-Za-z$_]*";
  var KEYWORDS2 = [
    "as",
    // for exports
    "in",
    "of",
    "if",
    "for",
    "while",
    "finally",
    "var",
    "new",
    "function",
    "do",
    "return",
    "void",
    "else",
    "break",
    "catch",
    "instanceof",
    "with",
    "throw",
    "case",
    "default",
    "try",
    "switch",
    "continue",
    "typeof",
    "delete",
    "let",
    "yield",
    "const",
    "class",
    // JS handles these with a special rule
    // "get",
    // "set",
    "debugger",
    "async",
    "await",
    "static",
    "import",
    "from",
    "export",
    "extends",
    // It's reached stage 3, which is "recommended for implementation":
    "using"
  ];
  var LITERALS2 = [
    "true",
    "false",
    "null",
    "undefined",
    "NaN",
    "Infinity"
  ];
  var TYPES2 = [
    // Fundamental objects
    "Object",
    "Function",
    "Boolean",
    "Symbol",
    // numbers and dates
    "Math",
    "Date",
    "Number",
    "BigInt",
    // text
    "String",
    "RegExp",
    // Indexed collections
    "Array",
    "Float32Array",
    "Float64Array",
    "Int8Array",
    "Uint8Array",
    "Uint8ClampedArray",
    "Int16Array",
    "Int32Array",
    "Uint16Array",
    "Uint32Array",
    "BigInt64Array",
    "BigUint64Array",
    // Keyed collections
    "Set",
    "Map",
    "WeakSet",
    "WeakMap",
    // Structured data
    "ArrayBuffer",
    "SharedArrayBuffer",
    "Atomics",
    "DataView",
    "JSON",
    // Control abstraction objects
    "Promise",
    "Generator",
    "GeneratorFunction",
    "AsyncFunction",
    // Reflection
    "Reflect",
    "Proxy",
    // Internationalization
    "Intl",
    // WebAssembly
    "WebAssembly"
  ];
  var ERROR_TYPES2 = [
    "Error",
    "EvalError",
    "InternalError",
    "RangeError",
    "ReferenceError",
    "SyntaxError",
    "TypeError",
    "URIError"
  ];
  var BUILT_IN_GLOBALS2 = [
    "setInterval",
    "setTimeout",
    "clearInterval",
    "clearTimeout",
    "require",
    "exports",
    "eval",
    "isFinite",
    "isNaN",
    "parseFloat",
    "parseInt",
    "decodeURI",
    "decodeURIComponent",
    "encodeURI",
    "encodeURIComponent",
    "escape",
    "unescape"
  ];
  var BUILT_IN_VARIABLES2 = [
    "arguments",
    "this",
    "super",
    "console",
    "window",
    "document",
    "localStorage",
    "sessionStorage",
    "module",
    "self",
    "global"
    // Node.js
  ];
  var BUILT_INS2 = [].concat(
    BUILT_IN_GLOBALS2,
    TYPES2,
    ERROR_TYPES2
  );
  function javascript2(hljs2) {
    const regex = hljs2.regex;
    const hasClosingTag = (match, { after }) => {
      const tag = "</" + match[0].slice(1);
      const pos = match.input.indexOf(tag, after);
      return pos !== -1;
    };
    const IDENT_RE$1 = IDENT_RE2;
    const FRAGMENT = {
      begin: "<>",
      end: "</>"
    };
    const XML_SELF_CLOSING = /<[A-Za-z0-9\\._:-]+\s*\/>/;
    const XML_TAG = {
      begin: /<[A-Za-z0-9\\._:-]+/,
      end: /\/[A-Za-z0-9\\._:-]+>|\/>/,
      /**
       * @param {RegExpMatchArray} match
       * @param {CallbackResponse} response
       */
      isTrulyOpeningTag: (match, response) => {
        const afterMatchIndex = match[0].length + match.index;
        const nextChar = match.input[afterMatchIndex];
        if (
          // HTML should not include another raw `<` inside a tag
          // nested type?
          // `<Array<Array<number>>`, etc.
          nextChar === "<" || // the , gives away that this is not HTML
          // `<T, A extends keyof T, V>`
          nextChar === ","
        ) {
          response.ignoreMatch();
          return;
        }
        if (nextChar === ">") {
          if (!hasClosingTag(match, { after: afterMatchIndex })) {
            response.ignoreMatch();
          }
        }
        let m3;
        const afterMatch = match.input.substring(afterMatchIndex);
        if (m3 = afterMatch.match(/^\s*=/)) {
          response.ignoreMatch();
          return;
        }
        if (m3 = afterMatch.match(/^\s+extends\s+/)) {
          if (m3.index === 0) {
            response.ignoreMatch();
            return;
          }
        }
      }
    };
    const KEYWORDS$1 = {
      $pattern: IDENT_RE2,
      keyword: KEYWORDS2,
      literal: LITERALS2,
      built_in: BUILT_INS2,
      "variable.language": BUILT_IN_VARIABLES2
    };
    const decimalDigits3 = "[0-9](_?[0-9])*";
    const frac3 = `\\.(${decimalDigits3})`;
    const decimalInteger = `0|[1-9](_?[0-9])*|0[0-7]*[89][0-9]*`;
    const NUMBER = {
      className: "number",
      variants: [
        // DecimalLiteral
        { begin: `(\\b(${decimalInteger})((${frac3})|\\.)?|(${frac3}))[eE][+-]?(${decimalDigits3})\\b` },
        { begin: `\\b(${decimalInteger})\\b((${frac3})\\b|\\.)?|(${frac3})\\b` },
        // DecimalBigIntegerLiteral
        { begin: `\\b(0|[1-9](_?[0-9])*)n\\b` },
        // NonDecimalIntegerLiteral
        { begin: "\\b0[xX][0-9a-fA-F](_?[0-9a-fA-F])*n?\\b" },
        { begin: "\\b0[bB][0-1](_?[0-1])*n?\\b" },
        { begin: "\\b0[oO][0-7](_?[0-7])*n?\\b" },
        // LegacyOctalIntegerLiteral (does not include underscore separators)
        // https://tc39.es/ecma262/#sec-additional-syntax-numeric-literals
        { begin: "\\b0[0-7]+n?\\b" }
      ],
      relevance: 0
    };
    const SUBST = {
      className: "subst",
      begin: "\\$\\{",
      end: "\\}",
      keywords: KEYWORDS$1,
      contains: []
      // defined later
    };
    const HTML_TEMPLATE = {
      begin: ".?html`",
      end: "",
      starts: {
        end: "`",
        returnEnd: false,
        contains: [
          hljs2.BACKSLASH_ESCAPE,
          SUBST
        ],
        subLanguage: "xml"
      }
    };
    const CSS_TEMPLATE = {
      begin: ".?css`",
      end: "",
      starts: {
        end: "`",
        returnEnd: false,
        contains: [
          hljs2.BACKSLASH_ESCAPE,
          SUBST
        ],
        subLanguage: "css"
      }
    };
    const GRAPHQL_TEMPLATE = {
      begin: ".?gql`",
      end: "",
      starts: {
        end: "`",
        returnEnd: false,
        contains: [
          hljs2.BACKSLASH_ESCAPE,
          SUBST
        ],
        subLanguage: "graphql"
      }
    };
    const TEMPLATE_STRING = {
      className: "string",
      begin: "`",
      end: "`",
      contains: [
        hljs2.BACKSLASH_ESCAPE,
        SUBST
      ]
    };
    const JSDOC_COMMENT = hljs2.COMMENT(
      /\/\*\*(?!\/)/,
      "\\*/",
      {
        relevance: 0,
        contains: [
          {
            begin: "(?=@[A-Za-z]+)",
            relevance: 0,
            contains: [
              {
                className: "doctag",
                begin: "@[A-Za-z]+"
              },
              {
                className: "type",
                begin: "\\{",
                end: "\\}",
                excludeEnd: true,
                excludeBegin: true,
                relevance: 0
              },
              {
                className: "variable",
                begin: IDENT_RE$1 + "(?=\\s*(-)|$)",
                endsParent: true,
                relevance: 0
              },
              // eat spaces (not newlines) so we can find
              // types or variables
              {
                begin: /(?=[^\n])\s/,
                relevance: 0
              }
            ]
          }
        ]
      }
    );
    const COMMENT = {
      className: "comment",
      variants: [
        JSDOC_COMMENT,
        hljs2.C_BLOCK_COMMENT_MODE,
        hljs2.C_LINE_COMMENT_MODE
      ]
    };
    const SUBST_INTERNALS = [
      hljs2.APOS_STRING_MODE,
      hljs2.QUOTE_STRING_MODE,
      HTML_TEMPLATE,
      CSS_TEMPLATE,
      GRAPHQL_TEMPLATE,
      TEMPLATE_STRING,
      // Skip numbers when they are part of a variable name
      { match: /\$\d+/ },
      NUMBER
      // This is intentional:
      // See https://github.com/highlightjs/highlight.js/issues/3288
      // hljs.REGEXP_MODE
    ];
    SUBST.contains = SUBST_INTERNALS.concat({
      // we need to pair up {} inside our subst to prevent
      // it from ending too early by matching another }
      begin: /\{/,
      end: /\}/,
      keywords: KEYWORDS$1,
      contains: [
        "self"
      ].concat(SUBST_INTERNALS)
    });
    const SUBST_AND_COMMENTS = [].concat(COMMENT, SUBST.contains);
    const PARAMS_CONTAINS = SUBST_AND_COMMENTS.concat([
      // eat recursive parens in sub expressions
      {
        begin: /(\s*)\(/,
        end: /\)/,
        keywords: KEYWORDS$1,
        contains: ["self"].concat(SUBST_AND_COMMENTS)
      }
    ]);
    const PARAMS = {
      className: "params",
      // convert this to negative lookbehind in v12
      begin: /(\s*)\(/,
      // to match the parms with
      end: /\)/,
      excludeBegin: true,
      excludeEnd: true,
      keywords: KEYWORDS$1,
      contains: PARAMS_CONTAINS
    };
    const CLASS_OR_EXTENDS = {
      variants: [
        // class Car extends vehicle
        {
          match: [
            /class/,
            /\s+/,
            IDENT_RE$1,
            /\s+/,
            /extends/,
            /\s+/,
            regex.concat(IDENT_RE$1, "(", regex.concat(/\./, IDENT_RE$1), ")*")
          ],
          scope: {
            1: "keyword",
            3: "title.class",
            5: "keyword",
            7: "title.class.inherited"
          }
        },
        // class Car
        {
          match: [
            /class/,
            /\s+/,
            IDENT_RE$1
          ],
          scope: {
            1: "keyword",
            3: "title.class"
          }
        }
      ]
    };
    const CLASS_REFERENCE = {
      relevance: 0,
      match: regex.either(
        // Hard coded exceptions
        /\bJSON/,
        // Float32Array, OutT
        /\b[A-Z][a-z]+([A-Z][a-z]*|\d)*/,
        // CSSFactory, CSSFactoryT
        /\b[A-Z]{2,}([A-Z][a-z]+|\d)+([A-Z][a-z]*)*/,
        // FPs, FPsT
        /\b[A-Z]{2,}[a-z]+([A-Z][a-z]+|\d)*([A-Z][a-z]*)*/
        // P
        // single letters are not highlighted
        // BLAH
        // this will be flagged as a UPPER_CASE_CONSTANT instead
      ),
      className: "title.class",
      keywords: {
        _: [
          // se we still get relevance credit for JS library classes
          ...TYPES2,
          ...ERROR_TYPES2
        ]
      }
    };
    const USE_STRICT = {
      label: "use_strict",
      className: "meta",
      relevance: 10,
      begin: /^\s*['"]use (strict|asm)['"]/
    };
    const FUNCTION_DEFINITION = {
      variants: [
        {
          match: [
            /function/,
            /\s+/,
            IDENT_RE$1,
            /(?=\s*\()/
          ]
        },
        // anonymous function
        {
          match: [
            /function/,
            /\s*(?=\()/
          ]
        }
      ],
      className: {
        1: "keyword",
        3: "title.function"
      },
      label: "func.def",
      contains: [PARAMS],
      illegal: /%/
    };
    const UPPER_CASE_CONSTANT = {
      relevance: 0,
      match: /\b[A-Z][A-Z_0-9]+\b/,
      className: "variable.constant"
    };
    function noneOf(list) {
      return regex.concat("(?!", list.join("|"), ")");
    }
    const FUNCTION_CALL = {
      match: regex.concat(
        /\b/,
        noneOf([
          ...BUILT_IN_GLOBALS2,
          "super",
          "import",
          "await"
        ].map((x3) => `${x3}\\s*\\(`)),
        IDENT_RE$1,
        regex.lookahead(/\s*\(/)
      ),
      className: "title.function",
      relevance: 0
    };
    const PROPERTY_ACCESS = {
      begin: regex.concat(/\./, regex.lookahead(
        regex.concat(IDENT_RE$1, /(?![0-9A-Za-z$_(])/)
      )),
      end: IDENT_RE$1,
      excludeBegin: true,
      keywords: "prototype",
      className: "property",
      relevance: 0
    };
    const GETTER_OR_SETTER = {
      match: [
        /get|set/,
        /\s+/,
        IDENT_RE$1,
        /(?=\()/
      ],
      className: {
        1: "keyword",
        3: "title.function"
      },
      contains: [
        {
          // eat to avoid empty params
          begin: /\(\)/
        },
        PARAMS
      ]
    };
    const FUNC_LEAD_IN_RE = "(\\([^()]*(\\([^()]*(\\([^()]*\\)[^()]*)*\\)[^()]*)*\\)|" + hljs2.UNDERSCORE_IDENT_RE + ")\\s*=>";
    const FUNCTION_VARIABLE = {
      match: [
        /const|var|let/,
        /\s+/,
        IDENT_RE$1,
        /\s*/,
        /=\s*/,
        /(async\s*)?/,
        // async is optional
        regex.lookahead(FUNC_LEAD_IN_RE)
      ],
      keywords: "async",
      className: {
        1: "keyword",
        3: "title.function"
      },
      contains: [
        PARAMS
      ]
    };
    return {
      name: "JavaScript",
      aliases: ["js", "jsx", "mjs", "cjs"],
      keywords: KEYWORDS$1,
      // this will be extended by TypeScript
      exports: { PARAMS_CONTAINS, CLASS_REFERENCE },
      illegal: /#(?![$_A-Za-z])/,
      contains: [
        hljs2.SHEBANG({
          label: "shebang",
          binary: "node",
          relevance: 5
        }),
        USE_STRICT,
        hljs2.APOS_STRING_MODE,
        hljs2.QUOTE_STRING_MODE,
        HTML_TEMPLATE,
        CSS_TEMPLATE,
        GRAPHQL_TEMPLATE,
        TEMPLATE_STRING,
        COMMENT,
        // Skip numbers when they are part of a variable name
        { match: /\$\d+/ },
        NUMBER,
        CLASS_REFERENCE,
        {
          scope: "attr",
          match: IDENT_RE$1 + regex.lookahead(":"),
          relevance: 0
        },
        FUNCTION_VARIABLE,
        {
          // "value" container
          begin: "(" + hljs2.RE_STARTERS_RE + "|\\b(case|return|throw)\\b)\\s*",
          keywords: "return throw case",
          relevance: 0,
          contains: [
            COMMENT,
            hljs2.REGEXP_MODE,
            {
              className: "function",
              // we have to count the parens to make sure we actually have the
              // correct bounding ( ) before the =>.  There could be any number of
              // sub-expressions inside also surrounded by parens.
              begin: FUNC_LEAD_IN_RE,
              returnBegin: true,
              end: "\\s*=>",
              contains: [
                {
                  className: "params",
                  variants: [
                    {
                      begin: hljs2.UNDERSCORE_IDENT_RE,
                      relevance: 0
                    },
                    {
                      className: null,
                      begin: /\(\s*\)/,
                      skip: true
                    },
                    {
                      begin: /(\s*)\(/,
                      end: /\)/,
                      excludeBegin: true,
                      excludeEnd: true,
                      keywords: KEYWORDS$1,
                      contains: PARAMS_CONTAINS
                    }
                  ]
                }
              ]
            },
            {
              // could be a comma delimited list of params to a function call
              begin: /,/,
              relevance: 0
            },
            {
              match: /\s+/,
              relevance: 0
            },
            {
              // JSX
              variants: [
                { begin: FRAGMENT.begin, end: FRAGMENT.end },
                { match: XML_SELF_CLOSING },
                {
                  begin: XML_TAG.begin,
                  // we carefully check the opening tag to see if it truly
                  // is a tag and not a false positive
                  "on:begin": XML_TAG.isTrulyOpeningTag,
                  end: XML_TAG.end
                }
              ],
              subLanguage: "xml",
              contains: [
                {
                  begin: XML_TAG.begin,
                  end: XML_TAG.end,
                  skip: true,
                  contains: ["self"]
                }
              ]
            }
          ]
        },
        FUNCTION_DEFINITION,
        {
          // prevent this from getting swallowed up by function
          // since they appear "function like"
          beginKeywords: "while if switch catch for"
        },
        {
          // we have to count the parens to make sure we actually have the correct
          // bounding ( ).  There could be any number of sub-expressions inside
          // also surrounded by parens.
          begin: "\\b(?!function)" + hljs2.UNDERSCORE_IDENT_RE + "\\([^()]*(\\([^()]*(\\([^()]*\\)[^()]*)*\\)[^()]*)*\\)\\s*\\{",
          // end parens
          returnBegin: true,
          label: "func.def",
          contains: [
            PARAMS,
            hljs2.inherit(hljs2.TITLE_MODE, { begin: IDENT_RE$1, className: "title.function" })
          ]
        },
        // catch ... so it won't trigger the property rule below
        {
          match: /\.\.\./,
          relevance: 0
        },
        PROPERTY_ACCESS,
        // hack: prevents detection of keywords in some circumstances
        // .keyword()
        // $keyword = x
        {
          match: "\\$" + IDENT_RE$1,
          relevance: 0
        },
        {
          match: [/\bconstructor(?=\s*\()/],
          className: { 1: "title.function" },
          contains: [PARAMS]
        },
        FUNCTION_CALL,
        UPPER_CASE_CONSTANT,
        CLASS_OR_EXTENDS,
        GETTER_OR_SETTER,
        {
          match: /\$[(.]/
          // relevance booster for a pattern common to JS libs: `$(something)` and `$.something`
        }
      ]
    };
  }
  function typescript(hljs2) {
    const regex = hljs2.regex;
    const tsLanguage = javascript2(hljs2);
    const IDENT_RE$1 = IDENT_RE2;
    const TYPES3 = [
      "any",
      "void",
      "number",
      "boolean",
      "string",
      "object",
      "never",
      "symbol",
      "bigint",
      "unknown"
    ];
    const NAMESPACE = {
      begin: [
        /namespace/,
        /\s+/,
        hljs2.IDENT_RE
      ],
      beginScope: {
        1: "keyword",
        3: "title.class"
      }
    };
    const INTERFACE = {
      beginKeywords: "interface",
      end: /\{/,
      excludeEnd: true,
      keywords: {
        keyword: "interface extends",
        built_in: TYPES3
      },
      contains: [tsLanguage.exports.CLASS_REFERENCE]
    };
    const USE_STRICT = {
      className: "meta",
      relevance: 10,
      begin: /^\s*['"]use strict['"]/
    };
    const TS_SPECIFIC_KEYWORDS = [
      "type",
      // "namespace",
      "interface",
      "public",
      "private",
      "protected",
      "implements",
      "declare",
      "abstract",
      "readonly",
      "enum",
      "override",
      "satisfies"
    ];
    const KEYWORDS$1 = {
      $pattern: IDENT_RE2,
      keyword: KEYWORDS2.concat(TS_SPECIFIC_KEYWORDS),
      literal: LITERALS2,
      built_in: BUILT_INS2.concat(TYPES3),
      "variable.language": BUILT_IN_VARIABLES2
    };
    const DECORATOR = {
      className: "meta",
      begin: "@" + IDENT_RE$1
    };
    const swapMode = (mode, label, replacement) => {
      const indx = mode.contains.findIndex((m3) => m3.label === label);
      if (indx === -1) {
        throw new Error("can not find mode to replace");
      }
      mode.contains.splice(indx, 1, replacement);
    };
    Object.assign(tsLanguage.keywords, KEYWORDS$1);
    tsLanguage.exports.PARAMS_CONTAINS.push(DECORATOR);
    const ATTRIBUTE_HIGHLIGHT = tsLanguage.contains.find((c3) => c3.scope === "attr");
    const OPTIONAL_KEY_OR_ARGUMENT = Object.assign(
      {},
      ATTRIBUTE_HIGHLIGHT,
      { match: regex.concat(IDENT_RE$1, regex.lookahead(/\s*\?:/)) }
    );
    tsLanguage.exports.PARAMS_CONTAINS.push([
      tsLanguage.exports.CLASS_REFERENCE,
      // class reference for highlighting the params types
      ATTRIBUTE_HIGHLIGHT,
      // highlight the params key
      OPTIONAL_KEY_OR_ARGUMENT
      // Added for optional property assignment highlighting
    ]);
    tsLanguage.contains = tsLanguage.contains.concat([
      DECORATOR,
      NAMESPACE,
      INTERFACE,
      OPTIONAL_KEY_OR_ARGUMENT
      // Added for optional property assignment highlighting
    ]);
    swapMode(tsLanguage, "shebang", hljs2.SHEBANG());
    swapMode(tsLanguage, "use_strict", USE_STRICT);
    const functionDeclaration = tsLanguage.contains.find((m3) => m3.label === "func.def");
    functionDeclaration.relevance = 0;
    Object.assign(tsLanguage, {
      name: "TypeScript",
      aliases: [
        "ts",
        "tsx",
        "mts",
        "cts"
      ]
    });
    return tsLanguage;
  }

  // node_modules/highlight.js/es/languages/python.js
  function python(hljs2) {
    const regex = hljs2.regex;
    const IDENT_RE3 = new RegExp("[\\p{XID_Start}_]\\p{XID_Continue}*", "u");
    const RESERVED_WORDS = [
      "and",
      "as",
      "assert",
      "async",
      "await",
      "break",
      "case",
      "class",
      "continue",
      "def",
      "del",
      "elif",
      "else",
      "except",
      "finally",
      "for",
      "from",
      "global",
      "if",
      "import",
      "in",
      "is",
      "lambda",
      "lazy",
      "match",
      "nonlocal|10",
      "not",
      "or",
      "pass",
      "raise",
      "return",
      "try",
      "while",
      "with",
      "yield"
    ];
    const BUILT_INS3 = [
      "__import__",
      "abs",
      "aiter",
      "all",
      "anext",
      "any",
      "ascii",
      "bin",
      "bool",
      "breakpoint",
      "bytearray",
      "bytes",
      "callable",
      "chr",
      "classmethod",
      "compile",
      "complex",
      "delattr",
      "dict",
      "dir",
      "divmod",
      "enumerate",
      "eval",
      "exec",
      "filter",
      "float",
      "format",
      "frozendict",
      "frozenset",
      "getattr",
      "globals",
      "hasattr",
      "hash",
      "help",
      "hex",
      "id",
      "input",
      "int",
      "isinstance",
      "issubclass",
      "iter",
      "len",
      "list",
      "locals",
      "map",
      "max",
      "memoryview",
      "min",
      "next",
      "object",
      "oct",
      "open",
      "ord",
      "pow",
      "print",
      "property",
      "range",
      "repr",
      "reversed",
      "round",
      "sentinel",
      "set",
      "setattr",
      "slice",
      "sorted",
      "staticmethod",
      "str",
      "sum",
      "super",
      "tuple",
      "type",
      "vars",
      "zip"
    ];
    const LITERALS3 = [
      "__debug__",
      "Ellipsis",
      "False",
      "None",
      "NotImplemented",
      "True"
    ];
    const TYPES3 = [
      "Any",
      "Callable",
      "Coroutine",
      "Dict",
      "List",
      "Literal",
      "Generic",
      "Optional",
      "Sequence",
      "Set",
      "Tuple",
      "Type",
      "Union"
    ];
    const KEYWORDS3 = {
      $pattern: /[A-Za-z]\w+|__\w+__/,
      keyword: RESERVED_WORDS,
      built_in: BUILT_INS3,
      literal: LITERALS3,
      type: TYPES3
    };
    const PROMPT = {
      className: "meta",
      begin: /^(>>>|\.\.\.) /
    };
    const SUBST = {
      className: "subst",
      begin: /\{/,
      end: /\}/,
      keywords: KEYWORDS3,
      illegal: /#/
    };
    const LITERAL_BRACKET = {
      begin: /\{\{/,
      relevance: 0
    };
    const STRING = {
      className: "string",
      contains: [hljs2.BACKSLASH_ESCAPE],
      variants: [
        {
          begin: /([uU]|[bB]|[rR]|[bB][rR]|[rR][bB])?'''/,
          end: /'''/,
          contains: [
            hljs2.BACKSLASH_ESCAPE,
            PROMPT
          ],
          relevance: 10
        },
        {
          begin: /([uU]|[bB]|[rR]|[bB][rR]|[rR][bB])?"""/,
          end: /"""/,
          contains: [
            hljs2.BACKSLASH_ESCAPE,
            PROMPT
          ],
          relevance: 10
        },
        {
          begin: /([fFtT][rR]|[rR][fFtT]|[fFtT])'''/,
          end: /'''/,
          contains: [
            hljs2.BACKSLASH_ESCAPE,
            PROMPT,
            LITERAL_BRACKET,
            SUBST
          ]
        },
        {
          begin: /([fFtT][rR]|[rR][fFtT]|[fFtT])"""/,
          end: /"""/,
          contains: [
            hljs2.BACKSLASH_ESCAPE,
            PROMPT,
            LITERAL_BRACKET,
            SUBST
          ]
        },
        {
          begin: /([uU]|[rR])'/,
          end: /'/,
          relevance: 10
        },
        {
          begin: /([uU]|[rR])"/,
          end: /"/,
          relevance: 10
        },
        {
          begin: /([bB]|[bB][rR]|[rR][bB])'/,
          end: /'/
        },
        {
          begin: /([bB]|[bB][rR]|[rR][bB])"/,
          end: /"/
        },
        {
          begin: /([fFtT][rR]|[rR][fFtT]|[fFtT])'/,
          end: /'/,
          contains: [
            hljs2.BACKSLASH_ESCAPE,
            LITERAL_BRACKET,
            SUBST
          ]
        },
        {
          begin: /([fFtT][rR]|[rR][fFtT]|[fFtT])"/,
          end: /"/,
          contains: [
            hljs2.BACKSLASH_ESCAPE,
            LITERAL_BRACKET,
            SUBST
          ]
        },
        hljs2.APOS_STRING_MODE,
        hljs2.QUOTE_STRING_MODE
      ]
    };
    const digitpart = "[0-9](_?[0-9])*";
    const pointfloat = `(\\b(${digitpart}))?\\.(${digitpart})|\\b(${digitpart})\\.`;
    const lookahead2 = `\\b|${RESERVED_WORDS.join("|")}`;
    const NUMBER = {
      className: "number",
      relevance: 0,
      variants: [
        // exponentfloat, pointfloat
        // https://docs.python.org/3.9/reference/lexical_analysis.html#floating-point-literals
        // optionally imaginary
        // https://docs.python.org/3.9/reference/lexical_analysis.html#imaginary-literals
        // Note: no leading \b because floats can start with a decimal point
        // and we don't want to mishandle e.g. `fn(.5)`,
        // no trailing \b for pointfloat because it can end with a decimal point
        // and we don't want to mishandle e.g. `0..hex()`; this should be safe
        // because both MUST contain a decimal point and so cannot be confused with
        // the interior part of an identifier
        {
          begin: `(\\b(${digitpart})|(${pointfloat}))[eE][+-]?(${digitpart})[jJ]?(?=${lookahead2})`
        },
        {
          begin: `(${pointfloat})[jJ]?`
        },
        // decinteger, bininteger, octinteger, hexinteger
        // https://docs.python.org/3.9/reference/lexical_analysis.html#integer-literals
        // optionally "long" in Python 2
        // https://docs.python.org/2.7/reference/lexical_analysis.html#integer-and-long-integer-literals
        // decinteger is optionally imaginary
        // https://docs.python.org/3.9/reference/lexical_analysis.html#imaginary-literals
        {
          begin: `\\b([1-9](_?[0-9])*|0+(_?0)*)[lLjJ]?(?=${lookahead2})`
        },
        {
          begin: `\\b0[bB](_?[01])+[lL]?(?=${lookahead2})`
        },
        {
          begin: `\\b0[oO](_?[0-7])+[lL]?(?=${lookahead2})`
        },
        {
          begin: `\\b0[xX](_?[0-9a-fA-F])+[lL]?(?=${lookahead2})`
        },
        // imagnumber (digitpart-based)
        // https://docs.python.org/3.9/reference/lexical_analysis.html#imaginary-literals
        {
          begin: `\\b(${digitpart})[jJ](?=${lookahead2})`
        }
      ]
    };
    const COMMENT_TYPE = {
      className: "comment",
      begin: regex.lookahead(/# type:/),
      end: /$/,
      keywords: KEYWORDS3,
      contains: [
        {
          // prevent keywords from coloring `type`
          begin: /# type:/
        },
        // comment within a datatype comment includes no keywords
        {
          begin: /#/,
          end: /\b\B/,
          endsWithParent: true
        }
      ]
    };
    const PARAMS = {
      className: "params",
      variants: [
        // Exclude params in functions without params
        {
          className: "",
          begin: /\(\s*\)/,
          skip: true
        },
        {
          begin: /\(/,
          end: /\)/,
          excludeBegin: true,
          excludeEnd: true,
          keywords: KEYWORDS3,
          contains: [
            "self",
            PROMPT,
            NUMBER,
            STRING,
            hljs2.HASH_COMMENT_MODE
          ]
        }
      ]
    };
    SUBST.contains = [
      STRING,
      NUMBER,
      PROMPT
    ];
    return {
      name: "Python",
      aliases: [
        "py",
        "gyp",
        "ipython"
      ],
      unicodeRegex: true,
      keywords: KEYWORDS3,
      illegal: /(<\/|\?)|=>/,
      contains: [
        PROMPT,
        NUMBER,
        {
          // very common convention
          scope: "variable.language",
          match: /\bself\b/
        },
        {
          // eat "if" prior to string so that it won't accidentally be
          // labeled as an f-string
          beginKeywords: "if",
          relevance: 0
        },
        { match: /\bor\b/, scope: "keyword" },
        STRING,
        COMMENT_TYPE,
        hljs2.HASH_COMMENT_MODE,
        {
          match: [
            /\bdef/,
            /\s+/,
            IDENT_RE3
          ],
          scope: {
            1: "keyword",
            3: "title.function"
          },
          contains: [PARAMS]
        },
        {
          variants: [
            {
              match: [
                /\bclass/,
                /\s+/,
                IDENT_RE3,
                /\s*/,
                /\(\s*/,
                IDENT_RE3,
                /\s*\)/
              ]
            },
            {
              match: [
                /\bclass/,
                /\s+/,
                IDENT_RE3
              ]
            }
          ],
          scope: {
            1: "keyword",
            3: "title.class",
            6: "title.class.inherited"
          }
        },
        {
          className: "meta",
          begin: /^[\t ]*@/,
          end: /(?=#)|$/,
          contains: [
            NUMBER,
            PARAMS,
            STRING
          ]
        }
      ]
    };
  }

  // node_modules/highlight.js/es/languages/bash.js
  function bash(hljs2) {
    const regex = hljs2.regex;
    const VAR = {};
    const BRACED_VAR = {
      begin: /\$\{/,
      end: /\}/,
      contains: [
        "self",
        {
          begin: /:-/,
          contains: [VAR]
        }
        // default values
      ]
    };
    Object.assign(VAR, {
      className: "variable",
      variants: [
        { begin: regex.concat(
          /\$[\w\d#@][\w\d_]*/,
          // negative look-ahead tries to avoid matching patterns that are not
          // Perl at all like $ident$, @ident@, etc.
          `(?![\\w\\d])(?![$])`
        ) },
        BRACED_VAR
      ]
    });
    const SUBST = {
      className: "subst",
      begin: /\$\(/,
      end: /\)/,
      contains: [hljs2.BACKSLASH_ESCAPE]
    };
    const COMMENT = hljs2.inherit(
      hljs2.COMMENT(),
      {
        match: [
          /(^|\s)/,
          /#.*$/
        ],
        scope: {
          2: "comment"
        }
      }
    );
    const HERE_DOC = {
      begin: /<<-?\s*(?=\w+)/,
      starts: { contains: [
        hljs2.END_SAME_AS_BEGIN({
          begin: /(\w+)/,
          end: /(\w+)/,
          className: "string"
        })
      ] }
    };
    const QUOTE_STRING = {
      className: "string",
      begin: /"/,
      end: /"/,
      contains: [
        hljs2.BACKSLASH_ESCAPE,
        VAR,
        SUBST
      ]
    };
    SUBST.contains.push(QUOTE_STRING);
    const ESCAPED_QUOTE = {
      match: /\\"/
    };
    const APOS_STRING = {
      className: "string",
      begin: /'/,
      end: /'/
    };
    const ESCAPED_APOS = {
      match: /\\'/
    };
    const ARITHMETIC = {
      begin: /\$?\(\(/,
      end: /\)\)/,
      contains: [
        {
          begin: /\d+#[0-9a-f]+/,
          className: "number"
        },
        hljs2.NUMBER_MODE,
        VAR
      ]
    };
    const SH_LIKE_SHELLS = [
      "fish",
      "bash",
      "zsh",
      "sh",
      "csh",
      "ksh",
      "tcsh",
      "dash",
      "scsh"
    ];
    const KNOWN_SHEBANG = hljs2.SHEBANG({
      binary: `(${SH_LIKE_SHELLS.join("|")})`,
      relevance: 10
    });
    const FUNCTION = {
      className: "function",
      begin: /\w[\w\d_]*\s*\(\s*\)\s*\{/,
      returnBegin: true,
      contains: [hljs2.inherit(hljs2.TITLE_MODE, { begin: /\w[\w\d_]*/ })],
      relevance: 0
    };
    const KEYWORDS3 = [
      "if",
      "then",
      "else",
      "elif",
      "fi",
      "time",
      "for",
      "while",
      "until",
      "in",
      "do",
      "done",
      "case",
      "esac",
      "coproc",
      "function",
      "select"
    ];
    const LITERALS3 = [
      "true",
      "false"
    ];
    const PATH_MODE = { match: /(\/[a-z._-]+)+/ };
    const SHELL_BUILT_INS = [
      "break",
      "cd",
      "continue",
      "eval",
      "exec",
      "exit",
      "export",
      "getopts",
      "hash",
      "pwd",
      "readonly",
      "return",
      "shift",
      "test",
      "times",
      "trap",
      "umask",
      "unset"
    ];
    const BASH_BUILT_INS = [
      "alias",
      "bind",
      "builtin",
      "caller",
      "command",
      "declare",
      "echo",
      "enable",
      "help",
      "let",
      "local",
      "logout",
      "mapfile",
      "printf",
      "read",
      "readarray",
      "source",
      "sudo",
      "type",
      "typeset",
      "ulimit",
      "unalias"
    ];
    const ZSH_BUILT_INS = [
      "autoload",
      "bg",
      "bindkey",
      "bye",
      "cap",
      "chdir",
      "clone",
      "comparguments",
      "compcall",
      "compctl",
      "compdescribe",
      "compfiles",
      "compgroups",
      "compquote",
      "comptags",
      "comptry",
      "compvalues",
      "dirs",
      "disable",
      "disown",
      "echotc",
      "echoti",
      "emulate",
      "fc",
      "fg",
      "float",
      "functions",
      "getcap",
      "getln",
      "history",
      "integer",
      "jobs",
      "kill",
      "limit",
      "log",
      "noglob",
      "popd",
      "print",
      "pushd",
      "pushln",
      "rehash",
      "sched",
      "setcap",
      "setopt",
      "stat",
      "suspend",
      "ttyctl",
      "unfunction",
      "unhash",
      "unlimit",
      "unsetopt",
      "vared",
      "wait",
      "whence",
      "where",
      "which",
      "zcompile",
      "zformat",
      "zftp",
      "zle",
      "zmodload",
      "zparseopts",
      "zprof",
      "zpty",
      "zregexparse",
      "zsocket",
      "zstyle",
      "ztcp"
    ];
    const GNU_CORE_UTILS = [
      "chcon",
      "chgrp",
      "chown",
      "chmod",
      "cp",
      "dd",
      "df",
      "dir",
      "dircolors",
      "ln",
      "ls",
      "mkdir",
      "mkfifo",
      "mknod",
      "mktemp",
      "mv",
      "realpath",
      "rm",
      "rmdir",
      "shred",
      "sync",
      "touch",
      "truncate",
      "vdir",
      "b2sum",
      "base32",
      "base64",
      "cat",
      "cksum",
      "comm",
      "csplit",
      "cut",
      "expand",
      "fmt",
      "fold",
      "head",
      "join",
      "md5sum",
      "nl",
      "numfmt",
      "od",
      "paste",
      "ptx",
      "pr",
      "sha1sum",
      "sha224sum",
      "sha256sum",
      "sha384sum",
      "sha512sum",
      "shuf",
      "sort",
      "split",
      "sum",
      "tac",
      "tail",
      "tr",
      "tsort",
      "unexpand",
      "uniq",
      "wc",
      "arch",
      "basename",
      "chroot",
      "date",
      "dirname",
      "du",
      "echo",
      "env",
      "expr",
      "factor",
      // "false", // keyword literal already
      "groups",
      "hostid",
      "id",
      "link",
      "logname",
      "nice",
      "nohup",
      "nproc",
      "pathchk",
      "pinky",
      "printenv",
      "printf",
      "pwd",
      "readlink",
      "runcon",
      "seq",
      "sleep",
      "stat",
      "stdbuf",
      "stty",
      "tee",
      "test",
      "timeout",
      // "true", // keyword literal already
      "tty",
      "uname",
      "unlink",
      "uptime",
      "users",
      "who",
      "whoami",
      "yes"
    ];
    return {
      name: "Bash",
      aliases: [
        "sh",
        "zsh"
      ],
      keywords: {
        $pattern: /\b[a-z][a-z0-9._-]+\b/,
        keyword: KEYWORDS3,
        literal: LITERALS3,
        built_in: [
          ...SHELL_BUILT_INS,
          ...BASH_BUILT_INS,
          // Shell modifiers
          "set",
          "shopt",
          ...ZSH_BUILT_INS,
          ...GNU_CORE_UTILS
        ]
      },
      contains: [
        KNOWN_SHEBANG,
        // to catch known shells and boost relevancy
        hljs2.SHEBANG(),
        // to catch unknown shells but still highlight the shebang
        FUNCTION,
        ARITHMETIC,
        COMMENT,
        HERE_DOC,
        PATH_MODE,
        QUOTE_STRING,
        ESCAPED_QUOTE,
        APOS_STRING,
        ESCAPED_APOS,
        VAR
      ]
    };
  }

  // node_modules/highlight.js/es/languages/shell.js
  function shell(hljs2) {
    return {
      name: "Shell Session",
      aliases: [
        "console",
        "shellsession"
      ],
      contains: [
        {
          className: "meta.prompt",
          // We cannot add \s (spaces) in the regular expression otherwise it will be too broad and produce unexpected result.
          // For instance, in the following example, it would match "echo /path/to/home >" as a prompt:
          // echo /path/to/home > t.exe
          begin: /^\s{0,3}[./~\w\d[\]()@-]*[>%$#][ ]?/,
          starts: {
            end: /[^\\](?=\s*$)/,
            subLanguage: "bash"
          }
        }
      ]
    };
  }

  // node_modules/highlight.js/es/languages/json.js
  var EXTENDED_NUMBER_RE = "([-+]?)(\\b0[xX][a-fA-F0-9]+|(\\b\\d+(\\.\\d*)?|\\.\\d+)([eE][-+]?\\d+)?)|NaN|[-+]?Infinity";
  var EXTENDED_NUMBER_MODE = {
    scope: "number",
    match: EXTENDED_NUMBER_RE,
    relevance: 0
  };
  function json(hljs2) {
    const ATTRIBUTE = {
      className: "attr",
      begin: /(("(\\.|[^\\"\r\n])*")|('(\\.|[^\\'\r\n])*'))(?=\s*:)/,
      relevance: 1.01
    };
    const PUNCTUATION = {
      match: /[{}[\],:]/,
      className: "punctuation",
      relevance: 0
    };
    const LITERALS3 = [
      "true",
      "false",
      "null"
    ];
    const LITERALS_MODE = {
      scope: "literal",
      beginKeywords: LITERALS3.join(" ")
    };
    return {
      name: "JSON",
      aliases: ["jsonc", "json5"],
      keywords: {
        literal: LITERALS3
      },
      contains: [
        ATTRIBUTE,
        PUNCTUATION,
        hljs2.APOS_STRING_MODE,
        hljs2.QUOTE_STRING_MODE,
        LITERALS_MODE,
        EXTENDED_NUMBER_MODE,
        hljs2.C_LINE_COMMENT_MODE,
        hljs2.C_BLOCK_COMMENT_MODE
      ],
      illegal: "\\S"
    };
  }

  // node_modules/highlight.js/es/languages/sql.js
  function sql(hljs2) {
    const regex = hljs2.regex;
    const COMMENT_MODE = hljs2.COMMENT("--", "$");
    const STRING = {
      scope: "string",
      variants: [
        {
          begin: /'/,
          end: /'/,
          contains: [{ match: /''/ }]
        }
      ]
    };
    const QUOTED_IDENTIFIER = {
      begin: /"/,
      end: /"/,
      contains: [{ match: /""/ }]
    };
    const LITERALS3 = [
      "true",
      "false",
      // Not sure it's correct to call NULL literal, and clauses like IS [NOT] NULL look strange that way.
      // "null",
      "unknown"
    ];
    const MULTI_WORD_TYPES = [
      "double precision",
      "large object",
      "with timezone",
      "without timezone"
    ];
    const TYPES3 = [
      "bigint",
      "binary",
      "blob",
      "boolean",
      "char",
      "character",
      "clob",
      "date",
      "dec",
      "decfloat",
      "decimal",
      "float",
      "int",
      "integer",
      "interval",
      "nchar",
      "nclob",
      "national",
      "numeric",
      "real",
      "row",
      "smallint",
      "time",
      "timestamp",
      "varchar",
      "varying",
      // modifier (character varying)
      "varbinary"
    ];
    const NON_RESERVED_WORDS = [
      "add",
      "asc",
      "collation",
      "desc",
      "final",
      "first",
      "last",
      "view"
    ];
    const RESERVED_WORDS = [
      "abs",
      "acos",
      "all",
      "allocate",
      "alter",
      "and",
      "any",
      "are",
      "array",
      "array_agg",
      "array_max_cardinality",
      "as",
      "asensitive",
      "asin",
      "asymmetric",
      "at",
      "atan",
      "atomic",
      "authorization",
      "avg",
      "begin",
      "begin_frame",
      "begin_partition",
      "between",
      "bigint",
      "binary",
      "blob",
      "boolean",
      "both",
      "by",
      "call",
      "called",
      "cardinality",
      "cascaded",
      "case",
      "cast",
      "ceil",
      "ceiling",
      "char",
      "char_length",
      "character",
      "character_length",
      "check",
      "classifier",
      "clob",
      "close",
      "coalesce",
      "collate",
      "collect",
      "column",
      "commit",
      "condition",
      "connect",
      "constraint",
      "contains",
      "convert",
      "copy",
      "corr",
      "corresponding",
      "cos",
      "cosh",
      "count",
      "covar_pop",
      "covar_samp",
      "create",
      "cross",
      "cube",
      "cume_dist",
      "current",
      "current_catalog",
      "current_date",
      "current_default_transform_group",
      "current_path",
      "current_role",
      "current_row",
      "current_schema",
      "current_time",
      "current_timestamp",
      "current_path",
      "current_role",
      "current_transform_group_for_type",
      "current_user",
      "cursor",
      "cycle",
      "date",
      "day",
      "deallocate",
      "dec",
      "decimal",
      "decfloat",
      "declare",
      "default",
      "define",
      "delete",
      "dense_rank",
      "deref",
      "describe",
      "deterministic",
      "disconnect",
      "distinct",
      "double",
      "drop",
      "dynamic",
      "each",
      "element",
      "else",
      "empty",
      "end",
      "end_frame",
      "end_partition",
      "end-exec",
      "equals",
      "escape",
      "every",
      "except",
      "exec",
      "execute",
      "exists",
      "exp",
      "external",
      "extract",
      "false",
      "fetch",
      "filter",
      "first_value",
      "float",
      "floor",
      "for",
      "foreign",
      "frame_row",
      "free",
      "from",
      "full",
      "function",
      "fusion",
      "get",
      "global",
      "grant",
      "group",
      "grouping",
      "groups",
      "having",
      "hold",
      "hour",
      "identity",
      "in",
      "indicator",
      "initial",
      "inner",
      "inout",
      "insensitive",
      "insert",
      "int",
      "integer",
      "intersect",
      "intersection",
      "interval",
      "into",
      "is",
      "join",
      "json_array",
      "json_arrayagg",
      "json_exists",
      "json_object",
      "json_objectagg",
      "json_query",
      "json_table",
      "json_table_primitive",
      "json_value",
      "lag",
      "language",
      "large",
      "last_value",
      "lateral",
      "lead",
      "leading",
      "left",
      "like",
      "like_regex",
      "listagg",
      "ln",
      "local",
      "localtime",
      "localtimestamp",
      "log",
      "log10",
      "lower",
      "match",
      "match_number",
      "match_recognize",
      "matches",
      "max",
      "member",
      "merge",
      "method",
      "min",
      "minute",
      "mod",
      "modifies",
      "module",
      "month",
      "multiset",
      "national",
      "natural",
      "nchar",
      "nclob",
      "new",
      "no",
      "none",
      "normalize",
      "not",
      "nth_value",
      "ntile",
      "null",
      "nullif",
      "numeric",
      "octet_length",
      "occurrences_regex",
      "of",
      "offset",
      "old",
      "omit",
      "on",
      "one",
      "only",
      "open",
      "or",
      "order",
      "out",
      "outer",
      "over",
      "overlaps",
      "overlay",
      "parameter",
      "partition",
      "pattern",
      "per",
      "percent",
      "percent_rank",
      "percentile_cont",
      "percentile_disc",
      "period",
      "portion",
      "position",
      "position_regex",
      "power",
      "precedes",
      "precision",
      "prepare",
      "primary",
      "procedure",
      "ptf",
      "range",
      "rank",
      "reads",
      "real",
      "recursive",
      "ref",
      "references",
      "referencing",
      "regr_avgx",
      "regr_avgy",
      "regr_count",
      "regr_intercept",
      "regr_r2",
      "regr_slope",
      "regr_sxx",
      "regr_sxy",
      "regr_syy",
      "release",
      "result",
      "return",
      "returns",
      "revoke",
      "right",
      "rollback",
      "rollup",
      "row",
      "row_number",
      "rows",
      "running",
      "savepoint",
      "scope",
      "scroll",
      "search",
      "second",
      "seek",
      "select",
      "sensitive",
      "session_user",
      "set",
      "show",
      "similar",
      "sin",
      "sinh",
      "skip",
      "smallint",
      "some",
      "specific",
      "specifictype",
      "sql",
      "sqlexception",
      "sqlstate",
      "sqlwarning",
      "sqrt",
      "start",
      "static",
      "stddev_pop",
      "stddev_samp",
      "submultiset",
      "subset",
      "substring",
      "substring_regex",
      "succeeds",
      "sum",
      "symmetric",
      "system",
      "system_time",
      "system_user",
      "table",
      "tablesample",
      "tan",
      "tanh",
      "then",
      "time",
      "timestamp",
      "timezone_hour",
      "timezone_minute",
      "to",
      "trailing",
      "translate",
      "translate_regex",
      "translation",
      "treat",
      "trigger",
      "trim",
      "trim_array",
      "true",
      "truncate",
      "uescape",
      "union",
      "unique",
      "unknown",
      "unnest",
      "update",
      "upper",
      "user",
      "using",
      "value",
      "values",
      "value_of",
      "var_pop",
      "var_samp",
      "varbinary",
      "varchar",
      "varying",
      "versioning",
      "when",
      "whenever",
      "where",
      "width_bucket",
      "window",
      "with",
      "within",
      "without",
      "year"
    ];
    const RESERVED_FUNCTIONS = [
      "abs",
      "acos",
      "array_agg",
      "asin",
      "atan",
      "avg",
      "cast",
      "ceil",
      "ceiling",
      "coalesce",
      "corr",
      "cos",
      "cosh",
      "count",
      "covar_pop",
      "covar_samp",
      "cume_dist",
      "dense_rank",
      "deref",
      "element",
      "exp",
      "extract",
      "first_value",
      "floor",
      "json_array",
      "json_arrayagg",
      "json_exists",
      "json_object",
      "json_objectagg",
      "json_query",
      "json_table",
      "json_table_primitive",
      "json_value",
      "lag",
      "last_value",
      "lead",
      "listagg",
      "ln",
      "log",
      "log10",
      "lower",
      "max",
      "min",
      "mod",
      "nth_value",
      "ntile",
      "nullif",
      "percent_rank",
      "percentile_cont",
      "percentile_disc",
      "position",
      "position_regex",
      "power",
      "rank",
      "regr_avgx",
      "regr_avgy",
      "regr_count",
      "regr_intercept",
      "regr_r2",
      "regr_slope",
      "regr_sxx",
      "regr_sxy",
      "regr_syy",
      "row_number",
      "sin",
      "sinh",
      "sqrt",
      "stddev_pop",
      "stddev_samp",
      "substring",
      "substring_regex",
      "sum",
      "tan",
      "tanh",
      "translate",
      "translate_regex",
      "treat",
      "trim",
      "trim_array",
      "unnest",
      "upper",
      "value_of",
      "var_pop",
      "var_samp",
      "width_bucket"
    ];
    const POSSIBLE_WITHOUT_PARENS = [
      "current_catalog",
      "current_date",
      "current_default_transform_group",
      "current_path",
      "current_role",
      "current_schema",
      "current_transform_group_for_type",
      "current_user",
      "session_user",
      "system_time",
      "system_user",
      "current_time",
      "localtime",
      "current_timestamp",
      "localtimestamp"
    ];
    const COMBOS = [
      "create table",
      "insert into",
      "primary key",
      "foreign key",
      "not null",
      "alter table",
      "add constraint",
      "grouping sets",
      "on overflow",
      "character set",
      "respect nulls",
      "ignore nulls",
      "nulls first",
      "nulls last",
      "depth first",
      "breadth first"
    ];
    const FUNCTIONS = RESERVED_FUNCTIONS;
    const KEYWORDS3 = [
      ...RESERVED_WORDS,
      ...NON_RESERVED_WORDS
    ].filter((keyword) => {
      return !RESERVED_FUNCTIONS.includes(keyword);
    });
    const VARIABLE = {
      scope: "variable",
      match: /@[a-z0-9][a-z0-9_]*/
    };
    const OPERATOR = {
      scope: "operator",
      match: /[-+*/=%^~]|&&?|\|\|?|!=?|<(?:=>?|<|>)?|>[>=]?/,
      relevance: 0
    };
    const FUNCTION_CALL = {
      match: regex.concat(/\b/, regex.either(...FUNCTIONS), /\s*\(/),
      relevance: 0,
      keywords: { built_in: FUNCTIONS }
    };
    function kws_to_regex(list) {
      return regex.concat(
        /\b/,
        regex.either(...list.map((kw) => {
          return kw.replace(/\s+/, "\\s+");
        })),
        /\b/
      );
    }
    const MULTI_WORD_KEYWORDS = {
      scope: "keyword",
      match: kws_to_regex(COMBOS),
      relevance: 0
    };
    function reduceRelevancy(list, {
      exceptions,
      when
    } = {}) {
      const qualifyFn = when;
      exceptions = exceptions || [];
      return list.map((item) => {
        if (item.match(/\|\d+$/) || exceptions.includes(item)) {
          return item;
        } else if (qualifyFn(item)) {
          return `${item}|0`;
        } else {
          return item;
        }
      });
    }
    return {
      name: "SQL",
      case_insensitive: true,
      // does not include {} or HTML tags `</`
      illegal: /[{}]|<\//,
      keywords: {
        $pattern: /\b[\w\.]+/,
        keyword: reduceRelevancy(KEYWORDS3, { when: (x3) => x3.length < 3 }),
        literal: LITERALS3,
        type: TYPES3,
        built_in: POSSIBLE_WITHOUT_PARENS
      },
      contains: [
        {
          scope: "type",
          match: kws_to_regex(MULTI_WORD_TYPES)
        },
        MULTI_WORD_KEYWORDS,
        FUNCTION_CALL,
        VARIABLE,
        STRING,
        QUOTED_IDENTIFIER,
        hljs2.C_NUMBER_MODE,
        hljs2.C_BLOCK_COMMENT_MODE,
        COMMENT_MODE,
        OPERATOR
      ]
    };
  }

  // node_modules/highlight.js/es/languages/rust.js
  function rust(hljs2) {
    const regex = hljs2.regex;
    const RAW_IDENTIFIER = /(r#)?/;
    const UNDERSCORE_IDENT_RE = regex.concat(RAW_IDENTIFIER, hljs2.UNDERSCORE_IDENT_RE);
    const IDENT_RE3 = regex.concat(RAW_IDENTIFIER, hljs2.IDENT_RE);
    const FUNCTION_INVOKE = {
      scope: "title.function.invoke",
      relevance: 0,
      begin: regex.concat(
        /\b/,
        /(?!(?:let|for|while|if|else|match)\b)/,
        IDENT_RE3,
        regex.lookahead(/\s*\(/)
      )
    };
    const NUMBER_SUFFIX = "([ui](8|16|32|64|128|size)|f(16|32|64|128))?";
    const KEYWORDS3 = [
      "abstract",
      "as",
      "async",
      "await",
      "become",
      "box",
      "break",
      "const",
      "continue",
      "crate",
      "do",
      "dyn",
      "else",
      "enum",
      "extern",
      "false",
      "final",
      "fn",
      "for",
      "if",
      "impl",
      "in",
      "let",
      "loop",
      "macro",
      "match",
      "mod",
      "move",
      "mut",
      "override",
      "priv",
      "pub",
      "raw",
      "ref",
      "return",
      "self",
      "Self",
      "static",
      "struct",
      "super",
      "trait",
      "true",
      "try",
      "type",
      "typeof",
      "union",
      "unsafe",
      "unsized",
      "use",
      "virtual",
      "where",
      "while",
      "yield"
    ];
    const LITERALS3 = [
      "true",
      "false",
      "Some",
      "None",
      "Ok",
      "Err"
    ];
    const BUILTINS = [
      // functions
      "drop ",
      // traits
      "Copy",
      "Send",
      "Sized",
      "Sync",
      "Drop",
      "Fn",
      "FnMut",
      "FnOnce",
      "ToOwned",
      "Clone",
      "Debug",
      "PartialEq",
      "PartialOrd",
      "Eq",
      "Ord",
      "AsRef",
      "AsMut",
      "Into",
      "From",
      "Default",
      "Iterator",
      "Extend",
      "IntoIterator",
      "DoubleEndedIterator",
      "ExactSizeIterator",
      "SliceConcatExt",
      "ToString",
      // macros
      "assert!",
      "assert_eq!",
      "bitflags!",
      "bytes!",
      "cfg!",
      "col!",
      "concat!",
      "concat_idents!",
      "debug_assert!",
      "debug_assert_eq!",
      "env!",
      "eprintln!",
      "panic!",
      "file!",
      "format!",
      "format_args!",
      "include_bytes!",
      "include_str!",
      "line!",
      "local_data_key!",
      "module_path!",
      "option_env!",
      "print!",
      "println!",
      "select!",
      "stringify!",
      "try!",
      "unimplemented!",
      "unreachable!",
      "vec!",
      "write!",
      "writeln!",
      "macro_rules!",
      "assert_ne!",
      "debug_assert_ne!"
    ];
    const TYPES3 = [
      "i8",
      "i16",
      "i32",
      "i64",
      "i128",
      "isize",
      "u8",
      "u16",
      "u32",
      "u64",
      "u128",
      "usize",
      "f16",
      "f32",
      "f64",
      "f128",
      "str",
      "char",
      "bool",
      "Box",
      "Option",
      "Result",
      "String",
      "Vec"
    ];
    return {
      name: "Rust",
      aliases: ["rs"],
      keywords: {
        $pattern: hljs2.IDENT_RE + "!?",
        type: TYPES3,
        keyword: KEYWORDS3,
        literal: LITERALS3,
        built_in: BUILTINS
      },
      illegal: "</",
      contains: [
        hljs2.C_LINE_COMMENT_MODE,
        hljs2.COMMENT("/\\*", "\\*/", { contains: ["self"] }),
        hljs2.inherit(hljs2.QUOTE_STRING_MODE, {
          begin: /b?"/,
          illegal: null
        }),
        {
          scope: "symbol",
          // negative lookahead to avoid matching `'`
          begin: /'[a-zA-Z_][a-zA-Z0-9_]*(?!')/
        },
        {
          scope: "string",
          variants: [
            { begin: /b?r(#*)"(.|\n)*?"\1(?!#)/ },
            {
              begin: /b?'/,
              end: /'/,
              contains: [
                {
                  scope: "char.escape",
                  match: /\\('|"|\\|\w|x\w{2}|u\w{4}|U\w{8})/
                }
              ]
            }
          ]
        },
        {
          scope: "number",
          variants: [
            { begin: "\\b0b([01_]+)" + NUMBER_SUFFIX },
            { begin: "\\b0o([0-7_]+)" + NUMBER_SUFFIX },
            { begin: "\\b0x([A-Fa-f0-9_]+)" + NUMBER_SUFFIX },
            { begin: "\\b(\\d[\\d_]*(\\.[0-9_]+)?([eE][+-]?[0-9_]+)?)" + NUMBER_SUFFIX }
          ],
          relevance: 0
        },
        {
          begin: [
            /\bsafe/,
            /\s+/,
            /extern/
          ],
          scope: {
            1: "keyword",
            3: "keyword"
          }
        },
        {
          begin: [
            /fn/,
            /\s+/,
            UNDERSCORE_IDENT_RE
          ],
          scope: {
            1: "keyword",
            3: "title.function"
          }
        },
        {
          scope: "meta",
          begin: "#!?\\[",
          end: "\\]",
          contains: [
            {
              scope: "string",
              begin: /"/,
              end: /"/,
              contains: [
                hljs2.BACKSLASH_ESCAPE
              ]
            }
          ]
        },
        {
          begin: [
            /let/,
            /\s+/,
            /(?:mut\s+)?/,
            UNDERSCORE_IDENT_RE
          ],
          scope: {
            1: "keyword",
            3: "keyword",
            4: "variable"
          }
        },
        // must come before impl/for rule later
        {
          begin: [
            /for/,
            /\s+/,
            UNDERSCORE_IDENT_RE,
            /\s+/,
            /in/
          ],
          scope: {
            1: "keyword",
            3: "variable",
            5: "keyword"
          }
        },
        {
          begin: [
            /type/,
            /\s+/,
            UNDERSCORE_IDENT_RE
          ],
          scope: {
            1: "keyword",
            3: "title.class"
          }
        },
        {
          begin: [
            /(?:trait|enum|struct|union|impl|for)/,
            /\s+/,
            UNDERSCORE_IDENT_RE
          ],
          scope: {
            1: "keyword",
            3: "title.class"
          }
        },
        {
          begin: hljs2.IDENT_RE + "::",
          keywords: {
            keyword: "Self",
            built_in: BUILTINS,
            type: TYPES3
          }
        },
        {
          scope: "punctuation",
          begin: "->"
        },
        FUNCTION_INVOKE
      ]
    };
  }

  // node_modules/highlight.js/es/languages/go.js
  function go(hljs2) {
    const LITERALS3 = [
      "true",
      "false",
      "iota",
      "nil"
    ];
    const BUILT_INS3 = [
      "append",
      "cap",
      "close",
      "complex",
      "copy",
      "imag",
      "len",
      "make",
      "new",
      "panic",
      "print",
      "println",
      "real",
      "recover",
      "delete"
    ];
    const TYPES3 = [
      "bool",
      "byte",
      "complex64",
      "complex128",
      "error",
      "float32",
      "float64",
      "int8",
      "int16",
      "int32",
      "int64",
      "string",
      "uint8",
      "uint16",
      "uint32",
      "uint64",
      "int",
      "uint",
      "uintptr",
      "rune"
    ];
    const KWS = [
      "break",
      "case",
      "chan",
      "const",
      "continue",
      "default",
      "defer",
      "else",
      "fallthrough",
      "for",
      "func",
      "go",
      "goto",
      "if",
      "import",
      "interface",
      "map",
      "package",
      "range",
      "return",
      "select",
      "struct",
      "switch",
      "type",
      "var"
    ];
    const KEYWORDS3 = {
      keyword: KWS,
      type: TYPES3,
      literal: LITERALS3,
      built_in: BUILT_INS3
    };
    return {
      name: "Go",
      aliases: ["golang"],
      keywords: KEYWORDS3,
      illegal: "</",
      contains: [
        hljs2.C_LINE_COMMENT_MODE,
        hljs2.C_BLOCK_COMMENT_MODE,
        {
          className: "string",
          variants: [
            hljs2.QUOTE_STRING_MODE,
            hljs2.APOS_STRING_MODE,
            {
              begin: "`",
              end: "`"
            }
          ]
        },
        {
          className: "number",
          variants: [
            {
              match: /-?\b0[xX]\.[a-fA-F0-9](_?[a-fA-F0-9])*[pP][+-]?\d(_?\d)*i?/,
              // hex without a present digit before . (making a digit afterwards required)
              relevance: 0
            },
            {
              match: /-?\b0[xX](_?[a-fA-F0-9])+((\.([a-fA-F0-9](_?[a-fA-F0-9])*)?)?[pP][+-]?\d(_?\d)*)?i?/,
              // hex with a present digit before . (making a digit afterwards optional)
              relevance: 0
            },
            {
              match: /-?\b0[oO](_?[0-7])*i?/,
              // leading 0o octal
              relevance: 0
            },
            {
              match: /-?\b0[bB](_?[01])*i?/,
              // leading 0b binary
              relevance: 0
            },
            {
              match: /-?\.\d(_?\d)*([eE][+-]?\d(_?\d)*)?i?/,
              // decimal without a present digit before . (making a digit afterwards required)
              relevance: 0
            },
            {
              match: /-?\b\d(_?\d)*(\.(\d(_?\d)*)?)?([eE][+-]?\d(_?\d)*)?i?/,
              // decimal with a present digit before . (making a digit afterwards optional)
              relevance: 0
            }
          ]
        },
        {
          begin: /:=/
          // relevance booster
        },
        {
          className: "function",
          beginKeywords: "func",
          end: "\\s*(\\{|$)",
          excludeEnd: true,
          contains: [
            hljs2.TITLE_MODE,
            {
              className: "params",
              begin: /\(/,
              end: /\)/,
              endsParent: true,
              keywords: KEYWORDS3,
              illegal: /["']/
            }
          ]
        }
      ]
    };
  }

  // node_modules/highlight.js/es/languages/cpp.js
  function cpp(hljs2) {
    const regex = hljs2.regex;
    const C_LINE_COMMENT_MODE = hljs2.COMMENT("//", "$", { contains: [{ begin: /\\\n/ }] });
    const DECLTYPE_AUTO_RE = "decltype\\(auto\\)";
    const NAMESPACE_RE = "[a-zA-Z_]\\w*::";
    const TEMPLATE_ARGUMENT_RE = "<[^<>]+>";
    const FUNCTION_TYPE_RE = "(?!struct)(" + DECLTYPE_AUTO_RE + "|" + regex.optional(NAMESPACE_RE) + "[a-zA-Z_]\\w*" + regex.optional(TEMPLATE_ARGUMENT_RE) + ")";
    const CPP_PRIMITIVE_TYPES = {
      className: "type",
      begin: "\\b[a-z\\d_]*_t\\b"
    };
    const CHARACTER_ESCAPES = "\\\\(x[0-9A-Fa-f]{2}|u[0-9A-Fa-f]{4,8}|[0-7]{3}|\\S)";
    const STRINGS = {
      className: "string",
      variants: [
        {
          begin: '(u8?|U|L)?"',
          end: '"',
          illegal: "\\n",
          contains: [hljs2.BACKSLASH_ESCAPE]
        },
        {
          begin: "(u8?|U|L)?'(" + CHARACTER_ESCAPES + "|.)",
          end: "'",
          illegal: "."
        },
        // https://en.cppreference.com/w/cpp/language/string_literal
        // a d-char-sequence never contains parentheses, backslashes or whitespace;
        // quotes are excluded as well so the closing delimiter cannot swallow the
        // quote that actually terminates the literal
        hljs2.END_SAME_AS_BEGIN({
          begin: /(?:u8?|U|L)?R"([^()\\\s"]{0,16})\(/,
          end: /\)([^()\\\s"]{0,16})"/
        })
      ]
    };
    const NUMBERS = {
      className: "number",
      variants: [
        // Floating-point literal.
        {
          begin: "[+-]?(?:(?:\\b[0-9](?:'?[0-9])*\\.(?:[0-9](?:'?[0-9])*)?|\\.[0-9](?:'?[0-9])*)(?:[Ee][+-]?[0-9](?:'?[0-9])*)?|\\b[0-9](?:'?[0-9])*[Ee][+-]?[0-9](?:'?[0-9])*|\\b0[Xx](?:[0-9A-Fa-f](?:'?[0-9A-Fa-f])*(?:\\.(?:[0-9A-Fa-f](?:'?[0-9A-Fa-f])*)?)?|\\.[0-9A-Fa-f](?:'?[0-9A-Fa-f])*)[Pp][+-]?[0-9](?:'?[0-9])*)(?:[Ff](?:16|32|64|128)?|(BF|bf)16|[Ll]|)"
        },
        // Integer literal.
        {
          begin: "[+-]?\\b(?:0[Bb][01](?:'?[01])*|0[Xx][0-9A-Fa-f](?:'?[0-9A-Fa-f])*|0(?:'?[0-7])*|[1-9](?:'?[0-9])*)(?:[Uu](?:LL?|ll?)|[Uu][Zz]?|(?:LL?|ll?)[Uu]?|[Zz][Uu]|)"
          // Note: there are user-defined literal suffixes too, but perhaps having the custom suffix not part of the
          // literal highlight actually makes it stand out more.
        }
      ],
      relevance: 0
    };
    const PREPROCESSOR_INCLUDE = {
      scope: "meta",
      begin: /#\s*include\b/,
      end: /$/,
      keywords: { keyword: "include" },
      contains: [
        {
          // the `\` at the end of a line signaling continuation
          begin: /\\\n/
        },
        STRINGS,
        {
          scope: "string",
          begin: /<.*?>/
        },
        C_LINE_COMMENT_MODE,
        hljs2.C_BLOCK_COMMENT_MODE
      ]
    };
    const PREPROCESSOR = {
      className: "meta",
      begin: /#\s*[a-z]+\b/,
      end: /$/,
      keywords: { keyword: "if else elif endif define undef warning error line pragma _Pragma ifdef ifndef include" },
      contains: [
        {
          begin: /\\\n/,
          relevance: 0
        },
        hljs2.inherit(STRINGS, { className: "string" }),
        C_LINE_COMMENT_MODE,
        hljs2.C_BLOCK_COMMENT_MODE
      ]
    };
    const PREPROCESSORS = [
      PREPROCESSOR_INCLUDE,
      PREPROCESSOR
    ];
    const TITLE_MODE = {
      className: "title",
      begin: regex.optional(NAMESPACE_RE) + hljs2.IDENT_RE,
      relevance: 0
    };
    const FUNCTION_TITLE = regex.optional(NAMESPACE_RE) + hljs2.IDENT_RE + "\\s*\\(";
    const MAX_FUNCTION_TYPE_TOKENS = 12;
    const RESERVED_KEYWORDS = [
      "alignas",
      "alignof",
      "and",
      "and_eq",
      "asm",
      "atomic_cancel",
      "atomic_commit",
      "atomic_noexcept",
      "auto",
      "bitand",
      "bitor",
      "break",
      "case",
      "catch",
      "class",
      "co_await",
      "co_return",
      "co_yield",
      "compl",
      "concept",
      "const_cast|10",
      "consteval",
      "constexpr",
      "constinit",
      "continue",
      "decltype",
      "default",
      "delete",
      "do",
      "dynamic_cast|10",
      "else",
      "enum",
      "explicit",
      "export",
      "extern",
      "false",
      "final",
      "for",
      "friend",
      "goto",
      "if",
      "import",
      "inline",
      "module",
      "mutable",
      "namespace",
      "new",
      "noexcept",
      "not",
      "not_eq",
      "nullptr",
      "operator",
      "or",
      "or_eq",
      "override",
      "private",
      "protected",
      "public",
      "reflexpr",
      "register",
      "reinterpret_cast|10",
      "requires",
      "return",
      "sizeof",
      "static_assert",
      "static_cast|10",
      "struct",
      "switch",
      "synchronized",
      "template",
      "this",
      "thread_local",
      "throw",
      "transaction_safe",
      "transaction_safe_dynamic",
      "true",
      "try",
      "typedef",
      "typeid",
      "typename",
      "union",
      "using",
      "virtual",
      "volatile",
      "while",
      "xor",
      "xor_eq"
    ];
    const RESERVED_TYPES = [
      "bool",
      "char",
      "char16_t",
      "char32_t",
      "char8_t",
      "double",
      "float",
      "int",
      "long",
      "short",
      "void",
      "wchar_t",
      "unsigned",
      "signed",
      "const",
      "static"
    ];
    const TYPE_HINTS = [
      "any",
      "auto_ptr",
      "barrier",
      "binary_semaphore",
      "bitset",
      "complex",
      "condition_variable",
      "condition_variable_any",
      "counting_semaphore",
      "deque",
      "false_type",
      "flat_map",
      "flat_set",
      "future",
      "imaginary",
      "initializer_list",
      "istringstream",
      "jthread",
      "latch",
      "lock_guard",
      "multimap",
      "multiset",
      "mutex",
      "optional",
      "ostringstream",
      "packaged_task",
      "pair",
      "promise",
      "priority_queue",
      "queue",
      "recursive_mutex",
      "recursive_timed_mutex",
      "scoped_lock",
      "set",
      "shared_future",
      "shared_lock",
      "shared_mutex",
      "shared_timed_mutex",
      "shared_ptr",
      "stack",
      "string_view",
      "stringstream",
      "timed_mutex",
      "thread",
      "true_type",
      "tuple",
      "unique_lock",
      "unique_ptr",
      "unordered_map",
      "unordered_multimap",
      "unordered_multiset",
      "unordered_set",
      "variant",
      "vector",
      "weak_ptr",
      "wstring",
      "wstring_view"
    ];
    const FUNCTION_HINTS = [
      "abort",
      "abs",
      "acos",
      "apply",
      "as_const",
      "asin",
      "atan",
      "atan2",
      "calloc",
      "ceil",
      "cerr",
      "cin",
      "clog",
      "cos",
      "cosh",
      "cout",
      "declval",
      "endl",
      "exchange",
      "exit",
      "exp",
      "fabs",
      "floor",
      "fmod",
      "forward",
      "fprintf",
      "fputs",
      "free",
      "frexp",
      "fscanf",
      "future",
      "invoke",
      "isalnum",
      "isalpha",
      "iscntrl",
      "isdigit",
      "isgraph",
      "islower",
      "isprint",
      "ispunct",
      "isspace",
      "isupper",
      "isxdigit",
      "labs",
      "launder",
      "ldexp",
      "log",
      "log10",
      "make_pair",
      "make_shared",
      "make_shared_for_overwrite",
      "make_tuple",
      "make_unique",
      "malloc",
      "memchr",
      "memcmp",
      "memcpy",
      "memset",
      "modf",
      "move",
      "pow",
      "printf",
      "putchar",
      "puts",
      "realloc",
      "scanf",
      "sin",
      "sinh",
      "snprintf",
      "sprintf",
      "sqrt",
      "sscanf",
      "std",
      "stderr",
      "stdin",
      "stdout",
      "strcat",
      "strchr",
      "strcmp",
      "strcpy",
      "strcspn",
      "strlen",
      "strncat",
      "strncmp",
      "strncpy",
      "strpbrk",
      "strrchr",
      "strspn",
      "strstr",
      "swap",
      "tan",
      "tanh",
      "terminate",
      "to_underlying",
      "tolower",
      "toupper",
      "vfprintf",
      "visit",
      "vprintf",
      "vsprintf"
    ];
    const LITERALS3 = [
      "NULL",
      "false",
      "nullopt",
      "nullptr",
      "true"
    ];
    const BUILT_IN = ["_Pragma"];
    const CPP_KEYWORDS = {
      type: RESERVED_TYPES,
      keyword: RESERVED_KEYWORDS,
      literal: LITERALS3,
      built_in: BUILT_IN,
      _type_hints: TYPE_HINTS
    };
    const FUNCTION_DISPATCH = {
      className: "function.dispatch",
      relevance: 0,
      keywords: {
        // Only for relevance, not highlighting.
        _hint: FUNCTION_HINTS
      },
      begin: regex.concat(
        /\b/,
        `(?!${RESERVED_KEYWORDS.join("|")})`,
        hljs2.IDENT_RE,
        regex.lookahead(/(<[^<>]+>|)\s*\(/)
      )
    };
    const EXPRESSION_CONTAINS = [
      FUNCTION_DISPATCH,
      ...PREPROCESSORS,
      CPP_PRIMITIVE_TYPES,
      C_LINE_COMMENT_MODE,
      hljs2.C_BLOCK_COMMENT_MODE,
      NUMBERS,
      STRINGS
    ];
    const EXPRESSION_CONTEXT = {
      // This mode covers expression context where we can't expect a function
      // definition and shouldn't highlight anything that looks like one:
      // `return some()`, `else if()`, `(x*sum(1, 2))`
      variants: [
        {
          begin: /=/,
          end: /;/
        },
        {
          begin: /\(/,
          end: /\)/
        },
        {
          beginKeywords: "new throw return else",
          end: /;/
        }
      ],
      keywords: CPP_KEYWORDS,
      contains: EXPRESSION_CONTAINS.concat([
        {
          begin: /\(/,
          end: /\)/,
          keywords: CPP_KEYWORDS,
          contains: EXPRESSION_CONTAINS.concat(["self"]),
          relevance: 0
        }
      ]),
      relevance: 0
    };
    const FUNCTION_DECLARATION = {
      className: "function",
      begin: "(" + FUNCTION_TYPE_RE + "[\\*&\\s]+){1," + MAX_FUNCTION_TYPE_TOKENS + "}" + FUNCTION_TITLE,
      returnBegin: true,
      end: /[{;=]/,
      excludeEnd: true,
      keywords: CPP_KEYWORDS,
      illegal: /[^\w\s\*&:<>.]/,
      contains: [
        {
          // to prevent it from being confused as the function title
          begin: DECLTYPE_AUTO_RE,
          keywords: CPP_KEYWORDS,
          relevance: 0
        },
        {
          begin: FUNCTION_TITLE,
          returnBegin: true,
          contains: [TITLE_MODE],
          relevance: 0
        },
        // needed because we do not have look-behind on the below rule
        // to prevent it from grabbing the final : in a :: pair
        {
          begin: /::/,
          relevance: 0
        },
        // initializers
        {
          begin: /:/,
          endsWithParent: true,
          contains: [
            STRINGS,
            NUMBERS
          ]
        },
        // allow for multiple declarations, e.g.:
        // extern void f(int), g(char);
        {
          relevance: 0,
          match: /,/
        },
        {
          className: "params",
          begin: /\(/,
          end: /\)/,
          keywords: CPP_KEYWORDS,
          relevance: 0,
          contains: [
            C_LINE_COMMENT_MODE,
            hljs2.C_BLOCK_COMMENT_MODE,
            STRINGS,
            NUMBERS,
            CPP_PRIMITIVE_TYPES,
            // Count matching parentheses.
            {
              begin: /\(/,
              end: /\)/,
              keywords: CPP_KEYWORDS,
              relevance: 0,
              contains: [
                "self",
                C_LINE_COMMENT_MODE,
                hljs2.C_BLOCK_COMMENT_MODE,
                STRINGS,
                NUMBERS,
                CPP_PRIMITIVE_TYPES
              ]
            }
          ]
        },
        CPP_PRIMITIVE_TYPES,
        C_LINE_COMMENT_MODE,
        hljs2.C_BLOCK_COMMENT_MODE,
        ...PREPROCESSORS
      ]
    };
    return {
      name: "C++",
      aliases: [
        "cc",
        "c++",
        "h++",
        "hpp",
        "hh",
        "hxx",
        "cxx"
      ],
      keywords: CPP_KEYWORDS,
      illegal: "</",
      classNameAliases: { "function.dispatch": "built_in" },
      contains: [].concat(
        EXPRESSION_CONTEXT,
        FUNCTION_DECLARATION,
        FUNCTION_DISPATCH,
        EXPRESSION_CONTAINS,
        [
          ...PREPROCESSORS,
          {
            // containers: ie, `vector <int> rooms (9);`
            begin: "\\b(deque|list|queue|priority_queue|pair|stack|vector|map|set|bitset|multiset|multimap|unordered_map|unordered_set|unordered_multiset|unordered_multimap|array|tuple|optional|variant|function|flat_map|flat_set)\\s*<(?!<)",
            end: ">",
            keywords: CPP_KEYWORDS,
            contains: [
              "self",
              CPP_PRIMITIVE_TYPES
            ]
          },
          {
            begin: hljs2.IDENT_RE + "::",
            keywords: CPP_KEYWORDS
          },
          {
            match: [
              // extra complexity to deal with `enum class` and `enum struct`
              /\b(?:enum(?:\s+(?:class|struct))?|class|struct|union)/,
              /\s+/,
              /\w+/
            ],
            className: {
              1: "keyword",
              3: "title.class"
            }
          }
        ]
      )
    };
  }

  // node_modules/highlight.js/es/languages/c.js
  function c(hljs2) {
    const regex = hljs2.regex;
    const C_LINE_COMMENT_MODE = hljs2.COMMENT("//", "$", { contains: [{ begin: /\\\n/ }] });
    const DECLTYPE_AUTO_RE = "decltype\\(auto\\)";
    const NAMESPACE_RE = "[a-zA-Z_]\\w*::";
    const TEMPLATE_ARGUMENT_RE = "<[^<>]+>";
    const FUNCTION_TYPE_RE = "(" + DECLTYPE_AUTO_RE + "|" + regex.optional(NAMESPACE_RE) + "[a-zA-Z_]\\w*" + regex.optional(TEMPLATE_ARGUMENT_RE) + ")";
    const ATOMIC_TYPES = regex.concat(/\batomic_/, regex.either(
      "bool",
      "char",
      "schar",
      "uchar",
      "short",
      "ushort",
      "int",
      "uint",
      "long",
      "ulong",
      "llong",
      "ullong",
      "char16_t",
      "char32_t",
      "wchar_t",
      "int_least8_t",
      "uint_least8_t",
      "int_least16_t",
      "uint_least16_t",
      "int_least32_t",
      "uint_least32_t",
      "int_least64_t",
      "uint_least64_t",
      "int_fast8_t",
      "uint_fast8_t",
      "int_fast16_t",
      "uint_fast16_t",
      "int_fast32_t",
      "uint_fast32_t",
      "int_fast64_t",
      "uint_fast64_t",
      "intptr_t",
      "uintptr_t",
      "size_t",
      "ptrdiff_t",
      "intmax_t",
      "uintmax_t"
    ), /\b/);
    const TYPES3 = {
      className: "type",
      variants: [
        { begin: "\\b[a-z\\d_]*_t\\b" },
        { match: ATOMIC_TYPES }
      ]
    };
    const CHARACTER_ESCAPES = "\\\\(x[0-9A-Fa-f]{2}|u[0-9A-Fa-f]{4,8}|[0-7]{3}|\\S)";
    const STRINGS = {
      className: "string",
      variants: [
        {
          begin: '(u8?|U|L)?"',
          end: '"',
          illegal: "\\n",
          contains: [hljs2.BACKSLASH_ESCAPE]
        },
        {
          begin: "(u8?|U|L)?'(" + CHARACTER_ESCAPES + "|.)",
          end: "'",
          illegal: "."
        },
        // https://en.cppreference.com/w/cpp/language/string_literal
        // a d-char-sequence never contains parentheses, backslashes or whitespace;
        // quotes are excluded as well so the closing delimiter cannot swallow the
        // quote that actually terminates the literal
        hljs2.END_SAME_AS_BEGIN({
          begin: /(?:u8?|U|L)?R"([^()\\\s"]{0,16})\(/,
          end: /\)([^()\\\s"]{0,16})"/
        })
      ]
    };
    const NUMBERS = {
      className: "number",
      variants: [
        { match: /\b(0b[01']+)/ },
        { match: /(-?)\b([\d']+(\.[\d']*)?|\.[\d']+)((ll|LL|l|L)(u|U)?|(u|U)(ll|LL|l|L)?|f|F|b|B)/ },
        { match: /(-?)\b(0[xX][a-fA-F0-9]+(?:'[a-fA-F0-9]+)*(?:\.[a-fA-F0-9]*(?:'[a-fA-F0-9]*)*)?(?:[pP][-+]?[0-9]+)?(l|L)?(u|U)?)/ },
        { match: /(-?)\b\d+(?:'\d+)*(?:\.\d*(?:'\d*)*)?(?:[eE][-+]?\d+)?/ }
      ],
      relevance: 0
    };
    const PREPROCESSOR_INCLUDE = {
      scope: "meta",
      begin: /#\s*include\b/,
      end: /$/,
      keywords: { keyword: "include" },
      contains: [
        {
          // the `\` at the end of a line signaling continuation
          begin: /\\\n/
        },
        STRINGS,
        {
          scope: "string",
          begin: /<.*?>/
        },
        C_LINE_COMMENT_MODE,
        hljs2.C_BLOCK_COMMENT_MODE
      ]
    };
    const PREPROCESSOR = {
      className: "meta",
      begin: /#\s*[a-z]+\b/,
      end: /$/,
      keywords: { keyword: "if else elif endif define undef warning error line pragma _Pragma ifdef ifndef elifdef elifndef include" },
      contains: [
        {
          begin: /\\\n/,
          relevance: 0
        },
        hljs2.inherit(STRINGS, { className: "string" }),
        C_LINE_COMMENT_MODE,
        hljs2.C_BLOCK_COMMENT_MODE
      ]
    };
    const PREPROCESSORS = [
      PREPROCESSOR_INCLUDE,
      PREPROCESSOR
    ];
    const TITLE_MODE = {
      className: "title",
      begin: regex.optional(NAMESPACE_RE) + hljs2.IDENT_RE,
      relevance: 0
    };
    const FUNCTION_TITLE = regex.optional(NAMESPACE_RE) + hljs2.IDENT_RE + "\\s*\\(";
    const MAX_FUNCTION_TYPE_TOKENS = 12;
    const C_KEYWORDS = [
      "asm",
      "auto",
      "break",
      "case",
      "continue",
      "default",
      "do",
      "else",
      "enum",
      "extern",
      "for",
      "fortran",
      "goto",
      "if",
      "inline",
      "register",
      "restrict",
      "return",
      "sizeof",
      "typeof",
      "typeof_unqual",
      "struct",
      "switch",
      "typedef",
      "union",
      "volatile",
      "while",
      "_Alignas",
      "_Alignof",
      "_Atomic",
      "_Generic",
      "_Noreturn",
      "_Static_assert",
      "_Thread_local",
      // aliases
      "alignas",
      "alignof",
      "noreturn",
      "static_assert",
      "thread_local",
      // not a C keyword but is, for all intents and purposes, treated exactly like one.
      "_Pragma"
    ];
    const C_TYPES = [
      "float",
      "double",
      "signed",
      "unsigned",
      "int",
      "short",
      "long",
      "char",
      "void",
      "_Bool",
      "_BitInt",
      "_Complex",
      "_Imaginary",
      "_Decimal32",
      "_Decimal64",
      "_Decimal96",
      "_Decimal128",
      "_Decimal64x",
      "_Decimal128x",
      "_Float16",
      "_Float32",
      "_Float64",
      "_Float128",
      "_Float32x",
      "_Float64x",
      "_Float128x",
      // modifiers
      "const",
      "static",
      "constexpr",
      // aliases
      "complex",
      "bool",
      "imaginary"
    ];
    const KEYWORDS3 = {
      keyword: C_KEYWORDS,
      type: C_TYPES,
      literal: "true false NULL",
      // TODO: apply hinting work similar to what was done in cpp.js
      built_in: "std string wstring cin cout cerr clog stdin stdout stderr stringstream istringstream ostringstream auto_ptr deque list queue stack vector map set pair bitset multiset multimap unordered_set unordered_map unordered_multiset unordered_multimap priority_queue make_pair array shared_ptr abort terminate abs acos asin atan2 atan calloc ceil cosh cos exit exp fabs floor fmod fprintf fputs free frexp fscanf future isalnum isalpha iscntrl isdigit isgraph islower isprint ispunct isspace isupper isxdigit tolower toupper labs ldexp log10 log malloc realloc memchr memcmp memcpy memset modf pow printf putchar puts scanf sinh sin snprintf sprintf sqrt sscanf strcat strchr strcmp strcpy strcspn strlen strncat strncmp strncpy strpbrk strrchr strspn strstr tanh tan vfprintf vprintf vsprintf endl initializer_list unique_ptr"
    };
    const EXPRESSION_CONTAINS = [
      ...PREPROCESSORS,
      TYPES3,
      C_LINE_COMMENT_MODE,
      hljs2.C_BLOCK_COMMENT_MODE,
      NUMBERS,
      STRINGS
    ];
    const EXPRESSION_CONTEXT = {
      // This mode covers expression context where we can't expect a function
      // definition and shouldn't highlight anything that looks like one:
      // `return some()`, `else if()`, `(x*sum(1, 2))`
      variants: [
        {
          begin: /=/,
          end: /;/
        },
        {
          begin: /\(/,
          end: /\)/
        },
        {
          beginKeywords: "new throw return else",
          end: /;/
        }
      ],
      keywords: KEYWORDS3,
      contains: EXPRESSION_CONTAINS.concat([
        {
          begin: /\(/,
          end: /\)/,
          keywords: KEYWORDS3,
          contains: EXPRESSION_CONTAINS.concat(["self"]),
          relevance: 0
        }
      ]),
      relevance: 0
    };
    const FUNCTION_DECLARATION = {
      begin: "(" + FUNCTION_TYPE_RE + "[\\*&\\s]+){1," + MAX_FUNCTION_TYPE_TOKENS + "}" + FUNCTION_TITLE,
      returnBegin: true,
      end: /[{;=]/,
      excludeEnd: true,
      keywords: KEYWORDS3,
      illegal: /[^\w\s\*&:<>.]/,
      contains: [
        {
          // to prevent it from being confused as the function title
          begin: DECLTYPE_AUTO_RE,
          keywords: KEYWORDS3,
          relevance: 0
        },
        {
          begin: FUNCTION_TITLE,
          returnBegin: true,
          contains: [hljs2.inherit(TITLE_MODE, { className: "title.function" })],
          relevance: 0
        },
        // allow for multiple declarations, e.g.:
        // extern void f(int), g(char);
        {
          relevance: 0,
          match: /,/
        },
        {
          className: "params",
          begin: /\(/,
          end: /\)/,
          keywords: KEYWORDS3,
          relevance: 0,
          contains: [
            C_LINE_COMMENT_MODE,
            hljs2.C_BLOCK_COMMENT_MODE,
            STRINGS,
            NUMBERS,
            TYPES3,
            // Count matching parentheses.
            {
              begin: /\(/,
              end: /\)/,
              keywords: KEYWORDS3,
              relevance: 0,
              contains: [
                "self",
                C_LINE_COMMENT_MODE,
                hljs2.C_BLOCK_COMMENT_MODE,
                STRINGS,
                NUMBERS,
                TYPES3
              ]
            }
          ]
        },
        TYPES3,
        C_LINE_COMMENT_MODE,
        hljs2.C_BLOCK_COMMENT_MODE,
        ...PREPROCESSORS
      ]
    };
    return {
      name: "C",
      aliases: ["h"],
      keywords: KEYWORDS3,
      // Until differentiations are added between `c` and `cpp`, `c` will
      // not be auto-detected to avoid auto-detect conflicts between C and C++
      disableAutodetect: true,
      illegal: "</",
      contains: [].concat(
        EXPRESSION_CONTEXT,
        FUNCTION_DECLARATION,
        EXPRESSION_CONTAINS,
        [
          ...PREPROCESSORS,
          {
            begin: hljs2.IDENT_RE + "::",
            keywords: KEYWORDS3
          },
          {
            className: "class",
            beginKeywords: "enum class struct union",
            end: /[{;:<>=]/,
            contains: [
              { beginKeywords: "final class struct" },
              hljs2.TITLE_MODE
            ]
          }
        ]
      ),
      exports: {
        preprocessor: PREPROCESSOR,
        strings: STRINGS,
        keywords: KEYWORDS3
      }
    };
  }

  // node_modules/highlight.js/es/languages/java.js
  var decimalDigits = "[0-9](_*[0-9])*";
  var frac = `\\.(${decimalDigits})`;
  var hexDigits = "[0-9a-fA-F](_*[0-9a-fA-F])*";
  var NUMERIC = {
    className: "number",
    variants: [
      // DecimalFloatingPointLiteral
      // including ExponentPart
      { begin: `(\\b(${decimalDigits})((${frac})|\\.)?|(${frac}))[eE][+-]?(${decimalDigits})[fFdD]?\\b` },
      // excluding ExponentPart
      { begin: `\\b(${decimalDigits})((${frac})[fFdD]?\\b|\\.([fFdD]\\b)?)` },
      { begin: `(${frac})[fFdD]?\\b` },
      { begin: `\\b(${decimalDigits})[fFdD]\\b` },
      // HexadecimalFloatingPointLiteral
      { begin: `\\b0[xX]((${hexDigits})\\.?|(${hexDigits})?\\.(${hexDigits}))[pP][+-]?(${decimalDigits})[fFdD]?\\b` },
      // DecimalIntegerLiteral
      { begin: "\\b(0|[1-9](_*[0-9])*)[lL]?\\b" },
      // HexIntegerLiteral
      { begin: `\\b0[xX](${hexDigits})[lL]?\\b` },
      // OctalIntegerLiteral
      { begin: "\\b0(_*[0-7])*[lL]?\\b" },
      // BinaryIntegerLiteral
      { begin: "\\b0[bB][01](_*[01])*[lL]?\\b" }
    ],
    relevance: 0
  };
  function recurRegex(re, substitution, depth) {
    if (depth === -1) return "";
    return re.replace(substitution, (_2) => {
      return recurRegex(re, substitution, depth - 1);
    });
  }
  function java(hljs2) {
    const regex = hljs2.regex;
    const JAVA_IDENT_RE = "[\xC0-\u02B8a-zA-Z_$][\xC0-\u02B8a-zA-Z_$0-9]*";
    const ARRAY_BRACKETS_OPTIONAL_RE = "(?:(?:\\s*\\[\\s*])+)?";
    const SIMPLE_TYPE_RE = JAVA_IDENT_RE + "<@@@>" + ARRAY_BRACKETS_OPTIONAL_RE;
    const WILDCARD_TYPE_RE = "\\?(?:\\s+(?:extends|super)\\s+" + SIMPLE_TYPE_RE + ")?";
    const TYPE_ARG_RE = "(?:" + WILDCARD_TYPE_RE + "|" + SIMPLE_TYPE_RE + ")";
    const TYPE_ARGS_OPTIONAL_RE = recurRegex(
      "(?:\\s*<\\s*" + TYPE_ARG_RE + "(?:\\s*,\\s*" + TYPE_ARG_RE + ")*\\s*>)?",
      /<@@@>/g,
      2
    );
    const MAIN_KEYWORDS = [
      "synchronized",
      "abstract",
      "private",
      "var",
      "static",
      "if",
      "const ",
      "for",
      "while",
      "strictfp",
      "finally",
      "protected",
      "import",
      "native",
      "final",
      "void",
      "enum",
      "else",
      "break",
      "transient",
      "catch",
      "instanceof",
      "volatile",
      "case",
      "assert",
      "package",
      "default",
      "public",
      "try",
      "switch",
      "continue",
      "throws",
      "protected",
      "public",
      "private",
      "module",
      "requires",
      "exports",
      "do",
      "sealed",
      "yield",
      "permits",
      "goto",
      "when"
    ];
    const BUILT_INS3 = [
      "super",
      "this"
    ];
    const LITERALS3 = [
      "false",
      "true",
      "null"
    ];
    const TYPES3 = [
      "char",
      "boolean",
      "long",
      "float",
      "int",
      "byte",
      "short",
      "double"
    ];
    const KEYWORDS3 = {
      keyword: MAIN_KEYWORDS,
      literal: LITERALS3,
      type: TYPES3,
      built_in: BUILT_INS3
    };
    const ANNOTATION = {
      className: "meta",
      begin: "@" + JAVA_IDENT_RE,
      contains: [
        {
          begin: /\(/,
          end: /\)/,
          contains: ["self"]
          // allow nested () inside our annotation
        }
      ]
    };
    const PARAMS = {
      className: "params",
      begin: /\(/,
      end: /\)/,
      keywords: KEYWORDS3,
      relevance: 0,
      contains: [hljs2.C_BLOCK_COMMENT_MODE],
      endsParent: true
    };
    return {
      name: "Java",
      aliases: ["jsp"],
      keywords: KEYWORDS3,
      illegal: /<\/|#/,
      contains: [
        hljs2.COMMENT(
          "/\\*\\*",
          "\\*/",
          {
            relevance: 0,
            contains: [
              {
                // eat up @'s in emails to prevent them to be recognized as doctags
                begin: /\w+@/,
                relevance: 0
              },
              {
                className: "doctag",
                begin: "@[A-Za-z]+"
              }
            ]
          }
        ),
        // relevance boost
        {
          begin: /import java\.[a-z]+\./,
          keywords: "import",
          relevance: 2
        },
        hljs2.C_LINE_COMMENT_MODE,
        hljs2.C_BLOCK_COMMENT_MODE,
        {
          begin: /"""/,
          end: /"""/,
          className: "string",
          contains: [hljs2.BACKSLASH_ESCAPE]
        },
        hljs2.APOS_STRING_MODE,
        hljs2.QUOTE_STRING_MODE,
        {
          match: [
            /\b(?:class|interface|enum|extends|implements|new)/,
            /\s+/,
            JAVA_IDENT_RE
          ],
          className: {
            1: "keyword",
            3: "title.class"
          }
        },
        {
          // Exceptions for hyphenated keywords
          match: /non-sealed/,
          scope: "keyword"
        },
        {
          // Expression keywords prevent keyword-led expressions from being
          // recognized as variable or method declarations.
          beginKeywords: "new throw return else yield assert",
          relevance: 0
        },
        {
          begin: [
            JAVA_IDENT_RE,
            regex.concat(TYPE_ARGS_OPTIONAL_RE, ARRAY_BRACKETS_OPTIONAL_RE, /\s+/),
            JAVA_IDENT_RE,
            ARRAY_BRACKETS_OPTIONAL_RE,
            /\s*/,
            /=(?!=)/
          ],
          className: {
            1: "type",
            3: "variable",
            6: "operator"
          }
        },
        {
          begin: [
            /record/,
            /\s+/,
            JAVA_IDENT_RE
          ],
          className: {
            1: "keyword",
            3: "title.class"
          },
          contains: [
            PARAMS,
            hljs2.C_LINE_COMMENT_MODE,
            hljs2.C_BLOCK_COMMENT_MODE
          ]
        },
        {
          begin: [
            JAVA_IDENT_RE,
            regex.concat(TYPE_ARGS_OPTIONAL_RE, ARRAY_BRACKETS_OPTIONAL_RE, /\s+/),
            JAVA_IDENT_RE,
            /\s*(?=\()/
          ],
          className: {
            1: "type",
            3: "title.function"
          },
          keywords: KEYWORDS3,
          contains: [
            {
              className: "params",
              begin: /\(/,
              end: /\)/,
              keywords: KEYWORDS3,
              relevance: 0,
              contains: [
                ANNOTATION,
                hljs2.APOS_STRING_MODE,
                hljs2.QUOTE_STRING_MODE,
                NUMERIC,
                hljs2.C_BLOCK_COMMENT_MODE
              ]
            },
            hljs2.C_LINE_COMMENT_MODE,
            hljs2.C_BLOCK_COMMENT_MODE
          ]
        },
        NUMERIC,
        ANNOTATION
      ]
    };
  }

  // node_modules/highlight.js/es/languages/csharp.js
  function csharp(hljs2) {
    const BUILT_IN_KEYWORDS = [
      "bool",
      "byte",
      "char",
      "decimal",
      "delegate",
      "double",
      "dynamic",
      "enum",
      "float",
      "int",
      "long",
      "nint",
      "nuint",
      "object",
      "sbyte",
      "short",
      "string",
      "ulong",
      "uint",
      "ushort"
    ];
    const FUNCTION_MODIFIERS = [
      "public",
      "private",
      "protected",
      "static",
      "internal",
      "protected",
      "abstract",
      "async",
      "extern",
      "override",
      "unsafe",
      "virtual",
      "new",
      "sealed",
      "partial"
    ];
    const LITERAL_KEYWORDS = [
      "default",
      "false",
      "null",
      "true"
    ];
    const NORMAL_KEYWORDS = [
      "abstract",
      "as",
      "base",
      "break",
      "case",
      "catch",
      "class",
      "const",
      "continue",
      "do",
      "else",
      "event",
      "explicit",
      "extern",
      "finally",
      "fixed",
      "for",
      "foreach",
      "goto",
      "if",
      "implicit",
      "in",
      "interface",
      "internal",
      "is",
      "lock",
      "namespace",
      "new",
      "operator",
      "out",
      "override",
      "params",
      "private",
      "protected",
      "public",
      "readonly",
      "record",
      "ref",
      "return",
      "scoped",
      "sealed",
      "sizeof",
      "stackalloc",
      "static",
      "struct",
      "switch",
      "this",
      "throw",
      "try",
      "typeof",
      "unchecked",
      "unsafe",
      "using",
      "virtual",
      "void",
      "volatile",
      "while"
    ];
    const CONTEXTUAL_KEYWORDS = [
      "add",
      "alias",
      "and",
      "ascending",
      "args",
      "async",
      "await",
      "by",
      "descending",
      "dynamic",
      "equals",
      "file",
      "from",
      "get",
      "global",
      "group",
      "init",
      "into",
      "join",
      "let",
      "nameof",
      "not",
      "notnull",
      "on",
      "or",
      "orderby",
      "partial",
      "record",
      "remove",
      "required",
      "scoped",
      "select",
      "set",
      "unmanaged",
      "value|0",
      "var",
      "when",
      "where",
      "with",
      "yield"
    ];
    const KEYWORDS3 = {
      keyword: NORMAL_KEYWORDS.concat(CONTEXTUAL_KEYWORDS),
      built_in: BUILT_IN_KEYWORDS,
      literal: LITERAL_KEYWORDS
    };
    const TITLE_MODE = hljs2.inherit(hljs2.TITLE_MODE, { begin: "[a-zA-Z](\\.?\\w)*" });
    const DIGITS = "\\d(_*\\d)*";
    const INTEGER_SUFFIX = "([uU][lL]?|[lL][uU]?)?";
    const REAL_SUFFIX = "([fFdDmM]|[uU][lL]?|[lL][uU]?)?";
    const NUMBERS = {
      className: "number",
      variants: [
        { begin: "\\b0[bB]_*[01](_*[01])*" + INTEGER_SUFFIX },
        { begin: "(-?)\\b0[xX]_*[a-fA-F0-9](_*[a-fA-F0-9])*" + INTEGER_SUFFIX },
        { begin: "(-?)(\\b" + DIGITS + "(\\.(" + DIGITS + ")?)?|\\." + DIGITS + ")([eE][-+]?" + DIGITS + ")?" + REAL_SUFFIX }
      ],
      relevance: 0
    };
    const RAW_STRING = {
      className: "string",
      begin: /"""("*)(?!")(.|\n)*?"""\1/,
      relevance: 1
    };
    const VERBATIM_STRING = {
      className: "string",
      begin: '@"',
      end: '"',
      contains: [{ begin: '""' }]
    };
    const VERBATIM_STRING_NO_LF = hljs2.inherit(VERBATIM_STRING, { illegal: /\n/ });
    const SUBST = {
      className: "subst",
      begin: /\{/,
      end: /\}/,
      keywords: KEYWORDS3
    };
    const SUBST_NO_LF = hljs2.inherit(SUBST, { illegal: /\n/ });
    const INTERPOLATED_STRING = {
      className: "string",
      begin: /\$"/,
      end: '"',
      illegal: /\n/,
      contains: [
        { begin: /\{\{/ },
        { begin: /\}\}/ },
        hljs2.BACKSLASH_ESCAPE,
        SUBST_NO_LF
      ]
    };
    const INTERPOLATED_VERBATIM_STRING = {
      className: "string",
      begin: /\$@"/,
      end: '"',
      contains: [
        { begin: /\{\{/ },
        { begin: /\}\}/ },
        { begin: '""' },
        SUBST
      ]
    };
    const INTERPOLATED_VERBATIM_STRING_NO_LF = hljs2.inherit(INTERPOLATED_VERBATIM_STRING, {
      illegal: /\n/,
      contains: [
        { begin: /\{\{/ },
        { begin: /\}\}/ },
        { begin: '""' },
        SUBST_NO_LF
      ]
    });
    SUBST.contains = [
      INTERPOLATED_VERBATIM_STRING,
      INTERPOLATED_STRING,
      VERBATIM_STRING,
      hljs2.APOS_STRING_MODE,
      hljs2.QUOTE_STRING_MODE,
      NUMBERS,
      hljs2.C_BLOCK_COMMENT_MODE
    ];
    SUBST_NO_LF.contains = [
      INTERPOLATED_VERBATIM_STRING_NO_LF,
      INTERPOLATED_STRING,
      VERBATIM_STRING_NO_LF,
      hljs2.APOS_STRING_MODE,
      hljs2.QUOTE_STRING_MODE,
      NUMBERS,
      hljs2.inherit(hljs2.C_BLOCK_COMMENT_MODE, { illegal: /\n/ })
    ];
    const STRING = { variants: [
      RAW_STRING,
      INTERPOLATED_VERBATIM_STRING,
      INTERPOLATED_STRING,
      VERBATIM_STRING,
      hljs2.APOS_STRING_MODE,
      hljs2.QUOTE_STRING_MODE
    ] };
    const GENERIC_MODIFIER = {
      begin: "<",
      end: ">",
      contains: [
        { beginKeywords: "in out" },
        TITLE_MODE
      ]
    };
    const TYPE_IDENT_RE = hljs2.IDENT_RE + "(<" + hljs2.IDENT_RE + "(\\s*,\\s*" + hljs2.IDENT_RE + ")*>)?(\\[\\])?";
    const AT_IDENTIFIER = {
      // prevents expressions like `@class` from incorrect flagging
      // `class` as a keyword
      begin: "@" + hljs2.IDENT_RE,
      relevance: 0
    };
    return {
      name: "C#",
      aliases: [
        "cs",
        "c#"
      ],
      keywords: KEYWORDS3,
      illegal: /::/,
      contains: [
        hljs2.COMMENT(
          "///",
          "$",
          {
            returnBegin: true,
            contains: [
              {
                className: "doctag",
                variants: [
                  {
                    begin: "///",
                    relevance: 0
                  },
                  { begin: "<!--|-->" },
                  {
                    begin: "</?",
                    end: ">"
                  }
                ]
              }
            ]
          }
        ),
        hljs2.C_LINE_COMMENT_MODE,
        hljs2.C_BLOCK_COMMENT_MODE,
        {
          className: "meta",
          begin: "#",
          end: "$",
          keywords: { keyword: "if else elif endif define undef warning error line region endregion pragma checksum" }
        },
        STRING,
        NUMBERS,
        {
          beginKeywords: "class interface",
          relevance: 0,
          end: /[{;=]/,
          illegal: /[^\s:,]/,
          contains: [
            { beginKeywords: "where class" },
            TITLE_MODE,
            GENERIC_MODIFIER,
            hljs2.C_LINE_COMMENT_MODE,
            hljs2.C_BLOCK_COMMENT_MODE
          ]
        },
        {
          beginKeywords: "namespace",
          relevance: 0,
          end: /[{;=]/,
          illegal: /[^\s:]/,
          contains: [
            TITLE_MODE,
            hljs2.C_LINE_COMMENT_MODE,
            hljs2.C_BLOCK_COMMENT_MODE
          ]
        },
        {
          beginKeywords: "record",
          relevance: 0,
          end: /[{;=]/,
          illegal: /[^\s:]/,
          contains: [
            TITLE_MODE,
            GENERIC_MODIFIER,
            hljs2.C_LINE_COMMENT_MODE,
            hljs2.C_BLOCK_COMMENT_MODE
          ]
        },
        {
          // [Attributes("")]
          className: "meta",
          begin: "^\\s*\\[(?=[\\w])",
          excludeBegin: true,
          end: "\\]",
          excludeEnd: true,
          contains: [
            {
              className: "string",
              begin: /"/,
              end: /"/
            }
          ]
        },
        {
          // Expression keywords prevent 'keyword Name(...)' from being
          // recognized as a function definition
          beginKeywords: "new return throw await else",
          relevance: 0
        },
        {
          className: "function",
          begin: "(" + TYPE_IDENT_RE + "\\s+)+" + hljs2.IDENT_RE + "\\s*(<[^=]+>\\s*)?\\(",
          returnBegin: true,
          end: /\s*[{;=]/,
          excludeEnd: true,
          keywords: KEYWORDS3,
          contains: [
            // prevents these from being highlighted `title`
            {
              beginKeywords: FUNCTION_MODIFIERS.join(" "),
              relevance: 0
            },
            {
              begin: hljs2.IDENT_RE + "\\s*(<[^=]+>\\s*)?\\(",
              returnBegin: true,
              contains: [
                hljs2.TITLE_MODE,
                GENERIC_MODIFIER
              ],
              relevance: 0
            },
            { match: /\(\)/ },
            {
              className: "params",
              begin: /\(/,
              end: /\)/,
              excludeBegin: true,
              excludeEnd: true,
              keywords: KEYWORDS3,
              relevance: 0,
              contains: [
                STRING,
                NUMBERS,
                hljs2.C_BLOCK_COMMENT_MODE
              ]
            },
            hljs2.C_LINE_COMMENT_MODE,
            hljs2.C_BLOCK_COMMENT_MODE
          ]
        },
        AT_IDENTIFIER
      ]
    };
  }

  // node_modules/highlight.js/es/languages/php.js
  function php(hljs2) {
    const regex = hljs2.regex;
    const NOT_PERL_ETC = /(?![A-Za-z0-9])(?![$])/;
    const IDENT_RE3 = regex.concat(
      /[a-zA-Z_\x7f-\xff][a-zA-Z0-9_\x7f-\xff]*/,
      NOT_PERL_ETC
    );
    const PASCAL_CASE_CLASS_NAME_RE = regex.concat(
      /(\\?[A-Z][a-z0-9_\x7f-\xff]+|\\?[A-Z]+(?=[A-Z][a-z0-9_\x7f-\xff])){1,}/,
      NOT_PERL_ETC
    );
    const UPCASE_NAME_RE = regex.concat(
      /[A-Z]+/,
      NOT_PERL_ETC
    );
    const VARIABLE = {
      scope: "variable",
      match: "\\$+" + IDENT_RE3
    };
    const PREPROCESSOR = {
      scope: "meta",
      variants: [
        { begin: /<\?php/, relevance: 10 },
        // boost for obvious PHP
        { begin: /<\?=/ },
        // less relevant per PSR-1 which says not to use short-tags
        { begin: /<\?/, relevance: 0.1 },
        { begin: /\?>/ }
        // end php tag
      ]
    };
    const SUBST = {
      scope: "subst",
      variants: [
        { begin: /\$\w+/ },
        {
          begin: /\{\$/,
          end: /\}/
        }
      ]
    };
    const SINGLE_QUOTED = hljs2.inherit(hljs2.APOS_STRING_MODE, { illegal: null });
    const DOUBLE_QUOTED = hljs2.inherit(hljs2.QUOTE_STRING_MODE, {
      illegal: null,
      contains: hljs2.QUOTE_STRING_MODE.contains.concat(SUBST)
    });
    const HEREDOC = {
      begin: /<<<[ \t]*(?:(\w+)|"(\w+)")\n/,
      end: /[ \t]*(\w+)\b/,
      contains: hljs2.QUOTE_STRING_MODE.contains.concat(SUBST),
      "on:begin": (m3, resp) => {
        resp.data._beginMatch = m3[1] || m3[2];
      },
      "on:end": (m3, resp) => {
        if (resp.data._beginMatch !== m3[1]) resp.ignoreMatch();
      }
    };
    const NOWDOC = hljs2.END_SAME_AS_BEGIN({
      begin: /<<<[ \t]*'(\w+)'\n/,
      end: /[ \t]*(\w+)\b/
    });
    const WHITESPACE = "[ 	\n]";
    const STRING = {
      scope: "string",
      variants: [
        DOUBLE_QUOTED,
        SINGLE_QUOTED,
        HEREDOC,
        NOWDOC
      ]
    };
    const NUMBER = {
      scope: "number",
      variants: [
        { begin: `\\b0[bB][01]+(?:_[01]+)*\\b` },
        // Binary w/ underscore support
        { begin: `\\b0[oO][0-7]+(?:_[0-7]+)*\\b` },
        // Octals w/ underscore support
        { begin: `\\b0[xX][\\da-fA-F]+(?:_[\\da-fA-F]+)*\\b` },
        // Hex w/ underscore support
        // Decimals w/ underscore support, with optional fragments and scientific exponent (e) suffix.
        { begin: `(?:\\b\\d+(?:_\\d+)*(\\.(?:\\d+(?:_\\d+)*))?|\\B\\.\\d+)(?:[eE][+-]?\\d+)?` }
      ],
      relevance: 0
    };
    const LITERALS3 = [
      "false",
      "null",
      "true"
    ];
    const KWS = [
      // Magic constants:
      // <https://www.php.net/manual/en/language.constants.predefined.php>
      "__CLASS__",
      "__DIR__",
      "__FILE__",
      "__FUNCTION__",
      "__COMPILER_HALT_OFFSET__",
      "__LINE__",
      "__METHOD__",
      "__NAMESPACE__",
      "__TRAIT__",
      // Function that look like language construct or language construct that look like function:
      // List of keywords that may not require parenthesis
      "die",
      "echo",
      "exit",
      "include",
      "include_once",
      "print",
      "require",
      "require_once",
      // These are not language construct (function) but operate on the currently-executing function and can access the current symbol table
      // 'compact extract func_get_arg func_get_args func_num_args get_called_class get_parent_class ' +
      // Other keywords:
      // <https://www.php.net/manual/en/reserved.php>
      // <https://www.php.net/manual/en/language.types.type-juggling.php>
      "array",
      "abstract",
      "and",
      "as",
      "binary",
      "bool",
      "boolean",
      "break",
      "callable",
      "case",
      "catch",
      "class",
      "clone",
      "const",
      "continue",
      "declare",
      "default",
      "do",
      "double",
      "else",
      "elseif",
      "empty",
      "enddeclare",
      "endfor",
      "endforeach",
      "endif",
      "endswitch",
      "endwhile",
      "enum",
      "eval",
      "extends",
      "final",
      "finally",
      "float",
      "for",
      "foreach",
      "from",
      "global",
      "goto",
      "if",
      "implements",
      "instanceof",
      "insteadof",
      "int",
      "integer",
      "interface",
      "isset",
      "iterable",
      "list",
      "match|0",
      "mixed",
      "new",
      "never",
      "object",
      "or",
      "private",
      "protected",
      "public",
      "readonly",
      "real",
      "return",
      "string",
      "switch",
      "throw",
      "trait",
      "try",
      "unset",
      "use",
      "var",
      "void",
      "while",
      "xor",
      "yield"
    ];
    const BUILT_INS3 = [
      // Standard PHP library:
      // <https://www.php.net/manual/en/book.spl.php>
      "Error|0",
      "AppendIterator",
      "ArgumentCountError",
      "ArithmeticError",
      "ArrayIterator",
      "ArrayObject",
      "AssertionError",
      "BadFunctionCallException",
      "BadMethodCallException",
      "CachingIterator",
      "CallbackFilterIterator",
      "CompileError",
      "Countable",
      "DirectoryIterator",
      "DivisionByZeroError",
      "DomainException",
      "EmptyIterator",
      "ErrorException",
      "Exception",
      "FilesystemIterator",
      "FilterIterator",
      "GlobIterator",
      "InfiniteIterator",
      "InvalidArgumentException",
      "IteratorIterator",
      "LengthException",
      "LimitIterator",
      "LogicException",
      "MultipleIterator",
      "NoRewindIterator",
      "OutOfBoundsException",
      "OutOfRangeException",
      "OuterIterator",
      "OverflowException",
      "ParentIterator",
      "ParseError",
      "RangeException",
      "RecursiveArrayIterator",
      "RecursiveCachingIterator",
      "RecursiveCallbackFilterIterator",
      "RecursiveDirectoryIterator",
      "RecursiveFilterIterator",
      "RecursiveIterator",
      "RecursiveIteratorIterator",
      "RecursiveRegexIterator",
      "RecursiveTreeIterator",
      "RegexIterator",
      "RuntimeException",
      "SeekableIterator",
      "SplDoublyLinkedList",
      "SplFileInfo",
      "SplFileObject",
      "SplFixedArray",
      "SplHeap",
      "SplMaxHeap",
      "SplMinHeap",
      "SplObjectStorage",
      "SplObserver",
      "SplPriorityQueue",
      "SplQueue",
      "SplStack",
      "SplSubject",
      "SplTempFileObject",
      "TypeError",
      "UnderflowException",
      "UnexpectedValueException",
      "UnhandledMatchError",
      // Reserved interfaces:
      // <https://www.php.net/manual/en/reserved.interfaces.php>
      "ArrayAccess",
      "BackedEnum",
      "Closure",
      "Fiber",
      "Generator",
      "Iterator",
      "IteratorAggregate",
      "Serializable",
      "Stringable",
      "Throwable",
      "Traversable",
      "UnitEnum",
      "WeakReference",
      "WeakMap",
      // Reserved classes:
      // <https://www.php.net/manual/en/reserved.classes.php>
      "Directory",
      "__PHP_Incomplete_Class",
      "parent",
      "php_user_filter",
      "self",
      "static",
      "stdClass"
    ];
    const dualCase = (items) => {
      const result = [];
      items.forEach((item) => {
        result.push(item);
        if (item.toLowerCase() === item) {
          result.push(item.toUpperCase());
        } else {
          result.push(item.toLowerCase());
        }
      });
      return result;
    };
    const KEYWORDS3 = {
      keyword: KWS,
      literal: dualCase(LITERALS3),
      built_in: BUILT_INS3
    };
    const normalizeKeywords = (items) => {
      return items.map((item) => {
        return item.replace(/\|\d+$/, "");
      });
    };
    const CONSTRUCTOR_CALL = { variants: [
      {
        match: [
          /new/,
          regex.concat(WHITESPACE, "+"),
          // to prevent built ins from being confused as the class constructor call
          regex.concat("(?!", normalizeKeywords(BUILT_INS3).join("\\b|"), "\\b)"),
          PASCAL_CASE_CLASS_NAME_RE
        ],
        scope: {
          1: "keyword",
          4: "title.class"
        }
      }
    ] };
    const CONSTANT_REFERENCE = regex.concat(IDENT_RE3, "\\b(?!\\()");
    const LEFT_AND_RIGHT_SIDE_OF_DOUBLE_COLON = { variants: [
      {
        match: [
          regex.concat(
            /::/,
            regex.lookahead(/(?!class\b)/)
          ),
          CONSTANT_REFERENCE
        ],
        scope: { 2: "variable.constant" }
      },
      {
        match: [
          /::/,
          /class/
        ],
        scope: { 2: "variable.language" }
      },
      {
        match: [
          PASCAL_CASE_CLASS_NAME_RE,
          regex.concat(
            /::/,
            regex.lookahead(/(?!class\b)/)
          ),
          CONSTANT_REFERENCE
        ],
        scope: {
          1: "title.class",
          3: "variable.constant"
        }
      },
      {
        match: [
          PASCAL_CASE_CLASS_NAME_RE,
          regex.concat(
            "::",
            regex.lookahead(/(?!class\b)/)
          )
        ],
        scope: { 1: "title.class" }
      },
      {
        match: [
          PASCAL_CASE_CLASS_NAME_RE,
          /::/,
          /class/
        ],
        scope: {
          1: "title.class",
          3: "variable.language"
        }
      }
    ] };
    const NAMED_ARGUMENT = {
      scope: "attr",
      match: regex.concat(IDENT_RE3, regex.lookahead(":"), regex.lookahead(/(?!::)/))
    };
    const PARAMS_MODE = {
      relevance: 0,
      begin: /\(/,
      end: /\)/,
      keywords: KEYWORDS3,
      contains: [
        NAMED_ARGUMENT,
        VARIABLE,
        LEFT_AND_RIGHT_SIDE_OF_DOUBLE_COLON,
        hljs2.C_BLOCK_COMMENT_MODE,
        hljs2.C_LINE_COMMENT_MODE,
        hljs2.HASH_COMMENT_MODE,
        STRING,
        NUMBER,
        CONSTRUCTOR_CALL
      ]
    };
    const FUNCTION_INVOKE = {
      relevance: 0,
      match: [
        /\b/,
        // to prevent keywords from being confused as the function title
        regex.concat("(?!fn\\b|function\\b|", normalizeKeywords(KWS).join("\\b|"), "|", normalizeKeywords(BUILT_INS3).join("\\b|"), "\\b)"),
        IDENT_RE3,
        regex.concat(WHITESPACE, "*"),
        regex.lookahead(/(?=\()/)
      ],
      scope: { 3: "title.function.invoke" },
      contains: [PARAMS_MODE]
    };
    PARAMS_MODE.contains.push(FUNCTION_INVOKE);
    const ATTRIBUTE_CONTAINS = [
      NAMED_ARGUMENT,
      LEFT_AND_RIGHT_SIDE_OF_DOUBLE_COLON,
      hljs2.C_BLOCK_COMMENT_MODE,
      hljs2.C_LINE_COMMENT_MODE,
      hljs2.HASH_COMMENT_MODE,
      STRING,
      NUMBER,
      CONSTRUCTOR_CALL
    ];
    const ATTRIBUTES2 = {
      begin: regex.concat(
        /#\[\s*\\?/,
        regex.either(
          PASCAL_CASE_CLASS_NAME_RE,
          UPCASE_NAME_RE
        )
      ),
      beginScope: "meta",
      end: /]/,
      endScope: "meta",
      keywords: {
        literal: LITERALS3,
        keyword: [
          "new",
          "array"
        ]
      },
      contains: [
        {
          begin: /\[/,
          end: /]/,
          keywords: {
            literal: LITERALS3,
            keyword: [
              "new",
              "array"
            ]
          },
          contains: [
            "self",
            ...ATTRIBUTE_CONTAINS
          ]
        },
        ...ATTRIBUTE_CONTAINS,
        {
          scope: "meta",
          variants: [
            { match: PASCAL_CASE_CLASS_NAME_RE },
            { match: UPCASE_NAME_RE }
          ]
        }
      ]
    };
    return {
      case_insensitive: false,
      keywords: KEYWORDS3,
      contains: [
        ATTRIBUTES2,
        hljs2.HASH_COMMENT_MODE,
        hljs2.COMMENT("//", "$"),
        hljs2.COMMENT(
          "/\\*",
          "\\*/",
          { contains: [
            {
              scope: "doctag",
              match: "@[A-Za-z]+"
            }
          ] }
        ),
        {
          match: /__halt_compiler\(\);/,
          keywords: "__halt_compiler",
          starts: {
            scope: "comment",
            end: hljs2.MATCH_NOTHING_RE,
            contains: [
              {
                match: /\?>/,
                scope: "meta",
                endsParent: true
              }
            ]
          }
        },
        PREPROCESSOR,
        {
          scope: "variable.language",
          match: /\$this\b/
        },
        VARIABLE,
        FUNCTION_INVOKE,
        LEFT_AND_RIGHT_SIDE_OF_DOUBLE_COLON,
        {
          match: [
            /const/,
            /\s/,
            IDENT_RE3
          ],
          scope: {
            1: "keyword",
            3: "variable.constant"
          }
        },
        CONSTRUCTOR_CALL,
        {
          scope: "function",
          relevance: 0,
          beginKeywords: "fn function",
          end: /[;{]/,
          excludeEnd: true,
          illegal: "[$%\\[]",
          contains: [
            { beginKeywords: "use" },
            hljs2.UNDERSCORE_TITLE_MODE,
            {
              begin: "=>",
              // No markup, just a relevance booster
              endsParent: true
            },
            {
              scope: "params",
              begin: "\\(",
              end: "\\)",
              excludeBegin: true,
              excludeEnd: true,
              keywords: KEYWORDS3,
              contains: [
                "self",
                ATTRIBUTES2,
                VARIABLE,
                LEFT_AND_RIGHT_SIDE_OF_DOUBLE_COLON,
                hljs2.C_BLOCK_COMMENT_MODE,
                hljs2.C_LINE_COMMENT_MODE,
                hljs2.HASH_COMMENT_MODE,
                STRING,
                NUMBER
              ]
            }
          ]
        },
        {
          scope: "class",
          variants: [
            {
              beginKeywords: "enum",
              illegal: /[($"]/
            },
            {
              beginKeywords: "class interface trait",
              illegal: /[:($"]/
            }
          ],
          relevance: 0,
          end: /\{/,
          excludeEnd: true,
          contains: [
            { beginKeywords: "extends implements" },
            hljs2.UNDERSCORE_TITLE_MODE
          ]
        },
        // both use and namespace still use "old style" rules (vs multi-match)
        // because the namespace name can include `\` and we still want each
        // element to be treated as its own *individual* title
        {
          beginKeywords: "namespace",
          relevance: 0,
          end: ";",
          illegal: /[.']/,
          contains: [hljs2.inherit(hljs2.UNDERSCORE_TITLE_MODE, { scope: "title.class" })]
        },
        {
          beginKeywords: "use",
          relevance: 0,
          end: ";",
          contains: [
            // TODO: title.function vs title.class
            {
              match: /\b(as|const|function)\b/,
              scope: "keyword"
            },
            // TODO: could be title.class or title.function
            hljs2.UNDERSCORE_TITLE_MODE
          ]
        },
        STRING,
        NUMBER
      ]
    };
  }

  // node_modules/highlight.js/es/languages/xml.js
  function xml(hljs2) {
    const regex = hljs2.regex;
    const TAG_NAME_RE = regex.concat(/[\p{L}_]/u, regex.optional(/[\p{L}0-9_.-]*:/u), /[\p{L}0-9_.-]*/u);
    const XML_IDENT_RE = /[\p{L}0-9._:-]+/u;
    const XML_ENTITIES = {
      className: "symbol",
      begin: /&[a-z]+;|&#[0-9]+;|&#x[a-f0-9]+;/
    };
    const XML_META_KEYWORDS = {
      begin: /\s/,
      contains: [
        {
          className: "keyword",
          begin: /#?[a-z_][a-z1-9_-]+/,
          illegal: /\n/
        }
      ]
    };
    const XML_META_PAR_KEYWORDS = hljs2.inherit(XML_META_KEYWORDS, {
      begin: /\(/,
      end: /\)/
    });
    const APOS_META_STRING_MODE = hljs2.inherit(hljs2.APOS_STRING_MODE, { className: "string" });
    const QUOTE_META_STRING_MODE = hljs2.inherit(hljs2.QUOTE_STRING_MODE, { className: "string" });
    const TAG_INTERNALS = {
      endsWithParent: true,
      illegal: /</,
      relevance: 0,
      contains: [
        {
          className: "attr",
          begin: XML_IDENT_RE,
          relevance: 0
        },
        {
          begin: /=\s*/,
          relevance: 0,
          contains: [
            {
              className: "string",
              endsParent: true,
              variants: [
                {
                  begin: /"/,
                  end: /"/,
                  contains: [XML_ENTITIES]
                },
                {
                  begin: /'/,
                  end: /'/,
                  contains: [XML_ENTITIES]
                },
                { begin: /[^\s"'=<>`]+/ }
              ]
            }
          ]
        }
      ]
    };
    return {
      name: "HTML, XML",
      aliases: [
        "html",
        "xhtml",
        "rss",
        "atom",
        "xjb",
        "xsd",
        "xsl",
        "plist",
        "wsf",
        "svg"
      ],
      case_insensitive: true,
      unicodeRegex: true,
      contains: [
        {
          className: "meta",
          begin: /<![a-z]/,
          end: />/,
          relevance: 10,
          contains: [
            XML_META_KEYWORDS,
            QUOTE_META_STRING_MODE,
            APOS_META_STRING_MODE,
            XML_META_PAR_KEYWORDS,
            {
              begin: /\[/,
              end: /\]/,
              contains: [
                {
                  className: "meta",
                  begin: /<![a-z]/,
                  end: />/,
                  contains: [
                    XML_META_KEYWORDS,
                    XML_META_PAR_KEYWORDS,
                    QUOTE_META_STRING_MODE,
                    APOS_META_STRING_MODE
                  ]
                }
              ]
            }
          ]
        },
        hljs2.COMMENT(
          /<!--/,
          /-->/,
          { relevance: 10 }
        ),
        {
          begin: /<!\[CDATA\[/,
          end: /\]\]>/,
          relevance: 10
        },
        XML_ENTITIES,
        // xml processing instructions
        {
          className: "meta",
          end: /\?>/,
          variants: [
            {
              begin: /<\?xml/,
              relevance: 10,
              contains: [
                QUOTE_META_STRING_MODE
              ]
            },
            {
              begin: /<\?[a-z][a-z0-9]+/
            }
          ]
        },
        {
          className: "tag",
          /*
          The lookahead pattern (?=...) ensures that 'begin' only matches
          '<style' as a single word, followed by a whitespace or an
          ending bracket.
          */
          begin: /<style(?=\s|>)/,
          end: />/,
          keywords: { name: "style" },
          contains: [TAG_INTERNALS],
          starts: {
            end: /<\/style>/,
            returnEnd: true,
            subLanguage: "css"
          }
        },
        {
          className: "tag",
          // See the comment in the <style tag about the lookahead pattern
          begin: /<script(?=\s|>)/,
          end: />/,
          keywords: { name: "script" },
          contains: [TAG_INTERNALS],
          starts: {
            end: /<\/script>/,
            returnEnd: true,
            subLanguage: "javascript"
          }
        },
        // we need this for now for jSX
        {
          className: "tag",
          begin: /<>|<\/>/
        },
        // open tag
        {
          className: "tag",
          begin: regex.concat(
            /</,
            regex.lookahead(regex.concat(
              TAG_NAME_RE,
              // <tag/>
              // <tag>
              // <tag ...
              regex.either(/\/>/, />/, /\s/)
            ))
          ),
          end: /\/?>/,
          contains: [
            {
              className: "name",
              begin: TAG_NAME_RE,
              relevance: 0,
              starts: TAG_INTERNALS
            }
          ]
        },
        // close tag
        {
          className: "tag",
          begin: regex.concat(
            /<\//,
            regex.lookahead(regex.concat(
              TAG_NAME_RE,
              />/
            ))
          ),
          contains: [
            {
              className: "name",
              begin: TAG_NAME_RE,
              relevance: 0
            },
            {
              begin: />/,
              relevance: 0,
              endsParent: true
            }
          ]
        }
      ]
    };
  }

  // node_modules/highlight.js/es/languages/css.js
  var MODES = (hljs2) => {
    return {
      IMPORTANT: {
        scope: "meta",
        begin: "!important"
      },
      BLOCK_COMMENT: hljs2.C_BLOCK_COMMENT_MODE,
      HEXCOLOR: {
        scope: "number",
        begin: /#(([0-9a-fA-F]{3,4})|(([0-9a-fA-F]{2}){3,4}))\b/
      },
      UNICODE_RANGE: {
        scope: "number",
        begin: /\b[Uu]\+[0-9A-Fa-f][0-9A-Fa-f?]{0,5}(-[0-9A-Fa-f][0-9A-Fa-f]{0,5})?/
      },
      FUNCTION_DISPATCH: {
        className: "built_in",
        begin: /[\w-]+(?=\()/
      },
      ATTRIBUTE_SELECTOR_MODE: {
        scope: "selector-attr",
        begin: /\[/,
        end: /\]/,
        illegal: "$",
        contains: [
          hljs2.APOS_STRING_MODE,
          hljs2.QUOTE_STRING_MODE
        ]
      },
      CSS_NUMBER_MODE: {
        scope: "number",
        begin: hljs2.NUMBER_RE + "(%|em|ex|ch|rem|vw|vh|vmin|vmax|cm|mm|in|pt|pc|px|deg|grad|rad|turn|s|ms|Hz|kHz|dpi|dpcm|dppx)?",
        relevance: 0
      },
      CSS_VARIABLE: {
        className: "attr",
        begin: /--[A-Za-z_][A-Za-z0-9_-]*/
      }
    };
  };
  var HTML_TAGS = [
    "a",
    "abbr",
    "address",
    "article",
    "aside",
    "audio",
    "b",
    "blockquote",
    "body",
    "button",
    "canvas",
    "caption",
    "cite",
    "code",
    "dd",
    "del",
    "details",
    "dfn",
    "div",
    "dl",
    "dt",
    "em",
    "fieldset",
    "figcaption",
    "figure",
    "footer",
    "form",
    "h1",
    "h2",
    "h3",
    "h4",
    "h5",
    "h6",
    "header",
    "hgroup",
    "html",
    "i",
    "iframe",
    "img",
    "input",
    "ins",
    "kbd",
    "label",
    "legend",
    "li",
    "main",
    "mark",
    "menu",
    "nav",
    "object",
    "ol",
    "optgroup",
    "option",
    "p",
    "picture",
    "q",
    "quote",
    "samp",
    "section",
    "select",
    "source",
    "span",
    "strong",
    "summary",
    "sup",
    "table",
    "tbody",
    "td",
    "textarea",
    "tfoot",
    "th",
    "thead",
    "time",
    "tr",
    "ul",
    "var",
    "video"
  ];
  var SVG_TAGS = [
    "defs",
    "g",
    "marker",
    "mask",
    "pattern",
    "svg",
    "switch",
    "symbol",
    "feBlend",
    "feColorMatrix",
    "feComponentTransfer",
    "feComposite",
    "feConvolveMatrix",
    "feDiffuseLighting",
    "feDisplacementMap",
    "feFlood",
    "feGaussianBlur",
    "feImage",
    "feMerge",
    "feMorphology",
    "feOffset",
    "feSpecularLighting",
    "feTile",
    "feTurbulence",
    "linearGradient",
    "radialGradient",
    "stop",
    "circle",
    "ellipse",
    "image",
    "line",
    "path",
    "polygon",
    "polyline",
    "rect",
    "text",
    "use",
    "textPath",
    "tspan",
    "foreignObject",
    "clipPath"
  ];
  var TAGS = [
    ...HTML_TAGS,
    ...SVG_TAGS
  ];
  var MEDIA_FEATURES = [
    "any-hover",
    "any-pointer",
    "aspect-ratio",
    "color",
    "color-gamut",
    "color-index",
    "device-aspect-ratio",
    "device-height",
    "device-width",
    "display-mode",
    "forced-colors",
    "grid",
    "height",
    "hover",
    "inverted-colors",
    "monochrome",
    "orientation",
    "overflow-block",
    "overflow-inline",
    "pointer",
    "prefers-color-scheme",
    "prefers-contrast",
    "prefers-reduced-motion",
    "prefers-reduced-transparency",
    "resolution",
    "scan",
    "scripting",
    "update",
    "width",
    // TODO: find a better solution?
    "min-width",
    "max-width",
    "min-height",
    "max-height"
  ].sort().reverse();
  var PSEUDO_CLASSES = [
    "active",
    "any-link",
    "blank",
    "checked",
    "current",
    "default",
    "defined",
    "dir",
    // dir()
    "disabled",
    "drop",
    "empty",
    "enabled",
    "first",
    "first-child",
    "first-of-type",
    "fullscreen",
    "future",
    "focus",
    "focus-visible",
    "focus-within",
    "has",
    // has()
    "host",
    // host or host()
    "host-context",
    // host-context()
    "hover",
    "indeterminate",
    "in-range",
    "invalid",
    "is",
    // is()
    "lang",
    // lang()
    "last-child",
    "last-of-type",
    "left",
    "link",
    "local-link",
    "not",
    // not()
    "nth-child",
    // nth-child()
    "nth-col",
    // nth-col()
    "nth-last-child",
    // nth-last-child()
    "nth-last-col",
    // nth-last-col()
    "nth-last-of-type",
    //nth-last-of-type()
    "nth-of-type",
    //nth-of-type()
    "only-child",
    "only-of-type",
    "optional",
    "out-of-range",
    "past",
    "placeholder-shown",
    "read-only",
    "read-write",
    "required",
    "right",
    "root",
    "scope",
    "target",
    "target-within",
    "user-invalid",
    "valid",
    "visited",
    "where"
    // where()
  ].sort().reverse();
  var PSEUDO_ELEMENTS = [
    "after",
    "backdrop",
    "before",
    "cue",
    "cue-region",
    "first-letter",
    "first-line",
    "grammar-error",
    "marker",
    "part",
    "placeholder",
    "selection",
    "slotted",
    "spelling-error"
  ].sort().reverse();
  var ATTRIBUTES = [
    "accent-color",
    "align-content",
    "align-items",
    "align-self",
    "alignment-baseline",
    "all",
    "anchor-name",
    "animation",
    "animation-composition",
    "animation-delay",
    "animation-direction",
    "animation-duration",
    "animation-fill-mode",
    "animation-iteration-count",
    "animation-name",
    "animation-play-state",
    "animation-range",
    "animation-range-end",
    "animation-range-start",
    "animation-timeline",
    "animation-timing-function",
    "appearance",
    "aspect-ratio",
    "backdrop-filter",
    "backface-visibility",
    "background",
    "background-attachment",
    "background-blend-mode",
    "background-clip",
    "background-color",
    "background-image",
    "background-origin",
    "background-position",
    "background-position-x",
    "background-position-y",
    "background-repeat",
    "background-size",
    "baseline-shift",
    "block-size",
    "border",
    "border-block",
    "border-block-color",
    "border-block-end",
    "border-block-end-color",
    "border-block-end-style",
    "border-block-end-width",
    "border-block-start",
    "border-block-start-color",
    "border-block-start-style",
    "border-block-start-width",
    "border-block-style",
    "border-block-width",
    "border-bottom",
    "border-bottom-color",
    "border-bottom-left-radius",
    "border-bottom-right-radius",
    "border-bottom-style",
    "border-bottom-width",
    "border-collapse",
    "border-color",
    "border-end-end-radius",
    "border-end-start-radius",
    "border-image",
    "border-image-outset",
    "border-image-repeat",
    "border-image-slice",
    "border-image-source",
    "border-image-width",
    "border-inline",
    "border-inline-color",
    "border-inline-end",
    "border-inline-end-color",
    "border-inline-end-style",
    "border-inline-end-width",
    "border-inline-start",
    "border-inline-start-color",
    "border-inline-start-style",
    "border-inline-start-width",
    "border-inline-style",
    "border-inline-width",
    "border-left",
    "border-left-color",
    "border-left-style",
    "border-left-width",
    "border-radius",
    "border-right",
    "border-right-color",
    "border-right-style",
    "border-right-width",
    "border-spacing",
    "border-start-end-radius",
    "border-start-start-radius",
    "border-style",
    "border-top",
    "border-top-color",
    "border-top-left-radius",
    "border-top-right-radius",
    "border-top-style",
    "border-top-width",
    "border-width",
    "bottom",
    "box-align",
    "box-decoration-break",
    "box-direction",
    "box-flex",
    "box-flex-group",
    "box-lines",
    "box-ordinal-group",
    "box-orient",
    "box-pack",
    "box-shadow",
    "box-sizing",
    "break-after",
    "break-before",
    "break-inside",
    "caption-side",
    "caret-color",
    "clear",
    "clip",
    "clip-path",
    "clip-rule",
    "color",
    "color-interpolation",
    "color-interpolation-filters",
    "color-profile",
    "color-rendering",
    "color-scheme",
    "column-count",
    "column-fill",
    "column-gap",
    "column-rule",
    "column-rule-color",
    "column-rule-style",
    "column-rule-width",
    "column-span",
    "column-width",
    "columns",
    "contain",
    "contain-intrinsic-block-size",
    "contain-intrinsic-height",
    "contain-intrinsic-inline-size",
    "contain-intrinsic-size",
    "contain-intrinsic-width",
    "container",
    "container-name",
    "container-type",
    "content",
    "content-visibility",
    "corner-bottom-left-shape",
    "corner-bottom-right-shape",
    "corner-shape",
    "corner-top-left-shape",
    "corner-top-right-shape",
    "counter-increment",
    "counter-reset",
    "counter-set",
    "cue",
    "cue-after",
    "cue-before",
    "cursor",
    "cx",
    "cy",
    "direction",
    "display",
    "dominant-baseline",
    "empty-cells",
    "enable-background",
    "field-sizing",
    "fill",
    "fill-opacity",
    "fill-rule",
    "filter",
    "flex",
    "flex-basis",
    "flex-direction",
    "flex-flow",
    "flex-grow",
    "flex-shrink",
    "flex-wrap",
    "float",
    "flood-color",
    "flood-opacity",
    "flow",
    "font",
    "font-display",
    "font-family",
    "font-feature-settings",
    "font-kerning",
    "font-language-override",
    "font-optical-sizing",
    "font-palette",
    "font-size",
    "font-size-adjust",
    "font-smooth",
    "font-smoothing",
    "font-stretch",
    "font-style",
    "font-synthesis",
    "font-synthesis-position",
    "font-synthesis-small-caps",
    "font-synthesis-style",
    "font-synthesis-weight",
    "font-variant",
    "font-variant-alternates",
    "font-variant-caps",
    "font-variant-east-asian",
    "font-variant-emoji",
    "font-variant-ligatures",
    "font-variant-numeric",
    "font-variant-position",
    "font-variation-settings",
    "font-weight",
    "forced-color-adjust",
    "gap",
    "glyph-orientation-horizontal",
    "glyph-orientation-vertical",
    "grid",
    "grid-area",
    "grid-auto-columns",
    "grid-auto-flow",
    "grid-auto-rows",
    "grid-column",
    "grid-column-end",
    "grid-column-start",
    "grid-gap",
    "grid-row",
    "grid-row-end",
    "grid-row-start",
    "grid-template",
    "grid-template-areas",
    "grid-template-columns",
    "grid-template-rows",
    "hanging-punctuation",
    "height",
    "hyphenate-character",
    "hyphenate-limit-chars",
    "hyphens",
    "icon",
    "image-orientation",
    "image-rendering",
    "image-resolution",
    "ime-mode",
    "initial-letter",
    "initial-letter-align",
    "inline-size",
    "inset",
    "inset-area",
    "inset-block",
    "inset-block-end",
    "inset-block-start",
    "inset-inline",
    "inset-inline-end",
    "inset-inline-start",
    "isolation",
    "justify-content",
    "justify-items",
    "justify-self",
    "kerning",
    "left",
    "letter-spacing",
    "lighting-color",
    "line-break",
    "line-height",
    "line-height-step",
    "list-style",
    "list-style-image",
    "list-style-position",
    "list-style-type",
    "margin",
    "margin-block",
    "margin-block-end",
    "margin-block-start",
    "margin-bottom",
    "margin-inline",
    "margin-inline-end",
    "margin-inline-start",
    "margin-left",
    "margin-right",
    "margin-top",
    "margin-trim",
    "marker",
    "marker-end",
    "marker-mid",
    "marker-start",
    "marks",
    "mask",
    "mask-border",
    "mask-border-mode",
    "mask-border-outset",
    "mask-border-repeat",
    "mask-border-slice",
    "mask-border-source",
    "mask-border-width",
    "mask-clip",
    "mask-composite",
    "mask-image",
    "mask-mode",
    "mask-origin",
    "mask-position",
    "mask-repeat",
    "mask-size",
    "mask-type",
    "masonry-auto-flow",
    "math-depth",
    "math-shift",
    "math-style",
    "max-block-size",
    "max-height",
    "max-inline-size",
    "max-width",
    "min-block-size",
    "min-height",
    "min-inline-size",
    "min-width",
    "mix-blend-mode",
    "nav-down",
    "nav-index",
    "nav-left",
    "nav-right",
    "nav-up",
    "none",
    "normal",
    "object-fit",
    "object-position",
    "offset",
    "offset-anchor",
    "offset-distance",
    "offset-path",
    "offset-position",
    "offset-rotate",
    "opacity",
    "order",
    "orphans",
    "outline",
    "outline-color",
    "outline-offset",
    "outline-style",
    "outline-width",
    "overflow",
    "overflow-anchor",
    "overflow-block",
    "overflow-clip-margin",
    "overflow-inline",
    "overflow-wrap",
    "overflow-x",
    "overflow-y",
    "overlay",
    "overscroll-behavior",
    "overscroll-behavior-block",
    "overscroll-behavior-inline",
    "overscroll-behavior-x",
    "overscroll-behavior-y",
    "padding",
    "padding-block",
    "padding-block-end",
    "padding-block-start",
    "padding-bottom",
    "padding-inline",
    "padding-inline-end",
    "padding-inline-start",
    "padding-left",
    "padding-right",
    "padding-top",
    "page",
    "page-break-after",
    "page-break-before",
    "page-break-inside",
    "paint-order",
    "pause",
    "pause-after",
    "pause-before",
    "perspective",
    "perspective-origin",
    "place-content",
    "place-items",
    "place-self",
    "pointer-events",
    "position",
    "position-anchor",
    "position-visibility",
    "print-color-adjust",
    "quotes",
    "r",
    "resize",
    "rest",
    "rest-after",
    "rest-before",
    "right",
    "rotate",
    "row-gap",
    "ruby-align",
    "ruby-position",
    "scale",
    "scroll-behavior",
    "scroll-margin",
    "scroll-margin-block",
    "scroll-margin-block-end",
    "scroll-margin-block-start",
    "scroll-margin-bottom",
    "scroll-margin-inline",
    "scroll-margin-inline-end",
    "scroll-margin-inline-start",
    "scroll-margin-left",
    "scroll-margin-right",
    "scroll-margin-top",
    "scroll-padding",
    "scroll-padding-block",
    "scroll-padding-block-end",
    "scroll-padding-block-start",
    "scroll-padding-bottom",
    "scroll-padding-inline",
    "scroll-padding-inline-end",
    "scroll-padding-inline-start",
    "scroll-padding-left",
    "scroll-padding-right",
    "scroll-padding-top",
    "scroll-snap-align",
    "scroll-snap-stop",
    "scroll-snap-type",
    "scroll-timeline",
    "scroll-timeline-axis",
    "scroll-timeline-name",
    "scrollbar-color",
    "scrollbar-gutter",
    "scrollbar-width",
    "shape-image-threshold",
    "shape-margin",
    "shape-outside",
    "shape-rendering",
    "speak",
    "speak-as",
    "src",
    // @font-face
    "stop-color",
    "stop-opacity",
    "stroke",
    "stroke-dasharray",
    "stroke-dashoffset",
    "stroke-linecap",
    "stroke-linejoin",
    "stroke-miterlimit",
    "stroke-opacity",
    "stroke-width",
    "tab-size",
    "table-layout",
    "text-align",
    "text-align-all",
    "text-align-last",
    "text-anchor",
    "text-combine-upright",
    "text-decoration",
    "text-decoration-color",
    "text-decoration-line",
    "text-decoration-skip",
    "text-decoration-skip-ink",
    "text-decoration-style",
    "text-decoration-thickness",
    "text-emphasis",
    "text-emphasis-color",
    "text-emphasis-position",
    "text-emphasis-style",
    "text-indent",
    "text-justify",
    "text-orientation",
    "text-overflow",
    "text-rendering",
    "text-shadow",
    "text-size-adjust",
    "text-transform",
    "text-underline-offset",
    "text-underline-position",
    "text-wrap",
    "text-wrap-mode",
    "text-wrap-style",
    "timeline-scope",
    "top",
    "touch-action",
    "transform",
    "transform-box",
    "transform-origin",
    "transform-style",
    "transition",
    "transition-behavior",
    "transition-delay",
    "transition-duration",
    "transition-property",
    "transition-timing-function",
    "translate",
    "unicode-bidi",
    "unicode-range",
    "user-modify",
    "user-select",
    "vector-effect",
    "vertical-align",
    "view-timeline",
    "view-timeline-axis",
    "view-timeline-inset",
    "view-timeline-name",
    "view-transition-name",
    "visibility",
    "voice-balance",
    "voice-duration",
    "voice-family",
    "voice-pitch",
    "voice-range",
    "voice-rate",
    "voice-stress",
    "voice-volume",
    "white-space",
    "white-space-collapse",
    "widows",
    "width",
    "will-change",
    "word-break",
    "word-spacing",
    "word-wrap",
    "writing-mode",
    "x",
    "y",
    "z-index",
    "zoom"
  ].sort().reverse();
  function css(hljs2) {
    const regex = hljs2.regex;
    const modes = MODES(hljs2);
    const VENDOR_PREFIX = { begin: /-(webkit|moz|ms|o)-(?=[a-z])/ };
    const AT_MODIFIERS = "and or not only";
    const AT_PROPERTY_RE = /@-?\w[\w]*(-\w+)*/;
    const IDENT_RE3 = "[a-zA-Z-][a-zA-Z0-9_-]*";
    const STRINGS = [
      hljs2.APOS_STRING_MODE,
      hljs2.QUOTE_STRING_MODE
    ];
    return {
      name: "CSS",
      case_insensitive: true,
      illegal: /[=|'\$]/,
      keywords: { keyframePosition: "from to" },
      classNameAliases: {
        // for visual continuity with `tag {}` and because we
        // don't have a great class for this?
        keyframePosition: "selector-tag"
      },
      contains: [
        modes.BLOCK_COMMENT,
        VENDOR_PREFIX,
        // to recognize keyframe 40% etc which are outside the scope of our
        // attribute value mode
        modes.CSS_NUMBER_MODE,
        {
          className: "selector-id",
          begin: /#[A-Za-z0-9_-]+/,
          relevance: 0
        },
        {
          className: "selector-class",
          begin: "\\." + IDENT_RE3,
          relevance: 0
        },
        modes.ATTRIBUTE_SELECTOR_MODE,
        {
          className: "selector-pseudo",
          variants: [
            { begin: ":(" + PSEUDO_CLASSES.join("|") + ")" },
            { begin: ":(:)?(" + PSEUDO_ELEMENTS.join("|") + ")" }
          ]
        },
        // we may actually need this (12/2020)
        // { // pseudo-selector params
        //   begin: /\(/,
        //   end: /\)/,
        //   contains: [ hljs.CSS_NUMBER_MODE ]
        // },
        modes.CSS_VARIABLE,
        {
          className: "attribute",
          begin: "\\b(" + ATTRIBUTES.join("|") + ")\\b"
        },
        // attribute values
        {
          begin: /:/,
          end: /[;}{]/,
          contains: [
            modes.BLOCK_COMMENT,
            modes.HEXCOLOR,
            modes.IMPORTANT,
            modes.CSS_NUMBER_MODE,
            modes.UNICODE_RANGE,
            ...STRINGS,
            // needed to highlight these as strings and to avoid issues with
            // illegal characters that might be inside urls that would trigger the
            // languages illegal stack
            {
              begin: /(url|data-uri)\(/,
              end: /\)/,
              relevance: 0,
              // from keywords
              keywords: { built_in: "url data-uri" },
              contains: [
                ...STRINGS,
                {
                  className: "string",
                  // any character other than `)` as in `url()` will be the start
                  // of a string, which ends with `)` (from the parent mode)
                  begin: /[^)]/,
                  endsWithParent: true,
                  excludeEnd: true
                }
              ]
            },
            modes.FUNCTION_DISPATCH
          ]
        },
        {
          begin: regex.lookahead(/@/),
          end: "[{;]",
          relevance: 0,
          illegal: /:/,
          // break on Less variables @var: ...
          contains: [
            {
              className: "keyword",
              begin: AT_PROPERTY_RE
            },
            {
              begin: /\s/,
              endsWithParent: true,
              excludeEnd: true,
              relevance: 0,
              keywords: {
                $pattern: /[a-z-]+/,
                keyword: AT_MODIFIERS,
                attribute: MEDIA_FEATURES.join(" ")
              },
              contains: [
                {
                  begin: /[a-z-]+(?=:)/,
                  className: "attribute"
                },
                ...STRINGS,
                modes.CSS_NUMBER_MODE
              ]
            }
          ]
        },
        {
          className: "selector-tag",
          begin: "\\b(" + TAGS.join("|") + ")\\b"
        }
      ]
    };
  }

  // node_modules/highlight.js/es/languages/yaml.js
  function yaml(hljs2) {
    const LITERALS3 = "true false yes no null";
    const URI_CHARACTERS = "[\\w#;/?:@&=+$,.~*'()[\\]]+";
    const KEY = {
      className: "attr",
      variants: [
        // added brackets support and special char support
        { begin: /[\w*@][\w*@ :()\./-]*:(?=[ \t]|$)/ },
        {
          // double quoted keys - with brackets and special char support
          begin: /"[\w*@][\w*@ :()\./-]*":(?=[ \t]|$)/
        },
        {
          // single quoted keys - with brackets and special char support
          begin: /'[\w*@][\w*@ :()\./-]*':(?=[ \t]|$)/
        }
      ]
    };
    const TEMPLATE_VARIABLES = {
      className: "template-variable",
      variants: [
        {
          // jinja templates Ansible
          begin: /\{\{/,
          end: /\}\}/
        },
        {
          // Ruby i18n
          begin: /%\{/,
          end: /\}/
        }
      ]
    };
    const SINGLE_QUOTE_STRING = {
      className: "string",
      relevance: 0,
      begin: /'/,
      end: /'/,
      contains: [
        {
          match: /''/,
          scope: "char.escape",
          relevance: 0
        }
      ]
    };
    const STRING = {
      className: "string",
      relevance: 0,
      variants: [
        {
          begin: /"/,
          end: /"/
        },
        { begin: /\S+/ }
      ],
      contains: [
        hljs2.BACKSLASH_ESCAPE,
        TEMPLATE_VARIABLES
      ]
    };
    const CONTAINER_STRING = hljs2.inherit(STRING, { variants: [
      {
        begin: /'/,
        end: /'/,
        contains: [
          {
            begin: /''/,
            relevance: 0
          }
        ]
      },
      {
        begin: /"/,
        end: /"/
      },
      { begin: /[^\s,{}[\]]+/ }
    ] });
    const DATE_RE = "[0-9]{4}(-[0-9][0-9]){0,2}";
    const TIME_RE = "([Tt \\t][0-9][0-9]?(:[0-9][0-9]){2})?";
    const FRACTION_RE = "(\\.[0-9]*)?";
    const ZONE_RE = "([ \\t])*(Z|[-+][0-9][0-9]?(:[0-9][0-9])?)?";
    const TIMESTAMP = {
      className: "number",
      begin: "\\b" + DATE_RE + TIME_RE + FRACTION_RE + ZONE_RE + "\\b"
    };
    const VALUE_CONTAINER = {
      end: ",",
      endsWithParent: true,
      excludeEnd: true,
      keywords: LITERALS3,
      relevance: 0
    };
    const OBJECT = {
      begin: /\{/,
      end: /\}/,
      contains: [VALUE_CONTAINER],
      illegal: "\\n",
      relevance: 0
    };
    const ARRAY = {
      begin: "\\[",
      end: "\\]",
      contains: [VALUE_CONTAINER],
      illegal: "\\n",
      relevance: 0
    };
    const MODES2 = [
      KEY,
      {
        className: "meta",
        begin: "^---\\s*$",
        relevance: 10
      },
      {
        // multi line string
        // Blocks start with a | or > followed by a newline
        //
        // Indentation of subsequent lines must be the same to
        // be considered part of the block
        className: "string",
        begin: "[\\|>]([1-9]?[+-])?[ ]*\\n( +)[^ ][^\\n]*\\n(\\2[^\\n]+\\n?)*"
      },
      {
        // Ruby/Rails erb
        begin: "<%[%=-]?",
        end: "[%-]?%>",
        subLanguage: "ruby",
        excludeBegin: true,
        excludeEnd: true,
        relevance: 0
      },
      {
        // named tags
        className: "type",
        begin: "!\\w+!" + URI_CHARACTERS
      },
      // https://yaml.org/spec/1.2/spec.html#id2784064
      {
        // verbatim tags
        className: "type",
        begin: "!<" + URI_CHARACTERS + ">"
      },
      {
        // primary tags
        className: "type",
        begin: "!" + URI_CHARACTERS
      },
      {
        // secondary tags
        className: "type",
        begin: "!!" + URI_CHARACTERS
      },
      {
        // fragment id &ref
        className: "meta",
        begin: "&" + hljs2.UNDERSCORE_IDENT_RE + "$"
      },
      {
        // fragment reference *ref
        className: "meta",
        begin: "\\*" + hljs2.UNDERSCORE_IDENT_RE + "$"
      },
      {
        // array listing
        className: "bullet",
        // TODO: remove |$ hack when we have proper look-ahead support
        begin: "-(?=[ ]|$)",
        relevance: 0
      },
      hljs2.HASH_COMMENT_MODE,
      {
        beginKeywords: LITERALS3,
        keywords: { literal: LITERALS3 }
      },
      TIMESTAMP,
      // numbers are any valid C-style number that
      // sit isolated from other words
      {
        className: "number",
        begin: hljs2.C_NUMBER_RE + "\\b",
        relevance: 0
      },
      OBJECT,
      ARRAY,
      SINGLE_QUOTE_STRING,
      STRING
    ];
    const VALUE_MODES = [...MODES2];
    VALUE_MODES.pop();
    VALUE_MODES.push(CONTAINER_STRING);
    VALUE_CONTAINER.contains = VALUE_MODES;
    return {
      name: "YAML",
      case_insensitive: true,
      aliases: ["yml"],
      contains: MODES2
    };
  }

  // node_modules/highlight.js/es/languages/markdown.js
  function markdown(hljs2) {
    const regex = hljs2.regex;
    const INLINE_HTML = {
      begin: /<\/?[A-Za-z_]/,
      end: ">",
      subLanguage: "xml",
      relevance: 0
    };
    const HORIZONTAL_RULE = { match: /^ {0,3}([-*_])[ \t]*(?:\1[ \t]*){2,}$/ };
    const CODE = {
      className: "code",
      variants: [
        // TODO: fix to allow these to work with sublanguage also
        { begin: "(`{3,})[^`](.|\\n)*?\\1`*[ ]*" },
        { begin: "(~{3,})[^~](.|\\n)*?\\1~*[ ]*" },
        // needed to allow markdown as a sublanguage to work
        {
          begin: "```",
          end: "```+[ ]*$"
        },
        {
          begin: "~~~",
          end: "~~~+[ ]*$"
        },
        { begin: "`.+?`" },
        {
          begin: "(?=^( {4}|\\t))",
          // use contains to gobble up multiple lines to allow the block to be whatever size
          // but only have a single open/close tag vs one per line
          contains: [
            {
              begin: "^( {4}|\\t)",
              end: "(\\n)$"
            }
          ],
          relevance: 0
        }
      ]
    };
    const LIST = {
      className: "bullet",
      begin: "^[ 	]*([*+-]|(\\d+\\.))(?=\\s+)",
      end: "\\s+",
      excludeEnd: true
    };
    const LINK_REFERENCE = {
      begin: /^\[[^\n]+\]:/,
      returnBegin: true,
      contains: [
        {
          className: "symbol",
          begin: /\[/,
          end: /\]/,
          excludeBegin: true,
          excludeEnd: true
        },
        {
          className: "link",
          begin: /:\s*/,
          end: /$/,
          excludeBegin: true
        }
      ]
    };
    const URL_SCHEME = /[A-Za-z][A-Za-z0-9+.-]*/;
    const LINK = {
      variants: [
        // too much like nested array access in so many languages
        // to have any real relevance
        {
          begin: /\[.+?\]\[.*?\]/,
          relevance: 0
        },
        // popular internet URLs
        {
          begin: /\[.+?\]\(((data|javascript|mailto):|(?:http|ftp)s?:\/\/).*?\)/,
          relevance: 2
        },
        {
          begin: regex.concat(/\[.+?\]\(/, URL_SCHEME, /:\/\/.*?\)/),
          relevance: 2
        },
        // relative urls
        {
          begin: /\[.+?\]\([./?&#].*?\)/,
          relevance: 1
        },
        // whatever else, lower relevance (might not be a link at all)
        {
          begin: /\[.*?\]\(.*?\)/,
          relevance: 0
        }
      ],
      returnBegin: true,
      contains: [
        {
          // empty strings for alt or link text
          match: /\[(?=\])/
        },
        {
          className: "string",
          relevance: 0,
          begin: "\\[",
          end: "\\]",
          excludeBegin: true,
          returnEnd: true
        },
        {
          className: "link",
          relevance: 0,
          begin: "\\]\\(",
          end: "\\)",
          excludeBegin: true,
          excludeEnd: true
        },
        {
          className: "symbol",
          relevance: 0,
          begin: "\\]\\[",
          end: "\\]",
          excludeBegin: true,
          excludeEnd: true
        }
      ]
    };
    const BOLD = {
      className: "strong",
      contains: [],
      // defined later
      variants: [
        {
          begin: /_{2}(?!\s)/,
          end: /_{2}/
        },
        {
          begin: /\*{2}(?!\s)/,
          end: /\*{2}/
        }
      ]
    };
    const ITALIC = {
      className: "emphasis",
      contains: [],
      // defined later
      variants: [
        {
          begin: /\*(?![*\s])/,
          end: /\*/
        },
        {
          begin: /_(?![_\s])/,
          end: /_/,
          relevance: 0
        }
      ]
    };
    const BOLD_WITHOUT_ITALIC = hljs2.inherit(BOLD, { contains: [] });
    const ITALIC_WITHOUT_BOLD = hljs2.inherit(ITALIC, { contains: [] });
    BOLD.contains.push(ITALIC_WITHOUT_BOLD);
    ITALIC.contains.push(BOLD_WITHOUT_ITALIC);
    let CONTAINABLE = [
      INLINE_HTML,
      LINK
    ];
    [
      BOLD,
      ITALIC,
      BOLD_WITHOUT_ITALIC,
      ITALIC_WITHOUT_BOLD
    ].forEach((m3) => {
      m3.contains = m3.contains.concat(CONTAINABLE);
    });
    CONTAINABLE = CONTAINABLE.concat(BOLD, ITALIC);
    const HEADER = {
      className: "section",
      variants: [
        {
          begin: "^#{1,6}",
          end: "$",
          contains: CONTAINABLE
        },
        {
          begin: "(?=^.+?\\n[=-]{2,}$)",
          contains: [
            { begin: "^[=-]*$" },
            {
              begin: "^",
              end: "\\n",
              contains: CONTAINABLE
            }
          ]
        }
      ]
    };
    const BLOCKQUOTE = {
      className: "quote",
      begin: "^>\\s+",
      contains: CONTAINABLE,
      end: "$"
    };
    const ENTITY = {
      //https://spec.commonmark.org/0.31.2/#entity-references
      scope: "literal",
      match: /&([a-zA-Z0-9]+|#[0-9]{1,7}|#[Xx][0-9a-fA-F]{1,6});/
    };
    return {
      name: "Markdown",
      aliases: [
        "md",
        "mkdown",
        "mkd"
      ],
      contains: [
        HEADER,
        INLINE_HTML,
        LIST,
        // must come before BOLD/ITALIC so that a `***` or `___` thematic break
        // isn't mistaken for the start of bold text
        HORIZONTAL_RULE,
        BOLD,
        ITALIC,
        BLOCKQUOTE,
        CODE,
        LINK,
        LINK_REFERENCE,
        ENTITY
      ]
    };
  }

  // node_modules/highlight.js/es/languages/ruby.js
  function ruby(hljs2) {
    const regex = hljs2.regex;
    const RUBY_METHOD_RE = "([a-zA-Z_]\\w*[!?=]?|[-+~]@|<<|>>|=~|===?|<=>|[<>]=?|\\*\\*|[-/+%^&*~`|]|\\[\\]=?)";
    const CLASS_NAME_RE = regex.either(
      /\b([A-Z]+[a-z0-9]+)+/,
      // ends in caps
      /\b([A-Z]+[a-z0-9]+)+[A-Z]+/
    );
    const CLASS_NAME_WITH_NAMESPACE_RE = regex.concat(CLASS_NAME_RE, /(::\w+)*/);
    const PSEUDO_KWS = [
      "include",
      "extend",
      "prepend",
      "public",
      "private",
      "protected",
      "raise",
      "throw"
    ];
    const RUBY_KEYWORDS = {
      "variable.constant": [
        "__FILE__",
        "__LINE__",
        "__ENCODING__"
      ],
      "variable.language": [
        "self",
        "super"
      ],
      keyword: [
        "alias",
        "and",
        "begin",
        "BEGIN",
        "break",
        "case",
        "class",
        "defined",
        "do",
        "else",
        "elsif",
        "end",
        "END",
        "ensure",
        "for",
        "if",
        "in",
        "module",
        "next",
        "not",
        "or",
        "redo",
        "require",
        "rescue",
        "retry",
        "return",
        "then",
        "undef",
        "unless",
        "until",
        "when",
        "while",
        "yield",
        ...PSEUDO_KWS
      ],
      built_in: [
        "proc",
        "lambda",
        "attr_accessor",
        "attr_reader",
        "attr_writer",
        "define_method",
        "private_constant",
        "module_function"
      ],
      literal: [
        "true",
        "false",
        "nil"
      ]
    };
    const YARDOCTAG = {
      className: "doctag",
      begin: "@[A-Za-z]+"
    };
    const IRB_OBJECT = {
      begin: "#<",
      end: ">"
    };
    const COMMENT_MODES = [
      hljs2.COMMENT(
        "#",
        "$",
        { contains: [YARDOCTAG] }
      ),
      hljs2.COMMENT(
        "^=begin",
        "^=end",
        {
          contains: [YARDOCTAG],
          relevance: 10
        }
      ),
      hljs2.COMMENT("^__END__", hljs2.MATCH_NOTHING_RE)
    ];
    const SUBST = {
      className: "subst",
      begin: /#\{/,
      end: /\}/,
      keywords: RUBY_KEYWORDS
    };
    const STRING = {
      className: "string",
      contains: [
        hljs2.BACKSLASH_ESCAPE,
        SUBST
      ],
      variants: [
        {
          begin: /'/,
          end: /'/
        },
        {
          begin: /"/,
          end: /"/
        },
        {
          begin: /`/,
          end: /`/
        },
        {
          begin: /%[qQwWx]?\(/,
          end: /\)/
        },
        {
          begin: /%[qQwWx]?\[/,
          end: /\]/
        },
        {
          begin: /%[qQwWx]?\{/,
          end: /\}/
        },
        {
          begin: /%[qQwWx]?</,
          end: />/
        },
        {
          begin: /%[qQwWx]?\//,
          end: /\//
        },
        {
          begin: /%[qQwWx]?%/,
          end: /%/
        },
        {
          begin: /%[qQwWx]?-/,
          end: /-/
        },
        {
          begin: /%[qQwWx]?\|/,
          end: /\|/
        },
        // in the following expressions, \B in the beginning suppresses recognition of ?-sequences
        // where ? is the last character of a preceding identifier, as in: `func?4`
        { begin: /\B\?(\\\d{1,3})/ },
        { begin: /\B\?(\\x[A-Fa-f0-9]{1,2})/ },
        { begin: /\B\?(\\u\{?[A-Fa-f0-9]{1,6}\}?)/ },
        { begin: /\B\?(\\M-\\C-|\\M-\\c|\\c\\M-|\\M-|\\C-\\M-)[\x20-\x7e]/ },
        { begin: /\B\?\\(c|C-)[\x20-\x7e]/ },
        { begin: /\B\?\\?\S/ },
        // heredocs
        {
          // this guard makes sure that we have an entire heredoc and not a false
          // positive (auto-detect, etc.)
          begin: regex.concat(
            /<<[-~]?'?/,
            regex.lookahead(/(\w+)(?=\W)[^\n]*\n(?:[^\n]*\n)*?\s*\1\b/)
          ),
          contains: [
            hljs2.END_SAME_AS_BEGIN({
              begin: /(\w+)/,
              end: /(\w+)/,
              contains: [
                hljs2.BACKSLASH_ESCAPE,
                SUBST
              ]
            })
          ]
        }
      ]
    };
    const decimal = "[1-9](_?[0-9])*|0";
    const digits = "[0-9](_?[0-9])*";
    const NUMBER = {
      className: "number",
      relevance: 0,
      variants: [
        // decimal integer/float, optionally exponential or rational, optionally imaginary
        { begin: `\\b(${decimal})(\\.(${digits}))?([eE][+-]?(${digits})|r)?i?\\b` },
        // explicit decimal/binary/octal/hexadecimal integer,
        // optionally rational and/or imaginary
        { begin: "\\b0[dD][0-9](_?[0-9])*r?i?\\b" },
        { begin: "\\b0[bB][0-1](_?[0-1])*r?i?\\b" },
        { begin: "\\b0[oO][0-7](_?[0-7])*r?i?\\b" },
        { begin: "\\b0[xX][0-9a-fA-F](_?[0-9a-fA-F])*r?i?\\b" },
        // 0-prefixed implicit octal integer, optionally rational and/or imaginary
        { begin: "\\b0(_?[0-7])+r?i?\\b" }
      ]
    };
    const PARAMS = {
      variants: [
        {
          match: /\(\)/
        },
        {
          className: "params",
          begin: /\(/,
          end: /(?=\))/,
          excludeBegin: true,
          endsParent: true,
          keywords: RUBY_KEYWORDS
        }
      ]
    };
    const INCLUDE_EXTEND = {
      match: [
        /(include|extend)\s+/,
        CLASS_NAME_WITH_NAMESPACE_RE
      ],
      scope: {
        2: "title.class"
      },
      keywords: RUBY_KEYWORDS
    };
    const CLASS_DEFINITION = {
      variants: [
        {
          match: [
            /class\s+/,
            CLASS_NAME_WITH_NAMESPACE_RE,
            /\s+<\s+/,
            CLASS_NAME_WITH_NAMESPACE_RE
          ]
        },
        {
          match: [
            /\b(class|module)\s+/,
            CLASS_NAME_WITH_NAMESPACE_RE
          ]
        }
      ],
      scope: {
        2: "title.class",
        4: "title.class.inherited"
      },
      keywords: RUBY_KEYWORDS
    };
    const UPPER_CASE_CONSTANT = {
      relevance: 0,
      match: /\b[A-Z][A-Z_0-9]+\b/,
      className: "variable.constant"
    };
    const METHOD_DEFINITION = {
      match: [
        /def/,
        /\s+/,
        RUBY_METHOD_RE
      ],
      scope: {
        1: "keyword",
        3: "title.function"
      },
      contains: [
        PARAMS
      ]
    };
    const OBJECT_CREATION = {
      relevance: 0,
      match: [
        CLASS_NAME_WITH_NAMESPACE_RE,
        /\.new[. (]/
      ],
      scope: {
        1: "title.class"
      }
    };
    const CLASS_REFERENCE = {
      relevance: 0,
      match: CLASS_NAME_RE,
      scope: "title.class"
    };
    const RUBY_DEFAULT_CONTAINS = [
      STRING,
      CLASS_DEFINITION,
      INCLUDE_EXTEND,
      OBJECT_CREATION,
      UPPER_CASE_CONSTANT,
      CLASS_REFERENCE,
      METHOD_DEFINITION,
      {
        // swallow the scope resolution operator so `::` is not read as a symbol
        begin: "::"
      },
      {
        className: "symbol",
        begin: hljs2.UNDERSCORE_IDENT_RE + "(!|\\?)?:",
        relevance: 0
      },
      {
        className: "symbol",
        begin: ":(?!\\s)",
        contains: [
          STRING,
          { begin: RUBY_METHOD_RE }
        ],
        relevance: 0
      },
      NUMBER,
      {
        // negative-look forward attempts to prevent false matches like:
        // @ident@ or $ident$ that might indicate this is not ruby at all
        className: "variable",
        begin: `(\\$\\W)|((\\$|@@?)(\\w+))(?=[^@$?])(?![A-Za-z])(?![@$?'])`
      },
      {
        className: "params",
        begin: /\|(?!=)/,
        end: /\|/,
        excludeBegin: true,
        excludeEnd: true,
        relevance: 0,
        // this could be a lot of things (in other languages) other than params
        keywords: RUBY_KEYWORDS
      },
      {
        // regexp container
        begin: "(" + hljs2.RE_STARTERS_RE + "|unless)\\s*",
        keywords: "unless",
        contains: [
          {
            className: "regexp",
            contains: [
              hljs2.BACKSLASH_ESCAPE,
              SUBST
            ],
            illegal: /\n/,
            variants: [
              {
                begin: "/",
                end: "/[a-z]*"
              },
              {
                begin: /%r\{/,
                end: /\}[a-z]*/
              },
              {
                begin: "%r\\(",
                end: "\\)[a-z]*"
              },
              {
                begin: "%r!",
                end: "![a-z]*"
              },
              {
                begin: "%r\\[",
                end: "\\][a-z]*"
              }
            ]
          }
        ].concat(IRB_OBJECT, COMMENT_MODES),
        relevance: 0
      }
    ].concat(IRB_OBJECT, COMMENT_MODES);
    SUBST.contains = RUBY_DEFAULT_CONTAINS;
    PARAMS.contains = RUBY_DEFAULT_CONTAINS;
    const SIMPLE_PROMPT = "[>?]>";
    const DEFAULT_PROMPT = "[\\w#]+\\(\\w+\\):\\d+:\\d+[>*]";
    const RVM_PROMPT = "(\\w+-)?\\d+\\.\\d+\\.\\d+(p\\d+)?[^\\d][^>]+>";
    const IRB_DEFAULT = [
      {
        begin: /^\s*=>/,
        starts: {
          end: "$",
          contains: RUBY_DEFAULT_CONTAINS
        }
      },
      {
        className: "meta.prompt",
        begin: "^(" + SIMPLE_PROMPT + "|" + DEFAULT_PROMPT + "|" + RVM_PROMPT + ")(?=[ ])",
        starts: {
          end: "$",
          keywords: RUBY_KEYWORDS,
          contains: RUBY_DEFAULT_CONTAINS
        }
      }
    ];
    COMMENT_MODES.unshift(IRB_OBJECT);
    return {
      name: "Ruby",
      aliases: [
        "rb",
        "gemspec",
        "podspec",
        "thor",
        "irb"
      ],
      keywords: RUBY_KEYWORDS,
      illegal: /\/\*/,
      contains: [hljs2.SHEBANG({ binary: "ruby" })].concat(IRB_DEFAULT).concat(COMMENT_MODES).concat(RUBY_DEFAULT_CONTAINS)
    };
  }

  // node_modules/highlight.js/es/languages/swift.js
  function source(re) {
    if (!re) return null;
    if (typeof re === "string") return re;
    return re.source;
  }
  function lookahead(re) {
    return concat("(?=", re, ")");
  }
  function concat(...args) {
    const joined = args.map((x3) => source(x3)).join("");
    return joined;
  }
  function stripOptionsFromArgs(args) {
    const opts = args[args.length - 1];
    if (typeof opts === "object" && opts.constructor === Object) {
      args.splice(args.length - 1, 1);
      return opts;
    } else {
      return {};
    }
  }
  function either(...args) {
    const opts = stripOptionsFromArgs(args);
    const joined = "(" + (opts.capture ? "" : "?:") + args.map((x3) => source(x3)).join("|") + ")";
    return joined;
  }
  new RegExp(either(
    /\[(?:[^\\\]]|\\.)*\]/,
    // a character class, inside which ( and \ lose their meaning
    /\(\?<(?![=!])[^>]+>/,
    // a named capture group `(?<name>` (not a lookbehind `(?<=` / `(?<!`)
    /\(\?'[^']+'/,
    // a named capture group `(?'name'`
    /\(\??/,
    // an opening parenthesis, capturing or non-capturing / lookahead
    /\\([1-9][0-9]*)/,
    // a backreference like `\1`
    /\\./
    // any other escape sequence
  ));
  var keywordWrapper = (keyword) => concat(
    /\b/,
    keyword,
    /\w$/.test(keyword) ? /\b/ : /\B/
  );
  var dotKeywords = [
    "Protocol",
    // contextual
    "Type"
    // contextual
  ].map(keywordWrapper);
  var optionalDotKeywords = [
    "init",
    "self"
  ].map(keywordWrapper);
  var keywordTypes = [
    "Any",
    "Self"
  ];
  var keywords = [
    // strings below will be fed into the regular `keywords` engine while regex
    // will result in additional modes being created to scan for those keywords to
    // avoid conflicts with other rules
    "actor",
    "any",
    // contextual
    "associatedtype",
    "async",
    "await",
    /as\?/,
    // operator
    /as!/,
    // operator
    "as",
    // operator
    "borrowing",
    // contextual
    "break",
    "case",
    "catch",
    "class",
    "consume",
    // contextual
    "consuming",
    // contextual
    "continue",
    "convenience",
    // contextual
    "copy",
    // contextual
    "default",
    "defer",
    "deinit",
    "didSet",
    // contextual
    "distributed",
    "do",
    "dynamic",
    // contextual
    "each",
    "else",
    "enum",
    "extension",
    "fallthrough",
    /fileprivate\(set\)/,
    "fileprivate",
    "final",
    // contextual
    "for",
    "func",
    "get",
    // contextual
    "guard",
    "if",
    "import",
    "indirect",
    // contextual
    "infix",
    // contextual
    /init\?/,
    /init!/,
    "inout",
    /internal\(set\)/,
    "internal",
    "in",
    "is",
    // operator
    "isolated",
    // contextual
    "nonisolated",
    // contextual
    "lazy",
    // contextual
    "let",
    "macro",
    "mutating",
    // contextual
    "nonmutating",
    // contextual
    /open\(set\)/,
    // contextual
    "open",
    // contextual
    "operator",
    "optional",
    // contextual
    "override",
    // contextual
    "package",
    "postfix",
    // contextual
    "precedencegroup",
    "prefix",
    // contextual
    /private\(set\)/,
    "private",
    "protocol",
    /public\(set\)/,
    "public",
    "repeat",
    "required",
    // contextual
    "rethrows",
    "return",
    "set",
    // contextual
    "some",
    // contextual
    "static",
    "struct",
    "subscript",
    "super",
    "switch",
    "throws",
    "throw",
    /try\?/,
    // operator
    /try!/,
    // operator
    "try",
    // operator
    "typealias",
    /unowned\(safe\)/,
    // contextual
    /unowned\(unsafe\)/,
    // contextual
    "unowned",
    // contextual
    "var",
    "weak",
    // contextual
    "where",
    "while",
    "willSet"
    // contextual
  ];
  var literals = [
    "false",
    "nil",
    "true"
  ];
  var precedencegroupKeywords = [
    "assignment",
    "associativity",
    "higherThan",
    "left",
    "lowerThan",
    "none",
    "right"
  ];
  var numberSignKeywords = [
    "#colorLiteral",
    "#column",
    "#dsohandle",
    "#else",
    "#elseif",
    "#endif",
    "#error",
    "#file",
    "#fileID",
    "#fileLiteral",
    "#filePath",
    "#function",
    "#if",
    "#imageLiteral",
    "#keyPath",
    "#line",
    "#selector",
    "#sourceLocation",
    "#warning"
  ];
  var builtIns = [
    "abs",
    "all",
    "any",
    "assert",
    "assertionFailure",
    "debugPrint",
    "dump",
    "fatalError",
    "getVaList",
    "isKnownUniquelyReferenced",
    "max",
    "min",
    "numericCast",
    "pointwiseMax",
    "pointwiseMin",
    "precondition",
    "preconditionFailure",
    "print",
    "readLine",
    "repeatElement",
    "sequence",
    "stride",
    "swap",
    "swift_unboxFromSwiftValueWithType",
    "transcode",
    "type",
    "unsafeBitCast",
    "unsafeDowncast",
    "withExtendedLifetime",
    "withUnsafeMutablePointer",
    "withUnsafePointer",
    "withVaList",
    "withoutActuallyEscaping",
    "zip"
  ];
  var operatorHead = either(
    /[/=\-+!*%<>&|^~?]/,
    /[\u00A1-\u00A7]/,
    /[\u00A9\u00AB]/,
    /[\u00AC\u00AE]/,
    /[\u00B0\u00B1]/,
    /[\u00B6\u00BB\u00BF\u00D7\u00F7]/,
    /[\u2016-\u2017]/,
    /[\u2020-\u2027]/,
    /[\u2030-\u203E]/,
    /[\u2041-\u2053]/,
    /[\u2055-\u205E]/,
    /[\u2190-\u23FF]/,
    /[\u2500-\u2775]/,
    /[\u2794-\u2BFF]/,
    /[\u2E00-\u2E7F]/,
    /[\u3001-\u3003]/,
    /[\u3008-\u3020]/,
    /[\u3030]/
  );
  var operatorCharacter = either(
    operatorHead,
    /[\u0300-\u036F]/,
    /[\u1DC0-\u1DFF]/,
    /[\u20D0-\u20FF]/,
    /[\uFE00-\uFE0F]/,
    /[\uFE20-\uFE2F]/
    // TODO: The following characters are also allowed, but the regex isn't supported yet.
    // /[\u{E0100}-\u{E01EF}]/u
  );
  var operator = concat(operatorHead, operatorCharacter, "*");
  var identifierHead = either(
    /[a-zA-Z_]/,
    /[\u00A8\u00AA\u00AD\u00AF\u00B2-\u00B5\u00B7-\u00BA]/,
    /[\u00BC-\u00BE\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u00FF]/,
    /[\u0100-\u02FF\u0370-\u167F\u1681-\u180D\u180F-\u1DBF]/,
    /[\u1E00-\u1FFF]/,
    /[\u200B-\u200D\u202A-\u202E\u203F-\u2040\u2054\u2060-\u206F]/,
    /[\u2070-\u20CF\u2100-\u218F\u2460-\u24FF\u2776-\u2793]/,
    /[\u2C00-\u2DFF\u2E80-\u2FFF]/,
    /[\u3004-\u3007\u3021-\u302F\u3031-\u303F\u3040-\uD7FF]/,
    /[\uF900-\uFD3D\uFD40-\uFDCF\uFDF0-\uFE1F\uFE30-\uFE44]/,
    /[\uFE47-\uFEFE\uFF00-\uFFFD]/
    // Should be /[\uFE47-\uFFFD]/, but we have to exclude FEFF.
    // The following characters are also allowed, but the regexes aren't supported yet.
    // /[\u{10000}-\u{1FFFD}\u{20000-\u{2FFFD}\u{30000}-\u{3FFFD}\u{40000}-\u{4FFFD}]/u,
    // /[\u{50000}-\u{5FFFD}\u{60000-\u{6FFFD}\u{70000}-\u{7FFFD}\u{80000}-\u{8FFFD}]/u,
    // /[\u{90000}-\u{9FFFD}\u{A0000-\u{AFFFD}\u{B0000}-\u{BFFFD}\u{C0000}-\u{CFFFD}]/u,
    // /[\u{D0000}-\u{DFFFD}\u{E0000-\u{EFFFD}]/u
  );
  var identifierCharacter = either(
    identifierHead,
    /\d/,
    /[\u0300-\u036F\u1DC0-\u1DFF\u20D0-\u20FF\uFE20-\uFE2F]/
  );
  var identifier = concat(identifierHead, identifierCharacter, "*");
  var typeIdentifier = concat(/[A-Z]/, identifierCharacter, "*");
  var keywordAttributes = [
    "attached",
    "autoclosure",
    concat(/convention\(/, either("swift", "block", "c"), /\)/),
    "discardableResult",
    "dynamicCallable",
    "dynamicMemberLookup",
    "escaping",
    "freestanding",
    "frozen",
    "GKInspectable",
    "IBAction",
    "IBDesignable",
    "IBInspectable",
    "IBOutlet",
    "IBSegueAction",
    "inlinable",
    "main",
    "nonobjc",
    "NSApplicationMain",
    "NSCopying",
    "NSManaged",
    concat(/objc\(/, identifier, /\)/),
    "objc",
    "objcMembers",
    "propertyWrapper",
    "requires_stored_property_inits",
    "resultBuilder",
    "Sendable",
    "testable",
    "UIApplicationMain",
    "unchecked",
    "unknown",
    "usableFromInline",
    "warn_unqualified_access"
  ];
  var availabilityKeywords = [
    "iOS",
    "iOSApplicationExtension",
    "macOS",
    "macOSApplicationExtension",
    "macCatalyst",
    "macCatalystApplicationExtension",
    "watchOS",
    "watchOSApplicationExtension",
    "tvOS",
    "tvOSApplicationExtension",
    "swift"
  ];
  function swift(hljs2) {
    const WHITESPACE = {
      match: /\s+/,
      relevance: 0
    };
    const BLOCK_COMMENT = hljs2.COMMENT(
      "/\\*",
      "\\*/",
      { contains: ["self"] }
    );
    const COMMENTS = [
      hljs2.C_LINE_COMMENT_MODE,
      BLOCK_COMMENT
    ];
    const DOT_KEYWORD = {
      match: [
        /\./,
        either(...dotKeywords, ...optionalDotKeywords)
      ],
      className: { 2: "keyword" }
    };
    const KEYWORD_GUARD = {
      // Consume .keyword to prevent highlighting properties and methods as keywords.
      match: concat(/\./, either(...keywords)),
      relevance: 0
    };
    const PLAIN_KEYWORDS = keywords.filter((kw) => typeof kw === "string").concat(["_|0"]);
    const REGEX_KEYWORDS = keywords.filter((kw) => typeof kw !== "string").concat(keywordTypes).map(keywordWrapper);
    const KEYWORD = { variants: [
      {
        className: "keyword",
        match: either(...REGEX_KEYWORDS, ...optionalDotKeywords)
      }
    ] };
    const KEYWORDS3 = {
      $pattern: either(
        /\b\w+/,
        // regular keywords
        /#\w+/
        // number keywords
      ),
      keyword: PLAIN_KEYWORDS.concat(numberSignKeywords),
      literal: literals
    };
    const KEYWORD_MODES = [
      DOT_KEYWORD,
      KEYWORD_GUARD,
      KEYWORD
    ];
    const BUILT_IN_GUARD = {
      // Consume .built_in to prevent highlighting properties and methods.
      match: concat(/\./, either(...builtIns)),
      relevance: 0
    };
    const BUILT_IN = {
      className: "built_in",
      match: concat(/\b/, either(...builtIns), /(?=\()/)
    };
    const BUILT_INS3 = [
      BUILT_IN_GUARD,
      BUILT_IN
    ];
    const OPERATOR_GUARD = {
      // Prevent -> from being highlighting as an operator.
      match: /->/,
      relevance: 0
    };
    const OPERATOR = {
      className: "operator",
      relevance: 0,
      variants: [
        { match: operator },
        {
          // dot-operator: only operators that start with a dot are allowed to use dots as
          // characters (..., ...<, .*, etc). So there rule here is: a dot followed by one or more
          // characters that may also include dots.
          match: `\\.(\\.|${operatorCharacter})+`
        }
      ]
    };
    const OPERATORS = [
      OPERATOR_GUARD,
      OPERATOR
    ];
    const decimalDigits3 = "([0-9]_*)+";
    const hexDigits3 = "([0-9a-fA-F]_*)+";
    const NUMBER = {
      className: "number",
      relevance: 0,
      variants: [
        // decimal floating-point-literal (subsumes decimal-literal)
        { match: `\\b(${decimalDigits3})(\\.(${decimalDigits3}))?([eE][+-]?(${decimalDigits3}))?\\b` },
        // hexadecimal floating-point-literal (subsumes hexadecimal-literal)
        { match: `\\b0x(${hexDigits3})(\\.(${hexDigits3}))?([pP][+-]?(${decimalDigits3}))?\\b` },
        // octal-literal
        { match: /\b0o([0-7]_*)+\b/ },
        // binary-literal
        { match: /\b0b([01]_*)+\b/ }
      ]
    };
    const ESCAPED_CHARACTER = (rawDelimiter = "") => ({
      className: "subst",
      variants: [
        { match: concat(/\\/, rawDelimiter, /[0\\tnr"']/) },
        { match: concat(/\\/, rawDelimiter, /u\{[0-9a-fA-F]{1,8}\}/) }
      ]
    });
    const ESCAPED_NEWLINE = (rawDelimiter = "") => ({
      className: "subst",
      match: concat(/\\/, rawDelimiter, /[\t ]*(?:[\r\n]|\r\n)/)
    });
    const INTERPOLATION = (rawDelimiter = "") => ({
      className: "subst",
      label: "interpol",
      begin: concat(/\\/, rawDelimiter, /\(/),
      end: /\)/
    });
    const MULTILINE_STRING = (rawDelimiter = "") => ({
      begin: concat(rawDelimiter, /"""/),
      end: concat(/"""/, rawDelimiter),
      contains: [
        ESCAPED_CHARACTER(rawDelimiter),
        ESCAPED_NEWLINE(rawDelimiter),
        INTERPOLATION(rawDelimiter)
      ]
    });
    const SINGLE_LINE_STRING = (rawDelimiter = "") => ({
      begin: concat(rawDelimiter, /"/),
      end: concat(/"/, rawDelimiter),
      contains: [
        ESCAPED_CHARACTER(rawDelimiter),
        INTERPOLATION(rawDelimiter)
      ]
    });
    const STRING = {
      className: "string",
      variants: [
        MULTILINE_STRING(),
        MULTILINE_STRING("#"),
        MULTILINE_STRING("##"),
        MULTILINE_STRING("###"),
        SINGLE_LINE_STRING(),
        SINGLE_LINE_STRING("#"),
        SINGLE_LINE_STRING("##"),
        SINGLE_LINE_STRING("###")
      ]
    };
    const REGEXP_CONTENTS = [
      hljs2.BACKSLASH_ESCAPE,
      {
        begin: /\[/,
        end: /\]/,
        relevance: 0,
        contains: [hljs2.BACKSLASH_ESCAPE]
      }
    ];
    const BARE_REGEXP_LITERAL = {
      begin: /\/[^\s](?=[^/\n]*\/)/,
      end: /\//,
      contains: REGEXP_CONTENTS
    };
    const EXTENDED_REGEXP_LITERAL = (rawDelimiter) => {
      const begin = concat(rawDelimiter, /\//);
      const end = concat(/\//, rawDelimiter);
      return {
        begin,
        end,
        contains: [
          ...REGEXP_CONTENTS,
          {
            scope: "comment",
            begin: `#(?!.*${end})`,
            end: /$/
          }
        ]
      };
    };
    const REGEXP = {
      scope: "regexp",
      variants: [
        EXTENDED_REGEXP_LITERAL("###"),
        EXTENDED_REGEXP_LITERAL("##"),
        EXTENDED_REGEXP_LITERAL("#"),
        BARE_REGEXP_LITERAL
      ]
    };
    const QUOTED_IDENTIFIER = { match: concat(/`/, identifier, /`/) };
    const IMPLICIT_PARAMETER = {
      className: "variable",
      match: /\$\d+/
    };
    const PROPERTY_WRAPPER_PROJECTION = {
      className: "variable",
      match: `\\$${identifierCharacter}+`
    };
    const IDENTIFIERS = [
      QUOTED_IDENTIFIER,
      IMPLICIT_PARAMETER,
      PROPERTY_WRAPPER_PROJECTION
    ];
    const AVAILABLE_ATTRIBUTE = {
      match: /(@|#(un)?)available/,
      scope: "keyword",
      starts: { contains: [
        {
          begin: /\(/,
          end: /\)/,
          keywords: availabilityKeywords,
          contains: [
            ...OPERATORS,
            NUMBER,
            STRING
          ]
        }
      ] }
    };
    const KEYWORD_ATTRIBUTE = {
      scope: "keyword",
      match: concat(/@/, either(...keywordAttributes), lookahead(either(/\(/, /\s+/)))
    };
    const USER_DEFINED_ATTRIBUTE = {
      scope: "meta",
      match: concat(/@/, identifier)
    };
    const ATTRIBUTES2 = [
      AVAILABLE_ATTRIBUTE,
      KEYWORD_ATTRIBUTE,
      USER_DEFINED_ATTRIBUTE
    ];
    const TYPE = {
      match: lookahead(/\b[A-Z]/),
      relevance: 0,
      contains: [
        {
          // Common Apple frameworks, for relevance boost
          className: "type",
          match: concat(/(AV|CA|CF|CG|CI|CL|CM|CN|CT|MK|MP|MTK|MTL|NS|SCN|SK|UI|WK|XC)/, identifierCharacter, "+")
        },
        {
          // Type identifier
          className: "type",
          match: typeIdentifier,
          relevance: 0
        },
        {
          // Optional type
          match: /[?!]+/,
          relevance: 0
        },
        {
          // Variadic parameter
          match: /\.\.\./,
          relevance: 0
        },
        {
          // Protocol composition
          match: concat(/\s+&\s+/, lookahead(typeIdentifier)),
          relevance: 0
        }
      ]
    };
    const GENERIC_ARGUMENTS = {
      begin: /</,
      end: />/,
      keywords: KEYWORDS3,
      contains: [
        ...COMMENTS,
        ...KEYWORD_MODES,
        ...ATTRIBUTES2,
        OPERATOR_GUARD,
        TYPE
      ]
    };
    TYPE.contains.push(GENERIC_ARGUMENTS);
    const TUPLE_ELEMENT_NAME = {
      match: concat(identifier, /\s*:/),
      keywords: "_|0",
      relevance: 0
    };
    const TUPLE = {
      begin: /\(/,
      end: /\)/,
      relevance: 0,
      keywords: KEYWORDS3,
      contains: [
        "self",
        TUPLE_ELEMENT_NAME,
        ...COMMENTS,
        REGEXP,
        ...KEYWORD_MODES,
        ...BUILT_INS3,
        ...OPERATORS,
        NUMBER,
        STRING,
        ...IDENTIFIERS,
        ...ATTRIBUTES2,
        TYPE
      ]
    };
    const GENERIC_PARAMETERS = {
      begin: /</,
      end: />/,
      keywords: "repeat each",
      contains: [
        ...COMMENTS,
        TYPE
      ]
    };
    const FUNCTION_PARAMETER_NAME = {
      begin: either(
        lookahead(concat(identifier, /\s*:/)),
        lookahead(concat(identifier, /\s+/, identifier, /\s*:/))
      ),
      end: /:/,
      relevance: 0,
      contains: [
        {
          className: "keyword",
          match: /\b_\b/
        },
        {
          className: "params",
          match: identifier
        }
      ]
    };
    const FUNCTION_PARAMETERS = {
      begin: /\(/,
      end: /\)/,
      keywords: KEYWORDS3,
      contains: [
        FUNCTION_PARAMETER_NAME,
        ...COMMENTS,
        ...KEYWORD_MODES,
        ...OPERATORS,
        NUMBER,
        STRING,
        ...ATTRIBUTES2,
        TYPE,
        TUPLE
      ],
      endsParent: true,
      illegal: /["']/
    };
    const FUNCTION_OR_MACRO = {
      match: [
        /(func|macro)/,
        /\s+/,
        either(QUOTED_IDENTIFIER.match, identifier, operator)
      ],
      className: {
        1: "keyword",
        3: "title.function"
      },
      contains: [
        GENERIC_PARAMETERS,
        FUNCTION_PARAMETERS,
        WHITESPACE
      ],
      illegal: [
        /\[/,
        /%/
      ]
    };
    const INIT_SUBSCRIPT = {
      match: [
        /\b(?:subscript|init[?!]?)/,
        /\s*(?=[<(])/
      ],
      className: { 1: "keyword" },
      contains: [
        GENERIC_PARAMETERS,
        FUNCTION_PARAMETERS,
        WHITESPACE
      ],
      illegal: /\[|%/
    };
    const OPERATOR_DECLARATION = {
      match: [
        /operator/,
        /\s+/,
        operator
      ],
      className: {
        1: "keyword",
        3: "title"
      }
    };
    const PRECEDENCEGROUP = {
      begin: [
        /precedencegroup/,
        /\s+/,
        typeIdentifier
      ],
      className: {
        1: "keyword",
        3: "title"
      },
      contains: [TYPE],
      keywords: [
        ...precedencegroupKeywords,
        ...literals
      ],
      end: /}/
    };
    const CLASS_FUNC_DECLARATION = {
      match: [
        /class\b/,
        /\s+/,
        /func\b/,
        /\s+/,
        /\b[A-Za-z_][A-Za-z0-9_]*\b/
      ],
      scope: {
        1: "keyword",
        3: "keyword",
        5: "title.function"
      }
    };
    const CLASS_VAR_DECLARATION = {
      match: [
        /class\b/,
        /\s+/,
        /var\b/
      ],
      scope: {
        1: "keyword",
        3: "keyword"
      }
    };
    const TYPE_DECLARATION = {
      begin: [
        /(struct|protocol|class|extension|enum|actor)/,
        /\s+/,
        identifier,
        /\s*/
      ],
      beginScope: {
        1: "keyword",
        3: "title.class"
      },
      keywords: KEYWORDS3,
      contains: [
        GENERIC_PARAMETERS,
        ...KEYWORD_MODES,
        {
          begin: /:/,
          end: /\{/,
          keywords: KEYWORDS3,
          contains: [
            {
              scope: "title.class.inherited",
              match: typeIdentifier
            },
            ...KEYWORD_MODES
          ],
          relevance: 0
        }
      ]
    };
    for (const variant of STRING.variants) {
      const interpolation = variant.contains.find((mode) => mode.label === "interpol");
      interpolation.keywords = KEYWORDS3;
      const submodes = [
        ...KEYWORD_MODES,
        ...BUILT_INS3,
        ...OPERATORS,
        NUMBER,
        STRING,
        ...IDENTIFIERS
      ];
      interpolation.contains = [
        ...submodes,
        {
          begin: /\(/,
          end: /\)/,
          contains: [
            "self",
            ...submodes
          ]
        }
      ];
    }
    return {
      name: "Swift",
      keywords: KEYWORDS3,
      contains: [
        ...COMMENTS,
        FUNCTION_OR_MACRO,
        INIT_SUBSCRIPT,
        CLASS_FUNC_DECLARATION,
        CLASS_VAR_DECLARATION,
        TYPE_DECLARATION,
        OPERATOR_DECLARATION,
        PRECEDENCEGROUP,
        {
          beginKeywords: "import",
          end: /$/,
          contains: [...COMMENTS],
          relevance: 0
        },
        REGEXP,
        ...KEYWORD_MODES,
        ...BUILT_INS3,
        ...OPERATORS,
        NUMBER,
        STRING,
        ...IDENTIFIERS,
        ...ATTRIBUTES2,
        TYPE,
        TUPLE
      ]
    };
  }

  // node_modules/highlight.js/es/languages/kotlin.js
  var decimalDigits2 = "[0-9](_*[0-9])*";
  var frac2 = `\\.(${decimalDigits2})`;
  var hexDigits2 = "[0-9a-fA-F](_*[0-9a-fA-F])*";
  var NUMERIC2 = {
    className: "number",
    variants: [
      // DecimalFloatingPointLiteral
      // including ExponentPart
      { begin: `(\\b(${decimalDigits2})((${frac2})|\\.)?|(${frac2}))[eE][+-]?(${decimalDigits2})[fFdD]?\\b` },
      // excluding ExponentPart
      { begin: `\\b(${decimalDigits2})((${frac2})[fFdD]?\\b|\\.([fFdD]\\b)?)` },
      { begin: `(${frac2})[fFdD]?\\b` },
      { begin: `\\b(${decimalDigits2})[fFdD]\\b` },
      // HexadecimalFloatingPointLiteral
      { begin: `\\b0[xX]((${hexDigits2})\\.?|(${hexDigits2})?\\.(${hexDigits2}))[pP][+-]?(${decimalDigits2})[fFdD]?\\b` },
      // DecimalIntegerLiteral
      { begin: "\\b(0|[1-9](_*[0-9])*)[lL]?\\b" },
      // HexIntegerLiteral
      { begin: `\\b0[xX](${hexDigits2})[lL]?\\b` },
      // OctalIntegerLiteral
      { begin: "\\b0(_*[0-7])*[lL]?\\b" },
      // BinaryIntegerLiteral
      { begin: "\\b0[bB][01](_*[01])*[lL]?\\b" }
    ],
    relevance: 0
  };
  function kotlin(hljs2) {
    const KEYWORDS3 = {
      keyword: "abstract as val var vararg get set class object open private protected public noinline crossinline dynamic final enum if else do while for when throw try catch finally import package is in fun override companion reified inline lateinit init interface annotation data sealed internal infix operator out by constructor super tailrec where const inner suspend typealias external expect actual",
      built_in: "Byte Short Char Int Long Boolean Float Double Void Unit Nothing",
      literal: "true false null"
    };
    const KEYWORDS_WITH_LABEL = {
      className: "keyword",
      begin: /\b(break|continue|return|this)\b/,
      starts: { contains: [
        {
          className: "symbol",
          begin: /@\w+/
        }
      ] }
    };
    const LABEL = {
      className: "symbol",
      begin: hljs2.UNDERSCORE_IDENT_RE + "@"
    };
    const SUBST = {
      className: "subst",
      begin: /\$\{/,
      end: /\}/,
      contains: [hljs2.C_NUMBER_MODE]
    };
    const VARIABLE = {
      className: "variable",
      begin: "\\$" + hljs2.UNDERSCORE_IDENT_RE
    };
    const STRING = {
      className: "string",
      variants: [
        {
          begin: '"""',
          end: '"""(?=[^"])',
          contains: [
            VARIABLE,
            SUBST
          ]
        },
        // Can't use built-in modes easily, as we want to use STRING in the meta
        // context as 'meta-string' and there's no syntax to remove explicitly set
        // classNames in built-in modes.
        {
          begin: "'",
          end: "'",
          illegal: /\n/,
          contains: [hljs2.BACKSLASH_ESCAPE]
        },
        {
          begin: '"',
          end: '"',
          illegal: /\n/,
          contains: [
            hljs2.BACKSLASH_ESCAPE,
            VARIABLE,
            SUBST
          ]
        }
      ]
    };
    SUBST.contains.push(STRING);
    const ANNOTATION_USE_SITE = {
      className: "meta",
      begin: "@(?:file|property|field|get|set|receiver|param|setparam|delegate)\\s*:(?:\\s*" + hljs2.UNDERSCORE_IDENT_RE + ")?"
    };
    const ANNOTATION = {
      className: "meta",
      begin: "@" + hljs2.UNDERSCORE_IDENT_RE,
      contains: [
        {
          begin: /\(/,
          end: /\)/,
          contains: [
            hljs2.inherit(STRING, { className: "string" }),
            "self"
          ]
        }
      ]
    };
    const KOTLIN_NUMBER_MODE = NUMERIC2;
    const KOTLIN_NESTED_COMMENT = hljs2.COMMENT(
      "/\\*",
      "\\*/",
      { contains: [hljs2.C_BLOCK_COMMENT_MODE] }
    );
    const KOTLIN_PAREN_TYPE = { variants: [
      {
        className: "type",
        begin: hljs2.UNDERSCORE_IDENT_RE
      },
      {
        begin: /\(/,
        end: /\)/,
        contains: []
        // defined later
      }
    ] };
    const KOTLIN_PAREN_TYPE2 = KOTLIN_PAREN_TYPE;
    KOTLIN_PAREN_TYPE2.variants[1].contains = [KOTLIN_PAREN_TYPE];
    KOTLIN_PAREN_TYPE.variants[1].contains = [KOTLIN_PAREN_TYPE2];
    return {
      name: "Kotlin",
      aliases: [
        "kt",
        "kts",
        "ktm",
        "ktx"
      ],
      keywords: KEYWORDS3,
      contains: [
        hljs2.COMMENT(
          "/\\*\\*",
          "\\*/",
          {
            relevance: 0,
            contains: [
              {
                className: "doctag",
                begin: "@[A-Za-z]+"
              }
            ]
          }
        ),
        hljs2.C_LINE_COMMENT_MODE,
        KOTLIN_NESTED_COMMENT,
        KEYWORDS_WITH_LABEL,
        LABEL,
        ANNOTATION_USE_SITE,
        ANNOTATION,
        {
          className: "function",
          beginKeywords: "fun",
          end: "[(]|$",
          returnBegin: true,
          excludeEnd: true,
          keywords: KEYWORDS3,
          relevance: 5,
          contains: [
            {
              begin: hljs2.UNDERSCORE_IDENT_RE + "\\s*\\(",
              returnBegin: true,
              relevance: 0,
              contains: [hljs2.UNDERSCORE_TITLE_MODE]
            },
            {
              className: "type",
              begin: /</,
              end: />/,
              keywords: "reified",
              relevance: 0
            },
            {
              className: "params",
              begin: /\(/,
              end: /\)/,
              endsParent: true,
              keywords: KEYWORDS3,
              relevance: 0,
              contains: [
                {
                  begin: /:/,
                  end: /[=,\/]/,
                  endsWithParent: true,
                  contains: [
                    KOTLIN_PAREN_TYPE,
                    hljs2.C_LINE_COMMENT_MODE,
                    KOTLIN_NESTED_COMMENT
                  ],
                  relevance: 0
                },
                hljs2.C_LINE_COMMENT_MODE,
                KOTLIN_NESTED_COMMENT,
                ANNOTATION_USE_SITE,
                ANNOTATION,
                STRING,
                hljs2.C_NUMBER_MODE
              ]
            },
            KOTLIN_NESTED_COMMENT
          ]
        },
        {
          begin: [
            /class|interface|trait/,
            /\s+/,
            hljs2.UNDERSCORE_IDENT_RE
          ],
          beginScope: {
            3: "title.class"
          },
          keywords: "class interface trait",
          end: /[:\{(]|$/,
          excludeEnd: true,
          illegal: "extends implements",
          contains: [
            { beginKeywords: "public protected internal private constructor" },
            hljs2.UNDERSCORE_TITLE_MODE,
            {
              className: "type",
              begin: /</,
              end: />/,
              excludeBegin: true,
              excludeEnd: true,
              relevance: 0
            },
            {
              className: "type",
              begin: /[,:]\s*/,
              end: /[<\(,){\s]|$/,
              excludeBegin: true,
              returnEnd: true
            },
            ANNOTATION_USE_SITE,
            ANNOTATION
          ]
        },
        STRING,
        {
          className: "meta",
          begin: "^#!/usr/bin/env",
          end: "$",
          illegal: "\n"
        },
        KOTLIN_NUMBER_MODE
      ]
    };
  }

  // node_modules/highlight.js/es/languages/dockerfile.js
  function dockerfile(hljs2) {
    const KEYWORDS3 = [
      "from",
      "maintainer",
      "expose",
      "env",
      "arg",
      "user",
      "onbuild",
      "stopsignal"
    ];
    return {
      name: "Dockerfile",
      aliases: ["docker"],
      case_insensitive: true,
      keywords: KEYWORDS3,
      contains: [
        hljs2.HASH_COMMENT_MODE,
        hljs2.APOS_STRING_MODE,
        hljs2.QUOTE_STRING_MODE,
        hljs2.NUMBER_MODE,
        {
          beginKeywords: "run cmd entrypoint volume add copy workdir label healthcheck shell",
          starts: {
            end: /[^\\]$/,
            subLanguage: "bash"
          }
        }
      ],
      illegal: "</"
    };
  }

  // node_modules/highlight.js/es/languages/diff.js
  function diff(hljs2) {
    const regex = hljs2.regex;
    return {
      name: "Diff",
      aliases: ["patch"],
      contains: [
        {
          className: "meta",
          relevance: 10,
          match: regex.either(
            /^@@ +-\d+,\d+ +\+\d+,\d+ +@@/,
            // @@ -1,2 +1,2 @@
            /^@@ +-\d+ +\+\d+,\d+ +@@/,
            // @@ -1 +1,2 @@
            /^@@ +-\d+,\d+ +\+\d+ +@@/,
            // @@ -1,2 +1 @@
            /^@@ +-\d+ +\+\d+ +@@/,
            // @@ -1 +1 @@
            /^\*\*\* +\d+,\d+ +\*\*\*\*$/,
            /^--- +\d+,\d+ +----$/
          )
        },
        {
          className: "comment",
          variants: [
            {
              begin: regex.either(
                /Index: /,
                /^index/,
                /={3,}/,
                /^-{3}/,
                /^\*{3} /,
                /^\+{3}/,
                /^diff --git/
              ),
              end: /$/
            },
            { match: /^\*{15}$/ }
          ]
        },
        {
          className: "addition",
          begin: /^\+/,
          end: /$/
        },
        {
          className: "deletion",
          begin: /^-/,
          end: /$/
        },
        {
          className: "addition",
          begin: /^!/,
          end: /$/
        }
      ]
    };
  }

  // node_modules/highlight.js/es/languages/ini.js
  function ini(hljs2) {
    const regex = hljs2.regex;
    const NUMBERS = {
      className: "number",
      relevance: 0,
      variants: [
        { begin: /([+-]+)?[\d]+_[\d_]+/ },
        { begin: hljs2.NUMBER_RE }
      ]
    };
    const COMMENTS = hljs2.COMMENT();
    COMMENTS.variants = [
      {
        begin: /;/,
        end: /$/
      },
      {
        begin: /#/,
        end: /$/
      }
    ];
    const VARIABLES = {
      className: "variable",
      variants: [
        { begin: /\$[\w\d"][\w\d_]*/ },
        { begin: /\$\{(.*?)\}/ }
      ]
    };
    const LITERALS3 = {
      className: "literal",
      begin: /\bon|off|true|false|yes|no\b/
    };
    const STRINGS = {
      className: "string",
      contains: [hljs2.BACKSLASH_ESCAPE],
      variants: [
        {
          begin: "'''",
          end: "'''",
          relevance: 10
        },
        {
          begin: '"""',
          end: '"""',
          relevance: 10
        },
        {
          begin: '"',
          end: '"'
        },
        {
          begin: "'",
          end: "'"
        }
      ]
    };
    const ARRAY = {
      begin: /\[/,
      end: /\]/,
      contains: [
        COMMENTS,
        LITERALS3,
        VARIABLES,
        STRINGS,
        NUMBERS,
        "self"
      ],
      relevance: 0
    };
    const BARE_KEY = /[A-Za-z0-9_-]+/;
    const QUOTED_KEY_DOUBLE_QUOTE = /"(\\"|[^"])*"/;
    const QUOTED_KEY_SINGLE_QUOTE = /'[^']*'/;
    const ANY_KEY = regex.either(
      BARE_KEY,
      QUOTED_KEY_DOUBLE_QUOTE,
      QUOTED_KEY_SINGLE_QUOTE
    );
    const DOTTED_KEY = regex.concat(
      ANY_KEY,
      "(\\s*\\.\\s*",
      ANY_KEY,
      ")*",
      regex.lookahead(/\s*=\s*[^#\s]/)
    );
    return {
      name: "TOML, also INI",
      aliases: ["toml"],
      case_insensitive: true,
      illegal: /\S/,
      contains: [
        COMMENTS,
        {
          className: "section",
          begin: /\[+/,
          end: /\]+/
        },
        {
          begin: DOTTED_KEY,
          className: "attr",
          starts: {
            end: /$/,
            contains: [
              COMMENTS,
              ARRAY,
              LITERALS3,
              VARIABLES,
              STRINGS,
              NUMBERS
            ]
          }
        }
      ]
    };
  }

  // node_modules/highlight.js/es/languages/plaintext.js
  function plaintext(hljs2) {
    return {
      name: "Plain text",
      aliases: [
        "text",
        "txt"
      ],
      disableAutodetect: true
    };
  }

  // node_modules/dompurify/dist/purify.es.mjs
  function _arrayLikeToArray(r, a) {
    (null == a || a > r.length) && (a = r.length);
    for (var e = 0, n = Array(a); e < a; e++) n[e] = r[e];
    return n;
  }
  function _arrayWithHoles(r) {
    if (Array.isArray(r)) return r;
  }
  function _iterableToArrayLimit(r, l3) {
    var t = null == r ? null : "undefined" != typeof Symbol && r[Symbol.iterator] || r["@@iterator"];
    if (null != t) {
      var e, n, i, u2, a = [], f3 = true, o = false;
      try {
        if (i = (t = t.call(r)).next, 0 === l3) ;
        else for (; !(f3 = (e = i.call(t)).done) && (a.push(e.value), a.length !== l3); f3 = true) ;
      } catch (r2) {
        o = true, n = r2;
      } finally {
        try {
          if (!f3 && null != t.return && (u2 = t.return(), Object(u2) !== u2)) return;
        } finally {
          if (o) throw n;
        }
      }
      return a;
    }
  }
  function _nonIterableRest() {
    throw new TypeError("Invalid attempt to destructure non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.");
  }
  function _slicedToArray(r, e) {
    return _arrayWithHoles(r) || _iterableToArrayLimit(r, e) || _unsupportedIterableToArray(r, e) || _nonIterableRest();
  }
  function _unsupportedIterableToArray(r, a) {
    if (r) {
      if ("string" == typeof r) return _arrayLikeToArray(r, a);
      var t = {}.toString.call(r).slice(8, -1);
      return "Object" === t && r.constructor && (t = r.constructor.name), "Map" === t || "Set" === t ? Array.from(r) : "Arguments" === t || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(t) ? _arrayLikeToArray(r, a) : void 0;
    }
  }
  var entries = Object.entries;
  var setPrototypeOf = Object.setPrototypeOf;
  var isFrozen = Object.isFrozen;
  var getPrototypeOf = Object.getPrototypeOf;
  var getOwnPropertyDescriptor = Object.getOwnPropertyDescriptor;
  var freeze = Object.freeze;
  var seal = Object.seal;
  var create = Object.create;
  var _ref = typeof Reflect !== "undefined" && Reflect;
  var apply = _ref.apply;
  var construct = _ref.construct;
  if (!freeze) {
    freeze = function freeze2(x3) {
      return x3;
    };
  }
  if (!seal) {
    seal = function seal2(x3) {
      return x3;
    };
  }
  if (!apply) {
    apply = function apply2(func, thisArg) {
      for (var _len = arguments.length, args = new Array(_len > 2 ? _len - 2 : 0), _key = 2; _key < _len; _key++) {
        args[_key - 2] = arguments[_key];
      }
      return func.apply(thisArg, args);
    };
  }
  if (!construct) {
    construct = function construct2(Func) {
      for (var _len2 = arguments.length, args = new Array(_len2 > 1 ? _len2 - 1 : 0), _key2 = 1; _key2 < _len2; _key2++) {
        args[_key2 - 1] = arguments[_key2];
      }
      return new Func(...args);
    };
  }
  var arrayForEach = unapply(Array.prototype.forEach);
  var arrayLastIndexOf = unapply(Array.prototype.lastIndexOf);
  var arrayPop = unapply(Array.prototype.pop);
  var arrayPush = unapply(Array.prototype.push);
  var arraySplice = unapply(Array.prototype.splice);
  var arrayIsArray = Array.isArray;
  var stringToLowerCase = unapply(String.prototype.toLowerCase);
  var stringToString = unapply(String.prototype.toString);
  var stringMatch = unapply(String.prototype.match);
  var stringReplace = unapply(String.prototype.replace);
  var stringIndexOf = unapply(String.prototype.indexOf);
  var stringTrim = unapply(String.prototype.trim);
  var numberToString = unapply(Number.prototype.toString);
  var booleanToString = unapply(Boolean.prototype.toString);
  var bigintToString = typeof BigInt === "undefined" ? null : unapply(BigInt.prototype.toString);
  var symbolToString = typeof Symbol === "undefined" ? null : unapply(Symbol.prototype.toString);
  var objectHasOwnProperty = unapply(Object.prototype.hasOwnProperty);
  var objectToString = unapply(Object.prototype.toString);
  var regExpTest = unapply(RegExp.prototype.test);
  var typeErrorCreate = unconstruct(TypeError);
  function unapply(func) {
    return function(thisArg) {
      if (thisArg instanceof RegExp) {
        thisArg.lastIndex = 0;
      }
      for (var _len3 = arguments.length, args = new Array(_len3 > 1 ? _len3 - 1 : 0), _key3 = 1; _key3 < _len3; _key3++) {
        args[_key3 - 1] = arguments[_key3];
      }
      return apply(func, thisArg, args);
    };
  }
  function unconstruct(Func) {
    return function() {
      for (var _len4 = arguments.length, args = new Array(_len4), _key4 = 0; _key4 < _len4; _key4++) {
        args[_key4] = arguments[_key4];
      }
      return construct(Func, args);
    };
  }
  function addToSet(set, array) {
    let transformCaseFunc = arguments.length > 2 && arguments[2] !== void 0 ? arguments[2] : stringToLowerCase;
    if (setPrototypeOf) {
      setPrototypeOf(set, null);
    }
    if (!arrayIsArray(array)) {
      return set;
    }
    let l3 = array.length;
    while (l3--) {
      let element = array[l3];
      if (typeof element === "string") {
        const lcElement = transformCaseFunc(element);
        if (lcElement !== element) {
          if (!isFrozen(array)) {
            array[l3] = lcElement;
          }
          element = lcElement;
        }
      }
      set[element] = true;
    }
    return set;
  }
  function cleanArray(array) {
    for (let index = 0; index < array.length; index++) {
      const isPropertyExist = objectHasOwnProperty(array, index);
      if (!isPropertyExist) {
        array[index] = null;
      }
    }
    return array;
  }
  function clone(object) {
    const newObject = create(null);
    for (const _ref2 of entries(object)) {
      var _ref3 = _slicedToArray(_ref2, 2);
      const property = _ref3[0];
      const value = _ref3[1];
      const isPropertyExist = objectHasOwnProperty(object, property);
      if (isPropertyExist) {
        if (arrayIsArray(value)) {
          newObject[property] = cleanArray(value);
        } else if (value && typeof value === "object" && value.constructor === Object) {
          newObject[property] = clone(value);
        } else {
          newObject[property] = value;
        }
      }
    }
    return newObject;
  }
  function stringifyValue(value) {
    switch (typeof value) {
      case "string": {
        return value;
      }
      case "number": {
        return numberToString(value);
      }
      case "boolean": {
        return booleanToString(value);
      }
      case "bigint": {
        return bigintToString ? bigintToString(value) : "0";
      }
      case "symbol": {
        return symbolToString ? symbolToString(value) : "Symbol()";
      }
      case "undefined": {
        return objectToString(value);
      }
      case "function":
      case "object": {
        if (value === null) {
          return objectToString(value);
        }
        const valueAsRecord = value;
        const valueToString = lookupGetter(valueAsRecord, "toString");
        if (typeof valueToString === "function") {
          const stringified = valueToString(valueAsRecord);
          return typeof stringified === "string" ? stringified : objectToString(stringified);
        }
        return objectToString(value);
      }
      default: {
        return objectToString(value);
      }
    }
  }
  function lookupGetter(object, prop) {
    while (object !== null) {
      const desc = getOwnPropertyDescriptor(object, prop);
      if (desc) {
        if (desc.get) {
          return unapply(desc.get);
        }
        if (typeof desc.value === "function") {
          return unapply(desc.value);
        }
      }
      object = getPrototypeOf(object);
    }
    function fallbackValue() {
      return null;
    }
    return fallbackValue;
  }
  function isRegex(value) {
    try {
      regExpTest(value, "");
      return true;
    } catch (_unused) {
      return false;
    }
  }
  var html$1 = freeze(["a", "abbr", "acronym", "address", "area", "article", "aside", "audio", "b", "bdi", "bdo", "big", "blink", "blockquote", "body", "br", "button", "canvas", "caption", "center", "cite", "code", "col", "colgroup", "content", "data", "datalist", "dd", "decorator", "del", "details", "dfn", "dialog", "dir", "div", "dl", "dt", "element", "em", "fieldset", "figcaption", "figure", "font", "footer", "form", "h1", "h2", "h3", "h4", "h5", "h6", "head", "header", "hgroup", "hr", "html", "i", "img", "input", "ins", "kbd", "label", "legend", "li", "main", "map", "mark", "marquee", "menu", "menuitem", "meter", "nav", "nobr", "ol", "optgroup", "option", "output", "p", "picture", "pre", "progress", "q", "rp", "rt", "ruby", "s", "samp", "search", "section", "select", "shadow", "slot", "small", "source", "spacer", "span", "strike", "strong", "style", "sub", "summary", "sup", "table", "tbody", "td", "template", "textarea", "tfoot", "th", "thead", "time", "tr", "track", "tt", "u", "ul", "var", "video", "wbr"]);
  var svg$1 = freeze(["svg", "a", "altglyph", "altglyphdef", "altglyphitem", "animatecolor", "animatemotion", "animatetransform", "circle", "clippath", "defs", "desc", "ellipse", "enterkeyhint", "exportparts", "filter", "font", "g", "glyph", "glyphref", "hkern", "image", "inputmode", "line", "lineargradient", "marker", "mask", "metadata", "mpath", "part", "path", "pattern", "polygon", "polyline", "radialgradient", "rect", "stop", "style", "switch", "symbol", "text", "textpath", "title", "tref", "tspan", "view", "vkern"]);
  var svgFilters = freeze(["feBlend", "feColorMatrix", "feComponentTransfer", "feComposite", "feConvolveMatrix", "feDiffuseLighting", "feDisplacementMap", "feDistantLight", "feDropShadow", "feFlood", "feFuncA", "feFuncB", "feFuncG", "feFuncR", "feGaussianBlur", "feImage", "feMerge", "feMergeNode", "feMorphology", "feOffset", "fePointLight", "feSpecularLighting", "feSpotLight", "feTile", "feTurbulence"]);
  var svgDisallowed = freeze(["animate", "color-profile", "cursor", "discard", "font-face", "font-face-format", "font-face-name", "font-face-src", "font-face-uri", "foreignobject", "hatch", "hatchpath", "mesh", "meshgradient", "meshpatch", "meshrow", "missing-glyph", "script", "set", "solidcolor", "unknown", "use"]);
  var mathMl$1 = freeze(["math", "menclose", "merror", "mfenced", "mfrac", "mglyph", "mi", "mlabeledtr", "mmultiscripts", "mn", "mo", "mover", "mpadded", "mphantom", "mroot", "mrow", "ms", "mspace", "msqrt", "mstyle", "msub", "msup", "msubsup", "mtable", "mtd", "mtext", "mtr", "munder", "munderover", "mprescripts"]);
  var mathMlDisallowed = freeze(["maction", "maligngroup", "malignmark", "mlongdiv", "mscarries", "mscarry", "msgroup", "mstack", "msline", "msrow", "semantics", "annotation", "annotation-xml", "mprescripts", "none"]);
  var text = freeze(["#text"]);
  var html = freeze(["accept", "action", "align", "alt", "autocapitalize", "autocomplete", "autopictureinpicture", "autoplay", "background", "bgcolor", "border", "capture", "cellpadding", "cellspacing", "checked", "cite", "class", "clear", "color", "cols", "colspan", "command", "commandfor", "controls", "controlslist", "coords", "crossorigin", "datetime", "decoding", "default", "dir", "disabled", "disablepictureinpicture", "disableremoteplayback", "download", "draggable", "enctype", "enterkeyhint", "exportparts", "face", "for", "headers", "height", "hidden", "high", "href", "hreflang", "id", "inert", "inputmode", "integrity", "ismap", "kind", "label", "lang", "list", "loading", "loop", "low", "max", "maxlength", "media", "method", "min", "minlength", "multiple", "muted", "name", "nonce", "noshade", "novalidate", "nowrap", "open", "optimum", "part", "pattern", "placeholder", "playsinline", "popover", "popovertarget", "popovertargetaction", "poster", "preload", "pubdate", "radiogroup", "readonly", "rel", "required", "rev", "reversed", "role", "rows", "rowspan", "spellcheck", "scope", "selected", "shape", "size", "sizes", "slot", "span", "srclang", "start", "src", "srcset", "step", "style", "summary", "tabindex", "title", "translate", "type", "usemap", "valign", "value", "width", "wrap", "xmlns"]);
  var svg = freeze(["accent-height", "accumulate", "additive", "alignment-baseline", "amplitude", "ascent", "attributename", "attributetype", "azimuth", "basefrequency", "baseline-shift", "begin", "bias", "by", "class", "clip", "clippathunits", "clip-path", "clip-rule", "color", "color-interpolation", "color-interpolation-filters", "color-profile", "color-rendering", "cx", "cy", "d", "dx", "dy", "diffuseconstant", "direction", "display", "divisor", "dominant-baseline", "dur", "edgemode", "elevation", "end", "exponent", "fill", "fill-opacity", "fill-rule", "filter", "filterunits", "flood-color", "flood-opacity", "font-family", "font-size", "font-size-adjust", "font-stretch", "font-style", "font-variant", "font-weight", "fx", "fy", "g1", "g2", "glyph-name", "glyphref", "gradientunits", "gradienttransform", "height", "href", "id", "image-rendering", "in", "in2", "intercept", "k", "k1", "k2", "k3", "k4", "kerning", "keypoints", "keysplines", "keytimes", "lang", "lengthadjust", "letter-spacing", "kernelmatrix", "kernelunitlength", "lighting-color", "local", "marker-end", "marker-mid", "marker-start", "markerheight", "markerunits", "markerwidth", "maskcontentunits", "maskunits", "max", "mask", "mask-type", "media", "method", "mode", "min", "name", "numoctaves", "offset", "operator", "opacity", "order", "orient", "orientation", "origin", "overflow", "paint-order", "path", "pathlength", "patterncontentunits", "patterntransform", "patternunits", "pointer-events", "points", "preservealpha", "preserveaspectratio", "primitiveunits", "r", "rx", "ry", "radius", "refx", "refy", "repeatcount", "repeatdur", "restart", "result", "rotate", "scale", "seed", "shape-rendering", "slope", "specularconstant", "specularexponent", "spreadmethod", "startoffset", "stddeviation", "stitchtiles", "stop-color", "stop-opacity", "stroke-dasharray", "stroke-dashoffset", "stroke-linecap", "stroke-linejoin", "stroke-miterlimit", "stroke-opacity", "stroke", "stroke-width", "style", "surfacescale", "systemlanguage", "tabindex", "tablevalues", "targetx", "targety", "transform", "transform-origin", "text-anchor", "text-decoration", "text-orientation", "text-rendering", "textlength", "type", "u1", "u2", "unicode", "values", "vector-effect", "viewbox", "visibility", "version", "vert-adv-y", "vert-origin-x", "vert-origin-y", "width", "word-spacing", "wrap", "writing-mode", "xchannelselector", "ychannelselector", "x", "x1", "x2", "xmlns", "y", "y1", "y2", "z", "zoomandpan"]);
  var mathMl = freeze(["accent", "accentunder", "align", "bevelled", "close", "columnalign", "columnlines", "columnspacing", "columnspan", "denomalign", "depth", "dir", "display", "displaystyle", "encoding", "fence", "frame", "height", "href", "id", "largeop", "length", "linethickness", "lquote", "lspace", "mathbackground", "mathcolor", "mathsize", "mathvariant", "maxsize", "minsize", "movablelimits", "notation", "numalign", "open", "rowalign", "rowlines", "rowspacing", "rowspan", "rspace", "rquote", "scriptlevel", "scriptminsize", "scriptsizemultiplier", "selection", "separator", "separators", "stretchy", "subscriptshift", "supscriptshift", "symmetric", "voffset", "width", "xmlns"]);
  var xml2 = freeze(["xlink:href", "xml:id", "xlink:title", "xml:space", "xmlns:xlink"]);
  var MUSTACHE_EXPR = seal(/{{[\w\W]*|^[\w\W]*}}/g);
  var ERB_EXPR = seal(/<%[\w\W]*|^[\w\W]*%>/g);
  var TMPLIT_EXPR = seal(/\${[\w\W]*/g);
  var DATA_ATTR = seal(/^data-[\-\w.\u00B7-\uFFFF]+$/);
  var ARIA_ATTR = seal(/^aria-[\-\w]+$/);
  var IS_ALLOWED_URI = seal(
    /^(?:(?:(?:f|ht)tps?|mailto|tel|callto|sms|cid|xmpp|matrix):|[^a-z]|[a-z+.\-]+(?:[^a-z+.\-:]|$))/i
    // eslint-disable-line no-useless-escape
  );
  var IS_SCRIPT_OR_DATA = seal(/^(?:\w+script|data):/i);
  var ATTR_WHITESPACE = seal(
    /[\u0000-\u0020\u00A0\u1680\u180E\u2000-\u2029\u205F\u3000]/g
    // eslint-disable-line no-control-regex
  );
  var DOCTYPE_NAME = seal(/^html$/i);
  var CUSTOM_ELEMENT = seal(/^[a-z][.\w]*(-[.\w]+)+$/i);
  var ELEMENT_MARKUP_PROBE = seal(/<[/\w!]/g);
  var COMMENT_MARKUP_PROBE = seal(/<[/\w]/g);
  var FALLBACK_TAG_CLOSE = seal(/<\/no(script|embed|frames)/i);
  var SELF_CLOSING_TAG = seal(/\/>/i);
  var NODE_TYPE = {
    element: 1,
    attribute: 2,
    text: 3,
    cdataSection: 4,
    entityReference: 5,
    // Deprecated
    entityNode: 6,
    // Deprecated
    processingInstruction: 7,
    comment: 8,
    document: 9,
    documentType: 10,
    documentFragment: 11,
    notation: 12
    // Deprecated
  };
  var LITERAL_TEXT_ELEMENT_NAMES = ["style", "script", "xmp", "iframe", "noembed", "noframes", "plaintext", "noscript"];
  var LITERAL_TEXT_ELEMENTS = freeze(addToSet({}, LITERAL_TEXT_ELEMENT_NAMES));
  var LITERAL_TEXT_CLOSE = (function() {
    const map = {};
    arrayForEach(LITERAL_TEXT_ELEMENT_NAMES, (name) => {
      map[name] = seal(new RegExp("</" + name + "(?=[\\t\\n\\f\\r />])", "i"));
    });
    return freeze(map);
  })();
  var getGlobal = function getGlobal2() {
    return typeof window === "undefined" ? null : window;
  };
  var _createTrustedTypesPolicy = function _createTrustedTypesPolicy2(trustedTypes, purifyHostElement) {
    if (typeof trustedTypes !== "object" || typeof trustedTypes.createPolicy !== "function") {
      return null;
    }
    let suffix = null;
    const ATTR_NAME = "data-tt-policy-suffix";
    if (purifyHostElement && purifyHostElement.hasAttribute(ATTR_NAME)) {
      suffix = purifyHostElement.getAttribute(ATTR_NAME);
    }
    const policyName = "dompurify" + (suffix ? "#" + suffix : "");
    try {
      return trustedTypes.createPolicy(policyName, {
        createHTML(html2) {
          return html2;
        },
        createScriptURL(scriptUrl) {
          return scriptUrl;
        }
      });
    } catch (_2) {
      console.warn("TrustedTypes policy " + policyName + " could not be created.");
      return null;
    }
  };
  var _createHooksMap = function _createHooksMap2() {
    return {
      afterSanitizeAttributes: [],
      afterSanitizeElements: [],
      afterSanitizeShadowDOM: [],
      beforeSanitizeAttributes: [],
      beforeSanitizeElements: [],
      beforeSanitizeShadowDOM: [],
      uponSanitizeAttribute: [],
      uponSanitizeElement: [],
      uponSanitizeShadowNode: []
    };
  };
  var _resolveSetOption = function _resolveSetOption2(cfg, key, fallback, options) {
    return objectHasOwnProperty(cfg, key) && arrayIsArray(cfg[key]) ? addToSet(options.base ? clone(options.base) : {}, cfg[key], options.transform) : fallback;
  };
  var _resolveObjectOption = function _resolveObjectOption2(cfg, key, makeFallback) {
    const value = objectHasOwnProperty(cfg, key) ? cfg[key] : void 0;
    return value && typeof value === "object" ? clone(value) : makeFallback();
  };
  function createDOMPurify() {
    let window2 = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : getGlobal();
    const DOMPurify2 = (root) => createDOMPurify(root);
    DOMPurify2.version = "3.4.14";
    DOMPurify2.removed = [];
    if (!window2 || !window2.document || window2.document.nodeType !== NODE_TYPE.document || !window2.Element) {
      DOMPurify2.isSupported = false;
      return DOMPurify2;
    }
    let document2 = window2.document;
    const originalDocument = document2;
    const currentScript = originalDocument.currentScript;
    window2.DocumentFragment;
    const HTMLTemplateElement = window2.HTMLTemplateElement, Node = window2.Node, Element = window2.Element, NodeFilter = window2.NodeFilter, _window$NamedNodeMap = window2.NamedNodeMap;
    _window$NamedNodeMap === void 0 ? window2.NamedNodeMap || window2.MozNamedAttrMap : _window$NamedNodeMap;
    window2.HTMLFormElement;
    const DOMParser = window2.DOMParser, trustedTypes = window2.trustedTypes;
    const ElementPrototype = Element.prototype;
    const cloneNode = lookupGetter(ElementPrototype, "cloneNode");
    const remove = lookupGetter(ElementPrototype, "remove");
    const getNextSibling = lookupGetter(ElementPrototype, "nextSibling");
    const getChildNodes = lookupGetter(ElementPrototype, "childNodes");
    const getParentNode = lookupGetter(ElementPrototype, "parentNode");
    const getShadowRoot = lookupGetter(ElementPrototype, "shadowRoot");
    const getAttributes = lookupGetter(ElementPrototype, "attributes");
    const getNodeType = Node && Node.prototype ? lookupGetter(Node.prototype, "nodeType") : null;
    const getNodeName = Node && Node.prototype ? lookupGetter(Node.prototype, "nodeName") : null;
    const getOwnerDocument = Node && Node.prototype ? lookupGetter(Node.prototype, "ownerDocument") : null;
    const _readNodeType = function _readNodeType2(node) {
      return getNodeType ? getNodeType(node) : node.nodeType;
    };
    const _readNodeName = function _readNodeName2(node) {
      return getNodeName ? getNodeName(node) : node.nodeName;
    };
    if (typeof HTMLTemplateElement === "function") {
      const template = document2.createElement("template");
      if (template.content && template.content.ownerDocument) {
        document2 = template.content.ownerDocument;
      }
    }
    let trustedTypesPolicy;
    let emptyHTML = "";
    let defaultTrustedTypesPolicy;
    let defaultTrustedTypesPolicyResolved = false;
    let IN_TRUSTED_TYPES_POLICY = 0;
    const _assertNotInTrustedTypesPolicy = function _assertNotInTrustedTypesPolicy2() {
      if (IN_TRUSTED_TYPES_POLICY > 0) {
        throw typeErrorCreate('A configured TRUSTED_TYPES_POLICY callback (createHTML or createScriptURL) must not call DOMPurify.sanitize, as that causes infinite recursion. Do not pass a policy whose callbacks wrap DOMPurify as TRUSTED_TYPES_POLICY; see the "DOMPurify and Trusted Types" section of the README.');
      }
    };
    const _createTrustedHTML = function _createTrustedHTML2(html2) {
      _assertNotInTrustedTypesPolicy();
      IN_TRUSTED_TYPES_POLICY++;
      try {
        return trustedTypesPolicy.createHTML(html2);
      } finally {
        IN_TRUSTED_TYPES_POLICY--;
      }
    };
    const _createTrustedScriptURL = function _createTrustedScriptURL2(scriptUrl) {
      _assertNotInTrustedTypesPolicy();
      IN_TRUSTED_TYPES_POLICY++;
      try {
        return trustedTypesPolicy.createScriptURL(scriptUrl);
      } finally {
        IN_TRUSTED_TYPES_POLICY--;
      }
    };
    const _getDefaultTrustedTypesPolicy = function _getDefaultTrustedTypesPolicy2() {
      if (!defaultTrustedTypesPolicyResolved) {
        defaultTrustedTypesPolicy = _createTrustedTypesPolicy(trustedTypes, currentScript);
        defaultTrustedTypesPolicyResolved = true;
      }
      return defaultTrustedTypesPolicy;
    };
    const _document = document2, implementation = _document.implementation, createNodeIterator = _document.createNodeIterator, createDocumentFragment = _document.createDocumentFragment, getElementsByTagName = _document.getElementsByTagName;
    const importNode = originalDocument.importNode;
    let hooks = _createHooksMap();
    DOMPurify2.isSupported = typeof entries === "function" && typeof getParentNode === "function" && implementation && implementation.createHTMLDocument !== void 0;
    const MUSTACHE_EXPR$1 = MUSTACHE_EXPR, ERB_EXPR$1 = ERB_EXPR, TMPLIT_EXPR$1 = TMPLIT_EXPR, DATA_ATTR$1 = DATA_ATTR, ARIA_ATTR$1 = ARIA_ATTR, IS_SCRIPT_OR_DATA$1 = IS_SCRIPT_OR_DATA, ATTR_WHITESPACE$1 = ATTR_WHITESPACE, CUSTOM_ELEMENT$1 = CUSTOM_ELEMENT;
    let IS_ALLOWED_URI$1 = IS_ALLOWED_URI;
    let ALLOWED_TAGS = null;
    const DEFAULT_ALLOWED_TAGS = addToSet({}, [...html$1, ...svg$1, ...svgFilters, ...mathMl$1, ...text]);
    let ALLOWED_ATTR = null;
    const DEFAULT_ALLOWED_ATTR = addToSet({}, [...html, ...svg, ...mathMl, ...xml2]);
    let CUSTOM_ELEMENT_HANDLING = Object.seal(create(null, {
      tagNameCheck: {
        writable: true,
        configurable: false,
        enumerable: true,
        value: null
      },
      attributeNameCheck: {
        writable: true,
        configurable: false,
        enumerable: true,
        value: null
      },
      allowCustomizedBuiltInElements: {
        writable: true,
        configurable: false,
        enumerable: true,
        value: false
      }
    }));
    let FORBID_TAGS = null;
    let FORBID_ATTR = null;
    const EXTRA_ELEMENT_HANDLING = Object.seal(create(null, {
      tagCheck: {
        writable: true,
        configurable: false,
        enumerable: true,
        value: null
      },
      attributeCheck: {
        writable: true,
        configurable: false,
        enumerable: true,
        value: null
      }
    }));
    let ALLOW_ARIA_ATTR = true;
    let ALLOW_DATA_ATTR = true;
    let ALLOW_UNKNOWN_PROTOCOLS = false;
    let ALLOW_SELF_CLOSE_IN_ATTR = true;
    let SAFE_FOR_TEMPLATES = false;
    let SAFE_FOR_XML = true;
    let WHOLE_DOCUMENT = false;
    let SET_CONFIG = false;
    let SET_CONFIG_ALLOWED_TAGS = null;
    let SET_CONFIG_ALLOWED_ATTR = null;
    let FORCE_BODY = false;
    let RETURN_DOM = false;
    let RETURN_DOM_FRAGMENT = false;
    let RETURN_TRUSTED_TYPE = false;
    let SANITIZE_DOM = true;
    let SANITIZE_NAMED_PROPS = false;
    const SANITIZE_NAMED_PROPS_PREFIX = "user-content-";
    let KEEP_CONTENT = true;
    let IN_PLACE = false;
    let USE_PROFILES = {};
    let FORBID_CONTENTS = null;
    const DEFAULT_FORBID_CONTENTS = addToSet({}, [
      "annotation-xml",
      "audio",
      "colgroup",
      "desc",
      "foreignobject",
      "head",
      "iframe",
      "math",
      "mi",
      "mn",
      "mo",
      "ms",
      "mtext",
      "noembed",
      "noframes",
      "noscript",
      "plaintext",
      "script",
      // <selectedcontent> mirrors the selected <option>'s subtree, cloned by
      // the UA (customizable <select>) — including any on* handlers — and the
      // engine re-mirrors synchronously whenever a removal changes which
      // option/selectedcontent is current, even inside DOMPurify's inert
      // DOMParser document. Hoisting its children on removal re-inserts a fresh
      // mirror target ahead of the walk, which the engine refills, looping
      // forever (DoS) and amplifying output. Dropping its content on removal
      // (rather than hoisting) breaks that cascade; the content is a duplicate
      // of the option, which is sanitized on its own. See campaign-3 F1/F6.
      "selectedcontent",
      "style",
      "svg",
      "template",
      "thead",
      "title",
      "video",
      "xmp"
    ]);
    let DATA_URI_TAGS = null;
    const DEFAULT_DATA_URI_TAGS = addToSet({}, ["audio", "video", "img", "source", "image", "track"]);
    let URI_SAFE_ATTRIBUTES = null;
    const DEFAULT_URI_SAFE_ATTRIBUTES = addToSet({}, ["alt", "class", "for", "id", "label", "name", "pattern", "placeholder", "role", "summary", "title", "value", "style", "xmlns"]);
    const MATHML_NAMESPACE = "http://www.w3.org/1998/Math/MathML";
    const SVG_NAMESPACE = "http://www.w3.org/2000/svg";
    const HTML_NAMESPACE = "http://www.w3.org/1999/xhtml";
    let NAMESPACE = HTML_NAMESPACE;
    let IS_EMPTY_INPUT = false;
    let ALLOWED_NAMESPACES = null;
    const DEFAULT_ALLOWED_NAMESPACES = addToSet({}, [MATHML_NAMESPACE, SVG_NAMESPACE, HTML_NAMESPACE], stringToString);
    const DEFAULT_MATHML_TEXT_INTEGRATION_POINTS = freeze(["mi", "mo", "mn", "ms", "mtext"]);
    let MATHML_TEXT_INTEGRATION_POINTS = addToSet({}, DEFAULT_MATHML_TEXT_INTEGRATION_POINTS);
    const DEFAULT_HTML_INTEGRATION_POINTS = freeze(["annotation-xml"]);
    let HTML_INTEGRATION_POINTS = addToSet({}, DEFAULT_HTML_INTEGRATION_POINTS);
    const COMMON_SVG_AND_HTML_ELEMENTS = addToSet({}, ["title", "style", "font", "a", "script"]);
    let PARSER_MEDIA_TYPE = null;
    const SUPPORTED_PARSER_MEDIA_TYPES = ["application/xhtml+xml", "text/html"];
    const DEFAULT_PARSER_MEDIA_TYPE = "text/html";
    let transformCaseFunc = null;
    let CONFIG = null;
    const formElement = document2.createElement("form");
    const isRegexOrFunction = function isRegexOrFunction2(testValue) {
      return testValue instanceof RegExp || testValue instanceof Function;
    };
    const _parseConfig = function _parseConfig2() {
      let cfg = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : {};
      if (CONFIG && CONFIG === cfg) {
        return;
      }
      if (!cfg || typeof cfg !== "object") {
        cfg = {};
      }
      cfg = clone(cfg);
      PARSER_MEDIA_TYPE = // eslint-disable-next-line unicorn/prefer-includes
      SUPPORTED_PARSER_MEDIA_TYPES.indexOf(cfg.PARSER_MEDIA_TYPE) === -1 ? DEFAULT_PARSER_MEDIA_TYPE : cfg.PARSER_MEDIA_TYPE;
      transformCaseFunc = PARSER_MEDIA_TYPE === "application/xhtml+xml" ? stringToString : stringToLowerCase;
      ALLOWED_TAGS = _resolveSetOption(cfg, "ALLOWED_TAGS", DEFAULT_ALLOWED_TAGS, {
        transform: transformCaseFunc
      });
      ALLOWED_ATTR = _resolveSetOption(cfg, "ALLOWED_ATTR", DEFAULT_ALLOWED_ATTR, {
        transform: transformCaseFunc
      });
      ALLOWED_NAMESPACES = _resolveSetOption(cfg, "ALLOWED_NAMESPACES", DEFAULT_ALLOWED_NAMESPACES, {
        transform: stringToString
      });
      URI_SAFE_ATTRIBUTES = _resolveSetOption(cfg, "ADD_URI_SAFE_ATTR", DEFAULT_URI_SAFE_ATTRIBUTES, {
        transform: transformCaseFunc,
        base: DEFAULT_URI_SAFE_ATTRIBUTES
      });
      DATA_URI_TAGS = _resolveSetOption(cfg, "ADD_DATA_URI_TAGS", DEFAULT_DATA_URI_TAGS, {
        transform: transformCaseFunc,
        base: DEFAULT_DATA_URI_TAGS
      });
      FORBID_CONTENTS = _resolveSetOption(cfg, "FORBID_CONTENTS", DEFAULT_FORBID_CONTENTS, {
        transform: transformCaseFunc
      });
      FORBID_TAGS = _resolveSetOption(cfg, "FORBID_TAGS", clone({}), {
        transform: transformCaseFunc
      });
      FORBID_ATTR = _resolveSetOption(cfg, "FORBID_ATTR", clone({}), {
        transform: transformCaseFunc
      });
      USE_PROFILES = objectHasOwnProperty(cfg, "USE_PROFILES") ? cfg.USE_PROFILES && typeof cfg.USE_PROFILES === "object" ? clone(cfg.USE_PROFILES) : cfg.USE_PROFILES : false;
      ALLOW_ARIA_ATTR = cfg.ALLOW_ARIA_ATTR !== false;
      ALLOW_DATA_ATTR = cfg.ALLOW_DATA_ATTR !== false;
      ALLOW_UNKNOWN_PROTOCOLS = cfg.ALLOW_UNKNOWN_PROTOCOLS || false;
      ALLOW_SELF_CLOSE_IN_ATTR = cfg.ALLOW_SELF_CLOSE_IN_ATTR !== false;
      SAFE_FOR_TEMPLATES = cfg.SAFE_FOR_TEMPLATES || false;
      SAFE_FOR_XML = cfg.SAFE_FOR_XML !== false;
      WHOLE_DOCUMENT = cfg.WHOLE_DOCUMENT || false;
      RETURN_DOM = cfg.RETURN_DOM || false;
      RETURN_DOM_FRAGMENT = cfg.RETURN_DOM_FRAGMENT || false;
      RETURN_TRUSTED_TYPE = cfg.RETURN_TRUSTED_TYPE || false;
      FORCE_BODY = cfg.FORCE_BODY || false;
      SANITIZE_DOM = cfg.SANITIZE_DOM !== false;
      SANITIZE_NAMED_PROPS = cfg.SANITIZE_NAMED_PROPS || false;
      KEEP_CONTENT = cfg.KEEP_CONTENT !== false;
      IN_PLACE = cfg.IN_PLACE || false;
      IS_ALLOWED_URI$1 = isRegex(cfg.ALLOWED_URI_REGEXP) ? cfg.ALLOWED_URI_REGEXP : IS_ALLOWED_URI;
      NAMESPACE = typeof cfg.NAMESPACE === "string" ? cfg.NAMESPACE : HTML_NAMESPACE;
      MATHML_TEXT_INTEGRATION_POINTS = _resolveObjectOption(
        cfg,
        "MATHML_TEXT_INTEGRATION_POINTS",
        () => addToSet({}, DEFAULT_MATHML_TEXT_INTEGRATION_POINTS)
        // Default built-in map
      );
      HTML_INTEGRATION_POINTS = _resolveObjectOption(
        cfg,
        "HTML_INTEGRATION_POINTS",
        () => addToSet({}, DEFAULT_HTML_INTEGRATION_POINTS)
        // Default built-in map
      );
      const customElementHandling = _resolveObjectOption(cfg, "CUSTOM_ELEMENT_HANDLING", () => create(null));
      CUSTOM_ELEMENT_HANDLING = create(null);
      if (objectHasOwnProperty(customElementHandling, "tagNameCheck") && isRegexOrFunction(customElementHandling.tagNameCheck)) {
        CUSTOM_ELEMENT_HANDLING.tagNameCheck = customElementHandling.tagNameCheck;
      }
      if (objectHasOwnProperty(customElementHandling, "attributeNameCheck") && isRegexOrFunction(customElementHandling.attributeNameCheck)) {
        CUSTOM_ELEMENT_HANDLING.attributeNameCheck = customElementHandling.attributeNameCheck;
      }
      if (objectHasOwnProperty(customElementHandling, "allowCustomizedBuiltInElements") && typeof customElementHandling.allowCustomizedBuiltInElements === "boolean") {
        CUSTOM_ELEMENT_HANDLING.allowCustomizedBuiltInElements = customElementHandling.allowCustomizedBuiltInElements;
      }
      seal(CUSTOM_ELEMENT_HANDLING);
      if (SAFE_FOR_TEMPLATES) {
        ALLOW_DATA_ATTR = false;
      }
      if (RETURN_DOM_FRAGMENT) {
        RETURN_DOM = true;
      }
      if (USE_PROFILES) {
        ALLOWED_TAGS = addToSet({}, text);
        ALLOWED_ATTR = create(null);
        if (USE_PROFILES.html === true) {
          addToSet(ALLOWED_TAGS, html$1);
          addToSet(ALLOWED_ATTR, html);
        }
        if (USE_PROFILES.svg === true) {
          addToSet(ALLOWED_TAGS, svg$1);
          addToSet(ALLOWED_ATTR, svg);
          addToSet(ALLOWED_ATTR, xml2);
        }
        if (USE_PROFILES.svgFilters === true) {
          addToSet(ALLOWED_TAGS, svgFilters);
          addToSet(ALLOWED_ATTR, svg);
          addToSet(ALLOWED_ATTR, xml2);
        }
        if (USE_PROFILES.mathMl === true) {
          addToSet(ALLOWED_TAGS, mathMl$1);
          addToSet(ALLOWED_ATTR, mathMl);
          addToSet(ALLOWED_ATTR, xml2);
        }
      }
      EXTRA_ELEMENT_HANDLING.tagCheck = null;
      EXTRA_ELEMENT_HANDLING.attributeCheck = null;
      if (objectHasOwnProperty(cfg, "ADD_TAGS")) {
        if (typeof cfg.ADD_TAGS === "function") {
          EXTRA_ELEMENT_HANDLING.tagCheck = cfg.ADD_TAGS;
        } else if (arrayIsArray(cfg.ADD_TAGS)) {
          if (ALLOWED_TAGS === DEFAULT_ALLOWED_TAGS) {
            ALLOWED_TAGS = clone(ALLOWED_TAGS);
          }
          addToSet(ALLOWED_TAGS, cfg.ADD_TAGS, transformCaseFunc);
        }
      }
      if (objectHasOwnProperty(cfg, "ADD_ATTR")) {
        if (typeof cfg.ADD_ATTR === "function") {
          EXTRA_ELEMENT_HANDLING.attributeCheck = cfg.ADD_ATTR;
        } else if (arrayIsArray(cfg.ADD_ATTR)) {
          if (ALLOWED_ATTR === DEFAULT_ALLOWED_ATTR) {
            ALLOWED_ATTR = clone(ALLOWED_ATTR);
          }
          addToSet(ALLOWED_ATTR, cfg.ADD_ATTR, transformCaseFunc);
        }
      }
      if (objectHasOwnProperty(cfg, "ADD_FORBID_CONTENTS") && arrayIsArray(cfg.ADD_FORBID_CONTENTS)) {
        if (FORBID_CONTENTS === DEFAULT_FORBID_CONTENTS) {
          FORBID_CONTENTS = clone(FORBID_CONTENTS);
        }
        addToSet(FORBID_CONTENTS, cfg.ADD_FORBID_CONTENTS, transformCaseFunc);
      }
      if (KEEP_CONTENT) {
        ALLOWED_TAGS["#text"] = true;
      }
      if (WHOLE_DOCUMENT) {
        addToSet(ALLOWED_TAGS, ["html", "head", "body"]);
      }
      if (ALLOWED_TAGS.table) {
        addToSet(ALLOWED_TAGS, ["tbody"]);
        delete FORBID_TAGS.tbody;
      }
      if (cfg.TRUSTED_TYPES_POLICY) {
        if (typeof cfg.TRUSTED_TYPES_POLICY.createHTML !== "function") {
          throw typeErrorCreate('TRUSTED_TYPES_POLICY configuration option must provide a "createHTML" hook.');
        }
        if (typeof cfg.TRUSTED_TYPES_POLICY.createScriptURL !== "function") {
          throw typeErrorCreate('TRUSTED_TYPES_POLICY configuration option must provide a "createScriptURL" hook.');
        }
        const previousTrustedTypesPolicy = trustedTypesPolicy;
        trustedTypesPolicy = cfg.TRUSTED_TYPES_POLICY;
        try {
          emptyHTML = _createTrustedHTML("");
        } catch (error) {
          trustedTypesPolicy = previousTrustedTypesPolicy;
          throw error;
        }
      } else if (cfg.TRUSTED_TYPES_POLICY === null) {
        trustedTypesPolicy = void 0;
        emptyHTML = "";
      } else {
        if (trustedTypesPolicy === void 0) {
          trustedTypesPolicy = _getDefaultTrustedTypesPolicy();
        }
        if (trustedTypesPolicy && typeof emptyHTML === "string") {
          emptyHTML = _createTrustedHTML("");
        }
      }
      if (freeze) {
        freeze(cfg);
      }
      CONFIG = cfg;
    };
    const ALL_SVG_TAGS = addToSet({}, [...svg$1, ...svgFilters, ...svgDisallowed]);
    const ALL_MATHML_TAGS = addToSet({}, [...mathMl$1, ...mathMlDisallowed]);
    const _checkSvgNamespace = function _checkSvgNamespace2(tagName, parent, parentTagName) {
      if (parent.namespaceURI === HTML_NAMESPACE) {
        return tagName === "svg";
      }
      if (parent.namespaceURI === MATHML_NAMESPACE) {
        return tagName === "svg" && (parentTagName === "annotation-xml" || MATHML_TEXT_INTEGRATION_POINTS[parentTagName]);
      }
      return Boolean(ALL_SVG_TAGS[tagName]);
    };
    const _checkMathMlNamespace = function _checkMathMlNamespace2(tagName, parent, parentTagName) {
      if (parent.namespaceURI === HTML_NAMESPACE) {
        return tagName === "math";
      }
      if (parent.namespaceURI === SVG_NAMESPACE) {
        return tagName === "math" && HTML_INTEGRATION_POINTS[parentTagName];
      }
      return Boolean(ALL_MATHML_TAGS[tagName]);
    };
    const _checkHtmlNamespace = function _checkHtmlNamespace2(tagName, parent, parentTagName) {
      if (parent.namespaceURI === SVG_NAMESPACE && !HTML_INTEGRATION_POINTS[parentTagName]) {
        return false;
      }
      if (parent.namespaceURI === MATHML_NAMESPACE && !MATHML_TEXT_INTEGRATION_POINTS[parentTagName]) {
        return false;
      }
      return !ALL_MATHML_TAGS[tagName] && (COMMON_SVG_AND_HTML_ELEMENTS[tagName] || !ALL_SVG_TAGS[tagName]);
    };
    const _checkValidNamespace = function _checkValidNamespace2(element) {
      let parent = getParentNode(element);
      if (!parent || !parent.tagName) {
        parent = {
          namespaceURI: NAMESPACE,
          tagName: "template"
        };
      }
      const tagName = stringToLowerCase(element.tagName);
      const parentTagName = stringToLowerCase(parent.tagName);
      if (!ALLOWED_NAMESPACES[element.namespaceURI]) {
        return false;
      }
      if (element.namespaceURI === SVG_NAMESPACE) {
        return _checkSvgNamespace(tagName, parent, parentTagName);
      }
      if (element.namespaceURI === MATHML_NAMESPACE) {
        return _checkMathMlNamespace(tagName, parent, parentTagName);
      }
      if (element.namespaceURI === HTML_NAMESPACE) {
        return _checkHtmlNamespace(tagName, parent, parentTagName);
      }
      if (PARSER_MEDIA_TYPE === "application/xhtml+xml" && ALLOWED_NAMESPACES[element.namespaceURI]) {
        return true;
      }
      return false;
    };
    const _forceRemove = function _forceRemove2(node) {
      arrayPush(DOMPurify2.removed, {
        element: node
      });
      try {
        getParentNode(node).removeChild(node);
      } catch (_2) {
        remove(node);
        if (!getParentNode(node)) {
          throw typeErrorCreate("a node selected for removal could not be detached from its tree and cannot be safely returned; refusing to sanitize in place");
        }
      }
    };
    const _stripAttributeNode = function _stripAttributeNode2(element, attribute, name) {
      try {
        element.removeAttributeNode(attribute);
      } catch (_2) {
        try {
          element.removeAttribute(name);
        } catch (_3) {
        }
      }
    };
    const _neutralizeRoot = function _neutralizeRoot2(root) {
      _neutralizeSubtree(root);
      const childNodes = getChildNodes(root);
      if (childNodes) {
        const snapshot = [];
        arrayForEach(childNodes, (child) => {
          arrayPush(snapshot, child);
        });
        arrayForEach(snapshot, (child) => {
          try {
            remove(child);
          } catch (_2) {
          }
        });
      }
      const attributes = getAttributes(root);
      if (attributes) {
        for (let i = attributes.length - 1; i >= 0; --i) {
          const attribute = attributes[i];
          const name = attribute && attribute.name;
          if (typeof name === "string") {
            _stripAttributeNode(root, attribute, name);
          }
        }
      }
    };
    const _removeAttribute = function _removeAttribute2(name, element, attr) {
      if (!attr) {
        try {
          attr = element.getAttributeNode(name);
        } catch (_2) {
          attr = null;
        }
      }
      arrayPush(DOMPurify2.removed, {
        attribute: attr || null,
        from: element
      });
      try {
        if (attr) {
          element.removeAttributeNode(attr);
        } else {
          element.removeAttribute(name);
        }
      } catch (_2) {
        try {
          element.removeAttribute(name);
        } catch (_3) {
        }
      }
      if (name === "is") {
        if (RETURN_DOM || RETURN_DOM_FRAGMENT) {
          try {
            _forceRemove(element);
          } catch (_2) {
          }
        } else {
          try {
            element.setAttribute(name, "");
          } catch (_2) {
          }
        }
      }
    };
    const _stripDisallowedAttributes = function _stripDisallowedAttributes2(element) {
      const attributes = getAttributes(element);
      if (!attributes) {
        return;
      }
      for (let i = attributes.length - 1; i >= 0; --i) {
        const attribute = attributes[i];
        const name = attribute && attribute.name;
        if (typeof name !== "string" || ALLOWED_ATTR[transformCaseFunc(name)]) {
          continue;
        }
        _stripAttributeNode(element, attribute, name);
      }
    };
    const _neutralizeSubtree = function _neutralizeSubtree2(root) {
      const stack = [root];
      while (stack.length > 0) {
        const node = stack.pop();
        const nodeType = _readNodeType(node);
        if (nodeType === NODE_TYPE.element) {
          _stripDisallowedAttributes(node);
        }
        const childNodes = getChildNodes(node);
        if (childNodes) {
          for (let i = childNodes.length - 1; i >= 0; --i) {
            stack.push(childNodes[i]);
          }
        }
      }
    };
    const _isPatchLinkageAttribute = function _isPatchLinkageAttribute2(lcName, lcTag) {
      if (!SAFE_FOR_XML) {
        return false;
      }
      if (lcName === "patchsrc") {
        return true;
      }
      return lcName === "for" && lcTag !== "label" && lcTag !== "output";
    };
    const _neutralizePatchLinkage = function _neutralizePatchLinkage2(root) {
      if (!SAFE_FOR_XML) {
        return;
      }
      const stack = [root];
      while (stack.length > 0) {
        const node = stack.pop();
        const nodeType = _readNodeType(node);
        if (nodeType === NODE_TYPE.processingInstruction || nodeType === NODE_TYPE.comment && regExpTest(COMMENT_MARKUP_PROBE, node.data)) {
          try {
            remove(node);
          } catch (_2) {
          }
          continue;
        }
        if (nodeType === NODE_TYPE.element) {
          const element = node;
          const lcTag = transformCaseFunc(_readNodeName(node));
          try {
            if (element.hasAttribute && element.hasAttribute("patchsrc")) {
              element.removeAttribute("patchsrc");
            }
            if (element.hasAttribute && element.hasAttribute("for") && _isPatchLinkageAttribute("for", lcTag)) {
              element.removeAttribute("for");
            }
          } catch (_2) {
          }
        }
        const childNodes = getChildNodes(node);
        if (childNodes) {
          for (let i = childNodes.length - 1; i >= 0; --i) {
            stack.push(childNodes[i]);
          }
        }
      }
    };
    const _initDocument = function _initDocument2(dirty) {
      let doc2 = null;
      let leadingWhitespace = null;
      if (FORCE_BODY) {
        dirty = "<remove></remove>" + dirty;
      } else {
        const matches = stringMatch(dirty, /^[\r\n\t ]+/);
        leadingWhitespace = matches && matches[0];
      }
      if (PARSER_MEDIA_TYPE === "application/xhtml+xml" && NAMESPACE === HTML_NAMESPACE) {
        dirty = '<html xmlns="http://www.w3.org/1999/xhtml"><head></head><body>' + dirty + "</body></html>";
      }
      const dirtyPayload = trustedTypesPolicy ? _createTrustedHTML(dirty) : dirty;
      if (NAMESPACE === HTML_NAMESPACE) {
        try {
          doc2 = new DOMParser().parseFromString(dirtyPayload, PARSER_MEDIA_TYPE);
        } catch (_2) {
        }
      }
      if (!doc2 || !doc2.documentElement) {
        doc2 = implementation.createDocument(NAMESPACE, "template", null);
        try {
          doc2.documentElement.innerHTML = IS_EMPTY_INPUT ? emptyHTML : dirtyPayload;
        } catch (_2) {
        }
      }
      const body = doc2.body || doc2.documentElement;
      if (dirty && leadingWhitespace) {
        body.insertBefore(document2.createTextNode(leadingWhitespace), body.childNodes[0] || null);
      }
      if (NAMESPACE === HTML_NAMESPACE) {
        return getElementsByTagName.call(doc2, WHOLE_DOCUMENT ? "html" : "body")[0];
      }
      return WHOLE_DOCUMENT ? doc2.documentElement : body;
    };
    const _createNodeIterator = function _createNodeIterator2(root) {
      const doc2 = getOwnerDocument ? getOwnerDocument(root) : root.ownerDocument;
      return createNodeIterator.call(
        doc2 || root,
        root,
        // eslint-disable-next-line no-bitwise
        NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_COMMENT | NodeFilter.SHOW_TEXT | NodeFilter.SHOW_PROCESSING_INSTRUCTION | NodeFilter.SHOW_CDATA_SECTION,
        null
      );
    };
    const _stripTemplateExpressions = function _stripTemplateExpressions2(value) {
      value = stringReplace(value, MUSTACHE_EXPR$1, " ");
      value = stringReplace(value, ERB_EXPR$1, " ");
      value = stringReplace(value, TMPLIT_EXPR$1, " ");
      return value;
    };
    const _scrubTemplateExpressions2 = function _scrubTemplateExpressions(node) {
      var _node$querySelectorAl;
      node.normalize();
      const doc2 = getOwnerDocument ? getOwnerDocument(node) : node.ownerDocument;
      const walker = createNodeIterator.call(
        doc2 || node,
        node,
        // eslint-disable-next-line no-bitwise
        NodeFilter.SHOW_TEXT | NodeFilter.SHOW_COMMENT | NodeFilter.SHOW_CDATA_SECTION | NodeFilter.SHOW_PROCESSING_INSTRUCTION,
        null
      );
      let currentNode = walker.nextNode();
      while (currentNode) {
        currentNode.data = _stripTemplateExpressions(currentNode.data);
        currentNode = walker.nextNode();
      }
      const templates = (_node$querySelectorAl = node.querySelectorAll) === null || _node$querySelectorAl === void 0 ? void 0 : _node$querySelectorAl.call(node, "template");
      if (templates) {
        arrayForEach(templates, (tmpl) => {
          if (_isDocumentFragment(tmpl.content)) {
            _scrubTemplateExpressions2(tmpl.content);
          }
        });
      }
    };
    const _isClobbered = function _isClobbered2(element) {
      const realTagName = getNodeName ? getNodeName(element) : null;
      if (typeof realTagName !== "string") {
        return false;
      }
      if (transformCaseFunc(realTagName) !== "form") {
        return false;
      }
      return typeof element.nodeName !== "string" || typeof element.textContent !== "string" || typeof element.removeChild !== "function" || // Realm-safe NamedNodeMap detection: equality against the cached
      // prototype getter. Clobbered .attributes (e.g. <input name="attributes">)
      // makes the direct read diverge from the cached read; a clean form
      // (same-realm OR foreign-realm) has both reads pointing at the same
      // canonical NamedNodeMap.
      element.attributes !== getAttributes(element) || typeof element.removeAttribute !== "function" || typeof element.setAttribute !== "function" || typeof element.namespaceURI !== "string" || typeof element.insertBefore !== "function" || typeof element.hasChildNodes !== "function" || // NodeType clobbering probe. Cached Node.prototype.nodeType getter
      // returns the integer 1 for any Element regardless of realm; direct
      // read on a clobbered form (e.g. <input name="nodeType">) returns
      // the named child element. Cheap addition — nodeType is read from
      // an internal slot, no serialization cost — and removes a residual
      // clobbering surface used by several mXSS / PI / comment branches
      // in _sanitizeElements that compare currentNode.nodeType directly.
      element.nodeType !== getNodeType(element) || // HTMLFormElement has [LegacyOverrideBuiltIns]: a descendant named
      // "childNodes" shadows the prototype getter. Direct reads of
      // form.childNodes from a clobbered form return the named child
      // instead of the real NodeList, so any walk that reads it directly
      // skips the form's real children. Compare the direct read to the
      // cached Node.prototype getter — when the form's named-property
      // getter intercepts the read, the two values differ and we flag
      // the form. This catches every clobbering child type (input,
      // select, etc.) regardless of whether the named child happens to
      // carry a numeric .length, which a typeof-based probe would miss
      // (e.g. HTMLSelectElement.length is a defined unsigned-long).
      element.childNodes !== getChildNodes(element);
    };
    const _isDocumentFragment = function _isDocumentFragment2(value) {
      if (!getNodeType || typeof value !== "object" || value === null) {
        return false;
      }
      try {
        return getNodeType(value) === NODE_TYPE.documentFragment;
      } catch (_2) {
        return false;
      }
    };
    const _isNode = function _isNode2(value) {
      if (!getNodeType || typeof value !== "object" || value === null) {
        return false;
      }
      try {
        return typeof getNodeType(value) === "number";
      } catch (_2) {
        return false;
      }
    };
    function _executeHooks(hooks2, currentNode, data) {
      if (hooks2.length === 0) {
        return;
      }
      arrayForEach(hooks2, (hook) => {
        hook.call(DOMPurify2, currentNode, data, CONFIG);
      });
    }
    const _isUnsafeNode = function _isUnsafeNode2(currentNode, tagName) {
      if (SAFE_FOR_XML && currentNode.hasChildNodes() && !_isNode(currentNode.firstElementChild) && regExpTest(ELEMENT_MARKUP_PROBE, currentNode.textContent) && regExpTest(ELEMENT_MARKUP_PROBE, currentNode.innerHTML)) {
        return true;
      }
      if (SAFE_FOR_XML && currentNode.namespaceURI === HTML_NAMESPACE && LITERAL_TEXT_ELEMENTS[tagName] && (_isNode(currentNode.firstElementChild) || typeof currentNode.textContent === "string" && regExpTest(LITERAL_TEXT_CLOSE[tagName], currentNode.textContent))) {
        return true;
      }
      if (currentNode.nodeType === NODE_TYPE.processingInstruction) {
        return true;
      }
      if (SAFE_FOR_XML && currentNode.nodeType === NODE_TYPE.comment && regExpTest(COMMENT_MARKUP_PROBE, currentNode.data)) {
        return true;
      }
      return false;
    };
    const _matchesNameCheck = function _matchesNameCheck2(check, name) {
      if (check instanceof RegExp) {
        return regExpTest(check, name);
      }
      if (check instanceof Function) {
        for (var _len = arguments.length, args = new Array(_len > 2 ? _len - 2 : 0), _key = 2; _key < _len; _key++) {
          args[_key - 2] = arguments[_key];
        }
        return Boolean(check(name, ...args));
      }
      return false;
    };
    const _sanitizeDisallowedNode = function _sanitizeDisallowedNode2(currentNode, tagName, root) {
      if (!FORBID_TAGS[tagName] && _isBasicCustomElement(tagName) && _matchesNameCheck(CUSTOM_ELEMENT_HANDLING.tagNameCheck, tagName)) {
        return false;
      }
      if (KEEP_CONTENT && !FORBID_CONTENTS[tagName]) {
        const parentNode = getParentNode(currentNode);
        const childNodes = getChildNodes(currentNode);
        if (childNodes && parentNode) {
          const childCount = childNodes.length;
          for (let i = childCount - 1; i >= 0; --i) {
            const hoisted = currentNode === root ? cloneNode(childNodes[i], true) : childNodes[i];
            parentNode.insertBefore(hoisted, getNextSibling(currentNode));
          }
        }
      }
      _forceRemove(currentNode);
      return true;
    };
    const _forkSharedAllowlist = function _forkSharedAllowlist2(hookList, set, defaultSet, setConfigSet) {
      if (hookList.length === 0) {
        return set;
      }
      return set === defaultSet || set === setConfigSet ? clone(set) : set;
    };
    const _handleHookDetachedNode = function _handleHookDetachedNode2(currentNode, root) {
      if (currentNode === root || getParentNode(currentNode) !== null) {
        return false;
      }
      if (IN_PLACE) {
        _neutralizeSubtree(currentNode);
      }
      return true;
    };
    const _sanitizeElements = function _sanitizeElements2(currentNode, root) {
      _executeHooks(hooks.beforeSanitizeElements, currentNode, null);
      if (_handleHookDetachedNode(currentNode, root)) {
        return true;
      }
      if (_isClobbered(currentNode)) {
        _forceRemove(currentNode);
        return true;
      }
      const tagName = transformCaseFunc(_readNodeName(currentNode));
      ALLOWED_TAGS = _forkSharedAllowlist(hooks.uponSanitizeElement, ALLOWED_TAGS, DEFAULT_ALLOWED_TAGS, SET_CONFIG_ALLOWED_TAGS);
      _executeHooks(hooks.uponSanitizeElement, currentNode, {
        tagName,
        allowedTags: ALLOWED_TAGS
      });
      if (_handleHookDetachedNode(currentNode, root)) {
        return true;
      }
      if (_isUnsafeNode(currentNode, tagName)) {
        _forceRemove(currentNode);
        return true;
      }
      if (FORBID_TAGS[tagName] || !(EXTRA_ELEMENT_HANDLING.tagCheck instanceof Function && EXTRA_ELEMENT_HANDLING.tagCheck(tagName)) && !ALLOWED_TAGS[tagName]) {
        const removed = _sanitizeDisallowedNode(currentNode, tagName, root);
        if (removed === false) {
          _executeHooks(hooks.afterSanitizeElements, currentNode, null);
        }
        return removed;
      }
      const nt2 = _readNodeType(currentNode);
      if (nt2 === NODE_TYPE.element && !_checkValidNamespace(currentNode)) {
        _forceRemove(currentNode);
        return true;
      }
      if ((tagName === "noscript" || tagName === "noembed" || tagName === "noframes") && regExpTest(FALLBACK_TAG_CLOSE, currentNode.innerHTML)) {
        _forceRemove(currentNode);
        return true;
      }
      if (SAFE_FOR_TEMPLATES && currentNode.nodeType === NODE_TYPE.text) {
        const content = _stripTemplateExpressions(currentNode.textContent);
        if (currentNode.textContent !== content) {
          arrayPush(DOMPurify2.removed, {
            element: currentNode.cloneNode()
          });
          currentNode.textContent = content;
        }
      }
      _executeHooks(hooks.afterSanitizeElements, currentNode, null);
      return false;
    };
    const _isValidAttribute = function _isValidAttribute2(lcTag, lcName, value) {
      if (FORBID_ATTR[lcName]) {
        return false;
      }
      if (_isPatchLinkageAttribute(lcName, lcTag)) {
        return false;
      }
      if (SANITIZE_DOM && (lcName === "id" || lcName === "name") && (value in document2 || value in formElement)) {
        return false;
      }
      const nameIsPermitted = ALLOWED_ATTR[lcName] || EXTRA_ELEMENT_HANDLING.attributeCheck instanceof Function && EXTRA_ELEMENT_HANDLING.attributeCheck(lcName, lcTag);
      if (ALLOW_DATA_ATTR && regExpTest(DATA_ATTR$1, lcName)) {
        return true;
      }
      if (ALLOW_ARIA_ATTR && regExpTest(ARIA_ATTR$1, lcName)) {
        return true;
      }
      if (!nameIsPermitted) {
        return (
          // Condition a) covers a basically valid custom element tag name whose
          // tag passes the configured tagNameCheck and whose attribute name
          // passes the configured attributeNameCheck ...
          _isBasicCustomElement(lcTag) && _matchesNameCheck(CUSTOM_ELEMENT_HANDLING.tagNameCheck, lcTag) && _matchesNameCheck(CUSTOM_ELEMENT_HANDLING.attributeNameCheck, lcName, lcTag) || // Condition b) covers an `is` attribute whose value passes the
          // configured tagNameCheck while customized built-in elements are
          // allowed.
          lcName === "is" && CUSTOM_ELEMENT_HANDLING.allowCustomizedBuiltInElements && _matchesNameCheck(CUSTOM_ELEMENT_HANDLING.tagNameCheck, value)
        );
      }
      if (URI_SAFE_ATTRIBUTES[lcName]) {
        return true;
      }
      if (regExpTest(IS_ALLOWED_URI$1, stringReplace(value, ATTR_WHITESPACE$1, ""))) {
        return true;
      }
      if ((lcName === "src" || lcName === "xlink:href" || lcName === "href") && lcTag !== "script" && stringIndexOf(value, "data:") === 0 && DATA_URI_TAGS[lcTag]) {
        return true;
      }
      if (ALLOW_UNKNOWN_PROTOCOLS && !regExpTest(IS_SCRIPT_OR_DATA$1, stringReplace(value, ATTR_WHITESPACE$1, ""))) {
        return true;
      }
      return !value;
    };
    const RESERVED_CUSTOM_ELEMENT_NAMES = addToSet({}, ["annotation-xml", "color-profile", "font-face", "font-face-format", "font-face-name", "font-face-src", "font-face-uri", "missing-glyph"]);
    const _isBasicCustomElement = function _isBasicCustomElement2(tagName) {
      return !RESERVED_CUSTOM_ELEMENT_NAMES[stringToLowerCase(tagName)] && regExpTest(CUSTOM_ELEMENT$1, tagName);
    };
    const _applyTrustedTypesToAttribute = function _applyTrustedTypesToAttribute2(lcTag, lcName, namespaceURI, value) {
      if (trustedTypesPolicy && typeof trustedTypes === "object" && typeof trustedTypes.getAttributeType === "function" && !namespaceURI) {
        switch (trustedTypes.getAttributeType(lcTag, lcName)) {
          case "TrustedHTML": {
            return _createTrustedHTML(value);
          }
          case "TrustedScriptURL": {
            return _createTrustedScriptURL(value);
          }
        }
      }
      return value;
    };
    const _setAttributeValue = function _setAttributeValue2(currentNode, name, namespaceURI, value) {
      try {
        if (namespaceURI) {
          currentNode.setAttributeNS(namespaceURI, name, value);
        } else {
          currentNode.setAttribute(name, value);
        }
        if (_isClobbered(currentNode)) {
          _forceRemove(currentNode);
        } else {
          arrayPop(DOMPurify2.removed);
        }
      } catch (_2) {
        _removeAttribute(name, currentNode);
      }
    };
    const _sanitizeAttributes = function _sanitizeAttributes2(currentNode) {
      _executeHooks(hooks.beforeSanitizeAttributes, currentNode, null);
      const attributes = currentNode.attributes;
      if (!attributes || _isClobbered(currentNode)) {
        return;
      }
      ALLOWED_ATTR = _forkSharedAllowlist(hooks.uponSanitizeAttribute, ALLOWED_ATTR, DEFAULT_ALLOWED_ATTR, SET_CONFIG_ALLOWED_ATTR);
      const hookEvent = {
        attrName: "",
        attrValue: "",
        keepAttr: true,
        allowedAttributes: ALLOWED_ATTR,
        forceKeepAttr: void 0
      };
      let l3 = attributes.length;
      const lcTag = transformCaseFunc(currentNode.nodeName);
      while (l3--) {
        const attr = attributes[l3];
        const name = attr.name, namespaceURI = attr.namespaceURI, attrValue = attr.value;
        const lcName = transformCaseFunc(name);
        const initValue = attrValue;
        let value = name === "value" ? initValue : stringTrim(initValue);
        hookEvent.attrName = lcName;
        hookEvent.attrValue = value;
        hookEvent.keepAttr = true;
        hookEvent.forceKeepAttr = void 0;
        _executeHooks(hooks.uponSanitizeAttribute, currentNode, hookEvent);
        value = hookEvent.attrValue;
        if (SANITIZE_NAMED_PROPS && (lcName === "id" || lcName === "name") && stringIndexOf(value, SANITIZE_NAMED_PROPS_PREFIX) !== 0) {
          _removeAttribute(name, currentNode, attr);
          value = SANITIZE_NAMED_PROPS_PREFIX + value;
        }
        if (SAFE_FOR_XML && regExpTest(/((--!?|])>)|<\/(style|script|title|xmp|textarea|noscript|iframe|noembed|noframes)/i, value)) {
          _removeAttribute(name, currentNode, attr);
          continue;
        }
        if (lcName === "attributename" && stringMatch(value, "href")) {
          _removeAttribute(name, currentNode, attr);
          continue;
        }
        if (hookEvent.forceKeepAttr) {
          continue;
        }
        if (!hookEvent.keepAttr) {
          _removeAttribute(name, currentNode, attr);
          continue;
        }
        if (!ALLOW_SELF_CLOSE_IN_ATTR && regExpTest(SELF_CLOSING_TAG, value)) {
          _removeAttribute(name, currentNode, attr);
          continue;
        }
        if (SAFE_FOR_TEMPLATES) {
          value = _stripTemplateExpressions(value);
        }
        if (!_isValidAttribute(lcTag, lcName, value)) {
          _removeAttribute(name, currentNode, attr);
          continue;
        }
        value = _applyTrustedTypesToAttribute(lcTag, lcName, namespaceURI, value);
        if (value !== initValue) {
          _setAttributeValue(currentNode, name, namespaceURI, value);
        }
      }
      _executeHooks(hooks.afterSanitizeAttributes, currentNode, null);
    };
    const _sanitizeShadowDOM2 = function _sanitizeShadowDOM(fragment) {
      let shadowNode = null;
      const shadowIterator = _createNodeIterator(fragment);
      _executeHooks(hooks.beforeSanitizeShadowDOM, fragment, null);
      while (shadowNode = shadowIterator.nextNode()) {
        _executeHooks(hooks.uponSanitizeShadowNode, shadowNode, null);
        _sanitizeElements(shadowNode, fragment);
        _sanitizeAttributes(shadowNode);
        if (_isDocumentFragment(shadowNode.content)) {
          _sanitizeShadowDOM2(shadowNode.content);
        }
        if (_readNodeType(shadowNode) === NODE_TYPE.element) {
          const innerSr = getShadowRoot(shadowNode);
          if (_isDocumentFragment(innerSr)) {
            _sanitizeAttachedShadowRoots(innerSr);
            _sanitizeShadowDOM2(innerSr);
          }
        }
      }
      _executeHooks(hooks.afterSanitizeShadowDOM, fragment, null);
    };
    const _sanitizeAttachedShadowRoots = function _sanitizeAttachedShadowRoots2(root) {
      const stack = [{
        node: root,
        shadow: null
      }];
      while (stack.length > 0) {
        const item = stack.pop();
        if (item.shadow) {
          _sanitizeShadowDOM2(item.shadow);
          continue;
        }
        const node = item.node;
        const nodeType = _readNodeType(node);
        const isElement = nodeType === NODE_TYPE.element;
        const childNodes = getChildNodes(node);
        if (childNodes) {
          for (let i = childNodes.length - 1; i >= 0; --i) {
            stack.push({
              node: childNodes[i],
              shadow: null
            });
          }
        }
        if (isElement) {
          const rootName = getNodeName ? getNodeName(node) : null;
          if (typeof rootName === "string" && transformCaseFunc(rootName) === "template") {
            const content = node.content;
            if (_isDocumentFragment(content)) {
              stack.push({
                node: content,
                shadow: null
              });
            }
          }
        }
        if (isElement) {
          const sr = getShadowRoot(node);
          if (_isDocumentFragment(sr)) {
            stack.push({
              node: null,
              shadow: sr
            }, {
              node: sr,
              shadow: null
            });
          }
        }
      }
    };
    DOMPurify2.sanitize = function(dirty) {
      let cfg = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : {};
      let body = null;
      let importedNode = null;
      let currentNode = null;
      let returnNode = null;
      IS_EMPTY_INPUT = !dirty;
      if (IS_EMPTY_INPUT) {
        dirty = "<!-->";
      }
      if (typeof dirty !== "string" && !_isNode(dirty)) {
        dirty = stringifyValue(dirty);
        if (typeof dirty !== "string") {
          throw typeErrorCreate("dirty is not a string, aborting");
        }
      }
      if (!DOMPurify2.isSupported) {
        return dirty;
      }
      if (SET_CONFIG) {
        ALLOWED_TAGS = SET_CONFIG_ALLOWED_TAGS;
        ALLOWED_ATTR = SET_CONFIG_ALLOWED_ATTR;
      } else {
        _parseConfig(cfg);
      }
      if (hooks.uponSanitizeElement.length > 0 || hooks.uponSanitizeAttribute.length > 0) {
        ALLOWED_TAGS = clone(ALLOWED_TAGS);
      }
      if (hooks.uponSanitizeAttribute.length > 0) {
        ALLOWED_ATTR = clone(ALLOWED_ATTR);
      }
      DOMPurify2.removed = [];
      const inPlace = IN_PLACE && typeof dirty !== "string" && _isNode(dirty);
      if (inPlace) {
        _neutralizePatchLinkage(dirty);
        const nn3 = _readNodeName(dirty);
        if (typeof nn3 === "string") {
          const tagName = transformCaseFunc(nn3);
          if (!ALLOWED_TAGS[tagName] || FORBID_TAGS[tagName]) {
            _neutralizeRoot(dirty);
            throw typeErrorCreate("root node is forbidden and cannot be sanitized in-place");
          }
        }
        if (_isClobbered(dirty)) {
          _neutralizeRoot(dirty);
          throw typeErrorCreate("root node is clobbered and cannot be sanitized in-place");
        }
        try {
          _sanitizeAttachedShadowRoots(dirty);
        } catch (error) {
          _neutralizeRoot(dirty);
          throw error;
        }
      } else if (_isNode(dirty)) {
        body = _initDocument("<!---->");
        importedNode = body.ownerDocument.importNode(dirty, true);
        if (importedNode.nodeType === NODE_TYPE.element && importedNode.nodeName === "BODY") {
          body = importedNode;
        } else if (importedNode.nodeName === "HTML") {
          body = importedNode;
        } else {
          body.appendChild(importedNode);
        }
        _sanitizeAttachedShadowRoots(importedNode);
      } else {
        if (!RETURN_DOM && !SAFE_FOR_TEMPLATES && !WHOLE_DOCUMENT && // eslint-disable-next-line unicorn/prefer-includes
        dirty.indexOf("<") === -1) {
          return trustedTypesPolicy && RETURN_TRUSTED_TYPE ? _createTrustedHTML(dirty) : dirty;
        }
        body = _initDocument(dirty);
        if (!body) {
          return RETURN_DOM ? null : RETURN_TRUSTED_TYPE ? emptyHTML : "";
        }
      }
      if (body && FORCE_BODY) {
        _forceRemove(body.firstChild);
      }
      const walkRoot = inPlace ? dirty : body;
      try {
        const nodeIterator = _createNodeIterator(walkRoot);
        while (currentNode = nodeIterator.nextNode()) {
          _sanitizeElements(currentNode, walkRoot);
          _sanitizeAttributes(currentNode);
          if (_isDocumentFragment(currentNode.content)) {
            _sanitizeShadowDOM2(currentNode.content);
          }
        }
      } catch (error) {
        if (inPlace) {
          _neutralizeRoot(dirty);
          arrayForEach(DOMPurify2.removed, (entry) => {
            if (entry.element) {
              _neutralizeSubtree(entry.element);
            }
          });
        }
        throw error;
      }
      if (inPlace) {
        arrayForEach(DOMPurify2.removed, (entry) => {
          if (entry.element) {
            _neutralizeSubtree(entry.element);
          }
        });
        if (SAFE_FOR_TEMPLATES) {
          _scrubTemplateExpressions2(dirty);
        }
        return dirty;
      }
      if (RETURN_DOM) {
        if (SAFE_FOR_TEMPLATES) {
          _scrubTemplateExpressions2(body);
        }
        if (RETURN_DOM_FRAGMENT) {
          returnNode = createDocumentFragment.call(body.ownerDocument);
          while (body.firstChild) {
            returnNode.appendChild(body.firstChild);
          }
        } else {
          returnNode = body;
        }
        if (ALLOWED_ATTR.shadowroot || ALLOWED_ATTR.shadowrootmode) {
          returnNode = importNode.call(originalDocument, returnNode, true);
        }
        return returnNode;
      }
      let serializedHTML = WHOLE_DOCUMENT ? body.outerHTML : body.innerHTML;
      if (WHOLE_DOCUMENT && ALLOWED_TAGS["!doctype"] && body.ownerDocument && body.ownerDocument.doctype && body.ownerDocument.doctype.name && regExpTest(DOCTYPE_NAME, body.ownerDocument.doctype.name)) {
        serializedHTML = "<!DOCTYPE " + body.ownerDocument.doctype.name + ">\n" + serializedHTML;
      }
      if (SAFE_FOR_TEMPLATES) {
        serializedHTML = _stripTemplateExpressions(serializedHTML);
      }
      return trustedTypesPolicy && RETURN_TRUSTED_TYPE ? _createTrustedHTML(serializedHTML) : serializedHTML;
    };
    DOMPurify2.setConfig = function() {
      let cfg = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : {};
      _parseConfig(cfg);
      SET_CONFIG = true;
      SET_CONFIG_ALLOWED_TAGS = ALLOWED_TAGS;
      SET_CONFIG_ALLOWED_ATTR = ALLOWED_ATTR;
    };
    DOMPurify2.clearConfig = function() {
      CONFIG = null;
      SET_CONFIG = false;
      SET_CONFIG_ALLOWED_TAGS = null;
      SET_CONFIG_ALLOWED_ATTR = null;
      trustedTypesPolicy = defaultTrustedTypesPolicy;
      emptyHTML = "";
    };
    DOMPurify2.isValidAttribute = function(tag, attr, value) {
      if (!CONFIG) {
        _parseConfig({});
      }
      const lcTag = transformCaseFunc(tag);
      const lcName = transformCaseFunc(attr);
      return _isValidAttribute(lcTag, lcName, value);
    };
    DOMPurify2.addHook = function(entryPoint, hookFunction) {
      if (typeof hookFunction !== "function") {
        return;
      }
      if (!objectHasOwnProperty(hooks, entryPoint)) {
        return;
      }
      arrayPush(hooks[entryPoint], hookFunction);
    };
    DOMPurify2.removeHook = function(entryPoint, hookFunction) {
      if (!objectHasOwnProperty(hooks, entryPoint)) {
        return void 0;
      }
      if (hookFunction !== void 0) {
        const index = arrayLastIndexOf(hooks[entryPoint], hookFunction);
        return index === -1 ? void 0 : arraySplice(hooks[entryPoint], index, 1)[0];
      }
      return arrayPop(hooks[entryPoint]);
    };
    DOMPurify2.removeHooks = function(entryPoint) {
      if (!objectHasOwnProperty(hooks, entryPoint)) {
        return;
      }
      hooks[entryPoint] = [];
    };
    DOMPurify2.removeAllHooks = function() {
      hooks = _createHooksMap();
    };
    return DOMPurify2;
  }
  var purify = createDOMPurify();

  // node_modules/morphdom/dist/morphdom-esm.js
  var DOCUMENT_FRAGMENT_NODE = 11;
  function morphAttrs(fromNode, toNode) {
    var toNodeAttrs = toNode.attributes;
    var attr;
    var attrName;
    var attrNamespaceURI;
    var attrValue;
    var fromValue;
    if (toNode.nodeType === DOCUMENT_FRAGMENT_NODE || fromNode.nodeType === DOCUMENT_FRAGMENT_NODE) {
      return;
    }
    for (var i = toNodeAttrs.length - 1; i >= 0; i--) {
      attr = toNodeAttrs[i];
      attrName = attr.name;
      attrNamespaceURI = attr.namespaceURI;
      attrValue = attr.value;
      if (attrNamespaceURI) {
        attrName = attr.localName || attrName;
        fromValue = fromNode.getAttributeNS(attrNamespaceURI, attrName);
        if (fromValue !== attrValue) {
          if (attr.prefix === "xmlns") {
            attrName = attr.name;
          }
          fromNode.setAttributeNS(attrNamespaceURI, attrName, attrValue);
        }
      } else {
        fromValue = fromNode.getAttribute(attrName);
        if (fromValue !== attrValue) {
          fromNode.setAttribute(attrName, attrValue);
        }
      }
    }
    var fromNodeAttrs = fromNode.attributes;
    for (var d2 = fromNodeAttrs.length - 1; d2 >= 0; d2--) {
      attr = fromNodeAttrs[d2];
      attrName = attr.name;
      attrNamespaceURI = attr.namespaceURI;
      if (attrNamespaceURI) {
        attrName = attr.localName || attrName;
        if (!toNode.hasAttributeNS(attrNamespaceURI, attrName)) {
          fromNode.removeAttributeNS(attrNamespaceURI, attrName);
        }
      } else {
        if (!toNode.hasAttribute(attrName)) {
          fromNode.removeAttribute(attrName);
        }
      }
    }
  }
  var range;
  var NS_XHTML = "http://www.w3.org/1999/xhtml";
  var doc = typeof document === "undefined" ? void 0 : document;
  var HAS_TEMPLATE_SUPPORT = !!doc && "content" in doc.createElement("template");
  var HAS_RANGE_SUPPORT = !!doc && doc.createRange && "createContextualFragment" in doc.createRange();
  function createFragmentFromTemplate(str) {
    var template = doc.createElement("template");
    template.innerHTML = str;
    return template.content.childNodes[0];
  }
  function createFragmentFromRange(str) {
    if (!range) {
      range = doc.createRange();
      range.selectNode(doc.body);
    }
    var fragment = range.createContextualFragment(str);
    return fragment.childNodes[0];
  }
  function createFragmentFromWrap(str) {
    var fragment = doc.createElement("body");
    fragment.innerHTML = str;
    return fragment.childNodes[0];
  }
  function toElement(str) {
    str = str.trim();
    if (HAS_TEMPLATE_SUPPORT) {
      return createFragmentFromTemplate(str);
    } else if (HAS_RANGE_SUPPORT) {
      return createFragmentFromRange(str);
    }
    return createFragmentFromWrap(str);
  }
  function compareNodeNames(fromEl, toEl) {
    var fromNodeName = fromEl.nodeName;
    var toNodeName = toEl.nodeName;
    var fromCodeStart, toCodeStart;
    if (fromNodeName === toNodeName) {
      return true;
    }
    fromCodeStart = fromNodeName.charCodeAt(0);
    toCodeStart = toNodeName.charCodeAt(0);
    if (fromCodeStart <= 90 && toCodeStart >= 97) {
      return fromNodeName === toNodeName.toUpperCase();
    } else if (toCodeStart <= 90 && fromCodeStart >= 97) {
      return toNodeName === fromNodeName.toUpperCase();
    } else {
      return false;
    }
  }
  function createElementNS(name, namespaceURI) {
    return !namespaceURI || namespaceURI === NS_XHTML ? doc.createElement(name) : doc.createElementNS(namespaceURI, name);
  }
  function moveChildren(fromEl, toEl) {
    var curChild = fromEl.firstChild;
    while (curChild) {
      var nextChild = curChild.nextSibling;
      toEl.appendChild(curChild);
      curChild = nextChild;
    }
    return toEl;
  }
  function syncBooleanAttrProp(fromEl, toEl, name) {
    if (fromEl[name] !== toEl[name]) {
      fromEl[name] = toEl[name];
      if (fromEl[name]) {
        fromEl.setAttribute(name, "");
      } else {
        fromEl.removeAttribute(name);
      }
    }
  }
  var specialElHandlers = {
    OPTION: function(fromEl, toEl) {
      var parentNode = fromEl.parentNode;
      if (parentNode) {
        var parentName = parentNode.nodeName.toUpperCase();
        if (parentName === "OPTGROUP") {
          parentNode = parentNode.parentNode;
          parentName = parentNode && parentNode.nodeName.toUpperCase();
        }
        if (parentName === "SELECT" && !parentNode.hasAttribute("multiple")) {
          if (fromEl.hasAttribute("selected") && !toEl.selected) {
            fromEl.setAttribute("selected", "selected");
            fromEl.removeAttribute("selected");
          }
          parentNode.selectedIndex = -1;
        }
      }
      syncBooleanAttrProp(fromEl, toEl, "selected");
    },
    /**
     * The "value" attribute is special for the <input> element since it sets
     * the initial value. Changing the "value" attribute without changing the
     * "value" property will have no effect since it is only used to the set the
     * initial value.  Similar for the "checked" attribute, and "disabled".
     */
    INPUT: function(fromEl, toEl) {
      syncBooleanAttrProp(fromEl, toEl, "checked");
      syncBooleanAttrProp(fromEl, toEl, "disabled");
      if (fromEl.value !== toEl.value) {
        fromEl.value = toEl.value;
      }
      if (!toEl.hasAttribute("value")) {
        fromEl.removeAttribute("value");
      }
    },
    TEXTAREA: function(fromEl, toEl) {
      var newValue = toEl.value;
      if (fromEl.value !== newValue) {
        fromEl.value = newValue;
      }
      var firstChild = fromEl.firstChild;
      if (firstChild) {
        var oldValue = firstChild.nodeValue;
        if (oldValue == newValue || !newValue && oldValue == fromEl.placeholder) {
          return;
        }
        firstChild.nodeValue = newValue;
      }
    },
    SELECT: function(fromEl, toEl) {
      if (!toEl.hasAttribute("multiple")) {
        var selectedIndex = -1;
        var i = 0;
        var curChild = fromEl.firstChild;
        var optgroup;
        var nodeName;
        while (curChild) {
          nodeName = curChild.nodeName && curChild.nodeName.toUpperCase();
          if (nodeName === "OPTGROUP") {
            optgroup = curChild;
            curChild = optgroup.firstChild;
            if (!curChild) {
              curChild = optgroup.nextSibling;
              optgroup = null;
            }
          } else {
            if (nodeName === "OPTION") {
              if (curChild.hasAttribute("selected")) {
                selectedIndex = i;
                break;
              }
              i++;
            }
            curChild = curChild.nextSibling;
            if (!curChild && optgroup) {
              curChild = optgroup.nextSibling;
              optgroup = null;
            }
          }
        }
        fromEl.selectedIndex = selectedIndex;
      }
    }
  };
  var ELEMENT_NODE = 1;
  var DOCUMENT_FRAGMENT_NODE$1 = 11;
  var TEXT_NODE = 3;
  var COMMENT_NODE = 8;
  function noop() {
  }
  function defaultGetNodeKey(node) {
    if (node) {
      return node.getAttribute && node.getAttribute("id") || node.id;
    }
  }
  function morphdomFactory(morphAttrs2) {
    return function morphdom2(fromNode, toNode, options) {
      if (!options) {
        options = {};
      }
      if (typeof toNode === "string") {
        if (fromNode.nodeName === "#document" || fromNode.nodeName === "HTML") {
          var toNodeHtml = toNode;
          toNode = doc.createElement("html");
          toNode.innerHTML = toNodeHtml;
        } else if (fromNode.nodeName === "BODY") {
          var toNodeBody = toNode;
          toNode = doc.createElement("html");
          toNode.innerHTML = toNodeBody;
          var bodyElement = toNode.querySelector("body");
          if (bodyElement) {
            toNode = bodyElement;
          }
        } else {
          toNode = toElement(toNode);
        }
      } else if (toNode.nodeType === DOCUMENT_FRAGMENT_NODE$1) {
        toNode = toNode.firstElementChild;
      }
      var getNodeKey = options.getNodeKey || defaultGetNodeKey;
      var onBeforeNodeAdded = options.onBeforeNodeAdded || noop;
      var onNodeAdded = options.onNodeAdded || noop;
      var onBeforeElUpdated = options.onBeforeElUpdated || noop;
      var onElUpdated = options.onElUpdated || noop;
      var onBeforeNodeDiscarded = options.onBeforeNodeDiscarded || noop;
      var onNodeDiscarded = options.onNodeDiscarded || noop;
      var onBeforeElChildrenUpdated = options.onBeforeElChildrenUpdated || noop;
      var skipFromChildren = options.skipFromChildren || noop;
      var addChild = options.addChild || function(parent, child) {
        return parent.appendChild(child);
      };
      var childrenOnly = options.childrenOnly === true;
      var fromNodesLookup = /* @__PURE__ */ Object.create(null);
      var keyedRemovalList = [];
      function addKeyedRemoval(key) {
        keyedRemovalList.push(key);
      }
      function walkDiscardedChildNodes(node, skipKeyedNodes) {
        if (node.nodeType === ELEMENT_NODE) {
          var curChild = node.firstChild;
          while (curChild) {
            var key = void 0;
            if (skipKeyedNodes && (key = getNodeKey(curChild))) {
              addKeyedRemoval(key);
            } else {
              onNodeDiscarded(curChild);
              if (curChild.firstChild) {
                walkDiscardedChildNodes(curChild, skipKeyedNodes);
              }
            }
            curChild = curChild.nextSibling;
          }
        }
      }
      function removeNode(node, parentNode, skipKeyedNodes) {
        if (onBeforeNodeDiscarded(node) === false) {
          return;
        }
        if (parentNode) {
          parentNode.removeChild(node);
        }
        onNodeDiscarded(node);
        walkDiscardedChildNodes(node, skipKeyedNodes);
      }
      function indexTree(node) {
        if (node.nodeType === ELEMENT_NODE || node.nodeType === DOCUMENT_FRAGMENT_NODE$1) {
          var curChild = node.firstChild;
          while (curChild) {
            var key = getNodeKey(curChild);
            if (key) {
              fromNodesLookup[key] = curChild;
            }
            indexTree(curChild);
            curChild = curChild.nextSibling;
          }
        }
      }
      indexTree(fromNode);
      function handleNodeAdded(el) {
        onNodeAdded(el);
        var curChild = el.firstChild;
        while (curChild) {
          var nextSibling = curChild.nextSibling;
          var key = getNodeKey(curChild);
          if (key) {
            var unmatchedFromEl = fromNodesLookup[key];
            if (unmatchedFromEl && compareNodeNames(curChild, unmatchedFromEl)) {
              curChild.parentNode.replaceChild(unmatchedFromEl, curChild);
              morphEl(unmatchedFromEl, curChild);
            } else {
              handleNodeAdded(curChild);
            }
          } else {
            handleNodeAdded(curChild);
          }
          curChild = nextSibling;
        }
      }
      function cleanupFromEl(fromEl, curFromNodeChild, curFromNodeKey) {
        while (curFromNodeChild) {
          var fromNextSibling = curFromNodeChild.nextSibling;
          if (curFromNodeKey = getNodeKey(curFromNodeChild)) {
            addKeyedRemoval(curFromNodeKey);
          } else {
            removeNode(
              curFromNodeChild,
              fromEl,
              true
              /* skip keyed nodes */
            );
          }
          curFromNodeChild = fromNextSibling;
        }
      }
      function morphEl(fromEl, toEl, childrenOnly2) {
        var toElKey = getNodeKey(toEl);
        if (toElKey) {
          delete fromNodesLookup[toElKey];
        }
        if (!childrenOnly2) {
          var beforeUpdateResult = onBeforeElUpdated(fromEl, toEl);
          if (beforeUpdateResult === false) {
            return;
          } else if (beforeUpdateResult instanceof HTMLElement) {
            fromEl = beforeUpdateResult;
            indexTree(fromEl);
          }
          morphAttrs2(fromEl, toEl);
          onElUpdated(fromEl);
          if (onBeforeElChildrenUpdated(fromEl, toEl) === false) {
            return;
          }
        }
        if (fromEl.nodeName !== "TEXTAREA") {
          morphChildren(fromEl, toEl);
        } else {
          specialElHandlers.TEXTAREA(fromEl, toEl);
        }
      }
      function morphChildren(fromEl, toEl) {
        var skipFrom = skipFromChildren(fromEl, toEl);
        var curToNodeChild = toEl.firstChild;
        var curFromNodeChild = fromEl.firstChild;
        var curToNodeKey;
        var curFromNodeKey;
        var fromNextSibling;
        var toNextSibling;
        var matchingFromEl;
        outer: while (curToNodeChild) {
          toNextSibling = curToNodeChild.nextSibling;
          curToNodeKey = getNodeKey(curToNodeChild);
          while (!skipFrom && curFromNodeChild) {
            fromNextSibling = curFromNodeChild.nextSibling;
            if (curToNodeChild.isSameNode && curToNodeChild.isSameNode(curFromNodeChild)) {
              curToNodeChild = toNextSibling;
              curFromNodeChild = fromNextSibling;
              continue outer;
            }
            curFromNodeKey = getNodeKey(curFromNodeChild);
            var curFromNodeType = curFromNodeChild.nodeType;
            var isCompatible = void 0;
            if (curFromNodeType === curToNodeChild.nodeType) {
              if (curFromNodeType === ELEMENT_NODE) {
                if (curToNodeKey) {
                  if (curToNodeKey !== curFromNodeKey) {
                    if (matchingFromEl = fromNodesLookup[curToNodeKey]) {
                      if (fromNextSibling === matchingFromEl) {
                        isCompatible = false;
                      } else {
                        fromEl.insertBefore(matchingFromEl, curFromNodeChild);
                        if (curFromNodeKey) {
                          addKeyedRemoval(curFromNodeKey);
                        } else {
                          removeNode(
                            curFromNodeChild,
                            fromEl,
                            true
                            /* skip keyed nodes */
                          );
                        }
                        curFromNodeChild = matchingFromEl;
                        curFromNodeKey = getNodeKey(curFromNodeChild);
                      }
                    } else {
                      isCompatible = false;
                    }
                  }
                } else if (curFromNodeKey) {
                  isCompatible = false;
                }
                isCompatible = isCompatible !== false && compareNodeNames(curFromNodeChild, curToNodeChild);
                if (isCompatible) {
                  morphEl(curFromNodeChild, curToNodeChild);
                }
              } else if (curFromNodeType === TEXT_NODE || curFromNodeType == COMMENT_NODE) {
                isCompatible = true;
                if (curFromNodeChild.nodeValue !== curToNodeChild.nodeValue) {
                  curFromNodeChild.nodeValue = curToNodeChild.nodeValue;
                }
              }
            }
            if (isCompatible) {
              curToNodeChild = toNextSibling;
              curFromNodeChild = fromNextSibling;
              continue outer;
            }
            if (curFromNodeKey) {
              addKeyedRemoval(curFromNodeKey);
            } else {
              removeNode(
                curFromNodeChild,
                fromEl,
                true
                /* skip keyed nodes */
              );
            }
            curFromNodeChild = fromNextSibling;
          }
          if (curToNodeKey && (matchingFromEl = fromNodesLookup[curToNodeKey]) && compareNodeNames(matchingFromEl, curToNodeChild)) {
            if (!skipFrom) {
              addChild(fromEl, matchingFromEl);
            }
            morphEl(matchingFromEl, curToNodeChild);
          } else {
            var onBeforeNodeAddedResult = onBeforeNodeAdded(curToNodeChild);
            if (onBeforeNodeAddedResult !== false) {
              if (onBeforeNodeAddedResult) {
                curToNodeChild = onBeforeNodeAddedResult;
              }
              if (curToNodeChild.actualize) {
                curToNodeChild = curToNodeChild.actualize(fromEl.ownerDocument || doc);
              }
              addChild(fromEl, curToNodeChild);
              handleNodeAdded(curToNodeChild);
            }
          }
          curToNodeChild = toNextSibling;
          curFromNodeChild = fromNextSibling;
        }
        cleanupFromEl(fromEl, curFromNodeChild, curFromNodeKey);
        var specialElHandler = specialElHandlers[fromEl.nodeName];
        if (specialElHandler) {
          specialElHandler(fromEl, toEl);
        }
      }
      var morphedNode = fromNode;
      var morphedNodeType = morphedNode.nodeType;
      var toNodeType = toNode.nodeType;
      if (!childrenOnly) {
        if (morphedNodeType === ELEMENT_NODE) {
          if (toNodeType === ELEMENT_NODE) {
            if (!compareNodeNames(fromNode, toNode)) {
              onNodeDiscarded(fromNode);
              morphedNode = moveChildren(fromNode, createElementNS(toNode.nodeName, toNode.namespaceURI));
            }
          } else {
            morphedNode = toNode;
          }
        } else if (morphedNodeType === TEXT_NODE || morphedNodeType === COMMENT_NODE) {
          if (toNodeType === morphedNodeType) {
            if (morphedNode.nodeValue !== toNode.nodeValue) {
              morphedNode.nodeValue = toNode.nodeValue;
            }
            return morphedNode;
          } else {
            morphedNode = toNode;
          }
        }
      }
      if (morphedNode === toNode) {
        onNodeDiscarded(fromNode);
      } else {
        if (toNode.isSameNode && toNode.isSameNode(morphedNode)) {
          return;
        }
        morphEl(morphedNode, toNode, childrenOnly);
        if (keyedRemovalList) {
          for (var i = 0, len = keyedRemovalList.length; i < len; i++) {
            var elToRemove = fromNodesLookup[keyedRemovalList[i]];
            if (elToRemove) {
              removeNode(elToRemove, elToRemove.parentNode, false);
            }
          }
        }
      }
      if (!childrenOnly && morphedNode !== fromNode && fromNode.parentNode) {
        if (morphedNode.actualize) {
          morphedNode = morphedNode.actualize(fromNode.ownerDocument || doc);
        }
        fromNode.parentNode.replaceChild(morphedNode, fromNode);
      }
      return morphedNode;
    };
  }
  var morphdom = morphdomFactory(morphAttrs);
  var morphdom_esm_default = morphdom;

  // node_modules/remend/dist/index.js
  var dn = Object.defineProperty;
  var gn = Object.defineProperties;
  var hn = Object.getOwnPropertyDescriptors;
  var M = Object.getOwnPropertySymbols;
  var mn = Object.prototype.hasOwnProperty;
  var pn2 = Object.prototype.propertyIsEnumerable;
  var P2 = (n, r, e) => r in n ? dn(n, r, { enumerable: true, configurable: true, writable: true, value: e }) : n[r] = e;
  var I2 = (n, r) => {
    for (var e in r || (r = {})) mn.call(r, e) && P2(n, e, r[e]);
    if (M) for (var e of M(r)) pn2.call(r, e) && P2(n, e, r[e]);
    return n;
  };
  var b2 = (n, r) => gn(n, hn(r));
  var kn = (n) => {
    let r = new Uint8Array(n.length + 1), e = false, i = false, o = 0;
    for (; o < n.length; ) {
      if (n[o] === "\\" && o + 1 < n.length && n[o + 1] === "`") {
        let s = e || i ? 1 : 0;
        r[o + 1] = s, r[o + 2] = s, o += 2;
        continue;
      }
      if (n.substring(o, o + 3) === "```") {
        i = !i;
        let s = e || i ? 1 : 0, t = Math.min(o + 3, n.length);
        for (let a = o + 1; a <= t; a += 1) r[a] = s;
        o = t;
        continue;
      }
      !i && n[o] === "`" && (e = !e), r[o + 1] = e || i ? 1 : 0, o += 1;
    }
    return r;
  };
  var $2 = null;
  var c2 = (n, r) => {
    let e = $2;
    return (e === null || e.text !== n) && (e = { text: n, lookup: kn(n) }, $2 = e), e.lookup[Math.min(r, n.length)] === 1;
  };
  var In = (n, r) => {
    let e = n.substring(r, r + 3) === "```", i = r > 0 && n.substring(r - 1, r + 2) === "```", o = r > 1 && n.substring(r - 2, r + 1) === "```";
    return e || i || o;
  };
  var E2 = (n) => {
    let r = 0;
    for (let e = 0; e < n.length; e += 1) {
      if (n[e] === "\\" && e + 1 < n.length && n[e + 1] === "`") {
        e += 1;
        continue;
      }
      n[e] === "`" && !In(n, e) && (r += 1);
    }
    return r;
  };
  var d = (n, r) => {
    let e = false, i = false, o = -1;
    for (let s = 0; s < n.length; s += 1) {
      if (n[s] === "\\" && s + 1 < n.length && n[s + 1] === "`") {
        s += 1;
        continue;
      }
      if (n.substring(s, s + 3) === "```") {
        i = !i, s += 2;
        continue;
      }
      if (!i && n[s] === "`") if (e) {
        if (o < r && r < s) return true;
        e = false, o = -1;
      } else e = true, o = s;
    }
    return false;
  };
  var bn = /^(\s*(?:[-*+]|\d+[.)]) +)>(=?\s*[$]?\d)/gm;
  var y2 = (n) => !n || typeof n != "string" || !n.includes(">") ? n : n.replace(bn, (r, e, i, o) => c2(n, o) ? r : `${e}\\>${i}`);
  var N = /(\*\*)([^*]*\*?)$/;
  var R2 = /(__)([^_]*?)$/;
  var U2 = /(\*\*\*)([^*]*?)$/;
  var W2 = /(\*)([^*]*?)$/;
  var D = /(_)([^_]*?)$/;
  var K2 = /(`)([^`]*?)$/;
  var H3 = /(~~)([^~]*?)$/;
  var g = /^[\s_~*`]*$/;
  var C2 = /^[\s]*[-*+][\s]+$/;
  var w = /[\p{L}\p{N}_]/u;
  var G2 = /^```[^`\n]*```?$/;
  var F2 = /^\*{4,}$/;
  var X2 = /(__)([^_]+)_$/;
  var z2 = /(~~)([^~]+)~$/;
  var A2 = /~~/g;
  var f2 = (n) => {
    if (!n) return false;
    let r = n.charCodeAt(0);
    return r >= 48 && r <= 57 || r >= 65 && r <= 90 || r >= 97 && r <= 122 || r === 95 ? true : w.test(n);
  };
  var Y2 = (n, r) => {
    let e = 1;
    for (let i = r - 1; i >= 0; i -= 1) if (n[i] === "]") e += 1;
    else if (n[i] === "[" && (e -= 1, e === 0)) return i;
    return -1;
  };
  var T = (n, r) => {
    let e = 1;
    for (let i = r + 1; i < n.length; i += 1) if (n[i] === "[") e += 1;
    else if (n[i] === "]" && (e -= 1, e === 0)) return i;
    return -1;
  };
  var An = (n) => n === "inlineLatex" || n === "blockLatex";
  var Tn = (n, r) => r === "[" && n === "none" ? "blockLatex" : r === "]" && n === "blockLatex" ? "none" : r === "(" && n === "none" ? "inlineLatex" : r === ")" && n === "inlineLatex" ? "none" : null;
  var Ln = (n, r) => r ? n === "blockDollar" ? "none" : "blockDollar" : n === "blockDollar" ? n : n === "inlineDollar" ? "none" : "inlineDollar";
  var h = (n, r) => {
    let e = "none";
    for (let i = 0; i < n.length && i < r; i += 1) {
      if (n[i] === "\\" && n[i + 1] === "$") {
        i += 1;
        continue;
      }
      if (n[i] === "\\") {
        let o = Tn(e, n[i + 1]);
        if (o !== null) {
          e = o, i += 1;
          continue;
        }
      }
      if (n[i] === "$" && !An(e)) {
        let o = n[i + 1] === "$";
        e = Ln(e, o), o && (i += 1);
      }
    }
    return e !== "none";
  };
  var Bn = (n, r) => {
    for (let e = r; e < n.length; e += 1) {
      if (n[e] === ")") return true;
      if (n[e] === `
`) return false;
    }
    return false;
  };
  var m2 = (n, r) => {
    for (let e = r - 1; e >= 0; e -= 1) {
      if (n[e] === ")") return false;
      if (n[e] === "(") return e > 0 && n[e - 1] === "]" ? Bn(n, r) : false;
      if (n[e] === `
`) return false;
    }
    return false;
  };
  var j2 = (n, r) => {
    for (let e = r - 1; e >= 0; e -= 1) {
      if (n[e] === ">") return false;
      if (n[e] === "<") {
        let i = e + 1 < n.length ? n[e + 1] : "";
        return i >= "a" && i <= "z" || i >= "A" && i <= "Z" || i === "/";
      }
      if (n[e] === `
`) return false;
    }
    return false;
  };
  var p = (n, r, e) => {
    let i = 0;
    for (let l3 = r - 1; l3 >= 0; l3 -= 1) if (n[l3] === `
`) {
      i = l3 + 1;
      break;
    }
    let o = n.length;
    for (let l3 = r; l3 < n.length; l3 += 1) if (n[l3] === `
`) {
      o = l3;
      break;
    }
    let s = n.substring(i, o), t = 0, a = false;
    for (let l3 of s) if (l3 === e) t += 1;
    else if (l3 !== " " && l3 !== "	") {
      a = true;
      break;
    }
    return t >= 3 && !a;
  };
  var Z2 = (n) => n.includes("$") || n.includes("\\(") || n.includes("\\[");
  var Sn = (n, r, e, i) => e === "\\" || Z2(n) && h(n, r) ? true : e !== "*" && i === "*" ? (r < n.length - 2 ? n[r + 2] : "") !== "*" : e === "*" || (!e || e === " " || e === "	" || e === `
`) && (!i || i === " " || i === "	" || i === `
`);
  var k2 = (n) => n === " " || n === "	" || n === `
`;
  var On = (n, r) => !!(n && r && f2(n) && f2(r));
  var _n = (n, r, e, i) => {
    let o = On(n, r), s = !!r && !k2(r), t = !!n && !k2(n);
    return o && e % 2 === 0 && !i ? { count: false } : t && e % 2 === 1 || s ? { count: true, inWordAsteriskChain: o } : { count: false };
  };
  var v2 = (n) => {
    let r = 0, e = false, i = false, o = n.length;
    for (let s = 0; s < o; s += 1) {
      if (n[s] === "`" && s + 2 < o && n[s + 1] === "`" && n[s + 2] === "`") {
        e = !e, s += 2;
        continue;
      }
      if (e) continue;
      if (n[s] !== "*") {
        f2(n[s]) || (i = false);
        continue;
      }
      let t = s > 0 ? n[s - 1] : "", a = s < o - 1 ? n[s + 1] : "";
      if (Sn(n, s, t, a)) continue;
      let l3 = _n(t, a, r, i);
      l3.count && (r += 1, i = l3.inWordAsteriskChain);
    }
    return r;
  };
  var Mn = (n, r, e, i) => !!(e === "\\" || Z2(n) && h(n, r) || m2(n, r) || j2(n, r) || e === "_" || i === "_" || e && i && f2(e) && f2(i));
  var Pn = (n) => {
    let r = 0, e = false, i = n.length;
    for (let o = 0; o < i; o += 1) {
      if (n[o] === "`" && o + 2 < i && n[o + 1] === "`" && n[o + 2] === "`") {
        e = !e, o += 2;
        continue;
      }
      if (e || n[o] !== "_") continue;
      let s = o > 0 ? n[o - 1] : "", t = o < i - 1 ? n[o + 1] : "";
      Mn(n, o, s, t) || (r += 1);
    }
    return r;
  };
  var $n = (n) => {
    let r = 0, e = 0, i = false;
    for (let o = 0; o < n.length; o += 1) {
      if (n[o] === "`" && o + 2 < n.length && n[o + 1] === "`" && n[o + 2] === "`") {
        e >= 3 && (r += Math.floor(e / 3)), e = 0, i = !i, o += 2;
        continue;
      }
      i || (n[o] === "*" ? e += 1 : (e >= 3 && (r += Math.floor(e / 3)), e = 0));
    }
    return e >= 3 && (r += Math.floor(e / 3)), r;
  };
  var L2 = (n) => {
    let r = 0, e = false;
    for (let i = 0; i < n.length; i += 1) {
      if (n[i] === "`" && i + 2 < n.length && n[i + 1] === "`" && n[i + 2] === "`") {
        e = !e, i += 2;
        continue;
      }
      e || n[i] === "*" && i + 1 < n.length && n[i + 1] === "*" && (r += 1, i += 1);
    }
    return r;
  };
  var Q2 = (n) => {
    let r = 0, e = false;
    for (let i = 0; i < n.length; i += 1) {
      if (n[i] === "`" && i + 2 < n.length && n[i + 1] === "`" && n[i + 2] === "`") {
        e = !e, i += 2;
        continue;
      }
      e || n[i] === "_" && i + 1 < n.length && n[i + 1] === "_" && (r += 1, i += 1);
    }
    return r;
  };
  var En = (n, r, e) => {
    if (!r || g.test(r)) return true;
    let o = n.substring(0, e).lastIndexOf(`
`), s = o === -1 ? 0 : o + 1, t = n.substring(s, e);
    return C2.test(t) && r.includes(`
`) ? true : p(n, e, "*");
  };
  var q2 = (n) => {
    let r = n.match(N);
    if (!r) return n;
    let e = r[2], i = n.lastIndexOf(r[1]);
    return c2(n, i) || d(n, i) || En(n, e, i) ? n : L2(n) % 2 === 1 ? e.endsWith("*") ? `${n}*` : `${n}**` : n;
  };
  var yn = (n, r, e) => {
    if (!r || g.test(r)) return true;
    let o = n.substring(0, e).lastIndexOf(`
`), s = o === -1 ? 0 : o + 1, t = n.substring(s, e);
    return C2.test(t) && r.includes(`
`) ? true : p(n, e, "_");
  };
  var J2 = (n) => {
    let r = n.match(R2);
    if (!r) {
      let s = n.match(X2);
      if (s) {
        let t = n.lastIndexOf(s[1]);
        if (!(c2(n, t) || d(n, t)) && Q2(n) % 2 === 1) return `${n}_`;
      }
      return n;
    }
    let e = r[2], i = n.lastIndexOf(r[1]);
    return c2(n, i) || d(n, i) || yn(n, e, i) ? n : Q2(n) % 2 === 1 ? `${n}__` : n;
  };
  var Nn = (n) => {
    let r = false;
    for (let e = 0; e < n.length; e += 1) {
      if (n[e] === "`" && e + 2 < n.length && n[e + 1] === "`" && n[e + 2] === "`") {
        r = !r, e += 2;
        continue;
      }
      if (!r && n[e] === "*" && n[e - 1] !== "*" && n[e + 1] !== "*" && n[e - 1] !== "\\" && !h(n, e)) {
        let i = e > 0 ? n[e - 1] : "", o = e < n.length - 1 ? n[e + 1] : "", s = !i || k2(i), t = !o || k2(o);
        if (s && t || i && o && f2(i) && f2(o) || t) continue;
        return e;
      }
    }
    return -1;
  };
  var V2 = (n) => {
    if (!n.match(W2)) return n;
    let e = Nn(n);
    if (e === -1 || c2(n, e) || d(n, e)) return n;
    let i = n.substring(e + 1);
    return !i || g.test(i) ? n : v2(n) % 2 === 1 ? `${n}*` : n;
  };
  var x2 = (n) => {
    let r = false;
    for (let e = 0; e < n.length; e += 1) {
      if (n[e] === "`" && e + 2 < n.length && n[e + 1] === "`" && n[e + 2] === "`") {
        r = !r, e += 2;
        continue;
      }
      if (!r && n[e] === "_" && n[e - 1] !== "_" && n[e + 1] !== "_" && n[e - 1] !== "\\" && !h(n, e) && !m2(n, e)) {
        let i = e > 0 ? n[e - 1] : "", o = e < n.length - 1 ? n[e + 1] : "";
        if (i && o && f2(i) && f2(o)) continue;
        return e;
      }
    }
    return -1;
  };
  var Rn = (n) => {
    let r = n.length;
    for (; r > 0 && n[r - 1] === `
`; ) r -= 1;
    if (r < n.length) {
      let e = n.slice(0, r), i = n.slice(r);
      return `${e}_${i}`;
    }
    return `${n}_`;
  };
  var Un = (n) => {
    if (!n.endsWith("**")) return null;
    let r = n.slice(0, -2);
    if (L2(r) % 2 !== 1) return null;
    let i = r.indexOf("**"), o = x2(r);
    return i !== -1 && o !== -1 && i < o ? `${r}_**` : null;
  };
  var nn2 = (n) => {
    if (!n.match(D)) return n;
    let e = x2(n);
    if (e === -1) return n;
    let i = n.substring(e + 1);
    if (!i || g.test(i) || c2(n, e) || d(n, e)) return n;
    if (Pn(n) % 2 === 1) {
      let s = Un(n);
      return s !== null ? s : Rn(n);
    }
    return n;
  };
  var Wn = (n) => {
    let r = L2(n), e = v2(n);
    return r % 2 === 0 && e % 2 === 0;
  };
  var Dn = (n, r, e) => !r || g.test(r) || c2(n, e) || d(n, e) ? true : p(n, e, "*");
  var en = (n) => {
    if (F2.test(n)) return n;
    let r = n.match(U2);
    if (!r) return n;
    let e = r[2], i = n.lastIndexOf(r[1]);
    return Dn(n, e, i) ? n : $n(n) % 2 === 1 ? Wn(n) ? n : `${n}***` : n;
  };
  var Kn = /<[a-zA-Z/][^>]*$/;
  var rn2 = (n) => {
    let r = n.match(Kn);
    return !r || r.index === void 0 || c2(n, r.index) ? n : n.substring(0, r.index).trimEnd();
  };
  var Hn = (n) => !n.match(G2) || n.includes(`
`) ? null : n.endsWith("``") && !n.endsWith("```") ? `${n}\`` : n;
  var wn = (n) => (n.match(/```/g) || []).length % 2 === 1;
  var on2 = (n) => {
    let r = Hn(n);
    if (r !== null) return r;
    let e = n.match(K2);
    if (e && !wn(n)) {
      let i = e[2];
      if (!i || g.test(i)) return n;
      if (E2(n) % 2 === 1) return `${n}\``;
    }
    return n;
  };
  var sn2 = (n, r) => r >= 2 && n.substring(r - 2, r + 1) === "```" || r >= 1 && n.substring(r - 1, r + 2) === "```" || r <= n.length - 3 && n.substring(r, r + 3) === "```";
  var Gn = (n) => {
    let r = 0, e = false;
    for (let i = 0; i < n.length - 1; i += 1) n[i] === "`" && !sn2(n, i) && (e = !e), !e && n[i] === "$" && n[i + 1] === "$" && (r += 1, i += 1);
    return r;
  };
  var Fn = (n) => {
    let r = 0, e = false;
    for (let i = 0; i < n.length; i += 1) {
      if (n[i] === "\\") {
        i += 1;
        continue;
      }
      if (n[i] === "`" && !sn2(n, i)) {
        e = !e;
        continue;
      }
      !e && n[i] === "$" && (i + 1 < n.length && n[i + 1] === "$" ? i += 1 : r += 1);
    }
    return r;
  };
  var Xn = (n) => {
    if (n.endsWith("$") && !n.endsWith("$$")) return `${n}$`;
    let r = n.indexOf("$$");
    return r !== -1 && n.indexOf(`
`, r) !== -1 && !n.endsWith(`
`) ? `${n}
$$` : `${n}$$`;
  };
  var tn = (n) => Gn(n) % 2 === 0 ? n : Xn(n);
  var ln2 = (n) => Fn(n) % 2 === 1 ? `${n}$` : n;
  var zn = (n, r, e) => {
    if (n.substring(r + 2).includes(")")) return null;
    let o = Y2(n, r);
    if (o === -1 || c2(n, o)) return null;
    let s = o > 0 && n[o - 1] === "!", t = s ? o - 1 : o, a = n.substring(0, t);
    if (s) return a;
    let l3 = n.substring(o + 1, r);
    return e === "text-only" ? `${a}${l3}` : `${a}[${l3}](streamdown:incomplete-link)`;
  };
  var an = (n, r) => {
    for (let e = 0; e < r; e++) if (n[e] === "[" && !c2(n, e)) {
      if (e > 0 && n[e - 1] === "!") continue;
      let i = T(n, e);
      if (i === -1) return e;
      if (i + 1 < n.length && n[i + 1] === "(") {
        let o = n.indexOf(")", i + 2);
        o !== -1 && (e = o);
      }
    }
    return r;
  };
  var Yn = (n, r, e) => {
    let i = r > 0 && n[r - 1] === "!", o = i ? r - 1 : r;
    if (!n.substring(r + 1).includes("]")) {
      let a = n.substring(0, o);
      if (i) return a;
      if (e === "text-only") {
        let l3 = an(n, r);
        return n.substring(0, l3) + n.substring(l3 + 1);
      }
      return `${n}](streamdown:incomplete-link)`;
    }
    if (T(n, r) === -1) {
      let a = n.substring(0, o);
      if (i) return a;
      if (e === "text-only") {
        let l3 = an(n, r);
        return n.substring(0, l3) + n.substring(l3 + 1);
      }
      return `${n}](streamdown:incomplete-link)`;
    }
    return null;
  };
  var B2 = (n, r = "protocol") => {
    let e = n.lastIndexOf("](");
    if (e !== -1 && !c2(n, e)) {
      let i = zn(n, e, r);
      if (i !== null) return i;
    }
    for (let i = n.length - 1; i >= 0; i -= 1) if (n[i] === "[" && !c2(n, i)) {
      let o = Yn(n, i, r);
      if (o !== null) return o;
    }
    return n;
  };
  var jn = /^-{1,2}$/;
  var Qn = /^[\s]*-{1,2}[\s]+$/;
  var Zn = /^={1,2}$/;
  var vn = /^[\s]*={1,2}[\s]+$/;
  var cn = (n) => {
    if (!n || typeof n != "string") return n;
    let r = n.lastIndexOf(`
`);
    if (r === -1) return n;
    let e = n.substring(r + 1), i = n.substring(0, r), o = e.trim();
    if (jn.test(o) && !e.match(Qn)) {
      let t = i.split(`
`).at(-1);
      if (t && t.trim().length > 0) return `${n}\u200B`;
    }
    if (Zn.test(o) && !e.match(vn)) {
      let t = i.split(`
`).at(-1);
      if (t && t.trim().length > 0) return `${n}\u200B`;
    }
    return n;
  };
  var qn = /([\p{L}\p{N}_])~(?!~)(?=[\p{L}\p{N}_])/gu;
  var un = (n) => !n || typeof n != "string" || !n.includes("~") ? n : n.replace(qn, (r, e, i) => {
    let o = i + e.length;
    return c2(n, o) ? r : `${e}\\~`;
  });
  var fn = (n) => {
    var e, i;
    let r = n.match(H3);
    if (r) {
      let o = r[2];
      if (!o || g.test(o)) return n;
      let s = n.lastIndexOf(r[1]);
      if (c2(n, s) || d(n, s)) return n;
      if (((e = n.match(A2)) == null ? void 0 : e.length) % 2 === 1) return `${n}~~`;
    } else {
      let o = n.match(z2);
      if (o) {
        let s = n.lastIndexOf(o[0].slice(0, 2));
        if (c2(n, s) || d(n, s)) return n;
        if (((i = n.match(A2)) == null ? void 0 : i.length) % 2 === 1) return `${n}~`;
      }
    }
    return n;
  };
  var S2 = (n) => n !== false;
  var Jn = (n) => n === true;
  var u = { SINGLE_TILDE: 0, COMPARISON_OPERATORS: 5, HTML_TAGS: 10, SETEXT_HEADINGS: 15, LINKS: 20, BOLD_ITALIC: 30, BOLD: 35, ITALIC_DOUBLE_UNDERSCORE: 40, ITALIC_SINGLE_ASTERISK: 41, ITALIC_SINGLE_UNDERSCORE: 42, INLINE_CODE: 50, STRIKETHROUGH: 60, KATEX: 70, INLINE_KATEX: 75, DEFAULT: 100 };
  var Vn = [{ handler: { name: "singleTilde", handle: un, priority: u.SINGLE_TILDE }, optionKey: "singleTilde" }, { handler: { name: "comparisonOperators", handle: y2, priority: u.COMPARISON_OPERATORS }, optionKey: "comparisonOperators" }, { handler: { name: "htmlTags", handle: rn2, priority: u.HTML_TAGS }, optionKey: "htmlTags" }, { handler: { name: "setextHeadings", handle: cn, priority: u.SETEXT_HEADINGS }, optionKey: "setextHeadings" }, { handler: { name: "links", handle: B2, priority: u.LINKS }, optionKey: "links", earlyReturn: (n) => n.endsWith("](streamdown:incomplete-link)") }, { handler: { name: "boldItalic", handle: en, priority: u.BOLD_ITALIC }, optionKey: "boldItalic" }, { handler: { name: "bold", handle: q2, priority: u.BOLD }, optionKey: "bold" }, { handler: { name: "italicDoubleUnderscore", handle: J2, priority: u.ITALIC_DOUBLE_UNDERSCORE }, optionKey: "italic" }, { handler: { name: "italicSingleAsterisk", handle: V2, priority: u.ITALIC_SINGLE_ASTERISK }, optionKey: "italic" }, { handler: { name: "italicSingleUnderscore", handle: nn2, priority: u.ITALIC_SINGLE_UNDERSCORE }, optionKey: "italic" }, { handler: { name: "inlineCode", handle: on2, priority: u.INLINE_CODE }, optionKey: "inlineCode" }, { handler: { name: "strikethrough", handle: fn, priority: u.STRIKETHROUGH }, optionKey: "strikethrough" }, { handler: { name: "katex", handle: tn, priority: u.KATEX }, optionKey: "katex" }, { handler: { name: "inlineKatex", handle: ln2, priority: u.INLINE_KATEX }, optionKey: "inlineKatex" }];
  var xn = (n) => {
    var e;
    let r = (e = n == null ? void 0 : n.linkMode) != null ? e : "protocol";
    return Vn.filter(({ handler: i, optionKey: o }) => i.name === "links" ? S2(n == null ? void 0 : n.links) || S2(n == null ? void 0 : n.images) : i.name === "inlineKatex" ? Jn(n == null ? void 0 : n.inlineKatex) : S2(n == null ? void 0 : n[o])).map(({ handler: i, earlyReturn: o }) => i.name === "links" ? { handler: b2(I2({}, i), { handle: (s) => B2(s, r) }), earlyReturn: r === "protocol" ? o : void 0 } : { handler: i, earlyReturn: o });
  };
  var ne = (n, r) => {
    var t;
    if (!n || typeof n != "string") return n;
    let e = n.endsWith(" ") && !n.endsWith("  ") ? n.slice(0, -1) : n, i = xn(r), o = ((t = r == null ? void 0 : r.handlers) != null ? t : []).map((a) => {
      var l3;
      return { handler: b2(I2({}, a), { priority: (l3 = a.priority) != null ? l3 : u.DEFAULT }), earlyReturn: void 0 };
    }), s = [...i, ...o].sort((a, l3) => {
      var O2, _2;
      return ((O2 = a.handler.priority) != null ? O2 : 0) - ((_2 = l3.handler.priority) != null ? _2 : 0);
    });
    for (let { handler: a, earlyReturn: l3 } of s) if (e = a.handle(e), l3 != null && l3(e)) return e;
    return e;
  };
  var We2 = ne;

  // web/chat/src/deps.js
  window.marked = f;
  [
    ["javascript", javascript],
    ["typescript", typescript],
    ["python", python],
    ["bash", bash],
    ["shell", shell],
    ["json", json],
    ["sql", sql],
    ["rust", rust],
    ["go", go],
    ["cpp", cpp],
    ["c", c],
    ["java", java],
    ["csharp", csharp],
    ["php", php],
    ["xml", xml],
    ["css", css],
    ["yaml", yaml],
    ["markdown", markdown],
    ["ruby", ruby],
    ["swift", swift],
    ["kotlin", kotlin],
    ["dockerfile", dockerfile],
    ["diff", diff],
    ["ini", ini],
    ["plaintext", plaintext]
  ].forEach(([name, def]) => core_default.registerLanguage(name, def));
  window.hljs = core_default;
  window.DOMPurify = purify;
  window.morphdom = morphdom_esm_default;
  window.remend = We2;

  // web/chat/js/state.js
  window.Hermes = window.Hermes || {};
  (function() {
    "use strict";
    var H4 = window.Hermes;
    H4.API_BASE = "http://127.0.0.1:8643";
    H4.HERMES_API = "http://127.0.0.1:8643";
    function createCache(messages) {
      return {
        messages: messages || [],
        loadedAt: Date.now(),
        version: 1,
        isStale: false
      };
    }
    H4.state = {
      sessions: [],
      focusedSessionId: null,
      // 唯一焦点：当前用户正在看的会话
      viewMode: "list",
      // 'list' | 'view' | 'chat'
      sessionMessages: {},
      // { sid -> MessageCache }
      activeStreams: {},
      // { sid -> StreamState }
      showTools: true,
      providers: [],
      currentProvider: "",
      // ---- Project support ----
      projects: [],
      // [{ id, name, path, created_at, session_count }]
      currentProjectId: null
      // 当前选中项目 ID (null = 默认项目)
    };
    Object.defineProperty(H4.state, "currentSessionId", {
      get: function() {
        return this.focusedSessionId;
      },
      set: function(v3) {
        this.focusedSessionId = v3;
      },
      enumerable: true
    });
    Object.defineProperty(H4.state, "activeSessionId", {
      get: function() {
        return this.focusedSessionId;
      },
      set: function(v3) {
        this.focusedSessionId = v3;
      },
      enumerable: true
    });
    Object.defineProperty(H4.state, "chatSessionId", {
      get: function() {
        return this.focusedSessionId;
      },
      set: function(v3) {
        this.focusedSessionId = v3;
      },
      enumerable: true
    });
    Object.defineProperty(H4.state, "chatMode", {
      get: function() {
        return this.viewMode === "chat";
      },
      set: function(v3) {
        this.viewMode = v3 ? "chat" : "list";
      },
      enumerable: true
    });
    Object.defineProperty(H4.state, "messages", {
      get: function() {
        var sid = this.focusedSessionId;
        if (!sid) return [];
        var cache = this.sessionMessages[sid];
        return cache ? cache.messages : [];
      },
      set: function(v3) {
        var sid = this.focusedSessionId;
        if (sid) {
          var cache = this.sessionMessages[sid];
          if (cache) {
            cache.messages = v3;
            cache.version++;
            cache.isStale = false;
            cache.loadedAt = Date.now();
          } else {
            this.sessionMessages[sid] = createCache(v3);
          }
        }
      },
      enumerable: true
    });
    H4.$ = function(sel) {
      return document.querySelector(sel);
    };
    H4.$$ = function(sel) {
      return document.querySelectorAll(sel);
    };
    H4.dom = {};
    H4.initDom = function() {
      var $3 = H4.$;
      var dom = H4.dom;
      dom.sessionList = $3("#session-list");
      dom.searchInput = $3("#search-input");
      dom.gatewayStatus = $3("#gateway-status");
      dom.globalStreamInd = $3("#global-stream-indicator");
      dom.globalStreamText = $3("#global-stream-text");
      dom.quickStats = $3("#quick-stats");
      dom.projectSelector = $3("#project-selector");
      dom.projectTrigger = $3("#project-trigger");
      dom.projectDropdown = $3("#project-dropdown");
      dom.projectList = $3("#project-list");
      dom.currentProjectName = $3("#current-project-name");
      dom.currentProjectPath = $3("#current-project-path");
      dom.ctxModel = $3("#ctx-model");
      dom.ctxTokens = $3("#ctx-tokens");
      dom.ctxProgress = $3("#ctx-progress");
      dom.ctxPercent = $3("#ctx-percent");
      dom.ctxDuration = $3("#ctx-duration");
      dom.welcomeScreen = $3("#welcome-screen");
      dom.newChatStreamingHint = $3("#new-chat-streaming-hint");
      dom.sessionView = $3("#session-view");
      dom.sessionTitle = $3("#session-title");
      dom.sessionInfo = $3("#session-info");
      dom.streamingBanner = $3("#streaming-banner");
      dom.messageList = $3("#message-list");
      dom.chatMode = $3("#chat-mode");
      dom.chatSessionLabel = $3("#chat-session-label");
      dom.chatMessages = $3("#chat-messages");
      dom.chatInput = $3("#chat-input");
      dom.slashMenu = $3("#slash-menu");
      dom.providerSelect = $3("#provider-select");
      dom.adminView = $3("#admin-view");
    };
    var ESC_MAP = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" };
    H4.esc = function esc(str) {
      if (!str) return "";
      return String(str).replace(/[&<>"']/g, function(c3) {
        return ESC_MAP[c3];
      });
    };
    H4.fmtTime = function fmtTime(ts) {
      if (!ts) return "-";
      var d2 = new Date(ts * 1e3);
      return d2.toLocaleString("zh-CN", { month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" });
    };
    H4.fmtTokens = function fmtTokens(n) {
      if (!n) return "-";
      n = Math.abs(n);
      if (n >= 1e9) {
        var s = n / 1e9;
        return (s < 10 ? s.toFixed(2) : s < 100 ? s.toFixed(1) : s.toFixed(0)).replace(/\.0+$|(\.\d*[1-9])0+$/, "$1") + "B";
      }
      if (n >= 1e6) {
        var s = n / 1e6;
        return (s < 10 ? s.toFixed(2) : s < 100 ? s.toFixed(1) : s.toFixed(0)).replace(/\.0+$|(\.\d*[1-9])0+$/, "$1") + "M";
      }
      if (n >= 1e3) {
        var s = n / 1e3;
        return (s < 10 ? s.toFixed(2) : s < 100 ? s.toFixed(1) : s.toFixed(0)).replace(/\.0+$|(\.\d*[1-9])0+$/, "$1") + "K";
      }
      return String(n);
    };
    H4.fmtDuration = function fmtDuration(start, end) {
      if (!start) return "-";
      var e = end || Date.now() / 1e3;
      var diff2 = Math.floor(e - start);
      if (diff2 < 60) return diff2 + "s";
      if (diff2 < 3600) return Math.floor(diff2 / 60) + "m";
      return Math.floor(diff2 / 3600) + "h" + Math.floor(diff2 % 3600 / 60) + "m";
    };
    H4.truncate = function truncate(str, max) {
      if (!str || str.length <= max) return str;
      return str.substring(0, max) + "...";
    };
    var _cleanupTimer = null;
    function startCleanupTimer() {
      if (_cleanupTimer) return;
      _cleanupTimer = setInterval(function() {
        var now = Date.now();
        var MAX_KEEP_MS = 5 * 60 * 1e3;
        var activeStreams = H4.state.activeStreams;
        Object.keys(activeStreams).forEach(function(key) {
          var s = activeStreams[key];
          if (s.finished && s.finishedAt && now - s.finishedAt > MAX_KEEP_MS) {
            delete activeStreams[key];
          }
        });
      }, 6e4);
    }
    H4.updateStreamingHints = function updateStreamingHints() {
      var state = H4.state;
      var dom = H4.dom;
      if (!dom.streamingBanner) return;
      var activeCount = 0;
      Object.values(state.activeStreams).forEach(function(s) {
        if (!s.finished) activeCount++;
      });
      if (dom.globalStreamInd) {
        if (activeCount > 0) {
          dom.globalStreamInd.style.display = "inline-flex";
          if (dom.globalStreamText) {
            dom.globalStreamText.textContent = activeCount + " \u4E2A\u4F1A\u8BDD\u8FD0\u884C\u4E2D";
          }
        } else {
          dom.globalStreamInd.style.display = "none";
        }
      }
      var focusedStream = state.focusedSessionId ? state.activeStreams[state.focusedSessionId] : null;
      if (focusedStream && !focusedStream.finished && state.viewMode !== "chat") {
        dom.streamingBanner.style.display = "flex";
      } else {
        dom.streamingBanner.style.display = "none";
      }
      var hasActiveStream = activeCount > 0;
      if (hasActiveStream && state.viewMode === "list") {
        dom.newChatStreamingHint.style.display = "block";
      } else {
        dom.newChatStreamingHint.style.display = "none";
      }
    };
    startCleanupTimer();
    H4.answerBlockCounter = 0;
    H4.toast = function toast(msg, isError) {
      var el = document.createElement("div");
      el.className = "memory-toast" + (isError ? " error" : "");
      el.textContent = msg;
      document.body.appendChild(el);
      setTimeout(function() {
        if (el.parentNode) el.parentNode.removeChild(el);
      }, 3e3);
    };
    H4.createCache = createCache;
  })();

  // web/chat/js/api.js
  window.Hermes = window.Hermes || {};
  (function() {
    "use strict";
    var H4 = window.Hermes;
    H4.api = async function api(path, opts) {
      if (opts === void 0) opts = {};
      var fetchOpts = {
        headers: { "Content-Type": "application/json" }
      };
      if (opts.method) fetchOpts.method = opts.method;
      if (opts.body) fetchOpts.body = typeof opts.body === "string" ? opts.body : JSON.stringify(opts.body);
      if (opts.headers) Object.assign(fetchOpts.headers, opts.headers);
      var isGet = !fetchOpts.method || fetchOpts.method === "GET";
      var externalSignal = opts.signal || null;
      async function attempt() {
        var ctrl = new AbortController();
        var timer = setTimeout(function() {
          ctrl.abort();
        }, isGet ? 8e3 : 2e4);
        if (externalSignal) {
          if (externalSignal.aborted) ctrl.abort();
          else externalSignal.addEventListener("abort", function() {
            ctrl.abort();
          });
        }
        fetchOpts.signal = ctrl.signal;
        try {
          var res = await fetch(H4.API_BASE + path, fetchOpts);
          var data;
          try {
            data = await res.json();
          } catch (e) {
            throw new Error("API \u54CD\u5E94\u89E3\u6790\u5931\u8D25: " + res.status);
          }
          if (!data.ok) throw new Error(data.error || "unknown error");
          return data;
        } finally {
          clearTimeout(timer);
        }
      }
      try {
        return await attempt();
      } catch (e) {
        if (isGet && (!externalSignal || !externalSignal.aborted)) {
          await new Promise(function(r) {
            setTimeout(r, 1e3);
          });
          return await attempt();
        }
        throw e;
      }
    };
  })();

  // web/chat/js/project-manager.js
  (function() {
    "use strict";
    var H4 = window.Hermes;
    if (!H4) return;
    var projects = [];
    var currentProjectId = null;
    function loadProjects() {
      return H4.api("/projects").then(function(data) {
        projects = data.data || [];
        H4.projects = projects;
        return projects;
      });
    }
    function deleteProject(projectId) {
      return H4.api("/projects/" + encodeURIComponent(projectId), { method: "DELETE" }).then(function() {
        if (currentProjectId === projectId) switchProject(null);
        return loadProjects();
      }).then(function() {
        updateProjectUI();
        renderProjectList();
      });
    }
    function switchProject(projectId) {
      if (projectId === currentProjectId) return;
      currentProjectId = projectId;
      H4.state.currentProjectId = projectId;
      H4.currentProjectId = currentProjectId;
      if (H4.state.focusedSessionId) {
        H4.state.focusedSessionId = null;
        H4.state.viewMode = "list";
        if (H4.showView) H4.showView("welcome");
        if (H4.updateStreamingHints) H4.updateStreamingHints();
        if (H4.updateURL) H4.updateURL();
      }
      if (projectId) {
        location.hash = "#/p/" + encodeURIComponent(projectId);
      } else {
        history.replaceState(null, "", location.pathname);
      }
      updateProjectUI();
      if (H4.loadSessions) H4.loadSessions();
    }
    function updateProjectUI() {
      var dom = H4.dom;
      if (!dom.currentProjectName) return;
      var proj = projects.find(function(p2) {
        return p2.id === currentProjectId;
      });
      if (proj) {
        dom.currentProjectName.textContent = proj.name || "\u9ED8\u8BA4\u9879\u76EE";
        dom.currentProjectPath.textContent = proj.path || "";
      } else {
        dom.currentProjectName.textContent = "\u5168\u90E8\u76EE\u5F55";
        dom.currentProjectPath.textContent = "\u6240\u6709\u5DE5\u4F5C\u76EE\u5F55\u7684\u4F1A\u8BDD";
      }
      var items = document.querySelectorAll(".project-item");
      items.forEach(function(item) {
        var id = item.getAttribute("data-project-id");
        item.classList.toggle("active", id === currentProjectId);
      });
    }
    function renderProjectList() {
      var dom = H4.dom;
      if (!dom.projectList) return;
      var html2 = "";
      html2 += '<div class="project-item' + (!currentProjectId ? " active" : "") + '" data-project-id=""><div class="project-item-icon">*</div><div class="project-item-body"><span class="project-item-name">\u5168\u90E8\u76EE\u5F55</span></div></div>';
      projects.forEach(function(p2) {
        var icon = (p2.name || "P").charAt(0).toUpperCase();
        var count = p2.session_count || 0;
        html2 += '<div class="project-item' + (p2.id === currentProjectId ? " active" : "") + '" data-project-id="' + escAttr(p2.id) + '"><div class="project-item-icon">' + esc(icon) + '</div><div class="project-item-body"><span class="project-item-name">' + esc(p2.name) + "</span>" + (p2.path ? '<span class="project-item-path">' + esc(p2.path) + "</span>" : "") + '</div><span class="project-item-count">' + count + "</span>";
        html2 += "</div>";
      });
      html2 += '<div class="project-action-bar"><button class="btn-select-dir" id="btn-select-dir" title="\u8BBE\u7F6E\u9879\u76EE\u76EE\u5F55\uFF08\u7EDD\u5BF9\u8DEF\u5F84\uFF09">\u{1F4C2} \u9009\u62E9\u76EE\u5F55</button></div>';
      dom.projectList.innerHTML = html2;
    }
    function showPathDialog() {
      var existing = document.getElementById("path-dialog-overlay");
      if (existing) existing.remove();
      var overlay = document.createElement("div");
      overlay.id = "path-dialog-overlay";
      overlay.className = "path-dialog-overlay";
      overlay.innerHTML = '<div class="path-dialog"><div class="path-dialog-header"><span>\u65B0\u589E\u9879\u76EE\u76EE\u5F55</span><button class="path-dialog-close" id="path-dialog-close">\u2715</button></div><div class="path-dialog-body"><label class="path-dialog-label">\u9879\u76EE\u7EDD\u5BF9\u8DEF\u5F84</label><input type="text" class="path-dialog-input" id="path-dialog-input" placeholder="\u5982 /Users/xxx/projects/my-project" autocomplete="off" /><span class="path-dialog-hint">\u8F93\u5165\u5B8C\u6574\u7684\u7EDD\u5BF9\u8DEF\u5F84\uFF0Cagent \u4F1A\u5728\u6B64\u76EE\u5F55\u4E0B\u6267\u884C\u64CD\u4F5C</span></div><div class="path-dialog-footer"><button class="path-dialog-cancel" id="path-dialog-cancel">\u53D6\u6D88</button><button class="path-dialog-confirm" id="path-dialog-confirm">\u786E\u8BA4</button></div></div>';
      document.body.appendChild(overlay);
      var input = document.getElementById("path-dialog-input");
      var closeBtn = document.getElementById("path-dialog-close");
      var cancelBtn = document.getElementById("path-dialog-cancel");
      var confirmBtn = document.getElementById("path-dialog-confirm");
      function doSave() {
        var path = input.value.trim();
        if (!path) {
          H4.toast("\u8BF7\u8F93\u5165\u9879\u76EE\u7EDD\u5BF9\u8DEF\u5F84", true);
          return;
        }
        saveProjectPath(path);
        overlay.remove();
      }
      function doClose() {
        overlay.remove();
      }
      confirmBtn.addEventListener("click", doSave);
      cancelBtn.addEventListener("click", doClose);
      closeBtn.addEventListener("click", doClose);
      overlay.addEventListener("click", function(e) {
        if (e.target === overlay) doClose();
      });
      input.addEventListener("keydown", function(e) {
        if (e.key === "Enter") {
          e.preventDefault();
          doSave();
        }
        if (e.key === "Escape") {
          e.preventDefault();
          doClose();
        }
      });
      setTimeout(function() {
        input.focus();
        if (input.value) input.select();
      }, 80);
    }
    async function saveProjectPath(path) {
      var parts = path.split("/");
      var name = parts[parts.length - 1] || path;
      try {
        var projRes = await H4.api("/projects", { method: "POST", body: { name, path } });
        if (projRes.ok && projRes.data) {
          await loadProjects();
          switchProject(projRes.data.id);
        }
      } catch (e) {
        H4.toast("\u521B\u5EFA\u9879\u76EE\u5931\u8D25: " + e.message, true);
      }
      closeDropdown();
    }
    function openDropdown() {
      var dom = H4.dom;
      if (!dom.projectDropdown) return;
      renderProjectList();
      dom.projectDropdown.style.display = "block";
      dom.projectSelector.classList.add("open");
    }
    function closeDropdown() {
      var dom = H4.dom;
      if (!dom.projectDropdown) return;
      dom.projectDropdown.style.display = "none";
      dom.projectSelector.classList.remove("open");
    }
    function isDropdownOpen() {
      var dom = H4.dom;
      return !!(dom.projectDropdown && dom.projectDropdown.style.display === "block");
    }
    function toggleDropdown() {
      if (isDropdownOpen()) {
        closeDropdown();
      } else {
        openDropdown();
      }
    }
    function bindProjectEvents() {
      var dom = H4.dom;
      if (dom.projectTrigger) {
        dom.projectTrigger.addEventListener("click", function(e) {
          e.stopPropagation();
          toggleDropdown();
        });
      }
      if (dom.projectList) {
        dom.projectList.addEventListener("click", function(e) {
          var dirBtn = e.target.closest("#btn-select-dir");
          if (dirBtn) {
            e.stopPropagation();
            showPathDialog();
            return;
          }
          var item = e.target.closest(".project-item");
          if (!item) return;
          var delBtn = e.target.closest(".project-item-delete");
          if (delBtn) {
            e.stopPropagation();
            var delId = delBtn.getAttribute("data-delete-id");
            if (delId) {
              deleteProject(delId).catch(function(err) {
                H4.toast(err.message, true);
              });
            }
            return;
          }
          var projId = item.getAttribute("data-project-id");
          switchProject(projId || null);
          closeDropdown();
        });
      }
      document.addEventListener("click", function(e) {
        if (isDropdownOpen() && !e.target.closest("#project-selector")) {
          closeDropdown();
        }
      });
      document.addEventListener("keydown", function(e) {
        if (e.key === "Escape" && isDropdownOpen()) {
          closeDropdown();
        }
      });
    }
    function restoreProjectFromURL() {
      var hash = location.hash || "";
      var m3 = hash.match(/#\/p\/([^/#?]+)/);
      if (m3 && m3[1]) {
        currentProjectId = decodeURIComponent(m3[1]);
        H4.state.currentProjectId = currentProjectId;
        H4.currentProjectId = currentProjectId;
      }
    }
    function initProjects() {
      restoreProjectFromURL();
      return loadProjects().then(function() {
        if (currentProjectId && !projects.find(function(p2) {
          return p2.id === currentProjectId;
        })) {
          currentProjectId = null;
          H4.state.currentProjectId = null;
          H4.currentProjectId = null;
        }
        updateProjectUI();
      }).catch(function(e) {
        console.warn("\u52A0\u8F7D\u9879\u76EE\u5217\u8868\u5931\u8D25:", e);
        updateProjectUI();
      });
    }
    function esc(s) {
      if (!s) return "";
      return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
    }
    function escAttr(s) {
      if (!s) return "";
      return String(s).replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/'/g, "&#39;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
    }
    async function recoverSessionsToProject(targetProjectId) {
      var pid = targetProjectId || currentProjectId;
      if (!pid) {
        H4.toast("\u8BF7\u5148\u5207\u6362\u5230\u76EE\u6807\u9879\u76EE", true);
        return;
      }
      var mappingRes;
      try {
        mappingRes = await H4.api("/projects/mapping");
      } catch (e) {
        mappingRes = {};
      }
      var sessionProjectMap = mappingRes && mappingRes.data || {};
      var sessions = H4.state.sessions || [];
      var candidates = sessions.filter(function(s) {
        return !sessionProjectMap[s.id];
      });
      if (candidates.length === 0) {
        H4.toast("\u6CA1\u6709\u9700\u8981\u6062\u590D\u7684\u4F1A\u8BDD\uFF08\u6240\u6709\u4F1A\u8BDD\u5DF2\u6709\u6620\u5C04\uFF09");
        return;
      }
      var success = 0, fail = 0;
      for (var i = 0; i < candidates.length; i++) {
        try {
          var res = await H4.api("/projects/" + encodeURIComponent(pid) + "/assign", {
            method: "POST",
            body: { session_id: candidates[i].id }
          });
          if (res.ok) {
            success++;
          } else {
            fail++;
          }
        } catch (e) {
          fail++;
        }
      }
      H4.toast("\u5DF2\u6062\u590D " + success + " \u4E2A\u4F1A\u8BDD" + (fail > 0 ? "\uFF0C" + fail + " \u4E2A\u5931\u8D25" : ""));
      if (H4.loadSessions) H4.loadSessions();
    }
    H4.initProjects = initProjects;
    H4.bindProjectEvents = bindProjectEvents;
    H4.switchProject = switchProject;
    H4.loadProjects = loadProjects;
    H4.recoverSessionsToProject = recoverSessionsToProject;
    H4.renderProjectList = renderProjectList;
    H4.showPathDialog = showPathDialog;
    H4.projects = projects;
    H4.currentProjectId = currentProjectId;
  })();

  // web/chat/js/session-manager.js
  window.Hermes = window.Hermes || {};
  (function() {
    "use strict";
    var H4 = window.Hermes;
    var state = H4.state;
    var MAX_CACHED_SESSIONS = 20;
    var _lruOrder = [];
    function _touchLRU(sid) {
      var idx = _lruOrder.indexOf(sid);
      if (idx >= 0) _lruOrder.splice(idx, 1);
      _lruOrder.push(sid);
      _evictIfNeeded();
    }
    function _evictIfNeeded() {
      while (_lruOrder.length > MAX_CACHED_SESSIONS) {
        var oldSid = _lruOrder.shift();
        if (oldSid === state.focusedSessionId) {
          _lruOrder.push(oldSid);
          continue;
        }
        if (state.activeStreams[oldSid]) {
          _lruOrder.push(oldSid);
          continue;
        }
        delete state.sessionMessages[oldSid];
      }
    }
    function getCache(sid) {
      if (!sid) return null;
      if (!state.sessionMessages[sid]) {
        state.sessionMessages[sid] = H4.createCache([]);
      }
      _touchLRU(sid);
      return state.sessionMessages[sid];
    }
    function getMsgs(sid) {
      var cache = getCache(sid || state.focusedSessionId);
      return cache ? cache.messages : null;
    }
    function setMsgs(sid, msgs) {
      if (!sid) return;
      var cache = state.sessionMessages[sid];
      if (cache) {
        cache.messages = msgs;
        cache.version++;
        cache.isStale = false;
        cache.loadedAt = Date.now();
      } else {
        state.sessionMessages[sid] = H4.createCache(msgs);
      }
    }
    function markStale(sid) {
      var cache = state.sessionMessages[sid];
      if (cache) cache.isStale = true;
    }
    async function ensureFresh(sid) {
      if (!sid) return;
      var cache = getCache(sid);
      if (!cache) {
        await loadMessagesFromAPI(sid);
        return;
      }
      var stream = state.activeStreams[sid];
      if (stream && !stream.finished) return;
      if (cache.isStale || cache.messages.length === 0) {
        await loadMessagesFromAPI(sid);
      }
    }
    async function loadMessagesFromAPI(sid) {
      try {
        var result = await H4.api("/sessions/" + sid + "/messages");
        var msgs = Array.isArray(result.data) ? result.data : [];
        setMsgs(sid, msgs);
        return msgs;
      } catch (e) {
        console.warn("[SessionManager] loadMessagesFromAPI failed for", sid, e);
        throw e;
      }
    }
    function getStream(sid) {
      return state.activeStreams[sid] || null;
    }
    function hasActiveStream(sid) {
      var s = state.activeStreams[sid];
      return s && !s.finished;
    }
    function anyActiveStream() {
      return Object.values(state.activeStreams).some(function(s) {
        return !s.finished;
      });
    }
    function abortStream(sid) {
      var stream = state.activeStreams[sid];
      if (!stream) return false;
      if (stream.abortController) stream.abortController.abort();
      try {
        fetch(H4.API_BASE + "/abort", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ session_id: sid })
        }).catch(function() {
        });
      } catch (e) {
      }
      var cache = state.sessionMessages[sid];
      if (cache) {
        var msgs = cache.messages;
        for (var i = msgs.length - 1; i >= 0; i--) {
          if (msgs[i]._streaming) {
            msgs[i]._streaming = false;
            msgs[i]._aborted = true;
            if (msgs[i]._toolSteps) msgs[i]._toolSteps.forEach(function(s) {
              s.running = false;
            });
            break;
          }
        }
        cache.isStale = true;
      }
      delete state.activeStreams[sid];
      return true;
    }
    function onStreamComplete(sid) {
      var stream = state.activeStreams[sid];
      if (!stream) return;
      stream.finished = true;
      stream.finishedAt = Date.now();
      var cache = state.sessionMessages[sid];
      if (cache) {
        var msgs = cache.messages;
        for (var i = msgs.length - 1; i >= 0; i--) {
          if (msgs[i]._streaming) {
            msgs[i]._streaming = false;
            msgs[i]._toolSteps && msgs[i]._toolSteps.forEach(function(s) {
              s.running = false;
            });
            break;
          }
        }
        cache.isStale = true;
      }
      if (state.focusedSessionId === sid && state.viewMode === "chat") {
        H4.finalizeStreamingTurn(sid);
      }
      backgroundReFetch(sid);
    }
    var _reFetchSeq = {};
    async function backgroundReFetch(sid) {
      try {
        await new Promise(function(r) {
          setTimeout(r, 800);
        });
        var mySeq = _reFetchSeq[sid] = (_reFetchSeq[sid] || 0) + 1;
        var cache = state.sessionMessages[sid];
        if (!cache) return;
        if (cache._compactedAt && Date.now() - cache._compactedAt < 1e4) {
          console.log("[backgroundReFetch] skipped: session recently compacted");
          cache._compactedAt = 0;
          return;
        }
        var stream = state.activeStreams[sid];
        var offset = stream && stream.preStreamCount != null ? stream.preStreamCount : 0;
        if (offset > cache.messages.length) offset = 0;
        var url = "/sessions/" + sid + "/messages" + (offset > 0 ? "?offset=" + offset : "");
        var result = await H4.api(url);
        var freshMsgs = Array.isArray(result.data) ? result.data : [];
        if (mySeq !== _reFetchSeq[sid]) return;
        if (hasActiveStream(sid)) {
          console.log("[backgroundReFetch] skipped: new stream active for", sid);
          return;
        }
        if (offset > 0 && freshMsgs.length > 0 && freshMsgs.length < cache.messages.length) {
          cache.messages = cache.messages.slice(0, offset).concat(freshMsgs);
          cache.version++;
          cache.isStale = false;
          cache.loadedAt = Date.now();
          if (state.focusedSessionId === sid && state.viewMode === "chat") {
            H4.refreshLastTurn(sid);
          }
        } else if (freshMsgs.length >= cache.messages.length) {
          cache.messages = freshMsgs;
          cache.version++;
          cache.isStale = false;
          cache.loadedAt = Date.now();
          if (state.focusedSessionId === sid && state.viewMode === "chat") {
            H4.refreshLastTurn(sid);
          }
        }
      } catch (e) {
        console.warn("[SessionManager] backgroundReFetch failed for", sid, e);
      }
    }
    function renderFocusedView() {
      var sid = state.focusedSessionId;
      if (!sid) return;
      if (state.viewMode === "chat") {
        H4.renderCurrentChat();
      } else if (state.viewMode === "view") {
        var msgs = getMsgs(sid);
        if (msgs) {
          H4.renderMessages(msgs, H4.dom.messageList);
        }
      }
    }
    var _enterSeq = 0;
    async function enterSession(sid, mode) {
      var prev = state.focusedSessionId;
      var mySeq = ++_enterSeq;
      if (prev && prev !== sid && H4._clearRenderTimer) {
        H4._clearRenderTimer(prev);
      }
      state.focusedSessionId = sid;
      state.viewMode = mode;
      if (!sid) {
        H4.showView("welcome");
        H4.updateStreamingHints();
        updateSidebar();
        updateURL();
        return;
      }
      if (hasActiveStream(sid) && mode === "view") {
        mode = "chat";
        state.viewMode = "chat";
      }
      try {
        await ensureFresh(sid);
        if (mySeq !== _enterSeq || state.focusedSessionId !== sid) return;
        if (mode === "chat") {
          H4.showView("chat");
          var dom = H4.dom;
          if (dom.chatSessionLabel) {
            dom.chatSessionLabel.textContent = "\u5BF9\u8BDD: " + sid.substring(0, 16);
          }
          H4.renderCurrentChat();
          if (H4.updateChatUIState) H4.updateChatUIState();
          if (H4._startLiveTimer && hasActiveStream(sid)) {
            var _msgs = getMsgs(sid);
            if (_msgs) {
              var _hasRunning = _msgs.some(function(m3) {
                return m3._streaming && m3._toolSteps && m3._toolSteps.some(function(ts) {
                  return ts.running;
                });
              });
              if (_hasRunning) H4._startLiveTimer();
            }
          }
          H4.loadContextInfo(sid, true);
        } else {
          H4.showView("session");
          var msgs = getMsgs(sid);
          if (msgs) {
            H4.renderMessages(msgs, H4.dom.messageList);
          }
          H4.loadContextInfo(sid, true);
          loadSessionHeader(sid);
        }
        H4.updateStreamingHints();
        updateSidebar();
        updateURL();
      } finally {
        if (H4.dom && H4.dom.messageList) {
          H4.dom.messageList.classList.remove("switching");
          var sl = H4.dom.messageList.querySelector(".switch-loading");
          if (sl) sl.remove();
        }
      }
    }
    async function loadSessionHeader(sid) {
      var dom = H4.dom;
      if (!dom.sessionTitle || !dom.sessionInfo) return;
      try {
        var result = await H4.api("/sessions/" + sid);
        var session = result.data;
        if (!session || state.focusedSessionId !== sid || state.viewMode === "chat") return;
        dom.sessionTitle.textContent = session.title || "Session";
        var fmtT = H4.fmtTime;
        var fmtTok = H4.fmtTokens;
        var fmtDur = H4.fmtDuration;
        dom.sessionInfo.textContent = (session.model || "-") + " | " + fmtDur(session.started_at, session.ended_at) + " | " + (session.message_count || 0) + " \u6761 | " + fmtTok(session.input_tokens) + " in / " + fmtTok(session.output_tokens) + " out";
      } catch (e) {
        if (state.focusedSessionId === sid && state.viewMode !== "chat") {
          dom.sessionTitle.textContent = "Session";
          dom.sessionInfo.textContent = e.message;
        }
      }
    }
    function updateSidebar() {
      var sid = state.focusedSessionId;
      H4.$$(".session-item").forEach(function(el) {
        el.classList.toggle("active", el.dataset.id === sid);
      });
    }
    function updateURL() {
      var sid = state.focusedSessionId;
      var mode = state.viewMode;
      var projId = window.Hermes && window.Hermes.currentProjectId || "";
      var hash = "";
      if (projId && sid) {
        hash = "#/p/" + projId + "/s/" + sid + (mode === "chat" ? "/chat" : "");
      } else if (projId) {
        hash = "#/p/" + projId;
      } else if (sid) {
        hash = "#/s/" + sid + (mode === "chat" ? "/chat" : "");
      }
      if (hash) {
        history.replaceState(null, "", hash);
      } else {
        history.replaceState(null, "", location.pathname);
      }
    }
    function restoreFromURL() {
      var hash = location.hash;
      if (!hash) return null;
      var match = hash.match(/#\/p\/[^/]+\/s\/([^/]+)(?:\/(chat))?/);
      if (match) {
        return { sid: match[1], mode: match[2] || "view" };
      }
      match = hash.match(/#\/s\/([^/]+)(?:\/(chat))?/);
      if (match) {
        return { sid: match[1], mode: match[2] || "view" };
      }
      return null;
    }
    async function createNewChat() {
      try {
        var body = {};
        var proj = (H4.projects || []).find(function(p2) {
          return p2.id === H4.currentProjectId;
        });
        var workingDir = proj && proj.path || H4.currentProjectId;
        if (workingDir) body.working_dir = workingDir;
        var result = await H4.api("/sessions", { method: "POST", body });
        var sid = result.session && result.session.id || result.session_id;
        if (!sid) throw new Error("\u521B\u5EFA\u4F1A\u8BDD\u5931\u8D25: \u672A\u8FD4\u56DE session_id");
        setMsgs(sid, []);
        var _title = result.session && result.session.title || "\u65B0\u5BF9\u8BDD";
        insertSessionToList(sid, _title);
        await H4.loadSessions();
        var _inList = (state.sessions || []).some(function(s) {
          return s.id === sid;
        });
        if (!_inList) insertSessionToList(sid, _title);
        await enterSession(sid, "chat");
        return sid;
      } catch (e) {
        H4.toast("\u521B\u5EFA\u4F1A\u8BDD\u5931\u8D25: " + e.message, true);
        return null;
      }
    }
    function insertSessionToList(sid, title) {
      var dom = H4.dom;
      if (!dom.sessionList) return;
      if (dom.sessionList.querySelector('.session-item[data-id="' + sid + '"]')) return;
      var esc = H4.esc;
      var html2 = '<div class="session-item active" data-id="' + esc(sid) + '"><div class="session-item-title" data-title="' + esc(title) + '">' + esc(title) + '</div><div class="session-item-meta"><span>\u521A\u521A</span><span>0 \u6761</span><span>-</span></div><button class="session-delete" title="\u5220\u9664\u4F1A\u8BDD">\u2715</button></div>';
      dom.sessionList.insertAdjacentHTML("afterbegin", html2);
      updateSidebar();
    }
    function cleanupSession(sid) {
      abortStream(sid);
      delete state.sessionMessages[sid];
      if (state.focusedSessionId === sid) {
        state.focusedSessionId = null;
        state.viewMode = "list";
        H4.showView("welcome");
      }
    }
    H4.getMsgs = getMsgs;
    H4.setMsgs = setMsgs;
    H4.markStale = markStale;
    H4.ensureFresh = ensureFresh;
    H4.loadMessagesFromAPI = loadMessagesFromAPI;
    H4.getStream = getStream;
    H4.hasActiveStream = hasActiveStream;
    H4.anyActiveStream = anyActiveStream;
    H4.abortStream = abortStream;
    H4.onStreamComplete = onStreamComplete;
    H4.renderFocusedView = renderFocusedView;
    H4.enterSession = enterSession;
    H4.updateSidebar = updateSidebar;
    H4.updateURL = updateURL;
    H4.restoreFromURL = restoreFromURL;
    H4.createNewChat = createNewChat;
    H4.insertSessionToList = insertSessionToList;
    function purgeStaleCaches() {
      var validIds = {};
      (state.sessions || []).forEach(function(s) {
        validIds[s.id] = true;
      });
      var removed = [];
      Object.keys(state.sessionMessages).forEach(function(sid) {
        if (!validIds[sid]) {
          delete state.sessionMessages[sid];
          removed.push(sid);
        }
      });
      Object.keys(state.activeStreams).forEach(function(sid) {
        if (!validIds[sid]) {
          abortStream(sid);
        }
      });
      if (removed.length > 0) {
        console.log("[SessionManager] purged stale caches for:", removed);
      }
    }
    H4.cleanupSession = cleanupSession;
    H4.purgeStaleCaches = purgeStaleCaches;
  })();

  // web/chat/js/router.js
  window.Hermes = window.Hermes || {};
  (function() {
    "use strict";
    const dom = window.Hermes.dom;
    const viewMap = {
      welcome: function() {
        return dom.welcomeScreen;
      },
      session: function() {
        return dom.sessionView;
      },
      chat: function() {
        return dom.chatMode;
      },
      admin: function() {
        return document.getElementById("admin-view");
      }
    };
    function showView(viewName) {
      for (const name of Object.keys(viewMap)) {
        const el2 = viewMap[name]();
        if (el2) el2.style.display = "none";
      }
      const target = viewMap[viewName];
      if (!target) {
        console.warn("[Pi] showView: unknown view:", viewName);
        return;
      }
      const el = target();
      if (el) el.style.display = "flex";
    }
    window.Hermes.showView = showView;
  })();

  // web/chat/js/markdown.js
  window.Hermes = window.Hermes || {};
  (function() {
    "use strict";
    const esc = window.Hermes.esc;
    var _streamingMode = false;
    function initMarked() {
      const renderer = new marked.Renderer();
      renderer.code = function(codeObj) {
        const text2 = typeof codeObj === "string" ? codeObj : codeObj.text || "";
        const lang = typeof codeObj === "string" ? arguments[1] : codeObj.lang || "";
        let highlighted;
        var needAutoHighlight = false;
        var hlLang = "";
        if (_streamingMode) {
          highlighted = esc(text2);
        } else if (lang && hljs.getLanguage(lang)) {
          highlighted = esc(text2);
          needAutoHighlight = true;
          hlLang = lang;
        } else {
          if (text2.length > 2e3) {
            highlighted = esc(text2);
          } else {
            highlighted = esc(text2);
            needAutoHighlight = true;
          }
        }
        const langLabel = lang ? '<span class="code-lang">' + esc(lang) + "</span>" : "";
        var codeClass = "hljs language-" + esc(lang || "text") + (needAutoHighlight ? " need-auto-highlight" : "");
        var dataLangAttr = hlLang ? ' data-lang="' + esc(hlLang) + '"' : "";
        return '<div class="code-block"><div class="code-header">' + langLabel + '<button class="code-copy-btn" data-action="copy-code">\u590D\u5236</button></div><pre><code class="' + codeClass + '"' + dataLangAttr + ">" + highlighted + "</code></pre></div>";
      };
      marked.setOptions({
        renderer,
        gfm: true,
        breaks: false
      });
    }
    initMarked();
    function copyCode(btn) {
      const codeEl = btn.closest(".code-block").querySelector("code");
      const text2 = codeEl.textContent;
      navigator.clipboard.writeText(text2).then(() => {
        btn.textContent = "\u5DF2\u590D\u5236!";
        btn.classList.add("copied");
        setTimeout(() => {
          btn.textContent = "\u590D\u5236";
          btn.classList.remove("copied");
        }, 2e3);
      }).catch(() => {
        btn.textContent = "\u5931\u8D25";
        setTimeout(() => {
          btn.textContent = "\u590D\u5236";
        }, 2e3);
      });
    }
    function renderAnswerBlock(markdownText) {
      const id = "ans-" + ++window.Hermes.answerBlockCounter;
      return `
      <div class="step-answer-wrap" id="${id}">
        <div class="step-answer collapsible">${renderMarkdown(markdownText)}</div>
        <button class="collapse-btn" data-action="toggle-collapse" data-target="${id}" style="display:none">
          <span class="arrow">\u25BC</span><span class="label">\u5C55\u5F00</span>
        </button>
        <button class="copy-md-btn" data-action="copy-markdown" data-target="${id}" title="\u590D\u5236 Markdown \u539F\u6587">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/></svg>
          <span>\u590D\u5236</span>
        </button>
        <textarea class="md-raw" readonly>${esc(markdownText)}</textarea>
      </div>`;
    }
    function copyMarkdown(id, btn) {
      const wrap = document.getElementById(id);
      const raw = wrap?.querySelector(".md-raw");
      if (!raw) return;
      navigator.clipboard.writeText(raw.value).then(() => {
        btn.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg><span>\u5DF2\u590D\u5236</span>';
        btn.classList.add("copied");
        setTimeout(() => {
          btn.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/></svg><span>\u590D\u5236</span>';
          btn.classList.remove("copied");
        }, 2e3);
      });
    }
    function toggleCollapse(id, btn) {
      const wrap = document.getElementById(id);
      const answer = wrap?.querySelector(".step-answer.collapsible");
      if (!answer) return;
      const isCollapsed = answer.classList.contains("collapsed");
      if (isCollapsed) {
        answer.classList.remove("collapsed");
        btn.classList.add("expanded");
        btn.querySelector(".label").textContent = "\u6536\u8D77";
      } else {
        answer.classList.add("collapsed");
        btn.classList.remove("expanded");
        btn.querySelector(".label").textContent = "\u5C55\u5F00";
        answer.scrollIntoView({ behavior: "smooth", block: "nearest" });
      }
    }
    document.addEventListener("click", function(e) {
      const btn = e.target.closest("[data-action]");
      if (!btn) return;
      const action = btn.dataset.action;
      if (action === "copy-code") {
        copyCode(btn);
      } else if (action === "copy-markdown") {
        copyMarkdown(btn.dataset.target, btn);
      } else if (action === "toggle-collapse") {
        toggleCollapse(btn.dataset.target, btn);
      }
    });
    window.Hermes.initCollapsible = function(container) {
      var root = container || document;
      var allAnswers = root.querySelectorAll(".step-answer.collapsible");
      var isStreaming = !!(root.querySelector ? root.querySelector('.turn[data-streaming="true"]') : document.querySelector('.turn[data-streaming="true"]'));
      var lastIndex = allAnswers.length - 1;
      allAnswers.forEach(function(el, idx) {
        if (el.dataset.collapsibleInit) return;
        el.dataset.collapsibleInit = "1";
        var isLastAnswer = idx === lastIndex;
        if (isLastAnswer) {
          var wrap = el.closest(".step-answer-wrap");
          var btn = wrap ? wrap.querySelector(".collapse-btn") : null;
          if (btn && el.scrollHeight > 320) btn.style.display = "";
          return;
        }
        if (el.scrollHeight > 320) {
          el.classList.add("collapsed");
          var wrap2 = el.closest(".step-answer-wrap");
          var btn2 = wrap2 ? wrap2.querySelector(".collapse-btn") : null;
          if (btn2) btn2.style.display = "";
        }
      });
      root.querySelectorAll(".thinking-block:not(.thinking-expanded):not(.thinking-collapsed) .thinking-body").forEach(function(el) {
        el.scrollTop = el.scrollHeight;
      });
      root.querySelectorAll(".tool-result:not(.tool-result-expanded):not(.tool-result-collapsed) .tool-result-body").forEach(function(el) {
        el.scrollTop = el.scrollHeight;
      });
      scheduleIdleHighlight(root);
    };
    function renderStreamingText(text2) {
      if (!text2) return "";
      var escaped = esc(text2);
      var parts = escaped.split(/(```[\s\S]*?```)/g);
      var html2 = "";
      for (var i = 0; i < parts.length; i++) {
        var part = parts[i];
        if (part.startsWith("```") && part.endsWith("```")) {
          var inner = part.slice(3, -3);
          var nlIdx = inner.indexOf("\n");
          var lang = "";
          var code = inner;
          if (nlIdx >= 0) {
            lang = inner.substring(0, nlIdx).trim();
            code = inner.substring(nlIdx + 1);
          }
          html2 += '<pre class="code-block streaming-code"><code>' + code + "</code></pre>";
        } else {
          html2 += part.replace(/\n/g, "<br>");
        }
      }
      return html2;
    }
    var _mdStreamCache = {};
    function splitMdBlocks(text2) {
      var blocks = [];
      var lines = text2.split("\n");
      var cur = [];
      var inFence = false;
      for (var i = 0; i < lines.length; i++) {
        var line = lines[i];
        if (line.replace(/^\s+/, "").slice(0, 3) === "```") {
          cur.push(line);
          inFence = !inFence;
          if (!inFence) {
            blocks.push(cur.join("\n"));
            cur = [];
          }
          continue;
        }
        if (!inFence && line.replace(/^\s+/, "") === "") {
          if (cur.length > 0) {
            blocks.push(cur.join("\n"));
            cur = [];
          }
          continue;
        }
        cur.push(line);
      }
      if (cur.length > 0) blocks.push(cur.join("\n"));
      return blocks.filter(function(b3) {
        return b3.replace(/\s/g, "") !== "";
      });
    }
    function isPlainBlock(text2) {
      if (!text2 || typeof text2 !== "string") return false;
      if (text2.indexOf("\n") !== -1) return false;
      if (/[`*_#>\[\]|~\\]/.test(text2)) return false;
      if (/<[a-zA-Z/]/.test(text2)) return false;
      return true;
    }
    function renderStreamingMarkdownSplit(text2, cacheKey) {
      if (!text2) return { stableHtml: "", activeHtml: "", stableChanged: false, fullHtml: "" };
      if (!cacheKey) {
        _streamingMode = true;
        try {
          var html0 = marked.parse(text2);
          if (typeof DOMPurify !== "undefined") {
            html0 = DOMPurify.sanitize(html0, { ADD_TAGS: ["del", "input"], ADD_ATTR: ["type", "checked", "disabled"] });
          }
          return { stableHtml: "", activeHtml: html0, stableChanged: true, fullHtml: html0 };
        } catch (e) {
          var f3 = "<p>" + esc(text2) + "</p>";
          return { stableHtml: "", activeHtml: f3, stableChanged: true, fullHtml: f3 };
        } finally {
          _streamingMode = false;
        }
      }
      var c3 = _mdStreamCache[cacheKey];
      if (c3 && c3.text === text2) {
        return { stableHtml: c3.stableHtml || "", activeHtml: c3.activeHtml || "", stableChanged: false, fullHtml: c3.fullHtml || "" };
      }
      var blocks = splitMdBlocks(text2);
      if (blocks.length === 0) return { stableHtml: "", activeHtml: "", stableChanged: false, fullHtml: "" };
      var stableBlocks, activeBlock;
      if (blocks.length === 1) {
        stableBlocks = [];
        activeBlock = blocks[0];
      } else {
        stableBlocks = blocks.slice(0, -1);
        activeBlock = blocks[blocks.length - 1];
      }
      var stableText = stableBlocks.join("\n\n");
      var stableChanged = false;
      if (!c3 || c3.stableText !== stableText) {
        _streamingMode = true;
        var sh;
        try {
          sh = stableText ? marked.parse(stableText) : "";
        } catch (e) {
          sh = stableText ? "<p>" + esc(stableText) + "</p>" : "";
        } finally {
          _streamingMode = false;
        }
        if (!cacheKey && typeof DOMPurify !== "undefined" && sh) {
          sh = DOMPurify.sanitize(sh, { ADD_TAGS: ["del", "input"], ADD_ATTR: ["type", "checked", "disabled"] });
        }
        c3 = { stableText, stableHtml: sh };
        _mdStreamCache[cacheKey] = c3;
        stableChanged = true;
      }
      var activeHtml;
      if (isPlainBlock(activeBlock)) {
        activeHtml = "<p>" + esc(activeBlock) + "</p>";
      } else {
        if (window.remend) {
          try {
            activeBlock = window.remend(activeBlock, { linkMode: "text-only" });
          } catch (e) {
          }
        }
        _streamingMode = true;
        try {
          activeHtml = marked.parse(activeBlock);
        } catch (e) {
          activeHtml = "<p>" + esc(activeBlock) + "</p>";
        } finally {
          _streamingMode = false;
        }
      }
      if (!cacheKey && typeof DOMPurify !== "undefined" && activeHtml) {
        activeHtml = DOMPurify.sanitize(activeHtml, { ADD_TAGS: ["del", "input"], ADD_ATTR: ["type", "checked", "disabled"] });
      }
      var full = (c3.stableHtml || "") + activeHtml;
      c3.text = text2;
      c3.fullHtml = full;
      c3.activeHtml = activeHtml;
      return { stableHtml: c3.stableHtml || "", activeHtml, stableChanged, fullHtml: full };
    }
    function renderStreamingMarkdown(text2, cacheKey) {
      return renderStreamingMarkdownSplit(text2, cacheKey).fullHtml;
    }
    function clearStreamingMdCache(cacheKey) {
      if (cacheKey) delete _mdStreamCache[cacheKey];
      else _mdStreamCache = {};
    }
    function scheduleIdleHighlight(container) {
      var scope = container || document;
      var pending = scope.querySelectorAll("code.need-auto-highlight");
      if (pending.length === 0) return;
      var i = 0;
      function processOne(deadline) {
        while (i < pending.length) {
          if (deadline && deadline.timeRemaining && deadline.timeRemaining() <= 0) break;
          var codeEl = pending[i];
          try {
            var text2 = codeEl.textContent;
            var lang = codeEl.dataset.lang;
            if (lang && hljs.getLanguage(lang)) {
              codeEl.innerHTML = hljs.highlight(text2, { language: lang }).value;
            } else {
              codeEl.innerHTML = hljs.highlightAuto(text2).value;
            }
          } catch (e) {
          }
          codeEl.classList.remove("need-auto-highlight");
          i++;
        }
        if (i < pending.length) {
          if (window.requestIdleCallback) window.requestIdleCallback(processOne);
          else setTimeout(function() {
            processOne();
          }, 16);
        }
      }
      if (window.requestIdleCallback) window.requestIdleCallback(processOne);
      else setTimeout(function() {
        processOne();
      }, 16);
    }
    var _mdCache = /* @__PURE__ */ new Map();
    var _MD_CACHE_MAX = 256;
    function renderMarkdown(md) {
      if (!md) return "";
      if (_mdCache.has(md)) return _mdCache.get(md);
      var html2;
      if (isPlainBlock(md)) {
        html2 = "<p>" + esc(md) + "</p>";
      } else {
        try {
          html2 = marked.parse(md);
          if (typeof DOMPurify !== "undefined") {
            html2 = DOMPurify.sanitize(html2, { ADD_TAGS: ["del", "input"], ADD_ATTR: ["type", "checked", "disabled"] });
          }
        } catch (e) {
          html2 = "<p>" + esc(md) + "</p>";
        }
      }
      if (_mdCache.size >= _MD_CACHE_MAX) {
        var firstKey = _mdCache.keys().next().value;
        _mdCache.delete(firstKey);
      }
      _mdCache.set(md, html2);
      return html2;
    }
    window.Hermes.renderMarkdown = renderMarkdown;
    window.Hermes.renderStreamingText = renderStreamingText;
    window.Hermes.renderStreamingMarkdown = renderStreamingMarkdown;
    window.Hermes.renderStreamingMarkdownSplit = renderStreamingMarkdownSplit;
    window.Hermes.clearStreamingMdCache = clearStreamingMdCache;
    window.Hermes.renderAnswerBlock = renderAnswerBlock;
    window.Hermes.scheduleIdleHighlight = scheduleIdleHighlight;
  })();

  // web/chat/js/eventsource-parser.js
  (function(global) {
    "use strict";
    class ParseError extends Error {
      constructor(message, options) {
        super(message);
        this.name = "ParseError";
        this.type = options.type;
        this.field = options.field;
        this.value = options.value;
        this.line = options.line;
      }
    }
    const LF = 10, CR = 13, SPACE = 32;
    function noop2(_arg) {
    }
    function createParser(config) {
      if (typeof config === "function") {
        throw new TypeError(
          "`config` must be an object, got a function instead. Did you mean `createParser({onEvent: fn})`?"
        );
      }
      const { onEvent = noop2, onError = noop2, onRetry = noop2, onComment, maxBufferSize } = config;
      const pendingFragments = [];
      let pendingFragmentsLength = 0, isFirstChunk = true, id, data = "", dataLines = 0, eventType, terminated = false;
      function feed(chunk) {
        if (terminated) {
          throw new Error(
            "Cannot feed parser: it was terminated after exceeding the configured max buffer size. Call `reset()` to resume parsing."
          );
        }
        if (isFirstChunk) {
          isFirstChunk = false;
          if (chunk.charCodeAt(0) === 239 && chunk.charCodeAt(1) === 187 && chunk.charCodeAt(2) === 191) {
            chunk = chunk.slice(3);
          }
        }
        if (pendingFragments.length === 0) {
          const trailing2 = processLines(chunk);
          if (trailing2 !== "") {
            pendingFragments.push(trailing2);
            pendingFragmentsLength = trailing2.length;
          }
          checkBufferSize();
          return;
        }
        if (chunk.indexOf("\n") === -1 && chunk.indexOf("\r") === -1) {
          pendingFragments.push(chunk);
          pendingFragmentsLength += chunk.length;
          checkBufferSize();
          return;
        }
        pendingFragments.push(chunk);
        const input = pendingFragments.join("");
        pendingFragments.length = 0;
        pendingFragmentsLength = 0;
        const trailing = processLines(input);
        if (trailing !== "") {
          pendingFragments.push(trailing);
          pendingFragmentsLength = trailing.length;
        }
        checkBufferSize();
      }
      function checkBufferSize() {
        if (maxBufferSize !== void 0 && pendingFragmentsLength + data.length > maxBufferSize) {
          terminated = true;
          pendingFragments.length = 0;
          pendingFragmentsLength = 0;
          id = void 0;
          data = "";
          dataLines = 0;
          eventType = void 0;
          onError(
            new ParseError(
              `Buffered data exceeded max buffer size of ${maxBufferSize} characters`,
              { type: "max-buffer-size-exceeded" }
            )
          );
        }
      }
      function processLines(chunk) {
        let searchIndex = 0;
        if (chunk.indexOf("\r") === -1) {
          let lfIndex = chunk.indexOf("\n", searchIndex);
          while (lfIndex !== -1) {
            if (searchIndex === lfIndex) {
              dispatchEvent();
              searchIndex = lfIndex + 1;
              lfIndex = chunk.indexOf("\n", searchIndex);
              continue;
            }
            const firstCharCode = chunk.charCodeAt(searchIndex);
            if (isDataPrefix(chunk, searchIndex, firstCharCode)) {
              const valueStart = chunk.charCodeAt(searchIndex + 5) === SPACE ? searchIndex + 6 : searchIndex + 5;
              const value = chunk.slice(valueStart, lfIndex);
              if (dataLines === 0 && chunk.charCodeAt(lfIndex + 1) === LF) {
                onEvent({ id, event: eventType, data: value });
                id = void 0;
                data = "";
                eventType = void 0;
                searchIndex = lfIndex + 2;
                lfIndex = chunk.indexOf("\n", searchIndex);
                continue;
              }
              data = dataLines === 0 ? value : data + "\n" + value;
              dataLines++;
            } else if (isEventPrefix(chunk, searchIndex, firstCharCode)) {
              eventType = chunk.slice(
                chunk.charCodeAt(searchIndex + 6) === SPACE ? searchIndex + 7 : searchIndex + 6,
                lfIndex
              ) || void 0;
            } else {
              parseLine(chunk, searchIndex, lfIndex);
            }
            searchIndex = lfIndex + 1;
            lfIndex = chunk.indexOf("\n", searchIndex);
          }
          return chunk.slice(searchIndex);
        }
        while (searchIndex < chunk.length) {
          const crIndex = chunk.indexOf("\r", searchIndex);
          const lfIndex = chunk.indexOf("\n", searchIndex);
          let lineEnd = -1;
          if (crIndex !== -1 && lfIndex !== -1) {
            lineEnd = crIndex < lfIndex ? crIndex : lfIndex;
          } else if (crIndex !== -1) {
            lineEnd = crIndex === chunk.length - 1 ? -1 : crIndex;
          } else if (lfIndex !== -1) {
            lineEnd = lfIndex;
          }
          if (lineEnd === -1) break;
          parseLine(chunk, searchIndex, lineEnd);
          searchIndex = lineEnd + 1;
          if (chunk.charCodeAt(searchIndex - 1) === CR && chunk.charCodeAt(searchIndex) === LF) {
            searchIndex++;
          }
        }
        return chunk.slice(searchIndex);
      }
      function parseLine(chunk, start, end) {
        if (start === end) {
          dispatchEvent();
          return;
        }
        const firstCharCode = chunk.charCodeAt(start);
        if (isDataPrefix(chunk, start, firstCharCode)) {
          const valueStart = chunk.charCodeAt(start + 5) === SPACE ? start + 6 : start + 5;
          const value2 = chunk.slice(valueStart, end);
          data = dataLines === 0 ? value2 : data + "\n" + value2;
          dataLines++;
          return;
        }
        if (isEventPrefix(chunk, start, firstCharCode)) {
          eventType = chunk.slice(
            chunk.charCodeAt(start + 6) === SPACE ? start + 7 : start + 6,
            end
          ) || void 0;
          return;
        }
        if (firstCharCode === 105 && chunk.charCodeAt(start + 1) === 100 && chunk.charCodeAt(start + 2) === 58) {
          const value2 = chunk.slice(
            chunk.charCodeAt(start + 3) === SPACE ? start + 4 : start + 3,
            end
          );
          id = value2.includes("\0") ? void 0 : value2;
          return;
        }
        if (firstCharCode === 58) {
          if (onComment) {
            const line2 = chunk.slice(start, end);
            onComment(line2.slice(chunk.charCodeAt(start + 1) === SPACE ? 2 : 1));
          }
          return;
        }
        const line = chunk.slice(start, end);
        const fieldSeparatorIndex = line.indexOf(":");
        if (fieldSeparatorIndex === -1) {
          processField(line, "", line);
          return;
        }
        const field = line.slice(0, fieldSeparatorIndex);
        const offset = line.charCodeAt(fieldSeparatorIndex + 1) === SPACE ? 2 : 1;
        const value = line.slice(fieldSeparatorIndex + offset);
        processField(field, value, line);
      }
      function processField(field, value, line) {
        switch (field) {
          case "event":
            eventType = value || void 0;
            break;
          case "data":
            data = dataLines === 0 ? value : data + "\n" + value;
            dataLines++;
            break;
          case "id":
            id = value.includes("\0") ? void 0 : value;
            break;
          case "retry":
            if (/^\d+$/.test(value)) {
              onRetry(parseInt(value, 10));
            } else {
              onError(new ParseError('Invalid `retry` value: "' + value + '"', {
                type: "invalid-retry",
                value,
                line
              }));
            }
            break;
          default:
            onError(new ParseError(
              'Unknown field "' + (field.length > 20 ? field.slice(0, 20) + "\u2026" : field) + '"',
              { type: "unknown-field", field, value, line }
            ));
            break;
        }
      }
      function dispatchEvent() {
        if (dataLines > 0) {
          onEvent({ id, event: eventType, data });
        }
        id = void 0;
        data = "";
        dataLines = 0;
        eventType = void 0;
      }
      function reset(options) {
        options = options || {};
        if (options.consume && pendingFragments.length > 0) {
          const incompleteLine = pendingFragments.join("");
          parseLine(incompleteLine, 0, incompleteLine.length);
        }
        isFirstChunk = true;
        id = void 0;
        data = "";
        dataLines = 0;
        eventType = void 0;
        pendingFragments.length = 0;
        pendingFragmentsLength = 0;
        terminated = false;
      }
      return { feed, reset };
    }
    function isDataPrefix(chunk, i, firstCharCode) {
      return firstCharCode === 100 && chunk.charCodeAt(i + 1) === 97 && chunk.charCodeAt(i + 2) === 116 && chunk.charCodeAt(i + 3) === 97 && chunk.charCodeAt(i + 4) === 58;
    }
    function isEventPrefix(chunk, i, firstCharCode) {
      return firstCharCode === 101 && chunk.charCodeAt(i + 1) === 118 && chunk.charCodeAt(i + 2) === 101 && chunk.charCodeAt(i + 3) === 110 && chunk.charCodeAt(i + 4) === 116 && chunk.charCodeAt(i + 5) === 58;
    }
    global.EventSourceParser = {
      createParser,
      ParseError
    };
  })(typeof window !== "undefined" ? window : void 0);

  // web/chat/js/session.js
  window.Hermes = window.Hermes || {};
  (function() {
    "use strict";
    const $3 = window.Hermes.$;
    const $$ = window.Hermes.$$;
    const esc = window.Hermes.esc;
    const fmtTime = window.Hermes.fmtTime;
    const fmtTokens = window.Hermes.fmtTokens;
    const fmtDuration = window.Hermes.fmtDuration;
    const truncate = window.Hermes.truncate;
    const api = window.Hermes.api;
    function _extractContentText(content) {
      if (!content) return "";
      if (typeof content === "string") return content;
      if (Array.isArray(content)) return content.filter(function(b3) {
        return b3 && b3.type === "text";
      }).map(function(b3) {
        return b3.text || "";
      }).join("");
      try {
        return JSON.stringify(content);
      } catch (e) {
        return String(content);
      }
    }
    function parseToolResult(content) {
      var text2 = _extractContentText(content);
      if (!text2) return { success: false, text: "" };
      try {
        const obj = typeof text2 === "string" ? JSON.parse(text2) : text2;
        return {
          success: obj.success === true || obj.ok === true || obj.error == null && (obj.exit_code === void 0 || obj.exit_code === 0),
          text: obj.error || obj.message || obj.output || text2,
          raw: text2
        };
      } catch (e) {
        if (text2.includes('"error"') || text2.startsWith("Error")) {
          return { success: false, text: text2, raw: text2 };
        }
        return { success: true, text: text2, raw: text2 };
      }
    }
    function formatToolOutput(rawText) {
      if (!rawText) return "";
      let text2 = rawText;
      if (typeof text2 === "object") {
        try {
          text2 = JSON.stringify(text2, null, 2);
        } catch (e) {
          text2 = String(text2);
        }
      }
      if (typeof text2 === "string") {
        const trimmed = text2.trim();
        if (trimmed.startsWith("{") && trimmed.endsWith("}") || trimmed.startsWith("[") && trimmed.endsWith("]")) {
          try {
            const parsed = JSON.parse(text2);
            if (typeof parsed === "object" && parsed !== null) {
              text2 = JSON.stringify(parsed, null, 2);
            }
          } catch (e) {
          }
        }
      }
      if (typeof text2 === "string") {
        text2 = text2.replace(/\\n/g, "\n").replace(/\n{3,}/g, "\n\n");
      }
      text2 = String(text2).trim();
      text2 = text2.split("\n").map((line) => {
        if (line.length > 120 && !line.includes(" ") && !line.includes("	")) {
          return line.replace(/(.{80})/g, "$1\n");
        }
        return line;
      }).join("\n");
      return text2;
    }
    function renderToolCard(tc, toolResult, stepIdx, isActive, noToggle, running, dur) {
      const name = tc.name || tc.function?.name || "unknown";
      const tcId = tc.id || tc.toolCallId || tc.call_id;
      let rawArgs = tc.arguments != null ? tc.arguments : tc.input != null ? tc.input : tc.args != null ? tc.args : tc.function?.arguments;
      let args = "";
      let argsPreview = "";
      try {
        const argsObj = typeof rawArgs === "string" ? JSON.parse(rawArgs) : rawArgs;
        if (argsObj && typeof argsObj === "object") {
          const keys = Object.keys(argsObj);
          argsPreview = keys.slice(0, 2).map((k3) => {
            const v3 = argsObj[k3];
            const vs = typeof v3 === "string" ? v3 : JSON.stringify(v3);
            const vsShort = vs.length > 40 ? vs.substring(0, 40) + "\u2026" : vs;
            return esc(k3) + "=" + esc(vsShort);
          }).join(" ");
          if (keys.length > 2) argsPreview += " +" + (keys.length - 2);
          args = keys.map((k3) => {
            const v3 = argsObj[k3];
            return `<span class="tc-arg-key">${esc(k3)}</span>=<span class="tc-arg-val">${esc(typeof v3 === "string" ? v3 : JSON.stringify(v3))}</span>`;
          }).join(" ");
        } else if (typeof argsObj === "string" && argsObj) {
          args = esc(truncate(argsObj, 60));
          argsPreview = args;
        }
      } catch (e) {
        args = esc(truncate(String(rawArgs || ""), 60));
        argsPreview = args;
      }
      let panelBody = "";
      let statusIcon = "\u26A1";
      let statusClass = "ow-pending";
      let tlClass = "ow-tl-pending";
      if (running) {
        statusIcon = '<div class="ow-spinner"></div>';
        tlClass = "ow-tl-running";
      } else if (toolResult) {
        const parsed = parseToolResult(toolResult.content);
        if (toolResult.isError === true) parsed.success = false;
        statusIcon = parsed.success ? "\u2713" : "\u2717";
        statusClass = parsed.success ? "ow-done" : "ow-fail";
        tlClass = parsed.success ? "ow-tl-done" : "ow-tl-error";
        const bodyText = formatToolOutput(parsed.text || "");
        panelBody = `<div class="ow-ep-b${parsed.success ? "" : " ow-ep-b-fail"}">${esc(bodyText)}</div>`;
      }
      var durBadge = "";
      if (running) {
        if (dur != null && dur > 0) {
          durBadge = '<span class="ow-tl-dur ow-tl-dur-live">' + esc(fmtTimelineDur(dur)) + "</span>";
        }
      } else {
        if (dur != null && dur > 0) {
          durBadge = '<span class="ow-tl-dur">' + esc(fmtTimelineDur(dur)) + "</span>";
        } else if (dur === null) {
          durBadge = '<span class="ow-tl-dur ow-tl-dur-unknown">\u2026</span>';
        }
      }
      var errMark = !running && toolResult && statusClass === "ow-fail" ? '<span class="ow-tl-err">\u2717</span>' : "";
      const item = `<div class="ow-tl-item ${tlClass}" data-action="toggle-ow-tl">
        <span class="ow-tl-name">${esc(name)}</span>
        ${argsPreview ? '<span class="ow-tl-args">' + argsPreview + "</span>" : ""}
        ${durBadge}${errMark}
        <span class="ow-tl-stat">${statusIcon}</span>
      </div>`;
      const panel = `<div class="ow-ep">
        <div class="ow-ep-h"><span style="color:${statusClass === "ow-done" ? "var(--accent2)" : statusClass === "ow-fail" ? "var(--danger)" : "var(--text-weaker)"}">${running ? "\u23F3" : statusIcon}</span><span class="ow-ep-name">${esc(name)}</span>${argsPreview ? '<span class="ow-ep-meta">' + argsPreview + "</span>" : ""}${durBadge}</div>
        ${args ? '<div class="ow-pill-args-full">' + args + "</div>" : ""}
        ${panelBody}
      </div>`;
      return { item, panel };
    }
    function renderNoteItem(text2) {
      if (!text2 || !text2.trim()) return null;
      const trimmed = text2.trim();
      const preview = trimmed.substring(0, 50) + (trimmed.length > 50 ? "\u2026" : "");
      const item = `<div class="ow-tl-item ow-tl-note" data-action="toggle-ow-tl">
        <span class="ow-note-name">\u8BF4\u660E</span>
        <span class="ow-note-preview">${esc(preview)}</span>
      </div>`;
      const panel = `<div class="ow-ep">
        <div class="ow-ep-h"><span style="color:var(--text-weaker)">\u{1F4DD}</span><span class="ow-ep-name" style="color:var(--text-weaker)">\u8BF4\u660E</span></div>
        <div class="ow-ep-b ow-ep-b-md">${window.Hermes.renderMarkdown(text2)}</div>
      </div>`;
      return { item, panel };
    }
    function renderThinkingItem(reasoning, isActive, dur) {
      if (!reasoning || !reasoning.trim()) return null;
      const trimmed = reasoning.trim();
      const preview = trimmed.substring(0, 50) + (trimmed.length > 50 ? "\u2026" : "");
      const tlClass = isActive ? "ow-tl-think-running" : "ow-tl-think";
      var durBadge = !isActive && dur != null && dur > 0 ? '<span class="ow-tl-dur ow-tl-dur-think">' + esc(fmtTimelineDur(dur)) + "</span>" : "";
      const item = `<div class="ow-tl-item ${tlClass}" data-action="toggle-ow-tl">
        <span class="ow-think-name">\u601D\u8003</span>
        <span class="ow-think-preview">${esc(preview)}</span>
        ${durBadge}
        <span class="ow-think-stat">${isActive ? '<div class="ow-spinner"></div>' : ""}</span>
      </div>`;
      const panel = `<div class="ow-ep">
        <div class="ow-ep-h"><span style="color:#af52de">\u{1F4AD}</span><span class="ow-ep-name" style="color:#af52de">\u601D\u8003\u8FC7\u7A0B</span></div>
        <div class="ow-ep-b ow-ep-b-md">${window.Hermes.renderMarkdown(reasoning)}</div>
      </div>`;
      return { item, panel };
    }
    function renderThinkingMarginBlock(reasoning) {
      if (!reasoning || !reasoning.trim()) return "";
      var trimmed = reasoning.trim();
      var header = '<div class="tm-header"><span class="tm-icon">\u{1F4AD}</span><span class="tm-label">\u601D\u8003\u4E2D</span><span class="ow-spinner tm-spin"></span></div>';
      return '<div class="tm-block tm-active">' + header + '<div class="tm-body">' + window.Hermes.renderStreamingMarkdown(trimmed, "tm") + "</div></div>";
    }
    function renderThinkingMargin(turn, isStreaming) {
      if (!isStreaming) return "";
      var blocks = [];
      (turn.steps || []).forEach(function(step) {
        if (step.streaming) {
          var sm = step.streaming;
          if (sm.reasoning && sm.reasoning.trim()) {
            var hasContent = !!(sm.content && sm.content.trim());
            var hasTools = sm._toolSteps && sm._toolSteps.length > 0;
            if (!hasContent && !hasTools) blocks.push(sm.reasoning);
          }
        }
      });
      if (!blocks.length) return "";
      var inner = blocks.map(function(r) {
        return renderThinkingMarginBlock(r);
      }).join("");
      return '<div class="turn-margin">' + inner + "</div>";
    }
    function renderThinkingBlock(reasoning, isActive, noToggle) {
      if (!reasoning || !reasoning.trim()) return "";
      if (noToggle) {
        return `<div class="thinking-block"><div class="thinking-body">${window.Hermes.renderMarkdown(reasoning)}</div></div>`;
      }
      const initState = isActive ? "" : " thinking-collapsed";
      return `
      <div class="thinking-block${initState}">
        <div class="thinking-header" data-action="toggle-thinking">
          <span class="thinking-icon">\u{1F4AD}</span>
          <span class="thinking-label">\u601D\u8003\u8FC7\u7A0B</span>
          <span class="thinking-toggle"></span>
        </div>
        <div class="thinking-body">${window.Hermes.renderMarkdown(reasoning)}</div>
      </div>`;
    }
    function extractAssistantParts(a) {
      var text2 = "", reasoning = "", toolCalls = [];
      if (Array.isArray(a.content)) {
        var tParts = [], rParts = [];
        a.content.forEach(function(b3) {
          if (!b3 || typeof b3 !== "object") return;
          if (b3.type === "text" && b3.text) tParts.push(b3.text);
          else if (b3.type === "thinking" && b3.text) rParts.push(b3.text);
          else if (b3.type === "toolCall") toolCalls.push({ name: b3.name, arguments: b3.arguments, id: b3.id });
        });
        text2 = tParts.join("");
        reasoning = rParts.join("");
      } else if (typeof a.content === "string") {
        text2 = a.content;
        reasoning = a.reasoning || "";
        if (a.tool_calls) {
          try {
            var raw = typeof a.tool_calls === "string" ? JSON.parse(a.tool_calls) : a.tool_calls;
            toolCalls = (raw || []).map(function(tc) {
              return { name: tc.function?.name, arguments: tc.function?.arguments, id: tc.id || tc.call_id };
            });
          } catch (e) {
            toolCalls = [];
          }
        }
        if (!toolCalls.length && a._toolSteps && a._toolSteps.length > 0) {
          toolCalls = a._toolSteps.map(function(ts) {
            return { name: ts.name, arguments: ts.args, id: ts.toolCallId };
          });
        }
      }
      return { text: text2, reasoning, toolCalls };
    }
    function groupIntoTurns(messages) {
      const turns = [];
      let i = 0;
      while (i < messages.length) {
        const m3 = messages[i];
        if (m3.role === "user") {
          var _userContent = typeof m3.content === "string" ? m3.content : _extractContentText(m3.content);
          const turn = { type: "user", user: Object.assign({}, m3, { content: _userContent }), steps: [] };
          i++;
          while (i < messages.length && messages[i].role !== "user") {
            const a = messages[i];
            if (a.role === "assistant" && a._streaming) {
              turn.steps.push({ streaming: a });
              i++;
            } else if (a.role === "assistant" && a._aborted) {
              var abParts = extractAssistantParts(a);
              turn.steps.push({ assistant: Object.assign({}, a, { content: abParts.text, reasoning: abParts.reasoning }), toolCalls: null, toolResults: [], hasMore: false });
              i++;
            } else if (a.role === "assistant") {
              var parts = extractAssistantParts(a);
              var normA = Object.assign({}, a, { content: parts.text, reasoning: parts.reasoning });
              if (parts.toolCalls.length > 0) {
                const step = { assistant: normA, toolCalls: parts.toolCalls, toolResults: [], hasMore: true };
                i++;
                while (i < messages.length && (messages[i].role === "toolResult" || messages[i].role === "tool")) {
                  step.toolResults.push(messages[i]);
                  i++;
                }
                if (i < messages.length && messages[i].role === "assistant") {
                  var nextParts = extractAssistantParts(messages[i]);
                  if (nextParts.toolCalls.length > 0) {
                    turn.steps.push(step);
                    continue;
                  }
                }
                turn.steps.push(step);
              } else {
                turn.steps.push({ assistant: normA, toolCalls: null, toolResults: [], hasMore: false });
                i++;
              }
            } else if (a.role === "system") {
              turn.steps.push({ system: a });
              i++;
            } else {
              turn.steps.push({ orphan: a });
              i++;
            }
          }
          turns.push(turn);
        } else if (m3.role === "system" && m3._compactionHtml) {
          turns.push({ type: "other", message: m3 });
          i++;
          while (i < messages.length && messages[i].role !== "user") i++;
        } else if (m3.role === "compactionSummary") {
          var _csHtml = '<div class="compaction-result"><div class="compaction-head">\u2702\uFE0F \u4E0A\u4E0B\u6587\u5DF2\u538B\u7F29</div>' + (m3.summary ? '<details class="compaction-summary"><summary>\u67E5\u770B\u538B\u7F29\u6458\u8981</summary><div class="compaction-summary-body">' + esc(m3.summary) + "</div></details>" : "") + "</div>";
          turns.push({ type: "other", message: { role: "system", _compactionHtml: _csHtml, _isCompaction: true } });
          i++;
          while (i < messages.length && messages[i].role !== "user") i++;
        } else {
          turns.push({ type: "other", message: m3 });
          i++;
        }
      }
      return turns;
    }
    function renderStreamingStepsHTML(streamingMsg) {
      var turn = { steps: [{ streaming: streamingMsg }] };
      return renderTurnStepsHTML(turn);
    }
    function getToolEmoji(name) {
      if (!name) return "\u{1F6E0}";
      var n = String(name).toLowerCase();
      if (n.indexOf("read") >= 0 || n === "cat" || n === "ls" || n.indexOf("view") >= 0 || n.indexOf("type") >= 0) return "\u{1F4C1}";
      if (n.indexOf("bash") >= 0 || n.indexOf("sh") >= 0 || n.indexOf("exec") >= 0 || n.indexOf("run") >= 0 || n.indexOf("command") >= 0) return "\u26A1";
      if (n.indexOf("edit") >= 0 || n.indexOf("write") >= 0 || n.indexOf("patch") >= 0 || n.indexOf("apply") >= 0 || n.indexOf("create") >= 0) return "\u270F\uFE0F";
      if (n.indexOf("grep") >= 0 || n.indexOf("glob") >= 0 || n.indexOf("search") >= 0 || n.indexOf("find") >= 0) return "\u{1F50D}";
      if (n.indexOf("todo") >= 0 || n.indexOf("task") >= 0) return "\u{1F4CB}";
      if (n.indexOf("web") >= 0 || n.indexOf("fetch") >= 0 || n.indexOf("curl") >= 0) return "\u{1F310}";
      return "\u{1F6E0}";
    }
    function fmtTimelineDur(s) {
      if (s == null || s <= 0) return "";
      if (s < 60) return parseFloat(s.toFixed(1)) + "s";
      var m3 = Math.floor(s / 60);
      var sec = Math.round(s % 60);
      return m3 + "m" + (sec > 0 ? sec + "s" : "");
    }
    function computeStepDurations(turn) {
      var steps = turn.steps || [];
      var prevTs = turn.user ? turn.user.timestamp : null;
      var result = { toolDurs: {}, thinkDurs: [], answerDur: null, totalDur: null };
      var finalStep = null;
      var toolSteps = [];
      steps.forEach(function(step) {
        if (step.system || step.orphan || step.streaming) return;
        var hasTools = step.toolCalls && step.toolCalls.length > 0;
        var ac = step.assistant ? step.assistant.content || "" : "";
        if (hasTools) toolSteps.push(step);
        else if (ac) finalStep = step;
        else if (step.assistant && step.assistant.reasoning) toolSteps.push(step);
      });
      var firstTs = null, lastTs = null;
      if (turn.user && turn.user.timestamp) firstTs = turn.user.timestamp;
      toolSteps.forEach(function(step) {
        var a2 = step.assistant;
        if (!a2) return;
        if (a2.reasoning && String(a2.reasoning).trim()) {
          var thinkDur = prevTs != null && a2.timestamp ? a2.timestamp - prevTs : null;
          result.thinkDurs.push(thinkDur);
          if (a2.timestamp) {
            prevTs = a2.timestamp;
            lastTs = a2.timestamp;
          }
        }
        if (step.toolCalls && step.toolCalls.length > 0) {
          var resultMap = {};
          if (step.toolResults) step.toolResults.forEach(function(r) {
            var cid = r.toolCallId || r.tool_call_id;
            if (cid) resultMap[cid] = r;
          });
          step.toolCalls.forEach(function(tc, idx) {
            var callId = tc.id || tc.toolCallId || tc.call_id;
            var res = resultMap[callId] || (step.toolResults ? step.toolResults[idx] : null) || null;
            var toolDur = res && res.timestamp && a2.timestamp ? res.timestamp - a2.timestamp : null;
            result.toolDurs[callId] = toolDur;
            if (res && res.timestamp) {
              prevTs = res.timestamp;
              lastTs = res.timestamp;
            } else if (a2.timestamp) {
              prevTs = a2.timestamp;
              lastTs = a2.timestamp;
            }
          });
        }
      });
      if (finalStep && finalStep.assistant) {
        var a = finalStep.assistant;
        if (a.reasoning && String(a.reasoning).trim()) {
          var td = prevTs != null && a.timestamp ? a.timestamp - prevTs : null;
          result.thinkDurs.push(td);
          if (a.timestamp) {
            prevTs = a.timestamp;
            lastTs = a.timestamp;
          }
        }
        if (a.content && String(a.content).trim()) {
          result.answerDur = prevTs != null && a.timestamp ? a.timestamp - prevTs : null;
          if (a.timestamp) lastTs = a.timestamp;
        }
      }
      if (firstTs != null && lastTs != null && lastTs > firstTs) {
        result.totalDur = lastTs - firstTs;
      }
      return result;
    }
    function renderTurnStepsHTML(turn) {
      let html2 = "";
      const streamingStep = turn.steps.find((s) => s.streaming);
      var steps;
      var isStreaming = false;
      var stFlags = {};
      if (streamingStep) {
        var sm = streamingStep.streaming;
        isStreaming = true;
        steps = [];
        stFlags.runningSet = {};
        stFlags.hasContent = !!(sm.content && sm.content.trim());
        stFlags.hasReasoning = !!(sm.reasoning && sm.reasoning.trim());
        stFlags.usage = sm._usage || null;
        stFlags.aborted = !!sm._aborted;
        if (sm._toolSteps && sm._toolSteps.length > 0) {
          var toolCalls = sm._toolSteps.map(function(ts, idx) {
            return { name: ts.name || "unknown", arguments: ts.args, id: ts.toolCallId || "call_stream_" + idx };
          });
          var toolResults = [];
          stFlags.toolTimes = {};
          sm._toolSteps.forEach(function(ts, idx) {
            var tcId = ts.toolCallId || "call_stream_" + idx;
            if (ts.result !== void 0 && ts.result !== null && ts.result !== "") {
              toolResults.push({ role: "toolResult", toolCallId: tcId, content: typeof ts.result === "string" ? ts.result : JSON.stringify(ts.result), isError: !!ts.error });
            }
            if (ts.running) stFlags.runningSet[tcId] = true;
            stFlags.toolTimes[tcId] = {
              startTime: ts.startTime || null,
              endTime: ts.endTime || null,
              running: !!ts.running
            };
          });
          steps.push({
            assistant: { reasoning: sm.reasoning || "", content: "", timestamp: sm.timestamp },
            toolCalls,
            toolResults,
            hasMore: stFlags.hasContent
          });
        }
        if (stFlags.hasContent) {
          var finalReasoning = sm._toolSteps && sm._toolSteps.length > 0 ? "" : sm.reasoning || "";
          steps.push({
            assistant: { content: sm.content, reasoning: finalReasoning, timestamp: sm.timestamp },
            toolCalls: null,
            toolResults: [],
            hasMore: false
          });
        } else if (!sm._toolSteps || sm._toolSteps.length === 0) {
          if (stFlags.hasReasoning) {
            steps.push({
              assistant: { reasoning: sm.reasoning, content: "", timestamp: sm.timestamp },
              toolCalls: null,
              toolResults: [],
              hasMore: false,
              _reasoningActive: true
            });
          }
        }
        if (sm._approval && !sm._approvalResolved) {
          var a = sm._approval;
          var runId = esc(a.run_id || "");
          var cmdPreview = esc((a.command || "").substring(0, 300));
          var desc = esc(a.description || "");
          var choices = a.choices || ["once", "deny"];
          html2 += '<div class="approval-card" data-run-id="' + runId + '">';
          html2 += '<div class="approval-card-header">\u26A0\uFE0F \u547D\u4EE4\u6267\u884C\u9700\u8981\u5BA1\u6279</div>';
          html2 += '<div class="approval-card-body">';
          html2 += '<div class="approval-card-desc">' + desc + "</div>";
          if (cmdPreview) html2 += '<pre class="approval-card-cmd">' + cmdPreview + "</pre>";
          html2 += '</div><div class="approval-card-actions">';
          if (choices.includes("once")) html2 += '<button class="approval-btn approval-btn-once" data-choice="once">\u2705 \u5141\u8BB8\u672C\u6B21</button>';
          if (choices.includes("session")) html2 += '<button class="approval-btn approval-btn-session" data-choice="session">\u2705 \u672C\u6B21\u4F1A\u8BDD</button>';
          if (choices.includes("always")) html2 += '<button class="approval-btn approval-btn-always" data-choice="always">\u{1F512} \u6C38\u4E45\u5141\u8BB8</button>';
          if (choices.includes("deny")) html2 += '<button class="approval-btn approval-btn-deny" data-choice="deny">\u274C \u62D2\u7EDD</button>';
          html2 += "</div></div>";
        }
        if (sm._subagents && sm._subagents.length > 0) {
          html2 += '<div class="streaming-subagents">';
          sm._subagents.forEach(function(sa) {
            var si = sa.status === "running" ? "\u23F3" : sa.status === "failed" ? "\u2717" : "\u2713";
            var sc = sa.status === "running" ? "subagent-running" : sa.status === "failed" ? "subagent-failed" : "subagent-done";
            var gs = sa.goal.length > 120 ? sa.goal.substring(0, 120) + "\u2026" : sa.goal;
            var dl = "";
            if (sa.startedAt) {
              var d2 = ((sa.completedAt || Date.now()) - sa.startedAt) / 1e3;
              if (d2 >= 1) dl = " \xB7 " + (d2 < 60 ? d2.toFixed(0) + "s" : Math.floor(d2 / 60) + "m" + Math.floor(d2 % 60) + "s");
            }
            html2 += '<div class="subagent-step ' + sc + '"><div class="subagent-header">';
            html2 += '<span class="subagent-icon">\u{1F916}</span>';
            html2 += '<span class="subagent-goal">' + esc(gs) + "</span>";
            html2 += '<span class="subagent-status">' + si + "</span></div>";
            if (sa.summary) {
              var ss = sa.summary.length > 200 ? sa.summary.substring(0, 200) + "\u2026" : sa.summary;
              html2 += '<div class="subagent-summary">' + esc(ss) + esc(dl) + "</div>";
            }
            html2 += "</div>";
          });
          html2 += "</div>";
        }
        if (steps.length === 0 && sm._streaming) {
          html2 += '<div class="step step-final streaming-content">';
          html2 += '<div class="step-header"><span class="ow-spinner"></span><span class="step-label">\u601D\u8003\u4E2D</span></div>';
          html2 += "</div>";
          return html2;
        }
      } else {
        steps = turn.steps;
      }
      steps.forEach((step) => {
        if (step.system) {
          if (step.system._compactionHtml) {
            html2 += '<div class="step system-step compaction-step">' + step.system._compactionHtml + "</div>";
          } else {
            var _scls = step.system._isCompaction ? "step system-step compaction-step" : "step system-step";
            html2 += '<div class="' + _scls + '"><div class="step-content msg-system">' + esc(step.system.content || "") + "</div></div>";
          }
        }
        if (step.orphan) {
          html2 += '<div class="step"><div class="step-content msg-tool">' + esc(step.orphan.content || "") + "</div></div>";
        }
      });
      let finalStep = null;
      const toolSteps = [];
      steps.forEach((step) => {
        if (step.system || step.orphan) return;
        const hasTools = step.toolCalls && step.toolCalls.length > 0;
        const assistantContent = step.assistant?.content || "";
        if (hasTools) {
          toolSteps.push(step);
        } else if (assistantContent) {
          finalStep = step;
        } else if (step.assistant?.reasoning) {
          toolSteps.push(step);
        }
      });
      const itemsArr = [];
      const panelsArr = [];
      var stepDurs = isStreaming ? null : computeStepDurations(turn);
      if (isStreaming && stFlags.toolTimes) {
        stepDurs = { toolDurs: {}, thinkDurs: [], answerDur: null, totalDur: null };
        Object.keys(stFlags.toolTimes).forEach(function(cid) {
          var tt2 = stFlags.toolTimes[cid];
          if (tt2.running) {
            stepDurs.toolDurs[cid] = (Date.now() - (tt2.startTime || 0)) / 1e3;
          } else if (tt2.endTime && tt2.startTime) {
            stepDurs.toolDurs[cid] = (tt2.endTime - tt2.startTime) / 1e3;
          } else if (tt2.startTime) {
            stepDurs.toolDurs[cid] = null;
          }
        });
      }
      var thinkDurIdx = 0;
      toolSteps.forEach((step, ti) => {
        const assistantContent = step.assistant?.content || "";
        const hasTools = step.toolCalls && step.toolCalls.length > 0;
        const isJustTrigger = hasTools && (!assistantContent || assistantContent.length < 50);
        if (step.assistant?.reasoning) {
          var rActive = isStreaming && !!step._reasoningActive;
          var thinkDur = stepDurs ? stepDurs.thinkDurs[thinkDurIdx] || null : null;
          thinkDurIdx++;
          const thinkItem = renderThinkingItem(step.assistant.reasoning, rActive, thinkDur);
          if (thinkItem) {
            itemsArr.push(thinkItem.item);
            panelsArr.push(thinkItem.panel);
          }
        }
        if (!isJustTrigger && assistantContent) {
          const noteItem = renderNoteItem(assistantContent);
          if (noteItem) {
            itemsArr.push(noteItem.item);
            panelsArr.push(noteItem.panel);
          }
        }
        const callIdMap = {};
        if (step.toolResults) step.toolResults.forEach((r) => {
          if (r.toolCallId || r.tool_call_id) callIdMap[r.toolCallId || r.tool_call_id] = r;
        });
        if (step.toolCalls) step.toolCalls.forEach((tc) => {
          const callId = tc.id || tc.toolCallId || tc.call_id;
          const result = callIdMap[callId] || null;
          const isRunning = isStreaming && stFlags.runningSet && stFlags.runningSet[callId];
          var toolDur = stepDurs ? stepDurs.toolDurs[callId] != null ? stepDurs.toolDurs[callId] : null : null;
          const card = renderToolCard(tc, result, ti + 1, !isRunning, false, isRunning, toolDur);
          itemsArr.push(card.item);
          panelsArr.push(card.panel);
        });
      });
      if (finalStep && finalStep.assistant?.reasoning) {
        var thinkDur2 = stepDurs ? stepDurs.thinkDurs[thinkDurIdx] || null : null;
        const thinkItem = renderThinkingItem(finalStep.assistant.reasoning, false, thinkDur2);
        if (thinkItem) {
          itemsArr.push(thinkItem.item);
          panelsArr.push(thinkItem.panel);
        }
      }
      if (itemsArr.length > 0) {
        var tlClass = "ow-tl";
        if (isStreaming) tlClass += " ow-tl-streaming ow-tl-scroll";
        else if (itemsArr.length > 5) tlClass += " ow-tl-scroll";
        html2 += '<div class="ow-tools">';
        html2 += '<div class="' + tlClass + '">' + itemsArr.join("") + "</div>";
        html2 += '<div class="ow-panels">' + panelsArr.join("") + "</div>";
        html2 += "</div>";
      }
      if (finalStep) {
        const assistantContent = finalStep.assistant?.content || "";
        if (isStreaming) {
          var stepClass = "step step-final streaming-content";
          if (stFlags.aborted) stepClass += " _aborted";
          html2 += '<div class="' + stepClass + '">';
          html2 += '<div class="step-header"><span class="step-num step-num-final">\u2726</span><span class="step-label">\u56DE\u590D\u4E2D</span></div>';
          var _sfSplit = window.Hermes.renderStreamingMarkdownSplit(assistantContent, "sf");
          html2 += '<div class="step-answer-wrap"><div class="step-answer collapsible"><div class="md-stable">' + _sfSplit.stableHtml + '</div><div class="md-active">' + _sfSplit.activeHtml + "</div></div></div>";
          if (stFlags.usage && (stFlags.usage.total_tokens || stFlags.usage.prompt_tokens)) {
            var u2 = stFlags.usage;
            var tokInfo = "";
            if (u2.prompt_tokens) tokInfo += fmtTokens(u2.prompt_tokens) + " in";
            if (u2.completion_tokens) tokInfo += (tokInfo ? " \xB7 " : "") + fmtTokens(u2.completion_tokens) + " out";
            if (u2.total_tokens) tokInfo += (tokInfo ? " \xB7 " : "") + fmtTokens(u2.total_tokens) + " total";
            html2 += '<div class="step-usage">\u{1F4CA} ' + esc(tokInfo) + "</div>";
          }
          html2 += "</div>";
        } else {
          const agentTime = finalStep.assistant?.timestamp_fmt || fmtTime(finalStep.assistant?.timestamp);
          var totalBadge = stepDurs && stepDurs.totalDur != null && stepDurs.totalDur > 0 ? '<span class="step-total-dur">\u603B\u8BA1 ' + esc(fmtTimelineDur(stepDurs.totalDur)) + "</span>" : "";
          html2 += '<div class="step step-final">';
          html2 += '<div class="step-header"><span class="step-num step-num-final">\u2726</span><span class="step-label">\u56DE\u590D</span><span class="step-time">' + esc(agentTime) + "</span>" + totalBadge + "</div>";
          html2 += window.Hermes.renderAnswerBlock(assistantContent);
          html2 += "</div>";
        }
      }
      return html2;
    }
    function renderSingleTurnHTML(turn) {
      if (turn.type === "other") {
        const m3 = turn.message;
        if (m3._compactionHtml) {
          return `<div class="turn"><div class="step system-step compaction-step">${m3._compactionHtml}</div></div>`;
        }
        return `<div class="msg-bubble msg-${m3.role}"><div class="msg-content">${esc(_extractContentText(m3.content) || "")}</div></div>`;
      }
      const userId = turn.user.id || "";
      const userTime = turn.user.timestamp_fmt || fmtTime(turn.user.timestamp);
      const isStreamingTurn = turn.steps.some((s) => s.streaming);
      let html2 = `<div class="turn" data-msg-id="${esc(String(userId))}"${isStreamingTurn ? ' data-streaming="true"' : ""}>
      <div class="turn-user">
        <div class="turn-user-content">${window.Hermes.renderMarkdown(turn.user.content || "")}</div>
        <div class="turn-avatar user-avatar">U</div>
      </div>
      <div class="turn-time turn-time-user">${esc(userTime)}<span class="turn-actions"><button class="turn-edit-btn" data-msg-id="${esc(String(userId))}" title="\u7F16\u8F91\u91CD\u53D1">\u270E</button></span></div>`;
      if (turn.steps.length > 0) {
        html2 += `<div class="turn-agent">
        <div class="turn-avatar agent-avatar">H</div>
        <div class="turn-agent-body">
          <div class="turn-steps">
            ${renderTurnStepsHTML(turn)}
          </div>
        </div>
        ${renderThinkingMargin(turn, isStreamingTurn)}
      </div>`;
      }
      html2 += `</div>`;
      return html2;
    }
    function renderMessages(messages, container) {
      const turns = groupIntoTurns(messages);
      let html2 = "";
      turns.forEach((turn) => {
        html2 += renderSingleTurnHTML(turn);
      });
      const expandStates = {};
      container.querySelectorAll(".turn").forEach((turnEl) => {
        const msgId = turnEl.dataset.msgId;
        if (!msgId) return;
        const answer = turnEl.querySelector(".step-answer");
        if (answer && !answer.classList.contains("collapsed")) {
          expandStates[msgId + ":answer"] = true;
        }
        const tc = turnEl.querySelector(".tools-collapse");
        if (tc && !tc.classList.contains("tools-collapsed")) {
          expandStates[msgId + ":tools"] = true;
        }
      });
      container.innerHTML = html2;
      window.Hermes.initCollapsible(container);
      Object.keys(expandStates).forEach((key) => {
        const msgId = key.replace(/:(answer|tools)$/, "");
        const type = key.match(/:(answer|tools)$/)?.[1];
        const turnEl = container.querySelector(`.turn[data-msg-id="${msgId}"]`);
        if (!turnEl) return;
        if (type === "answer") {
          const answer = turnEl.querySelector(".step-answer");
          if (answer) answer.classList.remove("collapsed");
          const btn = turnEl.querySelector(".collapse-btn");
          if (btn) {
            btn.classList.add("expanded");
            const lbl = btn.querySelector(".label");
            if (lbl) lbl.textContent = "\u6536\u8D77";
          }
        }
        if (type === "tools") {
          const tc = turnEl.querySelector(".tools-collapse");
          if (tc) tc.classList.remove("tools-collapsed");
        }
      });
    }
    var _confirmDlg = null;
    function asyncConfirm(message, title) {
      return new Promise(function(resolve) {
        if (!_confirmDlg) {
          _confirmDlg = document.createElement("div");
          _confirmDlg.className = "confirm-overlay";
          _confirmDlg.innerHTML = '<div class="confirm-dialog"><div class="confirm-title"></div><div class="confirm-msg"></div><div class="confirm-actions"><button class="confirm-btn confirm-cancel">\u53D6\u6D88</button><button class="confirm-btn confirm-ok">\u786E\u8BA4</button></div></div>';
          document.body.appendChild(_confirmDlg);
        }
        _confirmDlg.querySelector(".confirm-title").textContent = title || "\u786E\u8BA4\u64CD\u4F5C";
        _confirmDlg.querySelector(".confirm-msg").textContent = message;
        _confirmDlg.classList.add("confirm-visible");
        var okBtn = _confirmDlg.querySelector(".confirm-ok");
        var cancelBtn = _confirmDlg.querySelector(".confirm-cancel");
        var resolved = false;
        function cleanup(result) {
          if (resolved) return;
          resolved = true;
          _confirmDlg.classList.remove("confirm-visible");
          okBtn.onclick = null;
          cancelBtn.onclick = null;
          _confirmDlg.onclick = null;
          resolve(result);
        }
        okBtn.onclick = function() {
          cleanup(true);
        };
        cancelBtn.onclick = function() {
          cleanup(false);
        };
        _confirmDlg.onclick = function(e) {
          if (e.target === _confirmDlg) cleanup(false);
        };
      });
    }
    async function deleteMessageRound(msgId) {
      const sessionId = window.Hermes.state.focusedSessionId;
      if (!sessionId || !msgId) return;
      if (!await asyncConfirm("\u786E\u5B9A\u5220\u9664\u6B64\u8F6E\u5BF9\u8BDD\uFF1F\u5C06\u540C\u65F6\u5220\u9664\u5173\u8054\u7684\u52A9\u624B\u56DE\u590D\u548C\u5DE5\u5177\u8C03\u7528\uFF0C\u4E0D\u53EF\u6062\u590D\u3002")) return;
      try {
        if (window.Hermes.hasActiveStream(sessionId)) {
          window.Hermes.abortStream(sessionId);
        }
        await api("/sessions/" + sessionId + "/messages/" + msgId, { method: "DELETE" });
        window.Hermes.markStale(sessionId);
        await window.Hermes.loadMessagesFromAPI(sessionId);
        if (window.Hermes.state.focusedSessionId === sessionId) {
          if (window.Hermes.state.viewMode === "chat") {
            window.Hermes.renderCurrentChat();
          } else {
            const msgs = window.Hermes.getMsgs(sessionId);
            if (msgs) renderMessages(msgs, window.Hermes.dom.messageList);
          }
        }
      } catch (e) {
        window.Hermes.toast("\u5220\u9664\u5931\u8D25: " + e.message, true);
      }
    }
    let _ctxMenu = null;
    function _createContextMenu() {
      if (_ctxMenu) return _ctxMenu;
      _ctxMenu = document.createElement("div");
      _ctxMenu.className = "ctx-menu";
      _ctxMenu.innerHTML = '<div class="ctx-menu-item" data-ctx="copy-text">\u{1F4CB} \u590D\u5236\u6587\u672C</div><div class="ctx-menu-item" data-ctx="edit-resend">\u270E \u7F16\u8F91\u91CD\u53D1</div><div class="ctx-menu-item" data-ctx="export-turn">\u{1F4E4} \u5BFC\u51FA\u6B64\u8F6E</div><div class="ctx-menu-sep"></div><div class="ctx-menu-item ctx-menu-danger" data-ctx="delete-turn">\u{1F5D1} \u5220\u9664\u6B64\u8F6E\u5BF9\u8BDD</div>';
      document.body.appendChild(_ctxMenu);
      _ctxMenu.addEventListener("click", function(e) {
        const item = e.target.closest("[data-ctx]");
        if (!item) return;
        const action = item.dataset.ctx;
        const msgId = _ctxMenu.dataset.msgId;
        const turnEl = _ctxMenu._turnEl;
        hideContextMenu();
        if (!msgId) return;
        if (action === "delete-turn") {
          deleteMessageRound(msgId);
        } else if (action === "copy-text") {
          _copyTurnText(turnEl);
        } else if (action === "edit-resend") {
          _editResendTurn(turnEl, msgId);
        } else if (action === "export-turn") {
          _exportSingleTurn(turnEl, msgId);
        }
      });
      return _ctxMenu;
    }
    function _copyTurnText(turnEl) {
      if (!turnEl) return;
      var text2 = "";
      var userEl = turnEl.querySelector(".turn-user-content");
      var agentEl = turnEl.querySelector(".turn-agent-body") || turnEl.querySelector(".step-answer");
      if (userEl) text2 += "\u{1F464} " + (userEl.innerText || userEl.textContent) + "\n\n";
      if (agentEl) text2 += "\u{1F916} " + (agentEl.innerText || agentEl.textContent);
      navigator.clipboard.writeText(text2).then(function() {
        window.Hermes.toast("\u5DF2\u590D\u5236\u5230\u526A\u8D34\u677F");
      }).catch(function() {
        window.Hermes.toast("\u590D\u5236\u5931\u8D25", true);
      });
    }
    function _editResendTurn(turnEl, msgId) {
      if (!turnEl) return;
      var userEl = turnEl.querySelector(".turn-user-content");
      var text2 = userEl ? userEl.innerText || userEl.textContent : "";
      var dom = window.Hermes.dom;
      if (dom && dom.chatInput) {
        dom.chatInput.value = text2;
        dom.chatInput.focus();
        dom.chatInput.style.height = "auto";
        dom.chatInput.style.height = Math.min(dom.chatInput.scrollHeight, 200) + "px";
      }
    }
    function _exportSingleTurn(turnEl, msgId) {
      if (!turnEl) return;
      var userEl = turnEl.querySelector(".turn-user-content");
      var agentEl = turnEl.querySelector(".turn-agent-body") || turnEl.querySelector(".step-answer");
      var text2 = "# \u5BF9\u8BDD\u7247\u6BB5\n\n";
      if (userEl) text2 += "### \u{1F464} \u7528\u6237\n\n" + (userEl.innerText || userEl.textContent) + "\n\n";
      if (agentEl) text2 += "### \u{1F916} \u52A9\u624B\n\n" + (agentEl.innerText || agentEl.textContent) + "\n";
      var blob = new Blob([text2], { type: "text/markdown;charset=utf-8" });
      var url = URL.createObjectURL(blob);
      var a = document.createElement("a");
      a.href = url;
      a.download = "turn-" + (msgId || "").substring(0, 12) + ".md";
      a.click();
      URL.revokeObjectURL(url);
      window.Hermes.toast("\u5DF2\u5BFC\u51FA");
    }
    function showContextMenu(x3, y3, msgId, turnEl) {
      const menu = _createContextMenu();
      menu.dataset.msgId = msgId;
      menu._turnEl = turnEl;
      menu.style.left = Math.min(x3, window.innerWidth - 180) + "px";
      menu.style.top = Math.min(y3, window.innerHeight - 120) + "px";
      menu.classList.add("ctx-menu-visible");
    }
    function hideContextMenu() {
      if (_ctxMenu) _ctxMenu.classList.remove("ctx-menu-visible");
    }
    function initMessageActions() {
      document.addEventListener("contextmenu", function(e) {
        const turn = e.target.closest(".turn");
        if (!turn || !turn.dataset.msgId) {
          hideContextMenu();
          return;
        }
        e.preventDefault();
        showContextMenu(e.pageX, e.pageY, turn.dataset.msgId, turn);
      });
      document.addEventListener("click", function(e) {
        if (_ctxMenu && !_ctxMenu.contains(e.target)) hideContextMenu();
      });
    }
    async function loadSessions() {
      try {
        const { data } = await api("/sessions?limit=200");
        let sessions = Array.isArray(data) ? data : [];
        window.Hermes.state.sessions = sessions;
        let sessionProjectMap = {};
        try {
          const mappingRes = await api("/projects/mapping");
          sessionProjectMap = mappingRes.data || {};
        } catch (e) {
          console.warn("\u83B7\u53D6\u9879\u76EE\u6620\u5C04\u5931\u8D25\uFF0C\u663E\u793A\u6240\u6709\u4F1A\u8BDD:", e);
        }
        const currentProjectId = window.Hermes.state.currentProjectId;
        if (currentProjectId) {
          sessions = sessions.filter(function(s) {
            return (s.cwd || "") === currentProjectId;
          });
        }
        renderSessionList(sessions);
        if (window.Hermes.renderProjectList) {
          window.Hermes.renderProjectList();
        }
      } catch (e) {
        if (window.Hermes.dom && window.Hermes.dom.sessionList) {
          window.Hermes.dom.sessionList.innerHTML = '<div style="padding:16px;color:var(--danger)">\u52A0\u8F7D\u5931\u8D25: ' + esc(e.message) + "</div>";
        }
      }
    }
    var _renderListTimer = null;
    var MAX_VISIBLE_SESSIONS = 100;
    function renderSessionList(sessions) {
      const dom = window.Hermes.dom;
      const state = window.Hermes.state;
      if (!dom || !dom.sessionList) return;
      var visible = sessions;
      var truncated = false;
      if (sessions.length > MAX_VISIBLE_SESSIONS) {
        visible = sessions.slice(0, MAX_VISIBLE_SESSIONS);
        truncated = true;
      }
      dom.sessionList.innerHTML = visible.map((s) => {
        const title = s.title || "Session " + s.id.substring(0, 16);
        const active = s.id === state.focusedSessionId ? " active" : "";
        const streaming = window.Hermes.hasActiveStream(s.id) ? " streaming" : "";
        return `
        <div class="session-item${active}${streaming}" data-id="${esc(s.id)}">
          <div class="session-item-title" data-title="${esc(title)}">${esc(title)}</div>
          <div class="session-item-meta">
            <span>${fmtTime(s.started_at)}</span>
            <span>${s.message_count || 0} \u6761</span>
            <span>${fmtTokens(s.input_tokens)}</span>
          </div>
          <button class="session-delete" title="\u5220\u9664\u4F1A\u8BDD">\u2715</button>
        </div>`;
      }).join("");
      if (truncated) {
        dom.sessionList.innerHTML += '<div style="padding:0.5rem;text-align:center;color:var(--text-muted);font-size:0.75rem">\u4EC5\u663E\u793A\u6700\u8FD1 ' + MAX_VISIBLE_SESSIONS + " \u6761\uFF0C\u5171 " + sessions.length + " \u6761</div>";
      }
    }
    var _loadSessionsTimer = null;
    function debouncedLoadSessions(delay) {
      if (_loadSessionsTimer) clearTimeout(_loadSessionsTimer);
      _loadSessionsTimer = setTimeout(function() {
        _loadSessionsTimer = null;
        loadSessions();
      }, delay || 1500);
    }
    function initSessionListEvents() {
      const dom = window.Hermes.dom;
      dom.sessionList.addEventListener("click", function(e) {
        if (e.target.classList.contains("rename-input")) return;
        if (e.target.classList.contains("session-delete")) {
          e.stopPropagation();
          const item2 = e.target.closest(".session-item");
          if (item2) {
            window.Hermes.deleteSession(item2.dataset.id);
          }
          return;
        }
        const item = e.target.closest(".session-item");
        if (item) {
          window.Hermes.selectSession(item.dataset.id);
        }
      });
      dom.sessionList.addEventListener("dblclick", function(e) {
        const titleEl = e.target.closest(".session-item-title");
        if (titleEl && !titleEl.querySelector(".rename-input")) {
          e.stopPropagation();
          window.Hermes.startRename(titleEl);
        }
      });
    }
    function startRename(titleEl) {
      if (titleEl.querySelector(".rename-input")) return;
      const item = titleEl.closest(".session-item");
      const sessionId = item.dataset.id;
      const currentTitle = titleEl.dataset.title || titleEl.textContent;
      const input = document.createElement("input");
      input.className = "rename-input";
      input.type = "text";
      input.value = currentTitle;
      input.setAttribute("maxlength", "200");
      titleEl.textContent = "";
      titleEl.appendChild(input);
      input.focus();
      input.select();
      const finishRename = async (save) => {
        const newTitle = input.value.trim();
        if (save && newTitle && newTitle !== currentTitle) {
          try {
            await window.Hermes.api("/sessions/" + sessionId, {
              method: "PATCH",
              body: { title: newTitle }
            });
            titleEl.dataset.title = newTitle;
            titleEl.textContent = newTitle;
            const s = window.Hermes.state.sessions.find((s2) => s2.id === sessionId);
            if (s) s.title = newTitle;
          } catch (e) {
            titleEl.textContent = currentTitle;
            window.Hermes.toast("\u91CD\u547D\u540D\u5931\u8D25: " + e.message, true);
          }
        } else {
          titleEl.textContent = currentTitle;
        }
      };
      input.addEventListener("keydown", (e) => {
        if (e.key === "Enter") {
          e.preventDefault();
          finishRename(true);
        } else if (e.key === "Escape") {
          e.preventDefault();
          finishRename(false);
        }
      });
      input.addEventListener("blur", () => {
        setTimeout(() => {
          if (titleEl.querySelector(".rename-input")) finishRename(true);
        }, 100);
      });
    }
    async function searchSessions(keyword) {
      if (!keyword || keyword.length < 2) {
        window.Hermes.state._searchResults = null;
        renderSessionList(window.Hermes.state.sessions);
        return;
      }
      try {
        const { data } = await api("/search?q=" + encodeURIComponent(keyword));
        const results = Array.isArray(data) ? data : [];
        window.Hermes.state._searchResults = results;
        renderSessionList(results);
      } catch (e) {
        if (window.Hermes.dom && window.Hermes.dom.sessionList) {
          window.Hermes.dom.sessionList.innerHTML = '<div style="padding:16px;color:var(--danger)">\u641C\u7D22\u5931\u8D25</div>';
        }
      }
    }
    let _loadSeq = 0;
    async function selectSession(sessionId) {
      const state = window.Hermes.state;
      if (state.viewMode === "chat" && state.focusedSessionId === sessionId) return;
      if (window.Hermes.hasActiveStream(sessionId)) {
        window.Hermes.enterSession(sessionId, "chat");
        return;
      }
      const cache = state.sessionMessages[sessionId];
      const hasFreshCache = cache && !cache.isStale && cache.messages.length > 0;
      const dom = window.Hermes.dom;
      if (!hasFreshCache) {
        if (dom.sessionTitle) dom.sessionTitle.textContent = "\u52A0\u8F7D\u4E2D...";
        if (dom.sessionInfo) dom.sessionInfo.textContent = "";
        if (dom.messageList && !dom.messageList.querySelector(".switch-loading")) {
          var loadingEl = document.createElement("div");
          loadingEl.className = "switch-loading";
          loadingEl.textContent = "\u52A0\u8F7D\u4E2D...";
          dom.messageList.insertBefore(loadingEl, dom.messageList.firstChild);
          dom.messageList.classList.add("switching");
        }
      }
      try {
        await window.Hermes.enterSession(sessionId, "view");
      } catch (e) {
        console.error("[selectSession] enterSession failed:", e);
        if (dom.messageList) {
          dom.messageList.classList.remove("switching");
          var sl = dom.messageList.querySelector(".switch-loading");
          if (sl) sl.remove();
          if (!dom.messageList.querySelector(".load-error")) {
            var errEl = document.createElement("div");
            errEl.className = "switch-loading load-error";
            errEl.textContent = "\u4F1A\u8BDD\u52A0\u8F7D\u5931\u8D25\uFF1A" + (e && e.message ? e.message : "\u672A\u77E5\u9519\u8BEF") + "\uFF08\u70B9\u51FB\u91CD\u8BD5\uFF09";
            errEl.style.cursor = "pointer";
            errEl.onclick = /* @__PURE__ */ (function(id) {
              return function() {
                selectSession(id);
              };
            })(sessionId);
            dom.messageList.insertBefore(errEl, dom.messageList.firstChild);
          }
        }
      }
    }
    async function deleteSession(sessionId) {
      if (!sessionId) return;
      const title = window.Hermes.state.sessions.find((s) => s.id === sessionId)?.title || sessionId.substring(0, 16);
      if (!await asyncConfirm("\u786E\u5B9A\u5220\u9664\u4F1A\u8BDD\u300C" + title + "\u300D\u53CA\u5176\u6240\u6709\u5206\u652F\u4F1A\u8BDD\uFF1F\u6B64\u64CD\u4F5C\u4E0D\u53EF\u6062\u590D\u3002", "\u5220\u9664\u4F1A\u8BDD")) return;
      try {
        await api("/sessions/" + sessionId + "?cascade=true", { method: "DELETE" });
        try {
          await api("/projects/unassign", { method: "POST", body: { session_id: sessionId } });
        } catch (e) {
          console.warn("\u6E05\u7406 session \u6620\u5C04\u5931\u8D25:", e);
        }
        window.Hermes.toast("\u4F1A\u8BDD\u5DF2\u5220\u9664");
        window.Hermes.cleanupSession(sessionId);
        await loadSessions();
        window.Hermes.purgeStaleCaches();
        window.Hermes.renderQuickStats();
      } catch (e) {
        window.Hermes.toast("\u5220\u9664\u5931\u8D25: " + e.message, true);
      }
    }
    async function exportSession(sessionId) {
      if (!sessionId) return;
      try {
        const { data: session } = await api("/sessions/" + sessionId);
        const { data: messages } = await api("/sessions/" + sessionId + "/messages");
        const msgs = Array.isArray(messages) ? messages : [];
        let md = `# ${esc(session.title || "Session " + sessionId.substring(0, 16))}

`;
        md += `> \u6A21\u578B: ${session.model || "-"} | \u65F6\u95F4: ${fmtTime(session.started_at)} - ${fmtTime(session.ended_at)} | \u6D88\u606F: ${session.message_count || 0}

---

`;
        const turns = groupIntoTurns(msgs);
        turns.forEach((turn) => {
          if (turn.type === "other") return;
          md += `### \u{1F464} \u7528\u6237

${turn.user.content || ""}

`;
          turn.steps.forEach((step) => {
            if (step.assistant?.content) {
              md += `### \u{1F916} \u52A9\u624B

${step.assistant.content}

`;
            }
            if (step.toolCalls) {
              step.toolCalls.forEach((tc) => {
                md += `**\u{1F527} ${tc.name || tc.function?.name || "tool"}**

`;
              });
            }
          });
          md += "---\n\n";
        });
        const blob = new Blob([md], { type: "text/markdown;charset=utf-8" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `hermes-${sessionId.substring(0, 12)}-${(/* @__PURE__ */ new Date()).toISOString().slice(0, 10)}.md`;
        a.click();
        URL.revokeObjectURL(url);
        window.Hermes.toast("\u5BFC\u51FA\u6210\u529F");
      } catch (e) {
        window.Hermes.toast("\u5BFC\u51FA\u5931\u8D25: " + e.message, true);
      }
    }
    window.Hermes.loadSessions = loadSessions;
    window.Hermes.debouncedLoadSessions = debouncedLoadSessions;
    window.Hermes.renderSessionList = renderSessionList;
    window.Hermes.searchSessions = searchSessions;
    window.Hermes.selectSession = selectSession;
    window.Hermes.renderMessages = renderMessages;
    window.Hermes.renderStreamingStepsHTML = renderStreamingStepsHTML;
    window.Hermes.groupIntoTurns = groupIntoTurns;
    window.Hermes.renderTurnStepsHTML = renderTurnStepsHTML;
    window.Hermes.renderSingleTurnHTML = renderSingleTurnHTML;
    window.Hermes.renderToolCard = renderToolCard;
    window.Hermes.renderThinkingBlock = renderThinkingBlock;
    window.Hermes.renderThinkingMargin = renderThinkingMargin;
    window.Hermes.initSessionListEvents = initSessionListEvents;
    window.Hermes.deleteSession = deleteSession;
    window.Hermes.exportSession = exportSession;
    window.Hermes.startRename = startRename;
    window.Hermes.initMessageActions = initMessageActions;
    window.Hermes.deleteMessageRound = deleteMessageRound;
    window.Hermes.asyncConfirm = asyncConfirm;
    window.Hermes.getToolEmoji = getToolEmoji;
  })();

  // web/chat/js/chat.js
  window.Hermes = window.Hermes || {};
  (function() {
    "use strict";
    const H4 = window.Hermes;
    const $3 = window.Hermes.$;
    const $$ = window.Hermes.$$;
    const esc = window.Hermes.esc;
    const api = window.Hermes.api;
    function _morph(el, html2) {
      if (window.morphdom) {
        try {
          window.morphdom(el, html2, {
            childrenOnly: true,
            onBeforeElUpdated: function(fromEl, toEl) {
              if (fromEl.isEqualNode(toEl)) return false;
              return true;
            }
          });
          return;
        } catch (e) {
        }
      }
      el.innerHTML = html2;
    }
    const getMsgs = window.Hermes.getMsgs;
    const setMsgs = window.Hermes.setMsgs;
    function currentMsgs() {
      return getMsgs() || [];
    }
    function showSendButton() {
      const btnSend = document.getElementById("btn-send");
      const btnStop = document.getElementById("btn-stop");
      if (btnSend) btnSend.style.display = "inline-flex";
      if (btnStop) btnStop.style.display = "none";
    }
    function showStopButton() {
      const btnSend = document.getElementById("btn-send");
      const btnStop = document.getElementById("btn-stop");
      if (btnSend) btnSend.style.display = "none";
      if (btnStop) btnStop.style.display = "inline-flex";
    }
    function appendNewTurn(container, userMsg, streamingMsg) {
      const fmtTime = window.Hermes.fmtTime;
      const userTime = userMsg.timestamp_fmt || fmtTime(userMsg.timestamp) || fmtTime(Date.now() / 1e3);
      const userId = userMsg.id || "";
      const turnHtml = `
      <div class="turn" data-msg-id="${esc(String(userId))}" data-streaming="true">
        <div class="turn-user">
          <div class="turn-user-content">${window.Hermes.renderMarkdown(userMsg.content || "")}</div>
          <div class="turn-avatar user-avatar">U</div>
        </div>
        <div class="turn-time turn-time-user">${esc(userTime)}<span class="turn-actions"><button class="turn-edit-btn" data-msg-id="${esc(String(userId))}" title="\u7F16\u8F91\u91CD\u53D1">\u270E</button></span></div>
        <div class="turn-agent">
          <div class="turn-avatar agent-avatar">H</div>
          <div class="turn-agent-body">
            <div class="turn-steps">
              ${window.Hermes.renderStreamingStepsHTML(streamingMsg)}
            </div>
          </div>
        </div>
      </div>`;
      container.insertAdjacentHTML("beforeend", turnHtml);
      window.Hermes.initCollapsible(container);
      container.scrollTop = container.scrollHeight;
    }
    let _renderTimers = {};
    const RENDER_DEBOUNCE_MS = 50;
    var _liveTimer = null;
    function _startLiveTimer() {
      if (_liveTimer) return;
      _liveTimer = setInterval(function() {
        var state = window.Hermes.state;
        var sid = state.focusedSessionId;
        if (!sid || !window.Hermes.hasActiveStream(sid)) {
          _stopLiveTimer();
          return;
        }
        var msgs = getMsgs(sid);
        if (!msgs) {
          _stopLiveTimer();
          return;
        }
        var hasRunning = false;
        for (var i = msgs.length - 1; i >= 0; i--) {
          var m3 = msgs[i];
          if (m3._streaming && m3._toolSteps) {
            if (m3._toolSteps.some(function(ts) {
              return ts.running;
            })) {
              hasRunning = true;
              break;
            }
          }
        }
        if (hasRunning) scheduleRender(sid, false);
      }, 1e3);
    }
    function _stopLiveTimer() {
      if (_liveTimer) {
        clearInterval(_liveTimer);
        _liveTimer = null;
      }
    }
    window.Hermes._startLiveTimer = _startLiveTimer;
    window.Hermes._stopLiveTimer = _stopLiveTimer;
    function _extractText(content) {
      if (!content) return "";
      if (typeof content === "string") return content;
      if (Array.isArray(content)) return content.filter(function(b3) {
        return b3.type === "text";
      }).map(function(b3) {
        return b3.text;
      }).join("");
      return String(content);
    }
    function _clearRenderTimer(sid) {
      if (_renderTimers[sid]) {
        clearTimeout(_renderTimers[sid]);
        delete _renderTimers[sid];
      }
    }
    function clearAllRenderTimers() {
      Object.keys(_renderTimers).forEach(function(k3) {
        clearTimeout(_renderTimers[k3]);
      });
      _renderTimers = {};
    }
    function isNearBottom(el) {
      if (!el) return true;
      return el.scrollHeight - el.scrollTop - el.clientHeight < 60;
    }
    var _scrollBtn = null;
    function _getScrollBtn() {
      if (_scrollBtn) return _scrollBtn;
      _scrollBtn = document.createElement("button");
      _scrollBtn.className = "scroll-bottom-btn";
      _scrollBtn.innerHTML = "\u2193";
      _scrollBtn.title = "\u56DE\u5230\u5E95\u90E8";
      _scrollBtn.style.display = "none";
      _scrollBtn.addEventListener("click", function() {
        var el = window.Hermes.dom.chatMessages;
        if (el) el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
        _scrollBtn.style.display = "none";
      });
      var chatView = document.getElementById("chat-view") || document.querySelector(".chat-main");
      if (chatView) {
        chatView.style.position = "relative";
        chatView.appendChild(_scrollBtn);
      } else {
        document.body.appendChild(_scrollBtn);
      }
      return _scrollBtn;
    }
    var _scrollBtnRaf = 0;
    function _updateScrollBtn() {
      if (_scrollBtnRaf) return;
      _scrollBtnRaf = requestAnimationFrame(function() {
        _scrollBtnRaf = 0;
        var el = window.Hermes.dom.chatMessages;
        if (!el) return;
        var btn = _getScrollBtn();
        if (isNearBottom(el)) {
          btn.style.display = "none";
        } else {
          btn.style.display = "flex";
        }
      });
    }
    var _pinRaf = 0;
    function _pinToBottom() {
      if (_pinRaf) return;
      _pinRaf = requestAnimationFrame(function() {
        _pinRaf = 0;
        var el = window.Hermes.dom.chatMessages;
        if (el) el.scrollTop = el.scrollHeight;
      });
    }
    function finalizeStreamingTurn(sid) {
      if (!sid) return;
      _clearRenderTimer(sid);
      _stopLiveTimer();
      const dom = window.Hermes.dom;
      if (window.Hermes.state.focusedSessionId !== sid) return;
      const turnEl = dom.chatMessages.querySelector('.turn[data-streaming="true"]');
      if (!turnEl) return;
      const msgs = getMsgs(sid);
      if (!msgs) return;
      const prevScrollTop = dom.chatMessages.scrollTop;
      var lastAssistant = null;
      for (var mi = msgs.length - 1; mi >= 0; mi--) {
        if (msgs[mi].role === "assistant") {
          lastAssistant = msgs[mi];
          break;
        }
      }
      if (!lastAssistant) return;
      if (lastAssistant._toolSteps) {
        lastAssistant._toolSteps.forEach(function(ts) {
          if (ts.running) {
            ts.running = false;
            ts.endTime = ts.endTime || Date.now();
          }
        });
      }
      if (lastAssistant._toolSteps && lastAssistant._toolSteps.length > 0 && lastAssistant.content && lastAssistant.content.trim().length > 0) {
        var finalMsg = {
          role: "assistant",
          content: lastAssistant.content,
          reasoning: lastAssistant.reasoning || "",
          timestamp: lastAssistant.timestamp,
          timestamp_fmt: lastAssistant.timestamp_fmt
        };
        lastAssistant.content = "";
        lastAssistant.reasoning = "";
        var lastAssistantIdx = msgs.lastIndexOf(lastAssistant);
        var insertIdx = lastAssistantIdx + 1;
        while (insertIdx < msgs.length && (msgs[insertIdx].role === "toolResult" || msgs[insertIdx].role === "tool")) {
          insertIdx++;
        }
        msgs.splice(insertIdx, 0, finalMsg);
      }
      const freshTurns = window.Hermes.groupIntoTurns(msgs);
      if (freshTurns.length > 0) {
        const freshTurn = freshTurns[freshTurns.length - 1];
        var stepsHtml = window.Hermes.renderTurnStepsHTML(freshTurn);
        var stepsEl = turnEl.querySelector(".turn-steps");
        if (stepsEl) _morph(stepsEl, stepsHtml);
      }
      turnEl.removeAttribute("data-streaming");
      window.Hermes.initCollapsible(turnEl);
      dom.chatMessages.scrollTop = prevScrollTop;
      if (lastAssistant) delete lastAssistant._lastSig;
      if (window.Hermes.clearStreamingMdCache) window.Hermes.clearStreamingMdCache();
    }
    function refreshLastTurn(sid) {
    }
    function renderCurrentChat() {
      const state = window.Hermes.state;
      const dom = window.Hermes.dom;
      if (state.viewMode !== "chat") return;
      const sid = state.focusedSessionId;
      if (!sid) {
        dom.chatMessages.innerHTML = "";
        return;
      }
      const msgs = getMsgs(sid);
      if (!msgs) return;
      const streamingMsg = msgs.find((m3) => m3._streaming);
      if (streamingMsg) {
        const streamingTurnEl = dom.chatMessages.querySelector('.turn[data-streaming="true"]');
        if (streamingTurnEl) {
          const stepsEl = streamingTurnEl.querySelector(".turn-steps");
          if (stepsEl) {
            const atBottom3 = isNearBottom(dom.chatMessages);
            var _ts = streamingMsg._toolSteps || [];
            var _toolSig = _ts.map(function(s) {
              var base = (s.running ? "r" : s.result !== void 0 ? "d" : "p") + "|" + (s.toolCallId || "") + "|" + (s.name || "");
              return s.running ? base : base + "|" + (s.result != null ? String(s.result).length : 0);
            }).join(",");
            var _sig = [
              "tc=" + _ts.length,
              "ts=" + _toolSig,
              "hr=" + !!(streamingMsg.reasoning && streamingMsg.reasoning.trim()),
              "hc=" + !!(streamingMsg.content && streamingMsg.content.trim()),
              "ap=" + !!(streamingMsg._approval && !streamingMsg._approvalResolved),
              "sa=" + (streamingMsg._subagents ? streamingMsg._subagents.length : 0),
              "ab=" + !!streamingMsg._aborted,
              "er=" + !!streamingMsg._error,
              "us=" + !!(streamingMsg._usage && (streamingMsg._usage.total_tokens || streamingMsg._usage.prompt_tokens)),
              "qu=" + !!streamingMsg._queue
            ].join(";");
            if (streamingMsg._lastSig === _sig) {
              var _finalBody = stepsEl.querySelector(".step-final .step-answer");
              if (_finalBody && streamingMsg.content != null) {
                var _sfSplit = window.Hermes.renderStreamingMarkdownSplit(streamingMsg.content, "sf");
                var _stableEl = _finalBody.querySelector(".md-stable");
                var _activeEl = _finalBody.querySelector(".md-active");
                if (_activeEl) {
                  if (_sfSplit.stableChanged && _stableEl) _morph(_stableEl, _sfSplit.stableHtml);
                  _morph(_activeEl, _sfSplit.activeHtml);
                } else {
                  _morph(_finalBody, _sfSplit.fullHtml);
                }
              }
              var _tmBody = streamingTurnEl.querySelector(".tm-active .tm-body");
              if (_tmBody && streamingMsg.reasoning) {
                var _tmOff = _tmBody.scrollHeight - _tmBody.scrollTop - _tmBody.clientHeight;
                var _tmStick = _tmOff < 24;
                _morph(_tmBody, window.Hermes.renderStreamingMarkdown(streamingMsg.reasoning.trim(), "tm"));
                _tmBody.scrollTop = _tmStick ? _tmBody.scrollHeight : Math.max(0, _tmBody.scrollHeight - _tmBody.clientHeight - _tmOff);
              }
              if (atBottom3) _pinToBottom();
              _updateScrollBtn();
              return;
            }
            streamingMsg._lastSig = _sig;
            var openPanelIdx = [];
            var oldPanels = stepsEl.querySelectorAll(".ow-panels .ow-ep");
            oldPanels.forEach(function(p2, idx) {
              if (p2.classList.contains("ow-show")) openPanelIdx.push(idx);
            });
            var oldTl = stepsEl.querySelector(".ow-tl");
            var tlStickToBottom = true;
            var tlBottomOffset = 0;
            if (oldTl) {
              tlBottomOffset = oldTl.scrollHeight - oldTl.scrollTop - oldTl.clientHeight;
              tlStickToBottom = tlBottomOffset < 24;
            }
            stepsEl.innerHTML = window.Hermes.renderStreamingStepsHTML(streamingMsg);
            var newPanels = stepsEl.querySelectorAll(".ow-panels .ow-ep");
            openPanelIdx.forEach(function(idx) {
              if (newPanels[idx]) newPanels[idx].classList.add("ow-show");
            });
            var tl = stepsEl.querySelector(".ow-tl");
            if (tl) {
              if (tlStickToBottom) {
                tl.scrollTop = tl.scrollHeight;
              } else {
                tl.scrollTop = Math.max(0, tl.scrollHeight - tl.clientHeight - tlBottomOffset);
              }
            }
            var marginEl = streamingTurnEl.querySelector(".turn-margin");
            var tmOldBody = marginEl ? marginEl.querySelector(".tm-active .tm-body") : null;
            var tmStick = true, tmOff = 0;
            if (tmOldBody) {
              tmOff = tmOldBody.scrollHeight - tmOldBody.scrollTop - tmOldBody.clientHeight;
              tmStick = tmOff < 24;
            }
            var newMarginHtml = window.Hermes.renderThinkingMargin({ steps: [{ streaming: streamingMsg }] }, true);
            if (newMarginHtml) {
              if (!marginEl) {
                var agentBody = streamingTurnEl.querySelector(".turn-agent-body");
                if (agentBody) agentBody.insertAdjacentHTML("afterend", newMarginHtml);
              } else if (tmOldBody) {
                _morph(tmOldBody, window.Hermes.renderStreamingMarkdown((streamingMsg.reasoning || "").trim(), "tm"));
              }
            } else if (marginEl) {
              marginEl.remove();
            }
            var tmNewBody = streamingTurnEl.querySelector(".tm-active .tm-body");
            if (tmNewBody) {
              tmNewBody.scrollTop = tmStick ? tmNewBody.scrollHeight : Math.max(0, tmNewBody.scrollHeight - tmNewBody.clientHeight - tmOff);
            }
            if (atBottom3) _pinToBottom();
            _updateScrollBtn();
            return;
          }
        }
        const atBottom2 = isNearBottom(dom.chatMessages);
        window.Hermes.renderMessages(msgs, dom.chatMessages);
        if (atBottom2) _pinToBottom();
        _updateScrollBtn();
        return;
      }
      const atBottom = isNearBottom(dom.chatMessages);
      window.Hermes.renderMessages(msgs, dom.chatMessages);
      if (atBottom) _pinToBottom();
      _updateScrollBtn();
    }
    function scheduleRender(sid, immediate) {
      if (!sid) return;
      if (window.Hermes.state.focusedSessionId !== sid) return;
      if (immediate) {
        _clearRenderTimer(sid);
        renderCurrentChat();
      } else {
        if (_renderTimers[sid]) return;
        _renderTimers[sid] = setTimeout(function() {
          delete _renderTimers[sid];
          requestAnimationFrame(renderCurrentChat);
        }, RENDER_DEBOUNCE_MS);
      }
    }
    var _inputHistory = [];
    var _historyIdx = -1;
    var MAX_HISTORY = 50;
    function pushInputHistory(text2) {
      if (!text2 || !text2.trim()) return;
      if (_inputHistory.length > 0 && _inputHistory[_inputHistory.length - 1] === text2) return;
      _inputHistory.push(text2);
      if (_inputHistory.length > MAX_HISTORY) _inputHistory.shift();
    }
    function getPrevInputHistory() {
      if (_inputHistory.length === 0) return null;
      if (_historyIdx < 0) _historyIdx = _inputHistory.length;
      _historyIdx--;
      if (_historyIdx < 0) {
        _historyIdx = 0;
        return _inputHistory[0];
      }
      return _inputHistory[_historyIdx] || null;
    }
    function getNextInputHistory() {
      if (_inputHistory.length === 0 || _historyIdx < 0) return null;
      _historyIdx++;
      if (_historyIdx >= _inputHistory.length) {
        _historyIdx = -1;
        return "";
      }
      return _inputHistory[_historyIdx] || null;
    }
    function handleImageFile(file) {
      var reader = new FileReader();
      reader.onload = function(e) {
        var dataUrl = e.target.result;
        var fileName = file.name || "pasted-image";
        var sizeKB = Math.round(file.size / 1024);
        var marker = "[\u56FE\u7247: " + fileName + " (" + sizeKB + "KB)]\n" + dataUrl.substring(0, 100) + "...";
        var input = window.Hermes.dom.chatInput;
        var cur = input.value;
        input.value = (cur ? cur + "\n" : "") + "\u8BF7\u5206\u6790\u8FD9\u5F20\u56FE\u7247:\n" + marker;
        input.dispatchEvent(new Event("input"));
        window.Hermes.toast("\u56FE\u7247\u5DF2\u9644\u52A0: " + fileName);
      };
      reader.readAsDataURL(file);
    }
    const slashCommands = [
      { name: "/help", icon: "\u2753", group: "\u57FA\u7840", desc: "\u663E\u793A\u6240\u6709\u53EF\u7528\u547D\u4EE4" },
      { name: "/clear", icon: "\u{1F9F9}", group: "\u57FA\u7840", desc: "\u6E05\u7A7A\u5F53\u524D\u5BF9\u8BDD\u6D88\u606F\uFF08\u4EC5\u672C\u5730\uFF0C\u5237\u65B0\u540E\u6062\u590D\uFF09" },
      { name: "/new", icon: "\u2728", group: "\u57FA\u7840", desc: "\u5F00\u59CB\u65B0\u5BF9\u8BDD" },
      { name: "/skills", icon: "\u{1F3AF}", group: "\u57FA\u7840", desc: "\u6D4F\u89C8 Skills \u6280\u80FD\u5217\u8868" },
      { name: "/model", icon: "\u{1F916}", group: "\u57FA\u7840", desc: "\u67E5\u770B\u6216\u5207\u6362\u6A21\u578B", hasArg: true },
      { name: "/skill", icon: "\u26A1", group: "\u6280\u80FD", desc: "\u8C03\u7528\u6307\u5B9A\u6280\u80FD (\u5982 /skill ascii-art)", hasArg: true },
      { name: "/sessions", icon: "\u{1F4CB}", group: "\u4F1A\u8BDD", desc: "\u67E5\u770B\u5386\u53F2\u4F1A\u8BDD\u5217\u8868" },
      { name: "/history", icon: "\u{1F4DC}", group: "\u4F1A\u8BDD", desc: "\u67E5\u770B\u5F53\u524D\u4F1A\u8BDD\u5B8C\u6574\u5386\u53F2" },
      { name: "/export", icon: "\u{1F4BE}", group: "\u4F1A\u8BDD", desc: "\u5BFC\u51FA\u5F53\u524D\u5BF9\u8BDD\u4E3A Markdown" },
      { name: "/compress", icon: "\u{1F5DC}\uFE0F", group: "\u4F1A\u8BDD", desc: "\u538B\u7F29\u4E0A\u4E0B\u6587\uFF08\u8C03\u7528\u6A21\u578B\u751F\u6210\u6458\u8981\uFF0C\u6301\u4E45\u5316\u5230 session\uFF09" }
    ];
    let slashState = { visible: false, items: [], activeIndex: -1 };
    function getSlashQuery() {
      const dom = window.Hermes.dom;
      const val = dom.chatInput.value;
      const pos = dom.chatInput.selectionStart;
      const before = val.substring(0, pos);
      const match = before.match(/(\/\S*)$/);
      return match ? { query: match[1], start: match.index } : null;
    }
    function filterSlashCommands(query) {
      const q3 = query.toLowerCase();
      if (!q3 || q3 === "/") return slashCommands;
      return slashCommands.filter((c3) => c3.name.toLowerCase().startsWith(q3));
    }
    let skillNamesCache = null;
    async function getSkillNames() {
      if (skillNamesCache) return skillNamesCache;
      try {
        const res = await api("/skills/builtin");
        if (res.ok && res.skills) {
          skillNamesCache = res.skills.map((s) => s.dir_name);
        }
      } catch (e) {
      }
      return skillNamesCache || [];
    }
    function renderSlashMenu(items, query) {
      const dom = window.Hermes.dom;
      slashState.items = items;
      slashState.activeIndex = -1;
      if (items.length === 0) {
        dom.slashMenu.innerHTML = '<div class="slash-menu-empty">\u6CA1\u6709\u5339\u914D\u7684\u547D\u4EE4</div>';
        dom.slashMenu.style.display = "block";
        slashState.visible = true;
        return;
      }
      const groups = {};
      items.forEach((item) => {
        if (!groups[item.group]) groups[item.group] = [];
        groups[item.group].push(item);
      });
      let html2 = "";
      for (const [group, cmds] of Object.entries(groups)) {
        html2 += `<div class="slash-menu-group">${esc(group)}</div>`;
        cmds.forEach((cmd) => {
          let nameHtml = esc(cmd.name);
          if (query && query.length > 1) {
            const q3 = esc(query);
            nameHtml = nameHtml.replace(q3, `<span class="slash-highlight">${q3}</span>`);
          }
          html2 += `<div class="slash-menu-item" data-cmd="${esc(cmd.name)}">
          <div class="slash-menu-item-icon">${cmd.icon}</div>
          <div class="slash-menu-item-body">
            <div class="slash-menu-item-name">${nameHtml}</div>
            <div class="slash-menu-item-desc">${esc(cmd.desc)}</div>
          </div>
        </div>`;
        });
      }
      dom.slashMenu.innerHTML = html2;
      dom.slashMenu.style.display = "block";
      slashState.visible = true;
      dom.slashMenu.querySelectorAll(".slash-menu-item").forEach((el) => {
        el.addEventListener("mousedown", (e) => {
          e.preventDefault();
          executeSlashCommand(el.dataset.cmd);
        });
      });
    }
    function hideSlashMenu() {
      window.Hermes.dom.slashMenu.style.display = "none";
      slashState.visible = false;
      slashState.activeIndex = -1;
    }
    function slashNavigate(dir) {
      const dom = window.Hermes.dom;
      const items = dom.slashMenu.querySelectorAll(".slash-menu-item");
      if (items.length === 0) return;
      items.forEach((i) => i.classList.remove("active"));
      slashState.activeIndex += dir;
      if (slashState.activeIndex < 0) slashState.activeIndex = items.length - 1;
      if (slashState.activeIndex >= items.length) slashState.activeIndex = 0;
      const active = items[slashState.activeIndex];
      active.classList.add("active");
      active.scrollIntoView({ block: "nearest" });
    }
    function slashSelect() {
      const dom = window.Hermes.dom;
      const items = dom.slashMenu.querySelectorAll(".slash-menu-item");
      if (slashState.activeIndex >= 0 && slashState.activeIndex < items.length) {
        executeSlashCommand(items[slashState.activeIndex].dataset.cmd);
      }
    }
    async function executeSlashCommand(cmd) {
      const dom = window.Hermes.dom;
      const state = window.Hermes.state;
      hideSlashMenu();
      dom.chatInput.value = "";
      dom.chatInput.focus({ preventScroll: true });
      switch (cmd) {
        case "/help":
          showSlashHelp();
          break;
        case "/clear": {
          const sid = state.focusedSessionId;
          if (sid) {
            setMsgs(sid, []);
            addSystemMessage("\u{1F9F9} \u5DF2\u6E05\u7A7A\u672C\u5730\u6D88\u606F\uFF08\u4EC5\u672C\u5730\u751F\u6548\uFF0C\u5237\u65B0\u9875\u9762\u540E\u6062\u590D\u539F\u59CB\u6D88\u606F\uFF09");
          }
          renderCurrentChat();
          break;
        }
        case "/new":
          window.Hermes.createNewChat();
          break;
        case "/skills":
          window.Hermes.openSkillsView();
          break;
        case "/model":
          await showModelInfo();
          break;
        case "/sessions":
          showSessionsList();
          break;
        case "/history":
          showCurrentHistory();
          break;
        case "/export":
          exportChat();
          break;
        case "/compress":
          await compressChat();
          break;
        case "/skill":
          addSystemMessage("\u7528\u6CD5: /skill <\u6280\u80FD\u540D>  \u4F8B\u5982: /skill ascii-art");
          break;
      }
    }
    async function handleSkillArg(skillName) {
      const dom = window.Hermes.dom;
      hideSlashMenu();
      const msg = `[\u7CFB\u7EDF: \u7528\u6237\u8C03\u7528\u4E86\u6280\u80FD ${skillName}] \u8BF7\u4F7F\u7528 ${skillName} \u6280\u80FD\u6765\u5904\u7406\u540E\u7EED\u8BF7\u6C42\u3002`;
      dom.chatInput.value = msg;
      sendMessage();
    }
    function addSystemMessage(text2, html2) {
      const state = window.Hermes.state;
      const sid = state.focusedSessionId;
      const sysMsg = { role: "system", content: html2 || text2, _isSystemDisplay: true };
      const msgs = sid ? getMsgs(sid) : null;
      if (msgs) {
        msgs.push(sysMsg);
        scheduleRender(sid, true);
      }
    }
    function showSlashHelp() {
      let html2 = "<h3>\u26A1 \u659C\u6760\u547D\u4EE4</h3>";
      const groups = {};
      slashCommands.forEach((c3) => {
        if (!groups[c3.group]) groups[c3.group] = [];
        groups[c3.group].push(c3);
      });
      for (const [group, cmds] of Object.entries(groups)) {
        html2 += `<p><strong>${esc(group)}</strong></p><ul>`;
        cmds.forEach((c3) => {
          html2 += `<li>${c3.icon} <code>${esc(c3.name)}</code> \u2014 ${esc(c3.desc)}</li>`;
        });
        html2 += "</ul>";
      }
      html2 += "<p><em>\u8F93\u5165 <code>/</code> \u5F00\u59CB\u641C\u7D22\u547D\u4EE4\uFF0C\u2191\u2193 \u9009\u62E9\uFF0CEnter \u6267\u884C</em></p>";
      addSystemMessage(null, html2);
    }
    async function showModelInfo() {
      try {
        const res = await api("/gateway_status");
        if (res.ok && res.model) addSystemMessage(null, `<h3>\u{1F916} \u5F53\u524D\u6A21\u578B</h3><p><code>${esc(res.model)}</code></p>`);
        else addSystemMessage("\u65E0\u6CD5\u83B7\u53D6\u6A21\u578B\u4FE1\u606F");
      } catch (e) {
        addSystemMessage("\u83B7\u53D6\u6A21\u578B\u4FE1\u606F\u5931\u8D25: " + e.message);
      }
    }
    function showSessionsList() {
      const state = window.Hermes.state;
      const items = state.sessions;
      if (!items || items.length === 0) {
        addSystemMessage("\u6682\u65E0\u5386\u53F2\u4F1A\u8BDD");
        return;
      }
      let html2 = "<h3>\u{1F4CB} \u5386\u53F2\u4F1A\u8BDD</h3><ol>";
      items.slice(0, 20).forEach((s, i) => {
        const title = s.title || "Session " + (s.id || "").substring(0, 16);
        html2 += `<li><a href="#/s/${esc(s.id)}/chat" class="sys-session-link" data-sid="${esc(s.id)}">${esc(title)}</a></li>`;
      });
      html2 += "</ol>";
      addSystemMessage(null, html2);
    }
    function showCurrentHistory() {
      const state = window.Hermes.state;
      const sid = state.focusedSessionId;
      if (!sid) {
        addSystemMessage("\u5F53\u524D\u6CA1\u6709\u6D3B\u8DC3\u4F1A\u8BDD");
        return;
      }
      const msgs = currentMsgs();
      const count = msgs.length;
      const userCount = msgs.filter((m3) => m3.role === "user").length;
      const asstCount = msgs.filter((m3) => m3.role === "assistant").length;
      addSystemMessage(null, `<h3>\u{1F4DC} \u5F53\u524D\u4F1A\u8BDD</h3><ul><li>\u4F1A\u8BDD ID: <code>${esc(sid.substring(0, 20))}</code></li><li>\u603B\u6D88\u606F: <strong>${count}</strong> (\u7528\u6237 ${userCount} / \u52A9\u624B ${asstCount})</li></ul>`);
    }
    function exportChat() {
      const msgs = currentMsgs();
      if (msgs.length === 0) {
        addSystemMessage("\u5F53\u524D\u5BF9\u8BDD\u4E3A\u7A7A\uFF0C\u65E0\u6CD5\u5BFC\u51FA");
        return;
      }
      let md = `# Hermes \u5BF9\u8BDD\u5BFC\u51FA

`;
      msgs.forEach((m3) => {
        const role = m3.role === "user" ? "\u{1F464} \u7528\u6237" : "\u{1F916} \u52A9\u624B";
        md += `### ${role}

${m3.content}

---

`;
      });
      const blob = new Blob([md], { type: "text/markdown" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `hermes-chat-${Date.now()}.md`;
      a.click();
      URL.revokeObjectURL(url);
      addSystemMessage(null, `<h3>\u{1F4BE} \u5BFC\u51FA\u6210\u529F</h3><p>\u5DF2\u5BFC\u51FA <strong>${msgs.length}</strong> \u6761\u6D88\u606F\u4E3A Markdown \u6587\u4EF6</p>`);
    }
    function _fmtK(n) {
      if (!n || n <= 0) return "0";
      if (n >= 1e6) return (n / 1e6).toFixed(1) + "M";
      if (n >= 1e3) return (n / 1e3).toFixed(1) + "K";
      return String(n);
    }
    function _pushCompactionResult(msgs, reason, result, aborted, errorMessage) {
      if (aborted || errorMessage || !result) {
        msgs.push({ role: "system", content: "\u2702\uFE0F \u4E0A\u4E0B\u6587\u538B\u7F29\u5931\u8D25\uFF1A" + (errorMessage || (aborted ? "\u5DF2\u53D6\u6D88" : "\u672A\u77E5\u539F\u56E0")), _isCompaction: true });
        return;
      }
      var before = result.tokensBefore || 0;
      var after = result.estimatedTokensAfter || 0;
      var saved = before - after;
      var savedPct = before > 0 ? Math.round(saved / before * 100) : 0;
      var head = "\u2702\uFE0F \u4E0A\u4E0B\u6587\u5DF2\u538B\u7F29 " + _fmtK(before) + " \u2192 " + _fmtK(after) + " tokens\uFF08\u8282\u7701 " + savedPct + "%" + (reason ? "\uFF0C" + reason : "") + "\uFF09";
      var html2 = '<div class="compaction-result"><div class="compaction-head">' + esc(head) + "</div>" + (result.summary ? '<details class="compaction-summary"><summary>\u67E5\u770B\u538B\u7F29\u6458\u8981</summary><div class="compaction-summary-body">' + esc(result.summary) + "</div></details>" : "") + "</div>";
      msgs.push({ role: "system", content: head, _isCompaction: true, _compactionHtml: html2 });
    }
    async function compressChat() {
      var state = window.Hermes.state;
      var sid = state.focusedSessionId;
      if (!sid) {
        addSystemMessage("\u5F53\u524D\u6CA1\u6709\u6D3B\u8DC3\u4F1A\u8BDD");
        return;
      }
      if (window.Hermes.hasActiveStream && window.Hermes.hasActiveStream(sid)) {
        addSystemMessage("\u5F53\u524D\u6709\u6B63\u5728\u8FDB\u884C\u7684\u56DE\u590D\uFF0C\u8BF7\u7B49\u5F85\u5B8C\u6210\u540E\u518D\u538B\u7F29");
        return;
      }
      addSystemMessage(null, "<h3>\u{1F5DC}\uFE0F \u6B63\u5728\u538B\u7F29\u4E0A\u4E0B\u6587\u2026</h3><p>\u6B63\u5728\u8C03\u7528\u6A21\u578B\u751F\u6210\u6458\u8981\uFF0C\u8BF7\u7A0D\u5019</p>");
      try {
        var res = await api("/compact", { method: "POST", body: { session_id: sid } });
        var _cCache = state.sessionMessages[sid];
        if (_cCache) _cCache._compactedAt = Date.now();
        var msgs = getMsgs(sid);
        if (msgs && res.result) {
          _pushCompactionResult(msgs, "manual", res.result, false, null);
          scheduleRender(sid, true);
        }
        if (window.Hermes.loadContextInfo) {
          setTimeout(function() {
            window.Hermes.loadContextInfo(sid, true);
          }, 300);
        }
      } catch (e) {
        addSystemMessage("\u538B\u7F29\u5931\u8D25\uFF1A" + e.message);
      }
    }
    function updateChatUIState() {
      const state = window.Hermes.state;
      const dom = window.Hermes.dom;
      if (state.viewMode !== "chat") return;
      const sid = state.focusedSessionId;
      const hasActiveStream = sid ? window.Hermes.hasActiveStream(sid) : false;
      if (hasActiveStream) {
        dom.chatInput.disabled = true;
        showStopButton();
      } else {
        dom.chatInput.disabled = false;
        showSendButton();
      }
    }
    function enterChatMode(sessionId) {
      window.Hermes.enterSession(sessionId, "chat");
    }
    function exitChatMode() {
      const state = window.Hermes.state;
      const sid = state.focusedSessionId;
      if (sid) _clearRenderTimer(sid);
      if (sid) {
        window.Hermes.enterSession(sid, "view");
      } else {
        state.viewMode = "list";
        state.focusedSessionId = null;
        window.Hermes.showView("welcome");
        $$(".session-item").forEach((el) => el.classList.remove("active"));
        window.Hermes.updateStreamingHints();
      }
    }
    function abortCurrentStream(sessionId) {
      const state = window.Hermes.state;
      const sid = sessionId || state.focusedSessionId;
      if (!sid) return;
      window.Hermes.abortStream(sid);
      if (state.focusedSessionId === sid) {
        if (state.viewMode === "chat") {
          renderCurrentChat();
        }
        updateChatUIState();
      }
    }
    async function sendMessage() {
      const state = window.Hermes.state;
      const dom = window.Hermes.dom;
      const sid = state.focusedSessionId;
      if (!sid) {
        window.Hermes.createNewChat();
        return;
      }
      if (window.Hermes.hasActiveStream(sid)) return;
      const input = dom.chatInput.value.trim();
      if (!input) return;
      if (input.startsWith("/")) {
        const parts = input.split(/\s+/);
        const cmd = parts[0].toLowerCase();
        const arg = parts.slice(1).join(" ");
        if (cmd === "/skill" && arg) {
          await handleSkillArg(arg);
          return;
        }
        const matched = slashCommands.find((c3) => c3.name === cmd);
        if (matched) {
          await executeSlashCommand(cmd);
          return;
        }
        if (cmd.startsWith("/") && !cmd.startsWith("//")) {
          addSystemMessage(`\u672A\u77E5\u547D\u4EE4: ${cmd}\uFF0C\u8F93\u5165 /help \u67E5\u770B\u53EF\u7528\u547D\u4EE4`);
          dom.chatInput.value = "";
          return;
        }
      }
      dom.chatInput.value = "";
      dom.chatInput.style.height = "auto";
      dom.chatInput.disabled = true;
      showStopButton();
      document.querySelectorAll(".reconnect-btn").forEach(function(b3) {
        b3.remove();
      });
      pushInputHistory(input);
      const abortController = new AbortController();
      const userMsg = { role: "user", content: input };
      const msgs = getMsgs(sid);
      const preStreamCount = msgs ? msgs.length : 0;
      if (msgs) msgs.push(userMsg);
      const streamAssistantMsg = {
        role: "assistant",
        content: "",
        reasoning: "",
        _streaming: true,
        _toolSteps: [],
        _toolCallCount: 0,
        _stepNum: 0
      };
      if (msgs) msgs.push(streamAssistantMsg);
      const streamState = {
        abortController,
        assistantMsg: streamAssistantMsg,
        finished: false,
        sessionId: sid,
        userInput: input,
        preStreamCount
      };
      state.activeStreams[sid] = streamState;
      appendNewTurn(dom.chatMessages, userMsg, streamAssistantMsg);
      window.Hermes.updateStreamingHints();
      const messagesToSend = [{ role: "user", content: input }];
      try {
        const res = await fetch(window.Hermes.API_BASE + "/chat/stream", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ message: input, session_id: sid }),
          signal: abortController.signal
        });
        console.log("[sendMessage] SSE fetch \u2192", res.status);
        if (!res.ok) {
          const errText = await res.text();
          if (res.status === 409 && !streamState._retriedAfterBusy) {
            streamState._retriedAfterBusy = true;
            try {
              await fetch(window.Hermes.API_BASE + "/abort", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ session_id: sid })
              });
            } catch {
            }
            await new Promise(function(r) {
              setTimeout(r, 400);
            });
            var _msgs = getMsgs(sid);
            if (_msgs) {
              var _i = _msgs.indexOf(streamAssistantMsg);
              if (_i >= 0) _msgs.splice(_i, 1);
            }
            delete state.activeStreams[sid];
            dom.chatInput.value = streamState.userInput;
            dom.chatInput.disabled = false;
            H4.sendMessage();
            return;
          }
          const currentMsgs2 = getMsgs(sid);
          if (currentMsgs2) {
            const idx = currentMsgs2.indexOf(streamAssistantMsg);
            if (idx >= 0) currentMsgs2.splice(idx, 1);
            currentMsgs2.push({ role: "system", content: "API \u9519\u8BEF: " + errText, _isSystemDisplay: true });
          }
          delete state.activeStreams[sid];
          if (state.focusedSessionId === sid && state.viewMode === "chat") {
            renderCurrentChat();
            updateChatUIState();
            dom.chatInput.focus({ preventScroll: true });
          }
          return;
        }
        const parser = EventSourceParser.createParser({
          onEvent(event) {
            const eventType = event.event || "";
            const jsonStr = event.data;
            if (jsonStr === "[DONE]") return;
            try {
              const evt = JSON.parse(jsonStr);
              const _t = evt.type;
              if (streamAssistantMsg._aborted) return;
              if (_t === "tool_execution_start") {
                streamAssistantMsg._stepNum++;
                streamAssistantMsg._toolCallCount = (streamAssistantMsg._toolCallCount || 0) + 1;
                streamAssistantMsg._toolSteps.push({
                  name: evt.toolName || "unknown",
                  emoji: "\u26A1",
                  running: true,
                  toolCallId: evt.toolCallId || null,
                  args: evt.args || null,
                  startTime: Date.now()
                });
                _startLiveTimer();
                scheduleRender(sid, false);
                return;
              }
              if (_t === "tool_execution_update") {
                var _step = (streamAssistantMsg._toolSteps || []).find(function(s) {
                  return s.toolCallId === evt.toolCallId;
                });
                if (_step && evt.partialResult) _step.result = _extractText(evt.partialResult.content);
                scheduleRender(sid, false);
                return;
              }
              if (_t === "tool_execution_end") {
                var _step2 = (streamAssistantMsg._toolSteps || []).find(function(s) {
                  return s.toolCallId === evt.toolCallId;
                });
                if (_step2) {
                  _step2.running = false;
                  _step2.endTime = Date.now();
                  if (evt.result) _step2.result = _extractText(evt.result.content);
                  if (evt.isError) _step2.error = true;
                }
                var _curMsgs = getMsgs(sid);
                if (_curMsgs && evt.result) {
                  _curMsgs.push({ role: "toolResult", toolCallId: evt.toolCallId, content: _extractText(evt.result.content) });
                }
                scheduleRender(sid, false);
                return;
              }
              if (_t === "message_update") {
                var _ae = evt.assistantMessageEvent;
                if (!_ae) return;
                if (_ae.type === "text_delta") {
                  (streamAssistantMsg._toolSteps || []).forEach(function(s) {
                    s.running = false;
                  });
                  streamAssistantMsg.content += _ae.delta || "";
                  scheduleRender(sid, false);
                } else if (_ae.type === "thinking_delta") {
                  streamAssistantMsg.reasoning += _ae.delta || "";
                  scheduleRender(sid, false);
                } else if (_ae.type === "toolcall_end" && _ae.toolCall) {
                  var _tc = _ae.toolCall;
                  var _tcId = _tc.toolCallId || _tc.id || null;
                  var _existing = _tcId ? (streamAssistantMsg._toolSteps || []).find(function(s) {
                    return s.toolCallId === _tcId;
                  }) : null;
                  if (!_existing) {
                    _existing = { name: _tc.name || "unknown", toolCallId: _tcId, args: _tc.input != null ? _tc.input : _tc.arguments != null ? _tc.arguments : null, running: false, startTime: null };
                    streamAssistantMsg._toolSteps.push(_existing);
                    streamAssistantMsg._toolCallCount = (streamAssistantMsg._toolCallCount || 0) + 1;
                  } else {
                    if (!_existing.name || _existing.name === "unknown") _existing.name = _tc.name || _existing.name;
                    if (!_existing.toolCallId && _tcId) _existing.toolCallId = _tcId;
                    if (_existing.args == null && _tc.input != null) _existing.args = _tc.input;
                  }
                }
                return;
              }
              if (_t === "message_end" && evt.message && evt.message.role === "assistant") {
                if (evt.message.usage) streamAssistantMsg._usage = evt.message.usage;
                return;
              }
              if (_t === "extension_ui_request") {
                streamAssistantMsg._approval = evt;
                scheduleRender(sid, true);
                return;
              }
              if (_t === "queue_update") {
                streamAssistantMsg._queue = evt;
                scheduleRender(sid, false);
                return;
              }
              if (_t === "error") {
                streamAssistantMsg._error = evt.error || "unknown error";
                scheduleRender(sid, false);
                return;
              }
              if (_t === "agent_settled") {
                streamState._settledReceived = true;
              }
              if (_t === "compaction_start") {
                var _cmsgs = getMsgs(sid);
                if (_cmsgs) {
                  _cmsgs.push({ role: "system", content: "\u2702\uFE0F \u6B63\u5728\u538B\u7F29\u4E0A\u4E0B\u6587\u2026\uFF08" + (evt.reason || "") + "\uFF09", _isCompaction: true, _compactionPending: true });
                  scheduleRender(sid, true);
                }
                return;
              }
              if (_t === "compaction_end") {
                var _cmsgs2 = getMsgs(sid);
                if (_cmsgs2) {
                  for (var _j = _cmsgs2.length - 1; _j >= 0; _j--) {
                    if (_cmsgs2[_j]._compactionPending) {
                      _cmsgs2.splice(_j, 1);
                      break;
                    }
                  }
                  _pushCompactionResult(_cmsgs2, evt.reason, evt.result, evt.aborted, evt.errorMessage);
                  scheduleRender(sid, true);
                }
                var _cache = state.sessionMessages[sid];
                if (_cache) _cache._compactedAt = Date.now();
                if (window.Hermes.loadContextInfo) {
                  setTimeout(function() {
                    window.Hermes.loadContextInfo(sid, true);
                  }, 300);
                }
                return;
              }
            } catch (e) {
              if (window.console && console.warn) {
                console.warn("[SSE] parse error:", e.message, "data:", jsonStr ? jsonStr.substring(0, 200) : "(empty)");
              }
            }
          }
        });
        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        var lastByteAt = Date.now();
        var _watchdog = setInterval(function() {
          if (Date.now() - lastByteAt > 6e4) {
            console.warn("[sendMessage] no data for 60s, stream considered dead");
            streamState._watchdogAborted = true;
            try {
              abortController.abort();
            } catch {
            }
          }
        }, 1e4);
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          lastByteAt = Date.now();
          const text2 = decoder.decode(value, { stream: true });
          const SUB = 4096;
          if (text2.length > SUB) {
            for (let i = 0; i < text2.length; i += SUB) {
              parser.feed(text2.slice(i, i + SUB));
              await new Promise(function(resolve) {
                setTimeout(resolve, 0);
              });
            }
          } else {
            parser.feed(text2);
          }
        }
        clearInterval(_watchdog);
        console.log("[sendMessage] stream done (server closed)");
        document.querySelectorAll(".reconnect-btn").forEach(function(b3) {
          b3.remove();
        });
        window.Hermes.onStreamComplete(sid);
      } catch (e) {
        if (typeof _watchdog !== "undefined") clearInterval(_watchdog);
        var isWatchdog = !!streamState._watchdogAborted;
        console.error("[sendMessage] SSE catch:", e.name || "Error", e.message || e, "| isWatchdog=", isWatchdog);
        if (e.name === "AbortError" && !isWatchdog) {
          return;
        }
        if (streamState._settledReceived) {
          console.log("[sendMessage] network error after agent_settled, treat as complete:", e.message || e);
          try {
            window.Hermes.onStreamComplete(sid);
          } catch (ce2) {
            console.warn("[sendMessage] onStreamComplete fallback failed", ce2);
          }
          try {
            updateChatUIState();
          } catch (ue2) {
            console.warn("[sendMessage] updateChatUIState fallback failed", ue2);
          }
          return;
        }
        const currentMsgs2 = getMsgs(sid);
        if (currentMsgs2) {
          const idx = currentMsgs2.indexOf(streamAssistantMsg);
          if (idx >= 0) {
            if (streamAssistantMsg.content || streamAssistantMsg.reasoning) {
              streamAssistantMsg._streaming = false;
              streamAssistantMsg._aborted = true;
              streamAssistantMsg._error = isWatchdog ? "\u54CD\u5E94\u8D85\u65F6\uFF0860s \u65E0\u6570\u636E\uFF09" : e.message;
            } else {
              currentMsgs2.splice(idx, 1);
            }
          }
          delete state.activeStreams[sid];
          if (state.focusedSessionId === sid && state.viewMode === "chat") {
            if (streamAssistantMsg.content || streamAssistantMsg.reasoning) {
              window.Hermes.finalizeStreamingTurn(sid);
            } else {
              var failMsg = isWatchdog ? "\u54CD\u5E94\u8D85\u65F6\uFF1A60 \u79D2\u5185\u672A\u6536\u5230\u6570\u636E\uFF0C\u8FDE\u63A5\u53EF\u80FD\u5DF2\u65AD\u5F00\u3002" : "\u8FDE\u63A5\u5931\u8D25: " + e.message;
              addSystemMessage(failMsg + "\n\n\u8BF7\u786E\u8BA4 pi-bridge \u5DF2\u542F\u52A8: cd piweb-bridge && ./start.sh");
              renderCurrentChat();
            }
            updateChatUIState();
            dom.chatInput.focus({ preventScroll: true });
          }
          if (state.focusedSessionId === sid && state.viewMode === "chat") {
            var reconBtn = document.createElement("button");
            reconBtn.className = "reconnect-btn";
            reconBtn.textContent = isWatchdog ? "\u{1F504} \u91CD\u8FDE(\u54CD\u5E94\u8D85\u65F6)" : "\u{1F504} \u91CD\u8FDE(\u8FDE\u63A5\u65AD\u5F00)";
            reconBtn.onclick = function() {
              reconBtn.remove();
              dom.chatInput.value = input;
              H4.sendMessage();
            };
            var inputArea = document.querySelector(".chat-input-area");
            if (inputArea) inputArea.appendChild(reconBtn);
          }
        }
        return;
      }
      window.Hermes.debouncedLoadSessions();
      try {
        window.Hermes.renderQuickStats();
      } catch (e) {
        console.warn("[sendMessage] \u5237\u65B0\u7EDF\u8BA1\u5931\u8D25", e);
      }
      const effectiveSid = streamState.sessionId;
      if (state.focusedSessionId === effectiveSid && state.viewMode === "chat") {
        updateChatUIState();
        if (dom.chatInput) {
          dom.chatInput.focus({ preventScroll: true });
        }
        window.Hermes.loadContextInfo(effectiveSid);
      }
      window.Hermes.updateStreamingHints();
    }
    async function resolveApproval(runId, choice) {
      try {
        const res = await fetch(window.Hermes.API_BASE + "/ui-response", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ session_id: window.Hermes.state.focusedSessionId, id: runId, choice })
        });
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err.error?.message || "HTTP " + res.status);
        }
        const data = await res.json();
        window.Hermes.toast("\u5BA1\u6279\u5DF2\u63D0\u4EA4: " + choice);
        const sid = window.Hermes.state.focusedSessionId;
        if (sid) {
          const msgs = window.Hermes.getMsgs(sid);
          if (msgs) {
            const streamingMsg = msgs.find((m3) => m3._streaming && m3._approval);
            if (streamingMsg) {
              streamingMsg._approvalResolved = true;
              streamingMsg._approvalChoice = choice;
              window.Hermes.renderCurrentChat();
            }
          }
        }
      } catch (e) {
        window.Hermes.toast("\u5BA1\u6279\u63D0\u4EA4\u5931\u8D25: " + e.message, true);
      }
    }
    document.addEventListener("click", function(e) {
      const btn = e.target.closest(".approval-btn");
      if (!btn || btn.classList.contains("resolved")) return;
      const card = btn.closest(".approval-card");
      if (!card) return;
      const runId = card.dataset.runId;
      const choice = btn.dataset.choice;
      if (!runId || !choice) return;
      card.querySelectorAll(".approval-btn").forEach((b3) => b3.classList.add("resolved"));
      resolveApproval(runId, choice);
    });
    window.Hermes.enterChatMode = enterChatMode;
    window.Hermes.exitChatMode = exitChatMode;
    window.Hermes.sendMessage = sendMessage;
    window.Hermes.getSlashQuery = getSlashQuery;
    window.Hermes.filterSlashCommands = filterSlashCommands;
    window.Hermes.renderSlashMenu = renderSlashMenu;
    window.Hermes.hideSlashMenu = hideSlashMenu;
    window.Hermes.slashNavigate = slashNavigate;
    window.Hermes.slashSelect = slashSelect;
    window.Hermes.slashState = function() {
      return slashState;
    };
    window.Hermes.abortCurrentStream = abortCurrentStream;
    window.Hermes.renderCurrentChat = renderCurrentChat;
    window.Hermes.currentMsgs = currentMsgs;
    window.Hermes.updateChatUIState = updateChatUIState;
    window.Hermes.finalizeStreamingTurn = finalizeStreamingTurn;
    window.Hermes.refreshLastTurn = refreshLastTurn;
    window.Hermes.clearAllRenderTimers = clearAllRenderTimers;
    window.Hermes._clearRenderTimer = _clearRenderTimer;
    window.Hermes._updateScrollBtn = _updateScrollBtn;
    window.Hermes.getPrevInputHistory = getPrevInputHistory;
    window.Hermes.getNextInputHistory = getNextInputHistory;
    window.Hermes.handleImageFile = handleImageFile;
  })();
  (function() {
    var _cvTimer = 0;
    window.addEventListener("resize", function() {
      if (_cvTimer) clearTimeout(_cvTimer);
      _cvTimer = setTimeout(function() {
        _cvTimer = 0;
        var turns = document.querySelectorAll(".turn");
        if (!turns.length) return;
        turns.forEach(function(t) {
          t.style.contentVisibility = "visible";
        });
        requestAnimationFrame(function() {
          turns.forEach(function(t) {
            t.style.contentVisibility = "";
          });
        });
      }, 150);
    });
  })();

  // web/chat/js/gateway.js
  window.Hermes = window.Hermes || {};
  (function() {
    "use strict";
    const $3 = window.Hermes.$;
    const api = window.Hermes.api;
    const esc = window.Hermes.esc;
    const fmtTokens = window.Hermes.fmtTokens;
    const fmtDuration = window.Hermes.fmtDuration;
    const state = window.Hermes.state;
    const dom = window.Hermes.dom;
    async function checkGateway() {
      try {
        const res = await api("/status");
        const data = res.data || res.gateway || {};
        if (!dom.gatewayStatus) return;
        const dot = dom.gatewayStatus.querySelector(".dot");
        const text2 = dom.gatewayStatus.querySelector(".status-text");
        if (!dot || !text2) return;
        if (data.status === "up" || data.http_code === 200) {
          dot.className = "dot online";
          text2.textContent = "pi-bridge \u5728\u7EBF";
        } else {
          dot.className = "dot offline";
          text2.textContent = "pi-bridge \u79BB\u7EBF";
        }
      } catch (e) {
        if (!dom.gatewayStatus) return;
        const dot = dom.gatewayStatus.querySelector(".dot");
        const text2 = dom.gatewayStatus.querySelector(".status-text");
        if (dot) dot.className = "dot offline";
        if (text2) text2.textContent = "pi-bridge \u672A\u542F\u52A8";
      }
    }
    function renderQuickStats() {
      const sessions = state.sessions;
      const totalMessages = sessions.reduce((sum, s) => sum + (s.message_count || 0), 0);
      const totalTokens = sessions.reduce((sum, s) => sum + (s.input_tokens || 0), 0);
      dom.quickStats.innerHTML = `
      <div class="pm-stat-card">
        <div class="pm-stat-head">
          <div class="pm-stat-icon c-blue">\u{1F4AC}</div>
        </div>
        <div class="pm-stat-value">${sessions.length}</div>
        <div class="pm-stat-label">\u4F1A\u8BDD</div>
        <div class="pm-stat-sub">\u5F53\u524D\u9879\u76EE</div>
      </div>
      <div class="pm-stat-card">
        <div class="pm-stat-head">
          <div class="pm-stat-icon c-violet">\u{1F4DD}</div>
        </div>
        <div class="pm-stat-value">${totalMessages}</div>
        <div class="pm-stat-label">\u6D88\u606F</div>
        <div class="pm-stat-sub">\u7D2F\u8BA1\u5F80\u8FD4</div>
      </div>
      <div class="pm-stat-card">
        <div class="pm-stat-head">
          <div class="pm-stat-icon c-teal">\u26A1</div>
        </div>
        <div class="pm-stat-value">${fmtTokens(totalTokens)}</div>
        <div class="pm-stat-label">Token</div>
        <div class="pm-stat-sub">\u6D88\u8017\u5408\u8BA1</div>
      </div>
      <div class="pm-stat-card">
        <div class="pm-stat-head">
          <div class="pm-stat-icon c-green">\u{1F4E1}</div>
        </div>
        <div class="pm-stat-value">\u25CF</div>
        <div class="pm-stat-label">\u5B9E\u65F6</div>
        <div class="pm-stat-sub">\u5DF2\u8FDE\u63A5\u7F51\u5173</div>
      </div>`;
    }
    var _lastContextFetchAt = 0;
    var _lastContextFetchSid = null;
    async function loadContextInfo(sessionId, force) {
      var now = Date.now();
      if (!force && _lastContextFetchSid === sessionId && now - _lastContextFetchAt < 5e3) {
        return;
      }
      _lastContextFetchAt = now;
      _lastContextFetchSid = sessionId;
      try {
        var url = "/context";
        if (sessionId) url += "?session_id=" + encodeURIComponent(sessionId);
        const res = await api(url);
        const ctx = res.context || {};
        const percent = ctx.percent || 0;
        const isActive = ctx.active;
        let modelName = ctx.model || "-";
        const slashIdx = modelName.indexOf("/");
        if (slashIdx >= 0 && slashIdx < 8) {
          modelName = modelName.substring(slashIdx + 1);
        }
        if (dom.ctxModel) dom.ctxModel.textContent = modelName;
        if (ctx.used_tokens > 0 && ctx.max_tokens > 0) {
          if (dom.ctxTokens) dom.ctxTokens.textContent = fmtTokens(ctx.used_tokens) + "/" + fmtTokens(ctx.max_tokens);
        } else if (ctx.max_tokens > 0) {
          if (dom.ctxTokens) dom.ctxTokens.textContent = "-/" + fmtTokens(ctx.max_tokens);
        } else {
          if (dom.ctxTokens) dom.ctxTokens.textContent = "-/-";
        }
        if (dom.ctxProgress) dom.ctxProgress.style.width = percent + "%";
        if (dom.ctxPercent) dom.ctxPercent.textContent = percent + "%";
        if (dom.ctxDuration) {
          if (isActive && ctx.duration && ctx.duration !== "-") {
            dom.ctxDuration.textContent = ctx.duration;
          } else if (!isActive) {
            dom.ctxDuration.textContent = "\u5DF2\u7ED3\u675F";
          } else {
            dom.ctxDuration.textContent = "-";
          }
        }
        const bar = dom.ctxProgress;
        if (bar) {
          bar.classList.remove("low", "mid", "high", "critical");
          if (percent < 50) bar.classList.add("low");
          else if (percent < 75) bar.classList.add("mid");
          else if (percent < 90) bar.classList.add("high");
          else bar.classList.add("critical");
        }
      } catch (e) {
        if (dom.ctxModel) dom.ctxModel.textContent = "-";
        if (dom.ctxTokens) dom.ctxTokens.textContent = "-/-";
        if (dom.ctxProgress) dom.ctxProgress.style.width = "0%";
        if (dom.ctxPercent) dom.ctxPercent.textContent = "0%";
        if (dom.ctxDuration) dom.ctxDuration.textContent = "-";
      }
    }
    window.Hermes.checkGateway = checkGateway;
    window.Hermes.renderQuickStats = renderQuickStats;
    window.Hermes.loadContextInfo = loadContextInfo;
    var _modelProviders = [];
    var _currentModel = null;
    async function loadProviders() {
      try {
        const res = await api("/providers");
        _modelProviders = res.providers || [];
        _currentModel = res.current || null;
        state.providers = _modelProviders;
        state.currentProvider = _currentModel ? _currentModel.modelId : "";
        const label = document.getElementById("provider-label");
        const trigger = document.getElementById("provider-trigger");
        if (label && _currentModel) {
          label.textContent = _currentModel.name || _currentModel.modelId;
        }
        if (trigger) {
          trigger.style.display = _modelProviders.length > 0 ? "inline-flex" : "none";
        }
        var ctxModel = dom.ctxModel;
        if (ctxModel) {
          ctxModel.classList.add("clickable");
          ctxModel.title = "\u70B9\u51FB\u5207\u6362\u6A21\u578B";
          ctxModel.onclick = function() {
            openModelModal();
          };
        }
      } catch (e) {
        const trigger = document.getElementById("provider-trigger");
        if (trigger) trigger.style.display = "none";
        console.warn("[loadProviders] failed:", e);
      }
    }
    function renderModelPicker(container) {
      var html2 = '<div class="mp-search-wrap"><input class="mp-search" type="text" placeholder="\u641C\u7D22\u6A21\u578B\u6216\u4F9B\u5E94\u5546\u2026" value=""></div>';
      html2 += '<div class="mp-list">' + renderModelListHTML("") + "</div>";
      container.innerHTML = html2;
      var searchInput = container.querySelector(".mp-search");
      var listEl = container.querySelector(".mp-list");
      if (searchInput) {
        searchInput.addEventListener("input", function() {
          listEl.innerHTML = renderModelListHTML(searchInput.value);
          bindModelItems(listEl);
        });
        searchInput.addEventListener("keydown", function(e) {
          if (e.key === "Escape") closeModelModal();
        });
      }
      bindModelItems(listEl);
      setTimeout(function() {
        if (searchInput) searchInput.focus();
      }, 50);
    }
    function fmtCtxWindow(cw) {
      if (!cw || cw <= 0) return "";
      if (cw >= 1e6) return (cw / 1e6).toFixed(cw % 1e6 === 0 ? 0 : 1) + "M";
      if (cw >= 1e3) return Math.round(cw / 1e3) + "K";
      return String(cw);
    }
    function renderModelListHTML(query) {
      var q3 = (query || "").trim().toLowerCase();
      var html2 = "";
      _modelProviders.forEach(function(pv) {
        var providerMatch = !q3 || (pv.name || "").toLowerCase().indexOf(q3) >= 0;
        var models = pv.models.filter(function(mm) {
          if (!q3) return true;
          if (providerMatch) return true;
          return (mm.name || "").toLowerCase().indexOf(q3) >= 0 || (mm.id || "").toLowerCase().indexOf(q3) >= 0;
        });
        if (models.length === 0) return;
        html2 += '<div class="mp-group"><div class="mp-group-title">' + esc(pv.name) + ' <span class="mp-group-count">' + models.length + "</span></div>";
        models.forEach(function(mm) {
          var isCurrent = _currentModel && _currentModel.provider === pv.name && _currentModel.modelId === mm.id;
          var badges = "";
          if (mm.reasoning) badges += '<span class="mp-badge mp-badge-r">\u601D\u8003</span>';
          if (mm.input && mm.input.indexOf("image") >= 0) badges += '<span class="mp-badge mp-badge-img">\u56FE\u50CF</span>';
          var ctxStr = fmtCtxWindow(mm.contextWindow);
          var ctxHtml = ctxStr ? '<span class="mp-item-ctx">' + esc(ctxStr) + "</span>" : "";
          html2 += '<div class="mp-item' + (isCurrent ? " active" : "") + '" data-provider="' + esc(pv.name) + '" data-model-id="' + esc(mm.id) + '"><span class="mp-item-name">' + esc(mm.name || mm.id) + "</span>" + ctxHtml + badges + (isCurrent ? '<span class="mp-check">\u2713</span>' : "") + "</div>";
        });
        html2 += "</div>";
      });
      return html2 || '<div class="mp-empty">\u65E0\u5339\u914D\u6A21\u578B</div>';
    }
    function bindModelItems(listEl) {
      listEl.querySelectorAll(".mp-item").forEach(function(item) {
        item.addEventListener("click", function() {
          switchModel(item.dataset.provider, item.dataset.modelId);
          closeModelModal();
        });
      });
    }
    async function switchModel(provider, modelId) {
      if (_currentModel && _currentModel.provider === provider && _currentModel.modelId === modelId) return;
      try {
        await api("/model", { method: "POST", body: { provider, modelId } });
        var pv = _modelProviders.find(function(p2) {
          return p2.name === provider;
        });
        var mm = pv ? pv.models.find(function(m3) {
          return m3.id === modelId;
        }) : null;
        if (mm) {
          _currentModel = { provider, modelId, name: mm.name };
          state.currentProvider = modelId;
          var label = document.getElementById("provider-label");
          if (label) label.textContent = mm.name;
          if (dom.ctxModel) dom.ctxModel.textContent = mm.name;
          H.toast("\u6A21\u578B\u5DF2\u5207\u6362\u4E3A " + mm.name);
        }
        H.loadContextInfo(state.focusedSessionId, true);
      } catch (e) {
        H.toast("\u5207\u6362\u6A21\u578B\u5931\u8D25: " + e.message, true);
      }
    }
    var _modelModal = null;
    function openModelModal() {
      closeModelModal();
      var overlay = document.createElement("div");
      overlay.id = "model-modal-overlay";
      overlay.className = "mm-overlay";
      overlay.innerHTML = '<div class="mm-modal" role="dialog" aria-modal="true"><div class="mm-head"><span class="mm-title">\u9009\u62E9\u6A21\u578B</span><button class="mm-close" title="\u5173\u95ED (Esc)">\u2715</button></div><div class="mm-body"></div></div>';
      document.body.appendChild(overlay);
      _modelModal = overlay;
      var body = overlay.querySelector(".mm-body");
      renderModelPicker(body);
      overlay.querySelector(".mm-close").addEventListener("click", closeModelModal);
      overlay.addEventListener("click", function(e) {
        if (e.target === overlay) closeModelModal();
      });
      document.addEventListener("keydown", _modelModalEscHandler);
    }
    function _modelModalEscHandler(e) {
      if (e.key === "Escape") closeModelModal();
    }
    function closeModelModal() {
      if (_modelModal) {
        _modelModal.remove();
        _modelModal = null;
      }
      document.removeEventListener("keydown", _modelModalEscHandler);
    }
    window.Hermes.loadProviders = loadProviders;
    window.Hermes.switchProvider = switchModel;
    window.Hermes.switchModel = switchModel;
    window.Hermes.openModelModal = openModelModal;
    window.Hermes.closeModelModal = closeModelModal;
  })();

  // web/chat/js/shortcuts.js
  window.Hermes = window.Hermes || {};
  (function() {
    "use strict";
    const $3 = window.Hermes.$;
    const esc = window.Hermes.esc;
    const api = window.Hermes.api;
    const fmtTime = window.Hermes.fmtTime;
    let searchOpen = false;
    let helpOpen = false;
    let searchResults = [];
    let searchTimer = null;
    function ensureSearchDOM() {
      if ($3("#global-search-overlay")) return;
      const overlay = document.createElement("div");
      overlay.id = "global-search-overlay";
      overlay.className = "gs-overlay";
      overlay.innerHTML = `
      <div class="gs-dialog">
        <div class="gs-input-wrap">
          <span class="gs-icon">\u{1F50D}</span>
          <input type="text" id="gs-input" class="gs-input" placeholder="\u641C\u7D22\u4F1A\u8BDD..." autocomplete="off" />
          <kbd class="gs-kbd">Esc</kbd>
        </div>
        <div id="gs-results" class="gs-results"></div>
        <div class="gs-footer">
          <span>\u2191\u2193 \u5BFC\u822A</span><span>Enter \u6253\u5F00</span><span>Esc \u5173\u95ED</span>
        </div>
      </div>`;
      document.body.appendChild(overlay);
      overlay.addEventListener("click", function(e) {
        if (e.target === overlay) closeSearch();
      });
      const input = $3("#gs-input");
      input.addEventListener("input", function() {
        clearTimeout(searchTimer);
        const q3 = this.value.trim();
        if (q3.length < 2) {
          searchResults = [];
          renderSearchResults([]);
          return;
        }
        searchTimer = setTimeout(() => doSearch(q3), 250);
      });
      input.addEventListener("keydown", function(e) {
        if (e.key === "Escape") {
          e.preventDefault();
          closeSearch();
          return;
        }
        if (e.key === "Enter") {
          e.preventDefault();
          selectActiveResult();
          return;
        }
        if (e.key === "ArrowDown" || e.key === "ArrowUp") {
          e.preventDefault();
          navigateResults(e.key === "ArrowDown" ? 1 : -1);
        }
      });
    }
    function ensureHelpDOM() {
      if ($3("#shortcuts-help-overlay")) return;
      const shortcuts = [
        { keys: "Ctrl + K", desc: "\u5168\u5C40\u641C\u7D22\u4F1A\u8BDD" },
        { keys: "Ctrl + N", desc: "\u65B0\u5BF9\u8BDD" },
        { keys: "Shift + ?", desc: "\u663E\u793A\u5FEB\u6377\u952E\u5E2E\u52A9" },
        { keys: "Escape", desc: "\u5173\u95ED\u5F39\u7A97/\u9000\u51FA\u5BF9\u8BDD" },
        { keys: "Enter", desc: "\u53D1\u9001\u6D88\u606F" },
        { keys: "Shift + Enter", desc: "\u6362\u884C" },
        { keys: "/", desc: "\u659C\u6760\u547D\u4EE4 (\u5BF9\u8BDD\u4E2D)" }
      ];
      const overlay = document.createElement("div");
      overlay.id = "shortcuts-help-overlay";
      overlay.className = "gs-overlay";
      overlay.innerHTML = `
      <div class="gs-dialog gs-help-dialog">
        <div class="gs-help-header">
          <span>\u2328\uFE0F \u5FEB\u6377\u952E</span>
          <kbd class="gs-kbd" onclick="document.getElementById('shortcuts-help-overlay').style.display='none'">Esc</kbd>
        </div>
        <div class="gs-help-list">
          ${shortcuts.map((s) => `
            <div class="gs-help-row">
              <span class="gs-help-desc">${esc(s.desc)}</span>
              <kbd class="gs-help-key">${esc(s.keys)}</kbd>
            </div>`).join("")}
        </div>
      </div>`;
      document.body.appendChild(overlay);
      overlay.addEventListener("click", function(e) {
        if (e.target === overlay) {
          overlay.style.display = "none";
          helpOpen = false;
        }
      });
    }
    async function doSearch(q3) {
      try {
        const { data } = await api("/search?q=" + encodeURIComponent(q3));
        searchResults = Array.isArray(data) ? data : [];
      } catch (e) {
        searchResults = [];
      }
      renderSearchResults(searchResults);
    }
    function renderSearchResults(results) {
      const container = $3("#gs-results");
      if (!container) return;
      if (results.length === 0) {
        const input = $3("#gs-input");
        if (input && input.value.trim().length >= 2) {
          container.innerHTML = '<div class="gs-empty">\u6CA1\u6709\u5339\u914D\u7684\u4F1A\u8BDD</div>';
        } else {
          container.innerHTML = '<div class="gs-empty">\u8F93\u5165\u5173\u952E\u8BCD\u641C\u7D22\u4F1A\u8BDD (\u81F3\u5C11 2 \u5B57\u7B26)</div>';
        }
        return;
      }
      container.innerHTML = results.map((s, i) => {
        const title = s.title || "Session " + (s.id || "").substring(0, 16);
        const active = i === 0 ? " gs-active" : "";
        return `
        <div class="gs-result${active}" data-sid="${esc(s.id)}" data-idx="${i}">
          <div class="gs-result-title">${esc(title)}</div>
          <div class="gs-result-meta">
            <span>${fmtTime(s.started_at)}</span>
            <span>${s.message_count || 0} \u6761\u6D88\u606F</span>
          </div>
        </div>`;
      }).join("");
      container.querySelectorAll(".gs-result").forEach((el) => {
        el.addEventListener("click", function() {
          closeSearch();
          window.Hermes.selectSession(this.dataset.sid);
        });
      });
    }
    function navigateResults(dir) {
      const items = document.querySelectorAll(".gs-result");
      if (items.length === 0) return;
      let activeIdx = -1;
      items.forEach((el, i) => {
        if (el.classList.contains("gs-active")) activeIdx = i;
      });
      items.forEach((el) => el.classList.remove("gs-active"));
      activeIdx += dir;
      if (activeIdx < 0) activeIdx = items.length - 1;
      if (activeIdx >= items.length) activeIdx = 0;
      items[activeIdx].classList.add("gs-active");
      items[activeIdx].scrollIntoView({ block: "nearest" });
    }
    function selectActiveResult() {
      const active = document.querySelector(".gs-result.gs-active");
      if (active) {
        closeSearch();
        window.Hermes.selectSession(active.dataset.sid);
      }
    }
    function openSearch() {
      ensureSearchDOM();
      searchOpen = true;
      const overlay = $3("#global-search-overlay");
      overlay.style.display = "flex";
      const input = $3("#gs-input");
      input.value = "";
      searchResults = [];
      renderSearchResults([]);
      setTimeout(() => input.focus(), 50);
    }
    function closeSearch() {
      searchOpen = false;
      const overlay = $3("#global-search-overlay");
      if (overlay) overlay.style.display = "none";
    }
    function toggleHelp() {
      ensureHelpDOM();
      helpOpen = !helpOpen;
      const overlay = $3("#shortcuts-help-overlay");
      overlay.style.display = helpOpen ? "flex" : "none";
    }
    function initShortcuts() {
      document.addEventListener("keydown", function(e) {
        if ((e.ctrlKey || e.metaKey) && e.key === "k") {
          e.preventDefault();
          if (searchOpen) closeSearch();
          else openSearch();
          return;
        }
        if ((e.ctrlKey || e.metaKey) && e.key === "n") {
          e.preventDefault();
          window.Hermes.createNewChat();
          return;
        }
        if (e.key === "?" && e.shiftKey && !isInInput(e)) {
          e.preventDefault();
          toggleHelp();
          return;
        }
        if (e.key === "Escape") {
          if (searchOpen) {
            e.preventDefault();
            closeSearch();
            return;
          }
          if (helpOpen) {
            e.preventDefault();
            helpOpen = false;
            const o = $3("#shortcuts-help-overlay");
            if (o) o.style.display = "none";
            return;
          }
        }
      });
    }
    function isInInput(e) {
      const t = e.target;
      return t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.isContentEditable;
    }
    window.Hermes.openSearch = openSearch;
    window.Hermes.closeSearch = closeSearch;
    window.Hermes.initShortcuts = initShortcuts;
  })();

  // web/chat/js/admin.js
  window.Hermes = window.Hermes || {};
  (function() {
    "use strict";
    var H4 = window.Hermes;
    var esc = H4.esc;
    var api = H4.api;
    var currentTab = "agents";
    var cache = { agents: [], extensions: [], skills: [], settings: {} };
    function getView() {
      return document.getElementById("admin-view");
    }
    function openAdmin(tab) {
      currentTab = tab || currentTab;
      H4.showView("admin");
      renderShell();
      loadCurrent();
    }
    function syncNavActive(tab) {
      document.querySelectorAll(".sidebar-nav .nav-btn[data-admin]").forEach(function(btn) {
        btn.classList.toggle("active", !!tab && btn.dataset.admin === tab);
      });
    }
    function renderShell() {
      var el = getView();
      if (!el) return;
      var tabs = [
        ["agents", "\u{1F916} Subagent"],
        ["extensions", "\u{1F9E9} \u6269\u5C55"],
        ["skills", "\u{1F3AF} Skills"],
        ["schedules", "\u23F0 \u5B9A\u65F6\u4EFB\u52A1"],
        ["settings", "\u2699\uFE0F Settings"]
      ];
      var tabHtml = tabs.map(function(t) {
        return '<button class="admin-tab' + (t[0] === currentTab ? " active" : "") + '" data-tab="' + t[0] + '">' + t[1] + "</button>";
      }).join("");
      el.innerHTML = '<div class="admin-header"><div class="admin-title">\u2699\uFE0F \u914D\u7F6E\u4E2D\u5FC3</div><div class="admin-tabs">' + tabHtml + '</div><button class="admin-close" id="admin-close" title="\u8FD4\u56DE">\u2715</button></div><div class="admin-body" id="admin-body"></div>';
      el.querySelectorAll(".admin-tab").forEach(function(btn) {
        btn.addEventListener("click", function() {
          currentTab = btn.dataset.tab;
          renderShell();
          loadCurrent();
        });
      });
      var closeBtn = el.querySelector("#admin-close");
      if (closeBtn) closeBtn.addEventListener("click", function() {
        H4.state.focusedSessionId = null;
        H4.state.viewMode = "list";
        H4.showView("welcome");
        syncNavActive(null);
      });
      syncNavActive(currentTab);
    }
    function loadCurrent() {
      if (currentTab === "agents") loadAgents();
      else if (currentTab === "extensions") loadExtensions();
      else if (currentTab === "skills") loadSkillsView();
      else if (currentTab === "schedules") loadSchedules();
      else if (currentTab === "settings") loadSettingsView();
    }
    function setBody(html2) {
      var el = getView();
      if (!el) return;
      var body = el.querySelector("#admin-body");
      if (body) body.innerHTML = html2;
    }
    function loadAgents() {
      setBody('<div class="admin-loading">\u52A0\u8F7D\u4E2D\u2026</div>');
      api("/agents").then(function(res) {
        cache.agents = res.data || [];
        renderAgents();
      }).catch(function(e) {
        setBody('<div class="admin-error">' + esc(e.message) + "</div>");
      });
    }
    function renderAgents() {
      var list = cache.agents;
      var html2 = '<div class="admin-toolbar"><span class="admin-count">' + list.length + ' \u4E2A subagent \xB7 \u76EE\u5F55 ~/.pi/agent/agents</span><button class="btn-primary btn-sm" id="admin-agent-new">+ \u65B0\u5EFA Subagent</button></div>';
      if (list.length === 0) {
        html2 += '<div class="admin-empty">\u8FD8\u6CA1\u6709 subagent\u3002</div>';
      } else {
        html2 += '<div class="card-grid">';
        list.forEach(function(a) {
          var tools = (a.tools || []).map(function(t) {
            return '<span class="tag">' + esc(t) + "</span>";
          }).join("");
          var skills = (a.skills || []).map(function(s) {
            return '<span class="tag tag-skill">' + esc(s) + "</span>";
          }).join("");
          html2 += '<div class="config-card" data-name="' + esc(a.name) + '"><div class="config-card-head"><div class="config-card-name">' + esc(a.name) + '</div><div class="config-card-actions"><button class="icon-btn" data-act="edit" title="\u7F16\u8F91">\u270F\uFE0F</button><button class="icon-btn" data-act="del" title="\u5220\u9664">\u{1F5D1}</button></div></div><div class="config-card-desc">' + esc(a.description || "\u2014") + '</div><div class="config-card-meta">' + (a.model ? '<span class="meta-item">\u{1F9E0} ' + esc(a.model) + "</span>" : "") + '<span class="meta-item">\u{1F4C1} ' + esc(a.defaultContext) + '</span><span class="meta-item">' + (a.systemPromptMode === "replace" ? "\u{1F501} replace" : "\u2795 append") + "</span>" + (a.inheritProjectContext ? '<span class="meta-item">\u{1F4CE} proj</span>' : "") + (a.hasSkillsDir ? '<span class="meta-item">\u{1F4C2} skills/</span>' : "") + "</div>" + (tools ? '<div class="config-card-tags">' + tools + "</div>" : "") + (skills ? '<div class="config-card-tags">' + skills + "</div>" : "") + "</div>";
        });
        html2 += "</div>";
      }
      setBody(html2);
      var newBtn = document.querySelector("#admin-agent-new");
      if (newBtn) newBtn.addEventListener("click", function() {
        agentEditor(null);
      });
      document.querySelectorAll("#admin-body .config-card").forEach(function(card) {
        var name = card.dataset.name;
        var editBtn = card.querySelector('[data-act="edit"]');
        var delBtn = card.querySelector('[data-act="del"]');
        if (editBtn) editBtn.addEventListener("click", function() {
          agentEditor(name);
        });
        if (delBtn) delBtn.addEventListener("click", function() {
          deleteAgent(name);
        });
      });
    }
    function deleteAgent(name) {
      if (!confirm('\u5220\u9664 subagent "' + name + '"\uFF1F\n\u76EE\u5F55\u53CA skills \u5B50\u76EE\u5F55\u90FD\u4F1A\u5220\u9664\uFF0C\u4E0D\u53EF\u6062\u590D\u3002')) return;
      api("/agents/" + encodeURIComponent(name), { method: "DELETE" }).then(function() {
        H4.toast("\u5DF2\u5220\u9664 " + name);
        loadAgents();
      }).catch(function(e) {
        H4.toast("\u5220\u9664\u5931\u8D25: " + e.message, true);
      });
    }
    function agentEditor(name) {
      var a = name ? cache.agents.find(function(x3) {
        return x3.name === name;
      }) : null;
      var isNew = !a;
      var existing = document.getElementById("agent-editor-overlay");
      if (existing) existing.remove();
      var overlay = document.createElement("div");
      overlay.id = "agent-editor-overlay";
      overlay.className = "ae-overlay";
      overlay.innerHTML = '<div class="ae-dialog"><div class="ae-header"><span>' + (isNew ? "\u65B0\u5EFA Subagent" : "\u7F16\u8F91 Subagent") + '</span><button class="ae-close" id="ae-close">\u2715</button></div><div class="ae-body"><div class="ae-field"><label>\u540D\u79F0 (name)</label><input id="ae-name" value="' + esc(a ? a.name : "") + '" placeholder="\u5982 my-agent" ' + (isNew ? "" : "") + '></div><div class="ae-field"><label>\u63CF\u8FF0 (description)</label><input id="ae-desc" value="' + esc(a ? a.description : "") + '"></div><div class="ae-row"><div class="ae-field"><label>\u6A21\u578B (model\uFF0C\u53EF\u7A7A)</label><input id="ae-model" value="' + esc(a ? a.model : "") + '" placeholder="provider/model"></div><div class="ae-field"><label>\u5DE5\u5177 (tools\uFF0C\u9017\u53F7\u5206\u9694)</label><input id="ae-tools" value="' + esc(a ? (a.tools || []).join(", ") : "") + '" placeholder="read, grep, ls, bash"></div></div><div class="ae-row"><div class="ae-field"><label>systemPromptMode</label><select id="ae-spm"><option value="append"' + (a && a.systemPromptMode === "append" ? " selected" : "") + '>append</option><option value="replace"' + (a && a.systemPromptMode === "replace" ? " selected" : "") + '>replace</option></select></div><div class="ae-field"><label>defaultContext</label><select id="ae-dc"><option value="fresh"' + (a && a.defaultContext === "fresh" ? " selected" : "") + '>fresh</option><option value="fork"' + (a && a.defaultContext === "fork" ? " selected" : "") + '>fork</option></select></div></div><div class="ae-row"><div class="ae-field"><label>skills (\u9017\u53F7\u5206\u9694)</label><input id="ae-skills" value="' + esc(a ? (a.skills || []).join(", ") : "") + '"></div><div class="ae-field"><label>skillPath</label><input id="ae-skillpath" value="' + esc(a ? a.skillPath : "") + '" placeholder="./skills"></div></div><div class="ae-row ae-checks"><label class="ae-check"><input type="checkbox" id="ae-ipc"' + (a ? a.inheritProjectContext ? " checked" : "" : " checked") + '> inheritProjectContext</label><label class="ae-check"><input type="checkbox" id="ae-is"' + (a ? a.inheritSkills ? " checked" : "" : " checked") + '> inheritSkills</label></div><div class="ae-field"><label>System Prompt \u6B63\u6587 (body)</label><textarea id="ae-body" rows="14" placeholder="\u4F60\u662F\u2026">' + esc(a ? a.body : "") + '</textarea></div></div><div class="ae-footer"><button class="btn-sm" id="ae-cancel">\u53D6\u6D88</button><button class="btn-primary btn-sm" id="ae-save">\u4FDD\u5B58</button></div></div>';
      document.body.appendChild(overlay);
      function close() {
        overlay.remove();
      }
      function collect() {
        var $3 = function(id) {
          return document.getElementById(id);
        };
        var tools = $3("ae-tools").value.trim();
        var skills = $3("ae-skills").value.trim();
        function splitArr(s) {
          return s ? s.split(",").map(function(x3) {
            return x3.trim();
          }).filter(Boolean) : [];
        }
        return {
          name: $3("ae-name").value.trim(),
          description: $3("ae-desc").value,
          model: $3("ae-model").value.trim(),
          tools: splitArr(tools),
          systemPromptMode: $3("ae-spm").value,
          defaultContext: $3("ae-dc").value,
          skills: splitArr(skills),
          skillPath: $3("ae-skillpath").value.trim(),
          inheritProjectContext: $3("ae-ipc").checked,
          inheritSkills: $3("ae-is").checked,
          body: $3("ae-body").value
        };
      }
      function save() {
        var data = collect();
        if (!data.name) {
          H4.toast("name \u4E0D\u80FD\u4E3A\u7A7A", true);
          return;
        }
        if (!/^[a-zA-Z0-9_-]+$/.test(data.name)) {
          H4.toast("name \u53EA\u80FD\u542B\u5B57\u6BCD\u6570\u5B57 _ -", true);
          return;
        }
        var req = isNew ? api("/agents", { method: "POST", body: data }) : api("/agents/" + encodeURIComponent(name), { method: "PATCH", body: data });
        req.then(function() {
          H4.toast(isNew ? "\u5DF2\u521B\u5EFA " + data.name : "\u5DF2\u4FDD\u5B58");
          close();
          loadAgents();
        }).catch(function(e) {
          H4.toast("\u4FDD\u5B58\u5931\u8D25: " + e.message, true);
        });
      }
      overlay.querySelector("#ae-close").addEventListener("click", close);
      overlay.querySelector("#ae-cancel").addEventListener("click", close);
      overlay.querySelector("#ae-save").addEventListener("click", save);
      overlay.addEventListener("click", function(e) {
        if (e.target === overlay) close();
      });
      document.addEventListener("keydown", function(e) {
        if (e.key === "Escape" && document.getElementById("agent-editor-overlay")) close();
      });
      setTimeout(function() {
        var i = document.getElementById("ae-name");
        if (i) i.focus();
      }, 80);
    }
    function loadExtensions() {
      setBody('<div class="admin-loading">\u52A0\u8F7D\u4E2D\u2026</div>');
      api("/extensions").then(function(res) {
        cache.extensions = res.data || [];
        renderExtensions();
      }).catch(function(e) {
        setBody('<div class="admin-error">' + esc(e.message) + "</div>");
      });
    }
    function renderExtensions() {
      var list = cache.extensions;
      var html2 = '<div class="admin-toolbar"><span class="admin-count">' + list.length + " \u4E2A\u6269\u5C55 \xB7 \u6765\u6E90\uFF1A\u672C\u5730\u76EE\u5F55 + settings.packages</span></div>";
      if (list.length === 0) {
        html2 += '<div class="admin-empty">\u6CA1\u6709\u6269\u5C55\u3002\u53EF\u5728 ~/.pi/agent/extensions \u653E\u76EE\u5F55\uFF0C\u6216\u5728 settings.json \u7684 packages \u52A0 "npm:xxx"\u3002</div>';
      } else {
        html2 += '<div class="card-grid">';
        list.forEach(function(x3) {
          var typeIcon = x3.type === "local" ? "\u{1F4C1}" : x3.type === "package" ? "\u{1F4E6}" : "\u{1F517}";
          var typeLabel = x3.type === "local" ? "\u672C\u5730" : x3.type === "package" ? "npm\u5305" : "\u8DEF\u5F84";
          html2 += '<div class="config-card"><div class="config-card-head"><div class="config-card-name">' + typeIcon + " " + esc(x3.name) + '</div><span class="type-badge">' + typeLabel + '</span></div><div class="config-card-desc">' + esc(x3.description || "\u2014") + '</div><div class="config-card-meta">' + (x3.version ? '<span class="meta-item">v' + esc(x3.version) + "</span>" : "") + (x3.installed === false ? '<span class="meta-item meta-warn">\u672A\u5B89\u88C5</span>' : '<span class="meta-item meta-ok">\u5DF2\u5B89\u88C5</span>') + "</div>" + (x3.path ? '<div class="config-card-path" title="' + esc(x3.path) + '">' + esc(x3.path) + "</div>" : "") + "</div>";
        });
        html2 += "</div>";
      }
      setBody(html2);
    }
    function loadSkillsView() {
      setBody('<div class="admin-loading">\u52A0\u8F7D\u4E2D\u2026</div>');
      api("/skills").then(function(res) {
        cache.skills = res.data || [];
        renderSkillsView();
      }).catch(function(e) {
        setBody('<div class="admin-error">' + esc(e.message) + "</div>");
      });
    }
    function renderSkillsView() {
      var list = cache.skills;
      var html2 = '<div class="admin-toolbar"><span class="admin-count">' + list.length + " \u4E2A skill \xB7 \u7531 loadSkills() \u52A0\u8F7D</span></div>";
      if (list.length === 0) {
        html2 += '<div class="admin-empty">\u6CA1\u6709 skill\u3002\u53EF\u5728 ~/.pi/agent/skills \u653E SKILL.md\u3002</div>';
      } else {
        html2 += '<div class="card-grid">';
        list.forEach(function(s) {
          html2 += '<div class="config-card"><div class="config-card-head"><div class="config-card-name">\u{1F3AF} ' + esc(s.name) + "</div>" + (s.disableModelInvocation ? '<span class="type-badge">\u4EC5\u624B\u52A8</span>' : '<span class="type-badge type-badge-ok">\u53EF\u8C03\u7528</span>') + '</div><div class="config-card-desc">' + esc(s.description || "\u2014") + "</div>" + (s.baseDir ? '<div class="config-card-path" title="' + esc(s.baseDir) + '">' + esc(s.baseDir) + "</div>" : "") + "</div>";
        });
        html2 += "</div>";
      }
      setBody(html2);
    }
    function loadSettingsView() {
      setBody('<div class="admin-loading">\u52A0\u8F7D\u4E2D\u2026</div>');
      api("/settings").then(function(res) {
        cache.settings = res.data || {};
        renderSettingsView();
      }).catch(function(e) {
        setBody('<div class="admin-error">' + esc(e.message) + "</div>");
      });
    }
    function renderSettingsView() {
      var pretty = JSON.stringify(cache.settings, null, 2);
      var html2 = '<div class="admin-toolbar"><span class="admin-count">settings.json \xB7 \u76F4\u63A5\u7F16\u8F91 JSON\uFF08PATCH \u5408\u5E76\u4FDD\u5B58\uFF09</span><button class="btn-primary btn-sm" id="admin-settings-save">\u{1F4BE} \u4FDD\u5B58</button></div><div class="settings-editor-wrap"><textarea id="admin-settings-json" class="settings-editor" spellcheck="false">' + esc(pretty) + '</textarea></div><div class="admin-hint">\u26A0\uFE0F \u4FDD\u5B58\u4E3A\u5168\u91CF PATCH \u5408\u5E76\uFF08\u9876\u5C42\u5B57\u6BB5\u8986\u76D6\uFF09\u3002packages/extensions \u7B49\u6570\u7EC4\u5B57\u6BB5\u4F1A\u6574\u4F53\u66FF\u6362\u3002\u6539 packages \u540E\u9700\u91CD\u542F pi-bridge \u751F\u6548\u3002</div>';
      setBody(html2);
      var saveBtn = document.querySelector("#admin-settings-save");
      if (saveBtn) saveBtn.addEventListener("click", saveSettings);
    }
    function saveSettings() {
      var ta = document.getElementById("admin-settings-json");
      if (!ta) return;
      var obj;
      try {
        obj = JSON.parse(ta.value);
      } catch (e) {
        H4.toast("JSON \u683C\u5F0F\u9519\u8BEF: " + e.message, true);
        return;
      }
      api("/settings", { method: "PATCH", body: obj }).then(function(res) {
        cache.settings = res.data || obj;
        H4.toast("settings \u5DF2\u4FDD\u5B58");
        renderSettingsView();
      }).catch(function(e) {
        H4.toast("\u4FDD\u5B58\u5931\u8D25: " + e.message, true);
      });
    }
    var schedCache = [];
    function loadSchedules() {
      setBody('<div class="admin-loading">\u52A0\u8F7D\u4E2D\u2026</div>');
      api("/schedules").then(function(res) {
        schedCache = res.data || [];
        renderSchedules();
      }).catch(function(e) {
        setBody('<div class="admin-error">' + esc(e.message) + "</div>");
      });
    }
    function fmtSchedTime(ts) {
      if (!ts) return "\u2014";
      var d2 = new Date(ts);
      return d2.toLocaleDateString("zh-CN", { month: "2-digit", day: "2-digit" }) + " " + d2.toTimeString().slice(0, 5);
    }
    function fmtRunStatus(s) {
      return { success: "\u2705 \u6210\u529F", failed: "\u274C \u5931\u8D25", timeout: "\u23F1 \u8D85\u65F6", skipped: "\u23ED \u8DF3\u8FC7", running: "\u{1F504} \u8FD0\u884C\u4E2D" }[s] || s;
    }
    function cronHuman(cron) {
      if (!window.cronstrue || !cron) return "";
      try {
        return window.cronstrue.toString(cron);
      } catch (e) {
        return "";
      }
    }
    function renderSchedules() {
      var list = schedCache;
      var html2 = '<div class="admin-toolbar"><span class="admin-count">' + list.length + ' \u4E2A\u5B9A\u65F6\u4EFB\u52A1 \xB7 ~/.pi/agent/schedules.json</span><button class="btn-primary btn-sm" id="admin-sched-new">+ \u65B0\u5EFA\u4EFB\u52A1</button></div>';
      if (list.length === 0) {
        html2 += '<div class="admin-empty">\u8FD8\u6CA1\u6709\u5B9A\u65F6\u4EFB\u52A1\u3002\u70B9\u51FB\u300C\u65B0\u5EFA\u4EFB\u52A1\u300D\u521B\u5EFA\u3002</div>';
      } else {
        html2 += '<div class="card-grid">';
        list.forEach(function(t) {
          var human = cronHuman(t.cron);
          var badge = t.enabled ? '<span class="type-badge type-badge-ok">\u542F\u7528</span>' : '<span class="type-badge">\u505C\u7528</span>';
          html2 += '<div class="config-card" data-id="' + esc(t.id) + '"><div class="config-card-head"><div class="config-card-name">\u23F0 ' + esc(t.name) + '</div><div class="config-card-actions"><button class="icon-btn" data-act="run" title="\u7ACB\u5373\u8FD0\u884C">\u25B6\uFE0F</button><button class="icon-btn" data-act="edit" title="\u7F16\u8F91">\u270F\uFE0F</button><button class="icon-btn" data-act="del" title="\u5220\u9664">\u{1F5D1}</button></div></div><div class="config-card-desc">' + esc(t.prompt.slice(0, 100)) + (t.prompt.length > 100 ? "\u2026" : "") + '</div><div class="config-card-meta"><span class="meta-item">\u{1F4CB} <code>' + esc(t.cron) + "</code></span>" + (human ? '<span class="meta-item">' + esc(human) + "</span>" : "") + badge + '</div><div class="config-card-meta"><span class="meta-item">\u4E0A\u6B21: ' + esc(fmtSchedTime(t.lastRunAt)) + '</span><span class="meta-item">\u4E0B\u6B21: ' + esc(fmtSchedTime(t.nextRunAt)) + "</span>" + (t.model ? '<span class="meta-item">\u{1F9E0} ' + esc(t.model) + "</span>" : "") + "</div></div>";
        });
        html2 += "</div>";
      }
      setBody(html2);
      var newBtn = document.querySelector("#admin-sched-new");
      if (newBtn) newBtn.addEventListener("click", function() {
        scheduleEditor(null);
      });
      document.querySelectorAll("#admin-body .config-card[data-id]").forEach(function(card) {
        var cid = card.dataset.id;
        card.querySelector('[data-act="edit"]').addEventListener("click", function(e) {
          e.stopPropagation();
          scheduleEditor(cid);
        });
        card.querySelector('[data-act="del"]').addEventListener("click", function(e) {
          e.stopPropagation();
          deleteSchedule(cid);
        });
        card.querySelector('[data-act="run"]').addEventListener("click", function(e) {
          e.stopPropagation();
          runScheduleNow(cid);
        });
        card.addEventListener("click", function(e) {
          if (e.target.closest(".icon-btn")) return;
          loadScheduleRuns(cid);
        });
      });
    }
    function deleteSchedule(id) {
      var t = schedCache.find(function(x3) {
        return x3.id === id;
      });
      if (!t) return;
      if (!confirm("\u5220\u9664\u5B9A\u65F6\u4EFB\u52A1\u300C" + t.name + "\u300D\uFF1F")) return;
      api("/schedules/" + id, { method: "DELETE" }).then(function() {
        H4.toast("\u5DF2\u5220\u9664 " + t.name);
        loadSchedules();
      }).catch(function(e) {
        H4.toast("\u5220\u9664\u5931\u8D25: " + e.message, true);
      });
    }
    function runScheduleNow(id) {
      var t = schedCache.find(function(x3) {
        return x3.id === id;
      });
      if (!t) return;
      H4.toast("\u6B63\u5728\u8FD0\u884C\u300C" + t.name + "\u300D\u2026");
      api("/schedules/" + id + "/run", { method: "POST" }).then(function(res) {
        var run = res.data || {};
        H4.toast("\u4EFB\u52A1\u5B8C\u6210: " + fmtRunStatus(run.status));
        loadScheduleRuns(id);
      }).catch(function(e) {
        H4.toast("\u8FD0\u884C\u5931\u8D25: " + e.message, true);
      });
    }
    function scheduleEditor(id) {
      var t = id ? schedCache.find(function(x3) {
        return x3.id === id;
      }) : null;
      var isNew = !t;
      var existing = document.getElementById("sched-editor-overlay");
      if (existing) existing.remove();
      var overlay = document.createElement("div");
      overlay.id = "sched-editor-overlay";
      overlay.className = "ae-overlay";
      overlay.innerHTML = '<div class="ae-dialog ae-dialog-wide"><div class="ae-header"><span>' + (isNew ? "\u65B0\u5EFA\u5B9A\u65F6\u4EFB\u52A1" : "\u7F16\u8F91\u5B9A\u65F6\u4EFB\u52A1") + '</span><button class="ae-close" id="se-close">\u2715</button></div><div class="ae-body"><div class="ae-field"><label>\u4EFB\u52A1\u540D\u79F0</label><input id="se-name" value="' + esc(t ? t.name : "") + '" placeholder="\u5982 \u6BCF\u65E5\u96C6\u7FA4\u5DE1\u68C0"></div><div class="ae-field"><label>Prompt\uFF08\u53D1\u7ED9 agent \u7684\u6307\u4EE4\uFF09</label><textarea id="se-prompt" rows="5" placeholder="\u68C0\u67E5\u96C6\u7FA4\u72B6\u6001\uFF0C\u5982\u6709\u5F02\u5E38\u8BF7\u8BE6\u7EC6\u63CF\u8FF0\u2026">' + esc(t ? t.prompt : "") + '</textarea></div><div class="ae-row"><div class="ae-field"><label>\u9891\u7387</label><select id="se-freq"><option value="minute">\u6BCF\u5206\u949F</option><option value="hour">\u6BCF\u5C0F\u65F6</option><option value="day">\u6BCF\u5929</option><option value="week">\u6BCF\u5468</option><option value="month">\u6BCF\u6708</option><option value="custom">\u81EA\u5B9A\u4E49</option></select></div><div class="ae-field" id="se-time-wrap"><label>\u65F6\u95F4 (HH:MM)</label><input id="se-time" type="time" value="09:00"></div><div class="ae-field" id="se-dow-wrap" style="display:none"><label>\u661F\u671F\u51E0</label><select id="se-dow"><option value="1">\u5468\u4E00</option><option value="2">\u5468\u4E8C</option><option value="3">\u5468\u4E09</option><option value="4">\u5468\u56DB</option><option value="5">\u5468\u4E94</option><option value="6">\u5468\u516D</option><option value="0">\u5468\u65E5</option></select></div><div class="ae-field" id="se-dom-wrap" style="display:none"><label>\u51E0\u53F7</label><input id="se-dom" type="number" min="1" max="31" value="1"></div><div class="ae-field" id="se-min-wrap" style="display:none"><label>\u7B2C\u51E0\u5206\u949F</label><input id="se-min" type="number" min="0" max="59" value="0"></div></div><div class="ae-field"><label>Cron \u8868\u8FBE\u5F0F</label><input id="se-cron" value="' + esc(t ? t.cron : "0 9 * * *") + '" placeholder="0 9 * * 1-5"><div class="cron-preview" id="se-cron-preview"></div></div><div class="ae-row"><div class="ae-field"><label>\u6A21\u578B\uFF08\u7A7A=\u9ED8\u8BA4\uFF09</label><input id="se-model" value="' + esc(t ? t.model || "" : "") + '" placeholder="\u5982 glm5-cdp"></div><div class="ae-field"><label>\u5DE5\u4F5C\u76EE\u5F55\uFF08\u7A7A=\u9ED8\u8BA4\uFF09</label><input id="se-cwd" value="' + esc(t ? t.cwd || "" : "") + '" placeholder="/Users/honglichang/ai-home"></div></div><div class="ae-row ae-checks"><label class="ae-check"><input type="checkbox" id="se-enabled"' + (!t || t.enabled ? " checked" : "") + '> \u542F\u7528</label></div></div><div class="ae-footer"><button class="btn-sm" id="se-cancel">\u53D6\u6D88</button><button class="btn-primary btn-sm" id="se-save">\u4FDD\u5B58</button></div></div>';
      document.body.appendChild(overlay);
      if (t) {
        var parts = t.cron.split(/\s+/);
        var pm = parts[0], ph = parts[1], pdom = parts[2], pdow = parts[4];
        var freq = "custom";
        if (pm === "*" && ph === "*") freq = "minute";
        else if (ph === "*" && pdom === "*" && pdow === "*") freq = "hour";
        else if (pdom === "*" && pdow === "*") freq = "day";
        else if (pdom === "*") freq = "week";
        else if (pdow === "*") freq = "month";
        document.getElementById("se-freq").value = freq;
        if (ph !== "*" && ph) document.getElementById("se-time").value = String(ph).padStart(2, "0") + ":" + String(pm).padStart(2, "0");
        if (freq === "hour") document.getElementById("se-min").value = pm;
        if (freq === "week") document.getElementById("se-dow").value = pdow || "1";
        if (freq === "month") document.getElementById("se-dom").value = pdom || "1";
      }
      function updateFreqUI() {
        var freq2 = document.getElementById("se-freq").value;
        document.getElementById("se-time-wrap").style.display = freq2 === "minute" || freq2 === "hour" || freq2 === "custom" ? "none" : "";
        document.getElementById("se-dow-wrap").style.display = freq2 === "week" ? "" : "none";
        document.getElementById("se-dom-wrap").style.display = freq2 === "month" ? "" : "none";
        document.getElementById("se-min-wrap").style.display = freq2 === "hour" ? "" : "none";
        document.getElementById("se-cron").readOnly = freq2 !== "custom";
        updateCronFromFreq();
      }
      function updateCronFromFreq() {
        var freq2 = document.getElementById("se-freq").value;
        if (freq2 === "custom") {
          updateCronPreview();
          return;
        }
        var cron = "";
        if (freq2 === "minute") cron = "* * * * *";
        if (freq2 === "hour") cron = (document.getElementById("se-min").value || "0") + " * * * *";
        if (freq2 === "day" || freq2 === "week" || freq2 === "month") {
          var time = (document.getElementById("se-time").value || "09:00").split(":");
          var h2 = time[0] || "9", mi = time[1] || "0";
          if (freq2 === "day") cron = mi + " " + h2 + " * * *";
          if (freq2 === "week") cron = mi + " " + h2 + " * * " + (document.getElementById("se-dow").value || "1");
          if (freq2 === "month") cron = mi + " " + h2 + " " + (document.getElementById("se-dom").value || "1") + " * *";
        }
        document.getElementById("se-cron").value = cron;
        updateCronPreview();
      }
      function updateCronPreview() {
        var cron = document.getElementById("se-cron").value.trim();
        var el = document.getElementById("se-cron-preview");
        if (!cron) {
          el.textContent = "";
          return;
        }
        try {
          el.textContent = window.cronstrue ? window.cronstrue.toString(cron) : "";
        } catch (e) {
          el.textContent = "\u26A0\uFE0F \u65E0\u6548\u7684 cron \u8868\u8FBE\u5F0F";
        }
      }
      document.getElementById("se-freq").addEventListener("change", updateFreqUI);
      ["se-time", "se-dow", "se-dom", "se-min"].forEach(function(fid) {
        var el = document.getElementById(fid);
        if (el) el.addEventListener("change", updateCronFromFreq);
      });
      document.getElementById("se-cron").addEventListener("input", updateCronPreview);
      updateFreqUI();
      function close() {
        overlay.remove();
      }
      function collect() {
        return {
          name: document.getElementById("se-name").value.trim(),
          prompt: document.getElementById("se-prompt").value,
          cron: document.getElementById("se-cron").value.trim(),
          model: document.getElementById("se-model").value.trim(),
          cwd: document.getElementById("se-cwd").value.trim(),
          enabled: document.getElementById("se-enabled").checked
        };
      }
      function save() {
        var data = collect();
        if (!data.name) {
          H4.toast("\u540D\u79F0\u4E0D\u80FD\u4E3A\u7A7A", true);
          return;
        }
        if (!data.prompt) {
          H4.toast("Prompt \u4E0D\u80FD\u4E3A\u7A7A", true);
          return;
        }
        if (!data.cron) {
          H4.toast("Cron \u8868\u8FBE\u5F0F\u4E0D\u80FD\u4E3A\u7A7A", true);
          return;
        }
        var req = isNew ? api("/schedules", { method: "POST", body: data }) : api("/schedules/" + id, { method: "PUT", body: data });
        req.then(function() {
          H4.toast(isNew ? "\u5DF2\u521B\u5EFA" : "\u5DF2\u4FDD\u5B58");
          close();
          loadSchedules();
        }).catch(function(e) {
          H4.toast("\u4FDD\u5B58\u5931\u8D25: " + e.message, true);
        });
      }
      overlay.querySelector("#se-close").addEventListener("click", close);
      overlay.querySelector("#se-cancel").addEventListener("click", close);
      overlay.querySelector("#se-save").addEventListener("click", save);
      overlay.addEventListener("click", function(e) {
        if (e.target === overlay) close();
      });
      document.addEventListener("keydown", function(e) {
        if (e.key === "Escape" && document.getElementById("sched-editor-overlay")) close();
      });
      setTimeout(function() {
        var i = document.getElementById("se-name");
        if (i) i.focus();
      }, 80);
    }
    function loadScheduleRuns(taskId) {
      var t = schedCache.find(function(x3) {
        return x3.id === taskId;
      });
      setBody('<div class="admin-loading">\u52A0\u8F7D\u4E2D\u2026</div>');
      api("/schedules/" + taskId + "/runs").then(function(res) {
        renderScheduleRuns(res.data || [], t);
      }).catch(function(e) {
        setBody('<div class="admin-error">' + esc(e.message) + "</div>");
      });
    }
    function renderScheduleRuns(runs, task) {
      var html2 = '<div class="admin-toolbar"><button class="btn-sm" id="sched-runs-back">\u2190 \u8FD4\u56DE</button><span class="admin-count">\u23F0 ' + esc(task ? task.name : "") + " \xB7 \u8FD0\u884C\u5386\u53F2 (" + runs.length + ')</span><button class="btn-primary btn-sm" id="sched-runs-run">\u25B6\uFE0F \u7ACB\u5373\u8FD0\u884C</button></div>';
      if (runs.length === 0) {
        html2 += '<div class="admin-empty">\u8FD8\u6CA1\u6709\u8FD0\u884C\u8BB0\u5F55\u3002</div>';
      } else {
        html2 += '<div class="run-list">';
        runs.forEach(function(r) {
          var d2 = new Date(r.startedAt);
          var timeStr = d2.toLocaleDateString("zh-CN") + " " + d2.toTimeString().slice(0, 8);
          var dur = r.durationMs != null ? r.durationMs < 1e3 ? r.durationMs + "ms" : Math.round(r.durationMs / 1e3) + "s" : "\u2014";
          var snippet = r.snippet ? '<div class="run-snippet">' + esc(r.snippet) + "</div>" : "";
          var err = r.error ? '<div class="run-error">\u26A0\uFE0F ' + esc(r.error) + "</div>" : "";
          var link = r.sessionId ? '<a class="run-session-link" data-sid="' + esc(r.sessionId) + '">\u67E5\u770B\u5BF9\u8BDD \u2192</a>' : "";
          html2 += '<div class="run-item"><div class="run-item-head"><span class="run-status">' + fmtRunStatus(r.status) + '</span><span class="run-time">' + esc(timeStr) + '</span><span class="run-dur">' + dur + "</span></div>" + snippet + err + link + "</div>";
        });
        html2 += "</div>";
      }
      setBody(html2);
      document.querySelector("#sched-runs-back").addEventListener("click", loadSchedules);
      var runBtn = document.querySelector("#sched-runs-run");
      if (runBtn) runBtn.addEventListener("click", function() {
        if (task) runScheduleNow(task.id);
      });
      document.querySelectorAll(".run-session-link").forEach(function(link) {
        link.addEventListener("click", function() {
          var sid = link.dataset.sid;
          if (sid && H4.enterSession) H4.enterSession(sid, "chat");
        });
      });
    }
    H4.openAdmin = openAdmin;
    H4.loadAgents = loadAgents;
    H4.loadExtensions = loadExtensions;
    H4.loadSchedules = loadSchedules;
  })();

  // web/chat/js/app.js
  window.Hermes = window.Hermes || {};
  (function() {
    "use strict";
    const $3 = window.Hermes.$;
    const state = window.Hermes.state;
    const dom = window.Hermes.dom;
    function autoResize(el) {
      el.style.height = "auto";
      el.style.height = Math.min(el.scrollHeight, 200) + "px";
    }
    document.addEventListener("click", function(e) {
      const btn = e.target.closest("[data-action]");
      if (!btn) return;
      const action = btn.dataset.action;
      const parent = btn.parentElement;
      if (!parent) return;
      if (action === "toggle-ow-tl") {
        const tlContainer = btn.parentElement;
        if (tlContainer && tlContainer.classList.contains("ow-tl")) {
          const items = Array.from(tlContainer.querySelectorAll(".ow-tl-item"));
          const idx = items.indexOf(btn);
          const owTools = tlContainer.parentElement;
          if (owTools) {
            const panels = owTools.querySelectorAll(".ow-panels .ow-ep");
            if (panels[idx]) {
              const wasShown = panels[idx].classList.contains("ow-show");
              panels.forEach((p2) => p2.classList.remove("ow-show"));
              if (!wasShown) panels[idx].classList.add("ow-show");
            }
          }
        }
      } else if (action === "toggle-tool-result") {
        if (parent.classList.contains("tool-result-expanded")) {
          parent.classList.remove("tool-result-expanded");
          parent.classList.add("tool-result-collapsed");
        } else if (parent.classList.contains("tool-result-collapsed")) {
          parent.classList.remove("tool-result-collapsed");
        } else {
          parent.classList.add("tool-result-expanded");
        }
      } else if (action === "toggle-thinking") {
        const block = parent;
        if (block.classList.contains("thinking-expanded")) {
          block.classList.remove("thinking-expanded");
          block.classList.add("thinking-collapsed");
        } else if (block.classList.contains("thinking-collapsed")) {
          block.classList.remove("thinking-collapsed");
        } else {
          block.classList.add("thinking-expanded");
        }
      } else if (action === "toggle-tools-collapsed") {
        parent.classList.toggle("tools-collapsed");
      }
    });
    function bindEvents() {
      const H4 = window.Hermes;
      let searchTimer;
      dom.searchInput.addEventListener("input", (e) => {
        clearTimeout(searchTimer);
        searchTimer = setTimeout(() => H4.searchSessions(e.target.value.trim()), 300);
      });
      if (dom.chatMessages) {
        dom.chatMessages.addEventListener("scroll", function() {
          if (H4._updateScrollBtn) H4._updateScrollBtn();
        }, { passive: true });
      }
      dom.chatMessages.addEventListener("click", function(e) {
        var btn = e.target.closest(".turn-edit-btn");
        if (!btn) return;
        var msgId = btn.dataset.msgId;
        if (!msgId) return;
        var sid = state.focusedSessionId;
        if (!sid) return;
        var msgs = H4.getMsgs(sid);
        if (!msgs) return;
        for (var i = 0; i < msgs.length; i++) {
          if (String(msgs[i].id || "") === msgId && msgs[i].role === "user") {
            dom.chatInput.value = msgs[i].content || "";
            dom.chatInput.focus();
            autoResize(dom.chatInput);
            H4.toast("\u5DF2\u8F7D\u5165\u6D88\u606F\uFF0C\u4FEE\u6539\u540E\u53D1\u9001");
            return;
          }
        }
      });
      $3("#btn-new-chat").addEventListener("click", () => H4.createNewChat());
      $3("#btn-resume").addEventListener("click", () => {
        if (state.focusedSessionId) H4.enterSession(state.focusedSessionId, "chat");
      });
      $3("#btn-exit-chat").addEventListener("click", H4.exitChatMode);
      $3("#btn-view-stream").addEventListener("click", () => {
        if (state.focusedSessionId) H4.enterSession(state.focusedSessionId, "chat");
      });
      $3("#btn-resume-new-stream").addEventListener("click", () => {
        const streams = state.activeStreams;
        for (const sid of Object.keys(streams)) {
          if (!streams[sid].finished) {
            H4.enterSession(sid, "chat");
            return;
          }
        }
      });
      $3("#btn-toggle-tools").addEventListener("click", function() {
        state.showTools = !state.showTools;
        this.classList.toggle("active", state.showTools);
        if (state.focusedSessionId && state.viewMode !== "chat") {
          const msgs = H4.getMsgs(state.focusedSessionId);
          if (msgs) H4.renderMessages(msgs, dom.messageList);
        }
      });
      $3("#btn-export-session").addEventListener("click", () => {
        if (state.focusedSessionId) H4.exportSession(state.focusedSessionId);
      });
      $3("#btn-fork-session").addEventListener("click", async () => {
        if (!state.focusedSessionId) return;
        const btn = $3("#btn-fork-session");
        btn.disabled = true;
        btn.textContent = "\u23F3 Forking...";
        try {
          const data = await H4.api("/sessions/" + state.focusedSessionId + "/fork", { method: "POST" });
          await H4.loadSessions();
          H4.enterSession(data.session_id, "chat");
        } catch (e) {
          alert("Fork \u5931\u8D25: " + e.message);
        } finally {
          btn.disabled = false;
          btn.textContent = "\u{1F500} \u5F00\u65B0\u4F1A\u8BDD";
        }
      });
      $3("#btn-delete-session").addEventListener("click", () => {
        if (state.focusedSessionId) H4.deleteSession(state.focusedSessionId);
      });
      $3("#btn-send").addEventListener("click", H4.sendMessage);
      $3("#btn-stop").addEventListener("click", () => {
        H4.abortCurrentStream();
        dom.chatInput.disabled = false;
        dom.chatInput.focus();
      });
      dom.chatInput.addEventListener("keydown", (e) => {
        if (H4.slashState && H4.slashState().visible) {
          const ss = H4.slashState();
          if (e.key === "ArrowDown") {
            e.preventDefault();
            H4.slashNavigate(1);
            return;
          }
          if (e.key === "ArrowUp") {
            e.preventDefault();
            H4.slashNavigate(-1);
            return;
          }
          if (e.key === "Enter" || e.key === "Tab") {
            if (ss.activeIndex >= 0) {
              e.preventDefault();
              H4.slashSelect();
              return;
            }
          }
          if (e.key === "Escape") {
            H4.hideSlashMenu();
            return;
          }
        }
        if (e.key === "Enter" && !e.shiftKey) {
          e.preventDefault();
          H4.sendMessage();
        }
        if (!H4.slashState || !H4.slashState().visible) {
          if (e.key === "ArrowUp" && dom.chatInput.selectionStart === 0) {
            var prev = H4.getPrevInputHistory();
            if (prev !== null) {
              e.preventDefault();
              dom.chatInput.value = prev;
              dom.chatInput.setSelectionRange(0, 0);
            }
          }
          if (e.key === "ArrowDown" && dom.chatInput.selectionStart === dom.chatInput.value.length) {
            var next = H4.getNextInputHistory();
            if (next !== null) {
              e.preventDefault();
              dom.chatInput.value = next;
            }
          }
        }
      });
      dom.chatInput.addEventListener("paste", function(e) {
        var items = e.clipboardData && e.clipboardData.items;
        if (!items) return;
        for (var i = 0; i < items.length; i++) {
          if (items[i].type && items[i].type.indexOf("image/") === 0) {
            e.preventDefault();
            var file = items[i].getAsFile();
            if (file) H4.handleImageFile(file);
            return;
          }
        }
      });
      var _dragCounter = 0;
      dom.chatMessages.addEventListener("dragenter", function(e) {
        e.preventDefault();
        _dragCounter++;
        document.body.classList.add("drag-active");
      });
      dom.chatMessages.addEventListener("dragleave", function(e) {
        _dragCounter--;
        if (_dragCounter <= 0) {
          _dragCounter = 0;
          document.body.classList.remove("drag-active");
        }
      });
      dom.chatMessages.addEventListener("dragover", function(e) {
        e.preventDefault();
      });
      dom.chatMessages.addEventListener("drop", function(e) {
        e.preventDefault();
        _dragCounter = 0;
        document.body.classList.remove("drag-active");
        var files = e.dataTransfer && e.dataTransfer.files;
        if (!files || files.length === 0) return;
        for (var i = 0; i < files.length; i++) {
          if (files[i].type && files[i].type.indexOf("image/") === 0) {
            H4.handleImageFile(files[i]);
          }
        }
      });
      dom.chatInput.addEventListener("input", function() {
        autoResize(this);
        const sq = H4.getSlashQuery();
        if (sq && sq.query.startsWith("/")) {
          const filtered = H4.filterSlashCommands(sq.query);
          H4.renderSlashMenu(filtered, sq.query);
        } else {
          H4.hideSlashMenu();
        }
      });
      document.addEventListener("click", (e) => {
        const ss = H4.slashState ? H4.slashState() : null;
        if (ss && ss.visible && !dom.slashMenu.contains(e.target) && e.target !== dom.chatInput) {
          H4.hideSlashMenu();
        }
      });
      const btnTheme = document.getElementById("btn-theme");
      if (btnTheme) btnTheme.addEventListener("click", toggleTheme);
      window.addEventListener("hashchange", handleHashChange);
    }
    function handleHashChange() {
      const projMatch = location.hash.match(/#\/p\/([^/]+)/);
      if (projMatch && window.Hermes.switchProject) {
        window.Hermes.switchProject(decodeURIComponent(projMatch[1]));
      }
      const route = window.Hermes.restoreFromURL();
      if (route) {
        window.Hermes.enterSession(route.sid, route.mode);
      }
    }
    function initTheme() {
      const saved = localStorage.getItem("hermes-theme");
      if (saved === "dark" || !saved && window.matchMedia("(prefers-color-scheme: dark)").matches) {
        document.documentElement.classList.add("dark");
      }
      updateThemeIcon();
      window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", (e) => {
        if (!localStorage.getItem("hermes-theme")) {
          document.documentElement.classList.toggle("dark", e.matches);
          updateThemeIcon();
        }
      });
    }
    function toggleTheme() {
      document.documentElement.classList.toggle("dark");
      localStorage.setItem("hermes-theme", document.documentElement.classList.contains("dark") ? "dark" : "light");
      updateThemeIcon();
    }
    function updateThemeIcon() {
      const btn = document.getElementById("btn-theme");
      if (btn) btn.textContent = document.documentElement.classList.contains("dark") ? "\u2600\uFE0F" : "\u{1F319}";
    }
    async function init() {
      window.Hermes.initDom();
      initTheme();
      bindEvents();
      window.Hermes.initSessionListEvents();
      window.Hermes.initMessageActions();
      window.Hermes.initShortcuts();
      if (window.Hermes.initProjects) {
        await window.Hermes.initProjects();
      }
      if (window.Hermes.bindProjectEvents) window.Hermes.bindProjectEvents();
      await window.Hermes.loadSessions();
      window.Hermes.renderQuickStats();
      window.Hermes.checkGateway();
      window.Hermes.loadContextInfo();
      window.Hermes.loadProviders();
      var _gatewayTimer = setInterval(window.Hermes.checkGateway, 3e4);
      var _ctxTimer = setInterval(function() {
        window.Hermes.loadContextInfo(state.focusedSessionId);
      }, 15e3);
      document.addEventListener("visibilitychange", function() {
        if (document.hidden) {
          clearInterval(_gatewayTimer);
          clearInterval(_ctxTimer);
        } else {
          window.Hermes.checkGateway();
          window.Hermes.loadContextInfo(state.focusedSessionId, true);
          _gatewayTimer = setInterval(window.Hermes.checkGateway, 3e4);
          _ctxTimer = setInterval(function() {
            window.Hermes.loadContextInfo(state.focusedSessionId);
          }, 15e3);
        }
      });
      document.querySelectorAll(".sidebar-nav .nav-btn[data-admin]").forEach(function(btn) {
        btn.addEventListener("click", function() {
          window.Hermes.openAdmin(btn.dataset.admin);
        });
      });
      const providerTrigger = document.getElementById("provider-trigger");
      if (providerTrigger) {
        providerTrigger.addEventListener("click", function(e) {
          e.stopPropagation();
          window.Hermes.openModelModal();
        });
      }
      const route = window.Hermes.restoreFromURL();
      if (route) {
        window.Hermes.enterSession(route.sid, route.mode);
      }
      var _offlineBar = null;
      function _getOfflineBar() {
        if (_offlineBar) return _offlineBar;
        _offlineBar = document.createElement("div");
        _offlineBar.className = "offline-bar";
        _offlineBar.textContent = "\u26A0 \u7F51\u7EDC\u5DF2\u65AD\u5F00";
        _offlineBar.style.display = "none";
        document.body.insertBefore(_offlineBar, document.body.firstChild);
        return _offlineBar;
      }
      window.addEventListener("offline", function() {
        var bar = _getOfflineBar();
        bar.style.display = "block";
      });
      window.addEventListener("online", function() {
        var bar = _getOfflineBar();
        bar.style.display = "none";
        H.checkGateway();
        H.loadContextInfo(state.focusedSessionId, true);
      });
      var _searchBar = null;
      var _searchMatches = [];
      var _searchIdx = -1;
      function _getSearchBar() {
        if (_searchBar) return _searchBar;
        _searchBar = document.createElement("div");
        _searchBar.className = "chat-search-bar";
        _searchBar.style.display = "none";
        _searchBar.innerHTML = '<input type="text" class="chat-search-input" placeholder="\u641C\u7D22\u6D88\u606F..." /><span class="chat-search-count"></span><button class="chat-search-close">\u2715</button>';
        var chatView = document.getElementById("chat-view") || document.querySelector(".chat-main");
        if (chatView) {
          chatView.style.position = "relative";
          chatView.insertBefore(_searchBar, chatView.firstChild);
        }
        var input = _searchBar.querySelector(".chat-search-input");
        var countEl = _searchBar.querySelector(".chat-search-count");
        var closeBtn = _searchBar.querySelector(".chat-search-close");
        input.addEventListener("input", function() {
          _doSearch(input.value);
        });
        input.addEventListener("keydown", function(e) {
          if (e.key === "Enter") {
            e.preventDefault();
            _navSearch(e.shiftKey ? -1 : 1);
          }
          if (e.key === "Escape") {
            _closeSearch();
          }
        });
        closeBtn.addEventListener("click", _closeSearch);
        return _searchBar;
      }
      function _doSearch(query) {
        _searchMatches = [];
        _searchIdx = -1;
        var countEl = _searchBar.querySelector(".chat-search-count");
        if (!query || query.length < 2) {
          countEl.textContent = "";
          _clearHighlight();
          return;
        }
        var container = dom.chatMessages;
        if (!container) return;
        var turns = container.querySelectorAll(".turn");
        var lowerQ = query.toLowerCase();
        turns.forEach(function(turn) {
          var text2 = turn.textContent.toLowerCase();
          if (text2.indexOf(lowerQ) >= 0) {
            _searchMatches.push(turn);
          }
        });
        countEl.textContent = _searchMatches.length > 0 ? "1/" + _searchMatches.length : "\u65E0\u7ED3\u679C";
        if (_searchMatches.length > 0) {
          _searchIdx = 0;
          _scrollToMatch();
        }
      }
      function _navSearch(dir) {
        if (_searchMatches.length === 0) return;
        _searchIdx = (_searchIdx + dir + _searchMatches.length) % _searchMatches.length;
        _scrollToMatch();
        var countEl = _searchBar.querySelector(".chat-search-count");
        countEl.textContent = _searchIdx + 1 + "/" + _searchMatches.length;
      }
      function _scrollToMatch() {
        if (_searchIdx < 0 || _searchIdx >= _searchMatches.length) return;
        var el = _searchMatches[_searchIdx];
        _clearHighlight();
        el.classList.add("search-highlight");
        el.scrollIntoView({ behavior: "smooth", block: "center" });
      }
      function _clearHighlight() {
        var container = dom.chatMessages;
        if (!container) return;
        container.querySelectorAll(".search-highlight").forEach(function(el) {
          el.classList.remove("search-highlight");
        });
      }
      function _openSearch() {
        var bar = _getSearchBar();
        bar.style.display = "flex";
        var input = bar.querySelector(".chat-search-input");
        input.value = "";
        input.focus();
      }
      function _closeSearch() {
        if (!_searchBar) return;
        _searchBar.style.display = "none";
        _clearHighlight();
        _searchMatches = [];
      }
      document.addEventListener("keydown", function(e) {
        if ((e.ctrlKey || e.metaKey) && e.key === "f") {
          if (state.viewMode === "chat") {
            e.preventDefault();
            _openSearch();
          }
        }
      });
    }
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", init);
    } else {
      init();
    }
  })();
})();
//# sourceMappingURL=chat.bundle.js.map
