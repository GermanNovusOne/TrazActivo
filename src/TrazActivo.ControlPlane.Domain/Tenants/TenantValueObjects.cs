using TrazActivo.ControlPlane.Domain.Common;

namespace TrazActivo.ControlPlane.Domain.Tenants;

public readonly record struct TenantId(Guid Value)
{
  public static TenantId New() => new(Guid.CreateVersion7());

  public static bool TryParse(string? value, out TenantId tenantId)
  {
    if (Guid.TryParse(value, out var parsed) && parsed != Guid.Empty)
    {
      tenantId = new TenantId(parsed);
      return true;
    }

    tenantId = default;
    return false;
  }

  public override string ToString() => Value.ToString("D");
}

public readonly record struct TenantCode
{
  private TenantCode(string value) => Value = value;

  public string Value { get; }

  public static TenantCode Create(string? value)
  {
    var normalized = value?.Trim();
    if (string.IsNullOrWhiteSpace(normalized))
    {
      throw new DomainRuleException(
          "PLAT-TENANT-CODE-REQUIRED",
          "Tenant code is required.",
          DomainErrorKind.Validation);
    }

    return new TenantCode(normalized);
  }

  public override string ToString() => Value;
}

public readonly record struct IdentityModeCode
{
  private IdentityModeCode(string value) => Value = value;

  public string Value { get; }

  public static IdentityModeCode Create(string? value)
  {
    var normalized = value?.Trim();
    if (string.IsNullOrWhiteSpace(normalized))
    {
      throw new DomainRuleException(
          "PLAT-IDENTITY-MODE-REQUIRED",
          "Identity mode code is required.",
          DomainErrorKind.Validation);
    }

    return new IdentityModeCode(normalized);
  }

  public override string ToString() => Value;
}

public sealed record DeploymentStampReference
{
  private DeploymentStampReference(string id, string region)
  {
    Id = id;
    Region = region;
  }

  public string Id { get; }

  public string Region { get; }

  public static DeploymentStampReference Create(string? id, string? region)
  {
    if (string.IsNullOrWhiteSpace(id) || string.IsNullOrWhiteSpace(region))
    {
      throw new DomainRuleException(
          "PLAT-STAMP-REFERENCE-INVALID",
          "Deployment stamp id and region are required.",
          DomainErrorKind.Validation);
    }

    return new DeploymentStampReference(id.Trim(), region.Trim());
  }
}
