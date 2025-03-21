const fs = require('fs');
const path = require('path');
const deepExtend = require('deep-extend');

const config = {};

function validConfigFile(filename) {
  return (
    path.extname(filename) === '.js' &&
    filename !== 'index.js' &&
    filename !== 'local.js' &&
    !filename.match(/.*\.sample\.js/)
  );
}

fs.readdirSync(__dirname)
  .filter(validConfigFile)
  .forEach((filename) => {
    const configName = path.basename(filename, '.js');
    const filepath = path.join(__dirname, filename);
    config[configName] = require(filepath);
  });

if (fs.existsSync(path.join(__dirname, 'local.js'))) {
  deepExtend(config, require(path.join(__dirname, 'local.js')));
}

if (fs.existsSync(path.join(__dirname, 'local-from-staging.js'))) {
  deepExtend(config, require(path.join(__dirname, 'local-from-staging.js')));
}

if (fs.existsSync(path.join(__dirname, 'local-site-build-tasks.json'))) {
  const rawFile = fs.readFileSync(
    path.join(__dirname, 'local-site-build-tasks.json'),
    'utf-8',
  );
  deepExtend(config, {
    localSiteBuildTasks: JSON.parse(rawFile),
  });
}

let environment = process.env.NODE_ENV;

// TODO: the dev deploy needs production.js to connect
// to the DB in certain situations (which?)
// but otherwise should use NODE_ENV as 'development'; we override in this one case
if (process.env.APP_ENV === 'dev') {
  environment = 'production';
}

if (environment) {
  const environmentFilepath = path.join(__dirname, 'env', `${environment}.js`);
  if (fs.existsSync(environmentFilepath)) {
    deepExtend(config, require(environmentFilepath));
  }
}

module.exports = config;
