import { existsSync, readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';

export interface Listing {
  id: string;
  slug: string;
  title: string;
  street: string;
  neighborhood: string;
  city: string;
  state: string;
  price: string;
  priceValue: number;
  condominioFee: string;
  iptuFee: string;
  bedrooms: number;
  suites: number;
  area: number;
  parking: number;
  type: string;
  image: string;
  images: string[];
  featured: boolean;
  description: string;
  features: string[];
  amenities: string[];
}

function readXml(): string {
  const path = resolve(process.cwd(), 'public/data/listings.xml');
  return readFileSync(path, 'utf8');
}

function getTag(block: string, tag: string): string {
  // [\s\S]*? — CRM pode emitir description/features com quebras de linha
  return block.match(new RegExp(`<${tag}>([\\s\\S]*?)</${tag}>`))?.[1]?.trim() ?? '';
}

function parseListings(xml: string): Listing[] {
  return [...xml.matchAll(/<listing>([\s\S]*?)<\/listing>/g)].map((match) => {
    const block = match[1];
    const id = getTag(block, 'id');
    const image = getTag(block, 'image');
    const gallery = getTag(block, 'images');
    const galleryItems = gallery ? gallery.split('|').map((item) => item.trim()).filter(Boolean) : [];
    const images = galleryItems.length
      ? galleryItems[0] === image
        ? galleryItems
        : [image, ...galleryItems.filter((item) => item !== image)]
      : [image];
    const featuresRaw = getTag(block, 'features');
    const amenitiesRaw = getTag(block, 'amenities');

    return {
      id,
      slug: id.toLowerCase(),
      title: getTag(block, 'title'),
      street: getTag(block, 'street'),
      neighborhood: getTag(block, 'neighborhood'),
      city: getTag(block, 'city'),
      state: getTag(block, 'state') || 'MG',
      price: getTag(block, 'price'),
      priceValue: Number(getTag(block, 'price_value')) || 0,
      condominioFee: getTag(block, 'condominio_fee'),
      iptuFee: getTag(block, 'iptu_fee'),
      bedrooms: Number(getTag(block, 'bedrooms')) || 0,
      suites: Number(getTag(block, 'suites')) || 0,
      area: Number(getTag(block, 'area')) || 0,
      parking: Number(getTag(block, 'parking')) || 0,
      type: getTag(block, 'type'),
      image,
      images,
      featured: getTag(block, 'featured') === 'true',
      description: getTag(block, 'description'),
      features: featuresRaw ? featuresRaw.split('|').map((item) => item.trim()).filter(Boolean) : [],
      amenities: amenitiesRaw ? amenitiesRaw.split('|').map((item) => item.trim()).filter(Boolean) : [],
    };
  });
}

export function getListings(options?: { limit?: number; featuredOnly?: boolean }): Listing[] {
  let listings = parseListings(readXml());
  if (options?.featuredOnly) {
    listings = listings.filter((item) => item.featured);
  }
  listings.sort((a, b) => b.priceValue - a.priceValue);
  if (options?.limit) {
    listings = listings.slice(0, options.limit);
  }
  return listings;
}

export function getListingBySlug(slug: string): Listing | undefined {
  return getListings().find((item) => item.slug === slug.toLowerCase());
}

export function getListingSlugs(): string[] {
  return getListings().map((item) => item.slug);
}

export function formatPrice(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatListingAddress(listing: Listing): string {
  const parts = [listing.street, listing.neighborhood, `${listing.city}/${listing.state}`].filter(Boolean);
  return parts.join(', ');
}

export function getListingMapEmbedUrl(listing: Listing): string {
  const query = formatListingAddress(listing);
  return `https://www.google.com/maps?q=${encodeURIComponent(query)}&hl=pt&z=15&output=embed`;
}

export function getListingMapExternalUrl(listing: Listing): string {
  const query = formatListingAddress(listing);
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
}

/** Miniatura da galeria a partir da URL otimizada (-detail → -thumb). */
export function toListingThumbSrc(src: string): string {
  if (!src) return src;
  if (src.includes('-detail.webp')) return src.replace('-detail.webp', '-thumb.webp');
  if (src.includes('-detail.avif')) return src.replace('-detail.avif', '-thumb.avif');
  if (src.includes('-card.webp')) return src.replace('-card.webp', '-card-sm.webp');
  return src;
}

function publicAssetExists(webPath: string): boolean {
  if (!webPath.startsWith('/')) return false;
  try {
    return existsSync(join(process.cwd(), 'public', webPath.slice(1)));
  } catch {
    return false;
  }
}

/** AVIF só se o arquivo existir (CI gera WebP-only por padrão). */
export function toListingDetailAvif(src: string): string {
  if (!src.includes('-detail.webp')) return '';
  const avif = src.replace('-detail.webp', '-detail.avif');
  return publicAssetExists(avif) ? avif : '';
}

export function toListingThumbAvif(src: string): string {
  const thumb = toListingThumbSrc(src);
  if (!thumb.includes('-thumb.webp')) return '';
  const avif = thumb.replace('-thumb.webp', '-thumb.avif');
  return publicAssetExists(avif) ? avif : '';
}
