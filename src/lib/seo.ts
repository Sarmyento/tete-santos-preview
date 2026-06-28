import type { SiteConfig } from '../config/site';

export function organizationJsonLd(site: SiteConfig, origin: string) {
  const sameAs = Object.values(site.social).filter(Boolean);
  return {
    '@context': 'https://schema.org',
    '@type': 'RealEstateAgent',
    name: site.name,
    url: site.domain || origin,
    description: site.tagline,
    areaServed: site.region,
    telephone: site.contact.phone,
    email: site.contact.email,
    ...(sameAs.length ? { sameAs } : {}),
  };
}

export function websiteJsonLd(site: SiteConfig, origin: string) {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: site.name,
    url: site.domain || origin,
    inLanguage: site.locale,
    description: site.tagline,
  };
}

export function localBusinessJsonLd(site: SiteConfig, origin: string) {
  return {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    name: site.name,
    url: site.domain || origin,
    telephone: site.contact.phone,
    email: site.contact.email,
    areaServed: site.region,
    priceRange: '$$$$',
  };
}

export function faqJsonLd(items: { question: string; answer: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: items.map((item) => ({
      '@type': 'Question',
      name: item.question,
      acceptedAnswer: { '@type': 'Answer', text: item.answer },
    })),
  };
}
