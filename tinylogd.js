#!/usr/bin/env node

const winston = require('winston');
const gelfserver = require('graygelf/server')
require('winston-daily-rotate-file');

function getLogger(loggers, tag) {
  let logger = loggers[tag];
  if( !logger ) {
    logger = loggers[tag] = winston.createLogger({
      exitOnError: false,
      level: 'verbose',
      transports: [
        // new winston.transports.Console(),
        new winston.transports.DailyRotateFile({ filename: tag + '-%DATE%.log',
          dirname: '/logs/',
          level: "verbose",
          datePattern: 'YYYY-MM-DD',
          zippedArchive: true,
          maxSize: '1m',
          // maxFiles: '14d' 
        })
      ]
    });
    console.log("New logger ", tag, " created.");
  }
  return logger;
}

const server = gelfserver()
const loggers = {};
const winstonLevelByGelfLevel = {0: 'error', 1: 'warn', 2: 'info', 3: 'verbose', 4: 'debug'};

server.on('message', function (message) {
  const tag = message._tag || message._container || 'default';
  const logger = getLogger(loggers, tag);
  message.level = winstonLevelByGelfLevel[message.level] || 'verbose';
  logger.log(message);
})
server.listen(12201);
console.log("tinylogd ready...");

var signals = ['SIGTERM', 'SIGINT'];
signals.forEach(function(signal) {
  process.on(signal, function () {
    console.log("Shutting down...");
    server.close();
  });
});