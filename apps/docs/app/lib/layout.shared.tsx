import type { BaseLayoutProps } from 'fumadocs-ui/layouts/shared';

export function baseOptions(): BaseLayoutProps {
  return {
    nav: {
      title: 'Pulumi AWS',
      transparentMode: 'top',
    },
    githubUrl: 'https://github.com/DonsWayo/pulu-front',
    links: [
      {
        text: 'Documentation',
        url: '/docs',
      },
    ],
  };
}
