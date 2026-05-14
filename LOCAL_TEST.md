# 本地测试与打包

本文档用于在本地打包并验证 `i18nhelper` VS Code 插件。

## 1. 环境准备

请先确认本机已安装：

- `Node.js`
- `npm`
- `VS Code`

在项目根目录执行下面命令，安装依赖：

```bash
npm install
```

## 2. 执行打包

打包之前需要修改版本号：package.json 中的 `version` 字段。

在项目根目录直接执行：

```bash
npx @vscode/vsce package
```

执行成功后，根目录会生成一个 `.vsix` 文件，例如：

```bash
i18nhelper-1.1.2.vsix
```

如果当前版本号已经变更，生成的文件名会以 `package.json` 中的 `version` 为准。

## 3. 在 VS Code 中安装本地包

打开 VS Code，使用以下任一方式安装：

### 方式一：命令面板安装

1. 打开命令面板：`Ctrl + Shift + P`
2. 输入并选择 `Extensions: Install from VSIX...`
3. 选择刚刚生成的 `.vsix` 文件

### 方式二：扩展面板安装

1. 打开扩展面板
2. 点击右上角 `...`
3. 选择 `Install from VSIX...`
4. 选择生成的 `.vsix` 文件

安装完成后，按提示重载 VS Code。

## 4. 本地验证建议

安装完成后，可以按下面步骤做一次基础验证：

1. 打开任意包含中文文案的项目文件
2. 右键菜单确认能看到 `i18n-config` 和 `i18n-replace`
3. 先执行 `i18n-config` 配置 i18n 文件路径
4. 选中一段中文文本后执行 `i18n-replace`
5. 确认文本被替换为对应 key，且目标 i18n 文件有新增或更新内容

如果配置了自动翻译，还可以继续检查目标语言文件是否同步写入。

## 5. 常用排查

### 打包命令不可用

如果执行 `npx @vscode/vsce package` 失败，可以先单独安装：

```bash
npm install
npx @vscode/vsce --version
```

确认 `vsce` 可以正常执行后，再重新打包。

### 安装后没有看到命令

请确认：

- 插件安装的是最新生成的 `.vsix`
- VS Code 已完成重载
- 当前打开的是可编辑文件，而不是只读预览

### 配置不生效

请检查：

- `i18nhelper` 配置中的路径是否为相对当前 workspace 的路径
- 对应的 `zh.json`、目标语言文件是否真实存在
- JSON 文件格式是否正确
