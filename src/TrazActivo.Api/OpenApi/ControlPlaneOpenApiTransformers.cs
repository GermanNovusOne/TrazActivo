using Microsoft.AspNetCore.OpenApi;
using Microsoft.OpenApi;

namespace TrazActivo.Api.OpenApi;

internal sealed class ControlPlaneOpenApiDocumentTransformer : IOpenApiDocumentTransformer
{
  internal const string SecuritySchemeName = "platformIdentity";

  public Task TransformAsync(
      OpenApiDocument document,
      OpenApiDocumentTransformerContext context,
      CancellationToken cancellationToken)
  {
    cancellationToken.ThrowIfCancellationRequested();
    document.Components ??= new OpenApiComponents();
    document.Components.SecuritySchemes ??=
        new Dictionary<string, IOpenApiSecurityScheme>(StringComparer.Ordinal);
    document.Components.SecuritySchemes[SecuritySchemeName] = new OpenApiSecurityScheme
    {
      Type = SecuritySchemeType.Http,
      Scheme = "bearer",
      Description = "Authorization contract only. Identity provider and token validation are not implemented in Sprint 1."
    };
    return Task.CompletedTask;
  }
}

internal sealed class ControlPlaneOpenApiOperationTransformer : IOpenApiOperationTransformer
{
  private static readonly HashSet<string> ControlPlaneOperations =
  [
    "CreateTenant",
    "GetTenant",
    "StartTenantProvisioning",
    "SuspendTenant"
  ];

  public Task TransformAsync(
      OpenApiOperation operation,
      OpenApiOperationTransformerContext context,
      CancellationToken cancellationToken)
  {
    cancellationToken.ThrowIfCancellationRequested();
    if (operation.OperationId is null || !ControlPlaneOperations.Contains(operation.OperationId))
    {
      return Task.CompletedTask;
    }

    operation.Security ??= [];
    operation.Security.Add(new OpenApiSecurityRequirement
    {
      [new OpenApiSecuritySchemeReference(
          ControlPlaneOpenApiDocumentTransformer.SecuritySchemeName,
          context.Document,
          null)] = []
    });

    if (operation.OperationId is "CreateTenant" or "StartTenantProvisioning" or "SuspendTenant")
    {
      AddHeaderParameter(
          operation,
          "Idempotency-Key",
          "Unique key for replay-safe command execution.",
          "^[^\\s]{1,200}$");
    }

    if (operation.OperationId is "StartTenantProvisioning" or "SuspendTenant")
    {
      AddHeaderParameter(
          operation,
          "If-Match",
          "Quoted expected aggregate version.",
          "^\"[1-9][0-9]*\"$");
    }

    foreach (var status in SuccessStatuses(operation.OperationId))
    {
      AddEtagHeader(operation, status);
    }

    return Task.CompletedTask;
  }

  private static void AddHeaderParameter(
      OpenApiOperation operation,
      string name,
      string description,
      string pattern)
  {
    operation.Parameters ??= [];
    if (operation.Parameters.Any(parameter =>
            string.Equals(parameter.Name, name, StringComparison.OrdinalIgnoreCase)))
    {
      return;
    }

    operation.Parameters.Add(new OpenApiParameter
    {
      Name = name,
      In = ParameterLocation.Header,
      Required = true,
      Description = description,
      Schema = new OpenApiSchema
      {
        Type = JsonSchemaType.String,
        Pattern = pattern
      }
    });
  }

  private static void AddEtagHeader(OpenApiOperation operation, string status)
  {
    if (operation.Responses is null ||
        !operation.Responses.TryGetValue(status, out var response) ||
        response is not OpenApiResponse concrete)
    {
      return;
    }

    concrete.Headers ??= new Dictionary<string, IOpenApiHeader>(StringComparer.OrdinalIgnoreCase);
    concrete.Headers["ETag"] = new OpenApiHeader
    {
      Description = "Quoted aggregate version for optimistic concurrency.",
      Required = true,
      Schema = new OpenApiSchema { Type = JsonSchemaType.String }
    };
  }

  private static string[] SuccessStatuses(string operationId) => operationId switch
  {
    "CreateTenant" => ["201"],
    "StartTenantProvisioning" => ["202"],
    _ => ["200"]
  };
}
