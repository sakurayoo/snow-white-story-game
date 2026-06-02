namespace AiChatApp.API.Models;

public class Conversation
{
    public int Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; } = DateTime.Now;
    public ICollection<Message> Messages { get; set; } = new List<Message>();
}
