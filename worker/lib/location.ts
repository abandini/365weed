/**
 * Location detection and smart link generation
 */

export interface UserLocation {
  city?: string;
  region?: string; // State code (e.g., "CA")
  country?: string;
  postalCode?: string;
  latitude?: string;
  longitude?: string;
}

/**
 * Extract location from Cloudflare request headers
 */
export function getUserLocation(request: Request): UserLocation {
  // Cloudflare provides geo data in CF object
  const cf = (request as any).cf;

  if (!cf) {
    return {};
  }

  return {
    city: cf.city,
    region: cf.region, // State code
    country: cf.country,
    postalCode: cf.postalCode,
    latitude: cf.latitude,
    longitude: cf.longitude,
  };
}

/**
 * Search types we can generate links for
 */
export type SearchType =
  | 'dispensary'
  | 'strain'
  | 'topicals'
  | 'edibles'
  | 'vaporizer'
  | 'cbd'
  | 'deals'
  | 'delivery';

/**
 * Parse app integration text to determine search type and query
 */
export function parseAppIntegration(text: string): { type: SearchType; query: string } | null {
  const lowerText = text.toLowerCase();

  // Check for dispensary first (most common)
  if (lowerText.includes('dispensary') || lowerText.includes('dispensaries') || lowerText.includes('local shop')) {
    return { type: 'dispensary', query: 'cannabis dispensary' };
  }

  // Specific strains (check before generic searches)
  const strainMatch = text.match(/(?:find|search for|see|look for)\s+(?:"([^"]+)"|([A-Z][a-zA-Z\s]+?))\s+(?:at|for|in|near)/i);
  if (strainMatch && lowerText.includes('strain')) {
    const strainName = strainMatch[1] || strainMatch[2];
    return { type: 'strain', query: strainName.trim() };
  }

  // Topicals/balms
  if (lowerText.includes('topical') || lowerText.includes('balm') || lowerText.includes('cream') || lowerText.includes('lotion')) {
    return { type: 'topicals', query: 'cannabis topicals' };
  }

  // CBD products
  if (lowerText.includes('cbd') && (lowerText.includes('product') || lowerText.includes('tincture') || lowerText.includes('capsule') || lowerText.includes('oil'))) {
    return { type: 'cbd', query: 'CBD products' };
  }

  // Vaporizers/devices
  if (lowerText.includes('vaporizer') || lowerText.includes('vape') || (lowerText.includes('pen') && !lowerText.includes('dispensary'))) {
    return { type: 'vaporizer', query: 'cannabis vaporizer' };
  }

  // Edibles
  if (lowerText.includes('edible') || lowerText.includes('gummies') || lowerText.includes('cannabutter')) {
    return { type: 'edibles', query: 'cannabis edibles' };
  }

  // Deals/sales
  if (lowerText.includes('deal') || lowerText.includes('sale') || lowerText.includes('discount')) {
    return { type: 'deals', query: 'cannabis deals' };
  }

  // Delivery
  if (lowerText.includes('delivery')) {
    return { type: 'delivery', query: 'cannabis delivery' };
  }

  // Generic dispensary search (catch-all for "find" phrases)
  if (lowerText.includes('find') || lowerText.includes('search for') || lowerText.includes('look for') || lowerText.includes('local')) {
    return { type: 'dispensary', query: 'cannabis dispensary' };
  }

  return null;
}

/**
 * Generate smart search links based on location and search type
 */
export function generateSearchLinks(
  searchType: SearchType,
  query: string,
  location: UserLocation
): {
  weedmaps?: string;
  leafly?: string;
  google?: string;
  primary: string;
} {
  const locationStr = location.city && location.region
    ? `${location.city}, ${location.region}`
    : location.region || location.country || 'near me';

  const encodedQuery = encodeURIComponent(`${query} ${locationStr}`);
  const encodedQueryNoLocation = encodeURIComponent(query);

  // Weedmaps links (best for dispensaries and products)
  let weedmapsUrl: string | undefined;
  if (searchType === 'dispensary' || searchType === 'deals') {
    weedmapsUrl = location.region
      ? `https://weedmaps.com/dispensaries/in/united-states/${location.region.toLowerCase()}`
      : `https://weedmaps.com/dispensaries`;
  } else if (searchType === 'strain') {
    weedmapsUrl = `https://weedmaps.com/strains?q=${encodedQueryNoLocation}`;
  } else if (searchType === 'delivery') {
    weedmapsUrl = location.region
      ? `https://weedmaps.com/deliveries/in/united-states/${location.region.toLowerCase()}`
      : `https://weedmaps.com/deliveries`;
  } else {
    weedmapsUrl = `https://weedmaps.com/search?q=${encodedQuery}`;
  }

  // Leafly links (best for strains and education)
  let leaflyUrl: string | undefined;
  if (searchType === 'strain') {
    leaflyUrl = `https://www.leafly.com/strains?search=${encodedQueryNoLocation}`;
  } else if (searchType === 'dispensary') {
    leaflyUrl = location.city && location.region
      ? `https://www.leafly.com/dispensaries/${location.region.toLowerCase()}/${location.city.toLowerCase().replace(/\s+/g, '-')}`
      : `https://www.leafly.com/dispensaries`;
  } else {
    leaflyUrl = `https://www.leafly.com/search?q=${encodedQuery}`;
  }

  // Google Maps (universal fallback)
  const googleUrl = `https://www.google.com/maps/search/?api=1&query=${encodedQuery}`;

  // Determine primary link (best option for this search type)
  let primary: string;
  if (searchType === 'strain') {
    primary = leaflyUrl; // Leafly is best for strain info
  } else if (searchType === 'dispensary' || searchType === 'deals' || searchType === 'delivery') {
    primary = weedmapsUrl; // Weedmaps is best for finding dispensaries
  } else {
    primary = weedmapsUrl; // Default to Weedmaps for product searches
  }

  return {
    weedmaps: weedmapsUrl,
    leafly: leaflyUrl,
    google: googleUrl,
    primary,
  };
}

/**
 * Process app integration text and generate action button data
 */
export function generateActionButton(
  appIntegration: string,
  location: UserLocation
): {
  text: string;
  links: {
    weedmaps?: string;
    leafly?: string;
    google?: string;
    primary: string;
  };
} | null {
  if (!appIntegration || appIntegration.trim() === '') {
    return null;
  }

  const parsed = parseAppIntegration(appIntegration);
  if (!parsed) {
    return null;
  }

  const links = generateSearchLinks(parsed.type, parsed.query, location);

  // Generate user-friendly button text
  let buttonText: string;

  // Create clean, actionable button text based on search type
  switch (parsed.type) {
    case 'dispensary':
      buttonText = location.city
        ? `Find Dispensaries in ${location.city}`
        : 'Find Local Dispensary';
      break;
    case 'strain':
      buttonText = `Find ${parsed.query}`;
      break;
    case 'topicals':
      buttonText = 'Find Cannabis Topicals';
      break;
    case 'cbd':
      buttonText = 'Find CBD Products';
      break;
    case 'edibles':
      buttonText = 'Find Edibles';
      break;
    case 'vaporizer':
      buttonText = 'Find Vaporizers';
      break;
    case 'deals':
      buttonText = location.city
        ? `Browse Deals in ${location.city}`
        : 'Browse Cannabis Deals';
      break;
    case 'delivery':
      buttonText = location.city
        ? `Find Delivery in ${location.city}`
        : 'Find Cannabis Delivery';
      break;
    default:
      buttonText = 'Find Near You';
  }

  return {
    text: buttonText,
    links,
  };
}
