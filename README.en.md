
[中文](README.md) / English

<p align="left">
    <a href="https://opensource.org/license/gpl-3-0/" alt="License">
        <img src="https://img.shields.io/badge/License-GPL--3.0-green" /></a>
<a target="_blank" href="https://join.slack.com/t/neatlogichome/shared_invite/zt-1w037axf8-r_i2y4pPQ1Z8FxOkAbb64w">
<img src="https://img.shields.io/badge/Slack-Neatlogic-orange" /></a>
</p>

---

## Feature

Automatically convert the selected text to the key in i18n. If the key does not exist, it will automatically write the key and text content to the corresponding i18n configuration file.
![intro.gif](images/intro.apng)

## Requirements

This plugin requires i18n files to be organized by type, for example, there are two i18n configuration files page/zh.json and button/zh.json respectively, which manage page translation and button translation respectively. The internal organizational structure is:

page/zh.json:
```json
{
"name": "name",
"age": "age"
}
```
button/zh.json
```json
{
"submit": "submit",
"delete": "delete"
}
```

Page reference: `$t('page.name')` or `$t('button.submit')`

If your i18n organizational structure is similar to the above, you can use this plugin to conveniently manage all keys and copywriting.


## How to use

### First time use
1. Open the right mouse button menu in the editor, and click i18nhelper: configure configuration file path.

```json
{
   "i18nhelper": [
     {
       "type": "page",
       "path": "/src/resources/assets/languages/page/zh.json",
       "path_en": "/src/resources/assets/languages/page/en.json", //target language config file
       "path_jp": "/src/resources/assets/languages/page/jp.json"//target language config file
     },
     {
       "type": "button",
       "path": "/src/resources/assets/languages/button/zh.json",
       "path_en": "/src/resources/assets/languages/button/en.json", //target language config file
       "path_jp": "/src/resources/assets/languages/button/jp.json"//target language config file
     }
   ],
    "translate": {
     "source": "en",
     "target": ["en","jp"], //target language list
     "appid": "Baidu appid",
     "secret": "Baidu key"
   }
}
```
path is the relative path starting from the workspace, and type is the category prefix when referencing the page.

2. Select a piece of text, open the right mouse button, click i18nhelper: replace, the plug-in will automatically replace the selected text with the corresponding key in the configuration file, if the key does not exist, you can enter a new key through the input box, the plug-in will automatically replace the key and The text is written to the configuration file corresponding to the category.

3. If translate is configured, automatic translation will be started. The source of the translation is Baidu’s open api. Please go to [Baidu Translation] (http://api.fanyi.baidu.com/) open platform to apply for an account.

4. Configure shortcut keys, target command: i18nhelper.replace.