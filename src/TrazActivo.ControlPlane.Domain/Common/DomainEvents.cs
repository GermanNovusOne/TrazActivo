namespace TrazActivo.ControlPlane.Domain.Common;

public interface IDomainEvent
{
  string EventName { get; }

  DateTimeOffset OccurredAt { get; }
}

public abstract class AggregateRoot
{
  private readonly List<IDomainEvent> _domainEvents = [];

  public IReadOnlyCollection<IDomainEvent> DomainEvents => _domainEvents.AsReadOnly();

  protected void Raise(IDomainEvent domainEvent) => _domainEvents.Add(domainEvent);

  public IReadOnlyList<IDomainEvent> DequeueDomainEvents()
  {
    var events = _domainEvents.ToArray();
    _domainEvents.Clear();
    return events;
  }
}
