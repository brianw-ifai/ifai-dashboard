"use client";

import {
  marketingPageFromPathname,
  type MarketingPageId,
} from "@/lib/marketing/routes";
import { teardownMarketingSite } from "@/lib/marketing/teardown-marketing-site";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

declare global {
  interface Window {
    __marketingPage?: MarketingPageId;
    __marketingNavigate?: (path: string) => void;
    __marketingApi?: { setPage: (page: MarketingPageId) => void };
    __marketingOpenDashboard?: () => void;
    __dcBoot?: () => void;
  }
}

function loadScript(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const existing = document.querySelector(`script[src="${src}"]`);
    if (existing) {
      resolve();
      return;
    }
    const script = document.createElement("script");
    script.src = src;
    script.async = false;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error(`Failed to load ${src}`));
    document.head.appendChild(script);
  });
}

async function waitForMarketingApi(maxMs = 8000) {
  const start = Date.now();
  while (Date.now() - start < maxMs) {
    if (window.__marketingApi) return window.__marketingApi;
    await new Promise((resolve) => setTimeout(resolve, 16));
  }
  return null;
}

function applyMarketingPage(page: MarketingPageId) {
  window.__marketingPage = page;
  window.__marketingApi?.setPage(page);
}

type Props = {
  documentHtml: string;
};

/** Boots in the marketing layout; tears down when leaving so browser Back can re-boot. */
export function MarketingSite({ documentHtml }: Props) {
  const pathname = usePathname();
  const router = useRouter();
  const hostRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    window.__marketingNavigate = (path) => router.push(path);
    window.__marketingOpenDashboard = () => router.push("/dashboard");
    return () => {
      delete window.__marketingOpenDashboard;
    };
  }, [router]);

  useEffect(() => {
    const page = marketingPageFromPathname(pathname);
    if (!page) return;
    void waitForMarketingApi().then(() => applyMarketingPage(page));
  }, [pathname]);

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      try {
        const parsed = new DOMParser().parseFromString(documentHtml, "text/html");
        const xdc = parsed.querySelector("x-dc");
        const dcScript = parsed.querySelector("script[data-dc-script]");
        if (!xdc || !dcScript || !hostRef.current) {
          throw new Error("Invalid marketing document bundle");
        }

        const helmetStyle = parsed.querySelector("helmet style");
        if (helmetStyle && !document.getElementById("marketing-site-styles")) {
          const style = document.createElement("style");
          style.id = "marketing-site-styles";
          style.textContent = helmetStyle.textContent ?? "";
          document.head.appendChild(style);
        }

        document.documentElement.classList.add("iom-cursor");
        document.body.style.margin = "0";
        document.body.style.background = "#071321";

        const mount = document.createElement("div");
        mount.id = "marketing-site-root";
        hostRef.current.replaceChildren(mount);
        mount.appendChild(xdc.cloneNode(true));

        const inline = document.createElement("script");
        for (const attr of dcScript.attributes) {
          inline.setAttribute(attr.name, attr.value);
        }
        inline.textContent = dcScript.textContent;
        document.body.appendChild(inline);

        const initialPage = marketingPageFromPathname(pathname);
        if (initialPage) window.__marketingPage = initialPage;

        const runtimeWasReady = typeof window.__dcBoot === "function";

        await loadScript("/marketing/react.js");
        await loadScript("/marketing/react-dom.js");
        await loadScript("/marketing/dc-runtime.js");

        if (cancelled) return;

        if (runtimeWasReady) {
          window.__dcBoot?.();
        }

        const api = await waitForMarketingApi();
        const page = marketingPageFromPathname(pathname);
        if (page && api) api.setPage(page);
      } catch (bootError) {
        if (!cancelled) {
          setError(bootError instanceof Error ? bootError.message : String(bootError));
        }
      }
    })();

    return () => {
      cancelled = true;
      teardownMarketingSite();
    };
  }, [documentHtml]);

  if (error) {
    return (
      <p role="alert" style={{ padding: 24, color: "#fca5a5", fontFamily: "system-ui" }}>
        Marketing site failed to load: {error}
      </p>
    );
  }

  return <div ref={hostRef} className="marketing-site-host" />;
}
