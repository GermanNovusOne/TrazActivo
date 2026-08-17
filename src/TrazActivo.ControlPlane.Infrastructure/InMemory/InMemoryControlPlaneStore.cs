using TrazActivo.ControlPlane.Application.Abstractions;
using TrazActivo.ControlPlane.Application.Tenants;
using TrazActivo.ControlPlane.Domain.Auditing;
using TrazActivo.ControlPlane.Domain.Common;
using TrazActivo.ControlPlane.Domain.Tenants;

namespace TrazActivo.ControlPlane.Infrastructure.InMemory;

internal sealed class InMemoryControlPlaneStore :
    ITenantAdministrationStore,
    ITenantCatalogReader,
    IPlatformAuditReader,
    IDomainEventReader
{
  private readonly Lock _lock = new();
  private Dictionary<TenantId, TenantAdministrationState> _tenants = [];
  private Dictionary<string, TenantId> _tenantCodes = new(StringComparer.OrdinalIgnoreCase);
  private List<PlatformAuditRecord> _auditRecords = [];
  private List<IDomainEvent> _domainEvents = [];
  private Dictionary<string, IdempotencyEntry> _idempotencyEntries = new(StringComparer.Ordinal);

  public ValueTask<TenantAdministrationState?> FindAsync(
      TenantId tenantId,
      CancellationToken cancellationToken)
  {
    cancellationToken.ThrowIfCancellationRequested();
    lock (_lock)
    {
      return ValueTask.FromResult(_tenants.GetValueOrDefault(tenantId));
    }
  }

  public ValueTask<TenantCatalogEntrySnapshot?> FindCatalogEntryAsync(
      TenantId tenantId,
      CancellationToken cancellationToken)
  {
    cancellationToken.ThrowIfCancellationRequested();
    lock (_lock)
    {
      return ValueTask.FromResult(
          _tenants.TryGetValue(tenantId, out var state) ? state.CatalogEntry : null);
    }
  }

  public ValueTask<IdempotencyLookupResult> FindIdempotentResultAsync(
      IdempotencyRequest idempotency,
      CancellationToken cancellationToken)
  {
    cancellationToken.ThrowIfCancellationRequested();
    lock (_lock)
    {
      return ValueTask.FromResult(LookUpIdempotency(idempotency));
    }
  }

  public ValueTask<StoreCreateResult> CreateAsync(
      Tenant tenant,
      TenantCatalogEntry catalogEntry,
      PlatformAuditRecord auditRecord,
      IReadOnlyCollection<IDomainEvent> domainEvents,
      IdempotencyRequest idempotency,
      TenantDetails details,
      CancellationToken cancellationToken)
  {
    cancellationToken.ThrowIfCancellationRequested();
    lock (_lock)
    {
      var replay = LookUpIdempotency(idempotency);
      if (replay.Outcome == IdempotencyLookupOutcome.Conflict)
      {
        return ValueTask.FromResult(new StoreCreateResult(StoreCreateOutcome.IdempotencyConflict));
      }

      if (replay.Outcome == IdempotencyLookupOutcome.Replayed)
      {
        return ValueTask.FromResult(new StoreCreateResult(StoreCreateOutcome.Replayed, replay.Details));
      }

      if (_tenants.ContainsKey(tenant.Id))
      {
        return ValueTask.FromResult(new StoreCreateResult(StoreCreateOutcome.TenantIdConflict));
      }

      if (_tenantCodes.ContainsKey(tenant.Code.Value))
      {
        return ValueTask.FromResult(new StoreCreateResult(StoreCreateOutcome.TenantCodeConflict));
      }

      var tenants = new Dictionary<TenantId, TenantAdministrationState>(_tenants);
      var tenantCodes = new Dictionary<string, TenantId>(_tenantCodes, StringComparer.OrdinalIgnoreCase);
      var auditRecords = new List<PlatformAuditRecord>(_auditRecords);
      var events = new List<IDomainEvent>(_domainEvents);
      var idempotencyEntries = new Dictionary<string, IdempotencyEntry>(
          _idempotencyEntries,
          StringComparer.Ordinal);

      tenants.Add(tenant.Id, new(tenant.ToSnapshot(), catalogEntry.ToSnapshot()));
      tenantCodes.Add(tenant.Code.Value, tenant.Id);
      auditRecords.Add(auditRecord);
      events.AddRange(domainEvents);
      idempotencyEntries.Add(StorageKey(idempotency), new(idempotency.Fingerprint, details));
      cancellationToken.ThrowIfCancellationRequested();

      _tenants = tenants;
      _tenantCodes = tenantCodes;
      _auditRecords = auditRecords;
      _domainEvents = events;
      _idempotencyEntries = idempotencyEntries;
      return ValueTask.FromResult(new StoreCreateResult(StoreCreateOutcome.Created, details));
    }
  }

  public ValueTask<StoreUpdateResult> UpdateAsync(
      Tenant tenant,
      TenantCatalogEntry catalogEntry,
      long expectedVersion,
      PlatformAuditRecord auditRecord,
      IReadOnlyCollection<IDomainEvent> domainEvents,
      IdempotencyRequest idempotency,
      TenantDetails details,
      CancellationToken cancellationToken)
  {
    cancellationToken.ThrowIfCancellationRequested();
    lock (_lock)
    {
      var replay = LookUpIdempotency(idempotency);
      if (replay.Outcome == IdempotencyLookupOutcome.Conflict)
      {
        return ValueTask.FromResult(new StoreUpdateResult(StoreUpdateOutcome.IdempotencyConflict));
      }

      if (replay.Outcome == IdempotencyLookupOutcome.Replayed)
      {
        return ValueTask.FromResult(new StoreUpdateResult(
            StoreUpdateOutcome.Replayed,
            replay.Details));
      }

      if (!_tenants.TryGetValue(tenant.Id, out var current))
      {
        return ValueTask.FromResult(new StoreUpdateResult(StoreUpdateOutcome.NotFound));
      }

      if (current.Tenant.Version != expectedVersion)
      {
        return ValueTask.FromResult(new StoreUpdateResult(
            StoreUpdateOutcome.ConcurrencyConflict,
            CurrentVersion: current.Tenant.Version));
      }

      var tenants = new Dictionary<TenantId, TenantAdministrationState>(_tenants)
      {
        [tenant.Id] = new(tenant.ToSnapshot(), catalogEntry.ToSnapshot())
      };
      var auditRecords = new List<PlatformAuditRecord>(_auditRecords) { auditRecord };
      var events = new List<IDomainEvent>(_domainEvents);
      var idempotencyEntries = new Dictionary<string, IdempotencyEntry>(
          _idempotencyEntries,
          StringComparer.Ordinal);
      events.AddRange(domainEvents);
      idempotencyEntries.Add(StorageKey(idempotency), new(idempotency.Fingerprint, details));
      cancellationToken.ThrowIfCancellationRequested();

      _tenants = tenants;
      _auditRecords = auditRecords;
      _domainEvents = events;
      _idempotencyEntries = idempotencyEntries;
      return ValueTask.FromResult(new StoreUpdateResult(StoreUpdateOutcome.Updated, details));
    }
  }

  public ValueTask<IReadOnlyList<PlatformAuditRecord>> ReadAllAsync(
      CancellationToken cancellationToken)
  {
    cancellationToken.ThrowIfCancellationRequested();
    lock (_lock)
    {
      return ValueTask.FromResult<IReadOnlyList<PlatformAuditRecord>>([.. _auditRecords]);
    }
  }

  ValueTask<IReadOnlyList<IDomainEvent>> IDomainEventReader.ReadAllAsync(
      CancellationToken cancellationToken)
  {
    cancellationToken.ThrowIfCancellationRequested();
    lock (_lock)
    {
      return ValueTask.FromResult<IReadOnlyList<IDomainEvent>>([.. _domainEvents]);
    }
  }

  private IdempotencyLookupResult LookUpIdempotency(IdempotencyRequest idempotency)
  {
    if (!_idempotencyEntries.TryGetValue(StorageKey(idempotency), out var entry))
    {
      return new(IdempotencyLookupOutcome.NotFound);
    }

    return StringComparer.Ordinal.Equals(entry.Fingerprint, idempotency.Fingerprint)
        ? new(IdempotencyLookupOutcome.Replayed, entry.Details)
        : new(IdempotencyLookupOutcome.Conflict);
  }

  private static string StorageKey(IdempotencyRequest idempotency) =>
      $"{idempotency.Scope}:{idempotency.Key}";

  private sealed record IdempotencyEntry(string Fingerprint, TenantDetails Details);
}
