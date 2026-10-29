using Finapp.Api.Entities;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Finapp.Api.Migrations;

[DbContext(typeof(AppDbContext))]
[Migration("20261029000000_AddUserOwnedFinance")]
public sealed class AddUserOwnedFinance : Migration
{
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.CreateTable(
            name: "CreditCards",
            columns: table => new
            {
                Id = table.Column<Guid>(type: "uuid", nullable: false),
                OwnerUserId = table.Column<string>(type: "text", nullable: false),
                Name = table.Column<string>(type: "text", nullable: false),
                LimitCents = table.Column<long>(type: "bigint", nullable: false),
                ClosingDay = table.Column<int>(type: "integer", nullable: false),
                DueDay = table.Column<int>(type: "integer", nullable: false),
                CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
            },
            constraints: table =>
            {
                table.PrimaryKey("PK_CreditCards", x => x.Id);
                table.UniqueConstraint("AK_CreditCards_OwnerUserId_Id", x => new { x.OwnerUserId, x.Id });
            });

        migrationBuilder.CreateTable(
            name: "FinancialAccounts",
            columns: table => new
            {
                Id = table.Column<Guid>(type: "uuid", nullable: false),
                OwnerUserId = table.Column<string>(type: "text", nullable: false),
                Name = table.Column<string>(type: "text", nullable: false),
                Bank = table.Column<string>(type: "text", nullable: false),
                Type = table.Column<string>(type: "text", nullable: false),
                InitialBalanceCents = table.Column<long>(type: "bigint", nullable: false),
                CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
            },
            constraints: table =>
            {
                table.PrimaryKey("PK_FinancialAccounts", x => x.Id);
                table.UniqueConstraint("AK_FinancialAccounts_OwnerUserId_Id", x => new { x.OwnerUserId, x.Id });
            });

        migrationBuilder.CreateTable(
            name: "IdempotencyRecords",
            columns: table => new
            {
                Id = table.Column<Guid>(type: "uuid", nullable: false),
                OwnerUserId = table.Column<string>(type: "text", nullable: false),
                Operation = table.Column<string>(type: "text", nullable: false),
                Key = table.Column<string>(type: "text", nullable: false),
                ResourceId = table.Column<Guid>(type: "uuid", nullable: false),
                CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
            },
            constraints: table => table.PrimaryKey("PK_IdempotencyRecords", x => x.Id));

        migrationBuilder.CreateTable(
            name: "CardPurchases",
            columns: table => new
            {
                Id = table.Column<Guid>(type: "uuid", nullable: false),
                OwnerUserId = table.Column<string>(type: "text", nullable: false),
                CardId = table.Column<Guid>(type: "uuid", nullable: false),
                Description = table.Column<string>(type: "text", nullable: false),
                AmountCents = table.Column<long>(type: "bigint", nullable: false),
                Date = table.Column<DateOnly>(type: "date", nullable: false),
                Installments = table.Column<int>(type: "integer", nullable: false),
                CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
            },
            constraints: table =>
            {
                table.PrimaryKey("PK_CardPurchases", x => x.Id);
                table.ForeignKey("FK_CardPurchases_CreditCards_OwnerUserId_CardId", x => new { x.OwnerUserId, x.CardId }, "CreditCards", new[] { "OwnerUserId", "Id" }, onDelete: ReferentialAction.Restrict);
            });

        migrationBuilder.CreateTable(
            name: "Bills",
            columns: table => new
            {
                Id = table.Column<Guid>(type: "uuid", nullable: false),
                OwnerUserId = table.Column<string>(type: "text", nullable: false),
                AccountId = table.Column<Guid>(type: "uuid", nullable: false),
                Description = table.Column<string>(type: "text", nullable: false),
                AmountCents = table.Column<long>(type: "bigint", nullable: false),
                DueDate = table.Column<DateOnly>(type: "date", nullable: false),
                CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
            },
            constraints: table =>
            {
                table.PrimaryKey("PK_Bills", x => x.Id);
                table.ForeignKey("FK_Bills_FinancialAccounts_OwnerUserId_AccountId", x => new { x.OwnerUserId, x.AccountId }, "FinancialAccounts", new[] { "OwnerUserId", "Id" }, onDelete: ReferentialAction.Restrict);
            });

        migrationBuilder.CreateTable(
            name: "FinancialTransactions",
            columns: table => new
            {
                Id = table.Column<Guid>(type: "uuid", nullable: false),
                OwnerUserId = table.Column<string>(type: "text", nullable: false),
                AccountId = table.Column<Guid>(type: "uuid", nullable: false),
                Description = table.Column<string>(type: "text", nullable: false),
                AmountCents = table.Column<long>(type: "bigint", nullable: false),
                Date = table.Column<DateOnly>(type: "date", nullable: false),
                Category = table.Column<string>(type: "text", nullable: false),
                Note = table.Column<string>(type: "text", nullable: false),
                CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
            },
            constraints: table =>
            {
                table.PrimaryKey("PK_FinancialTransactions", x => x.Id);
                table.ForeignKey("FK_FinancialTransactions_FinancialAccounts_OwnerUserId_AccountId", x => new { x.OwnerUserId, x.AccountId }, "FinancialAccounts", new[] { "OwnerUserId", "Id" }, onDelete: ReferentialAction.Restrict);
            });

        migrationBuilder.CreateIndex("IX_CreditCards_OwnerUserId", "CreditCards", "OwnerUserId");
        migrationBuilder.CreateIndex("IX_FinancialAccounts_OwnerUserId", "FinancialAccounts", "OwnerUserId");
        migrationBuilder.CreateIndex("IX_IdempotencyRecords_OwnerUserId_Operation_Key", "IdempotencyRecords", new[] { "OwnerUserId", "Operation", "Key" }, unique: true);
        migrationBuilder.CreateIndex("IX_CardPurchases_OwnerUserId_CardId_Date", "CardPurchases", new[] { "OwnerUserId", "CardId", "Date" });
        migrationBuilder.CreateIndex("IX_Bills_OwnerUserId_AccountId_DueDate", "Bills", new[] { "OwnerUserId", "AccountId", "DueDate" });
        migrationBuilder.CreateIndex("IX_FinancialTransactions_OwnerUserId_AccountId_Date", "FinancialTransactions", new[] { "OwnerUserId", "AccountId", "Date" });
    }

    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.DropTable("Bills");
        migrationBuilder.DropTable("CardPurchases");
        migrationBuilder.DropTable("FinancialTransactions");
        migrationBuilder.DropTable("IdempotencyRecords");
        migrationBuilder.DropTable("CreditCards");
        migrationBuilder.DropTable("FinancialAccounts");
    }
}
