using TrazActivo.Tenancy.Abstractions;

namespace TrazActivo.UnitTests;

public sealed class TenancyContractTests
{
  [Fact]
  public void Tenant_context_copies_roles_and_permissions_into_frozen_sets()
  {
    var roles = new HashSet<string>(StringComparer.Ordinal) { "Operator" };
    var permissions = new HashSet<string>(StringComparer.Ordinal) { "assets.read" };
    var context = new TenantContext(
        Guid.NewGuid(),
        "user",
        "membership",
        "legal-entity",
        null,
        null,
        roles,
        permissions,
        "es-CL",
        "America/Santiago",
        "correlation",
        "session");

    roles.Add("MutatedRole");
    permissions.Clear();

    Assert.Equal(["Operator"], context.Roles);
    Assert.Equal(["assets.read"], context.Permissions);
  }

  [Fact]
  public void Resolution_result_factory_cannot_mark_suspended_tenant_as_resolved()
  {
    var suspended = Resolved(TenantAvailability.Suspended);

    var result = TenantResolutionResult.Evaluate(suspended);

    Assert.False(result.IsResolved);
    Assert.Null(result.Tenant);
    Assert.Equal("TEN-SUSPENDED", result.ErrorCode);
    Assert.Empty(typeof(TenantResolutionResult).GetConstructors());
  }

  [Fact]
  public void Resolution_result_factory_accepts_only_complete_active_operational_reference()
  {
    var active = Resolved(TenantAvailability.Active);

    var result = TenantResolutionResult.Evaluate(active);

    Assert.True(result.IsResolved);
    Assert.Same(active, result.Tenant);
    Assert.Null(result.ErrorCode);
  }

  private static ResolvedTenant Resolved(TenantAvailability availability) => new(
      Guid.NewGuid(),
      availability,
      "stamp-server",
      "database-reference",
      "storage-reference",
      "cl-test",
      1,
      1,
      "ExternalId");
}
