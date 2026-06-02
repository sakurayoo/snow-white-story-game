# AI 問答助手專案 (AiChatApp)

## 專案概述

類似 ChatGPT 介面的 AI 問答助手，使用者可建立多個對話並與 Claude AI 互動，所有對話記錄儲存於 MSSQL 資料庫。

## 技術棧

- **前端**：React 18 + Bootstrap 5 + React-Bootstrap
- **後端**：ASP.NET Core Web API (.NET 8)
- **資料庫**：MSSQL + Entity Framework Core 8
- **AI**：Anthropic Claude API (`claude-sonnet-4-20250514`)
- **部署**：IIS

## 專案結構

```
/AiChatApp
  /AiChatApp.API/AiChatApp.API   → ASP.NET Core Web API
    /Controllers                  → ConversationsController
    /Data                         → AppDbContext (EF Core)
    /DTOs                         → ApiResponse, ConversationDto, MessageDto
    /Models                       → Conversation, Message
    /Repositories                 → IConversationRepository, IMessageRepository (+ 實作)
    /Services                     → ClaudeService (呼叫 Anthropic API)
    /Migrations                   → EF Core migration 檔案
  /ai-chat-frontend               → React 前端
    /src
      /api/api.js                 → 統一 API 呼叫封裝
      /components
        Sidebar.jsx               → 左側對話列表
        MessageList.jsx           → 訊息顯示區域
        MessageInput.jsx          → 輸入框 + 送出按鈕
      App.jsx                     → 主元件，狀態管理
      index.js                    → 進入點
```

## 資料庫設計

### Conversations
| 欄位 | 型別 | 說明 |
|------|------|------|
| Id | int PK IDENTITY | |
| Title | nvarchar(100) | 預設「新對話」，自動以第一則訊息前 20 字更新 |
| CreatedAt | datetime | GETDATE() |

### Messages
| 欄位 | 型別 | 說明 |
|------|------|------|
| Id | int PK IDENTITY | |
| ConversationId | int FK | 串聯刪除 |
| Role | nvarchar(10) | 'user' 或 'assistant' |
| Content | nvarchar(MAX) | |
| CreatedAt | datetime | GETDATE() |

## API 端點

| Method | Route | 功能 |
|--------|-------|------|
| GET | /api/conversations | 取得所有對話（降冪排列） |
| POST | /api/conversations | 建立新對話 |
| DELETE | /api/conversations/{id} | 刪除對話（含訊息） |
| GET | /api/conversations/{id}/messages | 取得對話所有訊息 |
| POST | /api/conversations/{id}/messages | 送出訊息，取得 AI 回覆 |

所有回傳格式：`{ success: bool, data: T, message: string }`

## 重要設定

- **CORS**：允許 `http://localhost:3000`（前端開發用）
- **Claude Model**：`claude-sonnet-4-20250514`，max_tokens: 1000
- **API Key**：存於 `appsettings.json` 的 `Claude:ApiKey`，不可 hardcode
- **連線字串**：存於 `appsettings.json` 的 `ConnectionStrings:DefaultConnection`
- `appsettings.json` 與 `.env` 均已加入 `.gitignore`

## 常用指令

```bash
# 建立/更新資料庫
cd AiChatApp.API/AiChatApp.API
dotnet ef database update

# 啟動後端
dotnet run

# 啟動前端
cd ai-chat-frontend
npm install && npm start
```
