using System.Net;
using System.Net.Http.Json;
using Microsoft.Extensions.DependencyInjection;
using TrazActivo.Api.Contracts;
using TrazActivo.ControlPlane.Application.Abstractions;
using TrazActivo.ControlPlane.Application.Security;
using TrazActivo.ControlPlane.Domain.Tenants;
using TrazActivo.MultiTenancyTests.Support;
using TrazActivo.Tenancy.Abstractions;

namespace TrazActivo.MultiTenancyTests;

public sealed class ApplicableSprint1Tests
{
  [Fact]
  [Trait("MultiTenancyCase", "MT-002-PARTIAL-Sprint1")]
  public async Task Mt002_partial_sprint1_frontend_values_do_not_control_control_plane_catalog_creation()
  {
    await using var factory = new MultiTenantApiFactory();
    using var client = factory.CreateClient();
    var attackerTenantId = Guid.Parse("0198b8ad-135c-7000-8000-00000000bad0");
    using var request = new HttpRequestMessage(HttpMethod.Post, "/control/v1/tenants")
    {
      Content = JsonContent.Create(new
      {
        tenantId = attackerTenantId,
        code = "ISOLATED",
        name = "Isolation Test",
        region = "cl-test",
        identityMode = "ExternalId",
        deploymentStampId = "attacker-stamp",
        databaseReference = "attacker-database",
        storageReference = "attacker-storage"
      })
    };
    request.Headers.Add("Idempotency-Key", "mt-002-create");
    request.Headers.Add("X-Tenant-Id", attackerTenantId.ToString());

    var response = await client.SendAsync(request);
    var tenant = await response.Content.ReadFromJsonAsync<TenantResponse>();

    Assert.Equal(HttpStatusCode.Created, response.StatusCode);
    Assert.NotNull(tenant);
    Assert.NotEqual(attackerTenantId, Guid.Parse(tenant.TenantId));
    Assert.Null(tenant.DeploymentStampId);
    Assert.False(tenant.HasDatabaseReference);
    Assert.False(tenant.HasStorageReference);

    var catalogReader = factory.Services.GetRequiredService<ITenantCatalogReader>();
    var catalog = await catalogReader.FindCatalogEntryAsync(
        new TenantId(Guid.Parse(tenant.TenantId)),
        CancellationToken.None);
    Assert.NotNull(catalog);
    Assert.Null(catalog.DatabaseReference);
    Assert.Null(catalog.StorageReference);
    Assert.Null(catalog.DeploymentStamp);
  }

  [Fact]
  [Trait("MultiTenancyCase", "MT-008-partial")]
  public void Mt008_suspended_tenant_is_ineligible_for_context_creation()
  {
    var tenant = new ResolvedTenant(
        Guid.Parse("0198b8ad-135c-7000-8000-000000000008"),
        TenantAvailability.Suspended,
        "server-stamp",
        "database-reference",
        "storage-reference",
        "cl-test",
        1,
        1,
        "ExternalId");

    var result = TenantResolutionResult.Evaluate(tenant);

    Assert.False(result.IsResolved);
    Assert.Null(result.Tenant);
    Assert.Equal("TEN-SUSPENDED", result.ErrorCode);
  }

  [Fact]
  [Trait("MultiTenancyCase", "MT-015")]
  public async Task Mt015_platform_operations_record_target_tenant_permission_and_correlation()
  {
    await using var factory = new MultiTenantApiFactory();
    using var client = factory.CreateClient();
    using var create = new HttpRequestMessage(HttpMethod.Post, "/control/v1/tenants")
    {
      Content = JsonContent.Create(new CreateTenantRequest(
            "AUDITED",
            "Audited Tenant",
            "cl-test",
            "ExternalId"))
    };
    create.Headers.Add("Idempotency-Key", "mt-015-create");
    create.Headers.Add("X-Correlation-ID", "mt-015-create-correlation");
    var createResponse = await client.SendAsync(create);
    var tenant = (await createResponse.Content.ReadFromJsonAsync<TenantResponse>())!;

    using var provision = new HttpRequestMessage(
        HttpMethod.Post,
        $"/control/v1/tenants/{tenant.TenantId}/provision")
    {
      Content = JsonContent.Create(new LifecycleReasonRequest("Support ticket SUP-1500."))
    };
    provision.Headers.Add("Idempotency-Key", "mt-015-provision");
    provision.Headers.Add("If-Match", "\"1\"");
    provision.Headers.Add("X-Correlation-ID", "mt-015-provision-correlation");
    var provisionResponse = await client.SendAsync(provision);
    Assert.Equal(HttpStatusCode.Accepted, provisionResponse.StatusCode);

    var auditReader = factory.Services.GetRequiredService<IPlatformAuditReader>();
    var audits = await auditReader.ReadAllAsync(CancellationToken.None);
    var targetTenantId = new TenantId(Guid.Parse(tenant.TenantId));

    Assert.Collection(
        audits,
        created =>
        {
          Assert.Equal(targetTenantId, created.TargetTenantId);
          Assert.Equal(PlatformPermissions.TenantsCreate, created.Permission);
          Assert.Equal("mt-015-create-correlation", created.CorrelationId);
        },
        provisioning =>
        {
          Assert.Equal(targetTenantId, provisioning.TargetTenantId);
          Assert.Equal(PlatformPermissions.TenantsProvision, provisioning.Permission);
          Assert.Equal("mt-015-provision-correlation", provisioning.CorrelationId);
          Assert.Equal("Support ticket SUP-1500.", provisioning.Reason);
        });
  }
}
