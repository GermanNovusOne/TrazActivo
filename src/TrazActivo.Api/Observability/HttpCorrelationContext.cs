using TrazActivo.ControlPlane.Application.Security;

namespace TrazActivo.Api.Observability;

internal sealed class HttpCorrelationContext(IHttpContextAccessor accessor) : ICorrelationContext
{
  public string CorrelationId => accessor.HttpContext is { } context
      ? CorrelationIdMiddleware.Get(context)
      : throw new InvalidOperationException("Correlation context is only available during an HTTP request.");
}
