import type { SiteConfig } from '../config/site';
import type { Listing } from './listings';

/** Endereço de entidade: só localidade confirmada (sem inventar logradouro do escritório). */
function entityAddress() {
  return {
    '@type': 'PostalAddress',
    addressLocality: 'Belo Horizonte',
    addressRegion: 'MG',
    addressCountry: 'BR',
  };
}

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
    address: entityAddress(),
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
    address: entityAddress(),
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

export function breadcrumbJsonLd(items: { name: string; url: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  };
}

/**
 * Ficha de imóvel. Multi-type Product + RealEstateListing:
 * Product/Offer para elegibilidade de rich results; RealEstateListing para address/floorSize.
 * Só inclui propriedades com dado real do feed.
 */
export function listingProductJsonLd(listing: Listing, pageUrl: string, origin: string) {
  const images = (listing.images?.length ? listing.images : [listing.image])
    .filter(Boolean)
    .map((src) => (src.startsWith('http') ? src : new URL(src, origin).href));

  const streetParts = [listing.street, listing.neighborhood].filter(Boolean);
  const address: Record<string, string> = {
    '@type': 'PostalAddress',
    addressCountry: 'BR',
  };
  if (streetParts.length) address.streetAddress = streetParts.join(', ');
  if (listing.city) address.addressLocality = listing.city;
  if (listing.state) address.addressRegion = listing.state;

  const offer: Record<string, unknown> = {
    '@type': 'Offer',
    url: pageUrl,
    priceCurrency: 'BRL',
    availability: 'https://schema.org/InStock',
  };
  if (listing.priceValue > 0) {
    offer.price = listing.priceValue;
  }

  const product: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': ['Product', 'RealEstateListing'],
    name: listing.title,
    url: pageUrl,
    category: listing.type || 'Imóvel',
    address,
    offers: offer,
  };

  if (listing.description) product.description = listing.description;
  if (images.length) product.image = images;
  if (listing.area > 0) {
    product.floorSize = {
      '@type': 'QuantitativeValue',
      value: listing.area,
      unitCode: 'MTK',
    };
  }
  if (listing.bedrooms > 0) product.numberOfRooms = listing.bedrooms;
  if (listing.id) product.sku = listing.id;

  return product;
}
