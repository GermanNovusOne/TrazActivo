namespace TrazActivo.ControlPlane.Domain.Common;

public enum DomainErrorKind
{
  Validation,
  Conflict
}

public sealed class DomainRuleException(
    string code,
    string message,
    DomainErrorKind kind = DomainErrorKind.Conflict) : Exception(message)
{
  public string Code { get; } = code;

  public DomainErrorKind Kind { get; } = kind;
}
