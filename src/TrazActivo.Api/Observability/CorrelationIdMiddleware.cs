using System.Text.RegularExpressions;

namespace TrazActivo.Api.Observability;

public sealed partial class CorrelationIdMiddleware(RequestDelegate next)
{
  public const string HeaderName = "X-Correlation-ID";
  private const string ItemKey = "TrazActivo.CorrelationId";

  public async Task InvokeAsync(HttpContext context)
  {
    var supplied = context.Request.Headers[HeaderName].ToString().Trim();
    var correlationId = supplied.Length is > 0 and <= 128 && SafeCorrelationId().IsMatch(supplied)
        ? supplied
        : Guid.CreateVersion7().ToString("D");

    context.Items[ItemKey] = correlationId;
    context.TraceIdentifier = correlationId;
    context.Response.OnStarting(() =>
    {
      context.Response.Headers[HeaderName] = correlationId;
      return Task.CompletedTask;
    });

    await next(context);
  }

  public static string Get(HttpContext context) =>
      context.Items.TryGetValue(ItemKey, out var value) && value is string correlationId
          ? correlationId
          : context.TraceIdentifier;

  [GeneratedRegex("^[A-Za-z0-9._:-]+$", RegexOptions.CultureInvariant)]
  private static partial Regex SafeCorrelationId();
}
