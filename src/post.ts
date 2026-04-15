import * as cache from "@actions/cache";
import * as core from "@actions/core";

async function run() {
  try {
    const dir = core.getState("cache-dir");
    const key = core.getState("cache-key");

    if (!dir || !key) return;

    await cache.saveCache([dir], key);
    core.info("✅ Cache saved");
  } catch (e: any) {
    core.warning(`Cache save failed: ${e.message}`);
  }
}

run();
