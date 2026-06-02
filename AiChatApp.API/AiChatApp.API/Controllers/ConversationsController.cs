using AiChatApp.API.DTOs;
using AiChatApp.API.Models;
using AiChatApp.API.Repositories;
using AiChatApp.API.Services;
using Microsoft.AspNetCore.Mvc;
using System.Net;

namespace AiChatApp.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ConversationsController : ControllerBase
{
    private readonly IConversationRepository _convRepo;
    private readonly IMessageRepository _msgRepo;
    private readonly GroqService _groq;

    public ConversationsController(
        IConversationRepository convRepo,
        IMessageRepository msgRepo,
        GroqService groq)
    {
        _convRepo = convRepo;
        _msgRepo = msgRepo;
        _groq = groq;
    }

    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        try
        {
            var list = await _convRepo.GetAllAsync();
            var dto = list.Select(c => new ConversationDto
            {
                Id = c.Id,
                Title = c.Title,
                CreatedAt = c.CreatedAt
            });
            return Ok(ApiResponse<IEnumerable<ConversationDto>>.Ok(dto));
        }
        catch (Exception ex)
        {
            return StatusCode(500, ApiResponse<object>.Fail(ex.Message));
        }
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateConversationRequest req)
    {
        try
        {
            var conv = await _convRepo.CreateAsync(new Conversation { Title = req.Title });
            var dto = new ConversationDto { Id = conv.Id, Title = conv.Title, CreatedAt = conv.CreatedAt };
            return Ok(ApiResponse<ConversationDto>.Ok(dto, "對話已建立"));
        }
        catch (Exception ex)
        {
            return StatusCode(500, ApiResponse<object>.Fail(ex.Message));
        }
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(int id)
    {
        try
        {
            var conv = await _convRepo.GetByIdAsync(id);
            if (conv is null) return NotFound(ApiResponse<object>.Fail("對話不存在"));
            await _convRepo.DeleteAsync(conv);
            return Ok(ApiResponse<object>.Ok(null!, "對話已刪除"));
        }
        catch (Exception ex)
        {
            return StatusCode(500, ApiResponse<object>.Fail(ex.Message));
        }
    }

    [HttpGet("{id}/messages")]
    public async Task<IActionResult> GetMessages(int id)
    {
        try
        {
            var conv = await _convRepo.GetByIdAsync(id);
            if (conv is null) return NotFound(ApiResponse<object>.Fail("對話不存在"));

            var messages = await _msgRepo.GetByConversationIdAsync(id);
            var dto = messages.Select(m => new MessageDto
            {
                Id = m.Id,
                ConversationId = m.ConversationId,
                Role = m.Role,
                Content = m.Content,
                CreatedAt = m.CreatedAt
            });
            return Ok(ApiResponse<IEnumerable<MessageDto>>.Ok(dto));
        }
        catch (Exception ex)
        {
            return StatusCode(500, ApiResponse<object>.Fail(ex.Message));
        }
    }

    [HttpPost("{id}/messages")]
    public async Task<IActionResult> SendMessage(int id, [FromBody] SendMessageRequest req)
    {
        try
        {
            var conv = await _convRepo.GetByIdAsync(id);
            if (conv is null) return NotFound(ApiResponse<object>.Fail("對話不存在"));

            var history = await _msgRepo.GetByConversationIdAsync(id);

            var userMsg = await _msgRepo.CreateAsync(new Message
            {
                ConversationId = id,
                Role = "user",
                Content = req.Content
            });

            // Auto-update title with first message (first 20 chars)
            if (!history.Any() && conv.Title == "新對話")
            {
                var newTitle = req.Content.Length > 20 ? req.Content[..20] : req.Content;
                await _convRepo.UpdateTitleAsync(conv, newTitle);
            }

            var aiText = await _groq.SendAsync(history, req.Content);

            var aiMsg = await _msgRepo.CreateAsync(new Message
            {
                ConversationId = id,
                Role = "assistant",
                Content = aiText
            });

            var dto = new MessageDto
            {
                Id = aiMsg.Id,
                ConversationId = aiMsg.ConversationId,
                Role = aiMsg.Role,
                Content = aiMsg.Content,
                CreatedAt = aiMsg.CreatedAt
            };
            return Ok(ApiResponse<MessageDto>.Ok(dto));
        }
        catch (GroqRateLimitException rle)
        {
            return StatusCode(429, new { waitSeconds = (int)Math.Ceiling(rle.WaitSeconds) });
        }
        catch (Exception ex)
        {
            return StatusCode(500, ApiResponse<object>.Fail(ex.Message));
        }
    }
}
