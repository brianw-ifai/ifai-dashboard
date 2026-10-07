"use client";

import "@/components/sdk/sdk-docs.css";
import { SdkViewToggle } from "@/components/sdk/SdkViewToggle";
import {
  DOCS_NAV,
  DOCS_PAGES,
  docsHref,
  docsPageFromPath,
  type DocsPageId,
} from "@/components/sdk/docs/nav";
import { ExternalLink, Search } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useState, type MouseEvent, type ReactNode } from "react";

function DocsAnchorLink({
  href,
  className,
  children,
  onNavigate,
}: {
  href: string;
  className?: string;
  children: ReactNode;
  onNavigate?: (hash: string) => void;
}) {
  const pathname = usePathname();
  const [path, hash] = href.split("#");

  function onClick(event: MouseEvent<HTMLAnchorElement>) {
    if (pathname !== path || !hash) return;
    event.preventDefault();
    document.getElementById(hash)?.scrollIntoView({ behavior: "smooth", block: "start" });
    window.history.replaceState(null, "", href);
    onNavigate?.(hash);
  }

  return (
    <Link href={href} className={className} onClick={onClick}>
      {children}
    </Link>
  );
}

function DocsPager({ page }: { page: DocsPageId }) {
  const meta = DOCS_PAGES[page];
  const prev = meta.prev ? DOCS_PAGES[meta.prev] : null;
  const next = meta.next ? DOCS_PAGES[meta.next] : null;

  return (
    <div className="sdk-docs-pager">
      {prev ? (
        <Link href={prev.href} className="sdk-docs-pager-link">
          <span className="sdk-docs-pager-kicker">Previous</span>
          <span className="sdk-docs-pager-title">{prev.title}</span>
        </Link>
      ) : (
        <span />
      )}
      {next ? (
        <Link href={next.href} className="sdk-docs-pager-link next">
          <span className="sdk-docs-pager-kicker">Next</span>
          <span className="sdk-docs-pager-title">{next.title}</span>
        </Link>
      ) : null}
    </div>
  );
}

export function SdkDocsShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const page = docsPageFromPath(pathname);
  const toc = useMemo(
    () => DOCS_NAV.find((group) => group.page === page)?.items ?? [],
    [page],
  );
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(toc[0]?.id ?? "");

  /* Navigating to another docs page clears the filter and re-anchors the TOC.
     Adjusting during render rather than in an effect keeps the new page from
     painting one frame with the previous page's search and active heading. */
  const [renderedPath, setRenderedPath] = useState(pathname);
  if (renderedPath !== pathname) {
    setRenderedPath(pathname);
    setQuery("");
    setActive(toc[0]?.id ?? "");
  }

  const groups = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return DOCS_NAV;
    return DOCS_NAV.map((group) => {
      if (group.group.toLowerCase().includes(q)) return group;
      return {
        ...group,
        items: group.items.filter((item) => item.label.toLowerCase().includes(q)),
      };
    }).filter((group) => group.items.length > 0);
  }, [query]);

  /* A deep link carries the target heading in the URL hash, which only exists
     in the browser — so honouring it stays an effect, and it runs after the
     render-phase reset above has already cleared the previous page's state. */
  useEffect(() => {
    const hash = window.location.hash.replace(/^#/, "");
    if (!hash) return;
    // Syncing from an external system (the URL hash), which the server never
    // sees — reading it during render would mismatch hydration.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setActive(hash);
    document.getElementById(hash)?.scrollIntoView({ block: "start" });
  }, [pathname]);

  useEffect(() => {
    const nodes = toc
      .map((item) => document.getElementById(item.id))
      .filter((node): node is HTMLElement => Boolean(node));
    if (!nodes.length) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (visible?.target.id) setActive(visible.target.id);
      },
      { rootMargin: "-20% 0px -65% 0px", threshold: [0, 0.25, 0.5, 1] },
    );

    for (const node of nodes) observer.observe(node);
    return () => observer.disconnect();
  }, [pathname, toc]);

  return (
    <div className="sdk-docs">
      <header className="sdk-docs-header">
        <Link href="/sdk/docs" className="sdk-docs-brand">
          <img src="/icon.png" alt="" />
          <div className="sdk-docs-brand-copy">
            <div className="sdk-docs-brand-name">
              Canvas SDK
              <span className="sdk-docs-badge">Developer Preview</span>
            </div>
            <div className="sdk-docs-brand-sub">{DOCS_PAGES[page].title} · @/lib/canvas-sdk</div>
          </div>
        </Link>

        <div className="sdk-docs-header-actions">
          <SdkViewToggle view="docs" />
          <div className="sdk-docs-search">
            <Search size={13} />
            <input
              type="search"
              placeholder="Filter the sidebar…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              aria-label="Filter documentation"
            />
          </div>
          <a className="sdk-docs-header-link" href="/dashboard">
            <ExternalLink size={12} />
            Client dashboard
          </a>
        </div>
      </header>

      <div className="sdk-docs-body">
        <nav className="sdk-docs-sidebar" aria-label="SDK documentation">
          {groups.map((group) => (
            <div key={group.group} className="sdk-docs-nav-group">
              <Link
                href={group.href}
                className={`sdk-docs-nav-label${group.page === page ? " current" : ""}`}
              >
                {group.group}
              </Link>
              {group.items.map((item) => (
                <DocsAnchorLink
                  key={item.id}
                  href={docsHref(group.page, item.id)}
                  className={`sdk-docs-nav-item${group.page === page && active === item.id ? " active" : ""}`}
                  onNavigate={group.page === page ? setActive : undefined}
                >
                  {item.label}
                </DocsAnchorLink>
              ))}
            </div>
          ))}
        </nav>

        <div className="sdk-docs-article-wrap">
          <article className="sdk-docs-article">
            {children}
            <DocsPager page={page} />
          </article>
        </div>

        <aside className="sdk-docs-toc" aria-label="On this page">
          <div className="sdk-docs-toc-label">On this page</div>
          {toc.map((item) => (
            <DocsAnchorLink
              key={item.id}
              href={docsHref(page, item.id)}
              className={active === item.id ? "active" : undefined}
              onNavigate={setActive}
            >
              {item.label}
            </DocsAnchorLink>
          ))}
        </aside>
      </div>
    </div>
  );
}
