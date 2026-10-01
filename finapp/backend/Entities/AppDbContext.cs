using Microsoft.EntityFrameworkCore;

namespace Finapp.Api.Entities;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

    public DbSet<Tenant> Tenants => Set<Tenant>();
    public DbSet<User> Users => Set<User>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);
        
        modelBuilder.Entity<Tenant>().HasKey(t => t.Id);
        
        modelBuilder.Entity<User>().HasKey(u => u.Id);
        modelBuilder.Entity<User>()
            .HasOne(u => u.DefaultTenant)
            .WithMany()
            .HasForeignKey(u => u.DefaultTenantId);
    }
}
