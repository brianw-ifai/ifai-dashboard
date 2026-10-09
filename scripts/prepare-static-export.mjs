import { copyFileSync, existsSync, mkdirSync, renameSync, rmSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const stashDir = join(root, ".tmp/static-export-stash");

/** App routes that depend on server actions or dynamic handlers (incompatible with `output: export`). */
const STASH_FILES = ["app/settings/profile/page.tsx"];

const STASH_PATHS = [
  "app/auth/confirm",
  "app/login",
  "app/signup",
  "app/portal",
  "app/sdk",
  "app/v3",
  // dashboard-v2 route handlers read the sandbox on request; the static export reads the JSON
  // that scripts/dashboard-v2/export-static-data.mjs wrote to public/dashboard-v2-data/ instead.
  "app/api/dashboard-v2",
];

const PAGE_SWAP = [
  ["app/(canvas)/dashboard/page.tsx", "app/(canvas)/dashboard/page.dynamic.tsx"],
  ["app/(canvas)/dashboard/page.static.tsx", "app/(canvas)/dashboard/page.tsx"],
  ["app/(canvas)/dashboard-v2/page.tsx", "app/(canvas)/dashboard-v2/page.dynamic.tsx"],
  ["app/(canvas)/dashboard-v2/page.static.tsx", "app/(canvas)/dashboard-v2/page.tsx"],
];

const ACTION_SHIMS = [
  ["app/auth/actions.ts", "auth-actions.ts"],
  ["app/auth/guest-actions.ts", "guest-actions.ts"],
  ["app/auth/organization-actions.ts", "organization-actions.ts"],
];

const mode = process.argv[2] ?? "stash";

function stashPath(rel) {
  return join(root, rel);
}

function stashedPath(rel) {
  return join(stashDir, rel.replace(/\//g, "__"));
}

mkdirSync(stashDir, { recursive: true });

if (mode === "stash") {
  // `next dev` generates .next/dev/types from the routes it saw; `next build` type-checks that
  // file, so a stale copy that still names a stashed route fails the static build. It is a
  // cache, and the next `next dev` run writes it again.
  rmSync(join(root, ".next/dev/types"), { recursive: true, force: true });
  for (const [fromRel, toRel] of PAGE_SWAP) {
    const from = stashPath(fromRel);
    const to = stashPath(toRel);
    if (existsSync(from)) {
      renameSync(from, to);
      console.log(`Swapped ${fromRel} -> ${toRel}`);
    }
  }
  for (const rel of STASH_FILES) {
    const from = stashPath(rel);
    const to = stashedPath(rel);
    if (existsSync(from)) {
      mkdirSync(dirname(to), { recursive: true });
      renameSync(from, to);
      console.log(`Stashed file ${rel}`);
    }
  }
  for (const rel of STASH_PATHS) {
    const from = stashPath(rel);
    const to = stashedPath(rel);
    if (existsSync(from)) {
      mkdirSync(dirname(to), { recursive: true });
      renameSync(from, to);
      console.log(`Stashed ${rel}`);
    }
  }
  for (const [rel, shimFile] of [
    ...ACTION_SHIMS,
    ["app/settings/profile/actions.ts", "profile-actions.ts"],
  ]) {
    const target = stashPath(rel);
    const backup = stashedPath(rel);
    const shim = join(root, "scripts/standalone-shims", shimFile);
    if (existsSync(target)) {
      mkdirSync(dirname(backup), { recursive: true });
      renameSync(target, backup);
      copyFileSync(shim, target);
      console.log(`Shimmed ${rel}`);
    }
  }
} else if (mode === "restore") {
  const RESTORE_PAGE = [
    ["app/(canvas)/dashboard/page.tsx", "app/(canvas)/dashboard/page.static.tsx"],
    ["app/(canvas)/dashboard/page.dynamic.tsx", "app/(canvas)/dashboard/page.tsx"],
    ["app/(canvas)/dashboard-v2/page.tsx", "app/(canvas)/dashboard-v2/page.static.tsx"],
    ["app/(canvas)/dashboard-v2/page.dynamic.tsx", "app/(canvas)/dashboard-v2/page.tsx"],
  ];
  // If only the static swap ran, page.dynamic.tsx may not exist.
  for (const [fromRel, toRel] of RESTORE_PAGE) {
    const from = stashPath(fromRel);
    const to = stashPath(toRel);
    if (existsSync(from)) {
      renameSync(from, to);
      console.log(`Restored page ${fromRel} -> ${toRel}`);
    }
  }
  for (const [rel] of [...ACTION_SHIMS].reverse()) {
    const backup = stashedPath(rel);
    const target = stashPath(rel);
    if (existsSync(backup)) {
      if (existsSync(target)) rmSync(target);
      renameSync(backup, target);
      console.log(`Restored ${rel}`);
    }
  }
  for (const rel of STASH_PATHS) {
    const from = stashedPath(rel);
    const to = stashPath(rel);
    if (existsSync(from)) {
      mkdirSync(dirname(to), { recursive: true });
      renameSync(from, to);
      console.log(`Restored ${rel}`);
    }
  }
  for (const rel of STASH_FILES) {
    const from = stashedPath(rel);
    const to = stashPath(rel);
    if (existsSync(from)) {
      mkdirSync(dirname(to), { recursive: true });
      renameSync(from, to);
      console.log(`Restored file ${rel}`);
    }
  }
} else if (mode === "clean") {
  if (existsSync(stashDir)) rmSync(stashDir, { recursive: true, force: true });
}
