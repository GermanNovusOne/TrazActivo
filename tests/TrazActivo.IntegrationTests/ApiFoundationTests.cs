using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using Microsoft.Extensions.FileProviders;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.DependencyInjection;
using TrazActivo.Api.Contracts;
using TrazActivo.ControlPlane.Application.Abstractions;
using TrazActivo.ControlPlane.Infrastructure;
using TrazActivo.IntegrationTests.Support;

namespace TrazActivo.IntegrationTests;

public sealed class ApiFoundationTests
{
  [Fact]
  public void Production_rejects_sprint_one_in_memory_adapters()
  {
    var services = new ServiceCollection();
    var environment = new StubHostEnvironment { EnvironmentName = Environments.Production };

    var exception = Assert.Throws<InvalidOperationException>(() =>
        services.AddControlPlaneInfrastructure(environment));

    Assert.Contains("restricted to Development and Testing", exception.Message, StringComparison.Ordinal);
  }

  [Fact]
  public async Task Health_and_openapi_are_available_without_authentication()
  {
    await using var factory = new TrazActivoApiFactory(authenticated: false);
    using var client = factory.CreateClient();

    var live = await client.GetAsync("/health/live");
    var ready = await client.GetAsync("/health/ready");
    var openApi = await client.GetAsync("/openapi/v1.json");

    Assert.Equal(HttpStatusCode.OK, live.StatusCode);
    Assert.Equal(HttpStatusCode.OK, ready.StatusCode);
    Assert.Equal(HttpStatusCode.OK, openApi.StatusCode);
  }

  [Fact]
  public async Task Control_plane_is_deny_by_default_and_returns_problem_details()
  {
    await using var factory = new TrazActivoApiFactory(authenticated: false);
    using var client = factory.CreateClient();
    using var request = HttpRequestFactory.PostAsJson(
        "/control/v1/tenants",
        NewTenantRequest(),
        "deny-default-1");

    var response = await client.SendAsync(request);
    var problem = await response.Content.ReadFromJsonAsync<JsonElement>();

    Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    Assert.Equal("SEC-AUTHENTICATION-REQUIRED", problem.GetProperty("code").GetString());
    Assert.True(problem.TryGetProperty("correlationId", out _));
  }

  [Fact]
  public async Task Authenticated_principal_without_permission_is_forbidden()
  {
    await using var factory = new TrazActivoApiFactory(authorized: false);
    using var client = factory.CreateClient();
    using var request = HttpRequestFactory.PostAsJson(
        "/control/v1/tenants",
        NewTenantRequest(),
        "permission-denied-1");

    var response = await client.SendAsync(request);
    var problem = await response.Content.ReadFromJsonAsync<JsonElement>();

    Assert.Equal(HttpStatusCode.Forbidden, response.StatusCode);
    Assert.Equal("SEC-PERMISSION-DENIED", problem.GetProperty("code").GetString());
  }

  [Fact]
  public async Task Create_is_idempotent_and_does_not_expose_resource_references()
  {
    await using var factory = new TrazActivoApiFactory();
    using var client = factory.CreateClient();

    using var firstRequest = HttpRequestFactory.PostAsJson(
        "/control/v1/tenants",
        NewTenantRequest(),
        "create-idempotent-1");
    var firstResponse = await client.SendAsync(firstRequest);
    var first = await firstResponse.Content.ReadFromJsonAsync<TenantResponse>();

    using var secondRequest = HttpRequestFactory.PostAsJson(
        "/control/v1/tenants",
        NewTenantRequest(),
        "create-idempotent-1");
    var secondResponse = await client.SendAsync(secondRequest);
    var second = await secondResponse.Content.ReadFromJsonAsync<TenantResponse>();

    Assert.Equal(HttpStatusCode.Created, firstResponse.StatusCode);
    Assert.Equal(HttpStatusCode.Created, secondResponse.StatusCode);
    Assert.NotNull(first);
    Assert.NotNull(second);
    Assert.Equal(first.TenantId, second.TenantId);
    Assert.Equal("Requested", first.Status);
    Assert.False(first.HasDatabaseReference);
    Assert.False(first.HasStorageReference);
    Assert.Equal("\"1\"", firstResponse.Headers.ETag?.Tag);

    var auditReader = factory.Services.GetRequiredService<IPlatformAuditReader>();
    Assert.Single(await auditReader.ReadAllAsync(CancellationToken.None));
  }

  [Fact]
  public async Task Reusing_idempotency_key_with_different_payload_is_rejected()
  {
    await using var factory = new TrazActivoApiFactory();
    using var client = factory.CreateClient();
    using var firstRequest = HttpRequestFactory.PostAsJson(
        "/control/v1/tenants",
        NewTenantRequest(),
        "create-conflict-1");
    await client.SendAsync(firstRequest);

    using var conflictingRequest = HttpRequestFactory.PostAsJson(
        "/control/v1/tenants",
        NewTenantRequest() with { Name = "Changed" },
        "create-conflict-1");
    var response = await client.SendAsync(conflictingRequest);
    var problem = await response.Content.ReadFromJsonAsync<JsonElement>();

    Assert.Equal(HttpStatusCode.Conflict, response.StatusCode);
    Assert.Equal("API-IDEMPOTENCY-CONFLICT", problem.GetProperty("code").GetString());
    var audits = await factory.Services.GetRequiredService<IPlatformAuditReader>()
        .ReadAllAsync(CancellationToken.None);
    var events = await factory.Services.GetRequiredService<IDomainEventReader>()
        .ReadAllAsync(CancellationToken.None);
    Assert.Single(audits);
    Assert.Single(events);
  }

  [Fact]
  public async Task Provision_records_intent_without_activating_or_creating_resources()
  {
    await using var factory = new TrazActivoApiFactory();
    using var client = factory.CreateClient();
    var created = await CreateTenantAsync(client, "provision-create-1");
    using var provisionRequest = HttpRequestFactory.PostAsJson(
        $"/control/v1/tenants/{created.TenantId}/provision",
        new LifecycleReasonRequest("Provisioning approved for test."),
        "provision-1",
        "\"1\"");

    var response = await client.SendAsync(provisionRequest);
    var provisioned = await response.Content.ReadFromJsonAsync<TenantResponse>();

    Assert.Equal(HttpStatusCode.Accepted, response.StatusCode);
    Assert.NotNull(provisioned);
    Assert.Equal("Provisioning", provisioned.Status);
    Assert.NotEqual("Active", provisioned.Status);
    Assert.Equal("stamp-test", provisioned.DeploymentStampId);
    Assert.False(provisioned.HasDatabaseReference);
    Assert.False(provisioned.HasStorageReference);
    Assert.Equal("\"2\"", response.Headers.ETag?.Tag);
  }

  [Fact]
  public async Task Provision_without_server_side_stamp_selector_is_unavailable()
  {
    await using var factory = new TrazActivoApiFactory(configureStamp: false);
    using var client = factory.CreateClient();
    var created = await CreateTenantAsync(client, "no-stamp-create-1");
    using var provisionRequest = HttpRequestFactory.PostAsJson(
        $"/control/v1/tenants/{created.TenantId}/provision",
        new LifecycleReasonRequest("No implicit stamp decision."),
        "no-stamp-provision-1",
        "\"1\"");

    var response = await client.SendAsync(provisionRequest);
    var problem = await response.Content.ReadFromJsonAsync<JsonElement>();

    Assert.Equal(HttpStatusCode.ServiceUnavailable, response.StatusCode);
    Assert.Equal("PLAT-STAMP-NOT-CONFIGURED", problem.GetProperty("code").GetString());
  }

  [Fact]
  public async Task Stale_etag_returns_conflict_with_current_version()
  {
    await using var factory = new TrazActivoApiFactory();
    using var client = factory.CreateClient();
    var created = await CreateTenantAsync(client, "stale-create-1");
    using var first = HttpRequestFactory.PostAsJson(
        $"/control/v1/tenants/{created.TenantId}/provision",
        new LifecycleReasonRequest("First request."),
        "stale-provision-1",
        "\"1\"");
    await client.SendAsync(first);

    using var stale = HttpRequestFactory.PostAsJson(
        $"/control/v1/tenants/{created.TenantId}/provision",
        new LifecycleReasonRequest("Stale request."),
        "stale-provision-2",
        "\"1\"");
    var response = await client.SendAsync(stale);
    var problem = await response.Content.ReadFromJsonAsync<JsonElement>();

    Assert.Equal(HttpStatusCode.Conflict, response.StatusCode);
    Assert.Equal("PLAT-CONCURRENCY-CONFLICT", problem.GetProperty("code").GetString());
    Assert.Equal(2, problem.GetProperty("currentVersion").GetInt64());
  }

  [Fact]
  public async Task Mutation_without_if_match_returns_precondition_required()
  {
    await using var factory = new TrazActivoApiFactory();
    using var client = factory.CreateClient();
    var created = await CreateTenantAsync(client, "precondition-create-1");
    using var request = HttpRequestFactory.PostAsJson(
        $"/control/v1/tenants/{created.TenantId}/provision",
        new LifecycleReasonRequest("Missing ETag."),
        "precondition-provision-1");

    var response = await client.SendAsync(request);

    Assert.Equal((HttpStatusCode)428, response.StatusCode);
  }

  private static async Task<TenantResponse> CreateTenantAsync(HttpClient client, string key)
  {
    using var request = HttpRequestFactory.PostAsJson("/control/v1/tenants", NewTenantRequest(), key);
    var response = await client.SendAsync(request);
    response.EnsureSuccessStatusCode();
    return (await response.Content.ReadFromJsonAsync<TenantResponse>())!;
  }

  private static CreateTenantRequest NewTenantRequest() => new(
      "NOVUS",
      "Novus One",
      "cl-test",
      "ExternalId");

  private sealed class StubHostEnvironment : IHostEnvironment
  {
    public string EnvironmentName { get; set; } = string.Empty;

    public string ApplicationName { get; set; } = string.Empty;

    public string ContentRootPath { get; set; } = string.Empty;

    public IFileProvider ContentRootFileProvider { get; set; } = new NullFileProvider();
  }
}
