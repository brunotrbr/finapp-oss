using System.Security.Claims;

namespace Finapp.Api.Authorization;

public sealed class ClaimsAccessScope(IHttpContextAccessor httpContextAccessor) : IAccessScope
{
    public string UserId
    {
        get
        {
            var principal = httpContextAccessor.HttpContext?.User;
            var userId = principal?.FindFirstValue(ClaimTypes.NameIdentifier)
                ?? principal?.FindFirstValue("user_id")
                ?? principal?.FindFirstValue("sub");

            return string.IsNullOrWhiteSpace(userId)
                ? throw new UnauthorizedAccessException("Authenticated Firebase UID is unavailable.")
                : userId;
        }
    }
}
