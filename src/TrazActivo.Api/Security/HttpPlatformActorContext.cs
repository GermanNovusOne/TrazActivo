using System.Security.Claims;
using TrazActivo.ControlPlane.Application.Security;

namespace TrazActivo.Api.Security;

internal sealed class HttpPlatformActorContext(IHttpContextAccessor accessor) : IPlatformActorContext
{
  public PlatformActor? Current
  {
    get
    {
      var principal = accessor.HttpContext?.User;
      if (principal?.Identity?.IsAuthenticated != true)
      {
        return null;
      }

      var operatorId = principal.FindFirstValue("sub") ??
                       principal.FindFirstValue(ClaimTypes.NameIdentifier);
      if (string.IsNullOrWhiteSpace(operatorId))
      {
        return null;
      }

      var permissions = principal.FindAll(PlatformClaimTypes.Permission)
          .Select(claim => claim.Value)
          .ToHashSet(StringComparer.Ordinal);
      return new PlatformActor(operatorId, permissions);
    }
  }
}
