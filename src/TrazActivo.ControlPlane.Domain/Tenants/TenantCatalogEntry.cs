using TrazActivo.ControlPlane.Domain.Common;

namespace TrazActivo.ControlPlane.Domain.Tenants;

public sealed class TenantCatalogEntry : AggregateRoot
{
  private TenantCatalogEntry(TenantCatalogEntrySnapshot snapshot)
  {
    ValidateSnapshot(snapshot);
    TenantId = snapshot.TenantId;
    TenantCode = snapshot.TenantCode;
    Status = snapshot.Status;
    DeploymentStamp = snapshot.DeploymentStamp;
    DatabaseReference = snapshot.DatabaseReference;
    StorageReference = snapshot.StorageReference;
    Region = snapshot.Region;
    SchemaVersion = snapshot.SchemaVersion;
    ConfigurationVersion = snapshot.ConfigurationVersion;
    IdentityMode = snapshot.IdentityMode;
    Version = snapshot.Version;
  }

  public TenantId TenantId { get; }

  public TenantCode TenantCode { get; }

  public TenantLifecycleStatus Status { get; private set; }

  public DeploymentStampReference? DeploymentStamp { get; private set; }

  public string? DatabaseReference { get; }

  public string? StorageReference { get; }

  public string Region { get; private set; }

  public long? SchemaVersion { get; }

  public long? ConfigurationVersion { get; }

  public IdentityModeCode IdentityMode { get; }

  public long Version { get; private set; }

  public static TenantCatalogEntry CreateFor(
      Tenant tenant,
      IdentityModeCode identityMode,
      DateTimeOffset now)
  {
    var entry = new TenantCatalogEntry(new TenantCatalogEntrySnapshot(
        tenant.Id,
        tenant.Code,
        tenant.Status,
        tenant.DeploymentStamp,
        null,
        null,
        tenant.Region,
        null,
        null,
        identityMode,
        1));

    entry.Raise(new TenantCatalogEntryCreatedDomainEvent(tenant.Id, now));
    return entry;
  }

  public static TenantCatalogEntry FromSnapshot(TenantCatalogEntrySnapshot snapshot) => new(snapshot);

  public TenantCatalogEntrySnapshot ToSnapshot() => new(
      TenantId,
      TenantCode,
      Status,
      DeploymentStamp,
      DatabaseReference,
      StorageReference,
      Region,
      SchemaVersion,
      ConfigurationVersion,
      IdentityMode,
      Version);

  public void SynchronizeOperationalState(Tenant tenant, DateTimeOffset now)
  {
    if (tenant.Id != TenantId)
    {
      throw new DomainRuleException(
          "PLAT-CATALOG-TENANT-MISMATCH",
          "Catalog entry cannot be synchronized from another tenant.");
    }

    Status = tenant.Status;
    DeploymentStamp = tenant.DeploymentStamp;
    Region = tenant.Region;
    Version++;
    Raise(new TenantCatalogEntryUpdatedDomainEvent(TenantId, Status, now));
  }

  private static void ValidateSnapshot(TenantCatalogEntrySnapshot snapshot)
  {
    ArgumentNullException.ThrowIfNull(snapshot);
    if (snapshot.TenantId.Value == Guid.Empty ||
        string.IsNullOrWhiteSpace(snapshot.TenantCode.Value) ||
        string.IsNullOrWhiteSpace(snapshot.Region) ||
        string.IsNullOrWhiteSpace(snapshot.IdentityMode.Value) ||
        !Enum.IsDefined(snapshot.Status) ||
        snapshot.Version < 1 ||
        snapshot.DatabaseReference is not null && string.IsNullOrWhiteSpace(snapshot.DatabaseReference) ||
        snapshot.StorageReference is not null && string.IsNullOrWhiteSpace(snapshot.StorageReference))
    {
      throw new DomainRuleException(
          "PLAT-CATALOG-SNAPSHOT-INVALID",
          "Tenant catalog snapshot is invalid.",
          DomainErrorKind.Validation);
    }
  }
}

public sealed record TenantCatalogEntrySnapshot(
    TenantId TenantId,
    TenantCode TenantCode,
    TenantLifecycleStatus Status,
    DeploymentStampReference? DeploymentStamp,
    string? DatabaseReference,
    string? StorageReference,
    string Region,
    long? SchemaVersion,
    long? ConfigurationVersion,
    IdentityModeCode IdentityMode,
    long Version);
