export type ToolchainContract = Readonly<{
  nodeMajor: 24;
  packageManager: "npm";
  workspaces: readonly ["apps/*", "packages/*"];
}>;

export const toolchainContract = {
  nodeMajor: 24,
  packageManager: "npm",
  workspaces: ["apps/*", "packages/*"],
} as const satisfies ToolchainContract;
