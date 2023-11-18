const axios = require('axios');

const PAPERTRAIL_ENDPOINT = "https://logs.collector.na-02.cloud.solarwinds.com/v1/logs";
const PAPERTRAIL_TOKEN = "LIkUhxScFpKERDvQaIj1NNPB3xgQZzw33gbCbhEgck4pThgkZO0xVhnjaJEOBVA1bPAKaxQ";

const logger = {
  sendLog: async (message) => {
    try {
      await axios.post(PAPERTRAIL_ENDPOINT, message, {
        headers: {
          'Content-Type': 'application/octet-stream',
          'Authorization': `Bearer ${PAPERTRAIL_TOKEN}`
        }
      });
    } catch (error) {
      console.error("Failed to send log to Papertrail:", error);
    }
  }
};

module.exports = logger;
