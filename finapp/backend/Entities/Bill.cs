namespace Finapp.Api.Entities;

public sealed class Bill
{
    public Guid Id { get; set; }
    public string OwnerUserId { get; set; } = string.Empty;
    public Guid AccountId { get; set; }
    public string Description { get; set; } = string.Empty;
    public long AmountCents { get; set; }
    public DateOnly DueDate { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
