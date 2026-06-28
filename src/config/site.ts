/**
 * Configuracao do site Tetê Santos.
 * Nao colocar segredos aqui.
 */
export const site = {
  name: 'Tetê Santos',
  brandLockup: 'E · Maison Déco',
  tagline: 'Exclusividade que permanece.',
  taglineSecondary: 'Imóveis de Luxo · Belo Horizonte',
  domain: 'https://tetesantos.com.br',
  locale: 'pt-BR',
  whatsapp: {
    number: '5531996383100',
    message: 'Olá Tetê, gostaria de agendar uma visita.',
  },
  contact: {
    email: 'contato@tetesantos.com.br',
    phone: '(31) 99638-3100',
  },
  social: {
    instagram: 'https://www.instagram.com/corretoratetesantos',
    facebook: '',
    linkedin: '',
  },
  region: 'Centro-Sul de Belo Horizonte (Sion, Lourdes, Funcionários) e Nova Lima',
  services: ['Compra', 'Venda', 'Avaliação', 'Captação'] as const,
} as const;

export type SiteConfig = typeof site;
