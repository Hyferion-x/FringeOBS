const morgan = require('morgan');
const fs = require('fs');
const path = require('path');

const logStream = fs.createWriteStream(path.join(__dirname, '../Logs/access.log'), { flags: 'a' });

module.exports = morgan('combined', { stream: logStream });