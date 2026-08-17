using System.Text.Encodings.Web;
using Microsoft.AspNetCore.Authentication;
using Microsoft.Extensions.Options;

namespace TrazActivo.Api.Security;

public sealed class DenyByDefaultAuthenticationHandler(
    IOptionsMonitor<AuthenticationSchemeOptions> options,
    ILoggerFactory logger,
    UrlEncoder encoder) : AuthenticationHandler<AuthenticationSchemeOptions>(options, logger, encoder)
{
  public const string SchemeName = "TrazActivo.ProductIdentity";

  protected override Task<AuthenticateResult> HandleAuthenticateAsync() =>
      Task.FromResult(AuthenticateResult.NoResult());
}
