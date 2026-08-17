using System.Collections.Frozen;

namespace TrazActivo.Tenancy.Abstractions;

public sealed class TenantContext
{
  public TenantContext(
      Guid tenantId,
      string userId,
      string tenantMembershipId,
      string legalEntityId,
      string? businessContextId,
      string? accountingBookId,
      IReadOnlySet<string> roles,
      IReadOnlySet<string> permissions,
      string locale,
      string timeZone,
      string correlationId,
      string sessionId)
  {
    TenantId = tenantId;
    UserId = userId;
    TenantMembershipId = tenantMembershipId;
    LegalEntityId = legalEntityId;
    BusinessContextId = businessContextId;
    AccountingBookId = accountingBookId;
    Roles = roles.ToFrozenSet(StringComparer.Ordinal);
    Permissions = permissions.ToFrozenSet(StringComparer.Ordinal);
    Locale = locale;
    TimeZone = timeZone;
    CorrelationId = correlationId;
    SessionId = sessionId;
  }

  public Guid TenantId { get; }

  public string UserId { get; }

  public string TenantMembershipId { get; }

  public string LegalEntityId { get; }

  public string? BusinessContextId { get; }

  public string? AccountingBookId { get; }

  public IReadOnlySet<string> Roles { get; }

  public IReadOnlySet<string> Permissions { get; }

  public string Locale { get; }

  public string TimeZone { get; }

  public string CorrelationId { get; }

  public string SessionId { get; }
}

public interface ITenantContextAccessor
{
  TenantContext? Current { get; }
}

public interface ITenantContextFactory
{
  ValueTask<TenantContext> CreateAsync(
      ResolvedTenant resolvedTenant,
      string userId,
      string tenantMembershipId,
      string legalEntityId,
      string? businessContextId,
      string? accountingBookId,
      IReadOnlySet<string> roles,
      IReadOnlySet<string> permissions,
      string locale,
      string timeZone,
      string correlationId,
      string sessionId,
      CancellationToken cancellationToken);
}
