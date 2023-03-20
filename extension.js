const vscode = require('vscode');
const fs = require('fs');
const path = require('path');
const segment = require('@node-rs/jieba'); // 导入中文分词库


/**
 * @param {vscode.ExtensionContext} context
 */
function activate(context) {
  const settingCommand = vscode.commands.registerCommand(
    'i18nhelper.configure',
    async () => {
      const folders = vscode.workspace.workspaceFolders;
      if (folders && folders.length > 0) {
        const workspacePath =
          folders[0] && folders[0].uri && folders[0].uri.fsPath;
        const settingFilePath = path.join(
          workspacePath,
          '.vscode',
          'i18nhelper-setting.json'
        );
        if (!isFileExists(settingFilePath)) {
          fs.writeFileSync(
            settingFilePath,
            JSON.stringify(
              {
                i18nhelper: [
                  { type: 'type1', path: 'path1' },
                  { type: 'type2', path: 'path2' },
                ],
              },
              null,
              2
            ),
            'utf8'
          );
        }
        const fileUri = vscode.Uri.file(settingFilePath);
        const document = await vscode.workspace.openTextDocument(fileUri);
        await vscode.window.showTextDocument(document);
      } else {
        vscode.window.showErrorMessage('请先创建workspace文件夹');
      }
    }
  );

  const replaceCommand = vscode.commands.registerCommand(
    'i18nhelper.replace',
    async () => {
      let editor = vscode.window.activeTextEditor;
      if (!editor) {
        vscode.window.showErrorMessage('editor not found.');
        return;
      }
      const selection = editor.selection;
      const selectedText = editor.document.getText(selection);
      if (selectedText) {
        const data = {};
        const fileList = getI18nPaths();
        if (fileList.length > 0) {
          fileList.forEach((file) => {
            const type = file.type;
            const filePath = file.path;
            const fileContent = fs.readFileSync(filePath, 'utf8');
            const d = JSON.parse(fileContent);
            data[type] = d;
          });
          const similarList = [];
          let foundedkey = findKey(
            getForecast(),
            selectedText,
            data,
            null,
            similarList
          );
          if (!foundedkey) {
            let content = '';
            if (similarList.length > 0) {
              similarList.forEach((c) => {
                if (content) {
                  content += ',';
                }
                content += c.word + '(' + c.path + ')';
              });
              vscode.window.showInformationMessage(
                '已存在文案参考:' + content,
                { detail: content },
                '关闭'
              );
            }
            await vscode.window
              .showInputBox({
                placeHolder: 'please input new key, eg:page.name',
              })
              .then((input) => {
                if (input) {
                  if (input.includes('.')) {
                    try {
                      updateI18nConfig(
                        data,
                        input.split('.')[0],
                        input,
                        selectedText
                      );
                      foundedkey = input;
                    } catch (e) {
                      vscode.window.showErrorMessage(e);
                    }
                  }
                }
              });
          }
          if (foundedkey) {
            editor.edit((editBuilder) => {
              if (getFormat()) {
                let newword = getFormat().replace('?', foundedkey);
                if (detectSelectedTextType() === 'script') {
                  if (!newword.startsWith('this.')) {
                    newword = 'this.' + newword;
                  }
                }
                editBuilder.replace(selection, newword);
              } else {
                editBuilder.replace(selection, foundedkey);
              }
            });
          }
        }
      }
    }
  );

  context.subscriptions.push(replaceCommand);
  context.subscriptions.push(settingCommand);
}

// This method is called when your extension is deactivated
function deactivate() {}

function detectSelectedTextType() {
  let editor = vscode.window.activeTextEditor;
  const selection = editor.selection;
  const textBeforeSelected = editor.document.getText(
    new vscode.Range(0, 0, selection.start.line, selection.start.character)
  );
  const templateIndex = textBeforeSelected.lastIndexOf('<template>');
  const scriptIndex = textBeforeSelected.lastIndexOf('<script>');
  if (templateIndex > scriptIndex) {
    return 'template';
  } else if (scriptIndex > -1) {
    return 'script';
  }
  return '';
}

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

function getFormat() {
  return getConfig()['format'] || '';
}

function getForecast() {
  const f = parseInt(getConfig()['forecast'] || 0);
  if (isNaN(f)) {
    return 0;
  }
  return f;
}

function updateI18nConfig(data, type, key, value) {
  const keys = key.split('.');
  if (keys.length > 1) {
    const i18nList = getI18nPaths();
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
            throw 'key:' + nowKey + ' is exists in ' + type;
          }
        } else {
          obj[k] = {};
          obj = obj[k];
        }
      }
      if (obj.hasOwnProperty(keys[keys.length - 1])) {
        throw 'key:' + key + ' is exists in ' + type;
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

function getI18nPaths() {
  try {
    const afileList = [];
    const folders = vscode.workspace.workspaceFolders;
    if (folders && folders.length > 0) {
      const workspacePath =
        folders[0] && folders[0].uri && folders[0].uri.fsPath;
      const confObj = getConfig();
      if (confObj['i18nhelper'] && confObj['i18nhelper'].length > 0) {
        confObj['i18nhelper'].forEach((f) => {
          const absolutedPath = path.join(workspacePath, f.path);
          if (isFileExists(absolutedPath)) {
            afileList.push({
              type: f.type,
              path: absolutedPath,
            });
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

function isFileExists(filePath) {
  try {
    fs.accessSync(filePath, fs.constants.F_OK);
    return true;
  } catch (error) {
    return false;
  }
}

// 寻找中文匹配的key
function findKey(forecast, cnword, data, path, similarList) {
  if (typeof data === 'object' && data !== null) {
    for (const [k, v] of Object.entries(data)) {
      const new_path = path ? `${path}.${k}` : k;
      const p = findKey(forecast, cnword, v, new_path, similarList);
      if (p !== null) {
        return p;
      }
    }
  } else if (typeof data === 'string') {
    if (cnword.toLowerCase() === data.toLowerCase()) {
      return path;
    }
    if (forecast) {
      const score = calculateSimilarity(cnword, data);
      if (score >= forecast) {
        similarList.push({ word: data, path: path });
      }
    }
  }
  return null;
}

function calculateSimilarity(text1, text2) {
  // 将文本转换为词语序列
  const words1 = segment.cut(text1, true);
  const words2 = segment.cut(text2, true);

  // 将词语序列转换为向量
  const vector1 = wordsToVector(words1);
  const vector2 = wordsToVector(words2);

  // 计算余弦相似度
  const dotProduct = dot(vector1, vector2);
  const magnitude1 = magnitude(vector1);
  const magnitude2 = magnitude(vector2);
  const similarity = dotProduct / (magnitude1 * magnitude2);

  // 将相似度转换为1-10的分数
  const score = Math.round((similarity + 1) * 5);

  return score;
}

// 将词语序列转换为向量
function wordsToVector(words) {
  const vector = {};
  for (let i = 0; i < words.length; i++) {
    const word = words[i];
    vector[word] = (vector[word] || 0) + 1;
    if (i > 0) {
      const prevWord = words[i - 1] + word;
      vector[prevWord] = (vector[prevWord] || 0) + 1;
    }
  }
  return vector;
}

// 计算向量点积
function dot(vector1, vector2) {
  let result = 0;
  for (const key in vector1) {
    if (vector1.hasOwnProperty(key) && vector2.hasOwnProperty(key)) {
      result += vector1[key] * vector2[key];
    }
  }
  return result;
}

// 计算向量大小
function magnitude(vector) {
  let result = 0;
  for (const key in vector) {
    if (vector.hasOwnProperty(key)) {
      result += vector[key] ** 2;
    }
  }
  return Math.sqrt(result);
}

module.exports = {
  activate,
  deactivate,
};
