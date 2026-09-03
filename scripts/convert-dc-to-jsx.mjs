#!/usr/bin/env node
/**
 * Converts DC HTML template to JSX (v2 — pipeline approach).
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
let template = fs.readFileSync(path.join(root, "scripts/template.raw.html"), "utf8");

function findMatchingClose(src, tagName, startIdx) {
  const openRe = new RegExp(`<${tagName}(?:\\s[^>]*)?>`, "g");
  const closeTag = `</${tagName}>`;
  openRe.lastIndex = startIdx;
  const openMatch = openRe.exec(src);
  if (!openMatch || openMatch.index !== startIdx) return -1;
  let depth = 1;
  let pos = openMatch.index + openMatch[0].length;
  while (depth > 0 && pos < src.length) {
    const nextOpen = src.indexOf(`<${tagName}`, pos);
    const nextClose = src.indexOf(closeTag, pos);
    if (nextClose === -1) return -1;
    if (nextOpen !== -1 && nextOpen < nextClose) {
      depth++;
      pos = nextOpen + 1;
    } else {
      depth--;
      if (depth === 0) return nextClose + closeTag.length;
      pos = nextClose + closeTag.length;
    }
  }
  return -1;
}

function convertScFor(src) {
  const re = /<sc-for\s+list="\{\{\s*([^}]+?)\s*\}\}"\s+as="([^"]+)"[^>]*>/;
  const m = re.exec(src);
  if (!m) return null;
  const listExpr = m[1].trim();
  const asName = m[2];
  const startIdx = m.index;
  const endIdx = findMatchingClose(src, "sc-for", startIdx);
  if (endIdx === -1) throw new Error("unclosed sc-for");
  const inner = src.slice(m.index + m[0].length, endIdx - "</sc-for>".length);
  const convertedInner = convertTemplate(inner);
  return (
    src.slice(0, startIdx) +
    `{${listExpr}.map((${asName}, _i) => (\n<Fragment key={_i}>\n${convertedInner}\n</Fragment>\n))}` +
    src.slice(endIdx)
  );
}

function convertScIf(src) {
  const re = /<sc-if\s+value="\{\{\s*([^}]+?)\s*\}\}"[^>]*>/;
  const m = re.exec(src);
  if (!m) return null;
  const cond = m[1].trim();
  const startIdx = m.index;
  const endIdx = findMatchingClose(src, "sc-if", startIdx);
  if (endIdx === -1) throw new Error("unclosed sc-if");
  const inner = src.slice(m.index + m[0].length, endIdx - "</sc-if>".length);
  const convertedInner = convertTemplate(inner);
  return (
    src.slice(0, startIdx) +
    `{${cond} && (\n${convertedInner}\n)}` +
    src.slice(endIdx)
  );
}

function camelKey(key) {
  return key.trim().replace(/-([a-z])/g, (_, c) => c.toUpperCase());
}

function formatStyleExpr(raw) {
  const trimmed = raw.trim();
  if (!trimmed.includes("{{")) return JSON.stringify(trimmed);
  const pure = trimmed.match(/^\{\{\s*([^}]+?)\s*\}\}$/);
  if (pure) return pure[1].trim();
  const tpl = trimmed.replace(/\{\{\s*([^}]+?)\s*\}\}/g, (_, e) => "${" + e.trim() + "}");
  return "`" + tpl + "`";
}

function convertStyleValue(styleStr) {
  if (!styleStr.includes("{{")) {
    return `style={css(${JSON.stringify(styleStr)})}`;
  }
  const entries = [];
  for (const part of styleStr.split(";")) {
    const trimmed = part.trim();
    if (!trimmed) continue;
    const colon = trimmed.indexOf(":");
    if (colon === -1) continue;
    const key = camelKey(trimmed.slice(0, colon));
    const valRaw = trimmed.slice(colon + 1).trim();
    entries.push(`${key}: ${formatStyleExpr(valRaw)}`);
  }
  return `style={{ ${entries.join(", ")} }}`;
}

function convertAttributes(attrs) {
  let a = attrs;
  a = a.replace(/\sstyle-hover="([^"]*)"/g, (_, v) => ` hoverStyle=${JSON.stringify(v)}`);
  a = a.replace(/\sstyle="([^"]*)"/g, (_, v) => ` ${convertStyleValue(v)}`);
  a = a.replace(/\sonClick="\{\{\s*([^}]+?)\s*\}\}"/g, (_, e) => ` onClick={${e.trim()}}`);
  a = a.replace(/\s(\w+)="\{\{\s*([^}]+?)\s*\}\}"/g, (_, name, e) => {
    if (name === "onClick") return ` onClick={${e.trim()}}`;
    return ` ${name}={${e.trim()}}`;
  });
  for (const [from, to] of [
    ["stroke-width", "strokeWidth"],
    ["stroke-linejoin", "strokeLinejoin"],
    ["stroke-dasharray", "strokeDasharray"],
    ["font-size", "fontSize"],
    ["font-family", "fontFamily"],
    ["font-weight", "fontWeight"],
  ]) {
    a = a.replace(new RegExp(`\\s${from}=`, "g"), ` ${to}=`);
  }
  return a;
}

function convertTags(src) {
  return src.replace(/<(\/?)([a-zA-Z][\w-]*)([^>]*)>/g, (match, slash, tag, attrs) => {
    if (tag.startsWith("sc-")) return match;
    if (slash) return match;
    const converted = convertAttributes(attrs);
    return `<${tag}${converted}>`;
  });
}

function convertTextNodes(src) {
  return src.replace(/>([^<]+)</g, (match, text) => {
    if (!text.includes("{{")) return match;
    const converted = text.replace(/\{\{\s*([^}]+?)\s*\}\}/g, (_, e) => `{${e.trim()}}`);
    return `>${converted}<`;
  });
}

function convertButtonsToHover(src) {
  return src
    .replace(/<button/g, "<HoverButton")
    .replace(/<\/button>/g, "</HoverButton>");
}

function convertTemplate(src) {
  let result = src;
  result = result.replace(/<!--[\s\S]*?-->/g, "");
  let prev;
  do {
    prev = result;
    const scIf = convertScIf(result);
    if (scIf) {
      result = scIf;
      continue;
    }
    const scFor = convertScFor(result);
    if (scFor) {
      result = scFor;
      continue;
    }
  } while (prev !== result);

  result = convertTextNodes(result);
  result = convertTags(result);
  result = result.replace(/&amp;/g, "&");
  result = result.replace(/<(br|circle|line|rect|path)([^>]*?)>\s*<\/\1>/g, "<$1$2 />");
  result = result.replace(/<br>/g, "<br />");
  result = result.replace(/ \/ \/>/g, " />");
  result = convertButtonsToHover(result);
  return result;
}

let jsx = convertTemplate(template.trim());

const header = `/* eslint-disable */
// @ts-nocheck
"use client";

import { Fragment } from "react";
import { css } from "@/lib/intofocus-portal/css";
import { HoverButton } from "@/components/intofocus-portal/HoverButton";
import type { PortalVals } from "@/lib/intofocus-portal/types";

type Props = { v: PortalVals };

export function PortalView({ v }: Props) {
  const {
    title,
    subtitle,
    stamp,
    crumbVis,
    isHub,
    todayBg,
    todayColor,
    mapBg,
    mapColor,
    setToday,
    setMap,
    m,
    isData,
    hubSimple,
    mapSimple,
    sugSimple,
    readSimple,
    aeoSimple,
    ecomSimple,
    simpleBg,
    simpleColor,
    dataBg,
    dataColor,
    setSimple,
    setData,
    nav,
    goHub,
    goSug,
    goRead,
    goAeo,
    goEcom,
    openHelp,
    closeHelp,
    help,
    topFour,
    tiles,
    rows,
    rowCount,
    respRows,
    resp,
    respLabel,
    toggleResp,
    areaChips,
    statusChips,
    sortChips,
    drawer,
    drawerOpen,
    positions,
    prompts,
    sources,
    products,
    findings,
    dataset,
    dataGrid,
    dataCols,
    dataRows,
    dataCount,
  } = v;

  return (
`;

const footer = `
  );
}
`;

let portalView =
  header +
  jsx
    .split("\n")
    .map((l) => "    " + l)
    .join("\n") +
  footer;
portalView = portalView.replace(/\{drawerOpen && \(/g, "{drawer && drawerOpen && (");

const out = path.join(root, "components/intofocus-portal/PortalView.tsx");
fs.mkdirSync(path.dirname(out), { recursive: true });
fs.writeFileSync(out, portalView);
console.log("Wrote", out, "- lines:", portalView.split("\n").length);
