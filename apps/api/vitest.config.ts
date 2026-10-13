import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    // Les tests partagent une base PostgreSQL : pas de parallelisme entre fichiers.
    fileParallelism: false,
    testTimeout: 20000,
  },
});
