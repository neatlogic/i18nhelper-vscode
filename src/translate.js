const crypto = require('crypto');
const fs = require('fs');
const utils = require('./utils.js');
const axios = require('axios').default;

function translate(type, newKey, newText) {
  const config = utils.getConfig()['translate'];
  if (config) {
    const source = config['source'];
    const target = config['target'];
    const appid = config['appid'];
    const secret = config['secret'];
    if (source && target && target.length > 0 && appid && secret) {
      target.forEach((t) => {
        const salt = 123456;
        const md5 = crypto.createHash('md5');
        md5.update(appid + newText + salt + secret);
        const sign = md5.digest('hex');
        axios
          .get('http://api.fanyi.baidu.com/api/trans/vip/translate', {
            params: {
              q: newText,
              from: source,
              to: t,
              appid: appid,
              salt: salt,
              sign: sign,
            },
          })
          .then((res) => {
            if (
              res.data &&
              res.data.trans_result &&
              res.data.trans_result.length > 0
            ) {
              const translated = res.data.trans_result[0].dst;
              if (translated) {
                const data = {};
                const fileList = utils.getI18nPaths(t);
                if (fileList.length > 0) {
                  fileList.forEach((file) => {
                    const filePath = file.path;
                    const fileContent = fs.readFileSync(filePath, 'utf8');
                    const d = JSON.parse(fileContent);
                    data[file.type] = d;
                  });
                  utils.updateI18nConfig(data, type, newKey, translated, t);
                }
              }
            }
          });
      });
    }
  }
}

module.exports = { translate };
