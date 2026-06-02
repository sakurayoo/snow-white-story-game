# 🌸 白雪公主的故事

互動式童話故事遊戲 — 扮演誤入魔法森林的旅人，與白雪公主一同冒險、打破邪惡皇后的詛咒。

## 技術棧

| 層 | 技術 |
|----|------|
| 前端 | React 18 + Tailwind CSS + DaisyUI |
| 後端 | ASP.NET Core Web API (.NET 10) |
| 資料庫 | SQLite + Entity Framework Core 9 |
| AI | Groq API (`llama-3.3-70b-versatile`) |

## 功能

- 📖 書本翻開動畫（3D CSS），進入童話世界
- ✍️ 打字機效果逐字顯示故事文字
- 🌸 A / B / C 選項按鈕 + D 自由輸入
- 😊 自動偵測公主心情並顯示情緒標籤
- 🌙 Groq 429 rate limit 自動倒數計時提示
- 🌗 深色 / 淺色模式切換

## 啟動步驟

### 前置需求

- Node.js 18+
- .NET 10 SDK
- [Groq API Key](https://console.groq.com)（免費）

### 1. 後端設定

```bash
cd AiChatApp.API/AiChatApp.API
```

複製設定範本並填入 Groq API Key：

```bash
cp appsettings.example.json appsettings.json
```

編輯 `appsettings.json`：

```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Data Source=aichat.db"
  },
  "Groq": {
    "ApiKey": "gsk_你的金鑰"
  }
}
```

建立資料庫並啟動：

```bash
dotnet ef database update
dotnet run
```

API 執行於 `http://localhost:5000`

### 2. 前端設定

```bash
cd ai-chat-frontend
npm install
npm start
```

前端執行於 `http://localhost:3000`

> 無需額外設定，預設已連接 `http://localhost:5000/api`
