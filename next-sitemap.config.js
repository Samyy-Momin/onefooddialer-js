// OneFoodDialer - Next.js Sitemap Configuration
/** @type {import('next-sitemap').IConfig} */
module.exports = {
  siteUrl: process.env.SITE_URL || 'https://onefooddialer.vercel.app',
  generateRobotsTxt: true, // Generate robots.txt file
  generateIndexSitemap: false, // Don't generate index sitemap for smaller sites

  // Exclude admin and API routes from sitemap
  exclude: [
    '/admin/*',
    '/api/*',
    '/dashboard/*',
    '/login',
    '/signup',
    '/unauthorized',
    '/_*', // Next.js internal routes
  ],

  // Additional paths to include (if any dynamic routes need to be included)
  additionalPaths: async config => {
    const result = [];

    // Add any additional static paths here
    // For example, if you have dynamic routes that should be in sitemap

    return result;
  },

  // Robots.txt configuration
  robotsTxtOptions: {
    policies: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/admin/', '/api/', '/dashboard/', '/login', '/signup', '/unauthorized'],
      },
    ],
    additionalSitemaps: [
      // Add additional sitemaps if needed
    ],
  },

  // Transform function to modify URLs if needed
  transform: async (config, path) => {
    // Return null to exclude the path
    if (path.includes('/admin/') || path.includes('/api/')) {
      return null;
    }

    return {
      loc: path, // The URL
      changefreq: config.changefreq,
      priority: config.priority,
      lastmod: config.autoLastmod ? new Date().toISOString() : undefined,
      alternateRefs: config.alternateRefs ?? [],
    };
  },

  // Default values
  changefreq: 'daily',
  priority: 0.7,
  autoLastmod: true,

  // Output directory
  outDir: './public',
};
