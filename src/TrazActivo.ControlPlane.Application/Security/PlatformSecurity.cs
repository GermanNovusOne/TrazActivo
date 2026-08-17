using TrazActivo.ControlPlane.Application.Common;

namespace TrazActivo.ControlPlane.Application.Security;

public static class PlatformPermissions
{
  public const string TenantsCreate = "platform.tenants.create";
  public const string TenantsRead = "platform.tenants.read";
  public const string TenantsProvision = "platform.tenants.provision";
  public const string TenantsSuspend = "platform.tenants.suspend";
}

public sealed record PlatformActor(string OperatorId, IReadOnlySet<string> Permissions)
{
  public void Require(string permission)
  {
    if (!Permissions.Contains(permission))
    {
      throw new ApplicationFailureException(
          "SEC-PERMISSION-DENIED",
          "The platform operator does not have permission for this operation.",
          ApplicationErrorKind.Forbidden);
    }
  }
}

public interface IPlatformActorContext
{
  PlatformActor? Current { get; }
}

public interface ICorrelationContext
{
  string CorrelationId { get; }
}
