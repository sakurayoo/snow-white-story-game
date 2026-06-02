# AI 問答助手

類似 ChatGPT 介面的 AI 問答應用，使用 Claude AI。

## 技術棧

| 層  | 技術 |
|-----|------|
| 前端 | React 18 + Bootstrap 5 + React-Bootstrap |
| 後端 | ASP.NET Core Web API (.NET 8) |
| 資料庫 | MSSQL + Entity Framework Core 8 |
| AI | Anthropic Claude (claude-sonnet-4-20250514) |

## 啟動步驟

### 1. 前置需求

- Node.js 18+
- .NET 8 SDK
- SQL Server（本機或 Express）

### 2. 後端設定

```bash
cd AiChatApp.API/AiChatApp.API
```

編輯 `appsettings.json`，填入連線字串與 Claude API Key：

```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Server=.;Database=AiChatDb;Trusted_Connection=True;TrustServerCertificate=True;"
  },
  "Claude": {
    "ApiKey": "sk-ant-xxxx"
  }
}
```

建立資料庫：

```bash
dotnet ef database update
```

啟動 API：

```bash
dotnet run
```

API 預設執行於 `http://localhost:5000`

### 3. 前端設定

```bash
cd ai-chat-frontend
```

編輯 `.env`（預設已正確）：

```
REACT_APP_API_URL=http://localhost:5000/api
```

安裝套件並啟動：

```bash
npm install
npm start
```

前端預設執行於 `http://localhost:3000`

## 功能

- 建立多個對話，標題自動用第一則訊息前 20 字
- 與 Claude AI 即時對話（完整歷史上下文）
- 對話記錄儲存於 MSSQL 資料庫
- 可刪除對話
- Enter 送出、Shift+Enter 換行
- 深色主題 UI
