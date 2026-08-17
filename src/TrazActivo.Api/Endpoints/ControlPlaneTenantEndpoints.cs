using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.WebUtilities;
using TrazActivo.Api.Contracts;
using TrazActivo.Api.Http;
using TrazActivo.Api.Observability;
using TrazActivo.ControlPlane.Application.Common;
using TrazActivo.ControlPlane.Application.Security;
using TrazActivo.ControlPlane.Application.Tenants;

namespace TrazActivo.Api.Endpoints;

public static class ControlPlaneTenantEndpoints
{
  public static IEndpointRouteBuilder MapControlPlaneTenantEndpoints(this IEndpointRouteBuilder endpoints)
  {
    var group = endpoints.MapGroup("/control/v1/tenants")
        .WithTags("Control Plane Tenants");

    group.MapPost("/", CreateTenantAsync)
        .RequireAuthorization(PlatformPermissions.TenantsCreate)
        .WithName("CreateTenant")
        .Produces<TenantResponse>(StatusCodes.Status201Created)
        .ProducesProblem(StatusCodes.Status400BadRequest)
        .ProducesProblem(StatusCodes.Status401Unauthorized)
        .ProducesProblem(StatusCodes.Status403Forbidden)
        .ProducesProblem(StatusCodes.Status409Conflict)
        .ProducesProblem(StatusCodes.Status415UnsupportedMediaType);

    group.MapGet("/{tenantId}", GetTenantAsync)
        .RequireAuthorization(PlatformPermissions.TenantsRead)
        .WithName("GetTenant")
        .Produces<TenantResponse>()
        .ProducesProblem(StatusCodes.Status400BadRequest)
        .ProducesProblem(StatusCodes.Status401Unauthorized)
        .ProducesProblem(StatusCodes.Status403Forbidden)
        .ProducesProblem(StatusCodes.Status404NotFound);

    group.MapPost("/{tenantId}/provision", StartProvisioningAsync)
        .RequireAuthorization(PlatformPermissions.TenantsProvision)
        .WithName("StartTenantProvisioning")
        .Produces<TenantResponse>(StatusCodes.Status202Accepted)
        .ProducesProblem(StatusCodes.Status400BadRequest)
        .ProducesProblem(StatusCodes.Status401Unauthorized)
        .ProducesProblem(StatusCodes.Status403Forbidden)
        .ProducesProblem(StatusCodes.Status404NotFound)
        .ProducesProblem(StatusCodes.Status409Conflict)
        .ProducesProblem(StatusCodes.Status415UnsupportedMediaType)
        .ProducesProblem(StatusCodes.Status428PreconditionRequired)
        .ProducesProblem(StatusCodes.Status503ServiceUnavailable);

    group.MapPost("/{tenantId}/suspend", SuspendTenantAsync)
        .RequireAuthorization(PlatformPermissions.TenantsSuspend)
        .WithName("SuspendTenant")
        .Produces<TenantResponse>()
        .ProducesProblem(StatusCodes.Status400BadRequest)
        .ProducesProblem(StatusCodes.Status401Unauthorized)
        .ProducesProblem(StatusCodes.Status403Forbidden)
        .ProducesProblem(StatusCodes.Status404NotFound)
        .ProducesProblem(StatusCodes.Status409Conflict)
        .ProducesProblem(StatusCodes.Status415UnsupportedMediaType)
        .ProducesProblem(StatusCodes.Status428PreconditionRequired);

    return endpoints;
  }

  private static async Task<IResult> CreateTenantAsync(
      CreateTenantRequest request,
      HttpContext httpContext,
      TenantAdministrationService service,
      CancellationToken cancellationToken)
  {
    if (!RequestHeaders.TryGetIdempotencyKey(httpContext.Request, out var idempotencyKey))
    {
      return HeaderProblem(httpContext, "API-IDEMPOTENCY-KEY-REQUIRED", "A valid Idempotency-Key header is required.", StatusCodes.Status400BadRequest);
    }

    var fingerprint = RequestFingerprint.Compute(
        "CreateTenant",
        request.Code,
        request.Name,
        request.Region,
        request.IdentityMode);
    var details = await service.CreateAsync(
        new(request.Code, request.Name, request.Region, request.IdentityMode, idempotencyKey, fingerprint),
        cancellationToken);
    httpContext.Response.Headers.ETag = RequestHeaders.FormatEtag(details.Version);
    return Results.Created($"/control/v1/tenants/{details.TenantId}", TenantResponse.From(details));
  }

  private static async Task<IResult> GetTenantAsync(
      string tenantId,
      HttpContext httpContext,
      TenantAdministrationService service,
      CancellationToken cancellationToken)
  {
    var parsed = ParseTenantId(tenantId);
    var details = await service.GetAsync(parsed, cancellationToken);
    httpContext.Response.Headers.ETag = RequestHeaders.FormatEtag(details.Version);
    return Results.Ok(TenantResponse.From(details));
  }

  private static async Task<IResult> StartProvisioningAsync(
      string tenantId,
      LifecycleReasonRequest request,
      HttpContext httpContext,
      TenantAdministrationService service,
      CancellationToken cancellationToken)
  {
    if (!TryReadMutationHeaders(httpContext, out var idempotencyKey, out var expectedVersion, out var problem))
    {
      return problem!;
    }

    var parsed = ParseTenantId(tenantId);
    var fingerprint = RequestFingerprint.Compute(
        "StartTenantProvisioning",
        parsed.ToString("D"),
        expectedVersion.ToString(System.Globalization.CultureInfo.InvariantCulture),
        request.Reason);
    var details = await service.StartProvisioningAsync(
        new(parsed, expectedVersion, request.Reason, idempotencyKey, fingerprint),
        cancellationToken);
    httpContext.Response.Headers.ETag = RequestHeaders.FormatEtag(details.Version);
    return Results.Accepted($"/control/v1/tenants/{details.TenantId}", TenantResponse.From(details));
  }

  private static async Task<IResult> SuspendTenantAsync(
      string tenantId,
      LifecycleReasonRequest request,
      HttpContext httpContext,
      TenantAdministrationService service,
      CancellationToken cancellationToken)
  {
    if (!TryReadMutationHeaders(httpContext, out var idempotencyKey, out var expectedVersion, out var problem))
    {
      return problem!;
    }

    var parsed = ParseTenantId(tenantId);
    var fingerprint = RequestFingerprint.Compute(
        "SuspendTenant",
        parsed.ToString("D"),
        expectedVersion.ToString(System.Globalization.CultureInfo.InvariantCulture),
        request.Reason);
    var details = await service.SuspendAsync(
        new(parsed, expectedVersion, request.Reason, idempotencyKey, fingerprint),
        cancellationToken);
    httpContext.Response.Headers.ETag = RequestHeaders.FormatEtag(details.Version);
    return Results.Ok(TenantResponse.From(details));
  }

  private static bool TryReadMutationHeaders(
      HttpContext context,
      out string idempotencyKey,
      out long expectedVersion,
      out IResult? problem)
  {
    if (!RequestHeaders.TryGetIdempotencyKey(context.Request, out idempotencyKey))
    {
      expectedVersion = default;
      problem = HeaderProblem(context, "API-IDEMPOTENCY-KEY-REQUIRED", "A valid Idempotency-Key header is required.", StatusCodes.Status400BadRequest);
      return false;
    }

    if (!RequestHeaders.TryGetExpectedVersion(context.Request, out expectedVersion))
    {
      problem = HeaderProblem(context, "API-IF-MATCH-REQUIRED", "A valid quoted If-Match version is required.", StatusCodes.Status428PreconditionRequired);
      return false;
    }

    problem = null;
    return true;
  }

  private static Guid ParseTenantId(string value)
  {
    if (!Guid.TryParse(value, out var tenantId) || tenantId == Guid.Empty)
    {
      throw new ApplicationFailureException(
          "PLAT-TENANT-ID-INVALID",
          "The tenant identifier is invalid.",
          ApplicationErrorKind.Validation);
    }

    return tenantId;
  }

  private static IResult HeaderProblem(
      HttpContext context,
      string code,
      string detail,
      int status) => Results.Problem(
          statusCode: status,
          title: ReasonPhrases.GetReasonPhrase(status),
          detail: detail,
          instance: context.Request.Path,
          extensions: new Dictionary<string, object?>
          {
            ["code"] = code,
            ["correlationId"] = CorrelationIdMiddleware.Get(context)
          });
}
