using Finapp.Api.Authorization;
using Finapp.Api.Contracts;
using Finapp.Api.Entities;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Finapp.Api.Endpoints;

public static class FinanceEndpoints
{
    private static readonly HashSet<string> AccountTypes = ["Corrente", "Poupança", "Carteira"];

    public static IEndpointRouteBuilder MapFinanceEndpoints(this IEndpointRouteBuilder endpoints)
    {
        var group = endpoints.MapGroup("/api/v1").RequireAuthorization();

        group.MapGet("/dashboard", GetDashboard);
        group.MapGet("/accounts", GetAccounts);
        group.MapPost("/accounts", CreateAccount);
        group.MapGet("/accounts/{accountId:guid}", GetAccount);
        group.MapGet("/accounts/{accountId:guid}/transactions", GetAccountTransactions);
        group.MapGet("/accounts/{accountId:guid}/bills", GetAccountBills);
        group.MapGet("/cards", GetCards);
        group.MapPost("/cards", CreateCard);
        group.MapGet("/cards/{cardId:guid}", GetCard);
        group.MapGet("/cards/{cardId:guid}/transactions", GetCardPurchases);

        return endpoints;
    }

    private static async Task<IResult> GetDashboard(
        [FromQuery] string month,
        AppDbContext db,
        CancellationToken cancellationToken)
    {
        if (!TryParseMonth(month, out var monthStart, out var nextMonth))
            return ValidationProblem("month", "Use o formato YYYY-MM.");

        var accounts = await db.FinancialAccounts.AsNoTracking().OrderBy(account => account.Name).ToListAsync(cancellationToken);
        var transactions = await db.FinancialTransactions.AsNoTracking().ToListAsync(cancellationToken);
        var cards = await db.CreditCards.AsNoTracking().OrderBy(card => card.Name).ToListAsync(cancellationToken);
        var pending = await db.Bills.AsNoTracking()
            .Where(bill => bill.DueDate >= monthStart && bill.DueDate < nextMonth)
            .SumAsync(bill => (long?)bill.AmountCents, cancellationToken) ?? 0;

        var balanceByAccount = transactions
            .GroupBy(transaction => transaction.AccountId)
            .ToDictionary(group => group.Key, group => group.Sum(transaction => transaction.AmountCents));
        var accountResponses = accounts.Select(account => ToResponse(account, balanceByAccount.GetValueOrDefault(account.Id))).ToArray();
        var totalBalance = accountResponses.Sum(account => account.BalanceCents);
        var latest = transactions.OrderByDescending(transaction => transaction.Date).ThenByDescending(transaction => transaction.CreatedAt).Take(5).Select(ToResponse).ToArray();

        return Results.Ok(new DashboardResponse(
            month,
            totalBalance,
            pending,
            totalBalance - pending,
            accountResponses,
            cards.Select(ToResponse).ToArray(),
            latest));
    }

    private static async Task<IResult> GetAccounts(AppDbContext db, CancellationToken cancellationToken)
    {
        var accounts = await db.FinancialAccounts.AsNoTracking().OrderBy(account => account.Name).ToListAsync(cancellationToken);
        var balances = await db.FinancialTransactions.AsNoTracking()
            .GroupBy(transaction => transaction.AccountId)
            .Select(group => new { AccountId = group.Key, AmountCents = group.Sum(transaction => transaction.AmountCents) })
            .ToDictionaryAsync(item => item.AccountId, item => item.AmountCents, cancellationToken);
        return Results.Ok(new ListResponse<AccountResponse>(accounts.Select(account => ToResponse(account, balances.GetValueOrDefault(account.Id))).ToArray()));
    }

    private static async Task<IResult> GetAccount(Guid accountId, AppDbContext db, CancellationToken cancellationToken)
    {
        var account = await db.FinancialAccounts.AsNoTracking().SingleOrDefaultAsync(item => item.Id == accountId, cancellationToken);
        if (account is null) return Results.NotFound();
        var transactionTotal = await db.FinancialTransactions.AsNoTracking()
            .Where(transaction => transaction.AccountId == accountId)
            .SumAsync(transaction => (long?)transaction.AmountCents, cancellationToken) ?? 0;
        return Results.Ok(ToResponse(account, transactionTotal));
    }

    private static async Task<IResult> CreateAccount(
        CreateAccountRequest request,
        HttpRequest httpRequest,
        AppDbContext db,
        IAccessScope accessScope,
        CancellationToken cancellationToken)
    {
        var errors = ValidateAccount(request);
        if (errors.Count > 0) return Results.ValidationProblem(errors, statusCode: StatusCodes.Status422UnprocessableEntity);
        if (!TryGetIdempotencyKey(httpRequest, out var key)) return MissingIdempotencyKey();

        var existing = await FindIdempotentResource(db, accessScope.UserId, "accounts.create", key, cancellationToken);
        if (existing is not null)
        {
            var previous = await db.FinancialAccounts.AsNoTracking().SingleOrDefaultAsync(account => account.Id == existing.ResourceId, cancellationToken);
            if (previous is not null) return Results.Ok(ToResponse(previous, 0));
        }

        var account = new FinancialAccount
        {
            Id = Guid.NewGuid(),
            OwnerUserId = accessScope.UserId,
            Name = request.Name.Trim(),
            Bank = request.Bank.Trim(),
            Type = request.Type,
            InitialBalanceCents = request.InitialBalanceCents
        };
        db.Add(account);
        db.Add(Idempotency(accessScope.UserId, "accounts.create", key, account.Id));
        try
        {
            await db.SaveChangesAsync(cancellationToken);
        }
        catch (DbUpdateException)
        {
            var recovered = await RecoverAccountAfterIdempotencyRace(db, accessScope.UserId, key, cancellationToken);
            if (recovered is not null) return Results.Ok(ToResponse(recovered, 0));
            throw;
        }
        return Results.Created($"/api/v1/accounts/{account.Id}", ToResponse(account, 0));
    }

    private static async Task<IResult> GetAccountTransactions(Guid accountId, AppDbContext db, CancellationToken cancellationToken)
    {
        if (!await db.FinancialAccounts.AsNoTracking().AnyAsync(account => account.Id == accountId, cancellationToken)) return Results.NotFound();
        var items = await db.FinancialTransactions.AsNoTracking()
            .Where(transaction => transaction.AccountId == accountId)
            .OrderByDescending(transaction => transaction.Date)
            .ThenByDescending(transaction => transaction.CreatedAt)
            .Select(transaction => ToResponse(transaction))
            .ToListAsync(cancellationToken);
        return Results.Ok(new ListResponse<TransactionResponse>(items));
    }

    private static async Task<IResult> GetAccountBills(Guid accountId, AppDbContext db, CancellationToken cancellationToken)
    {
        if (!await db.FinancialAccounts.AsNoTracking().AnyAsync(account => account.Id == accountId, cancellationToken)) return Results.NotFound();
        var items = await db.Bills.AsNoTracking()
            .Where(bill => bill.AccountId == accountId)
            .OrderBy(bill => bill.DueDate)
            .Select(bill => ToResponse(bill))
            .ToListAsync(cancellationToken);
        return Results.Ok(new ListResponse<BillResponse>(items));
    }

    private static async Task<IResult> GetCards(AppDbContext db, CancellationToken cancellationToken)
    {
        var items = await db.CreditCards.AsNoTracking().OrderBy(card => card.Name).Select(card => ToResponse(card)).ToListAsync(cancellationToken);
        return Results.Ok(new ListResponse<CardResponse>(items));
    }

    private static async Task<IResult> GetCard(Guid cardId, AppDbContext db, CancellationToken cancellationToken)
    {
        var card = await db.CreditCards.AsNoTracking().SingleOrDefaultAsync(item => item.Id == cardId, cancellationToken);
        return card is null ? Results.NotFound() : Results.Ok(ToResponse(card));
    }

    private static async Task<IResult> CreateCard(
        CreateCardRequest request,
        HttpRequest httpRequest,
        AppDbContext db,
        IAccessScope accessScope,
        CancellationToken cancellationToken)
    {
        var errors = ValidateCard(request);
        if (errors.Count > 0) return Results.ValidationProblem(errors, statusCode: StatusCodes.Status422UnprocessableEntity);
        if (!TryGetIdempotencyKey(httpRequest, out var key)) return MissingIdempotencyKey();

        var existing = await FindIdempotentResource(db, accessScope.UserId, "cards.create", key, cancellationToken);
        if (existing is not null)
        {
            var previous = await db.CreditCards.AsNoTracking().SingleOrDefaultAsync(card => card.Id == existing.ResourceId, cancellationToken);
            if (previous is not null) return Results.Ok(ToResponse(previous));
        }

        var card = new CreditCard
        {
            Id = Guid.NewGuid(), OwnerUserId = accessScope.UserId, Name = request.Name.Trim(),
            LimitCents = request.LimitCents, ClosingDay = request.ClosingDay, DueDay = request.DueDay
        };
        db.Add(card);
        db.Add(Idempotency(accessScope.UserId, "cards.create", key, card.Id));
        try
        {
            await db.SaveChangesAsync(cancellationToken);
        }
        catch (DbUpdateException)
        {
            var recovered = await RecoverCardAfterIdempotencyRace(db, accessScope.UserId, key, cancellationToken);
            if (recovered is not null) return Results.Ok(ToResponse(recovered));
            throw;
        }
        return Results.Created($"/api/v1/cards/{card.Id}", ToResponse(card));
    }

    private static async Task<IResult> GetCardPurchases(Guid cardId, AppDbContext db, CancellationToken cancellationToken)
    {
        if (!await db.CreditCards.AsNoTracking().AnyAsync(card => card.Id == cardId, cancellationToken)) return Results.NotFound();
        var items = await db.CardPurchases.AsNoTracking()
            .Where(purchase => purchase.CardId == cardId)
            .OrderByDescending(purchase => purchase.Date)
            .ThenByDescending(purchase => purchase.CreatedAt)
            .Select(purchase => ToResponse(purchase))
            .ToListAsync(cancellationToken);
        return Results.Ok(new ListResponse<CardPurchaseResponse>(items));
    }

    private static AccountResponse ToResponse(FinancialAccount account, long transactionCents) =>
        new(account.Id.ToString(), account.Name, account.Bank, account.Type, account.InitialBalanceCents, account.InitialBalanceCents + transactionCents);

    private static TransactionResponse ToResponse(FinancialTransaction transaction) =>
        new(transaction.Id.ToString(), transaction.AccountId.ToString(), transaction.Description, transaction.AmountCents, transaction.Date, transaction.Category, transaction.Note);

    private static BillResponse ToResponse(Bill bill) =>
        new(bill.Id.ToString(), bill.AccountId.ToString(), bill.Description, bill.AmountCents, bill.DueDate);

    private static CardResponse ToResponse(CreditCard card) =>
        new(card.Id.ToString(), card.Name, card.LimitCents, card.ClosingDay, card.DueDay);

    private static CardPurchaseResponse ToResponse(CardPurchase purchase) =>
        new(purchase.Id.ToString(), purchase.CardId.ToString(), purchase.Description, purchase.AmountCents, purchase.Date, purchase.Installments);

    private static Dictionary<string, string[]> ValidateAccount(CreateAccountRequest request)
    {
        var errors = new Dictionary<string, string[]>();
        if (string.IsNullOrWhiteSpace(request.Name) || request.Name.Trim().Length > 100) errors["name"] = ["Informe um nome com até 100 caracteres."];
        if (string.IsNullOrWhiteSpace(request.Bank) || request.Bank.Trim().Length > 100) errors["bank"] = ["Informe o banco com até 100 caracteres."];
        if (!AccountTypes.Contains(request.Type)) errors["type"] = ["Tipo de conta inválido."];
        return errors;
    }

    private static Dictionary<string, string[]> ValidateCard(CreateCardRequest request)
    {
        var errors = new Dictionary<string, string[]>();
        if (string.IsNullOrWhiteSpace(request.Name) || request.Name.Trim().Length > 100) errors["name"] = ["Informe um nome com até 100 caracteres."];
        if (request.LimitCents <= 0) errors["limitCents"] = ["O limite deve ser positivo."];
        if (request.ClosingDay is < 1 or > 31) errors["closingDay"] = ["O dia de fechamento deve estar entre 1 e 31."];
        if (request.DueDay is < 1 or > 31) errors["dueDay"] = ["O dia de vencimento deve estar entre 1 e 31."];
        return errors;
    }

    private static bool TryParseMonth(string month, out DateOnly start, out DateOnly next)
    {
        start = default;
        next = default;
        if (!DateOnly.TryParseExact($"{month}-01", "yyyy-MM-dd", out start)) return false;
        next = start.AddMonths(1);
        return true;
    }

    private static bool TryGetIdempotencyKey(HttpRequest request, out string key)
    {
        key = request.Headers["Idempotency-Key"].ToString().Trim();
        return key.Length is >= 8 and <= 128;
    }

    private static IResult MissingIdempotencyKey() => Results.Problem(
        statusCode: StatusCodes.Status400BadRequest,
        title: "Idempotency-Key obrigatório",
        detail: "Envie uma chave entre 8 e 128 caracteres.",
        extensions: new Dictionary<string, object?> { ["code"] = "idempotency_key_required" });

    private static IResult ValidationProblem(string field, string message) => Results.ValidationProblem(new Dictionary<string, string[]> { [field] = [message] });

    private static Task<IdempotencyRecord?> FindIdempotentResource(AppDbContext db, string owner, string operation, string key, CancellationToken cancellationToken) =>
        db.IdempotencyRecords.AsNoTracking().SingleOrDefaultAsync(record => record.OwnerUserId == owner && record.Operation == operation && record.Key == key, cancellationToken);

    private static IdempotencyRecord Idempotency(string owner, string operation, string key, Guid resourceId) =>
        new() { Id = Guid.NewGuid(), OwnerUserId = owner, Operation = operation, Key = key, ResourceId = resourceId };

    private static async Task<FinancialAccount?> RecoverAccountAfterIdempotencyRace(AppDbContext db, string owner, string key, CancellationToken cancellationToken)
    {
        DetachAddedEntries(db);
        var existing = await FindIdempotentResource(db, owner, "accounts.create", key, cancellationToken);
        return existing is null ? null : await db.FinancialAccounts.AsNoTracking().SingleOrDefaultAsync(account => account.Id == existing.ResourceId, cancellationToken);
    }

    private static async Task<CreditCard?> RecoverCardAfterIdempotencyRace(AppDbContext db, string owner, string key, CancellationToken cancellationToken)
    {
        DetachAddedEntries(db);
        var existing = await FindIdempotentResource(db, owner, "cards.create", key, cancellationToken);
        return existing is null ? null : await db.CreditCards.AsNoTracking().SingleOrDefaultAsync(card => card.Id == existing.ResourceId, cancellationToken);
    }

    private static void DetachAddedEntries(AppDbContext db)
    {
        foreach (var entry in db.ChangeTracker.Entries().Where(entry => entry.State == EntityState.Added))
            entry.State = EntityState.Detached;
    }
}
