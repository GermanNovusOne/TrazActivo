namespace TrazActivo.ControlPlane.Domain.Tenants;

public enum TenantLifecycleStatus
{
  Requested,
  Provisioning,
  Configuring,
  Validation,
  ProvisioningFailed,
  Active,
  Suspended,
  Terminating,
  Retention,
  Deleted
}
