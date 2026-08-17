using TrazActivo.ControlPlane.Domain.Common;
using TrazActivo.ControlPlane.Domain.Tenants;

namespace TrazActivo.UnitTests.Tenants;

public sealed class TenantCatalogEntryTests
{
  private static readonly DateTimeOffset Now = new(2026, 8, 17, 12, 0, 0, TimeSpan.Zero);

  [Fact]
  public void New_catalog_entry_has_operational_metadata_but_no_provisioned_resources()
  {
    var tenant = CreateTenant();
    var catalog = TenantCatalogEntry.CreateFor(tenant, IdentityModeCode.Create("ExternalId"), Now);

    Assert.Equal(tenant.Id, catalog.TenantId);
    Assert.Equal(TenantLifecycleStatus.Requested, catalog.Status);
    Assert.Null(catalog.DatabaseReference);
    Assert.Null(catalog.StorageReference);
    Assert.Null(catalog.SchemaVersion);
    Assert.Null(catalog.ConfigurationVersion);
    Assert.Equal("ExternalId", catalog.IdentityMode.Value);
  }

  [Fact]
  public void Catalog_synchronizes_only_required_operational_lifecycle_fields()
  {
    var tenant = CreateTenant();
    var catalog = TenantCatalogEntry.CreateFor(tenant, IdentityModeCode.Create("ExternalId"), Now);
    tenant.StartProvisioning(
        DeploymentStampReference.Create("stamp-test", "cl-test"),
        "operation-1",
        "Provisioning approved.",
        Now.AddMinutes(1));

    catalog.SynchronizeOperationalState(tenant, Now.AddMinutes(1));

    Assert.Equal(TenantLifecycleStatus.Provisioning, catalog.Status);
    Assert.Equal("stamp-test", catalog.DeploymentStamp?.Id);
    Assert.Null(catalog.DatabaseReference);
    Assert.Null(catalog.StorageReference);
  }

  [Fact]
  public void Catalog_rejects_synchronization_from_another_tenant()
  {
    var tenant = CreateTenant();
    var other = Tenant.Request(
        new TenantId(Guid.Parse("0198b8ad-135c-7000-8000-000000000002")),
        TenantCode.Create("OTHER"),
        "Other",
        "cl-test",
        Now);
    var catalog = TenantCatalogEntry.CreateFor(tenant, IdentityModeCode.Create("ExternalId"), Now);

    var exception = Assert.Throws<DomainRuleException>(() =>
        catalog.SynchronizeOperationalState(other, Now));

    Assert.Equal("PLAT-CATALOG-TENANT-MISMATCH", exception.Code);
  }

  private static Tenant CreateTenant() => Tenant.Request(
      new TenantId(Guid.Parse("0198b8ad-135c-7000-8000-000000000001")),
      TenantCode.Create("NOVUS"),
      "Novus One",
      "cl-test",
      Now);
}
