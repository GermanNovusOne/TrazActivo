using TrazActivo.ControlPlane.Domain.Tenants;

namespace TrazActivo.ControlPlane.Domain.Auditing;

public sealed record PlatformAuditRecord(
    Guid AuditId,
    string OperatorId,
    TenantId? TargetTenantId,
    string? DeploymentStampId,
    string Permission,
    string Action,
    string Reason,
    string? SupportTicketReference,
    DateTimeOffset? ExceptionalAccessExpiresAt,
    string CorrelationId,
    string OperationId,
    DateTimeOffset OccurredAt,
    string? BeforeState,
    string? AfterState,
    string Outcome);
