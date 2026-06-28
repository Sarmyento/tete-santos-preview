/** Prefixo de path para GitHub Pages (base) e assets locais. */
export function sitePath(path = ''): string {
  const base = import.meta.env.BASE_URL;
  if (!path || path === '/') {
    return base;
  }

  const normalized = path.startsWith('/') ? path.slice(1) : path;
  return `${base}${normalized}`;
}

export function assetPath(path: string): string {
  return sitePath(path.startsWith('/') ? path : `/${path}`);
}

export function isCurrentPath(href: string, pathname: string): boolean {
  const target = sitePath(href);
  const strip = (value: string) => {
    const trimmed = value.endsWith('/') && value.length > 1 ? value.slice(0, -1) : value;
    return trimmed || '/';
  };

  const current = strip(pathname);
  const link = strip(target);

  if (href === '/') {
    return current === link || current === strip(import.meta.env.BASE_URL);
  }

  return current === link || current.startsWith(`${link}/`);
}
