using System.Net;
using System.Net.Http.Json;
using System.Security.Claims;
using System.Text.Encodings.Web;
using Finapp.Api.Contracts;
using Finapp.Api.Entities;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.AspNetCore.TestHost;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.DependencyInjection.Extensions;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Xunit;

namespace Finapp.Api.Tests;

public sealed class FinanceEndpointsTests : IClassFixture<FinanceApiFactory>
{
    private readonly FinanceApiFactory _factory;

    public FinanceEndpointsTests(FinanceApiFactory factory) => _factory = factory;

    [Fact]
    public async Task Lists_only_the_authenticated_owner_and_hides_foreign_details()
    {
        var (anaId, brunoId) = await _factory.SeedAccounts();
        using var client = _factory.CreateClient();
        client.DefaultRequestHeaders.Add("X-Test-User", "ana");

        var list = await client.GetFromJsonAsync<ListResponse<AccountResponse>>("/api/v1/accounts");
        var foreign = await client.GetAsync($"/api/v1/accounts/{brunoId}");

        Assert.NotNull(list);
        Assert.Collection(list.Items, account => Assert.Equal(anaId.ToString(), account.Id));
        Assert.Equal(HttpStatusCode.NotFound, foreign.StatusCode);
    }

    [Fact]
    public async Task Account_creation_requires_idempotency_and_reuses_the_server_id()
    {
        using var client = _factory.CreateClient();
        client.DefaultRequestHeaders.Add("X-Test-User", "carla");
        var request = new CreateAccountRequest("Principal", "Banco", "Corrente", 10000);

        var missingKey = await client.PostAsJsonAsync("/api/v1/accounts", request);
        Assert.Equal(HttpStatusCode.BadRequest, missingKey.StatusCode);

        client.DefaultRequestHeaders.Add("Idempotency-Key", "account-create-001");
        var first = await client.PostAsJsonAsync("/api/v1/accounts", request);
        var second = await client.PostAsJsonAsync("/api/v1/accounts", request);
        var firstBody = await first.Content.ReadFromJsonAsync<AccountResponse>();
        var secondBody = await second.Content.ReadFromJsonAsync<AccountResponse>();

        Assert.Equal(HttpStatusCode.Created, first.StatusCode);
        Assert.Equal(HttpStatusCode.OK, second.StatusCode);
        Assert.Equal(firstBody?.Id, secondBody?.Id);
        var list = await client.GetFromJsonAsync<ListResponse<AccountResponse>>("/api/v1/accounts");
        Assert.Single(list!.Items);
    }

    [Fact]
    public async Task Account_creation_rejects_a_null_bank_without_an_internal_error()
    {
        using var client = _factory.CreateClient();
        client.DefaultRequestHeaders.Add("X-Test-User", "dora");
        client.DefaultRequestHeaders.Add("Idempotency-Key", "account-null-bank-001");

        var response = await client.PostAsJsonAsync("/api/v1/accounts", new
        {
            name = "Principal",
            bank = (string?)null,
            type = "Corrente",
            initialBalanceCents = 0
        });

        Assert.Equal(HttpStatusCode.UnprocessableEntity, response.StatusCode);
    }

    [Fact]
    public async Task Financial_routes_require_authentication()
    {
        using var client = _factory.CreateClient();
        Assert.Equal(HttpStatusCode.Unauthorized, (await client.GetAsync("/api/v1/accounts")).StatusCode);
    }
}

public sealed class FinanceApiFactory : WebApplicationFactory<Program>
{
    private readonly string _databaseName = $"finapp-tests-{Guid.NewGuid()}";

    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        builder.UseEnvironment("Testing");
        builder.ConfigureTestServices(services =>
        {
            services.RemoveAll<DbContextOptions<AppDbContext>>();
            services.RemoveAll<IDbContextOptionsConfiguration<AppDbContext>>();
            services.RemoveAll<AppDbContext>();
            services.AddDbContext<AppDbContext>(options => options.UseInMemoryDatabase(_databaseName));
            services.AddLogging(logging => logging.ClearProviders());
            services.AddAuthentication(options =>
            {
                options.DefaultAuthenticateScheme = TestAuthenticationHandler.TestScheme;
                options.DefaultChallengeScheme = TestAuthenticationHandler.TestScheme;
            }).AddScheme<AuthenticationSchemeOptions, TestAuthenticationHandler>(TestAuthenticationHandler.TestScheme, _ => { });
        });
    }

    public async Task<(Guid AnaId, Guid BrunoId)> SeedAccounts()
    {
        using var scope = Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        await db.Database.EnsureCreatedAsync();
        var ana = new FinancialAccount { Id = Guid.NewGuid(), OwnerUserId = "ana", Name = "Ana", Bank = "Banco", Type = "Corrente" };
        var bruno = new FinancialAccount { Id = Guid.NewGuid(), OwnerUserId = "bruno", Name = "Bruno", Bank = "Banco", Type = "Corrente" };
        db.AddRange(ana, bruno);
        await db.SaveChangesAsync();
        return (ana.Id, bruno.Id);
    }
}

public sealed class TestAuthenticationHandler(
    IOptionsMonitor<AuthenticationSchemeOptions> options,
    ILoggerFactory logger,
    UrlEncoder encoder) : AuthenticationHandler<AuthenticationSchemeOptions>(options, logger, encoder)
{
    public const string TestScheme = "Test";

    protected override Task<AuthenticateResult> HandleAuthenticateAsync()
    {
        var userId = Request.Headers["X-Test-User"].ToString();
        if (string.IsNullOrWhiteSpace(userId)) return Task.FromResult(AuthenticateResult.NoResult());
        var identity = new ClaimsIdentity([new Claim(ClaimTypes.NameIdentifier, userId)], TestScheme);
        return Task.FromResult(AuthenticateResult.Success(new AuthenticationTicket(new ClaimsPrincipal(identity), TestScheme)));
    }
}
