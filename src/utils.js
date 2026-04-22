const vscode = require('vscode');
const fs = require('fs');
const path = require('path');

function getWorkspacePath() {
  const folders = vscode.workspace.workspaceFolders;
  if (folders && folders.length > 0) {
    return folders[0] && folders[0].uri && folders[0].uri.fsPath;
  }
  return '';
}

function getConfig() {
  const settingFileName = 'i18nhelper-setting.json';
  const workspacePath = getWorkspacePath();
  if (workspacePath) {
    const filePath = path.join(workspacePath, '.vscode', settingFileName);
    if (isFileExists(filePath)) {
      const fileContent = fs.readFileSync(filePath, 'utf8').replace(/^\uFEFF/, '');
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

function resolveConfigPath(targetPath) {
  if (!targetPath) {
    return '';
  }
  if (/^[A-Za-z]:[\\/]/.test(targetPath) || /^\\\\/.test(targetPath)) {
    return targetPath;
  }
  const workspacePath = getWorkspacePath();
  if (!workspacePath) {
    return '';
  }
  const normalizedRelativePath = targetPath.replace(/^[\\/]+/, '');
  return path.join(workspacePath, normalizedRelativePath);
}

function getConfigItems() {
  const confObj = getConfig();
  if (confObj['i18nhelper'] && confObj['i18nhelper'].length > 0) {
    return confObj['i18nhelper'];
  }
  return [];
}

function getTypeConfig(type) {
  return getConfigItems().find((item) => item.type === type) || null;
}

function getLanguageValue(config, baseKey, language) {
  if (!config) {
    return null;
  }
  if (language) {
    const languageKey = baseKey + '_' + language;
    if (config[languageKey]) {
      return config[languageKey];
    }
  }
  return config[baseKey] || null;
}

function uniquePaths(paths) {
  const seen = new Set();
  return paths.filter((item) => {
    if (!item) {
      return false;
    }
    if (seen.has(item)) {
      return false;
    }
    seen.add(item);
    return true;
  });
}

function normalizePathForCompare(targetPath) {
  return (targetPath || '').replace(/\\/g, '/').toLowerCase();
}

function inferDefaultReadPaths(item, language) {
  if (!item || !item.type) {
    return [];
  }
  const fileName = language ? `${language}.json` : 'zh.json';
  const inferredPath = `/src/resources/assets/languages/${item.type}/${fileName}`;
  const primaryPath = getLanguageValue(item, 'path', language);
  if (
    primaryPath &&
    normalizePathForCompare(primaryPath) === normalizePathForCompare(inferredPath)
  ) {
    return [];
  }
  return [inferredPath];
}

function getTypeReadPaths(type, language) {
  const items = getConfigItems().filter((item) => item.type === type);
  const paths = [];
  items.forEach((item) => {
    const primaryPath = getLanguageValue(item, 'path', language);
    if (primaryPath) {
      paths.push(primaryPath);
    }
    inferDefaultReadPaths(item, language).forEach((p) => paths.push(p));
    const fallbackReadPaths = getLanguageValue(item, 'fallbackReadPaths', language);
    if (Array.isArray(fallbackReadPaths)) {
      fallbackReadPaths.forEach((p) => paths.push(p));
    }
  });
  return uniquePaths(paths)
    .map((p) => resolveConfigPath(p))
    .filter((p) => p && isFileExists(p));
}

function normalizeForMatch(filePath) {
  return (filePath || '').replace(/\\/g, '/').toLowerCase();
}

function getEditorScope(editorFilePath) {
  const normalizedPath = normalizeForMatch(editorFilePath);
  const commercialMatch = normalizedPath.match(
    /\/src\/commercial-module\/([^/]+)\//
  );
  if (commercialMatch) {
    return {
      scopeType: 'commercial-module',
      scopeName: commercialMatch[1],
    };
  }
  const communityMatch = normalizedPath.match(
    /\/src\/community-module\/([^/]+)\//
  );
  if (communityMatch) {
    return {
      scopeType: 'community-module',
      scopeName: communityMatch[1],
    };
  }
  return {
    scopeType: 'base',
    scopeName: '',
  };
}

function isModulePath(filePath) {
  const normalizedPath = normalizeForMatch(filePath);
  return (
    normalizedPath.includes('/src/commercial-module/') ||
    normalizedPath.includes('/src/community-module/')
  );
}

function isPathAllowedForScope(filePath, scope) {
  const normalizedPath = normalizeForMatch(filePath);
  if (scope.scopeType === 'base') {
    return !isModulePath(normalizedPath);
  }
  if (scope.scopeType === 'commercial-module') {
    return (
      !normalizedPath.includes('/src/commercial-module/') ||
      normalizedPath.includes(
        `/src/commercial-module/${scope.scopeName.toLowerCase()}/`
      )
    );
  }
  if (scope.scopeType === 'community-module') {
    return (
      !normalizedPath.includes('/src/community-module/') ||
      normalizedPath.includes(
        `/src/community-module/${scope.scopeName.toLowerCase()}/`
      )
    );
  }
  return true;
}

function getScopedTypeReadPaths(type, editorFilePath, language) {
  const scope = getEditorScope(editorFilePath);
  const scopedPaths = getTypeReadPaths(type, language).filter((filePath) =>
    isPathAllowedForScope(filePath, scope)
  );
  const additionalRulePaths = getAdditionalRuleReadPaths(type, editorFilePath, language);
  return uniquePaths([...scopedPaths, ...additionalRulePaths]);
}

function getI18nPaths(language) {
  try {
    return getConfigItems()
      .map((item) => {
        const readPaths = getTypeReadPaths(item.type, language);
        if (readPaths.length > 0) {
          return {
            type: item.type,
            path: readPaths[0],
          };
        }
        return null;
      })
      .filter((item) => item !== null);
  } catch (e) {
    vscode.window.showErrorMessage('get i18n config file failed,error:' + e);
  }
  return [];
}

function readJsonFile(filePath) {
  if (!filePath || !isFileExists(filePath)) {
    return {};
  }
  const fileContent = fs.readFileSync(filePath, 'utf8');
  try {
    return JSON.parse(fileContent);
  } catch (e) {
    return {};
  }
}

function mergeDeep(target, source) {
  if (!source || typeof source !== 'object' || Array.isArray(source)) {
    return target;
  }
  Object.keys(source).forEach((key) => {
    const sourceValue = source[key];
    const targetValue = target[key];
    if (
      sourceValue &&
      typeof sourceValue === 'object' &&
      !Array.isArray(sourceValue)
    ) {
      const baseObject =
        targetValue && typeof targetValue === 'object' && !Array.isArray(targetValue)
          ? targetValue
          : {};
      target[key] = mergeDeep(baseObject, sourceValue);
    } else if (target[key] === undefined) {
      target[key] = sourceValue;
    }
  });
  return target;
}

function loadI18nData(language) {
  const data = {};
  const types = uniquePaths(getConfigItems().map((item) => item.type));
  types.forEach((type) => {
    const mergedData = {};
    const readPaths = uniquePaths([
      ...getTypeReadPaths(type, language),
      ...getAdditionalRuleReadPaths(type, '', language),
    ]);
    readPaths.forEach((filePath) => {
      mergeDeep(mergedData, readJsonFile(filePath));
    });
    data[type] = mergedData;
  });
  return data;
}

function loadScopedI18nData(editorFilePath, language) {
  const data = {};
  const types = uniquePaths(getConfigItems().map((item) => item.type));
  types.forEach((type) => {
    const mergedData = {};
    const readPaths = getScopedTypeReadPaths(type, editorFilePath, language);
    readPaths.forEach((filePath) => {
      mergeDeep(mergedData, readJsonFile(filePath));
    });
    data[type] = mergedData;
  });
  return data;
}

function findValueInObject(json, key) {
  if (!json || typeof json !== 'object') {
    return null;
  }
  let current = json;
  const keys = key.split('.');
  for (const item of keys) {
    if (
      !current ||
      typeof current !== 'object' ||
      Array.isArray(current) ||
      !Object.prototype.hasOwnProperty.call(current, item)
    ) {
      return null;
    }
    current = current[item];
  }
  if (current === undefined || current === null) {
    return null;
  }
  return current.toString();
}

function getRulePriority(rule) {
  return rule && rule.type ? rule.type.length : 0;
}

function getAdditionalRuleReadPaths(type, editorFilePath, language) {
  const config = getTypeConfig(type);
  if (!config || !Array.isArray(config.children)) {
    return [];
  }
  const scope = editorFilePath ? getEditorScope(editorFilePath) : null;
  return uniquePaths(
    config.children
      .map((rule) => resolveConfigPath(getLanguageValue(rule, 'path', language)))
      .filter((filePath) => filePath && isFileExists(filePath))
      .filter((filePath) => !scope || isPathAllowedForScope(filePath, scope))
  );
}

function resolveWriteRule(type, fullKey) {
  const config = getTypeConfig(type);
  if (!config || !Array.isArray(config.children)) {
    return null;
  }
  const matchedRules = config.children
    .filter((rule) => {
      return rule && rule.type && fullKey.startsWith(rule.type);
    })
    .sort((a, b) => getRulePriority(b) - getRulePriority(a));
  if (matchedRules.length > 0) {
    return matchedRules[0];
  }
  return null;
}

function resolveWritePath(type, fullKey, language) {
  const rule = resolveWriteRule(type, fullKey);
  if (rule) {
    const resolvedPath = resolveConfigPath(getLanguageValue(rule, 'path', language));
    if (resolvedPath) {
      return resolvedPath;
    }
  }
  const config = getTypeConfig(type);
  if (!config) {
    return '';
  }
  return resolveConfigPath(getLanguageValue(config, 'path', language));
}

function getWritableTypes() {
  return uniquePaths(getConfigItems().map((item) => item.type)).join(' ');
}

function updateI18nConfig(type, key, value, language, editorFilePath) {
  const keys = key.split('.');
  if (keys.length <= 1) {
    return;
  }
  const i18nPath = resolveWritePath(type, key, language);
  if (!i18nPath) {
    vscode.window.showErrorMessage(
      'new key must start with ' + getWritableTypes()
    );
    return;
  }

  const fileDir = path.dirname(i18nPath);
  if (!isFileExists(fileDir)) {
    fs.mkdirSync(fileDir, { recursive: true });
  }

  const data = readJsonFile(i18nPath);
  let obj = data;
  let nowKey = type;
  const localKeys = keys.slice(1);
  for (const item of localKeys.slice(0, -1)) {
    nowKey += '.' + item;
    if (Object.prototype.hasOwnProperty.call(obj, item)) {
      if (typeof obj[item] === 'object' && !Array.isArray(obj[item])) {
        obj = obj[item];
      } else if (language) {
        obj[item] = {};
        obj = obj[item];
      } else {
        throw 'key:' + nowKey + ' is exists in ' + type;
      }
    } else {
      obj[item] = {};
      obj = obj[item];
    }
  }
  const lastKey = localKeys[localKeys.length - 1];
  if (Object.prototype.hasOwnProperty.call(obj, lastKey) && !language) {
    throw 'key:' + key + ' is exists in ' + type;
  }
  obj[lastKey] = value;
  fs.writeFileSync(i18nPath, JSON.stringify(data, null, 2), 'utf8');
  vscode.window.showInformationMessage(
    'key:' + key + ' is appended to ' + type
  );
}

async function findValueByKey(filePath, key) {
  const fileUri = vscode.Uri.file(path.resolve(filePath));
  let fileContent;

  try {
    const document = await vscode.workspace.openTextDocument(fileUri);
    fileContent = document.getText();
  } catch (err) {
    console.error(`Cannot open file: ${filePath}`);
    return '';
  }

  let json;
  try {
    json = JSON.parse(fileContent);
  } catch (err) {
    console.error(`Error parsing JSON from file: ${filePath}`);
    return null;
  }

  return findValueInObject(json, key);
}

module.exports = {
  findValueByKey,
  findValueInObject,
  getConfig,
  getI18nPaths,
  getTypeReadPaths,
  isFileExists,
  loadI18nData,
  updateI18nConfig,
  loadScopedI18nData
};
