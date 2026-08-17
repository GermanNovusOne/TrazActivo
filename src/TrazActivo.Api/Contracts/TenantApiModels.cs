using TrazActivo.ControlPlane.Application.Tenants;

namespace TrazActivo.Api.Contracts;

public sealed record CreateTenantRequest(
    string Code,
    string Name,
    string Region,
    string IdentityMode);

public sealed record LifecycleReasonRequest(string Reason);

public sealed record TenantResponse(
    string TenantId,
    string Code,
    string Name,
    string Region,
    string Status,
    string? DeploymentStampId,
    long? SchemaVersion,
    long? ConfigurationVersion,
    string IdentityMode,
    bool HasDatabaseReference,
    bool HasStorageReference,
    DateTimeOffset CreatedAt,
    DateTimeOffset UpdatedAt,
    long Version)
{
  public static TenantResponse From(TenantDetails details) => new(
      details.TenantId,
      details.Code,
      details.Name,
      details.Region,
      details.Status,
      details.DeploymentStampId,
      details.SchemaVersion,
      details.ConfigurationVersion,
      details.IdentityMode,
      details.HasDatabaseReference,
      details.HasStorageReference,
      details.CreatedAt,
      details.UpdatedAt,
      details.Version);
}
