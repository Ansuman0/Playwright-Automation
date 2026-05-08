import * as dotenv from 'dotenv';
import * as path from 'path';

const PROJECT_ROOT = path.resolve(__dirname, '../..');
dotenv.config({ path: path.resolve(PROJECT_ROOT, '.env') });

export const config = {
  baseUrl: process.env.BASE_URL ?? '',
  username: process.env.TEST_USERNAME ?? '',
  password: process.env.TEST_PASSWORD ?? '',
  timeoutMs: Number(process.env.TIMEOUT ?? '20') * 1000,
  auth0Domain: process.env.AUTH0_DOMAIN ?? 'auth0.com',
  browser: process.env.BROWSER ?? 'chromium',
};

export const STORAGE_STATE = path.resolve(PROJECT_ROOT, '.auth/user.json');
export function urlFor(routePath: string): string {
  return config.baseUrl.replace(/\/$/, '') + routePath;
}
