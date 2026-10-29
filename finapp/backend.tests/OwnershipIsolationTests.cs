using Finapp.Api.Authorization;
using Finapp.Api.Entities;
using Microsoft.EntityFrameworkCore;
using Xunit;

namespace Finapp.Api.Tests;

public sealed class OwnershipIsolationTests
{
    [Fact]
    public async Task Accounts_are_scoped_to_the_authenticated_owner()
    {
        var databaseName = Guid.NewGuid().ToString();
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(databaseName)
            .Options;

        await using (var seed = new AppDbContext(options))
        {
            seed.FinancialAccounts.AddRange(
                Account("ana", "Conta da Ana"),
                Account("bruno", "Conta do Bruno"));
            await seed.SaveChangesAsync();
        }

        await using var anaContext = new AppDbContext(options, new TestAccessScope("ana"));
        var accounts = await anaContext.FinancialAccounts.ToListAsync();

        var account = Assert.Single(accounts);
        Assert.Equal("Conta da Ana", account.Name);
    }

    [Fact]
    public async Task Every_financial_collection_is_scoped_to_the_authenticated_owner()
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;

        await using (var seed = new AppDbContext(options))
        {
            var anaAccount = Account("ana", "Conta da Ana");
            var brunoAccount = Account("bruno", "Conta do Bruno");
            var anaCard = Card("ana", "Cartão da Ana");
            var brunoCard = Card("bruno", "Cartão do Bruno");
            seed.AddRange(
                anaAccount,
                brunoAccount,
                Transaction("ana", anaAccount.Id),
                Transaction("bruno", brunoAccount.Id),
                Bill("ana", anaAccount.Id),
                Bill("bruno", brunoAccount.Id),
                anaCard,
                brunoCard,
                Purchase("ana", anaCard.Id),
                Purchase("bruno", brunoCard.Id));
            await seed.SaveChangesAsync();
        }

        await using var anaContext = new AppDbContext(options, new TestAccessScope("ana"));

        Assert.All(await anaContext.FinancialTransactions.ToListAsync(), item => Assert.Equal("ana", item.OwnerUserId));
        Assert.All(await anaContext.Bills.ToListAsync(), item => Assert.Equal("ana", item.OwnerUserId));
        Assert.All(await anaContext.CreditCards.ToListAsync(), item => Assert.Equal("ana", item.OwnerUserId));
        Assert.All(await anaContext.CardPurchases.ToListAsync(), item => Assert.Equal("ana", item.OwnerUserId));
        Assert.Single(await anaContext.FinancialTransactions.ToListAsync());
        Assert.Single(await anaContext.Bills.ToListAsync());
        Assert.Single(await anaContext.CreditCards.ToListAsync());
        Assert.Single(await anaContext.CardPurchases.ToListAsync());
    }

    private static FinancialAccount Account(string ownerUserId, string name) => new()
    {
        Id = Guid.NewGuid(),
        OwnerUserId = ownerUserId,
        Name = name,
        Bank = "Banco",
        Type = "Corrente"
    };

    private static FinancialTransaction Transaction(string ownerUserId, Guid accountId) => new()
    {
        Id = Guid.NewGuid(), OwnerUserId = ownerUserId, AccountId = accountId,
        Description = "Lançamento", AmountCents = 100, Date = new DateOnly(2026, 10, 1), Category = "Outros"
    };

    private static Bill Bill(string ownerUserId, Guid accountId) => new()
    {
        Id = Guid.NewGuid(), OwnerUserId = ownerUserId, AccountId = accountId,
        Description = "Pendência", AmountCents = 100, DueDate = new DateOnly(2026, 10, 1)
    };

    private static CreditCard Card(string ownerUserId, string name) => new()
    {
        Id = Guid.NewGuid(), OwnerUserId = ownerUserId, Name = name,
        LimitCents = 10000, ClosingDay = 10, DueDay = 20
    };

    private static CardPurchase Purchase(string ownerUserId, Guid cardId) => new()
    {
        Id = Guid.NewGuid(), OwnerUserId = ownerUserId, CardId = cardId,
        Description = "Compra", AmountCents = 100, Date = new DateOnly(2026, 10, 1), Installments = 1
    };

    private sealed record TestAccessScope(string UserId) : IAccessScope;
}
