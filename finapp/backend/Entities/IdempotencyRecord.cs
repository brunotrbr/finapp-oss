namespace Finapp.Api.Entities;

public sealed class IdempotencyRecord
{
    public Guid Id { get; set; }
    public string OwnerUserId { get; set; } = string.Empty;
    public string Operation { get; set; } = string.Empty;
    public string Key { get; set; } = string.Empty;
    public Guid ResourceId { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
