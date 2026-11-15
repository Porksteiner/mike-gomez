// JSON-LD helpers. Match the schema type to the page (see _sauce/04-SHIP-STANDARDS.md §2).

export interface OrgMeta {
  name: string;
  url: string;
  description: string;
  sameAs?: string[];
}

export function organizationJsonLd(meta: OrgMeta) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: meta.name,
    url: meta.url,
    description: meta.description,
    ...(meta.sameAs ? { sameAs: meta.sameAs } : {}),
  };
}

export interface ArticleMeta {
  title: string;
  description: string;
  url: string;
  image: string;
  author: string;
  publisher: string;
  datePublished: string;
  dateModified?: string;
}

export function articleJsonLd(m: ArticleMeta) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: m.title,
    description: m.description,
    image: m.image,
    author: { '@type': 'Person', name: m.author },
    publisher: { '@type': 'Organization', name: m.publisher },
    datePublished: m.datePublished,
    dateModified: m.dateModified ?? m.datePublished,
    mainEntityOfPage: m.url,
  };
}
