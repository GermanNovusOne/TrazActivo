using System.Security.Cryptography;
using System.Text;

namespace TrazActivo.ControlPlane.Application.Common;

public static class RequestFingerprint
{
  public static string Compute(params string?[] values)
  {
    var canonical = string.Join('\u001f', values.Select(value => value?.Trim() ?? "<null>"));
    var hash = SHA256.HashData(Encoding.UTF8.GetBytes(canonical));
    return Convert.ToHexString(hash);
  }
}
