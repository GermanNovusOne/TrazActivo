using System.Net;
using System.Net.Http.Json;
using System.Text;
using System.Text.Json;
using TrazActivo.Api.Contracts;
using TrazActivo.IntegrationTests.Support;

namespace TrazActivo.IntegrationTests;

public sealed class ApiContractTests
{
  [Fact]
  public async Task Openapi_describes_authorization_headers_responses_and_problem_details()
  {
    await using var factory = new TrazActivoApiFactory(authenticated: false);
    using var client = factory.CreateClient();
    using var document = JsonDocument.Parse(await client.GetStringAsync("/openapi/v1.json"));
    var root = document.RootElement;

    var scheme = root.GetProperty("components").GetProperty("securitySchemes")
        .GetProperty("platformIdentity");
    Assert.Equal("http", scheme.GetProperty("type").GetString());
    Assert.Equal("bearer", scheme.GetProperty("scheme").GetString());

    var paths = root.GetProperty("paths");
    var create = paths.GetProperty("/control/v1/tenants").GetProperty("post");
    var get = paths.GetProperty("/control/v1/tenants/{tenantId}").GetProperty("get");
    var provision = paths.GetProperty("/control/v1/tenants/{tenantId}/provision").GetProperty("post");
    var suspend = paths.GetProperty("/control/v1/tenants/{tenantId}/suspend").GetProperty("post");

    AssertSecurity(create);
    AssertSecurity(get);
    AssertSecurity(provision);
    AssertSecurity(suspend);
    AssertHeaderParameter(create, "Idempotency-Key");
    AssertHeaderParameter(provision, "Idempotency-Key");
    AssertHeaderParameter(provision, "If-Match");
    AssertHeaderParameter(suspend, "Idempotency-Key");
    AssertHeaderParameter(suspend, "If-Match");
    AssertEtag(create, "201");
    AssertEtag(get, "200");
    AssertEtag(provision, "202");
    AssertEtag(suspend, "200");

    AssertResponses(create, "201", "400", "401", "403", "409", "415");
    AssertResponses(get, "200", "400", "401", "403", "404");
    AssertResponses(provision, "202", "400", "401", "403", "404", "409", "415", "428", "503");
    AssertResponses(suspend, "200", "400", "401", "403", "404", "409", "415", "428");
    AssertProblemResponses(create, "400", "401", "403", "409", "415");
    AssertProblemResponses(provision, "400", "401", "403", "404", "409", "415", "428", "503");
  }

  [Theory]
  [InlineData(RequestDefect.MalformedJson, HttpStatusCode.BadRequest, "API-REQUEST-BINDING-INVALID")]
  [InlineData(RequestDefect.MissingBody, HttpStatusCode.BadRequest, "API-REQUEST-BINDING-INVALID")]
  [InlineData(RequestDefect.UnsupportedContentType, HttpStatusCode.UnsupportedMediaType, "API-UNSUPPORTED-MEDIA-TYPE")]
  [InlineData(RequestDefect.BindingError, HttpStatusCode.BadRequest, "API-REQUEST-BINDING-INVALID")]
  [InlineData(RequestDefect.ValidationError, HttpStatusCode.BadRequest, "PLAT-TENANT-NAME-REQUIRED")]
  public async Task Invalid_requests_return_safe_consistent_problem_details(
      RequestDefect defect,
      HttpStatusCode expectedStatus,
      string expectedCode)
  {
    await using var factory = new TrazActivoApiFactory();
    using var client = factory.CreateClient();
    using var request = DefectiveRequest(defect);

    var response = await client.SendAsync(request);

    await AssertSafeProblemAsync(response, expectedStatus, expectedCode);
  }

  [Fact]
  public async Task Valid_correlation_id_is_echoed_and_invalid_value_is_replaced()
  {
    await using var factory = new TrazActivoApiFactory();
    using var client = factory.CreateClient();
    using var valid = HttpRequestFactory.PostAsJson(
        "/control/v1/tenants",
        NewTenant("CORR-VALID"),
        "correlation-valid");
    valid.Headers.Add("X-Correlation-ID", "corr.valid:123");
    var validResponse = await client.SendAsync(valid);

    Assert.Equal("corr.valid:123", Assert.Single(validResponse.Headers.GetValues("X-Correlation-ID")));

    using var invalid = HttpRequestFactory.PostAsJson(
        "/control/v1/tenants",
        NewTenant("CORR-INVALID"),
        "correlation-invalid");
    invalid.Headers.TryAddWithoutValidation("X-Correlation-ID", "unsafe value");
    var invalidResponse = await client.SendAsync(invalid);
    var replacement = Assert.Single(invalidResponse.Headers.GetValues("X-Correlation-ID"));

    Assert.True(Guid.TryParse(replacement, out _));
    Assert.NotEqual("unsafe value", replacement);
  }

  private static HttpRequestMessage DefectiveRequest(RequestDefect defect)
  {
    var request = new HttpRequestMessage(HttpMethod.Post, "/control/v1/tenants");
    request.Headers.Add("Idempotency-Key", $"defect-{defect}");
    request.Content = defect switch
    {
      RequestDefect.MalformedJson => new StringContent("{", Encoding.UTF8, "application/json"),
      RequestDefect.MissingBody => null,
      RequestDefect.UnsupportedContentType => new StringContent(
          JsonSerializer.Serialize(NewTenant("WRONG-CONTENT")),
          Encoding.UTF8,
          "text/plain"),
      RequestDefect.BindingError => new StringContent(
          "{\"code\":[1],\"name\":\"Binding\",\"region\":\"cl-test\",\"identityMode\":\"ExternalId\"}",
          Encoding.UTF8,
          "application/json"),
      RequestDefect.ValidationError => JsonContent.Create(NewTenant("VALIDATION") with { Name = "" }),
      _ => throw new ArgumentOutOfRangeException(nameof(defect))
    };
    return request;
  }

  private static async Task AssertSafeProblemAsync(
      HttpResponseMessage response,
      HttpStatusCode expectedStatus,
      string expectedCode)
  {
    var raw = await response.Content.ReadAsStringAsync();
    using var document = JsonDocument.Parse(raw);
    var problem = document.RootElement;

    Assert.Equal(expectedStatus, response.StatusCode);
    Assert.Equal("application/problem+json", response.Content.Headers.ContentType?.MediaType);
    Assert.Equal((int)expectedStatus, problem.GetProperty("status").GetInt32());
    Assert.Equal(expectedCode, problem.GetProperty("code").GetString());
    Assert.False(string.IsNullOrWhiteSpace(problem.GetProperty("correlationId").GetString()));
    Assert.False(string.IsNullOrWhiteSpace(problem.GetProperty("detail").GetString()));
    Assert.DoesNotContain("stack", raw, StringComparison.OrdinalIgnoreCase);
    Assert.DoesNotContain("exception", raw, StringComparison.OrdinalIgnoreCase);
  }

  private static void AssertSecurity(JsonElement operation)
  {
    var security = operation.GetProperty("security");
    Assert.Contains(security.EnumerateArray(), requirement =>
        requirement.TryGetProperty("platformIdentity", out _));
  }

  private static void AssertHeaderParameter(JsonElement operation, string name)
  {
    var parameter = Assert.Single(operation.GetProperty("parameters").EnumerateArray(), item =>
        item.GetProperty("in").GetString() == "header" &&
        item.GetProperty("name").GetString() == name);
    Assert.True(parameter.GetProperty("required").GetBoolean());
    Assert.Equal("string", parameter.GetProperty("schema").GetProperty("type").GetString());
  }

  private static void AssertEtag(JsonElement operation, string status)
  {
    var headers = operation.GetProperty("responses").GetProperty(status).GetProperty("headers");
    Assert.True(headers.TryGetProperty("ETag", out var etag));
    Assert.Equal("string", etag.GetProperty("schema").GetProperty("type").GetString());
  }

  private static void AssertResponses(JsonElement operation, params string[] statuses)
  {
    var responses = operation.GetProperty("responses");
    Assert.All(statuses, status => Assert.True(responses.TryGetProperty(status, out _), $"Missing response {status}."));
  }

  private static void AssertProblemResponses(JsonElement operation, params string[] statuses)
  {
    var responses = operation.GetProperty("responses");
    Assert.All(statuses, status => Assert.True(
        responses.GetProperty(status).GetProperty("content").TryGetProperty("application/problem+json", out _),
        $"Response {status} is not documented as Problem Details."));
  }

  private static CreateTenantRequest NewTenant(string code) => new(
      code,
      "Contract Tenant",
      "cl-test",
      "ExternalId");

  public enum RequestDefect
  {
    MalformedJson,
    MissingBody,
    UnsupportedContentType,
    BindingError,
    ValidationError
  }
}
