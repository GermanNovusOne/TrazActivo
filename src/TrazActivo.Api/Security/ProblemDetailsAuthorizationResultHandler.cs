using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Authorization.Policy;
using TrazActivo.Api.Observability;

namespace TrazActivo.Api.Security;

internal sealed class ProblemDetailsAuthorizationResultHandler : IAuthorizationMiddlewareResultHandler
{
  private readonly AuthorizationMiddlewareResultHandler _fallback = new();

  public async Task HandleAsync(
      RequestDelegate next,
      HttpContext context,
      AuthorizationPolicy policy,
      PolicyAuthorizationResult authorizeResult)
  {
    if (authorizeResult.Succeeded)
    {
      await next(context);
      return;
    }

    var status = authorizeResult.Challenged
        ? StatusCodes.Status401Unauthorized
        : StatusCodes.Status403Forbidden;
    var code = authorizeResult.Challenged
        ? "SEC-AUTHENTICATION-REQUIRED"
        : "SEC-PERMISSION-DENIED";

    if (!context.Response.HasStarted)
    {
      await Results.Problem(
          statusCode: status,
          title: status == StatusCodes.Status401Unauthorized ? "Unauthorized" : "Forbidden",
          detail: status == StatusCodes.Status401Unauthorized
              ? "A platform identity is required."
              : "The platform identity does not have permission for this operation.",
          instance: context.Request.Path,
          extensions: new Dictionary<string, object?>
          {
            ["code"] = code,
            ["correlationId"] = CorrelationIdMiddleware.Get(context)
          }).ExecuteAsync(context);
      return;
    }

    await _fallback.HandleAsync(next, context, policy, authorizeResult);
  }
}
