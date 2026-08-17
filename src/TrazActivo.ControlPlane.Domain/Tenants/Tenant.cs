using TrazActivo.ControlPlane.Domain.Common;

namespace TrazActivo.ControlPlane.Domain.Tenants;

public sealed class Tenant : AggregateRoot
{
  private Tenant(TenantSnapshot snapshot)
  {
    ValidateSnapshot(snapshot);
    Id = snapshot.Id;
    Code = snapshot.Code;
    Name = snapshot.Name;
    Region = snapshot.Region;
    Status = snapshot.Status;
    DeploymentStamp = snapshot.DeploymentStamp;
    CreatedAt = snapshot.CreatedAt;
    UpdatedAt = snapshot.UpdatedAt;
    Version = snapshot.Version;
  }

  public TenantId Id { get; }

  public TenantCode Code { get; }

  public string Name { get; }

  public string Region { get; }

  public TenantLifecycleStatus Status { get; private set; }

  public DeploymentStampReference? DeploymentStamp { get; private set; }

  public DateTimeOffset CreatedAt { get; }

  public DateTimeOffset UpdatedAt { get; private set; }

  public long Version { get; private set; }

  public static Tenant Request(
      TenantId id,
      TenantCode code,
      string? name,
      string? region,
      DateTimeOffset now)
  {
    if (string.IsNullOrWhiteSpace(name))
    {
      throw new DomainRuleException(
          "PLAT-TENANT-NAME-REQUIRED",
          "Tenant name is required.",
          DomainErrorKind.Validation);
    }

    if (string.IsNullOrWhiteSpace(region))
    {
      throw new DomainRuleException(
          "PLAT-TENANT-REGION-REQUIRED",
          "Tenant region is required.",
          DomainErrorKind.Validation);
    }

    return new Tenant(new TenantSnapshot(
        id,
        code,
        name.Trim(),
        region.Trim(),
        TenantLifecycleStatus.Requested,
        null,
        now,
        now,
        1));
  }

  public static Tenant FromSnapshot(TenantSnapshot snapshot) => new(snapshot);

  public TenantSnapshot ToSnapshot() => new(
      Id,
      Code,
      Name,
      Region,
      Status,
      DeploymentStamp,
      CreatedAt,
      UpdatedAt,
      Version);

  public void StartProvisioning(
      DeploymentStampReference stamp,
      string operationId,
      string reason,
      DateTimeOffset now)
  {
    EnsureCurrentStatus(TenantLifecycleStatus.Requested, TenantLifecycleStatus.ProvisioningFailed);
    EnsureReason(reason);
    DeploymentStamp = stamp;
    TransitionTo(TenantLifecycleStatus.Provisioning, reason, now);
    Raise(new TenantProvisioningRequestedDomainEvent(Id, operationId, stamp.Id, now));
  }

  public void MarkConfiguring(string reason, DateTimeOffset now)
  {
    EnsureCurrentStatus(TenantLifecycleStatus.Provisioning);
    TransitionTo(TenantLifecycleStatus.Configuring, reason, now);
  }

  public void MarkValidation(string reason, DateTimeOffset now)
  {
    EnsureCurrentStatus(TenantLifecycleStatus.Configuring);
    TransitionTo(TenantLifecycleStatus.Validation, reason, now);
  }

  public void Activate(string reason, DateTimeOffset now)
  {
    EnsureCurrentStatus(TenantLifecycleStatus.Validation, TenantLifecycleStatus.Suspended);
    TransitionTo(TenantLifecycleStatus.Active, reason, now);
    Raise(new TenantActivatedDomainEvent(Id, reason, now));
  }

  public void FailProvisioning(string operationId, string reason, DateTimeOffset now)
  {
    EnsureCurrentStatus(
        TenantLifecycleStatus.Provisioning,
        TenantLifecycleStatus.Configuring,
        TenantLifecycleStatus.Validation);
    TransitionTo(TenantLifecycleStatus.ProvisioningFailed, reason, now);
    Raise(new TenantProvisioningFailedDomainEvent(Id, operationId, reason, now));
  }

  public void Suspend(string reason, DateTimeOffset now)
  {
    EnsureCurrentStatus(TenantLifecycleStatus.Active);
    TransitionTo(TenantLifecycleStatus.Suspended, reason, now);
    Raise(new TenantSuspendedDomainEvent(Id, reason, now));
  }

  public void BeginTermination(string reason, DateTimeOffset now)
  {
    EnsureCurrentStatus(TenantLifecycleStatus.Active, TenantLifecycleStatus.Suspended);
    TransitionTo(TenantLifecycleStatus.Terminating, reason, now);
  }

  public void MarkRetention(string reason, DateTimeOffset now)
  {
    EnsureCurrentStatus(TenantLifecycleStatus.Terminating);
    TransitionTo(TenantLifecycleStatus.Retention, reason, now);
  }

  public void MarkDeleted(string reason, DateTimeOffset now)
  {
    EnsureCurrentStatus(TenantLifecycleStatus.Retention);
    TransitionTo(TenantLifecycleStatus.Deleted, reason, now);
  }

  private void TransitionTo(TenantLifecycleStatus target, string reason, DateTimeOffset now)
  {
    EnsureReason(reason);
    var previous = Status;
    Status = target;
    UpdatedAt = now;
    Version++;
    Raise(new TenantLifecycleChangedDomainEvent(Id, previous, target, reason, now));
  }

  private void EnsureCurrentStatus(params TenantLifecycleStatus[] allowed)
  {
    if (!allowed.Contains(Status))
    {
      throw new DomainRuleException(
          "PLAT-TENANT-STATE-CONFLICT",
          $"Tenant cannot transition from {Status} in this operation.");
    }
  }

  private static void EnsureReason(string reason)
  {
    if (string.IsNullOrWhiteSpace(reason))
    {
      throw new DomainRuleException(
          "PLAT-TENANT-REASON-REQUIRED",
          "A reason is required for every lifecycle transition.",
          DomainErrorKind.Validation);
    }
  }

  private static void ValidateSnapshot(TenantSnapshot snapshot)
  {
    ArgumentNullException.ThrowIfNull(snapshot);
    if (snapshot.Id.Value == Guid.Empty ||
        string.IsNullOrWhiteSpace(snapshot.Code.Value) ||
        string.IsNullOrWhiteSpace(snapshot.Name) ||
        string.IsNullOrWhiteSpace(snapshot.Region) ||
        !Enum.IsDefined(snapshot.Status) ||
        snapshot.Version < 1 ||
        snapshot.UpdatedAt < snapshot.CreatedAt)
    {
      throw new DomainRuleException(
          "PLAT-TENANT-SNAPSHOT-INVALID",
          "Tenant snapshot is invalid.",
          DomainErrorKind.Validation);
    }
  }
}

public sealed record TenantSnapshot(
    TenantId Id,
    TenantCode Code,
    string Name,
    string Region,
    TenantLifecycleStatus Status,
    DeploymentStampReference? DeploymentStamp,
    DateTimeOffset CreatedAt,
    DateTimeOffset UpdatedAt,
    long Version);
