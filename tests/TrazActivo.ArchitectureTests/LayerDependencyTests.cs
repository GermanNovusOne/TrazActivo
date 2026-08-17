using System.Diagnostics;
using System.Reflection;
using System.Xml.Linq;
using TrazActivo.ControlPlane.Application.Tenants;
using TrazActivo.ControlPlane.Domain.Tenants;
using TrazActivo.ControlPlane.Infrastructure;
using TrazActivo.Tenancy.Abstractions;

namespace TrazActivo.ArchitectureTests;

public sealed class LayerDependencyTests
{
  private static readonly IReadOnlyDictionary<string, IReadOnlySet<string>> ProductDependencyAllowlist =
      new Dictionary<string, IReadOnlySet<string>>(StringComparer.Ordinal)
      {
        ["TrazActivo.ControlPlane.Domain"] = new HashSet<string>(StringComparer.Ordinal),
        ["TrazActivo.ControlPlane.Application"] = new HashSet<string>(StringComparer.Ordinal)
        {
          "TrazActivo.ControlPlane.Domain",
          "TrazActivo.Tenancy.Abstractions"
        },
        ["TrazActivo.ControlPlane.Infrastructure"] = new HashSet<string>(StringComparer.Ordinal)
        {
          "TrazActivo.ControlPlane.Application",
          "TrazActivo.ControlPlane.Domain"
        },
        ["TrazActivo.Tenancy.Abstractions"] = new HashSet<string>(StringComparer.Ordinal),
        ["TrazActivo.Api"] = new HashSet<string>(StringComparer.Ordinal)
        {
          "TrazActivo.ControlPlane.Application",
          "TrazActivo.ControlPlane.Infrastructure"
        }
      };

  private static readonly IReadOnlyDictionary<string, Assembly> ProductAssemblies =
      new Dictionary<string, Assembly>(StringComparer.Ordinal)
      {
        ["TrazActivo.ControlPlane.Domain"] = typeof(Tenant).Assembly,
        ["TrazActivo.ControlPlane.Application"] = typeof(TenantAdministrationService).Assembly,
        ["TrazActivo.ControlPlane.Infrastructure"] = typeof(DependencyInjection).Assembly,
        ["TrazActivo.Tenancy.Abstractions"] = typeof(ITenantResolver).Assembly,
        ["TrazActivo.Api"] = typeof(global::Program).Assembly
      };

  [Fact]
  public void Solution_contains_exactly_the_approved_sprint_one_product_projects()
  {
    var root = FindRepositoryRoot();
    var solutionProjects = ListSolutionProjects(root)
        .Where(project => project.StartsWith("src" + Path.DirectorySeparatorChar, StringComparison.OrdinalIgnoreCase))
        .Select(path => Path.GetFileNameWithoutExtension(path)!)
        .Order(StringComparer.Ordinal)
        .ToArray();

    Assert.Equal(ProductDependencyAllowlist.Keys.Order(StringComparer.Ordinal), solutionProjects);
  }

  [Fact]
  public void Product_project_references_are_within_explicit_allowlist()
  {
    var root = FindRepositoryRoot();
    foreach (var (projectName, allowedReferences) in ProductDependencyAllowlist)
    {
      var projectPath = Path.Combine(root, "src", projectName, projectName + ".csproj");
      Assert.True(File.Exists(projectPath), $"Missing expected project {projectPath}.");
      var actualReferences = ReadProjectReferences(projectPath);
      var unauthorized = actualReferences.Except(allowedReferences, StringComparer.Ordinal).ToArray();

      Assert.True(
          unauthorized.Length == 0,
          $"{projectName} has unauthorized ProjectReference(s): {string.Join(", ", unauthorized)}");
    }
  }

  [Fact]
  public void Compiled_product_dependencies_are_within_explicit_allowlist()
  {
    foreach (var (projectName, assembly) in ProductAssemblies)
    {
      var actualReferences = ProductReferences(assembly);
      var unauthorized = actualReferences
          .Except(ProductDependencyAllowlist[projectName], StringComparer.Ordinal)
          .ToArray();

      Assert.True(
          unauthorized.Length == 0,
          $"{projectName} has unauthorized compiled reference(s): {string.Join(", ", unauthorized)}");
    }
  }

  [Fact]
  public void Domain_and_application_do_not_reference_aspnet_azure_or_infrastructure()
  {
    AssertNoFrameworkPrefix(typeof(Tenant).Assembly, "Microsoft.AspNetCore", "Azure.");
    AssertNoFrameworkPrefix(typeof(TenantAdministrationService).Assembly, "Microsoft.AspNetCore", "Azure.");
    Assert.DoesNotContain(
        "TrazActivo.ControlPlane.Infrastructure",
        ProductReferences(typeof(TenantAdministrationService).Assembly));
  }

  [Fact]
  public void Domain_application_and_tenancy_have_no_external_package_or_framework_references()
  {
    var root = FindRepositoryRoot();
    foreach (var projectName in new[]
             {
               "TrazActivo.ControlPlane.Domain",
               "TrazActivo.ControlPlane.Application",
               "TrazActivo.Tenancy.Abstractions"
             })
    {
      var projectPath = Path.Combine(root, "src", projectName, projectName + ".csproj");
      var document = XDocument.Load(projectPath, LoadOptions.None);
      Assert.Empty(document.Descendants("PackageReference"));
      Assert.Empty(document.Descendants("FrameworkReference"));
    }
  }

  [Fact]
  public void Api_is_composition_root_without_direct_domain_dependency()
  {
    var references = ProductReferences(typeof(global::Program).Assembly);

    Assert.Contains("TrazActivo.ControlPlane.Application", references);
    Assert.Contains("TrazActivo.ControlPlane.Infrastructure", references);
    Assert.DoesNotContain("TrazActivo.ControlPlane.Domain", references);
  }

  [Fact]
  public void Sprint_one_source_tree_contains_no_data_plane_or_unapproved_product_project()
  {
    var root = FindRepositoryRoot();
    var sourceProjects = Directory.EnumerateFiles(
            Path.Combine(root, "src"),
            "*.csproj",
            SearchOption.AllDirectories)
        .Select(path => Path.GetFileNameWithoutExtension(path)!)
        .ToArray();

    Assert.DoesNotContain(sourceProjects, name =>
        name.Contains("DataPlane", StringComparison.OrdinalIgnoreCase));
    Assert.Empty(sourceProjects.Except(ProductDependencyAllowlist.Keys, StringComparer.Ordinal));
    Assert.Empty(ProductDependencyAllowlist.Keys.Except(sourceProjects, StringComparer.Ordinal));
  }

  private static string[] ListSolutionProjects(string root)
  {
    var startInfo = new ProcessStartInfo("dotnet")
    {
      WorkingDirectory = root,
      RedirectStandardOutput = true,
      RedirectStandardError = true,
      UseShellExecute = false
    };
    startInfo.ArgumentList.Add("sln");
    startInfo.ArgumentList.Add("TrazActivo.sln");
    startInfo.ArgumentList.Add("list");
    using var process = Process.Start(startInfo) ?? throw new InvalidOperationException("Unable to start dotnet.");
    var output = process.StandardOutput.ReadToEnd();
    var error = process.StandardError.ReadToEnd();
    process.WaitForExit();
    Assert.True(process.ExitCode == 0, error);

    return output.Split(['\r', '\n'], StringSplitOptions.RemoveEmptyEntries)
        .Select(line => line.Trim())
        .Where(line => line.EndsWith(".csproj", StringComparison.OrdinalIgnoreCase))
        .Select(line => line.Replace(Path.AltDirectorySeparatorChar, Path.DirectorySeparatorChar))
        .ToArray();
  }

  private static string[] ReadProjectReferences(string projectPath)
  {
    var document = XDocument.Load(projectPath, LoadOptions.None);
    var projectDirectory = Path.GetDirectoryName(projectPath)!;
    return document.Descendants("ProjectReference")
        .Select(element => element.Attribute("Include")?.Value)
        .Where(value => !string.IsNullOrWhiteSpace(value))
        .Select(value => Path.GetFullPath(value!, projectDirectory))
        .Select(path => Path.GetFileNameWithoutExtension(path)!)
        .Order(StringComparer.Ordinal)
        .ToArray();
  }

  private static string FindRepositoryRoot()
  {
    var current = new DirectoryInfo(AppContext.BaseDirectory);
    while (current is not null && !File.Exists(Path.Combine(current.FullName, "TrazActivo.sln")))
    {
      current = current.Parent;
    }

    return current?.FullName ?? throw new DirectoryNotFoundException("TrazActivo.sln was not found.");
  }

  private static void AssertNoFrameworkPrefix(Assembly assembly, params string[] forbiddenPrefixes)
  {
    var references = assembly.GetReferencedAssemblies()
        .Select(reference => reference.Name ?? string.Empty)
        .ToArray();
    Assert.DoesNotContain(references, reference => forbiddenPrefixes.Any(prefix =>
        reference.StartsWith(prefix, StringComparison.Ordinal)));
  }

  private static string[] ProductReferences(Assembly assembly) => assembly
      .GetReferencedAssemblies()
      .Select(reference => reference.Name ?? string.Empty)
      .Where(name => name.StartsWith("TrazActivo.", StringComparison.Ordinal))
      .Order(StringComparer.Ordinal)
      .ToArray();
}
