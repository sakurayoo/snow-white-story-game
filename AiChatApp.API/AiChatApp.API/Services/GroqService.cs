using AiChatApp.API.Models;
using System.Text;
using System.Text.Json;

namespace AiChatApp.API.Services;

public class GroqService
{
    private readonly HttpClient _http;
    private readonly string _apiKey;
    private const string Model = "llama-3.3-70b-versatile";
    private const string SystemPrompt = """
        你是白雪公主——一位善良、純真、充滿愛心的童話公主。
        你直接以第一人稱與玩家對話，帶領他們一同在魔法森林中冒險。

        【角色與世界】
        - 你是白雪公主，被邪惡皇后的詛咒困在魔法森林深處
        - 你的好朋友是七個各具個性的小矮人
        - 玩家是誤入童話世界的旅人，你需要他們的幫助才能打破詛咒
        - 世界充滿會說話的動物、發光的蘑菇、古老的魔法樹與隱藏的秘密

        【說話風格】
        - 以第一人稱「我」說話，語氣溫柔甜美、帶著公主的優雅
        - 用詩意的繁體中文，像童話書一樣美麗
        - 偶爾用比喻或童話式的描述增添魔法感
        - 每次回應控制在 150 字以內

        【互動規則】
        - 每次對話結尾提供三個選項，格式：
          A. [選項一]
          B. [選項二]
          C. [選項三]
        - 玩家可選 A/B/C 或自由輸入行動
        - 根據玩家選擇推進故事，保持連貫性
        - 加入情感、驚喜與溫馨的轉折

        【開場】
        當玩家說「開始遊戲」時，以白雪公主的口吻，描述玩家剛踏入被晨霧籠罩的魔法森林、
        遇見你的場景，並請求玩家的幫助。
        """;

    public GroqService(IConfiguration config, IHttpClientFactory factory)
    {
        _http = factory.CreateClient("Groq");
        _apiKey = config["Groq:ApiKey"] ?? throw new InvalidOperationException("Groq:ApiKey not configured");
    }

    public async Task<string> SendAsync(IEnumerable<Message> history, string newUserContent)
    {
        var messages = new List<object>
        {
            new { role = "system", content = SystemPrompt }
        };

        foreach (var m in history)
            messages.Add(new { role = m.Role == "assistant" ? "assistant" : "user", content = m.Content });

        messages.Add(new { role = "user", content = newUserContent });

        var body = new
        {
            model = Model,
            messages,
            max_tokens = 600,
            temperature = 0.8
        };

        var request = new HttpRequestMessage(HttpMethod.Post, "https://api.groq.com/openai/v1/chat/completions")
        {
            Content = new StringContent(JsonSerializer.Serialize(body), Encoding.UTF8, "application/json")
        };
        request.Headers.Authorization = new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", _apiKey);

        var response = await _http.SendAsync(request);
        var json = await response.Content.ReadAsStringAsync();

        if ((int)response.StatusCode == 429)
        {
            var waitSeconds = GetRetryAfterSeconds(response, json);

            if (waitSeconds >= 60)
                throw new GroqRateLimitException(waitSeconds);

            // Short wait: auto-retry after delay
            await Task.Delay(TimeSpan.FromSeconds(waitSeconds + 1));

            var retryRequest = new HttpRequestMessage(HttpMethod.Post, "https://api.groq.com/openai/v1/chat/completions")
            {
                Content = new StringContent(JsonSerializer.Serialize(body), Encoding.UTF8, "application/json")
            };
            retryRequest.Headers.Authorization = new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", _apiKey);

            response = await _http.SendAsync(retryRequest);
            json = await response.Content.ReadAsStringAsync();

            // Retry also rate-limited → surface to frontend
            if ((int)response.StatusCode == 429)
                throw new GroqRateLimitException(GetRetryAfterSeconds(response, json));
        }

        if (!response.IsSuccessStatusCode)
            throw new HttpRequestException($"Groq API error {response.StatusCode}: {json}");

        using var doc = JsonDocument.Parse(json);
        return doc.RootElement
                  .GetProperty("choices")[0]
                  .GetProperty("message")
                  .GetProperty("content")
                  .GetString() ?? string.Empty;
    }

    // Reads retry-after header (seconds) first; falls back to parsing the JSON body message
    private static double GetRetryAfterSeconds(HttpResponseMessage response, string errorJson)
    {
        // Prefer the retry-after header — it's a plain integer (seconds)
        if (response.Headers.TryGetValues("retry-after", out var values))
        {
            var raw = values.FirstOrDefault();
            if (double.TryParse(raw, System.Globalization.NumberStyles.Any,
                                System.Globalization.CultureInfo.InvariantCulture, out var secs))
                return secs;
        }

        // Fallback: parse "Please try again in Xm Y.Zs" from the error body
        try
        {
            using var doc = JsonDocument.Parse(errorJson);
            var msg = doc.RootElement
                         .GetProperty("error")
                         .GetProperty("message")
                         .GetString() ?? "";

            var mMatch = System.Text.RegularExpressions.Regex.Match(msg, @"(\d+)m\s*([\d.]+)s");
            if (mMatch.Success)
                return int.Parse(mMatch.Groups[1].Value) * 60
                     + double.Parse(mMatch.Groups[2].Value, System.Globalization.CultureInfo.InvariantCulture);

            var sMatch = System.Text.RegularExpressions.Regex.Match(msg, @"([\d.]+)s");
            if (sMatch.Success)
                return double.Parse(sMatch.Groups[1].Value, System.Globalization.CultureInfo.InvariantCulture);
        }
        catch { }

        return 60;
    }
}
