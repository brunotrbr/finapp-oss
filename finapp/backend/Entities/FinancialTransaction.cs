namespace Finapp.Api.Entities;

public sealed class FinancialTransaction
{
    public Guid Id { get; set; }
    public string OwnerUserId { get; set; } = string.Empty;
    public Guid AccountId { get; set; }
    public string Description { get; set; } = string.Empty;
    public long AmountCents { get; set; }
    public DateOnly Date { get; set; }
    public string Category { get; set; } = string.Empty;
    public string Note { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
