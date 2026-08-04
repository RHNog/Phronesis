import XCTest

@testable import Fi8170ProbeCore

final class ProbeLifecycleTests: XCTestCase {
  func testHappyProbeLifecycle() throws {
    var lifecycle = ProbeLifecycle()
    try lifecycle.transition(to: .discovering)
    try lifecycle.transition(to: .enumerationComplete)
    try lifecycle.transition(to: .openingSession)
    try lifecycle.transition(to: .ready)
    try lifecycle.transition(to: .closing)
    try lifecycle.transition(to: .completed)
    XCTAssertEqual(lifecycle.state, .completed)
  }

  func testCancellationLifecycle() throws {
    var lifecycle = ProbeLifecycle()
    try lifecycle.transition(to: .discovering)
    try lifecycle.transition(to: .enumerationComplete)
    try lifecycle.transition(to: .openingSession)
    try lifecycle.transition(to: .ready)
    try lifecycle.transition(to: .scanning)
    try lifecycle.transition(to: .cancelling)
    try lifecycle.transition(to: .closing)
    try lifecycle.transition(to: .completed)
    XCTAssertEqual(lifecycle.state, .completed)
  }

  func testInvalidTransitionFailsClosed() {
    var lifecycle = ProbeLifecycle()
    XCTAssertThrowsError(try lifecycle.transition(to: .scanning)) { error in
      XCTAssertEqual(
        error as? ProbeLifecycleError,
        .invalidTransition(from: .idle, to: .scanning)
      )
    }
    XCTAssertEqual(lifecycle.state, .idle)
  }
}
