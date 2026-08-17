namespace TrazActivo.ControlPlane.Application.Tenants;

public sealed record CreateTenantCommand(
    string Code,
    string Name,
    string Region,
    string IdentityMode,
    string IdempotencyKey,
    string RequestFingerprint);

public sealed record StartTenantProvisioningCommand(
    Guid TenantId,
    long ExpectedVersion,
    string Reason,
    string IdempotencyKey,
    string RequestFingerprint);

public sealed record SuspendTenantCommand(
    Guid TenantId,
    long ExpectedVersion,
    string Reason,
    string IdempotencyKey,
    string RequestFingerprint);

public sealed record TenantDetails(
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
    long Version);
