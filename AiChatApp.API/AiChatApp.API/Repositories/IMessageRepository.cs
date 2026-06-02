using AiChatApp.API.Models;

namespace AiChatApp.API.Repositories;

public interface IMessageRepository
{
    Task<IEnumerable<Message>> GetByConversationIdAsync(int conversationId);
    Task<Message> CreateAsync(Message message);
}
