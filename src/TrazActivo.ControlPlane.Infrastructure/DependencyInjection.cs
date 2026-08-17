using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using TrazActivo.ControlPlane.Application.Abstractions;
using TrazActivo.ControlPlane.Infrastructure.InMemory;
using TrazActivo.ControlPlane.Infrastructure.Provisioning;

namespace TrazActivo.ControlPlane.Infrastructure;

public static class DependencyInjection
{
  public static IServiceCollection AddControlPlaneInfrastructure(
      this IServiceCollection services,
      IHostEnvironment environment)
  {
    if (!environment.IsDevelopment() && !environment.IsEnvironment("Testing"))
    {
      throw new InvalidOperationException(
          "Sprint 1 in-memory Control Plane adapters are restricted to Development and Testing.");
    }

    services.AddSingleton<InMemoryControlPlaneStore>();
    services.AddSingleton<ITenantAdministrationStore>(provider =>
        provider.GetRequiredService<InMemoryControlPlaneStore>());
    services.AddSingleton<ITenantCatalogReader>(provider =>
        provider.GetRequiredService<InMemoryControlPlaneStore>());
    services.AddSingleton<IPlatformAuditReader>(provider =>
        provider.GetRequiredService<InMemoryControlPlaneStore>());
    services.AddSingleton<IDomainEventReader>(provider =>
        provider.GetRequiredService<InMemoryControlPlaneStore>());
    services.AddSingleton<IDeploymentStampSelector, NoDeploymentStampSelector>();
    return services;
  }
}
