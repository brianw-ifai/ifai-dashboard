/**
 * Unpack IntoFocus-Site.html (Claude bundler export) into public/marketing/.
 * Usage: node scripts/extract-marketing-site.mjs [path/to/IntoFocus-Site.html]
 */
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import zlib from "node:zlib";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const sourcePath = process.argv[2] ?? join(root, "scripts/source/IntoFocus-Site.html");
const outDir = join(root, "public/marketing");

function extractScript(html, type) {
  const re = new RegExp(`<script type="${type.replace("/", "\\/")}">\\s*([\\s\\S]*?)\\s*<\\/script>`);
  const m = html.match(re);
  if (!m) throw new Error(`Missing script type=${type}`);
  return JSON.parse(m[1].trim());
}

function decodeEntry(entry) {
  let buf = Buffer.from(entry.data, "base64");
  if (entry.compressed) buf = zlib.gunzipSync(buf);
  return buf;
}

const HASH_TO_PATH = {
  home: "/",
  modules: "/modules",
  "ai-search-product-sellers": "/ai-search-product-sellers",
  "ai-project-desk": "/ai-project-desk",
  faq: "/faq",
  contact: "/contact",
  privacy: "/privacy",
};

const html = readFileSync(sourcePath, "utf8");
const manifest = extractScript(html, "__bundler/manifest");
let template = extractScript(html, "__bundler/template");
if (template.startsWith('"')) template = JSON.parse(template);

const assets = {
  "9073c701-2336-4918-8b90-0e1c45813e4e": "logo.png",
  "1ac977e5-2894-4b06-ac40-9cce4a31fc00": "inter.woff2",
  "e3be44c2-1e86-4079-beda-91dca23695c9": "react.js",
  "ae16cece-ba6c-439f-a12b-87345ce39fd4": "react-dom.js",
  "3ef822b1-4fa9-46e3-acc9-5f17fc5c37ee": "dc-runtime.js",
};

for (const [uuid, file] of Object.entries(assets)) {
  template = template.split(uuid).join(`/marketing/${file}`);
}

template = template.replace(
  /url\("url\("\/marketing\/inter\.woff2"\)"\)/,
  'url("/marketing/inter.woff2")',
);

for (const [page, path] of Object.entries(HASH_TO_PATH)) {
  const hash = `#${page === "home" ? "home" : page}`;
  template = template.split(`href="${hash}"`).join(`href="${path}"`);
}

template = template.replace(
  `componentDidMount() {
    const h = (location.hash || '').replace('#', '');
    if (this.PAGES.includes(h)) this.setState({ page: h });`,
  `componentDidMount() {
    const h = (typeof window.__marketingPage === 'string' && this.PAGES.includes(window.__marketingPage))
      ? window.__marketingPage
      : (location.hash || '').replace('#', '');
    if (this.PAGES.includes(h)) this.setState({ page: h });
    window.__marketingApi = {
      setPage: (page) => {
        if (this.PAGES.includes(page)) this.setState({ page, menu: false });
      },
    };`,
);

template = template.replace(
  `this.unmountCursor();
  }`,
  `this.unmountCursor();
    delete window.__marketingApi;
  }`,
);

template = template.replace(
  `try { history.replaceState(null, '', '#' + page); } catch (_) {}`,
  `try {
        const path = page === 'home' ? '/' : '/' + page;
        if (window.__marketingNavigate) window.__marketingNavigate(path);
        else history.replaceState(null, '', '#' + page);
      } catch (_) {}`,
);

template = template.replace(
  '<script src="/marketing/dc-runtime.js"></script>',
  '<script src="/marketing/react.js"></script>\n<script src="/marketing/react-dom.js"></script>\n<script src="/marketing/dc-runtime.js"></script>',
);

const CLIENT_PORTAL_PILL =
  '<span style="display:inline-flex;align-items:center;gap:8px;padding:9px 14px;border-radius:999px;border:1px dashed rgba(148,163,184,.38);font-size:13px;font-weight:600;color:#8fa8c2;">Client portal <span style="font-family:ui-monospace,Menlo,monospace;font-size:10px;letter-spacing:.08em;text-transform:uppercase;color:#fbbf24;">Coming soon</span></span>';
const CLIENT_PORTAL_LINK =
  '<a href="/dashboard" sc-camel-on-click="{{ goDashboard }}" style="display:inline-flex;align-items:center;gap:8px;padding:9px 14px;border-radius:999px;border:1px dashed rgba(148,163,184,.38);font-size:13px;font-weight:600;color:#8fa8c2;text-decoration:none;transition:border-color .2s ease,background .2s ease;" style-hover="border-color:rgba(46,183,255,.45);background:rgba(6,16,30,.45);color:#c9d8ea;">Client portal <span style="font-family:ui-monospace,Menlo,monospace;font-size:10px;letter-spacing:.08em;text-transform:uppercase;color:#fbbf24;">Coming soon</span></a>';
template = template.split(CLIENT_PORTAL_PILL).join(CLIENT_PORTAL_LINK);

template = template.replace(
  "goDesk: this.go('ai-project-desk'), goFaq: this.go('faq'), goContact: this.go('contact'), goPrivacy: this.go('privacy'),",
  `goDesk: this.go('ai-project-desk'), goFaq: this.go('faq'), goContact: this.go('contact'), goPrivacy: this.go('privacy'),
      goDashboard: (e) => {
        if (e && e.preventDefault) e.preventDefault();
        if (typeof window.__marketingOpenDashboard === 'function') window.__marketingOpenDashboard();
        else window.location.assign('/dashboard');
      },`,
);

mkdirSync(outDir, { recursive: true });
writeFileSync(join(outDir, "document.html"), template);
for (const [uuid, file] of Object.entries(assets)) {
  writeFileSync(join(outDir, file), decodeEntry(manifest[uuid]));
}

console.log(`Wrote ${outDir} (${template.length} byte document)`);
