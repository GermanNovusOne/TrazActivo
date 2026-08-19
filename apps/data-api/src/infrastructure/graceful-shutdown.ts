export type ShutdownSignal = "SIGINT" | "SIGTERM" | "TEST";

type CloseableApplication = Readonly<{
  close: () => Promise<void>;
}>;

type SignalTarget = Pick<NodeJS.Process, "off" | "once">;

type SafeRecordWriter = (record: Readonly<Record<string, string>>) => void;

function writeRecord(record: Readonly<Record<string, string>>): void {
  process.stdout.write(`${JSON.stringify(record)}\n`);
}

export class GracefulShutdown {
  private stopPromise: Promise<void> | undefined;
  private unregisterSignals: (() => void) | undefined;

  constructor(
    private readonly application: CloseableApplication,
    private readonly applicationName: "data-api",
    private readonly writer: SafeRecordWriter = writeRecord,
  ) {}

  register(signalTarget: SignalTarget = process): () => void {
    const onSigint = () => void this.stop("SIGINT");
    const onSigterm = () => void this.stop("SIGTERM");

    signalTarget.once("SIGINT", onSigint);
    signalTarget.once("SIGTERM", onSigterm);
    this.unregisterSignals = () => {
      signalTarget.off("SIGINT", onSigint);
      signalTarget.off("SIGTERM", onSigterm);
    };

    return this.unregisterSignals;
  }

  stop(signal: ShutdownSignal): Promise<void> {
    this.stopPromise ??= this.closeSafely(signal);
    return this.stopPromise;
  }

  private async closeSafely(signal: ShutdownSignal): Promise<void> {
    try {
      await this.application.close();
      this.writer({
        application: this.applicationName,
        event: "APPLICATION_STOPPED",
        signal,
      });
    } catch {
      process.exitCode = 1;
      process.stderr.write(
        `${JSON.stringify({ application: this.applicationName, event: "APPLICATION_STOP_FAILED" })}\n`,
      );
    } finally {
      this.unregisterSignals?.();
    }
  }
}
