using System;

namespace Finapp.Api.Entities;

public class User
{
    public string Id { get; set; } = string.Empty; // Firebase Auth UID
    public string Email { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    
    // Simplification for Phase 0: User has a default Tenant
    public Guid DefaultTenantId { get; set; }
    public Tenant? DefaultTenant { get; set; }
}
