中文 / [English](README.en.md)

<p>
    <a href="https://opensource.org/license/gpl-3-0/" alt="License">
        <img src="https://img.shields.io/badge/License-GPL--3.0-green" /></a>
<a target="_blank" href="https://join.slack.com/t/neatlogichome/shared_invite/zt-1w037axf8-r_i2y4pPQ1Z8FxOkAbb64w">
<img src="https://img.shields.io/badge/Slack-Neatlogic-orange" /></a>
<a target="_blank" href="https://marketplace.visualstudio.com/items?itemName=neatlogic.i18nhelper"><img alt="Visual Studio Marketplace Installs" src="https://img.shields.io/visual-studio-marketplace/i/neatlogic.i18nhelper"></a></p>

---

## 功能

自动转换选中文本为 i18n 中的 key，如果中文不存在，则自动往对应的 i18n 配置文件中写入 key 和文本内容。
![intro.gif](images/intro.gif)

## 使用要求

本插件要求 i18n 文件已经按类型组织起来，例如分别有两个 i18n 配置文件 page/zh.json 和 button/zh.json，分别管理页面翻译和按钮翻译，内部组织结构是：

page/zh.json:

```json
{
  "name": "名称",
  "age": "年龄"
}
```

button/zh.json

```json
{
  "submit": "提交",
  "delete": "删除"
}
```

页面引用：`$t('page.name')`或`$t('button.submit')`

```js
$t("page.name");
$t("button.submit");
```

如果你的 i18n 结构和上面类似，就可以使用本插件来管理 key 和文案。

## 使用方式

### 第一次使用

1. 在编辑器中打开右键菜单，点击 `i18nhelper: configure` 配置文件路径。

```json
{
  "i18nhelper": [
    {
      "type": "page",
      "path": "/src/resources/assets/languages/page/zh.json",
      "path_en": "/src/resources/assets/languages/page/en.json", //target language config file
      "path_jp": "/src/resources/assets/languages/page/jp.json" //target language config file
    },
    {
      "type": "button",
      "path": "/src/resources/assets/languages/button/zh.json",
      "path_en": "/src/resources/assets/languages/button/en.json", //target language config file
      "path_jp": "/src/resources/assets/languages/button/jp.json" //target language config file
    }
  ],
  "format": "$t(#('?')#(,?))",
  "forecast": 8,
  "translate": {
    "source": "zh",
    "target": ["en","jp"],//target language list
    "appid": "百度appid",
    "secret": "百度密钥"
  }
}
```

说明：

- `path` 是从 workspace 开始的相对路径
- 顶层 `type` 是页面引用时使用的分类前缀

如果某个分类需要按不同 key 写入不同模块的语言文件，可以在该分类下配置 `children`：

```json
{
  "type": "button",
  "path": "/src/resources/assets/languages/button/zh.json",
  "path_en": "/src/resources/assets/languages/button/en.json",
  "children": [
    {
      "type": "button.operation.",
      "path": "/src/commercial-module/module/languages/button/zh.json",
      "path_en": "/src/commercial-module/module/languages/button/en.json"
    }
  ]
}
```

说明：

- `children` 用来声明附加写入规则
- 子项里的 `type` 用来匹配完整 i18n key
- 当 key 以该值开头时，插件会写入对应子项的 `path` 和 `path_en`

2. 选中一段文本，打开右键菜单，点击 `i18nhelper: replace`。  
   插件会自动根据选中文本替换成配置文件中的对应 key。  
   如果 key 不存在，可以在输入框中输入新的 key，插件会自动把 key 和文本写入对应分类的配置文件。

3. 如果配置了 `translate`，会自动调用百度翻译 API 写入目标语言文案。

4. 可为命令 `i18nhelper.replace` 配置快捷键。
