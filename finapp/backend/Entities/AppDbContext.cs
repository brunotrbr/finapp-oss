using Microsoft.EntityFrameworkCore;
using Finapp.Api.Authorization;

namespace Finapp.Api.Entities;

public class AppDbContext : DbContext
{
    private const string NoAuthenticatedOwner = "__no_authenticated_owner__";
    private readonly IAccessScope? _accessScope;

    private string CurrentOwnerUserId => _accessScope?.UserId ?? NoAuthenticatedOwner;

    public AppDbContext(DbContextOptions<AppDbContext> options, IAccessScope? accessScope = null) : base(options)
    {
        _accessScope = accessScope;
    }

    public DbSet<Tenant> Tenants => Set<Tenant>();
    public DbSet<User> Users => Set<User>();
    public DbSet<FinancialAccount> FinancialAccounts => Set<FinancialAccount>();
    public DbSet<FinancialTransaction> FinancialTransactions => Set<FinancialTransaction>();
    public DbSet<Bill> Bills => Set<Bill>();
    public DbSet<CreditCard> CreditCards => Set<CreditCard>();
    public DbSet<CardPurchase> CardPurchases => Set<CardPurchase>();
    public DbSet<IdempotencyRecord> IdempotencyRecords => Set<IdempotencyRecord>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);
        
        modelBuilder.Entity<Tenant>().HasKey(t => t.Id);
        
        modelBuilder.Entity<User>().HasKey(u => u.Id);
        modelBuilder.Entity<User>()
            .HasOne(u => u.DefaultTenant)
            .WithMany()
            .HasForeignKey(u => u.DefaultTenantId);

        modelBuilder.Entity<FinancialAccount>().HasKey(account => account.Id);
        modelBuilder.Entity<FinancialAccount>().HasAlternateKey(account => new { account.OwnerUserId, account.Id });
        modelBuilder.Entity<FinancialAccount>().HasIndex(account => account.OwnerUserId);
        modelBuilder.Entity<FinancialAccount>()
            .HasQueryFilter(account => account.OwnerUserId == CurrentOwnerUserId);

        modelBuilder.Entity<FinancialTransaction>().HasKey(transaction => transaction.Id);
        modelBuilder.Entity<FinancialTransaction>().HasIndex(transaction => new { transaction.OwnerUserId, transaction.AccountId, transaction.Date });
        modelBuilder.Entity<FinancialTransaction>()
            .HasOne<FinancialAccount>()
            .WithMany()
            .HasForeignKey(transaction => new { transaction.OwnerUserId, transaction.AccountId })
            .HasPrincipalKey(account => new { account.OwnerUserId, account.Id })
            .OnDelete(DeleteBehavior.Restrict);
        modelBuilder.Entity<FinancialTransaction>()
            .HasQueryFilter(transaction => transaction.OwnerUserId == CurrentOwnerUserId);
        modelBuilder.Entity<Bill>().HasKey(bill => bill.Id);
        modelBuilder.Entity<Bill>().HasIndex(bill => new { bill.OwnerUserId, bill.AccountId, bill.DueDate });
        modelBuilder.Entity<Bill>()
            .HasOne<FinancialAccount>()
            .WithMany()
            .HasForeignKey(bill => new { bill.OwnerUserId, bill.AccountId })
            .HasPrincipalKey(account => new { account.OwnerUserId, account.Id })
            .OnDelete(DeleteBehavior.Restrict);
        modelBuilder.Entity<Bill>()
            .HasQueryFilter(bill => bill.OwnerUserId == CurrentOwnerUserId);
        modelBuilder.Entity<CreditCard>().HasKey(card => card.Id);
        modelBuilder.Entity<CreditCard>().HasAlternateKey(card => new { card.OwnerUserId, card.Id });
        modelBuilder.Entity<CreditCard>().HasIndex(card => card.OwnerUserId);
        modelBuilder.Entity<CreditCard>()
            .HasQueryFilter(card => card.OwnerUserId == CurrentOwnerUserId);
        modelBuilder.Entity<CardPurchase>().HasKey(purchase => purchase.Id);
        modelBuilder.Entity<CardPurchase>().HasIndex(purchase => new { purchase.OwnerUserId, purchase.CardId, purchase.Date });
        modelBuilder.Entity<CardPurchase>()
            .HasOne<CreditCard>()
            .WithMany()
            .HasForeignKey(purchase => new { purchase.OwnerUserId, purchase.CardId })
            .HasPrincipalKey(card => new { card.OwnerUserId, card.Id })
            .OnDelete(DeleteBehavior.Restrict);
        modelBuilder.Entity<CardPurchase>()
            .HasQueryFilter(purchase => purchase.OwnerUserId == CurrentOwnerUserId);
        modelBuilder.Entity<IdempotencyRecord>().HasKey(record => record.Id);
        modelBuilder.Entity<IdempotencyRecord>()
            .HasIndex(record => new { record.OwnerUserId, record.Operation, record.Key })
            .IsUnique();
        modelBuilder.Entity<IdempotencyRecord>()
            .HasQueryFilter(record => record.OwnerUserId == CurrentOwnerUserId);
    }
}
