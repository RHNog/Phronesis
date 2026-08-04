import Darwin
import Fi8170ProbeCore
import Fi8170ProbePlatform
import Foundation

let writer: ProbeEventEmitter.Writer = { line in
  print(line)
  fflush(stdout)
}

do {
  let options = try ProbeOptions(arguments: Array(CommandLine.arguments.dropFirst()))
  let emitter = ProbeEventEmitter(writer: writer)
  let probe = ImageCaptureProbe(options: options, emitter: emitter)
  exit(probe.run().rawValue)
} catch {
  let emitter = ProbeEventEmitter(writer: writer)
  var details = ProbeEventDetails()
  details.message = Redactor.safeMessage(String(describing: error))
  emitter.emit(.usageRejected, details: details)
  exit(ProbeExitCode.usage.rawValue)
}
