const vscode = require('vscode');
const fs = require('fs');
const path = require('path');
const utils = require('./utils.js');
const translate = require('./translate.js');

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
        if (!utils.isFileExists(settingFilePath)) {
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
        const fileList = utils.getI18nPaths();
        if (fileList.length > 0) {
          fileList.forEach((file) => {
            const type = file.type;
            const filePath = file.path;
            const fileContent = fs.readFileSync(filePath, 'utf8');
            const d = JSON.parse(fileContent);
            data[type] = d;
          });
          const extendData = {};
          let foundedkey = findKey(selectedText, data, null, extendData);
          if (!foundedkey) {
            if (!selectedText.includes(' ')) {
              await vscode.window
                .showInputBox({
                  placeHolder: 'please input new key, eg:page.name',
                })
                .then((input) => {
                  if (input) {
                    if (input.includes('.')) {
                      try {
                        const newKey = input;
                        const type = input.split('.')[0];
                        const newText = selectedText.replace(/[\'\"]/gi, '');
                        utils.updateI18nConfig(data, type, newKey, newText);
                        translate.translate(type, newKey, newText);
                        foundedkey = input;
                      } catch (e) {
                        vscode.window.showErrorMessage(e);
                      }
                    }
                  }
                });
            } else {
              vscode.window.showWarningMessage('选中的文本不能包含空格');
            }
          }
          if (foundedkey) {
            editor.edit((editBuilder) => {
              let newword = "$t('" + foundedkey + "'";
              if (detectSelectedTextType() === 'script') {
                if (!newword.startsWith('this.')) {
                  newword = 'this.' + newword;
                }
              }
              if (JSON.stringify(extendData) != '{}') {
                newword +=
                  ',' + JSON.stringify(extendData).replace(/"/g, "'") + ')';
              } else {
                newword += ')';
              }
              editBuilder.replace(selection, newword);
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

// 寻找中文匹配的key
function findKey(cnword, data, path, extendData) {
  cnword = cnword.trim();
  if (typeof data === 'object' && data !== null) {
    for (const [k, v] of Object.entries(data)) {
      const new_path = path ? `${path}.${k}` : k;
      const p = findKey(cnword, v, new_path, extendData);
      if (p !== null) {
        return p;
      }
    }
  } else if (typeof data === 'string') {
    if (cnword.replace(/[\'\"]/gi, '').toLowerCase() === data.toLowerCase()) {
      return path;
    } else if (findExtend(data, cnword.replace(/[\'\"]/gi, ''), extendData)) {
      return path;
    }
  }
  return null;
}

function findExtend(i18ntext, text, data) {
  const str1 = i18ntext.split(/({.+?})/g).filter((s) => s !== '');
  const str2 = text.split(/[\s]+/g).filter((s) => s !== '');
  if (str1.length > 1 && str1.length === str2.length) {
    let isSame = true;
    for (let i = 0; i < str1.length; i++) {
      if (str1[i].toLowerCase() != str2[i].toLowerCase()) {
        if (str1[i].startsWith('{') && str1[i].endsWith('}')) {
          data[str1[i].replace('{', '').replace('}', '')] = str2[i];
        } else {
          Object.keys(data).forEach((key) => {
            delete data[key];
          });
          isSame = false;
          break;
        }
      }
    }
    return isSame;
  }
  return false;
}

module.exports = {
  activate,
  deactivate,
};