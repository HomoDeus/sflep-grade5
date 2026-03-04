# SFLEP Grade 5 English - 外教社小学英语5年级预习网站

> 互动式英语预习网站，配合上海外语教育出版社（SFLEP）小学英语5年级教材使用。

## 在线访问

**[https://homodeus.github.io/sflep-grade5/](https://homodeus.github.io/sflep-grade5/)**

## 功能特色

- 📖 课文歌曲歌词展示
- ⚡ 字母大小写配对速度挑战
- 🎯 Simon Says 动作指令游戏
- 🕵️ 阅读理解互动问答
- 🃏 单词翻转卡片
- 🎵 音效反馈（Web Audio API）
- 📱 响应式设计，手机/平板/电脑均可使用
- 🎉 完成游戏有庆祝动画

## 课程目录

| 课程 | 标题 | 状态 |
|------|------|------|
| Starter Unit | Join in Again | ✅ 已完成 |
| Unit 1 | _待添加_ | 🔜 |
| Unit 2 | _待添加_ | 🔜 |
| ... | ... | ... |

## 项目结构

```
sflep-grade5/
├── index.html              # 首页（课程导航）
├── shared/
│   ├── base.css            # 基础样式重置
│   └── style.css           # 共享设计系统
├── starter-unit/
│   ├── index.html          # Starter Unit 页面
│   └── app.js              # Starter Unit 交互逻辑
├── unit-1/                 # (待添加)
│   ├── index.html
│   └── app.js
└── README.md
```

## 如何添加新课程

1. 复制 `starter-unit/` 文件夹，重命名为 `unit-N/`
2. 修改 `index.html` 中的课文内容、歌词、阅读材料
3. 修改 `app.js` 中的测验题目和单词列表
4. 在根目录 `index.html` 中添加新课程链接
5. 提交并推送

## 本地开发

无需构建工具，直接用浏览器打开即可：

```bash
git clone https://github.com/HomoDeus/sflep-grade5.git
cd sflep-grade5
# 用任意方式启动本地服务器，例如：
python3 -m http.server 8000
# 然后访问 http://localhost:8000
```

## 技术栈

- 纯 HTML / CSS / JavaScript，无框架依赖
- Google Fonts（Nunito + Quicksand）
- Web Audio API 音效
- CSS Animations 动画效果
- GitHub Pages 静态托管

## 贡献

欢迎 PR！如果你也在使用外教社教材，可以帮忙添加其他单元的内容。

## License

MIT
