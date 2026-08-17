using Microsoft.Extensions.Primitives;

namespace TrazActivo.Api.Http;

internal static class RequestHeaders
{
  public static bool TryGetIdempotencyKey(HttpRequest request, out string key)
  {
    key = request.Headers.TryGetValue("Idempotency-Key", out var values)
        ? values.ToString().Trim()
        : string.Empty;
    return key.Length is > 0 and <= 200;
  }

  public static bool TryGetExpectedVersion(HttpRequest request, out long version)
  {
    version = default;
    if (!request.Headers.TryGetValue("If-Match", out StringValues values))
    {
      return false;
    }

    var raw = values.ToString().Trim();
    return raw.Length >= 3 &&
           raw[0] == '"' &&
           raw[^1] == '"' &&
           long.TryParse(raw[1..^1], out version) &&
           version > 0;
  }

  public static string FormatEtag(long version) => $"\"{version}\"";
}
