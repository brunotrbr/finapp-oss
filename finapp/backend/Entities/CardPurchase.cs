namespace Finapp.Api.Entities;

public sealed class CardPurchase
{
    public Guid Id { get; set; }
    public string OwnerUserId { get; set; } = string.Empty;
    public Guid CardId { get; set; }
    public string Description { get; set; } = string.Empty;
    public long AmountCents { get; set; }
    public DateOnly Date { get; set; }
    public int Installments { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
