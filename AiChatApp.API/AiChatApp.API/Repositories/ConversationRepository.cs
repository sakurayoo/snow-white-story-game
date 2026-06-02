using AiChatApp.API.Data;
using AiChatApp.API.Models;
using Microsoft.EntityFrameworkCore;

namespace AiChatApp.API.Repositories;

public class ConversationRepository : IConversationRepository
{
    private readonly AppDbContext _db;

    public ConversationRepository(AppDbContext db) => _db = db;

    public async Task<IEnumerable<Conversation>> GetAllAsync() =>
        await _db.Conversations.OrderByDescending(c => c.CreatedAt).ToListAsync();

    public async Task<Conversation?> GetByIdAsync(int id) =>
        await _db.Conversations.Include(c => c.Messages).FirstOrDefaultAsync(c => c.Id == id);

    public async Task<Conversation> CreateAsync(Conversation conversation)
    {
        _db.Conversations.Add(conversation);
        await _db.SaveChangesAsync();
        return conversation;
    }

    public async Task UpdateTitleAsync(Conversation conversation, string title)
    {
        conversation.Title = title;
        await _db.SaveChangesAsync();
    }

    public async Task DeleteAsync(Conversation conversation)
    {
        _db.Conversations.Remove(conversation);
        await _db.SaveChangesAsync();
    }
}
