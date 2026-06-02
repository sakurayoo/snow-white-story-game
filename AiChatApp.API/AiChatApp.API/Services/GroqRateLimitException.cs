namespace AiChatApp.API.Services;

public class GroqRateLimitException(double waitSeconds)
    : Exception($"免費額度暫時用完，請等待約 {(int)Math.Ceiling(waitSeconds)} 秒後再試")
{
    public double WaitSeconds { get; } = waitSeconds;
}
