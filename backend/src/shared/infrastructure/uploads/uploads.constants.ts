import { mkdirSync } from 'fs';
import { join } from 'path';

export const UPLOADS_DIR = join(process.cwd(), 'uploads');
export const UPLOADS_ROUTE = '/uploads';

mkdirSync(UPLOADS_DIR, { recursive: true });
