namespace Finapp.Api.Entities;

public sealed class CreditCard
{
    public Guid Id { get; set; }
    public string OwnerUserId { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public long LimitCents { get; set; }
    public int ClosingDay { get; set; }
    public int DueDay { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
