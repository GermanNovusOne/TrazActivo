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

namespace TrazActivo.MultiTenancyTests.Support;

internal sealed class MultiTenantApiFactory : WebApplicationFactory<Program>
{
  protected override void ConfigureWebHost(IWebHostBuilder builder)
  {
    builder.UseEnvironment("Testing");
    builder.ConfigureTestServices(services =>
    {
      services.RemoveAll<IDeploymentStampSelector>();
      services.AddSingleton<IDeploymentStampSelector, ServerControlledStampSelector>();
      services.AddAuthentication(options =>
              {
                options.DefaultAuthenticateScheme = MultiTenantAuthenticationHandler.SchemeName;
                options.DefaultChallengeScheme = MultiTenantAuthenticationHandler.SchemeName;
              })
              .AddScheme<AuthenticationSchemeOptions, MultiTenantAuthenticationHandler>(
                  MultiTenantAuthenticationHandler.SchemeName,
                  _ => { });
    });
  }
}

internal sealed class ServerControlledStampSelector : IDeploymentStampSelector
{
  public ValueTask<DeploymentStampReference?> SelectAsync(
      TenantSnapshot tenant,
      CancellationToken cancellationToken)
  {
    cancellationToken.ThrowIfCancellationRequested();
    return ValueTask.FromResult<DeploymentStampReference?>(
        DeploymentStampReference.Create("server-stamp", tenant.Region));
  }
}

internal sealed class MultiTenantAuthenticationHandler(
    IOptionsMonitor<AuthenticationSchemeOptions> options,
    ILoggerFactory logger,
    UrlEncoder encoder) : AuthenticationHandler<AuthenticationSchemeOptions>(options, logger, encoder)
{
  public const string SchemeName = "TrazActivo.MultiTenancyTests";

  protected override Task<AuthenticateResult> HandleAuthenticateAsync()
  {
    var claims = new List<Claim> { new("sub", "platform-support-operator") };
    claims.AddRange(new[]
    {
            PlatformPermissions.TenantsCreate,
            PlatformPermissions.TenantsRead,
            PlatformPermissions.TenantsProvision,
            PlatformPermissions.TenantsSuspend
        }.Select(permission => new Claim(PlatformClaimTypes.Permission, permission)));
    var identity = new ClaimsIdentity(claims, SchemeName);
    return Task.FromResult(AuthenticateResult.Success(
        new AuthenticationTicket(new ClaimsPrincipal(identity), SchemeName)));
  }
}
