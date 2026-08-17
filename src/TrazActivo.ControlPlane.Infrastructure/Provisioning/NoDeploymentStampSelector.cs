using TrazActivo.ControlPlane.Application.Abstractions;
using TrazActivo.ControlPlane.Domain.Tenants;

namespace TrazActivo.ControlPlane.Infrastructure.Provisioning;

internal sealed class NoDeploymentStampSelector : IDeploymentStampSelector
{
  public ValueTask<DeploymentStampReference?> SelectAsync(
      TenantSnapshot tenant,
      CancellationToken cancellationToken)
  {
    cancellationToken.ThrowIfCancellationRequested();
    return ValueTask.FromResult<DeploymentStampReference?>(null);
  }
}
