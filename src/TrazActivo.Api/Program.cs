using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authorization;
using TrazActivo.Api.Endpoints;
using TrazActivo.Api.Errors;
using TrazActivo.Api.Observability;
using TrazActivo.Api.OpenApi;
using TrazActivo.Api.Security;
using TrazActivo.ControlPlane.Application.Security;
using TrazActivo.ControlPlane.Application.Tenants;
using TrazActivo.ControlPlane.Infrastructure;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddProblemDetails();
builder.Services.AddExceptionHandler<TrazActivoExceptionHandler>();
builder.Services.AddOpenApi(options =>
{
  options.AddDocumentTransformer<ControlPlaneOpenApiDocumentTransformer>();
  options.AddOperationTransformer<ControlPlaneOpenApiOperationTransformer>();
});
builder.Services.Configure<RouteHandlerOptions>(options => options.ThrowOnBadRequest = true);
builder.Services.AddHealthChecks()
    .AddCheck("control-plane-store", () => Microsoft.Extensions.Diagnostics.HealthChecks.HealthCheckResult.Healthy(), ["ready"]);
builder.Services.AddHttpContextAccessor();
builder.Services.AddSingleton(TimeProvider.System);
builder.Services.AddScoped<ICorrelationContext, HttpCorrelationContext>();
builder.Services.AddScoped<IPlatformActorContext, HttpPlatformActorContext>();
builder.Services.AddScoped<TenantAdministrationService>();
builder.Services.AddControlPlaneInfrastructure(builder.Environment);

builder.Services
    .AddAuthentication(DenyByDefaultAuthenticationHandler.SchemeName)
    .AddScheme<AuthenticationSchemeOptions, DenyByDefaultAuthenticationHandler>(
        DenyByDefaultAuthenticationHandler.SchemeName,
        _ => { });
builder.Services.AddAuthorization(options =>
{
  options.FallbackPolicy = new AuthorizationPolicyBuilder()
      .RequireAuthenticatedUser()
      .Build();
  AddPermissionPolicy(options, PlatformPermissions.TenantsCreate);
  AddPermissionPolicy(options, PlatformPermissions.TenantsRead);
  AddPermissionPolicy(options, PlatformPermissions.TenantsProvision);
  AddPermissionPolicy(options, PlatformPermissions.TenantsSuspend);
});
builder.Services.AddSingleton<IAuthorizationMiddlewareResultHandler, ProblemDetailsAuthorizationResultHandler>();

var app = builder.Build();

app.UseMiddleware<CorrelationIdMiddleware>();
app.UseStatusCodePages(async context =>
{
  var httpContext = context.HttpContext;
  if (httpContext.Response.StatusCode != StatusCodes.Status415UnsupportedMediaType)
  {
    return;
  }

  await Results.Problem(
      statusCode: StatusCodes.Status415UnsupportedMediaType,
      title: "Unsupported Media Type",
      detail: "The request Content-Type must be application/json.",
      instance: httpContext.Request.Path,
      extensions: new Dictionary<string, object?>
      {
        ["code"] = "API-UNSUPPORTED-MEDIA-TYPE",
        ["correlationId"] = CorrelationIdMiddleware.Get(httpContext)
      }).ExecuteAsync(httpContext);
});
app.UseExceptionHandler();
app.UseAuthentication();
app.UseAuthorization();

app.MapGet("/health/live", () => Results.Ok(new { status = "Healthy" }))
    .AllowAnonymous()
    .WithName("HealthLive")
    .WithTags("Health");
app.MapHealthChecks("/health/ready", new()
{
  Predicate = registration => registration.Tags.Contains("ready")
}).AllowAnonymous();
app.MapOpenApi("/openapi/{documentName}.json").AllowAnonymous();
app.MapControlPlaneTenantEndpoints();

app.Run();

static void AddPermissionPolicy(AuthorizationOptions options, string permission)
{
  options.AddPolicy(permission, policy => policy
      .RequireAuthenticatedUser()
      .RequireClaim(PlatformClaimTypes.Permission, permission));
}

public partial class Program;
