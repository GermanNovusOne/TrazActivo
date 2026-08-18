using System.Net;
using TrazActivo.IntegrationTests.Support;

namespace TrazActivo.IntegrationTests;

public sealed class FrontendHostingTests
{
  [Theory]
  [InlineData("/")]
  [InlineData("/login")]
  [InlineData("/preview")]
  public async Task Approved_spa_routes_are_anonymous_html(string path)
  {
    await using var factory = new TrazActivoApiFactory(authenticated: false);
    using var client = factory.CreateClient();

    var response = await client.GetAsync(path);
    var body = await response.Content.ReadAsStringAsync();

    Assert.Equal(HttpStatusCode.OK, response.StatusCode);
    Assert.Equal("text/html", response.Content.Headers.ContentType?.MediaType);
    Assert.Contains("<div id=\"root\"></div>", body, StringComparison.Ordinal);
  }

  [Theory]
  [InlineData("/control/ruta-inexistente")]
  [InlineData("/api/ruta-inexistente")]
  [InlineData("/health/ruta-inexistente")]
  [InlineData("/openapi/ruta-inexistente")]
  public async Task Reserved_backend_prefixes_never_fall_back_to_spa(string path)
  {
    await using var factory = new TrazActivoApiFactory(authenticated: false);
    using var client = factory.CreateClient();

    var response = await client.GetAsync(path);
    var body = await response.Content.ReadAsStringAsync();

    Assert.NotEqual("text/html", response.Content.Headers.ContentType?.MediaType);
    Assert.DoesNotContain("<div id=\"root\"></div>", body, StringComparison.Ordinal);
  }
}
