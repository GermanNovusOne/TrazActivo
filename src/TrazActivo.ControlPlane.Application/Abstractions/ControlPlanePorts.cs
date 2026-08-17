using TrazActivo.ControlPlane.Domain.Auditing;
using TrazActivo.ControlPlane.Domain.Common;
using TrazActivo.ControlPlane.Domain.Tenants;
using TrazActivo.ControlPlane.Application.Tenants;

namespace TrazActivo.ControlPlane.Application.Abstractions;

public sealed record TenantAdministrationState(
    TenantSnapshot Tenant,
    TenantCatalogEntrySnapshot CatalogEntry);

public enum StoreCreateOutcome
{
  Created,
  Replayed,
  IdempotencyConflict,
  TenantIdConflict,
  TenantCodeConflict
}

public sealed record StoreCreateResult(StoreCreateOutcome Outcome, TenantDetails? Details = null);

public enum StoreUpdateOutcome
{
  Updated,
  Replayed,
  IdempotencyConflict,
  NotFound,
  ConcurrencyConflict
}

public sealed record StoreUpdateResult(
    StoreUpdateOutcome Outcome,
    TenantDetails? Details = null,
    long? CurrentVersion = null);

public sealed record IdempotencyRequest(
    string Scope,
    string Key,
    string Fingerprint);

public enum IdempotencyLookupOutcome
{
  NotFound,
  Replayed,
  Conflict
}

public sealed record IdempotencyLookupResult(
    IdempotencyLookupOutcome Outcome,
    TenantDetails? Details = null);

public interface ITenantAdministrationStore
{
  ValueTask<TenantAdministrationState?> FindAsync(TenantId tenantId, CancellationToken cancellationToken);

  ValueTask<IdempotencyLookupResult> FindIdempotentResultAsync(
      IdempotencyRequest idempotency,
      CancellationToken cancellationToken);

  ValueTask<StoreCreateResult> CreateAsync(
      Tenant tenant,
      TenantCatalogEntry catalogEntry,
      PlatformAuditRecord auditRecord,
      IReadOnlyCollection<IDomainEvent> domainEvents,
      IdempotencyRequest idempotency,
      TenantDetails details,
      CancellationToken cancellationToken);

  ValueTask<StoreUpdateResult> UpdateAsync(
      Tenant tenant,
      TenantCatalogEntry catalogEntry,
      long expectedVersion,
      PlatformAuditRecord auditRecord,
      IReadOnlyCollection<IDomainEvent> domainEvents,
      IdempotencyRequest idempotency,
      TenantDetails details,
      CancellationToken cancellationToken);
}

public interface ITenantCatalogReader
{
  ValueTask<TenantCatalogEntrySnapshot?> FindCatalogEntryAsync(
      TenantId tenantId,
      CancellationToken cancellationToken);
}

public interface IPlatformAuditReader
{
  ValueTask<IReadOnlyList<PlatformAuditRecord>> ReadAllAsync(CancellationToken cancellationToken);
}

public interface IDomainEventReader
{
  ValueTask<IReadOnlyList<IDomainEvent>> ReadAllAsync(CancellationToken cancellationToken);
}

public interface IDeploymentStampSelector
{
  ValueTask<DeploymentStampReference?> SelectAsync(
      TenantSnapshot tenant,
      CancellationToken cancellationToken);
}
