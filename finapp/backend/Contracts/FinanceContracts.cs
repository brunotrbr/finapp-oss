namespace Finapp.Api.Contracts;

public sealed record ListResponse<T>(IReadOnlyList<T> Items, string? NextCursor = null);

public sealed record AccountResponse(
    string Id,
    string Name,
    string Bank,
    string Type,
    long InitialBalanceCents,
    long BalanceCents,
    string Currency = "BRL");

public sealed record CreateAccountRequest(
    string Name,
    string Bank,
    string Type,
    long InitialBalanceCents);

public sealed record TransactionResponse(
    string Id,
    string AccountId,
    string Description,
    long AmountCents,
    DateOnly Date,
    string Category,
    string Note,
    string Currency = "BRL");

public sealed record BillResponse(
    string Id,
    string AccountId,
    string Description,
    long AmountCents,
    DateOnly DueDate,
    string Currency = "BRL");

public sealed record CardResponse(
    string Id,
    string Name,
    long LimitCents,
    int ClosingDay,
    int DueDay,
    string Currency = "BRL");

public sealed record CreateCardRequest(
    string Name,
    long LimitCents,
    int ClosingDay,
    int DueDay);

public sealed record CardPurchaseResponse(
    string Id,
    string CardId,
    string Description,
    long AmountCents,
    DateOnly Date,
    int Installments,
    string Currency = "BRL");

public sealed record DashboardResponse(
    string Month,
    long TotalBalanceCents,
    long PendingCents,
    long FreeBalanceCents,
    IReadOnlyList<AccountResponse> Accounts,
    IReadOnlyList<CardResponse> Cards,
    IReadOnlyList<TransactionResponse> LatestTransactions,
    string Currency = "BRL");
