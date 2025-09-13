import type { Config } from 'drizzle-kit';

export default {
  schema: './src/db.ts',
  out: './drizzle',
  dialect: 'sqlite', // 👈 este es el valor correcto
  dbCredentials: {
    url: './db.sqlite',
  },
} satisfies Config;
