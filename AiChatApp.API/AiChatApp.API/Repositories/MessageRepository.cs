using AiChatApp.API.Data;
using AiChatApp.API.Models;
using Microsoft.EntityFrameworkCore;

namespace AiChatApp.API.Repositories;

public class MessageRepository : IMessageRepository
{
    private readonly AppDbContext _db;

    public MessageRepository(AppDbContext db) => _db = db;

    public async Task<IEnumerable<Message>> GetByConversationIdAsync(int conversationId) =>
        await _db.Messages.Where(m => m.ConversationId == conversationId)
                          .OrderBy(m => m.CreatedAt)
                          .ToListAsync();

    public async Task<Message> CreateAsync(Message message)
    {
        _db.Messages.Add(message);
        await _db.SaveChangesAsync();
        return message;
    }
}
