import { app } from "./app";
import { env } from "./config/env";
import { logger } from "./config/logger";

const port = env.API_PORT;

app.listen(port, () => {
  logger.info(`🚀 MyDAD API running on port ${port}`);
});
