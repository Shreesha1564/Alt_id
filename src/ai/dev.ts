import { config } from 'dotenv';
config();

import '@/ai/flows/verify-user-age.ts';
import '@/ai/flows/verify-selfie.ts';
import '@/ai/flows/extract-info-from-id.ts';