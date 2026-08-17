using TrazActivo.ControlPlane.Domain.Common;
using TrazActivo.ControlPlane.Domain.Tenants;

namespace TrazActivo.UnitTests.Tenants;

public sealed class SnapshotRehydrationTests
{
  private static readonly DateTimeOffset Now = new(2026, 8, 17, 12, 0, 0, TimeSpan.Zero);

  [Fact]
  public void Tenant_rehydration_rejects_invalid_snapshot()
  {
    var snapshot = new TenantSnapshot(
        default,
        TenantCode.Create("INVALID"),
        "Invalid Tenant",
        "cl-test",
        TenantLifecycleStatus.Requested,
        null,
        Now,
        Now,
        1);

    var exception = Assert.Throws<DomainRuleException>(() => Tenant.FromSnapshot(snapshot));

    Assert.Equal("PLAT-TENANT-SNAPSHOT-INVALID", exception.Code);
  }

  [Fact]
  public void Catalog_rehydration_rejects_invalid_snapshot()
  {
    var snapshot = new TenantCatalogEntrySnapshot(
        new TenantId(Guid.NewGuid()),
        TenantCode.Create("INVALID"),
        TenantLifecycleStatus.Requested,
        null,
        " ",
        null,
        "cl-test",
        null,
        null,
        IdentityModeCode.Create("ExternalId"),
        1);

    var exception = Assert.Throws<DomainRuleException>(() => TenantCatalogEntry.FromSnapshot(snapshot));

    Assert.Equal("PLAT-CATALOG-SNAPSHOT-INVALID", exception.Code);
  }
}
