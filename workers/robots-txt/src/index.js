const BODY = `User-agent: *
Allow: /

User-agent: Amazonbot
Disallow: /

User-agent: Applebot-Extended
Disallow: /

User-agent: Bytespider
Disallow: /

User-agent: CCBot
Disallow: /

User-agent: ClaudeBot
Disallow: /

User-agent: CloudflareBrowserRenderingCrawler
Disallow: /

User-agent: Google-Extended
Disallow: /

User-agent: GPTBot
Disallow: /

User-agent: meta-externalagent
Disallow: /

Sitemap: https://tetesantos.com.br/sitemap-index.xml
`;

export default {
  async fetch() {
    return new Response(BODY, {
      status: 200,
      headers: {
        'content-type': 'text/plain; charset=utf-8',
        'cache-control': 'public, max-age=300',
        // Evita que caches intermediarios sirvam versao gerenciada antiga
        'x-robots-source': 'tete-worker',
      },
    });
  },
};
