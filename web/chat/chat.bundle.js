(() => {
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
`), c2 = u2.replace(this.rules.other.blockquoteSetextReplace, `
    $1`).replace(this.rules.other.blockquoteSetextReplace2, "");
          s = s ? `${s}
${u2}` : u2, r = r ? `${r}
${c2}` : c2;
          let h2 = this.lexer.state.top;
          if (this.lexer.state.top = true, this.lexer.blockTokens(c2, i, true), this.lexer.state.top = h2, n.length === 0) break;
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
          let a = false, u2 = "", c2 = "";
          if (!(t = i.exec(e)) || this.rules.block.hr.test(e)) break;
          u2 = t[0], e = e.substring(u2.length);
          let h2 = me(t[2].split(`
`, 1)[0], t[1].length), d2 = e.split(`
`, 1)[0], T2 = !h2.trim(), g2 = 0;
          if (this.options.pedantic ? (g2 = 2, c2 = h2.trimStart()) : T2 ? g2 = t[1].length + 1 : (g2 = h2.search(this.rules.other.nonSpaceChar), g2 = g2 > 4 ? 1 : g2, c2 = h2.slice(g2), g2 += t[1].length), T2 && this.rules.other.blankLine.test(d2) && (u2 += d2 + `
`, e = e.substring(d2.length + 1), a = true), !a) {
            let w2 = this.rules.other.nextBulletRegex(g2), M2 = this.rules.other.hrRegex(g2), ne2 = this.rules.other.fencesBeginRegex(g2), re = this.rules.other.headingBeginRegex(g2), be = this.rules.other.htmlBeginRegex(g2), Re = this.rules.other.blockquoteBeginRegex(g2);
            for (; e; ) {
              let N2 = e.split(`
`, 1)[0], D2;
              if (d2 = N2, this.options.pedantic ? (d2 = d2.replace(this.rules.other.listReplaceNesting, "  "), D2 = d2) : D2 = d2.replace(this.rules.other.tabCharGlobal, "    "), ne2.test(d2) || re.test(d2) || be.test(d2) || Re.test(d2) || w2.test(d2) || M2.test(d2)) break;
              if (D2.search(this.rules.other.nonSpaceChar) >= g2 || !d2.trim()) c2 += `
` + D2.slice(g2);
              else {
                if (T2 || h2.replace(this.rules.other.tabCharGlobal, "    ").search(this.rules.other.nonSpaceChar) >= 4 || ne2.test(h2) || re.test(h2) || M2.test(h2)) break;
                c2 += `
` + d2;
              }
              T2 = !d2.trim(), u2 += N2 + `
`, e = e.substring(N2.length + 1), h2 = D2.slice(g2);
            }
          }
          r.loose || (o ? r.loose = true : this.rules.other.doubleBlankLine.test(u2) && (o = true)), r.items.push({ type: "list_item", raw: u2, task: !!this.options.gfm && this.rules.other.listIsTask.test(c2), loose: false, text: c2, tokens: [] }), r.raw += u2;
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
            let c2 = this.rules.other.listTaskCheckbox.exec(a.raw);
            if (c2) {
              let h2 = { type: "checkbox", raw: c2[0] + " ", checked: c2[0] !== "[ ]" };
              a.checked = h2.checked, r.loose ? a.tokens[0] && ["paragraph", "text"].includes(a.tokens[0].type) && "tokens" in a.tokens[0] && a.tokens[0].tokens ? (a.tokens[0].raw = h2.raw + a.tokens[0].raw, a.tokens[0].text = h2.raw + a.tokens[0].text, a.tokens[0].tokens.unshift(h2)) : a.tokens.unshift({ type: "paragraph", raw: h2.raw, text: h2.raw, tokens: [h2] }) : a.tokens.unshift(h2);
            }
          } else a.task && (a.task = false);
          if (!r.loose) {
            let c2 = a.tokens.filter((d2) => d2.type === "space"), h2 = c2.length > 0 && c2.some((d2) => this.rules.other.anyLine.test(d2.raw));
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
        let i = [...s[0]].length - 1, o, p2, a = i, u2 = 0, c2 = s[0][0], h2 = n === c2, d2 = c2 === "*" ? this.rules.inline.emStrongRDelimAst : this.rules.inline.emStrongRDelimUnd;
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
          let c2 = [...s[0]][0].length, h2 = e.slice(0, i + s.index + c2 + p2), d2 = h2.slice(i, -i);
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
          let a = 1 / 0, u2 = e.slice(1), c2;
          this.options.extensions.startInline.forEach((h2) => {
            c2 = h2.call({ lexer: this }, u2), typeof c2 == "number" && c2 >= 0 && (a = Math.min(a, c2));
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
              let c2 = p2.apply(r, u2);
              return c2 === false && (c2 = a.apply(r, u2)), c2 || "";
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
              let c2 = p2.apply(r, u2);
              return c2 === false && (c2 = a.apply(r, u2)), c2;
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
              let c2 = p2.call(r, u2);
              return a.call(r, c2);
            } : r[o] = (...u2) => {
              if (this.defaults.async) return (async () => {
                let h2 = await p2.apply(r, u2);
                return h2 === false && (h2 = await a.apply(r, u2)), h2;
              })();
              let c2 = p2.apply(r, u2);
              return c2 === false && (c2 = a.apply(r, u2)), c2;
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
          let p2 = i.hooks ? await i.hooks.preprocess(n) : n, u2 = await (i.hooks ? await i.hooks.provideLexer(e) : e ? x.lex : x.lexInline)(p2, i), c2 = i.hooks ? await i.hooks.processAllTokens(u2) : u2;
          i.walkTokens && await Promise.all(this.walkTokens(c2, i.walkTokens));
          let d2 = await (i.hooks ? await i.hooks.provideParser(e) : e ? b.parse : b.parseInline)(c2, i);
          return i.hooks ? await i.hooks.postprocess(d2) : d2;
        })().catch(o);
        try {
          i.hooks && (n = i.hooks.preprocess(n));
          let a = (i.hooks ? i.hooks.provideLexer(e) : e ? x.lex : x.lexInline)(n, i);
          i.hooks && (a = i.hooks.processAllTokens(a)), i.walkTokens && this.walkTokens(a, i.walkTokens);
          let c2 = (i.hooks ? i.hooks.provideParser(e) : e ? b.parse : b.parseInline)(a, i);
          return i.hooks && (c2 = i.hooks.postprocess(c2)), c2;
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
  var xml = freeze(["xlink:href", "xml:id", "xlink:title", "xml:space", "xmlns:xlink"]);
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
    const DEFAULT_ALLOWED_ATTR = addToSet({}, [...html, ...svg, ...mathMl, ...xml]);
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
          addToSet(ALLOWED_ATTR, xml);
        }
        if (USE_PROFILES.svgFilters === true) {
          addToSet(ALLOWED_TAGS, svgFilters);
          addToSet(ALLOWED_ATTR, svg);
          addToSet(ALLOWED_ATTR, xml);
        }
        if (USE_PROFILES.mathMl === true) {
          addToSet(ALLOWED_TAGS, mathMl$1);
          addToSet(ALLOWED_ATTR, mathMl);
          addToSet(ALLOWED_ATTR, xml);
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
  var c = (n, r) => {
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
  var y2 = (n) => !n || typeof n != "string" || !n.includes(">") ? n : n.replace(bn, (r, e, i, o) => c(n, o) ? r : `${e}\\>${i}`);
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
    return c(n, i) || d(n, i) || En(n, e, i) ? n : L2(n) % 2 === 1 ? e.endsWith("*") ? `${n}*` : `${n}**` : n;
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
        if (!(c(n, t) || d(n, t)) && Q2(n) % 2 === 1) return `${n}_`;
      }
      return n;
    }
    let e = r[2], i = n.lastIndexOf(r[1]);
    return c(n, i) || d(n, i) || yn(n, e, i) ? n : Q2(n) % 2 === 1 ? `${n}__` : n;
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
    if (e === -1 || c(n, e) || d(n, e)) return n;
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
    if (!i || g.test(i) || c(n, e) || d(n, e)) return n;
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
  var Dn = (n, r, e) => !r || g.test(r) || c(n, e) || d(n, e) ? true : p(n, e, "*");
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
    return !r || r.index === void 0 || c(n, r.index) ? n : n.substring(0, r.index).trimEnd();
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
    if (o === -1 || c(n, o)) return null;
    let s = o > 0 && n[o - 1] === "!", t = s ? o - 1 : o, a = n.substring(0, t);
    if (s) return a;
    let l3 = n.substring(o + 1, r);
    return e === "text-only" ? `${a}${l3}` : `${a}[${l3}](streamdown:incomplete-link)`;
  };
  var an = (n, r) => {
    for (let e = 0; e < r; e++) if (n[e] === "[" && !c(n, e)) {
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
    if (e !== -1 && !c(n, e)) {
      let i = zn(n, e, r);
      if (i !== null) return i;
    }
    for (let i = n.length - 1; i >= 0; i -= 1) if (n[i] === "[" && !c(n, i)) {
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
    return c(n, o) ? r : `${e}\\~`;
  });
  var fn = (n) => {
    var e, i;
    let r = n.match(H3);
    if (r) {
      let o = r[2];
      if (!o || g.test(o)) return n;
      let s = n.lastIndexOf(r[1]);
      if (c(n, s) || d(n, s)) return n;
      if (((e = n.match(A2)) == null ? void 0 : e.length) % 2 === 1) return `${n}~~`;
    } else {
      let o = n.match(z2);
      if (o) {
        let s = n.lastIndexOf(o[0].slice(0, 2));
        if (c(n, s) || d(n, s)) return n;
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
      return String(str).replace(/[&<>"']/g, function(c2) {
        return ESC_MAP[c2];
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
      var diff = Math.floor(e - start);
      if (diff < 60) return diff + "s";
      if (diff < 3600) return Math.floor(diff / 60) + "m";
      return Math.floor(diff / 3600) + "h" + Math.floor(diff % 3600 / 60) + "m";
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
      return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
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
      try {
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
          if (H4._clearRenderTimer) H4._clearRenderTimer(sid);
          if (H4._stopLiveTimer) H4._stopLiveTimer();
          if (H4.clearStreamingMdCache) H4.clearStreamingMdCache();
          H4.renderCurrentChat();
        }
        backgroundReFetch(sid);
      } finally {
        delete state.activeStreams[sid];
      }
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
          var boundaryUser = cache.messages[offset];
          if (boundaryUser && boundaryUser.role === "user" && boundaryUser._localId) {
            for (var _bi = 0; _bi < freshMsgs.length; _bi++) {
              if (freshMsgs[_bi].role === "user" && freshMsgs[_bi].content === boundaryUser.content) {
                freshMsgs[_bi]._localId = boundaryUser._localId;
                break;
              }
            }
          }
          cache.messages = cache.messages.slice(0, offset).concat(freshMsgs);
          cache.version++;
          cache.isStale = false;
          cache.loadedAt = Date.now();
          if (state.focusedSessionId === sid && state.viewMode === "chat") {
            H4.renderCurrentChat();
          }
        } else if (freshMsgs.length >= cache.messages.length) {
          cache.messages = freshMsgs;
          cache.version++;
          cache.isStale = false;
          cache.loadedAt = Date.now();
          if (state.focusedSessionId === sid && state.viewMode === "chat") {
            H4.renderCurrentChat();
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
      if (prev !== sid && H4.clearMdCache) {
        H4.clearMdCache();
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
    var _hljsPromise = null;
    function loadHljs() {
      if (window.hljs) return Promise.resolve(window.hljs);
      if (_hljsPromise) return _hljsPromise;
      _hljsPromise = new Promise(function(resolve) {
        window.__hljsResolve = resolve;
        if (window.__hljsReady) {
          resolve(window.hljs);
          return;
        }
        var s = document.createElement("script");
        s.src = "./hljs.bundle.js";
        s.async = true;
        s.onerror = function() {
          _hljsPromise = null;
          resolve(void 0);
        };
        document.head.appendChild(s);
      });
      return _hljsPromise;
    }
    window.Hermes.loadHljs = loadHljs;
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
        } else if (lang && window.hljs && hljs.getLanguage(lang)) {
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
      scheduleIdleHighlight(root);
    };
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
      var c2 = _mdStreamCache[cacheKey];
      if (c2 && c2.text === text2) {
        return { stableHtml: c2.stableHtml || "", activeHtml: c2.activeHtml || "", stableChanged: false, fullHtml: c2.fullHtml || "" };
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
      var cachedBlocks = c2 && c2.blocks || [];
      var htmlBlocks = [];
      for (var bi = 0; bi < stableBlocks.length; bi++) {
        var btext = stableBlocks[bi];
        if (cachedBlocks[bi] && cachedBlocks[bi].text === btext) {
          htmlBlocks.push(cachedBlocks[bi]);
        } else {
          _streamingMode = true;
          var bh;
          try {
            bh = marked.parse(btext);
          } catch (e) {
            bh = "<p>" + esc(btext) + "</p>";
          } finally {
            _streamingMode = false;
          }
          if (typeof DOMPurify !== "undefined" && bh) {
            bh = DOMPurify.sanitize(bh, { ADD_TAGS: ["del", "input"], ADD_ATTR: ["type", "checked", "disabled"] });
          }
          htmlBlocks.push({ text: btext, html: bh });
          stableChanged = true;
        }
      }
      var sh = htmlBlocks.map(function(b3) {
        return b3.html;
      }).join("\n");
      c2 = { text: null, stableText, stableHtml: sh, blocks: htmlBlocks };
      _mdStreamCache[cacheKey] = c2;
      var BIG_BLOCK = 10 * 1024;
      var BIG_THROTTLE_MS = 200;
      var now = Date.now();
      var bigBlock = activeBlock.length > BIG_BLOCK;
      var throttled = bigBlock && c2._lastActiveParseAt && now - c2._lastActiveParseAt < BIG_THROTTLE_MS;
      var activeHtml;
      if (throttled) {
        activeHtml = c2.activeHtml || "";
      } else if (isPlainBlock(activeBlock)) {
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
        if (bigBlock) c2._lastActiveParseAt = now;
      }
      if (!throttled && typeof DOMPurify !== "undefined" && activeHtml) {
        activeHtml = DOMPurify.sanitize(activeHtml, { ADD_TAGS: ["del", "input"], ADD_ATTR: ["type", "checked", "disabled"] });
      }
      var full = (c2.stableHtml || "") + activeHtml;
      c2.text = text2;
      c2.fullHtml = full;
      c2.activeHtml = activeHtml;
      return { stableHtml: c2.stableHtml || "", activeHtml, stableChanged, fullHtml: full };
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
      var list = Array.prototype.slice.call(pending);
      loadHljs().then(function(hljs2) {
        if (!hljs2) return;
        var i = 0;
        function processOne(deadline) {
          while (i < list.length) {
            if (deadline && deadline.timeRemaining && deadline.timeRemaining() <= 0) break;
            var codeEl = list[i];
            try {
              var text2 = codeEl.textContent;
              var lang = codeEl.dataset.lang;
              if (lang && hljs2.getLanguage(lang)) {
                codeEl.innerHTML = hljs2.highlight(text2, { language: lang }).value;
              } else {
                codeEl.innerHTML = hljs2.highlightAuto(text2).value;
              }
            } catch (e) {
            }
            codeEl.classList.remove("need-auto-highlight");
            i++;
          }
          if (i < list.length) {
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
      });
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
    function clearMdCache() {
      _mdCache.clear();
    }
    window.Hermes.renderMarkdown = renderMarkdown;
    window.Hermes.renderStreamingMarkdown = renderStreamingMarkdown;
    window.Hermes.renderStreamingMarkdownSplit = renderStreamingMarkdownSplit;
    window.Hermes.clearStreamingMdCache = clearStreamingMdCache;
    window.Hermes.clearMdCache = clearMdCache;
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

  // web/chat/js/view-model.js
  window.Hermes = window.Hermes || {};
  (function() {
    "use strict";
    function uid() {
      return "l" + Date.now().toString(36) + "_" + Math.random().toString(36).slice(2, 10);
    }
    function msgText(content) {
      if (!content) return "";
      if (typeof content === "string") return content;
      if (Array.isArray(content)) {
        return content.filter(function(b3) {
          return b3 && b3.type === "text";
        }).map(function(b3) {
          return b3.text || "";
        }).join("");
      }
      try {
        return JSON.stringify(content);
      } catch (e) {
        return String(content);
      }
    }
    function hashStr(str) {
      var h2 = 2166136261;
      for (var i = 0; i < str.length; i++) {
        h2 ^= str.charCodeAt(i);
        h2 = h2 * 16777619 >>> 0;
      }
      return h2.toString(36);
    }
    function extractAssistantParts(a) {
      var text2 = "", reasoning = "", toolCalls = [];
      if (Array.isArray(a.content)) {
        var tParts = [], rParts = [];
        a.content.forEach(function(b3) {
          if (!b3 || typeof b3 !== "object") return;
          if (b3.type === "text" && b3.text) tParts.push(b3.text);
          else if (b3.type === "thinking" && (b3.thinking != null || b3.text)) rParts.push(b3.thinking != null ? b3.thinking : b3.text);
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
              return { name: tc.function ? tc.function.name : void 0, arguments: tc.function ? tc.function.arguments : void 0, id: tc.id || tc.call_id };
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
    function isStreamRemnant(a) {
      if (!a || a.role !== "assistant" || a._streaming) return false;
      if (typeof a.content !== "string") return false;
      return !!a._aborted || !!a._error || Array.isArray(a._toolSteps) && a._toolSteps.length > 0;
    }
    var _escMap = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" };
    function escHtml(s) {
      return String(s == null ? "" : s).replace(/[&<>"']/g, function(c2) {
        return _escMap[c2];
      });
    }
    function compactionCardHtml(summary) {
      var safe = escHtml(summary || "");
      return '<div class="compaction-result"><div class="compaction-head">\u2702\uFE0F \u4E0A\u4E0B\u6587\u5DF2\u538B\u7F29</div>' + (safe ? '<details class="compaction-summary"><summary>\u67E5\u770B\u538B\u7F29\u6458\u8981</summary><div class="compaction-summary-body">' + safe + "</div></details>" : "") + "</div>";
    }
    function buildTurns(messages) {
      const turns = [];
      var usedOtherKeys = {};
      var i = 0;
      var turnOrdinal = 0;
      if (!messages) return turns;
      function nextOtherKey(m3, contentText) {
        var base = m3._localId || m3.id;
        if (base) return String(base);
        var src = String(contentText || "");
        var key = "o" + hashStr((m3.role || "msg") + ":" + src.slice(0, 24));
        if (usedOtherKeys[key] != null) {
          var n = ++usedOtherKeys[key];
          key = key + "-" + n;
        } else {
          usedOtherKeys[key] = 0;
        }
        return key;
      }
      while (i < messages.length) {
        const m3 = messages[i];
        if (m3.role === "user") {
          var _userContent = typeof m3.content === "string" ? m3.content : msgText(m3.content);
          const userCopy = Object.assign({}, m3, { content: _userContent });
          var ukey = userCopy._localId || userCopy.id || "t" + turnOrdinal;
          turnOrdinal++;
          const turn = { key: String(ukey), type: "user", user: userCopy, steps: [] };
          i++;
          while (i < messages.length && messages[i].role !== "user") {
            const a = messages[i];
            if (a.role === "assistant" && a._streaming) {
              turn.steps.push({ streaming: a });
              i++;
            } else if (a.role === "assistant" && isStreamRemnant(a)) {
              var dec = decomposeStreaming(a);
              for (var di = 0; di < dec.steps.length; di++) turn.steps.push(dec.steps[di]);
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
          turns.push({ key: nextOtherKey(m3, m3._compactionHtml), type: "other", message: m3 });
          turnOrdinal++;
          i++;
          while (i < messages.length && messages[i].role !== "user") i++;
        } else if (m3.role === "compactionSummary") {
          var _key = nextOtherKey(m3, m3.summary || msgText(m3.content));
          turnOrdinal++;
          turns.push({
            key: _key,
            type: "other",
            message: { role: "system", _compactionHtml: compactionCardHtml(m3.summary || ""), _isCompaction: true }
          });
          i++;
          while (i < messages.length && messages[i].role !== "user") i++;
        } else {
          turns.push({ key: nextOtherKey(m3, msgText(m3.content)), type: "other", message: m3 });
          turnOrdinal++;
          i++;
        }
      }
      return turns;
    }
    function decomposeStreaming(sm) {
      var flags = {
        hasContent: !!(sm.content && sm.content.trim()),
        hasReasoning: !!(sm.reasoning && sm.reasoning.trim()),
        usage: sm._usage || null,
        aborted: !!sm._aborted,
        runningSet: {},
        toolTimes: {}
      };
      var steps = [];
      if (sm._toolSteps && sm._toolSteps.length > 0) {
        var toolCalls = sm._toolSteps.map(function(ts, idx) {
          return { name: ts.name || "unknown", arguments: ts.args, id: ts.toolCallId || "call_stream_" + idx };
        });
        var toolResults = [];
        sm._toolSteps.forEach(function(ts, idx) {
          var tcId = ts.toolCallId || "call_stream_" + idx;
          if (ts.result !== void 0 && ts.result !== null && ts.result !== "") {
            toolResults.push({
              role: "toolResult",
              toolCallId: tcId,
              content: typeof ts.result === "string" ? ts.result : JSON.stringify(ts.result),
              isError: !!ts.error
            });
          }
          if (ts.running) flags.runningSet[tcId] = true;
          flags.toolTimes[tcId] = {
            startTime: ts.startTime || null,
            endTime: ts.endTime || null,
            running: !!ts.running
          };
        });
        steps.push({
          assistant: { reasoning: sm.reasoning || "", content: "", timestamp: sm.timestamp },
          toolCalls,
          toolResults,
          hasMore: flags.hasContent
        });
      }
      if (flags.hasContent) {
        var finalReasoning = sm._toolSteps && sm._toolSteps.length > 0 ? "" : sm.reasoning || "";
        steps.push({
          assistant: { content: sm.content, reasoning: finalReasoning, timestamp: sm.timestamp },
          toolCalls: null,
          toolResults: [],
          hasMore: false
        });
      } else if (!sm._toolSteps || sm._toolSteps.length === 0) {
        if (flags.hasReasoning) {
          steps.push({
            assistant: { reasoning: sm.reasoning, content: "", timestamp: sm.timestamp },
            toolCalls: null,
            toolResults: [],
            hasMore: false,
            _reasoningActive: true
          });
        }
      }
      if (sm._error) {
        if (steps.length > 0) {
          steps[steps.length - 1]._error = sm._error;
        } else {
          steps.push({
            assistant: { content: "", reasoning: "", timestamp: sm.timestamp },
            toolCalls: null,
            toolResults: [],
            hasMore: false,
            _error: sm._error
          });
        }
      }
      if (sm._aborted && steps.length > 0) {
        steps[steps.length - 1]._aborted = true;
      }
      return { steps, flags };
    }
    var _cmCache = /* @__PURE__ */ new Map();
    var _CM_CACHE_MAX = 1024;
    function contentMarker(text2) {
      var s = String(text2 == null ? "" : text2);
      var cached = _cmCache.get(s);
      if (cached !== void 0) return cached;
      var m3 = s.length + ":" + hashStr(s);
      if (_cmCache.size >= _CM_CACHE_MAX) {
        var fk = _cmCache.keys().next().value;
        _cmCache.delete(fk);
      }
      _cmCache.set(s, m3);
      return m3;
    }
    function stepSig(step) {
      if (!step) return "?";
      var out = [];
      if (step.streaming) {
        var sm = step.streaming;
        out.push("S");
        out.push(contentMarker(sm.content));
        out.push(contentMarker(sm.reasoning));
        out.push("ab=" + (sm._aborted ? 1 : 0));
        out.push("ap=" + (sm._approval && !sm._approvalResolved ? 1 : 0));
        out.push("us=" + (sm._usage ? (sm._usage.total_tokens || 0) + ":" + (sm._usage.prompt_tokens || 0) : "-"));
        var tss = sm._toolSteps || [];
        out.push("ts=" + tss.length);
        tss.forEach(function(ts) {
          out.push((ts.toolCallId || "") + "|" + (ts.name || "") + "|r" + (ts.running ? 1 : 0) + "|e" + (ts.error ? 1 : 0) + "|" + contentMarker(ts.result));
        });
        return out.join("~");
      }
      if (step.assistant) {
        var a = step.assistant;
        out.push("A");
        out.push(contentMarker(a.content));
        out.push(contentMarker(a.reasoning));
        out.push("hm=" + (step.hasMore ? 1 : 0));
        if (step._reasoningActive) out.push("ra=1");
        var tcs = step.toolCalls || [];
        out.push("tc=" + tcs.length);
        tcs.forEach(function(tc) {
          out.push((tc.id || tc.toolCallId || "") + "|" + (tc.name || ""));
        });
        var trs = step.toolResults || [];
        out.push("tr=" + trs.length);
        trs.forEach(function(tr) {
          out.push((tr.toolCallId || tr.tool_call_id || "") + "|e" + (tr.isError ? 1 : 0) + "|" + contentMarker(msgText(tr.content)));
        });
        return out.join("~");
      }
      if (step.system) {
        out.push("SY:" + contentMarker(step.system.content) + ":" + (step.system._compactionHtml ? "html" : "-") + ":" + (step.system._isCompaction ? "comp" : "-"));
        return out.join("~");
      }
      if (step.orphan) {
        out.push("O:" + contentMarker(msgText(step.orphan.content)));
        return out.join("~");
      }
      return "?";
    }
    function turnSig(turn) {
      var parts = [];
      parts.push("type=" + turn.type);
      if (turn.type === "user") {
        parts.push("u=" + contentMarker(turn.user.content));
        parts.push("n=" + (turn.steps || []).length);
        (turn.steps || []).forEach(function(s) {
          parts.push(stepSig(s));
        });
      } else {
        parts.push("m=" + contentMarker(msgText(turn.message.content)));
        parts.push("c=" + (turn.message._compactionHtml ? "1" : "0") + (turn.message._isCompaction ? ":c" : ""));
      }
      return parts.join("|");
    }
    window.Hermes.uid = uid;
    window.Hermes.msgText = msgText;
    window.Hermes.hashStr = hashStr;
    window.Hermes.buildTurns = buildTurns;
    window.Hermes.turnSig = turnSig;
    window.Hermes.decomposeStreaming = decomposeStreaming;
    window.Hermes.isStreamRemnant = isStreamRemnant;
    window.Hermes.compactionCardHtml = compactionCardHtml;
    window.Hermes.extractAssistantParts = extractAssistantParts;
  })();

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
      return window.Hermes.msgText(content);
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
      const item = `<div class="ow-tl-item ${tlClass}" data-action="toggle-ow-tl" data-call-id="${esc(tcId || "")}">
        <span class="ow-tl-name">${esc(name)}</span>
        ${argsPreview ? '<span class="ow-tl-args">' + argsPreview + "</span>" : ""}
        ${durBadge}${errMark}
        <span class="ow-tl-stat">${statusIcon}</span>
      </div>`;
      const panel = `<div class="ow-ep" data-call-id="${esc(tcId || "")}">
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
    function groupIntoTurns(messages) {
      return window.Hermes.buildTurns(messages);
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
        stFlags.error = sm._error || "";
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
        if (steps.length === 0 && sm._streaming && !stFlags.error) {
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
      let errorStep = null;
      const toolSteps = [];
      steps.forEach((step) => {
        if (step.system || step.orphan) return;
        if (step._error && !errorStep) errorStep = step;
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
          var _ansId = "ans-" + ++window.Hermes.answerBlockCounter;
          html2 += '<div class="step-answer-wrap" id="' + _ansId + '">';
          html2 += '<div class="step-answer collapsible"><div class="md-stable">' + _sfSplit.stableHtml + '</div><div class="md-active">' + _sfSplit.activeHtml + "</div></div>";
          html2 += '<button class="collapse-btn" data-action="toggle-collapse" data-target="' + _ansId + '" style="display:none"><span class="arrow">\u25BC</span><span class="label">\u5C55\u5F00</span></button>';
          html2 += '<button class="copy-md-btn" data-action="copy-markdown" data-target="' + _ansId + '" title="\u590D\u5236 Markdown \u539F\u6587"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/></svg><span>\u590D\u5236</span></button>';
          html2 += '<textarea class="md-raw" readonly>' + esc(assistantContent) + "</textarea>";
          html2 += "</div>";
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
          var staticFinalClass = "step step-final" + (finalStep._aborted ? " _aborted" : "");
          html2 += '<div class="' + staticFinalClass + '">';
          html2 += '<div class="step-header"><span class="step-num step-num-final">\u2726</span><span class="step-label">\u56DE\u590D</span><span class="step-time">' + esc(agentTime) + "</span>" + totalBadge + "</div>";
          html2 += window.Hermes.renderAnswerBlock(assistantContent);
          html2 += "</div>";
        }
      }
      var _errMsg = isStreaming && stFlags.error ? stFlags.error : errorStep ? errorStep._error : "";
      if (_errMsg) {
        html2 += '<div class="step step-error"><div class="step-header"><span class="step-label">\u26A0\uFE0F \u51FA\u9519</span></div><div class="step-error-msg">' + esc(String(_errMsg)) + "</div></div>";
      }
      return html2;
    }
    function renderSingleTurnHTML(turn) {
      if (turn.type === "other") {
        const m3 = turn.message;
        if (m3._compactionHtml) {
          return `<div class="turn" data-key="${esc(String(turn.key || ""))}"><div class="step system-step compaction-step">${m3._compactionHtml}</div></div>`;
        }
        return `<div class="msg-bubble msg-${m3.role}" data-key="${esc(String(turn.key || ""))}"><div class="msg-content">${esc(_extractContentText(m3.content) || "")}</div></div>`;
      }
      const userId = turn.user.id || "";
      const userTime = turn.user.timestamp_fmt || fmtTime(turn.user.timestamp);
      const isStreamingTurn = turn.steps.some((s) => s.streaming);
      let html2 = `<div class="turn" data-msg-id="${esc(String(userId))}" data-key="${esc(String(turn.key || ""))}"${isStreamingTurn ? ' data-streaming="true"' : ""}>
      <div class="turn-user">
        <div class="turn-user-content">${window.Hermes.renderMarkdown(turn.user.content || "")}</div>
        <div class="turn-avatar user-avatar">U</div>
      </div>
      <div class="turn-time turn-time-user">${esc(userTime)}</div>`;
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
      if (!container) return;
      var sid = window.Hermes.state && window.Hermes.state.focusedSessionId || null;
      window.Hermes.renderFull(container, messages, sid);
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
      _ctxMenu.innerHTML = '<div class="ctx-menu-item" data-ctx="copy-text">\u{1F4CB} \u590D\u5236\u6587\u672C</div><div class="ctx-menu-item" data-ctx="export-turn">\u{1F4E4} \u5BFC\u51FA\u6B64\u8F6E</div><div class="ctx-menu-sep"></div><div class="ctx-menu-item ctx-menu-danger" data-ctx="delete-turn">\u{1F5D1} \u5220\u9664\u6B64\u8F6E\u5BF9\u8BDD</div>';
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
    window.Hermes.groupIntoTurns = groupIntoTurns;
    window.Hermes.renderTurnStepsHTML = renderTurnStepsHTML;
    window.Hermes.renderSingleTurnHTML = renderSingleTurnHTML;
    window.Hermes.renderToolCard = renderToolCard;
    window.Hermes.fmtTimelineDur = fmtTimelineDur;
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

  // web/chat/js/render.js
  window.Hermes = window.Hermes || {};
  (function() {
    "use strict";
    var H4 = window.Hermes;
    function _morph(el, html2) {
      if (window.morphdom) {
        try {
          var tmp = document.createElement("div");
          tmp.innerHTML = html2;
          window.morphdom(el, tmp, {
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
    function _elFromHtml(html2) {
      var tmp = document.createElement("div");
      tmp.innerHTML = html2;
      return tmp.firstElementChild;
    }
    function _streamStructSig(sm) {
      var _ts = sm._toolSteps || [];
      var _toolSig = _ts.map(function(s) {
        var base = (s.running ? "r" : s.result !== void 0 ? "d" : "p") + "|" + (s.toolCallId || "") + "|" + (s.name || "");
        return s.running ? base : base + "|" + (s.result != null ? String(s.result).length : 0);
      }).join(",");
      return [
        "tc=" + _ts.length,
        "ts=" + _toolSig,
        "hr=" + !!(sm.reasoning && sm.reasoning.trim()),
        "hc=" + !!(sm.content && sm.content.trim()),
        "ap=" + !!(sm._approval && !sm._approvalResolved),
        "sa=" + (sm._subagents ? sm._subagents.length : 0),
        "ab=" + !!sm._aborted,
        "er=" + !!sm._error,
        "us=" + !!(sm._usage && (sm._usage.total_tokens || sm._usage.prompt_tokens)),
        "qu=" + !!sm._queue
      ].join(";");
    }
    function _l3Patch(turnEl, sm, lastContent, lastReasoning) {
      var changed = false;
      var curContent = sm.content != null ? sm.content : "";
      var curReasoning = sm.reasoning != null ? sm.reasoning : "";
      if (lastContent !== curContent && sm.content != null) {
        var _finalBody = turnEl.querySelector(".step-final .step-answer");
        if (_finalBody) {
          var _sfSplit = H4.renderStreamingMarkdownSplit(sm.content, "sf");
          var _stableEl = _finalBody.querySelector(".md-stable");
          var _activeEl = _finalBody.querySelector(".md-active");
          if (_activeEl) {
            if (_sfSplit.stableChanged && _stableEl) _morph(_stableEl, _sfSplit.stableHtml);
            _morph(_activeEl, _sfSplit.activeHtml);
          } else {
            _morph(_finalBody, _sfSplit.fullHtml);
          }
          changed = true;
        }
      }
      if (lastReasoning !== curReasoning && sm.reasoning) {
        var _tmBody = turnEl.querySelector(".tm-active .tm-body");
        if (_tmBody) {
          var _tmOff = _tmBody.scrollHeight - _tmBody.scrollTop - _tmBody.clientHeight;
          var _tmStick = _tmOff < 24;
          _morph(_tmBody, H4.renderStreamingMarkdown(sm.reasoning.trim(), "tm"));
          _tmBody.scrollTop = _tmStick ? _tmBody.scrollHeight : Math.max(0, _tmBody.scrollHeight - _tmBody.clientHeight - _tmOff);
          changed = true;
        }
      }
      return changed;
    }
    function _l35PatchDurations(turnEl, sm) {
      var fmtDur = H4.fmtTimelineDur;
      if (!fmtDur) return;
      var steps = sm._toolSteps || [];
      var liveEls = turnEl.querySelectorAll(".ow-tl-dur-live");
      if (liveEls.length === 0) return;
      var now = Date.now();
      liveEls.forEach(function(el) {
        var item = el.closest("[data-call-id]");
        var cid = item ? item.getAttribute("data-call-id") : null;
        var ts = null;
        for (var i = 0; i < steps.length; i++) {
          if (steps[i].toolCallId === cid) {
            ts = steps[i];
            break;
          }
        }
        if (ts && ts.running && ts.startTime) {
          el.textContent = fmtDur((now - ts.startTime) / 1e3);
        }
      });
    }
    function _captureTurnUI(turnEl) {
      var openPanels = [];
      var panels = turnEl.querySelectorAll(".ow-panels .ow-ep");
      panels.forEach(function(p2, idx) {
        if (p2.classList.contains("ow-show")) {
          openPanels.push({ callId: p2.getAttribute("data-call-id") || null, index: idx });
        }
      });
      var collapsedAnswers = [];
      var answers = turnEl.querySelectorAll(".step-answer-wrap");
      answers.forEach(function(w2, idx) {
        var a = w2.querySelector(".step-answer.collapsible");
        if (a && a.classList.contains("collapsed")) collapsedAnswers.push(idx);
      });
      var ui = { openPanels, collapsedAnswers };
      var tl = turnEl.querySelector(".ow-tl");
      if (tl) {
        var tlOff = tl.scrollHeight - tl.scrollTop - tl.clientHeight;
        ui.tl = { stick: tlOff < 24, offset: tlOff };
      }
      var tmb = turnEl.querySelector(".tm-body");
      if (tmb) {
        var tmOff = tmb.scrollHeight - tmb.scrollTop - tmb.clientHeight;
        ui.tm = { stick: tmOff < 24, offset: tmOff };
      }
      return ui;
    }
    function _restoreTurnUI(turnEl, ui) {
      if (!ui) return;
      var newPanels = turnEl.querySelectorAll(".ow-panels .ow-ep");
      ui.openPanels.forEach(function(op) {
        var target = null;
        if (op.callId) {
          for (var i = 0; i < newPanels.length; i++) {
            if (newPanels[i].getAttribute("data-call-id") === op.callId) {
              target = newPanels[i];
              break;
            }
          }
        }
        if (!target && op.index < newPanels.length) target = newPanels[op.index];
        if (target) target.classList.add("ow-show");
      });
      var answers = turnEl.querySelectorAll(".step-answer-wrap");
      ui.collapsedAnswers.forEach(function(idx) {
        var w2 = answers[idx];
        if (!w2) return;
        var a = w2.querySelector(".step-answer.collapsible");
        if (a) a.classList.add("collapsed");
      });
      if (ui.tl) {
        var tl = turnEl.querySelector(".ow-tl");
        if (tl) {
          if (ui.tl.stick) tl.scrollTop = tl.scrollHeight;
          else tl.scrollTop = Math.max(0, tl.scrollHeight - tl.clientHeight - ui.tl.offset);
        }
      }
      if (ui.tm) {
        var tmb = turnEl.querySelector(".tm-body");
        if (tmb) {
          if (ui.tm.stick) tmb.scrollTop = tmb.scrollHeight;
          else tmb.scrollTop = Math.max(0, tmb.scrollHeight - tmb.clientHeight - ui.tm.offset);
        }
      }
    }
    function _syncThinkingMargin(turnEl, turn) {
      var marginHtml = "";
      if (H4.renderThinkingMargin) {
        try {
          marginHtml = H4.renderThinkingMargin(turn, true) || "";
        } catch (e) {
          marginHtml = "";
        }
      }
      var agentBody = turnEl.querySelector(".turn-agent-body");
      var margin = null;
      var kids = turnEl.children;
      for (var i = 0; i < kids.length; i++) {
        if (kids[i].classList && kids[i].classList.contains("turn-margin")) {
          margin = kids[i];
          break;
        }
      }
      if (marginHtml) {
        if (!margin && agentBody) {
          var tmp = document.createElement("div");
          tmp.innerHTML = marginHtml;
          var m3 = tmp.firstElementChild;
          if (m3) agentBody.parentNode.insertBefore(m3, agentBody.nextSibling);
        }
      } else if (margin) {
        margin.remove();
      }
    }
    function _applyStreaming(turnEl, turn, sm) {
      var ui = _captureTurnUI(turnEl);
      var stepsHtml = "";
      try {
        stepsHtml = H4.renderTurnStepsHTML(turn) || "";
      } catch (e) {
        stepsHtml = "";
      }
      var stepsEl = turnEl.querySelector(".turn-steps");
      if (stepsEl && stepsHtml) _morph(stepsEl, stepsHtml);
      _syncThinkingMargin(turnEl, turn);
      _restoreTurnUI(turnEl, ui);
      if (!turnEl.hasAttribute("data-streaming")) turnEl.setAttribute("data-streaming", "true");
    }
    function _applyStatic(turnEl, turn) {
      var ui = _captureTurnUI(turnEl);
      var html2 = "";
      try {
        html2 = H4.renderSingleTurnHTML(turn) || "";
      } catch (e) {
        html2 = "";
      }
      if (html2) _morph(turnEl, html2);
      if (turnEl.hasAttribute("data-streaming")) turnEl.removeAttribute("data-streaming");
      _restoreTurnUI(turnEl, ui);
      if (H4.initCollapsible) {
        try {
          H4.initCollapsible(turnEl);
        } catch (e) {
        }
      }
      if (H4.scheduleIdleHighlight) {
        try {
          H4.scheduleIdleHighlight(turnEl);
        } catch (e) {
        }
      }
    }
    function _updateTurn(container, entry, turn) {
      var sig = H4.turnSig(turn);
      var streamingStep = turn.steps.find(function(s) {
        return s.streaming;
      });
      var newLive = !!streamingStep;
      if (newLive) {
        var sm = streamingStep.streaming;
        var struct = _streamStructSig(sm);
        var running = (sm._toolSteps || []).some(function(ts) {
          return ts.running;
        });
        if (entry.live) {
          var curContent = sm.content != null ? sm.content : "";
          var curReasoning = sm.reasoning != null ? sm.reasoning : "";
          if (entry.struct !== struct) {
            _applyStreaming(entry.el, turn, sm);
            entry.struct = struct;
            entry.sig = sig;
            entry.lastContent = curContent;
            entry.lastReasoning = curReasoning;
            return true;
          }
          if (running) {
            _l35PatchDurations(entry.el, sm);
            if (entry.lastContent !== curContent || entry.lastReasoning !== curReasoning) {
              _l3Patch(entry.el, sm, entry.lastContent, entry.lastReasoning);
              entry.lastContent = curContent;
              entry.lastReasoning = curReasoning;
            }
            entry.sig = sig;
            return true;
          }
          if (entry.lastContent !== curContent || entry.lastReasoning !== curReasoning) {
            var changedText = _l3Patch(entry.el, sm, entry.lastContent, entry.lastReasoning);
            if (changedText) {
              entry.sig = sig;
              entry.lastContent = curContent;
              entry.lastReasoning = curReasoning;
              return true;
            }
            entry.struct = struct;
            entry.sig = sig;
            return false;
          }
          entry.sig = sig;
          return false;
        }
        _applyStreaming(entry.el, turn, sm);
        entry.live = true;
        entry.struct = struct;
        entry.sig = sig;
        entry.lastContent = sm.content != null ? sm.content : "";
        entry.lastReasoning = sm.reasoning != null ? sm.reasoning : "";
        return true;
      }
      if (entry.sig === sig) return false;
      if (entry.live) {
        _applyStatic(entry.el, turn);
      } else {
        _applyStatic(entry.el, turn);
      }
      entry.live = false;
      entry.sig = sig;
      entry.struct = null;
      entry.lastContent = null;
      entry.lastReasoning = null;
      return true;
    }
    var MAX_RENDERED_TURNS = 200;
    function renderFull(container, msgs, sid) {
      var allTurns = H4.buildTurns(msgs);
      var turns, placeholderHeight = 0, droppedCount = 0;
      if (allTurns.length > MAX_RENDERED_TURNS) {
        droppedCount = allTurns.length - MAX_RENDERED_TURNS;
        turns = allTurns.slice(droppedCount);
        placeholderHeight = droppedCount * 500;
      } else {
        turns = allTurns;
      }
      var html2 = "";
      if (placeholderHeight > 0) {
        html2 += '<div class="turn-placeholder" data-dropped="' + droppedCount + '" style="height:' + placeholderHeight + 'px"></div>';
      }
      turns.forEach(function(turn) {
        try {
          html2 += H4.renderSingleTurnHTML(turn) || "";
        } catch (e) {
          console.warn("[render] renderSingleTurnHTML failed", e);
        }
      });
      container.innerHTML = html2;
      var map = /* @__PURE__ */ new Map();
      var elByKey = /* @__PURE__ */ Object.create(null);
      var children = container.children;
      for (var c2 = 0; c2 < children.length; c2++) {
        var child = children[c2];
        if (child.getAttribute) {
          var dk = child.getAttribute("data-key");
          if (dk != null && elByKey[dk] == null) elByKey[dk] = child;
        }
      }
      for (var i = 0; i < turns.length; i++) {
        var key = turns[i].key;
        var keyStr = String(key == null ? "" : key);
        var el = elByKey[keyStr] || null;
        var streamingStep = turns[i].steps.find(function(s) {
          return s.streaming;
        });
        var entry = {
          el,
          sig: H4.turnSig(turns[i]),
          live: !!streamingStep,
          struct: streamingStep ? _streamStructSig(streamingStep.streaming) : null,
          lastContent: streamingStep ? streamingStep.streaming.content != null ? streamingStep.streaming.content : "" : null,
          lastReasoning: streamingStep ? streamingStep.streaming.reasoning != null ? streamingStep.streaming.reasoning : "" : null
        };
        map.set(key, entry);
      }
      if (H4.initCollapsible) {
        try {
          H4.initCollapsible(container);
        } catch (e) {
        }
      }
      if (H4.scheduleIdleHighlight) {
        try {
          H4.scheduleIdleHighlight(container);
        } catch (e) {
        }
      }
      container.__rdx = { sid: sid || null, map, seq: container.__rdx && container.__rdx.seq ? container.__rdx.seq + 1 : 1, droppedCount };
      return true;
    }
    function renderDiff(container, msgs, sid) {
      var rdx = container.__rdx;
      if (!rdx || rdx.sid !== sid) {
        return renderFull(container, msgs, sid);
      }
      var allTurns = H4.buildTurns(msgs);
      var dropped = rdx.droppedCount || 0;
      if (allTurns.length > MAX_RENDERED_TURNS && dropped !== allTurns.length - Math.min(allTurns.length, MAX_RENDERED_TURNS)) {
        return renderFull(container, msgs, sid);
      }
      var turns = dropped > 0 ? allTurns.slice(dropped) : allTurns;
      var oldKeys = [];
      rdx.map.forEach(function(v3, k3) {
        oldKeys.push(k3);
      });
      var newKeys = turns.map(function(t2) {
        return t2.key;
      });
      var tailAppend = newKeys.length >= oldKeys.length;
      if (tailAppend) {
        for (var i = 0; i < oldKeys.length; i++) {
          if (oldKeys[i] !== newKeys[i]) {
            tailAppend = false;
            break;
          }
        }
      }
      if (!tailAppend) {
        return renderFull(container, msgs, sid);
      }
      var changed = false;
      for (var t = 0; t < oldKeys.length; t++) {
        var turn = turns[t];
        var key = oldKeys[t];
        var entry = rdx.map.get(key);
        if (!entry) continue;
        if (_updateTurn(container, entry, turn)) changed = true;
      }
      for (var a = oldKeys.length; a < newKeys.length; a++) {
        var nTurn = turns[a];
        var nKey = nTurn.key;
        var htmlStr = "";
        try {
          htmlStr = H4.renderSingleTurnHTML(nTurn) || "";
        } catch (e) {
          console.warn("[render] renderSingleTurnHTML failed", e);
          continue;
        }
        var nEl = _elFromHtml(htmlStr);
        if (!nEl) continue;
        container.appendChild(nEl);
        var streamingStep2 = nTurn.steps.find(function(s) {
          return s.streaming;
        });
        rdx.map.set(nKey, {
          el: nEl,
          sig: H4.turnSig(nTurn),
          live: !!streamingStep2,
          struct: streamingStep2 ? _streamStructSig(streamingStep2.streaming) : null,
          lastContent: streamingStep2 ? streamingStep2.streaming.content != null ? streamingStep2.streaming.content : "" : null,
          lastReasoning: streamingStep2 ? streamingStep2.streaming.reasoning != null ? streamingStep2.streaming.reasoning : "" : null
        });
        changed = true;
      }
      if (changed && H4.initCollapsible) {
        try {
          H4.initCollapsible(container);
        } catch (e) {
        }
      }
      return changed;
    }
    function rendererReset(container) {
      if (container && container.__rdx) {
        container.__rdx = null;
      }
    }
    window.Hermes.renderFull = renderFull;
    window.Hermes.renderDiff = renderDiff;
    window.Hermes.rendererReset = rendererReset;
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
      return window.Hermes.msgText(content);
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
      _scrollBtn.style.pointerEvents = "none";
      _scrollBtn.addEventListener("click", function() {
        var el = window.Hermes.dom.chatMessages;
        if (el) el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
        _scrollBtn.style.display = "none";
        _scrollBtn.style.pointerEvents = "none";
        _scrollBtnShown = false;
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
    var _scrollBtnShown = false;
    function _updateScrollBtn() {
      if (_scrollBtnRaf) return;
      _scrollBtnRaf = requestAnimationFrame(function() {
        _scrollBtnRaf = 0;
        var el = window.Hermes.dom.chatMessages;
        if (!el) return;
        var btn = _getScrollBtn();
        var dist = el.scrollHeight - el.scrollTop - el.clientHeight;
        var shouldShow = _scrollBtnShown ? dist >= 20 : dist >= 80;
        if (shouldShow === _scrollBtnShown) return;
        _scrollBtnShown = shouldShow;
        if (shouldShow) {
          btn.style.display = "flex";
          btn.style.pointerEvents = "auto";
        } else {
          btn.style.display = "none";
          btn.style.pointerEvents = "none";
        }
      });
    }
    function _pinToBottom() {
      var el = window.Hermes.dom.chatMessages;
      if (el) el.scrollTop = el.scrollHeight;
    }
    function renderCurrentChat() {
      const state = window.Hermes.state;
      const dom = window.Hermes.dom;
      if (state.viewMode !== "chat") return;
      const sid = state.focusedSessionId;
      const container = dom.chatMessages;
      if (!sid) {
        window.Hermes.rendererReset(container);
        container.innerHTML = "";
        return;
      }
      const msgs = getMsgs(sid);
      if (!msgs) return;
      const atBottom = isNearBottom(container);
      var changed = false;
      try {
        changed = window.Hermes.renderDiff(container, msgs, sid);
      } catch (e) {
        console.warn("[renderCurrentChat] renderDiff failed, fallback full render", e);
        window.Hermes.rendererReset(container);
        changed = window.Hermes.renderFull(container, msgs, sid);
      }
      if (changed && atBottom) _pinToBottom();
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
      return slashCommands.filter((c2) => c2.name.toLowerCase().startsWith(q3));
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
      const sysMsg = { role: "system", content: html2 || text2, _isSystemDisplay: true, _localId: window.Hermes.uid() };
      const msgs = sid ? getMsgs(sid) : null;
      if (msgs) {
        msgs.push(sysMsg);
        scheduleRender(sid, true);
      }
    }
    function showSlashHelp() {
      let html2 = "<h3>\u26A1 \u659C\u6760\u547D\u4EE4</h3>";
      const groups = {};
      slashCommands.forEach((c2) => {
        if (!groups[c2.group]) groups[c2.group] = [];
        groups[c2.group].push(c2);
      });
      for (const [group, cmds] of Object.entries(groups)) {
        html2 += `<p><strong>${esc(group)}</strong></p><ul>`;
        cmds.forEach((c2) => {
          html2 += `<li>${c2.icon} <code>${esc(c2.name)}</code> \u2014 ${esc(c2.desc)}</li>`;
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
        msgs.push({ role: "system", content: "\u2702\uFE0F \u4E0A\u4E0B\u6587\u538B\u7F29\u5931\u8D25\uFF1A" + (errorMessage || (aborted ? "\u5DF2\u53D6\u6D88" : "\u672A\u77E5\u539F\u56E0")), _isCompaction: true, _localId: window.Hermes.uid() });
        return;
      }
      var before = result.tokensBefore || 0;
      var after = result.estimatedTokensAfter || 0;
      var saved = before - after;
      var savedPct = before > 0 ? Math.round(saved / before * 100) : 0;
      var head = "\u2702\uFE0F \u4E0A\u4E0B\u6587\u5DF2\u538B\u7F29 " + _fmtK(before) + " \u2192 " + _fmtK(after) + " tokens\uFF08\u8282\u7701 " + savedPct + "%" + (reason ? "\uFF0C" + reason : "") + "\uFF09";
      var html2 = '<div class="compaction-result"><div class="compaction-head">' + esc(head) + "</div>" + (result.summary ? '<details class="compaction-summary"><summary>\u67E5\u770B\u538B\u7F29\u6458\u8981</summary><div class="compaction-summary-body">' + esc(result.summary) + "</div></details>" : "") + "</div>";
      msgs.push({ role: "system", content: head, _isCompaction: true, _compactionHtml: html2, _localId: window.Hermes.uid() });
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
      dom.chatInput.disabled = false;
      if (hasActiveStream) {
        showStopButton();
        dom.chatInput.style.opacity = "0.7";
      } else {
        showSendButton();
        dom.chatInput.style.opacity = "";
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
      if (window.Hermes.hasActiveStream(sid)) {
        try {
          window.Hermes.abortStream(sid);
        } catch (e) {
          console.warn("[sendMessage] auto-abort failed", e);
        }
      }
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
        const matched = slashCommands.find((c2) => c2.name === cmd);
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
      showStopButton();
      document.querySelectorAll(".reconnect-btn").forEach(function(b3) {
        b3.remove();
      });
      pushInputHistory(input);
      const abortController = new AbortController();
      const userMsg = { role: "user", content: input, _localId: window.Hermes.uid() };
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
        _stepNum: 0,
        _localId: window.Hermes.uid()
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
      if (window.Hermes.clearStreamingMdCache) window.Hermes.clearStreamingMdCache();
      scheduleRender(sid, true);
      window.Hermes.updateStreamingHints();
      if (dom.chatMessages) dom.chatMessages.scrollTop = dom.chatMessages.scrollHeight;
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
              var _ui = _msgs.indexOf(userMsg);
              if (_ui >= 0) _msgs.splice(_ui, 1);
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
            currentMsgs2.push({ role: "system", content: "API \u9519\u8BEF: " + errText, _isSystemDisplay: true, _localId: window.Hermes.uid() });
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
                streamState._errorReceived = true;
                scheduleRender(sid, false);
                return;
              }
              if (_t === "agent_settled") {
                streamState._settledReceived = true;
              }
              if (_t === "compaction_start") {
                var _cmsgs = getMsgs(sid);
                if (_cmsgs) {
                  _cmsgs.push({ role: "system", content: "\u2702\uFE0F \u6B63\u5728\u538B\u7F29\u4E0A\u4E0B\u6587\u2026\uFF08" + (evt.reason || "") + "\uFF09", _isCompaction: true, _compactionPending: true, _localId: window.Hermes.uid() });
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
              if (streamState._errorReceived) break;
              await new Promise(function(resolve) {
                setTimeout(resolve, 0);
              });
            }
          } else {
            parser.feed(text2);
          }
          if (streamState._errorReceived) break;
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
              if (window.Hermes.clearStreamingMdCache) window.Hermes.clearStreamingMdCache();
              if (window.Hermes._stopLiveTimer) window.Hermes._stopLiveTimer();
              renderCurrentChat();
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
              var _reconMsgs = getMsgs(sid);
              if (_reconMsgs) {
                for (var _r = _reconMsgs.length - 1; _r >= 0; _r--) {
                  var _rm = _reconMsgs[_r];
                  if (_rm && _rm.role === "assistant" && _rm._aborted) _reconMsgs.splice(_r, 1);
                }
              }
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
    const H4 = window.Hermes;
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
          H4.toast("\u6A21\u578B\u5DF2\u5207\u6362\u4E3A " + mm.name);
        }
        H4.loadContextInfo(state.focusedSessionId, true);
      } catch (e) {
        H4.toast("\u5207\u6362\u6A21\u578B\u5931\u8D25: " + e.message, true);
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
        { keys: "Escape", desc: "\u4E2D\u6B62\u751F\u6210 / \u5173\u95ED\u5F39\u7A97" },
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
      function onEscKey(e) {
        if (e.key === "Escape" && document.getElementById("agent-editor-overlay")) close();
      }
      function close() {
        document.removeEventListener("keydown", onEscKey);
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
      document.addEventListener("keydown", onEscKey);
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
      function onEscKey(e) {
        if (e.key === "Escape" && document.getElementById("sched-editor-overlay")) close();
      }
      function close() {
        document.removeEventListener("keydown", onEscKey);
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
      document.addEventListener("keydown", onEscKey);
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
        if (e.key === "Escape") {
          var sid = H4.state.focusedSessionId;
          if (sid && H4.hasActiveStream && H4.hasActiveStream(sid)) {
            e.preventDefault();
            H4.abortCurrentStream(sid);
          }
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

  // web/chat/src/entry.js
  window.addEventListener("error", function(e) {
    if (!e.error) return;
    if (document.getElementById("hermes-fatal-overlay")) return;
    var msg = String(e.error.message || e.error).replace(/</g, "&lt;").slice(0, 500);
    var box = document.createElement("div");
    box.id = "hermes-fatal-overlay";
    box.style.cssText = "position:fixed;inset:0;display:flex;align-items:center;justify-content:center;background:rgba(18,18,22,0.94);color:#eee;font-family:system-ui,-apple-system,sans-serif;z-index:99999;text-align:center;padding:24px";
    box.innerHTML = '<div><div style="font-size:36px;margin-bottom:10px">\u26A0\uFE0F</div><div style="font-size:15px;font-weight:600;margin-bottom:6px">\u5E94\u7528\u521D\u59CB\u5316\u5931\u8D25\uFF0C\u8BF7\u5237\u65B0\u6216\u91CD\u542F</div><div style="font-size:12px;color:#9aa0a6;max-width:340px;line-height:1.5;word-break:break-all">' + msg + "</div></div>";
    if (document.body) document.body.appendChild(box);
    else document.documentElement.appendChild(box);
  });
})();
//# sourceMappingURL=chat.bundle.js.map
