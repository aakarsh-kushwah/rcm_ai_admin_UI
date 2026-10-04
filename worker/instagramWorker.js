/**
 * Instagram background sync worker.
 * Run as its own process: npm run worker:instagram
 * On Render: create a "Background Worker" service with this start command.
 * Run exactly ONE instance, or syncs will be duplicated.
 */
require("dotenv").config();
const { logger } = require("../utils/logger");
const { connectDB, sequelize } = require("../models");
const { connection: redisClient } = require("../config/redis");

let shuttingDown = false;

const shutdown = async (signal) => {
    if (shuttingDown) return;
    shuttingDown = true;
    logger.info(`${signal} received. Stopping Instagram worker...`);
    setTimeout(() => process.exit(1), 15000).unref();
    await Promise.allSettled([sequelize.close(), redisClient.quit()]);
    process.exit(0);
};

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));
process.on("unhandledRejection", (r) => logger.error({ err: String(r) }, "Unhandled rejection (worker)"));

(async () => {
    try {
        await connectDB();

        const instagramService = require("../services/instagramService");
        instagramService.startSyncWorker({
            onSynced: async () => {
                const shortsController = require("../controllers/shortsController");
                if (shortsController.refreshFeedCatalog) {
                    await shortsController.refreshFeedCatalog();
                }
            },
        });

        logger.info("Instagram sync worker started");
    } catch (err) {
        logger.fatal({ err: err.message, stack: err.stack }, "Instagram worker failed to start");
        process.exit(1);
    }
})();