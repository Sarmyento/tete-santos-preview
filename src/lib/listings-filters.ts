export function getListingFilterOptions(listings: { city: string; neighborhood: string; type: string }[]) {
  const cities = [...new Set(listings.map((item) => item.city))].sort();
  const neighborhoods = [...new Set(listings.map((item) => item.neighborhood))].sort();
  const types = [...new Set(listings.map((item) => item.type))].sort();

  return { cities, neighborhoods, types };
}
