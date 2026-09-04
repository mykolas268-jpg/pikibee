import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './content/**/*.{ts,tsx}',
  ],
  theme: {
    // Hard override: the brand has no rounded corners. Removing the scale means
    // `rounded-*` utilities simply do not exist in this project.
    borderRadius: {
      none: '0',
      DEFAULT: '0',
    },
    extend: {
      colors: {
        ink: '#000000',
        bone: '#F5F5F5',
        amber: {
          DEFAULT: '#C9962A',
          deep: '#7A5A16',
        },
        hairline: '#333333',
      },
      fontFamily: {
        mono: ['var(--font-mono)', 'ui-monospace', 'SFMono-Regular', 'monospace'],
      },
      letterSpacing: {
        widest: '0.25em',
      },
      maxWidth: {
        copy: '600px',
      },
      transitionDuration: {
        120: '120ms',
      },
    },
  },
  plugins: [],
};

export default config;
