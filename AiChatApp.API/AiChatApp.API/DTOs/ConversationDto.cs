namespace AiChatApp.API.DTOs;

public class ConversationDto
{
    public int Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
}

public class CreateConversationRequest
{
    public string Title { get; set; } = "新對話";
}
