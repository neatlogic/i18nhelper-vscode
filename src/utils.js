const vscode = require('vscode');
const fs = require('fs');
const path = require('path');

function getConfig() {
  const settingFileName = 'i18nhelper-setting.json';
  const folders = vscode.workspace.workspaceFolders;
  if (folders && folders.length > 0) {
    const workspacePath = folders[0] && folders[0].uri && folders[0].uri.fsPath;
    const filePath = path.join(workspacePath, '.vscode', settingFileName);
    if (isFileExists(filePath)) {
      const fileContent = fs.readFileSync(filePath, 'utf8');
      try {
        return JSON.parse(fileContent);
      } catch (e) {}
    }
  }
  return {};
}

function isFileExists(filePath) {
  try {
    fs.accessSync(filePath, fs.constants.F_OK);
    return true;
  } catch (error) {
    return false;
  }
}

function getI18nPaths(language) {
  try {
    const afileList = [];
    const folders = vscode.workspace.workspaceFolders;
    if (folders && folders.length > 0) {
      const workspacePath =
        folders[0] && folders[0].uri && folders[0].uri.fsPath;
      const confObj = getConfig();
      if (confObj['i18nhelper'] && confObj['i18nhelper'].length > 0) {
        confObj['i18nhelper'].forEach((f) => {
          let p;
          if (language) {
            if (f['path_' + language]) {
              p = f['path_' + language];
            }
          } else {
            p = f.path;
          }
          if (p) {
            const absolutedPath = path.join(workspacePath, p);
            if (isFileExists(absolutedPath)) {
              afileList.push({
                type: f.type,
                path: absolutedPath,
              });
            }
          }
        });
      }
    }
    return afileList;
  } catch (e) {
    vscode.window.showErrorMessage('get i18n config file failed,error:' + e);
  }
  return [];
}

function updateI18nConfig(data, type, key, value, language) {
  const keys = key.split('.');
  if (keys.length > 1) {
    const i18nList = getI18nPaths(language);
    let i18nPath;
    let allType = '';
    i18nList.forEach((i18n) => {
      if (i18n.type === type) {
        i18nPath = i18n.path;
      }
      allType += ' ' + i18n.type;
    });
    if (i18nPath) {
      let obj = data;
      let nowKey = '';
      for (const k of keys.slice(0, -1)) {
        if (nowKey) {
          nowKey += '.';
        }
        nowKey += k;
        if (obj.hasOwnProperty(k)) {
          if (typeof obj[k] === 'object') {
            obj = obj[k];
          } else {
            //如果是翻译，则无视原来的结构
            if (language) {
              obj[k] = {};
              obj = obj[k];
            } else {
              throw 'key:' + nowKey + ' is exists in ' + type;
            }
          }
        } else {
          obj[k] = {};
          obj = obj[k];
        }
      }
      if (obj.hasOwnProperty(keys[keys.length - 1])) {
        if (!language) {
          throw 'key:' + key + ' is exists in ' + type;
        }
      }
      obj[keys[keys.length - 1]] = value;
      fs.writeFileSync(
        i18nPath,
        JSON.stringify(data[keys[0]], null, 2),
        'utf8'
      );
      vscode.window.showInformationMessage(
        'key:' + key + ' is appended to ' + type
      );
    } else {
      vscode.window.showErrorMessage('new key must start with ' + allType);
    }
  }
}

module.exports = { getConfig, isFileExists, getI18nPaths, updateI18nConfig };
