import config from "./utils/config";
import { createApp } from "./utils/createApp";

import './db'

async function main() {
  try {
    const app = createApp();
    app.listen(config.port, () => {
      console.log(`Server running on port ${config.port}`);
    });
  } catch(err) {
    console.error(err);
  }
}

main();