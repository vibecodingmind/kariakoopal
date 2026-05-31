import { MetadataRoute } from 'next';

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = 'https://kariako.guide';

  const staticRoutes = [
    '',
    '/market',
    '/vendors',
    '/guides',
    '/prices',
    '/events',
    '/stories',
    '/search',
    '/help',
    '/about',
    '/legal/terms',
    '/legal/privacy',
    '/auth',
    '/offline',
  ].map(route => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: 'weekly' as const,
    priority: route === '' ? 1.0 : route === '/guides' || route === '/prices' ? 0.9 : route === '/market' || route === '/vendors' ? 0.8 : 0.5,
  }));

  const zoneRoutes = [
    'central',
    'east',
    'west',
    'food',
    'fabric',
    'electronics',
  ].map(zone => ({
    url: `${baseUrl}/market/${zone}`,
    lastModified: new Date(),
    changeFrequency: 'weekly' as const,
    priority: 0.7,
  }));

  const seekerRoutes = [
    '/seeker/ai-vision',
    '/seeker/ai-haggle',
    '/seeker/profile',
    '/seeker/shopping-list',
    '/seeker/buddy',
  ].map(route => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: 'monthly' as const,
    priority: 0.6,
  }));

  const guideRoutes = [
    '/guide/profile',
    '/guide/verification',
    '/guide/subscriptions',
    '/guide/insights',
  ].map(route => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: 'monthly' as const,
    priority: 0.5,
  }));

  return [...staticRoutes, ...zoneRoutes, ...seekerRoutes, ...guideRoutes];
}
