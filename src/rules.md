# I18n 规则说明

本文档说明 `i18nhelper-setting.json` 的推荐配置方式，以及插件读取、写入 i18n 文件时的规则。

## 推荐配置

普通分类只需要配置类型和主语言文件路径即可。

```json
{
  "type": "dialog",
  "path": "/src/resources/assets/languages/dialog/zh.json",
  "path_en": "/src/resources/assets/languages/dialog/en.json"
}
```

### 字段说明

- `type`：分类前缀，例如 `dialog`、`form`、`message`、`page`
- `path`：当前项目中文语言文件路径，也是默认写入位置
- `path_en`：当前项目英文语言文件路径

## 读取规则

普通分类按下面顺序读取：

1. 先读取当前配置的主文件：`path` / `path_en`
2. 如果当前文件中没有匹配内容，插件会根据 `type` 自动补充读取对应的共享语言文件

自动补充读取的目标路径格式如下：

```text
/src/resources/assets/languages/<type>/zh.json
/src/resources/assets/languages/<type>/en.json
```

例如：

- `type = dialog` 时，会自动读取 `dialog` 对应的共享语言文件
- `type = page` 时，会自动读取 `page` 对应的共享语言文件

这里不需要在配置里重复声明额外路径，也不需要手动维护同样的只读配置。

## 写入规则

新增 key 时默认写入当前配置的主文件：

- 中文写入 `path`
- 英文写入 `path_en`

自动补充读取的共享文件只参与读取，不参与写入。

## 完整示例

```json
{
  "i18nhelper": [
    {
      "type": "page",
      "path": "/src/resources/assets/languages/page/zh.json",
      "path_en": "/src/resources/assets/languages/page/en.json"
    },
    {
      "type": "dialog",
      "path": "/src/resources/assets/languages/dialog/zh.json",
      "path_en": "/src/resources/assets/languages/dialog/en.json"
    }
  ],
  "format": "$t(#('?')#(,?))",
  "forecast": 8,
  "translate": {
    "source": "zh",
    "target": [
      "en"
    ],
    "appid": "",
    "secret": ""
  }
}
```

## 补充说明

如果后续某些特殊分类需要更复杂的规则，例如：

- 一个类型读取多个额外来源
- 特殊模块需要覆盖默认读取行为
- 按完整 key 决定写入目标

可以通过专门字段扩展，例如 `children`。

## 跨模块写入

如果某个类型不是简单地固定写入 `path` / `path_en`，而是需要根据完整 key 写到不同模块，可以在该类型下配置 `children`。

例如：

```json
{
  "type": "router",
  "path": "/src/resources/assets/languages/router/zh.json",
  "path_en": "/src/resources/assets/languages/router/en.json",
  "children": [
    {
      "type": "router.codehub.",
      "path": "/src/commercial-module/codehub/languages/router/zh.json",
      "path_en": "/src/commercial-module/codehub/languages/router/en.json"
    }
  ]
}
```

### children 的作用

- `children` 只控制写入位置
- 匹配时使用完整 key，例如 `router.dr.list`
- 命中规则后，写入对应规则里的 `path` / `path_en`
- 如果没有命中任何规则，才回到该类型自己的 `path` / `path_en`

### 匹配规则

插件会按下面规则匹配：

1. 先按 `type` 匹配完整 key
2. 多条规则同时命中时，优先使用更具体的规则

例如：

- `router.cmdbtransfer.sync.name` 会优先命中 `router.cmdbtransfer.`
- `router.dr.overview` 会命中 `router.dr.`
- `router.cmdb.home` 会命中 `router.cmdb.`

### 适用场景

这类规则适合下面这些场景：

- `router` 需要按模块分别写入不同目录
- `form`、`term` 这类分类也存在跨模块写入需求
- 某些 key 命名空间相同，但最终落盘位置不同

也就是说：

- 普通分类只需要 `type + path + path_en`
- 特殊分类如果存在跨模块写入，再额外加 `children`

但对普通分类来说，只保留 `type + path + path_en` 就足够了。

## Alt + T 读取限制

当某个类型配置了 `children` 后，`Alt + T` 的中文反查 key 不能跨模块匹配。

也就是说：

- 某条 `children` 指向哪个模块，这条规则对应的语言文件就只在该模块内参与反查
- 不在对应模块中时，即使该语言文件里存在相同中文，也不应该被 `Alt + T` 命中
- 这样可以避免把其他模块的 key 误匹配到当前文件

例如：

```json
{
  "type": "router",
  "path": "/src/resources/assets/languages/router/zh.json",
  "path_en": "/src/resources/assets/languages/router/en.json",
  "children": [
    {
      "type": "router.codehub.",
      "path": "/src/commercial-module/codehub/languages/router/zh.json",
      "path_en": "/src/commercial-module/codehub/languages/router/en.json"
    }
  ]
}
```

上面这类配置在 `Alt + T` 时应遵循下面规则：

- 当前文件在 `/src/commercial-module/dr/` 下时，只允许反查 `dr` 自己的 router 语言文件和公共 router 文件
- 当前文件在 `/src/commercial-module/cmdbtransfer/` 下时，只允许反查 `cmdbtransfer` 自己的 router 语言文件和公共 router 文件
- 当前文件不在对应模块下时，不允许去反查这些商业模块自己的 router 语言文件

这一条规则只影响 `Alt + T` 的读取和反查范围，不影响新增 key 时按 `children` 的写入逻辑。
