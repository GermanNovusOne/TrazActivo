using System.Net;
using System.Net.Http.Json;
using Microsoft.Extensions.DependencyInjection;
using TrazActivo.Api.Contracts;
using TrazActivo.ControlPlane.Application.Abstractions;
using TrazActivo.IntegrationTests.Support;

namespace TrazActivo.IntegrationTests;

public sealed class AtomicityAndConcurrencyTests
{
  [Fact]
  public async Task Failure_leaves_no_partial_state_and_same_key_can_retry_then_replay()
  {
    var selector = new FailOnceDeploymentStampSelector();
    await using var factory = new TrazActivoApiFactory(stampSelector: selector);
    using var client = factory.CreateClient();
    var created = await CreateTenantAsync(client, "failure-create");

    using var failedRequest = ProvisionRequest(created.TenantId, "failure-provision", "Approved request.");
    var failedResponse = await client.SendAsync(failedRequest);
    Assert.Equal(HttpStatusCode.InternalServerError, failedResponse.StatusCode);
    await AssertUnchangedAfterCreateAsync(factory, client, created.TenantId);

    using var retryRequest = ProvisionRequest(created.TenantId, "failure-provision", "Approved request.");
    var retryResponse = await client.SendAsync(retryRequest);
    var retry = await retryResponse.Content.ReadFromJsonAsync<TenantResponse>();
    using var replayRequest = ProvisionRequest(created.TenantId, "failure-provision", "Approved request.");
    var replayResponse = await client.SendAsync(replayRequest);
    var replay = await replayResponse.Content.ReadFromJsonAsync<TenantResponse>();

    Assert.Equal(HttpStatusCode.Accepted, retryResponse.StatusCode);
    Assert.Equal(HttpStatusCode.Accepted, replayResponse.StatusCode);
    Assert.Equal(2, retry!.Version);
    Assert.Equal(retry, replay);
    await AssertSingleLogicalProvisionAsync(factory);
  }

  [Fact]
  public async Task Cancellation_leaves_no_partial_state_or_idempotency_result()
  {
    var selector = new CancelOnceDeploymentStampSelector();
    await using var factory = new TrazActivoApiFactory(stampSelector: selector);
    using var client = factory.CreateClient();
    var created = await CreateTenantAsync(client, "cancel-create");
    using var cancellation = new CancellationTokenSource();
    using var canceledRequest = ProvisionRequest(created.TenantId, "cancel-provision", "Approved request.");

    var send = client.SendAsync(canceledRequest, cancellation.Token);
    await selector.WaitForFirstCallAsync().WaitAsync(TimeSpan.FromSeconds(5));
    cancellation.Cancel();
    await Assert.ThrowsAnyAsync<OperationCanceledException>(() => send);
    await AssertUnchangedAfterCreateAsync(factory, client, created.TenantId);

    using var retryRequest = ProvisionRequest(created.TenantId, "cancel-provision", "Approved request.");
    var retryResponse = await client.SendAsync(retryRequest);

    Assert.Equal(HttpStatusCode.Accepted, retryResponse.StatusCode);
    await AssertSingleLogicalProvisionAsync(factory);
  }

  [Fact]
  public async Task Concurrent_same_version_allows_one_winner_and_one_conflict()
  {
    var selector = new CoordinatedDeploymentStampSelector(expectedCalls: 2);
    await using var factory = new TrazActivoApiFactory(stampSelector: selector);
    using var client = factory.CreateClient();
    var created = await CreateTenantAsync(client, "concurrency-create");
    using var first = ProvisionRequest(created.TenantId, "concurrency-first", "First approved request.");
    using var second = ProvisionRequest(created.TenantId, "concurrency-second", "Second approved request.");

    var firstSend = client.SendAsync(first);
    var secondSend = client.SendAsync(second);
    await selector.WaitForAllCallsAsync().WaitAsync(TimeSpan.FromSeconds(5));
    selector.Release();
    var responses = await Task.WhenAll(firstSend, secondSend);

    Assert.Single(responses, response => response.StatusCode == HttpStatusCode.Accepted);
    var conflict = Assert.Single(responses, response => response.StatusCode == HttpStatusCode.Conflict);
    var problem = await conflict.Content.ReadFromJsonAsync<System.Text.Json.JsonElement>();
    Assert.Equal("PLAT-CONCURRENCY-CONFLICT", problem.GetProperty("code").GetString());
    Assert.Equal(2, problem.GetProperty("currentVersion").GetInt64());
    await AssertSingleLogicalProvisionAsync(factory);
  }

  [Fact]
  public async Task Concurrent_same_idempotency_key_executes_once_and_replays_coherently()
  {
    var selector = new CoordinatedDeploymentStampSelector(expectedCalls: 2);
    await using var factory = new TrazActivoApiFactory(stampSelector: selector);
    using var client = factory.CreateClient();
    var created = await CreateTenantAsync(client, "idem-concurrency-create");
    using var first = ProvisionRequest(created.TenantId, "idem-concurrency", "Approved request.");
    using var second = ProvisionRequest(created.TenantId, "idem-concurrency", "Approved request.");

    var firstSend = client.SendAsync(first);
    var secondSend = client.SendAsync(second);
    await selector.WaitForAllCallsAsync().WaitAsync(TimeSpan.FromSeconds(5));
    selector.Release();
    var responses = await Task.WhenAll(firstSend, secondSend);
    var firstBody = await responses[0].Content.ReadFromJsonAsync<TenantResponse>();
    var secondBody = await responses[1].Content.ReadFromJsonAsync<TenantResponse>();

    Assert.All(responses, response => Assert.Equal(HttpStatusCode.Accepted, response.StatusCode));
    Assert.Equal(firstBody, secondBody);
    Assert.Equal(2, firstBody!.Version);
    await AssertSingleLogicalProvisionAsync(factory);
  }

  private static async Task AssertUnchangedAfterCreateAsync(
      TrazActivoApiFactory factory,
      HttpClient client,
      string tenantId)
  {
    var tenant = await client.GetFromJsonAsync<TenantResponse>($"/control/v1/tenants/{tenantId}");
    Assert.Equal("Requested", tenant!.Status);
    Assert.Equal(1, tenant.Version);
    var audits = await factory.Services.GetRequiredService<IPlatformAuditReader>()
        .ReadAllAsync(CancellationToken.None);
    var events = await factory.Services.GetRequiredService<IDomainEventReader>()
        .ReadAllAsync(CancellationToken.None);
    Assert.Single(audits);
    Assert.Single(events);
    Assert.Equal("TenantCatalogEntryCreated", events[0].EventName);
  }

  private static async Task AssertSingleLogicalProvisionAsync(TrazActivoApiFactory factory)
  {
    var audits = await factory.Services.GetRequiredService<IPlatformAuditReader>()
        .ReadAllAsync(CancellationToken.None);
    var events = await factory.Services.GetRequiredService<IDomainEventReader>()
        .ReadAllAsync(CancellationToken.None);
    Assert.Equal(2, audits.Count);
    Assert.Equal(4, events.Count);
    Assert.Single(audits, audit => audit.Action == "TenantProvisioningRequested");
    Assert.Single(events, domainEvent => domainEvent.EventName == "TenantProvisioningRequested");
  }

  private static async Task<TenantResponse> CreateTenantAsync(HttpClient client, string key)
  {
    using var request = HttpRequestFactory.PostAsJson(
        "/control/v1/tenants",
        new CreateTenantRequest("ATOMIC", "Atomic Tenant", "cl-test", "ExternalId"),
        key);
    var response = await client.SendAsync(request);
    response.EnsureSuccessStatusCode();
    return (await response.Content.ReadFromJsonAsync<TenantResponse>())!;
  }

  private static HttpRequestMessage ProvisionRequest(string tenantId, string key, string reason) =>
      HttpRequestFactory.PostAsJson(
          $"/control/v1/tenants/{tenantId}/provision",
          new LifecycleReasonRequest(reason),
          key,
          "\"1\"");
}
