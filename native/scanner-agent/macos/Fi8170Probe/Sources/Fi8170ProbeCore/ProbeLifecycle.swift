import Foundation

public enum ProbeLifecycleState: String, Codable {
  case idle
  case discovering
  case enumerationComplete
  case openingSession
  case ready
  case scanning
  case cancelling
  case closing
  case completed
  case failed
}

public enum ProbeLifecycleError: Error, Equatable {
  case invalidTransition(from: ProbeLifecycleState, to: ProbeLifecycleState)
}

public struct ProbeLifecycle {
  public private(set) var state: ProbeLifecycleState = .idle

  public init() {}

  public mutating func transition(to next: ProbeLifecycleState) throws {
    guard Self.allowed[state, default: []].contains(next) else {
      throw ProbeLifecycleError.invalidTransition(from: state, to: next)
    }
    state = next
  }

  private static let allowed: [ProbeLifecycleState: Set<ProbeLifecycleState>] = [
    .idle: [.discovering, .failed],
    .discovering: [.enumerationComplete, .cancelling, .failed],
    .enumerationComplete: [.openingSession, .completed, .failed],
    .openingSession: [.ready, .cancelling, .failed],
    .ready: [.scanning, .closing, .cancelling, .failed],
    .scanning: [.ready, .cancelling, .failed],
    .cancelling: [.closing, .completed, .failed],
    .closing: [.completed, .failed],
    .completed: [],
    .failed: [.closing, .completed],
  ]
}
