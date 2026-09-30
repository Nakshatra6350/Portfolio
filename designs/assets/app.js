/* ============================================================
   Mastery Track - page runtime
   - offline syntax highlighter (java, go, js, sql, yaml, bash,
     json, xml, properties, dockerfile, protobuf, lua)
   - auto table of contents + scrollspy
   - theme toggle (persisted), copy buttons, print helper
   No external dependencies. Works from file:// URLs.
   ============================================================ */
(function () {
  "use strict";

  /* ---------------- language definitions ---------------- */
  var W = function (s) { return new Set(s.split(/\s+/).filter(Boolean)); };

  var LANGS = {
    java: {
      lc: "//", bc: ["/*", "*/"], ann: /@[A-Za-z_$][\w$]*/,
      strTriple: '"""',
      kw: W(`abstract assert break case catch class const continue default do else enum
            extends final finally for goto if implements import instanceof interface
            native new package private protected public return static strictfp super
            switch synchronized this throw throws transient try void volatile while
            var record sealed permits non-sealed yield`),
      ty: W(`boolean byte char double float int long short String Object Integer Long
            Double Float Boolean Character Byte Short List Map Set Optional Stream
            Collection ArrayList HashMap HashSet LinkedList TreeMap TreeSet Queue Deque
            CompletableFuture Future Runnable Callable Thread Exception RuntimeException
            Comparable Comparator Iterable Iterator Number BigDecimal BigInteger
            LocalDate LocalDateTime Instant Duration UUID Class Enum Record Void`),
      lit: W(`true false null`)
    },
    go: {
      lc: "//", bc: ["/*", "*/"], raw: "`",
      kw: W(`break case chan const continue default defer else fallthrough for func go
            goto if import interface map package range return select struct switch type var`),
      ty: W(`bool byte complex64 complex128 error float32 float64 int int8 int16 int32
            int64 rune string uint uint8 uint16 uint32 uint64 uintptr any comparable
            Context WaitGroup Mutex RWMutex Once Reader Writer Time Duration`),
      lit: W(`true false nil iota`),
      bi: W(`append cap close complex copy delete imag len make new panic print println
            real recover min max clear`)
    },
    js: {
      lc: "//", bc: ["/*", "*/"], raw: "`", ann: /#[A-Za-z_$][\w$]*/,
      kw: W(`as async await break case catch class const continue debugger default delete
            do else export extends finally for from function get if import in instanceof
            let new of return set static super switch this throw try typeof var void
            while with yield satisfies keyof readonly declare namespace enum implements
            interface private protected public type abstract override`),
      ty: W(`Array Object String Number Boolean Symbol BigInt Promise Map Set WeakMap
            WeakSet Date RegExp Error TypeError RangeError JSON Math Buffer Uint8Array
            ArrayBuffer AbortController EventEmitter Function Proxy Reflect Intl
            ReadableStream WritableStream TransformStream URL URLSearchParams Response
            Request Headers WebSocket AsyncGenerator Generator Iterator`),
      lit: W(`true false null undefined NaN Infinity globalThis`)
    },
    sql: {
      lc: "--", bc: ["/*", "*/"], ci: true,
      kw: W(`select from where group by having order limit offset insert into values update
            set delete create table alter drop index view materialized join inner left right
            full outer cross lateral on using union all intersect except distinct as case when
            then else end and or not in exists between like ilike similar is null asc desc
            primary key foreign references unique check default constraint cascade restrict
            begin commit rollback savepoint transaction isolation level serializable
            repeatable read committed uncommitted with recursive window partition over
            rows range groups preceding following unbounded current row returning conflict
            do nothing merge matched grant revoke explain analyze vacuum analyse cluster
            trigger function procedure returns language declare if elsif loop while for each
            statement before after instead of temporary temp unlogged sequence schema
            database extension role user password login superuser replication truncate
            copy lock share mode nowait skip locked filter within tablesample fetch next only
            generated always identity stored virtual collate cast exclude add column rename to
            enable disable owner type domain cascade values natural full outer` ),
      ty: W(`int integer bigint smallint decimal numeric real double precision float serial
            bigserial varchar char text bytea boolean bool date time timestamp timestamptz
            interval json jsonb uuid array enum inet cidr macaddr xml money tsvector tsquery
            point line polygon circle box path geometry hstore citext tinyint mediumint
            longtext mediumtext blob longblob datetime year binary varbinary set`),
      lit: W(`true false null current_timestamp current_date current_user now`),
      bi: W(`count sum avg min max coalesce nullif greatest least array_agg string_agg
            json_agg jsonb_agg jsonb_build_object json_build_object row_number rank
            dense_rank ntile lag lead first_value last_value nth_value percent_rank
            cume_dist generate_series unnest length substring position trim upper lower
            concat replace split_part to_char to_date to_timestamp extract date_trunc
            age abs round ceil floor random md5 encode decode nextval currval setval
            regexp_replace regexp_matches similar_to ifnull group_concat json_extract
            date_format str_to_date convert_tz last_insert_id`)
    },
    bash: {
      lc: "#",
      kw: W(`if then else elif fi for while until do done case esac function return break
            continue in select time coproc local export readonly declare source alias unset
            trap set shift eval exec`),
      bi: W(`echo cd ls cat grep sed awk curl wget docker kubectl npm node go java mvn
            gradle git psql mysql redis-cli kafka-topics printf read test mkdir rm cp mv
            chmod chown find xargs sort uniq head tail wc tee jq tar ssh scp make env sleep
            ps kill pkill systemctl apt yum brew choco pip python python3 npx pnpm yarn`),
      lit: W(`true false`)
    },
    yaml: { lc: "#", yaml: true },
    json: { json: true },
    xml: { xml: true },
    props: { lc: "#", props: true },
    dockerfile: {
      lc: "#",
      kw: W(`FROM RUN CMD LABEL MAINTAINER EXPOSE ENV ADD COPY ENTRYPOINT VOLUME USER
            WORKDIR ARG ONBUILD STOPSIGNAL HEALTHCHECK SHELL AS`)
    },
    proto: {
      lc: "//", bc: ["/*", "*/"],
      kw: W(`syntax package import option message enum service rpc returns repeated optional
            required reserved oneof map stream extend`),
      ty: W(`double float int32 int64 uint32 uint64 sint32 sint64 fixed32 fixed64 bool
            string bytes`),
      lit: W(`true false`)
    },
    lua: {
      lc: "--",
      kw: W(`and break do else elseif end for function goto if in local not or repeat return
            then until while`),
      lit: W(`true false nil`),
      bi: W(`redis cjson tonumber tostring type pairs ipairs table string math os io print
            error assert pcall setmetatable getmetatable unpack select rawget rawset`)
    }
  };
  LANGS.javascript = LANGS.js; LANGS.ts = LANGS.js; LANGS.typescript = LANGS.js;
  LANGS.node = LANGS.js; LANGS.jsx = LANGS.js; LANGS.mjs = LANGS.js;
  LANGS.golang = LANGS.go;
  LANGS.postgres = LANGS.sql; LANGS.psql = LANGS.sql; LANGS.mysql = LANGS.sql; LANGS.plpgsql = LANGS.sql;
  LANGS.sh = LANGS.bash; LANGS.shell = LANGS.bash; LANGS.console = LANGS.bash; LANGS.redis = LANGS.bash;
  LANGS.yml = LANGS.yaml; LANGS.properties = LANGS.props; LANGS.ini = LANGS.props;
  LANGS.html = LANGS.xml; LANGS.pom = LANGS.xml; LANGS.gradle = LANGS.java;
  LANGS.kotlin = LANGS.java; LANGS.text = null; LANGS.txt = null; LANGS.plain = null;

  function esc(s) {
    return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  }
  function span(cls, s) { return '<span class="' + cls + '">' + esc(s) + "</span>"; }

  /* ------------- simple structural highlighters ------------- */
  function hlYaml(src) {
    return src.split("\n").map(function (ln) {
      var m = ln.match(/^(\s*)(#.*)$/);
      if (m) return esc(m[1]) + span("tc", m[2]);
      // key: value
      var k = ln.match(/^(\s*(?:-\s+)?)([A-Za-z0-9_.\-"']+)(\s*:)(.*)$/);
      if (k) {
        var rest = k[4], out = "";
        var c = rest.match(/^(.*?)(\s#.*)$/);
        var val = c ? c[1] : rest, cm = c ? c[2] : "";
        if (/^\s*(true|false|null|~)\s*$/i.test(val)) out = span("tl", val);
        else if (/^\s*-?\d+(\.\d+)?\s*$/.test(val)) out = span("tn", val);
        else if (/^\s*['"]/.test(val)) out = span("ts", val);
        else out = esc(val);
        return esc(k[1]) + span("tf", k[2]) + span("tp", k[3]) + out + (cm ? span("tc", cm) : "");
      }
      var d = ln.match(/^(\s*-\s+)(.*)$/);
      if (d) return span("tp", d[1]) + esc(d[2]);
      return esc(ln);
    }).join("\n");
  }
  function hlJson(src) {
    var re = /("(?:\\.|[^"\\])*")(\s*:)?|(\btrue\b|\bfalse\b|\bnull\b)|(-?\d+(?:\.\d+)?(?:[eE][-+]?\d+)?)|([{}\[\],:])/g;
    var out = "", last = 0, m;
    while ((m = re.exec(src))) {
      out += esc(src.slice(last, m.index));
      if (m[1]) out += m[2] ? span("tf", m[1]) + span("tp", m[2]) : span("ts", m[1]);
      else if (m[3]) out += span("tl", m[3]);
      else if (m[4]) out += span("tn", m[4]);
      else out += span("tp", m[5]);
      last = re.lastIndex;
    }
    return out + esc(src.slice(last));
  }
  function hlXml(src) {
    var re = /(<!--[\s\S]*?-->)|(<[?!\/]?[\w:.-]+)|([\w:.-]+)(=)("(?:[^"]*)"|'(?:[^']*)')|(\/?>)/g;
    var out = "", last = 0, m;
    while ((m = re.exec(src))) {
      out += esc(src.slice(last, m.index));
      if (m[1]) out += span("tc", m[1]);
      else if (m[2]) out += span("tp", m[2].slice(0, m[2].search(/[\w]/))) + span("tk", m[2].slice(m[2].search(/[\w]/)));
      else if (m[3]) out += span("tf", m[3]) + span("tp", m[4]) + span("ts", m[5]);
      else out += span("tp", m[6]);
      last = re.lastIndex;
    }
    return out + esc(src.slice(last));
  }
  function hlProps(src) {
    return src.split("\n").map(function (ln) {
      if (/^\s*[#!]/.test(ln)) return span("tc", ln);
      var m = ln.match(/^(\s*)([^=:]+)([=:])(.*)$/);
      if (!m) return esc(ln);
      var v = m[4];
      var vh = /^\s*(true|false)\s*$/i.test(v) ? span("tl", v)
        : /^\s*-?\d+(\.\d+)?\s*$/.test(v) ? span("tn", v) : span("ts", v);
      return esc(m[1]) + span("tf", m[2]) + span("tp", m[3]) + vh;
    }).join("\n");
  }

  /* ------------- generic tokenizer ------------- */
  // A capturing group that can never match, used to keep group numbering stable
  // for languages that lack a given construct. An empty group "()" must NOT be
  // used here: it matches the empty string and short-circuits the alternation.
  var NEVER = "((?!))";

  function build(def) {
    var p = [];
    p.push(def.bc ? "(" + rx(def.bc[0]) + "[\\s\\S]*?" + rx(def.bc[1]) + ")" : NEVER);   // 1 block comment
    p.push(def.lc ? "(" + rx(def.lc) + "[^\\n]*)" : NEVER);                              // 2 line comment
    p.push(def.strTriple ? '("""[\\s\\S]*?""")' : NEVER);                                // 3 text block
    p.push(def.raw                                                                       // 4 raw / template
      ? "(" + rx(def.raw) + "[^" + rx(def.raw) + "]*" + rx(def.raw) + ")" : NEVER);
    p.push("(\"(?:\\\\.|[^\"\\\\\\n])*\"|'(?:\\\\.|[^'\\\\\\n])*')");                    // 5 string
    p.push(def.ann ? "(" + def.ann.source + ")" : NEVER);                                // 6 annotation
    p.push("(\\b0[xXbBoO][0-9a-fA-F_]+\\b|\\b\\d[\\d_]*(?:\\.[\\d_]+)?(?:[eE][-+]?\\d+)?[LlFfDdUu]*\\b)"); // 7 number
    p.push("([A-Za-z_$][\\w$]*)");                                                       // 8 identifier
    p.push("([{}()\\[\\];,.:<>=+\\-*/%!&|^~?@#]+)");                                     // 9 punctuation
    return new RegExp(p.join("|"), "g");
  }
  function rx(s) { return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"); }

  var CACHE = {};
  function hlGeneric(src, name, def) {
    var re = CACHE[name] || (CACHE[name] = build(def));
    re.lastIndex = 0;
    var out = "", last = 0, m;
    while ((m = re.exec(src))) {
      if (m.index > last) out += esc(src.slice(last, m.index));
      var t = m[0];
      if (m[1] || m[2]) out += span("tc", t);
      else if (m[3] || m[4] || m[5]) out += span("ts", t);
      else if (m[6]) out += span("ta", t);
      else if (m[7]) out += span("tn", t);
      else if (m[8]) {
        var w = def.ci ? t.toLowerCase() : t;
        if (def.lit && def.lit.has(w)) out += span("tl", t);
        else if (def.kw && def.kw.has(w)) out += span("tk", t);
        else if (def.bi && def.bi.has(w)) out += span("tf", t);
        else if (def.ty && def.ty.has(w)) out += span("tt", t);
        else if (/^[A-Z]/.test(t) && !def.ci && /[a-z]/.test(t)) out += span("tt", t);
        else if (src[re.lastIndex] === "(") out += span("tf", t);
        else out += esc(t);
      } else out += span("tp", t);
      last = re.lastIndex;
      if (re.lastIndex === m.index) re.lastIndex++;   // safety against zero-width
    }
    return out + esc(src.slice(last));
  }

  function highlight(el) {
    var cls = el.className || "";
    var m = cls.match(/(?:lang|language)-([\w+#]+)/);
    if (!m) return;
    var name = m[1].toLowerCase();
    if (!(name in LANGS)) return;
    var def = LANGS[name];
    var src = el.textContent;
    if (def === null) return;
    var html;
    if (def.yaml) html = hlYaml(src);
    else if (def.json) html = hlJson(src);
    else if (def.xml) html = hlXml(src);
    else if (def.props) html = hlProps(src);
    else html = hlGeneric(src, name, def);
    el.innerHTML = html;
  }

  /* ---------------- table of contents ---------------- */
  function slug(s) {
    return s.toLowerCase().trim().replace(/[^\w\s-]/g, "").replace(/\s+/g, "-").slice(0, 60);
  }
  function buildToc() {
    var toc = document.querySelector(".toc");
    var main = document.querySelector("main");
    if (!toc || !main) return;
    var hs = main.querySelectorAll("h2, h3");
    if (!hs.length) { toc.style.display = "none"; return; }
    var seen = {}, html = '<h4>On this page</h4>';
    Array.prototype.forEach.call(hs, function (h) {
      if (!h.id) {
        var s = slug(h.textContent) || "s";
        if (seen[s]) s += "-" + ++seen[s]; else seen[s] = 1;
        h.id = s;
      }
      html += '<a href="#' + h.id + '" class="' + (h.tagName === "H3" ? "h3" : "") + '">' +
        esc(h.textContent.replace(/\s+/g, " ").trim()) + "</a>";
    });
    toc.innerHTML = html;

    var links = toc.querySelectorAll("a");
    var byId = {};
    Array.prototype.forEach.call(links, function (a) { byId[a.getAttribute("href").slice(1)] = a; });
    var current = null;
    var obs = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) {
          if (current) current.classList.remove("active");
          current = byId[e.target.id];
          if (current) {
            current.classList.add("active");
            var r = current.getBoundingClientRect(), t = toc.getBoundingClientRect();
            if (r.top < t.top || r.bottom > t.bottom) current.scrollIntoView({ block: "nearest" });
          }
        }
      });
    }, { rootMargin: "-70px 0px -72% 0px", threshold: 0 });
    Array.prototype.forEach.call(hs, function (h) { obs.observe(h); });
  }

  /* ---------------- copy buttons ---------------- */
  function addCopy() {
    Array.prototype.forEach.call(document.querySelectorAll(".codewrap"), function (w) {
      if (w.querySelector(".copy")) return;
      var b = document.createElement("button");
      b.className = "btn copy"; b.type = "button"; b.textContent = "copy";
      b.addEventListener("click", function () {
        var code = w.querySelector("code");
        if (!code) return;
        var txt = code.textContent;
        var done = function () { b.textContent = "copied"; setTimeout(function () { b.textContent = "copy"; }, 1300); };
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(txt).then(done, function () { fallback(txt, done); });
        } else fallback(txt, done);
      });
      w.appendChild(b);
    });
    function fallback(txt, done) {
      var ta = document.createElement("textarea");
      ta.value = txt; ta.style.position = "fixed"; ta.style.opacity = "0";
      document.body.appendChild(ta); ta.select();
      try { document.execCommand("copy"); done(); } catch (e) { }
      document.body.removeChild(ta);
    }
  }

  /* ---------------- theme ---------------- */
  function initTheme() {
    var saved = null;
    try { saved = localStorage.getItem("mt-theme"); } catch (e) { }
    if (saved === "dark" || saved === "light") document.documentElement.setAttribute("data-theme", saved);
    var btn = document.getElementById("themeBtn");
    if (!btn) return;
    btn.addEventListener("click", function () {
      // Dark is the default here to match the portfolio, regardless of OS preference.
      var cur = document.documentElement.getAttribute("data-theme") || "dark";
      var next = cur === "dark" ? "light" : "dark";
      document.documentElement.setAttribute("data-theme", next);
      try { localStorage.setItem("mt-theme", next); } catch (e) { }
    });
  }

  /* ---------------- print helper ---------------- */
  function initPrint() {
    var b = document.getElementById("printBtn");
    if (b) b.addEventListener("click", function () {
      Array.prototype.forEach.call(document.querySelectorAll("details"), function (d) { d.open = true; });
      window.print();
    });
    // expand every <details> when the print dialog opens (PDF export path)
    if (window.matchMedia) {
      var mq = window.matchMedia("print");
      var fn = function (e) {
        if (e.matches) Array.prototype.forEach.call(document.querySelectorAll("details"),
          function (d) { d.open = true; });
      };
      if (mq.addEventListener) mq.addEventListener("change", fn);
      else if (mq.addListener) mq.addListener(fn);
    }
    window.addEventListener("beforeprint", function () {
      Array.prototype.forEach.call(document.querySelectorAll("details"), function (d) { d.open = true; });
    });
  }

  /* ---------------- boot ---------------- */
  function boot() {
    Array.prototype.forEach.call(document.querySelectorAll("pre code[class]"), highlight);
    buildToc(); addCopy(); initTheme(); initPrint();
    document.documentElement.setAttribute("data-mt-ready", "1");
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
})();
