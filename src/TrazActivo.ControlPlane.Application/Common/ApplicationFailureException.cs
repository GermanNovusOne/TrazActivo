namespace TrazActivo.ControlPlane.Application.Common;

public enum ApplicationErrorKind
{
  Validation,
  Unauthorized,
  Forbidden,
  NotFound,
  Conflict,
  Unavailable
}

public sealed class ApplicationFailureException(
    string code,
    string message,
    ApplicationErrorKind kind,
    long? currentVersion = null) : Exception(message)
{
  public string Code { get; } = code;

  public ApplicationErrorKind Kind { get; } = kind;

  public long? CurrentVersion { get; } = currentVersion;
}
