// E2E Test Setup
import { config } from 'dotenv';

// Load environment variables for testing
config({ path: '.env.test' });

// Increase timeout for database operations
jest.setTimeout(30000);
