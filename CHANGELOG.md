# Change Log

## [0.0.1] - 2023-03-18
- 初始发布

## [0.0.2] - 2023-03-19
### 新增
- 增加format配置，激活格式话功能，key将会替换掉?，例如:`$t('?')`，替换完成后变成`$t('key')`。
- 自动识别替换位置是在template中还是script中，如果在script中，并且配置了format，会根据需要自动补充this.前缀。

## [0.0.3] - 2023-03-20
### 新增
- 增加forecast配置，激活模糊匹配功能，目前只支持中文，利用余弦相似度计算选中文本和已存在文本的相似度，如果i18n文件已经很大，激活此功能可能会影响性能，慎重使用。
  配置范例： `{"forecast": 8}`，范围是0-10，越接近10代表越相似，0代表禁用此功能。

## [0.0.4] - 2023-03-20
### nothing change

## [0.0.5] - 2023-03-20
### 修改
- 分词依赖包改成@node-rs/jieba

## [0.0.6]  2023-03-20
### 修改
- 由于效果不好，暂时去掉预测功能。
- 如果选中文本包含引号，会自动过滤并完成替换。

## [0.0.7]  2023-03-20
### 修改
- 如果选中文本包含空格和\t，会自动过滤并完成替换。

## [0.0.8]  2023-03-21
### 修改
- 去掉format配置，默认都是组装成$t('xx')的方式进行替换。
- 支持带数据的key替换，选中文本需要用空格分开就能识别，例如有key:pleaseinput="请输入{target}"，选中文本为：请输入 名称，就能识别出来并自动替换成：$t('pleaseinput',{target:'名称'})

## [0.0.9] 2023-03-22
### 新增
- 增加翻译功能，利用百度api进行翻译，配置文件改为如下方式配置：
``` json
{
  "i18nhelper": [
    {
      "type": "page",
      "path": "/src/resources/assets/languages/page/zh.json",
      "path_en": "/src/resources/assets/languages/page/en.json"//对应语言文件路径，key符合path_language规范。
    },
    {
      "type": "term",
      "path": "/src/resources/assets/languages/term/zh.json",
      "path_en": "/src/resources/assets/languages/term/en.json"
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

## [0.0.10] 2023-03-23
### 修改
- bug fixed

## [1.1.0] 2023-06-05

### 增加
- 已被替换成i18n键的文案，会用内联的方式提示原本的文案内容。

## [1.1.1] 2023-06-05

### 修改
- 解决卡顿闪屏问题。
