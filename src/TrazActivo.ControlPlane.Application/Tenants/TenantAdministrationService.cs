using TrazActivo.ControlPlane.Application.Abstractions;
using TrazActivo.ControlPlane.Application.Common;
using TrazActivo.ControlPlane.Application.Security;
using TrazActivo.ControlPlane.Domain.Auditing;
using TrazActivo.ControlPlane.Domain.Common;
using TrazActivo.ControlPlane.Domain.Tenants;

namespace TrazActivo.ControlPlane.Application.Tenants;

public sealed class TenantAdministrationService(
    ITenantAdministrationStore store,
    IDeploymentStampSelector stampSelector,
    IPlatformActorContext actorContext,
    ICorrelationContext correlationContext,
    TimeProvider timeProvider)
{
  public ValueTask<TenantDetails> CreateAsync(
      CreateTenantCommand command,
      CancellationToken cancellationToken) => TranslateDomainFailuresAsync(
          () => CreateCoreAsync(command, cancellationToken));

  public ValueTask<TenantDetails> StartProvisioningAsync(
      StartTenantProvisioningCommand command,
      CancellationToken cancellationToken) => TranslateDomainFailuresAsync(
          () => StartProvisioningCoreAsync(command, cancellationToken));

  public ValueTask<TenantDetails> SuspendAsync(
      SuspendTenantCommand command,
      CancellationToken cancellationToken) => TranslateDomainFailuresAsync(
          () => SuspendCoreAsync(command, cancellationToken));

  private async ValueTask<TenantDetails> CreateCoreAsync(
      CreateTenantCommand command,
      CancellationToken cancellationToken)
  {
    var actor = RequireActor(PlatformPermissions.TenantsCreate);
    EnsureIdempotencyKey(command.IdempotencyKey);
    var idempotency = new IdempotencyRequest(
        $"control.tenants.create:{actor.OperatorId}",
        command.IdempotencyKey,
        command.RequestFingerprint);
    var replay = await FindReplayAsync(idempotency, cancellationToken);
    if (replay is not null)
    {
      return replay;
    }

    var now = timeProvider.GetUtcNow();
    var tenant = Tenant.Request(
        TenantId.New(),
        TenantCode.Create(command.Code),
        command.Name,
        command.Region,
        now);
    var catalogEntry = TenantCatalogEntry.CreateFor(
        tenant,
        IdentityModeCode.Create(command.IdentityMode),
        now);
    var operationId = Guid.CreateVersion7().ToString("D");
    var audit = CreateAudit(
        actor,
        tenant,
        PlatformPermissions.TenantsCreate,
        "TenantRequested",
        "Tenant creation requested.",
        operationId,
        null,
        StateOf(tenant),
        now);
    var details = ToDetails(tenant.ToSnapshot(), catalogEntry.ToSnapshot());
    var result = await store.CreateAsync(
        tenant,
        catalogEntry,
        audit,
        DequeueEvents(tenant, catalogEntry),
        idempotency,
        details,
        cancellationToken);

    return result.Outcome switch
    {
      StoreCreateOutcome.Created or StoreCreateOutcome.Replayed => result.Details!,
      StoreCreateOutcome.IdempotencyConflict => throw IdempotencyConflict(),
      StoreCreateOutcome.TenantCodeConflict => throw new ApplicationFailureException(
          "PLAT-TENANT-CODE-CONFLICT",
          "A tenant with the same code already exists.",
          ApplicationErrorKind.Conflict),
      _ => throw new ApplicationFailureException(
          "PLAT-TENANT-ID-CONFLICT",
          "The generated tenant identifier already exists.",
          ApplicationErrorKind.Conflict)
    };
  }

  public async ValueTask<TenantDetails> GetAsync(
      Guid tenantId,
      CancellationToken cancellationToken)
  {
    RequireActor(PlatformPermissions.TenantsRead);
    var state = await store.FindAsync(ToTenantId(tenantId), cancellationToken);
    if (state is null)
    {
      throw TenantNotFound();
    }

    return ToDetails(state.Tenant, state.CatalogEntry);
  }

  private async ValueTask<TenantDetails> StartProvisioningCoreAsync(
      StartTenantProvisioningCommand command,
      CancellationToken cancellationToken)
  {
    var actor = RequireActor(PlatformPermissions.TenantsProvision);
    EnsureIdempotencyKey(command.IdempotencyKey);
    var idempotency = new IdempotencyRequest(
        $"control.tenants.provision:{command.TenantId:D}:{actor.OperatorId}",
        command.IdempotencyKey,
        command.RequestFingerprint);
    var replay = await FindReplayAsync(idempotency, cancellationToken);
    if (replay is not null)
    {
      return replay;
    }

    var tenantId = ToTenantId(command.TenantId);
    var state = await store.FindAsync(tenantId, cancellationToken);
    if (state is null)
    {
      throw TenantNotFound();
    }

    EnsureExpectedVersion(state.Tenant, command.ExpectedVersion);

    var stamp = await stampSelector.SelectAsync(state.Tenant, cancellationToken);
    if (stamp is null)
    {
      throw new ApplicationFailureException(
          "PLAT-STAMP-NOT-CONFIGURED",
          "No server-side deployment stamp selector is configured.",
          ApplicationErrorKind.Unavailable);
    }

    var tenant = Tenant.FromSnapshot(state.Tenant);
    var catalogEntry = TenantCatalogEntry.FromSnapshot(state.CatalogEntry);
    var now = timeProvider.GetUtcNow();
    var operationId = Guid.CreateVersion7().ToString("D");
    tenant.StartProvisioning(stamp, operationId, command.Reason, now);
    catalogEntry.SynchronizeOperationalState(tenant, now);
    var audit = CreateAudit(
        actor,
        tenant,
        PlatformPermissions.TenantsProvision,
        "TenantProvisioningRequested",
        command.Reason,
        operationId,
        StateOf(state.Tenant),
        StateOf(tenant),
        now);

    var details = ToDetails(tenant.ToSnapshot(), catalogEntry.ToSnapshot());
    return await CommitUpdateAsync(
        tenant,
        catalogEntry,
        command.ExpectedVersion,
        audit,
        idempotency,
        details,
        cancellationToken);
  }

  private async ValueTask<TenantDetails> SuspendCoreAsync(
      SuspendTenantCommand command,
      CancellationToken cancellationToken)
  {
    var actor = RequireActor(PlatformPermissions.TenantsSuspend);
    EnsureIdempotencyKey(command.IdempotencyKey);
    var idempotency = new IdempotencyRequest(
        $"control.tenants.suspend:{command.TenantId:D}:{actor.OperatorId}",
        command.IdempotencyKey,
        command.RequestFingerprint);
    var replay = await FindReplayAsync(idempotency, cancellationToken);
    if (replay is not null)
    {
      return replay;
    }

    var tenantId = ToTenantId(command.TenantId);
    var state = await store.FindAsync(tenantId, cancellationToken);
    if (state is null)
    {
      throw TenantNotFound();
    }

    EnsureExpectedVersion(state.Tenant, command.ExpectedVersion);

    var tenant = Tenant.FromSnapshot(state.Tenant);
    var catalogEntry = TenantCatalogEntry.FromSnapshot(state.CatalogEntry);
    var now = timeProvider.GetUtcNow();
    tenant.Suspend(command.Reason, now);
    catalogEntry.SynchronizeOperationalState(tenant, now);
    var operationId = Guid.CreateVersion7().ToString("D");
    var audit = CreateAudit(
        actor,
        tenant,
        PlatformPermissions.TenantsSuspend,
        "TenantSuspended",
        command.Reason,
        operationId,
        StateOf(state.Tenant),
        StateOf(tenant),
        now);

    var details = ToDetails(tenant.ToSnapshot(), catalogEntry.ToSnapshot());
    return await CommitUpdateAsync(
        tenant,
        catalogEntry,
        command.ExpectedVersion,
        audit,
        idempotency,
        details,
        cancellationToken);
  }

  private async ValueTask<TenantDetails> CommitUpdateAsync(
      Tenant tenant,
      TenantCatalogEntry catalogEntry,
      long expectedVersion,
      PlatformAuditRecord audit,
      IdempotencyRequest idempotency,
      TenantDetails details,
      CancellationToken cancellationToken)
  {
    var result = await store.UpdateAsync(
        tenant,
        catalogEntry,
        expectedVersion,
        audit,
        DequeueEvents(tenant, catalogEntry),
        idempotency,
        details,
        cancellationToken);

    if (result.Outcome == StoreUpdateOutcome.NotFound)
    {
      throw TenantNotFound();
    }

    if (result.Outcome == StoreUpdateOutcome.ConcurrencyConflict)
    {
      throw new ApplicationFailureException(
          "PLAT-CONCURRENCY-CONFLICT",
          "The tenant changed after it was loaded.",
          ApplicationErrorKind.Conflict,
          result.CurrentVersion);
    }

    if (result.Outcome == StoreUpdateOutcome.IdempotencyConflict)
    {
      throw IdempotencyConflict();
    }

    return result.Details!;
  }

  private PlatformActor RequireActor(string permission)
  {
    var actor = actorContext.Current;
    if (actor is null)
    {
      throw new ApplicationFailureException(
          "SEC-AUTHENTICATION-REQUIRED",
          "A platform identity is required.",
          ApplicationErrorKind.Unauthorized);
    }

    actor.Require(permission);
    return actor;
  }

  private static void EnsureIdempotencyKey(string key)
  {
    if (string.IsNullOrWhiteSpace(key))
    {
      throw new ApplicationFailureException(
          "API-IDEMPOTENCY-KEY-REQUIRED",
          "Idempotency-Key is required.",
          ApplicationErrorKind.Validation);
    }
  }

  private static void EnsureExpectedVersion(TenantSnapshot tenant, long expectedVersion)
  {
    if (tenant.Version != expectedVersion)
    {
      throw new ApplicationFailureException(
          "PLAT-CONCURRENCY-CONFLICT",
          "The tenant changed after it was loaded.",
          ApplicationErrorKind.Conflict,
          tenant.Version);
    }
  }

  private async ValueTask<TenantDetails?> FindReplayAsync(
      IdempotencyRequest idempotency,
      CancellationToken cancellationToken)
  {
    var lookup = await store.FindIdempotentResultAsync(idempotency, cancellationToken);
    return lookup.Outcome switch
    {
      IdempotencyLookupOutcome.NotFound => null,
      IdempotencyLookupOutcome.Replayed => lookup.Details!,
      _ => throw IdempotencyConflict()
    };
  }

  private static IReadOnlyCollection<IDomainEvent> DequeueEvents(
      Tenant tenant,
      TenantCatalogEntry catalogEntry) => tenant.DequeueDomainEvents()
        .Concat(catalogEntry.DequeueDomainEvents())
        .ToArray();

  private static TenantId ToTenantId(Guid value)
  {
    if (value == Guid.Empty)
    {
      throw new ApplicationFailureException(
          "PLAT-TENANT-ID-INVALID",
          "The tenant identifier is invalid.",
          ApplicationErrorKind.Validation);
    }

    return new TenantId(value);
  }

  private static ApplicationFailureException IdempotencyConflict() => new(
      "API-IDEMPOTENCY-CONFLICT",
      "The idempotency key was already used with a different request.",
      ApplicationErrorKind.Conflict);

  private static async ValueTask<TenantDetails> TranslateDomainFailuresAsync(
      Func<ValueTask<TenantDetails>> operation)
  {
    try
    {
      return await operation();
    }
    catch (DomainRuleException exception)
    {
      throw new ApplicationFailureException(
          exception.Code,
          exception.Message,
          exception.Kind == DomainErrorKind.Validation
              ? ApplicationErrorKind.Validation
              : ApplicationErrorKind.Conflict);
    }
  }

  private PlatformAuditRecord CreateAudit(
      PlatformActor actor,
      Tenant tenant,
      string permission,
      string action,
      string reason,
      string operationId,
      string? before,
      string after,
      DateTimeOffset now) => new(
          Guid.CreateVersion7(),
          actor.OperatorId,
          tenant.Id,
          tenant.DeploymentStamp?.Id,
          permission,
          action,
          reason,
          null,
          null,
          correlationContext.CorrelationId,
          operationId,
          now,
          before,
          after,
          "Succeeded");

  private static string StateOf(Tenant tenant) => StateOf(tenant.ToSnapshot());

  private static string StateOf(TenantSnapshot snapshot) =>
      $"Status={snapshot.Status};Version={snapshot.Version}";

  private static TenantDetails ToDetails(
      TenantSnapshot tenant,
      TenantCatalogEntrySnapshot catalog) => new(
          tenant.Id.ToString(),
          tenant.Code.Value,
          tenant.Name,
          tenant.Region,
          tenant.Status.ToString(),
          catalog.DeploymentStamp?.Id,
          catalog.SchemaVersion,
          catalog.ConfigurationVersion,
          catalog.IdentityMode.Value,
          catalog.DatabaseReference is not null,
          catalog.StorageReference is not null,
          tenant.CreatedAt,
          tenant.UpdatedAt,
          tenant.Version);

  private static ApplicationFailureException TenantNotFound() => new(
      "PLAT-TENANT-NOT-FOUND",
      "The tenant was not found.",
      ApplicationErrorKind.NotFound);
}
