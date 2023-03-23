# i18nhelper

## 功能

自动转换选中文本为i18n中的key，如果中文不存在，则自动往对应的i18n配置文件中写入key和文本内容。

## 使用要求

本插件要求i18n文件已经按类型组织起来，例如分别有两个i18n配置文件page/zh.json和button/zh.json，分别管理页面翻译和按钮翻译，内部组织结构是：

page/zh.json:
``` json
{
"name":"名称",
"age":"年龄"
}
```
button/zh.json
``` json
{
"submit":"提交",
"delete":"删除"
}
```

页面引用：`$t('page.name')`或`$t('button.submit')`

如果您的i18n组织架构和上面类似，则可以使用本插件方便的管理所有key和文案。

## 使用方式

### 第一次使用
1. 在编辑器中打开鼠标右键菜单，点击i18nhelper:配置 配置文件路径。

``` json
{
  "i18nhelper": [
    {
      "type": "page",
      "path": "/src/resources/assets/languages/page/zh.json"
    },
    {
      "type": "button",
      "path": "/src/resources/assets/languages/button/zh.json"
    }
  ],
   "translate": {
    "source": "zh",
    "target": ["en"],//目标语言列表，支持同时翻译成多个目标语言
    "appid": "百度appid",
    "secret": "百度密钥"
  }
}
```
path是从workspace开始的相对路径，type是页面引用时的分类前缀。

2. 选中一段文本，打开鼠标右键，点击i18nhelper:替换，插件会自动根据选中文本替换成配置文件中对应的key，如果key不存在，可以通过输入框输入新的key，插件会自动把key和文本写入对应分类的配置文件中。

3. 如果配置了translate，会启动自动翻译，翻译来源百度开放api，请自行到[百度翻译](http://api.fanyi.baidu.com/)开放平台申请账号。
