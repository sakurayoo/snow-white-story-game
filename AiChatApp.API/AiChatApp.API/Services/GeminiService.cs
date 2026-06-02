using AiChatApp.API.Models;
using System.Text;
using System.Text.Json;

namespace AiChatApp.API.Services;

public class GeminiService
{
    private readonly HttpClient _http;
    private readonly string _apiKey;
    private const string Model = "gemini-2.0-flash-lite";
    private const string SystemPrompt = """
        你是《星辰王國》互動童話冒險遊戲的故事敘述者。

        【世界設定】
        玩家身處「星辰王國」，一個充滿魔法精靈、神秘龍族、古老城堡與隱藏預言的奇幻童話世界。
        玩家扮演一位被一本發光魔法書吸入其中的普通人，必須完成古老的「星辰預言」才能回家。

        【敘述風格】
        - 用詩意優美的繁體中文，以童話故事書的口吻描述場景與事件
        - 語氣溫暖、充滿奇幻色彩，適合童話世界的氛圍
        - 每次回應不超過 180 字

        【遊戲規則】
        - 每段故事結尾，提供玩家 3 個選項，格式如下：
          ✨ A. [選項一]
          ⚔️ B. [選項二]
          🌿 C. [選項三]
        - 玩家也可以自由輸入任何行動，不限於 A/B/C
        - 記住玩家之前的選擇，讓故事保持連貫
        - 適時加入轉折、謎題與情感時刻，讓冒險充滿驚喜

        【開場指示】
        當玩家說「開始遊戲」時，請以玩家突然發現一本發光的古老魔法書，並被吸入書中作為故事開端。
        """;

    public GeminiService(IConfiguration config, IHttpClientFactory factory)
    {
        _http = factory.CreateClient("Gemini");
        _apiKey = config["Gemini:ApiKey"] ?? throw new InvalidOperationException("Gemini:ApiKey not configured");
    }

    public async Task<string> SendAsync(IEnumerable<Message> history, string newUserContent)
    {
        var contents = history
            .Select(m => new
            {
                role = m.Role == "assistant" ? "model" : "user",
                parts = new[] { new { text = m.Content } }
            })
            .Append(new
            {
                role = "user",
                parts = new[] { new { text = newUserContent } }
            })
            .ToList();

        var body = new
        {
            system_instruction = new
            {
                parts = new[] { new { text = SystemPrompt } }
            },
            contents,
            generationConfig = new { maxOutputTokens = 600 }
        };

        var url = $"https://generativelanguage.googleapis.com/v1beta/models/{Model}:generateContent?key={_apiKey}";
        var request = new HttpRequestMessage(HttpMethod.Post, url)
        {
            Content = new StringContent(JsonSerializer.Serialize(body), Encoding.UTF8, "application/json")
        };

        var response = await _http.SendAsync(request);
        var json = await response.Content.ReadAsStringAsync();

        if (!response.IsSuccessStatusCode)
            throw new HttpRequestException($"Gemini API error {response.StatusCode}: {json}");

        using var doc = JsonDocument.Parse(json);
        return doc.RootElement
                  .GetProperty("candidates")[0]
                  .GetProperty("content")
                  .GetProperty("parts")[0]
                  .GetProperty("text")
                  .GetString() ?? string.Empty;
    }
}
