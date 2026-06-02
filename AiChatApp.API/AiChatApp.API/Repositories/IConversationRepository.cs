using AiChatApp.API.Models;

namespace AiChatApp.API.Repositories;

public interface IConversationRepository
{
    Task<IEnumerable<Conversation>> GetAllAsync();
    Task<Conversation?> GetByIdAsync(int id);
    Task<Conversation> CreateAsync(Conversation conversation);
    Task UpdateTitleAsync(Conversation conversation, string title);
    Task DeleteAsync(Conversation conversation);
}
