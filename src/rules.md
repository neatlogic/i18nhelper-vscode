# I18n 规则说明

本文档只说明三类规则：基础模块、商业版本的 `router` / `term`、商业模块与基础模块同名时的读取和写入边界。

## 1. 基础模块

基础模块指不在 `/src/commercial-module/` 或 `/src/community-module/` 下的页面。

- `dialog`、`form`、`message`、`page` 是公共语言包，可以跨模块复用
- 基础模块新增 key 时，默认写入当前类型配置的 `path` / `path_en`
- 基础模块的 `router`、`term` 也写入基础公共语言包，例如 `/src/resources/assets/languages/router/zh.json`、`/src/resources/assets/languages/term/zh.json`
- 自动补充读取的共享语言文件只参与读取，不改变默认写入位置

普通分类配置示例：

```json
{
  "type": "dialog",
  "path": "/src/resources/assets/languages/dialog/zh.json",
  "path_en": "/src/resources/assets/languages/dialog/en.json"
}
```

## 2. 商业版本的 router 和 term

当前文件位于 `/src/commercial-module/<module>/` 时，`router` 和 `term` 要按当前商业模块读写，不能写回基础公共 `router` / `term`。

- 当前模块的路由 key 写为 `router.<module>.xxx`
- 当前模块的术语 key 写为 `term.<module>.xxx`
- 新增 `router` / `term` key 时，写入当前商业模块自己的语言文件
- 公共 `router` / `term` 只作为同名旧 key 的兜底读取来源，不作为商业模块新增 key 的写入目标
- 不允许在当前商业模块中新增或反查其他模块命名空间，例如 `term.<other-module>.xxx`
- `dialog`、`form`、`message`、`page` 仍然可以作为公共语言包跨模块复用

配置示例：

```json
{
  "type": "term",
  "path": "/src/resources/assets/languages/term/zh.json",
  "path_en": "/src/resources/assets/languages/term/en.json",
  "children": [
    {
      "type": "term.inspect.",
      "path": "/src/commercial-module/inspect/languages/term/zh.json",
      "path_en": "/src/commercial-module/inspect/languages/term/en.json"
    }
  ]
}
```

上面配置表示：只有当前文件位于 `/src/commercial-module/inspect/` 时，`term.inspect.xxx` 才会读写商业 inspect 的 term 文件。其他商业模块不能命中这条 children。

`router` 的配置方式相同，只是类型和 key 前缀换成 `router.<module>.`。

## 3. 商业模块与基础模块同名

当 `/src/commercial-module/<module>/` 和 `/src/views/pages/<module>/` 同时存在时，模块名称相同不代表读写同一个语言文件，必须按当前文件路径区分。

- 当前文件在 `/src/commercial-module/<module>/` 下：`router.<module>.xxx`、`term.<module>.xxx` 优先读写商业模块自己的 children 语言文件
- 当前文件在 `/src/views/pages/<module>/` 下：按基础模块规则读写公共 `router` / `term`
- 当前文件在其他商业模块下：不能命中这个 `<module>` 的 children，也不能反查这个 `<module>` 的商业语言文件
- 商业模块读取公共 `router` / `term` 时，只允许读取与当前模块同名的命名空间作为旧 key 兜底
- 新增 key 时，商业模块只能写当前模块命名空间，不能写其他模块命名空间

例如当前文件在 `/src/commercial-module/inspect/` 下：

- 可以新增 `term.inspect.xxx`，写入 `/src/commercial-module/inspect/languages/term/zh.json`
- 不可以新增 `term.cmdb.xxx`，因为 `cmdb` 是其他模块命名空间
- 只允许兜底读取公共 `term.inspect.*`，不能兜底读取公共 `term.cmdb.*`

这一规则同样适用于 `Alt + T` 反查：反查范围必须跟当前文件所属模块一致，避免把其他模块的 key 匹配到当前文件。
