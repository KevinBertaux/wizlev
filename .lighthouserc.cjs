const port = Number(process.env.LHCI_PORT || 4175);
const baseUrl = `http://127.0.0.1:${port}`;

module.exports = {
  ci: {
    collect: {
      startServerCommand: `npm run preview -- --host 127.0.0.1 --port ${port} --strictPort`,
      startServerReadyPattern: `${baseUrl}/`,
      startServerReadyTimeout: 60000,
      url: [
        `${baseUrl}/fr`,
        `${baseUrl}/fr/math/multiplications`,
        `${baseUrl}/fr/languages/english`,
      ],
      numberOfRuns: 1,
    },
    assert: {
      assertions: {
        'categories:performance': ['warn', { minScore: 0.55 }],
        'categories:accessibility': ['error', { minScore: 0.85 }],
        'categories:best-practices': ['warn', { minScore: 0.8 }],
        'categories:seo': ['warn', { minScore: 0.8 }],
      },
    },
  },
};
