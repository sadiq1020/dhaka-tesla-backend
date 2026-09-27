import { createApp } from './app.js';
import { env } from './config/env.js';
import { logger } from './common/logger.js';

const app = createApp();

app.listen(env.PORT, () => {
  logger.info(`Dhaka Tesla Backend running on port ${env.PORT} in ${env.NODE_ENV} mode`);
});
