using Microsoft.AspNetCore.Diagnostics;
using System.Text.Json;
using TrazActivo.Api.Observability;
using TrazActivo.ControlPlane.Application.Common;

namespace TrazActivo.Api.Errors;

internal sealed class TrazActivoExceptionHandler(ILogger<TrazActivoExceptionHandler> logger) : IExceptionHandler
{
  public async ValueTask<bool> TryHandleAsync(
      HttpContext httpContext,
      Exception exception,
      CancellationToken cancellationToken)
  {
    var failure = Map(exception);
    if (failure.Status == StatusCodes.Status500InternalServerError)
    {
      logger.LogError(exception, "Unhandled request failure. CorrelationId={CorrelationId}", CorrelationIdMiddleware.Get(httpContext));
    }

    var extensions = new Dictionary<string, object?>
    {
      ["code"] = failure.Code,
      ["correlationId"] = CorrelationIdMiddleware.Get(httpContext)
    };
    if (failure.CurrentVersion is not null)
    {
      extensions["currentVersion"] = failure.CurrentVersion;
    }

    await Results.Problem(
        statusCode: failure.Status,
        title: failure.Title,
        detail: failure.Detail,
        instance: httpContext.Request.Path,
        extensions: extensions).ExecuteAsync(httpContext);
    return true;
  }

  private static Failure Map(Exception exception) => exception switch
  {
    BadHttpRequestException request => RequestFailure(request.StatusCode),
    JsonException => RequestFailure(StatusCodes.Status400BadRequest),
    ApplicationFailureException application => new(
        Map(application.Kind),
        Title(Map(application.Kind)),
        application.Message,
        application.Code,
        application.CurrentVersion),
    _ => new(
        StatusCodes.Status500InternalServerError,
        "Internal Server Error",
        "An unexpected error occurred.",
        "SYS-UNEXPECTED",
        null)
  };

  private static Failure RequestFailure(int status)
  {
    var unsupportedMediaType = status == StatusCodes.Status415UnsupportedMediaType;
    return new(
        unsupportedMediaType ? StatusCodes.Status415UnsupportedMediaType : StatusCodes.Status400BadRequest,
        unsupportedMediaType ? "Unsupported Media Type" : "Bad Request",
        unsupportedMediaType
            ? "The request Content-Type must be application/json."
            : "The request body or one of its values is invalid.",
        unsupportedMediaType ? "API-UNSUPPORTED-MEDIA-TYPE" : "API-REQUEST-BINDING-INVALID",
        null);
  }

  private static int Map(ApplicationErrorKind kind) => kind switch
  {
    ApplicationErrorKind.Validation => StatusCodes.Status400BadRequest,
    ApplicationErrorKind.Unauthorized => StatusCodes.Status401Unauthorized,
    ApplicationErrorKind.Forbidden => StatusCodes.Status403Forbidden,
    ApplicationErrorKind.NotFound => StatusCodes.Status404NotFound,
    ApplicationErrorKind.Conflict => StatusCodes.Status409Conflict,
    ApplicationErrorKind.Unavailable => StatusCodes.Status503ServiceUnavailable,
    _ => StatusCodes.Status500InternalServerError
  };

  private static string Title(int status) => status switch
  {
    StatusCodes.Status400BadRequest => "Bad Request",
    StatusCodes.Status401Unauthorized => "Unauthorized",
    StatusCodes.Status403Forbidden => "Forbidden",
    StatusCodes.Status404NotFound => "Not Found",
    StatusCodes.Status409Conflict => "Conflict",
    StatusCodes.Status415UnsupportedMediaType => "Unsupported Media Type",
    StatusCodes.Status503ServiceUnavailable => "Service Unavailable",
    _ => "Internal Server Error"
  };

  private sealed record Failure(
      int Status,
      string Title,
      string Detail,
      string Code,
      long? CurrentVersion);
}
