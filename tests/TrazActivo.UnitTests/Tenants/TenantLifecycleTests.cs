using TrazActivo.ControlPlane.Domain.Common;
using TrazActivo.ControlPlane.Domain.Tenants;

namespace TrazActivo.UnitTests.Tenants;

public sealed class TenantLifecycleTests
{
  private static readonly DateTimeOffset Now = new(2026, 8, 17, 12, 0, 0, TimeSpan.Zero);
  private const string Reason = "Approved lifecycle transition.";

  public static TheoryData<TenantLifecycleStatus, TenantLifecycleStatus, string?> AllowedTransitions => new()
  {
    { TenantLifecycleStatus.Requested, TenantLifecycleStatus.Provisioning, "TenantProvisioningRequested" },
    { TenantLifecycleStatus.ProvisioningFailed, TenantLifecycleStatus.Provisioning, "TenantProvisioningRequested" },
    { TenantLifecycleStatus.Provisioning, TenantLifecycleStatus.Configuring, null },
    { TenantLifecycleStatus.Configuring, TenantLifecycleStatus.Validation, null },
    { TenantLifecycleStatus.Provisioning, TenantLifecycleStatus.ProvisioningFailed, "TenantProvisioningFailed" },
    { TenantLifecycleStatus.Configuring, TenantLifecycleStatus.ProvisioningFailed, "TenantProvisioningFailed" },
    { TenantLifecycleStatus.Validation, TenantLifecycleStatus.ProvisioningFailed, "TenantProvisioningFailed" },
    { TenantLifecycleStatus.Validation, TenantLifecycleStatus.Active, "TenantActivated" },
    { TenantLifecycleStatus.Active, TenantLifecycleStatus.Suspended, "TenantSuspended" },
    { TenantLifecycleStatus.Suspended, TenantLifecycleStatus.Active, "TenantActivated" },
    { TenantLifecycleStatus.Active, TenantLifecycleStatus.Terminating, null },
    { TenantLifecycleStatus.Suspended, TenantLifecycleStatus.Terminating, null },
    { TenantLifecycleStatus.Terminating, TenantLifecycleStatus.Retention, null },
    { TenantLifecycleStatus.Retention, TenantLifecycleStatus.Deleted, null }
  };

  public static IEnumerable<object[]> ProhibitedTransitions()
  {
    var allowed = AllowedTransitions
        .Select(row => (From: (TenantLifecycleStatus)row[0], To: (TenantLifecycleStatus)row[1]))
        .ToHashSet();
    var operationTargets = AllowedTransitions
        .Select(row => (TenantLifecycleStatus)row[1])
        .Distinct();

    foreach (var from in Enum.GetValues<TenantLifecycleStatus>())
    {
      foreach (var to in operationTargets)
      {
        if (!allowed.Contains((from, to)))
        {
          yield return [from, to];
        }
      }
    }
  }

  [Fact]
  public void Requested_tenant_contains_identity_without_operational_resources()
  {
    var tenant = CreateRequestedTenant();

    Assert.Equal(TenantLifecycleStatus.Requested, tenant.Status);
    Assert.Null(tenant.DeploymentStamp);
    Assert.Equal(1, tenant.Version);
  }

  [Theory]
  [MemberData(nameof(AllowedTransitions))]
  public void Allowed_transition_updates_status_version_reason_and_events(
      TenantLifecycleStatus from,
      TenantLifecycleStatus to,
      string? specializedEvent)
  {
    var tenant = CreateInStatus(from);
    var previousVersion = tenant.Version;
    tenant.DequeueDomainEvents();

    ExecuteTransition(tenant, to, Reason);

    Assert.Equal(to, tenant.Status);
    Assert.Equal(previousVersion + 1, tenant.Version);
    var events = tenant.DequeueDomainEvents();
    var lifecycle = Assert.Single(events.OfType<TenantLifecycleChangedDomainEvent>());
    Assert.Equal(from, lifecycle.PreviousStatus);
    Assert.Equal(to, lifecycle.CurrentStatus);
    Assert.Equal(Reason, lifecycle.Reason);
    if (specializedEvent is null)
    {
      Assert.Single(events);
    }
    else
    {
      Assert.Contains(events, item => item.EventName == specializedEvent);
      Assert.Equal(2, events.Count);
    }
  }

  [Theory]
  [MemberData(nameof(ProhibitedTransitions))]
  public void Prohibited_transition_does_not_change_state_or_emit_events(
      TenantLifecycleStatus from,
      TenantLifecycleStatus to)
  {
    var tenant = CreateInStatus(from);
    var previous = tenant.ToSnapshot();
    tenant.DequeueDomainEvents();

    var exception = Assert.Throws<DomainRuleException>(() => ExecuteTransition(tenant, to, Reason));

    Assert.Equal("PLAT-TENANT-STATE-CONFLICT", exception.Code);
    Assert.Equal(previous, tenant.ToSnapshot());
    Assert.Empty(tenant.DequeueDomainEvents());
  }

  [Fact]
  public void Lifecycle_transition_requires_reason_without_changing_state()
  {
    var tenant = CreateRequestedTenant();
    var previous = tenant.ToSnapshot();

    var exception = Assert.Throws<DomainRuleException>(() => ExecuteTransition(
        tenant,
        TenantLifecycleStatus.Provisioning,
        string.Empty));

    Assert.Equal("PLAT-TENANT-REASON-REQUIRED", exception.Code);
    Assert.Equal(previous, tenant.ToSnapshot());
    Assert.Empty(tenant.DequeueDomainEvents());
  }

  private static Tenant CreateInStatus(TenantLifecycleStatus status)
  {
    var tenant = CreateRequestedTenant();
    if (status == TenantLifecycleStatus.Requested)
    {
      return tenant;
    }

    ExecuteTransition(tenant, TenantLifecycleStatus.Provisioning, "Prepare test state.");
    if (status == TenantLifecycleStatus.Provisioning)
    {
      return tenant;
    }

    if (status == TenantLifecycleStatus.ProvisioningFailed)
    {
      ExecuteTransition(tenant, TenantLifecycleStatus.ProvisioningFailed, "Prepare test state.");
      return tenant;
    }

    ExecuteTransition(tenant, TenantLifecycleStatus.Configuring, "Prepare test state.");
    if (status == TenantLifecycleStatus.Configuring)
    {
      return tenant;
    }

    ExecuteTransition(tenant, TenantLifecycleStatus.Validation, "Prepare test state.");
    if (status == TenantLifecycleStatus.Validation)
    {
      return tenant;
    }

    ExecuteTransition(tenant, TenantLifecycleStatus.Active, "Prepare test state.");
    if (status == TenantLifecycleStatus.Active)
    {
      return tenant;
    }

    if (status == TenantLifecycleStatus.Suspended)
    {
      ExecuteTransition(tenant, TenantLifecycleStatus.Suspended, "Prepare test state.");
      return tenant;
    }

    ExecuteTransition(tenant, TenantLifecycleStatus.Terminating, "Prepare test state.");
    if (status == TenantLifecycleStatus.Terminating)
    {
      return tenant;
    }

    ExecuteTransition(tenant, TenantLifecycleStatus.Retention, "Prepare test state.");
    if (status == TenantLifecycleStatus.Retention)
    {
      return tenant;
    }

    ExecuteTransition(tenant, TenantLifecycleStatus.Deleted, "Prepare test state.");
    return tenant;
  }

  private static void ExecuteTransition(Tenant tenant, TenantLifecycleStatus target, string reason)
  {
    switch (target)
    {
      case TenantLifecycleStatus.Provisioning:
        tenant.StartProvisioning(
            DeploymentStampReference.Create("stamp-test", "cl-test"),
            "operation-test",
            reason,
            Now.AddMinutes(1));
        break;
      case TenantLifecycleStatus.Configuring:
        tenant.MarkConfiguring(reason, Now.AddMinutes(2));
        break;
      case TenantLifecycleStatus.Validation:
        tenant.MarkValidation(reason, Now.AddMinutes(3));
        break;
      case TenantLifecycleStatus.ProvisioningFailed:
        tenant.FailProvisioning("operation-test", reason, Now.AddMinutes(4));
        break;
      case TenantLifecycleStatus.Active:
        tenant.Activate(reason, Now.AddMinutes(5));
        break;
      case TenantLifecycleStatus.Suspended:
        tenant.Suspend(reason, Now.AddMinutes(6));
        break;
      case TenantLifecycleStatus.Terminating:
        tenant.BeginTermination(reason, Now.AddMinutes(7));
        break;
      case TenantLifecycleStatus.Retention:
        tenant.MarkRetention(reason, Now.AddMinutes(8));
        break;
      case TenantLifecycleStatus.Deleted:
        tenant.MarkDeleted(reason, Now.AddMinutes(9));
        break;
      default:
        throw new ArgumentOutOfRangeException(nameof(target));
    }
  }

  private static Tenant CreateRequestedTenant() => Tenant.Request(
      new TenantId(Guid.Parse("0198b8ad-135c-7000-8000-000000000001")),
      TenantCode.Create("NOVUS"),
      "Novus One",
      "cl-test",
      Now);
}
