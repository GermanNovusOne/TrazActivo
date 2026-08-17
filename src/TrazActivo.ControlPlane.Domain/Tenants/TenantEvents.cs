using TrazActivo.ControlPlane.Domain.Common;

namespace TrazActivo.ControlPlane.Domain.Tenants;

public sealed record TenantProvisioningRequestedDomainEvent(
    TenantId TenantId,
    string OperationId,
    string DeploymentStampId,
    DateTimeOffset OccurredAt) : IDomainEvent
{
  public string EventName => "TenantProvisioningRequested";
}

public sealed record TenantProvisioningFailedDomainEvent(
    TenantId TenantId,
    string OperationId,
    string Reason,
    DateTimeOffset OccurredAt) : IDomainEvent
{
  public string EventName => "TenantProvisioningFailed";
}

public sealed record TenantActivatedDomainEvent(
    TenantId TenantId,
    string Reason,
    DateTimeOffset OccurredAt) : IDomainEvent
{
  public string EventName => "TenantActivated";
}

public sealed record TenantSuspendedDomainEvent(
    TenantId TenantId,
    string Reason,
    DateTimeOffset OccurredAt) : IDomainEvent
{
  public string EventName => "TenantSuspended";
}

public sealed record TenantLifecycleChangedDomainEvent(
    TenantId TenantId,
    TenantLifecycleStatus PreviousStatus,
    TenantLifecycleStatus CurrentStatus,
    string Reason,
    DateTimeOffset OccurredAt) : IDomainEvent
{
  public string EventName => "TenantLifecycleChanged";
}

public sealed record TenantCatalogEntryCreatedDomainEvent(
    TenantId TenantId,
    DateTimeOffset OccurredAt) : IDomainEvent
{
  public string EventName => "TenantCatalogEntryCreated";
}

public sealed record TenantCatalogEntryUpdatedDomainEvent(
    TenantId TenantId,
    TenantLifecycleStatus Status,
    DateTimeOffset OccurredAt) : IDomainEvent
{
  public string EventName => "TenantCatalogEntryUpdated";
}
