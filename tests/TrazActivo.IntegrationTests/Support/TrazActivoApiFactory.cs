using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Security.Claims;
using System.Text.Encodings.Web;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.AspNetCore.TestHost;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.DependencyInjection.Extensions;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using TrazActivo.Api.Security;
using TrazActivo.ControlPlane.Application.Abstractions;
using TrazActivo.ControlPlane.Application.Security;
using TrazActivo.ControlPlane.Domain.Tenants;

namespace TrazActivo.IntegrationTests.Support;

internal sealed class TrazActivoApiFactory(
    bool authenticated = true,
    bool authorized = true,
    bool configureStamp = true,
    IDeploymentStampSelector? stampSelector = null) : WebApplicationFactory<Program>
{
  protected override void ConfigureWebHost(IWebHostBuilder builder)
  {
    builder.UseEnvironment("Testing");
    builder.ConfigureTestServices(services =>
    {
      if (configureStamp || stampSelector is not null)
      {
        services.RemoveAll<IDeploymentStampSelector>();
        services.AddSingleton(stampSelector ?? new TestDeploymentStampSelector());
      }

      if (authenticated)
      {
        services.AddSingleton(new TestIdentityConfiguration(authorized));
        services.AddAuthentication(options =>
                {
                  options.DefaultAuthenticateScheme = TestAuthenticationHandler.SchemeName;
                  options.DefaultChallengeScheme = TestAuthenticationHandler.SchemeName;
                })
                .AddScheme<AuthenticationSchemeOptions, TestAuthenticationHandler>(
                    TestAuthenticationHandler.SchemeName,
                    _ => { });
      }
    });
  }
}

internal sealed class TestDeploymentStampSelector : IDeploymentStampSelector
{
  public ValueTask<DeploymentStampReference?> SelectAsync(
      TenantSnapshot tenant,
      CancellationToken cancellationToken)
  {
    cancellationToken.ThrowIfCancellationRequested();
    return ValueTask.FromResult<DeploymentStampReference?>(
        DeploymentStampReference.Create("stamp-test", tenant.Region));
  }
}

internal sealed class FailOnceDeploymentStampSelector : IDeploymentStampSelector
{
  private int _attempt;

  public ValueTask<DeploymentStampReference?> SelectAsync(
      TenantSnapshot tenant,
      CancellationToken cancellationToken)
  {
    cancellationToken.ThrowIfCancellationRequested();
    if (Interlocked.Increment(ref _attempt) == 1)
    {
      throw new InvalidOperationException("Injected pre-commit failure.");
    }

    return ValueTask.FromResult<DeploymentStampReference?>(
        DeploymentStampReference.Create("stamp-test", tenant.Region));
  }
}

internal sealed class CancelOnceDeploymentStampSelector : IDeploymentStampSelector
{
  private readonly TaskCompletionSource _firstCallEntered =
      new(TaskCreationOptions.RunContinuationsAsynchronously);
  private int _attempt;

  public Task WaitForFirstCallAsync() => _firstCallEntered.Task;

  public async ValueTask<DeploymentStampReference?> SelectAsync(
      TenantSnapshot tenant,
      CancellationToken cancellationToken)
  {
    if (Interlocked.Increment(ref _attempt) == 1)
    {
      _firstCallEntered.TrySetResult();
      await Task.Delay(Timeout.InfiniteTimeSpan, cancellationToken);
    }

    cancellationToken.ThrowIfCancellationRequested();
    return DeploymentStampReference.Create("stamp-test", tenant.Region);
  }
}

internal sealed class CoordinatedDeploymentStampSelector(int expectedCalls) : IDeploymentStampSelector
{
  private readonly TaskCompletionSource _allCallsEntered =
      new(TaskCreationOptions.RunContinuationsAsynchronously);
  private readonly TaskCompletionSource _release =
      new(TaskCreationOptions.RunContinuationsAsynchronously);
  private int _calls;

  public Task WaitForAllCallsAsync() => _allCallsEntered.Task;

  public void Release() => _release.TrySetResult();

  public async ValueTask<DeploymentStampReference?> SelectAsync(
      TenantSnapshot tenant,
      CancellationToken cancellationToken)
  {
    if (Interlocked.Increment(ref _calls) >= expectedCalls)
    {
      _allCallsEntered.TrySetResult();
    }

    await _release.Task.WaitAsync(cancellationToken);
    return DeploymentStampReference.Create("stamp-test", tenant.Region);
  }
}

internal sealed class TestAuthenticationHandler(
    IOptionsMonitor<AuthenticationSchemeOptions> options,
    ILoggerFactory logger,
    UrlEncoder encoder,
    TestIdentityConfiguration configuration) : AuthenticationHandler<AuthenticationSchemeOptions>(options, logger, encoder)
{
  public const string SchemeName = "TrazActivo.IntegrationTests";

  protected override Task<AuthenticateResult> HandleAuthenticateAsync()
  {
    var claims = new List<Claim>
        {
            new("sub", "integration-operator")
        };
    if (configuration.IncludePermissions)
    {
      claims.AddRange(new[]
      {
        PlatformPermissions.TenantsCreate,
        PlatformPermissions.TenantsRead,
        PlatformPermissions.TenantsProvision,
        PlatformPermissions.TenantsSuspend
      }.Select(permission => new Claim(PlatformClaimTypes.Permission, permission)));
    }
    var identity = new ClaimsIdentity(claims, SchemeName);
    var ticket = new AuthenticationTicket(new ClaimsPrincipal(identity), SchemeName);
    return Task.FromResult(AuthenticateResult.Success(ticket));
  }
}

internal sealed record TestIdentityConfiguration(bool IncludePermissions);

internal static class HttpRequestFactory
{
  public static HttpRequestMessage PostAsJson<T>(string path, T body, string idempotencyKey, string? etag = null)
  {
    var request = new HttpRequestMessage(HttpMethod.Post, path)
    {
      Content = JsonContent.Create(body)
    };
    request.Headers.Add("Idempotency-Key", idempotencyKey);
    if (etag is not null)
    {
      request.Headers.IfMatch.Add(new EntityTagHeaderValue(etag));
    }

    return request;
  }
}
