using AiChatApp.API.Models;
using Microsoft.EntityFrameworkCore;

namespace AiChatApp.API.Data;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

    public DbSet<Conversation> Conversations { get; set; }
    public DbSet<Message> Messages { get; set; }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<Conversation>(e =>
        {
            e.Property(c => c.Title).HasMaxLength(100).IsRequired();
            e.Property(c => c.CreatedAt).HasDefaultValueSql("datetime('now','localtime')");
        });

        modelBuilder.Entity<Message>(e =>
        {
            e.Property(m => m.Role).HasMaxLength(10).IsRequired();
            e.Property(m => m.Content).IsRequired();
            e.Property(m => m.CreatedAt).HasDefaultValueSql("datetime('now','localtime')");
            e.HasOne(m => m.Conversation)
             .WithMany(c => c.Messages)
             .HasForeignKey(m => m.ConversationId)
             .OnDelete(DeleteBehavior.Cascade);
        });
    }
}
