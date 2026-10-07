/**
 * Next inlines `basePath` here at build time: empty on Netlify and in `next dev`,
 * the repo path on the GitHub Pages export. `basePath` is not applied to `<img>`,
 * SVG `<image>`, or metadata icon URLs, so public files need it added by hand.
 */
const BUILD_BASE_PATH = process.env.__NEXT_ROUTER_BASEPATH ?? "";

/** URL for a file in `public/`, served correctly under the deploy's base path. */
export function publicAssetPath(path: string, basePath: string = BUILD_BASE_PATH): string {
  if (!path.startsWith("/") || path.startsWith("//")) return path;
  const prefix = basePath.replace(/\/+$/, "");
  if (!prefix || path === prefix || path.startsWith(`${prefix}/`)) return path;
  return `${prefix}${path}`;
}
