namespace Finapp.Api.Entities;

public sealed class FinancialAccount
{
    public Guid Id { get; set; }
    public string OwnerUserId { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string Bank { get; set; } = string.Empty;
    public string Type { get; set; } = string.Empty;
    public long InitialBalanceCents { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
