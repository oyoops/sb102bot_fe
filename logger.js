const winston = require('winston');
require('winston-papertrail').Papertrail;

const papertrailTransport = new winston.transports.Papertrail({
  host: 'logsN.papertrailapp.com', // Your Papertrail log destination host
  port: 12345,                     // Your Papertrail log destination port
  program: 'YourAppName',          // Optional: A name for your app
  colorize: true
});

const logger = winston.createLogger({
  transports: [papertrailTransport]
});

papertrailTransport.on('error', function(err) {
  // Handle logging errors here
});

papertrailTransport.on('connect', function(message) {
  console.log('Connected to Papertrail:', message);
});

module.exports = logger;
