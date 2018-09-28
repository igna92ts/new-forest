const winston = require('winston'),
  MultiProgress = require('multi-progress'),
  multi = new MultiProgress(process.stderr),
  ora = require('ora'),
  fs = require('fs'),
  logDir = `${__dirname}/logs`;

if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir);
}

const tsFormat = () => new Date().toLocaleTimeString();
const logger = winston.createLogger({
  transports: [
    new winston.transports.File({
      name: 'complete',
      filename: `${logDir}/complete.log`,
      timestamp: tsFormat,
      json: false,
      colorize: false,
      prettyPrint: true
    }),
    new winston.transports.File({
      name: 'errors',
      filename: `${logDir}/errors.log`,
      timestamp: tsFormat,
      colorize: false,
      json: false,
      level: 'error',
      prettyPrint: true
    })
  ]
});

logger.spinner = ora;

const progressBars = {};
logger.progress = (key, total, message = '') => {
  if (!progressBars[key]) {
    progressBars[key] = multi.newBar(` ${message} [:bar] :percent :etas`, {
      complete: '=',
      incomplete: ' ',
      width: 100,
      total
    });
  }
  return {
    tick: count => progressBars[key].tick(count),
    curr: () => progressBars[key].curr
  };
};

module.exports = logger;
