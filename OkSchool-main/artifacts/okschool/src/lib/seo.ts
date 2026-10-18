import { useEffect } from "react";

const SITE_NAME = "OkSchool";
const SITE_URL = "https://okschool-s.onrender.com";

const MANAGED = "data-seo-managed";

function setMeta(attr: "name" | "property", key: string, content: string) {
  let el = document.head.querySelector<HTMLMetaElement>(`meta[${attr}="${key}"]`);
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute(attr, key);
    el.setAttribute(MANAGED, "");
    document.head.appendChild(el);
  }
  el.setAttribute("content", content);
}

function setLink(rel: string, href: string) {
  let el = document.head.querySelector<HTMLLinkElement>(`link[rel="${rel}"]`);
  if (!el) {
    el = document.createElement("link");
    el.setAttribute("rel", rel);
    el.setAttribute(MANAGED, "");
    document.head.appendChild(el);
  }
  el.setAttribute("href", href);
}

function setJsonLd(id: string, data: unknown) {
  let el = document.head.querySelector<HTMLScriptElement>(`script[data-seo-jsonld="${id}"]`);
  if (!el) {
    el = document.createElement("script");
    el.type = "application/ld+json";
    el.setAttribute("data-seo-jsonld", id);
    el.setAttribute(MANAGED, "");
    document.head.appendChild(el);
  }
  el.textContent = JSON.stringify(data);
}

function clearJsonLd(id: string) {
  document.head.querySelector(`script[data-seo-jsonld="${id}"]`)?.remove();
}

export type SeoInput = {
  /** Page title without the site name; " | OkSchool" is appended automatically. */
  title: string;
  description: string;
  /** Path only, e.g. "/study-material/18/...". Used to build the canonical URL. */
  path?: string;
  image?: string;
  /** "website" for normal pages, "article" for study material. */
  type?: "website" | "article";
  noindex?: boolean;
  jsonLd?: Record<string, unknown>;
  jsonLdId?: string;
};

/**
 * Sets document title, description, Open Graph/Twitter tags, the canonical
 * link, and optional JSON-LD for one page. Values revert to the static
 * index.html defaults when the component unmounts.
 */
export function useSEO({
  title,
  description,
  path,
  image,
  type = "website",
  noindex = false,
  jsonLd,
  jsonLdId,
}: SeoInput): void {
  useEffect(() => {
    const fullTitle = title ? `${title} | ${SITE_NAME}` : SITE_NAME;
    const canonical = `${SITE_URL}${path ?? window.location.pathname}`;

    document.title = fullTitle;
    setMeta("name", "description", description);
    setMeta("name", "robots", noindex ? "noindex, follow" : "index, follow");
    setMeta("property", "og:title", fullTitle);
    setMeta("property", "og:description", description);
    setMeta("property", "og:type", type);
    setMeta("property", "og:url", canonical);
    setMeta("property", "og:site_name", SITE_NAME);
    setMeta("name", "twitter:card", image ? "summary_large_image" : "summary");
    setMeta("name", "twitter:title", fullTitle);
    setMeta("name", "twitter:description", description);
    if (image) {
      setMeta("property", "og:image", image);
      setMeta("name", "twitter:image", image);
    }
    setLink("canonical", canonical);

    if (jsonLd && jsonLdId) {
      setJsonLd(jsonLdId, jsonLd);
    }

    return () => {
      document.title = SITE_NAME;
      setMeta("name", "description", "OkSchool - free notes, projects and mock tests for students. Download PDFs free, editable Word files at low cost.");
      setMeta("name", "robots", "index, follow");
      clearJsonLd(jsonLdId ?? "");
    };
  }, [title, description, path, image, type, noindex, jsonLd, jsonLdId]);
}

/** Turns a document title into a URL-safe slug, e.g.
 * "Electrostatics & Capacitence" -> "electrostatics-capacitence" */
export function slugify(value: string): string {
  return (value || "")
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^\w\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 80);
}

/** Builds an SEO-friendly document URL that carries the title in the path. */
export function documentUrl(id: number, title?: string): string {
  const slug = slugify(title || "");
  return slug ? `/study-material/${id}/${slug}` : `/study-material/${id}`;
}
