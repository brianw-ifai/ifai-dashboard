/**
 * Module hook for export-static-data.mjs: lets the sandbox reads (which `import "server-only"`
 * so Next keeps them out of client bundles) load under plain Node, where that specifier does not
 * resolve. It maps the marker to Next's own empty module and leaves everything else to the
 * next hook (scripts/alias-hooks.mjs resolves the "@/" paths and extensionless .ts imports).
 */
export async function resolve(specifier, context, nextResolve) {
  if (specifier === "server-only") {
    return nextResolve("next/dist/compiled/server-only/empty.js", context);
  }
  return nextResolve(specifier, context);
}
