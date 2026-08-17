namespace TrazActivo.Tenancy.Abstractions;

public enum TenantResolutionSource
{
  Subdomain,
  VerifiedCustomDomain,
  AuthenticatedSelection,
  SignedIdentityClaim
}

public enum TenantAvailability
{
  Active,
  Suspended,
  Unavailable
}

public sealed record TenantResolutionCandidate(
    TenantResolutionSource Source,
    string Value);

public sealed record TenantResolutionRequest(
    TenantResolutionCandidate Candidate,
    string UserId,
    string CorrelationId);

public sealed record ResolvedTenant(
    Guid TenantId,
    TenantAvailability Availability,
    string DeploymentStampId,
    string DatabaseReference,
    string StorageReference,
    string Region,
    long SchemaVersion,
    long ConfigurationVersion,
    string IdentityMode);

public sealed class TenantResolutionResult
{
  private TenantResolutionResult(bool isResolved, ResolvedTenant? tenant, string? errorCode)
  {
    IsResolved = isResolved;
    Tenant = tenant;
    ErrorCode = errorCode;
  }

  public bool IsResolved { get; }

  public ResolvedTenant? Tenant { get; }

  public string? ErrorCode { get; }

  public static TenantResolutionResult Evaluate(ResolvedTenant tenant)
  {
    ArgumentNullException.ThrowIfNull(tenant);
    if (tenant.Availability == TenantAvailability.Suspended)
    {
      return Rejected("TEN-SUSPENDED");
    }

    if (tenant.Availability != TenantAvailability.Active ||
        tenant.TenantId == Guid.Empty ||
        string.IsNullOrWhiteSpace(tenant.DeploymentStampId) ||
        string.IsNullOrWhiteSpace(tenant.DatabaseReference) ||
        string.IsNullOrWhiteSpace(tenant.StorageReference))
    {
      return Rejected("TEN-CONTEXT-INVALID");
    }

    return new(true, tenant, null);
  }

  public static TenantResolutionResult Rejected(string errorCode)
  {
    ArgumentException.ThrowIfNullOrWhiteSpace(errorCode);
    return new(false, null, errorCode);
  }
}

public interface ITenantResolver
{
  ValueTask<TenantResolutionResult> ResolveAsync(
      TenantResolutionRequest request,
      CancellationToken cancellationToken);
}
