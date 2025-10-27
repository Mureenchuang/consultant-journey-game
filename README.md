# 顧問養成計劃 (Consultant Training Program)

這是一個互動式學習遊戲，透過各種專案管理、顧問應對和溝通情境，幫助玩家建立信任值與團隊默契，模擬真實顧問任務挑戰。

## 功能特色

- 多章節模組：專案啟動、專案執行、風險管理、進階溝通技巧
- 答題即時更新信任值與團隊默契
- 提供解析卡片與延伸學習資源
- 互動化 UI，支援多選題與解析顯示

## 運行方式

```bash
# 安裝依賴
npm install

# 開發模式
npm run dev

# 編譯生產版本
npm run build
```

## 技術棧

- React 18
- Framer Motion
- Vite
- TailwindCSS

## 題庫管理

所有題目皆可在 `src/questions.json` 編輯、擴充，支援：

- 題目文字
- 選項
- 答對/答錯影響值（trust / team）
- 提示文字與延伸學習連結

## 部署

可使用 Vercel、Netlify 或 GitHub Pages 進行快速部署。

## 專案結構

```
consultant-journey-game/
├─ public/
│  └─ index.html
├─ src/
│  ├─ App.jsx
│  ├─ main.jsx
│  ├─ index.css
│  └─ questions.json
├─ .gitignore
├─ package.json
└─ README.md
```
