import Foundation
import XCTest

@testable import Fi8170ProbeCore

final class ProbeEventTests: XCTestCase {
  func testEmitterProducesStableSchemaAndMonotonicSequence() throws {
    var lines: [String] = []
    let fixedDate = Date(timeIntervalSince1970: 1_700_000_000)
    let fixedUUID = UUID(uuidString: "00000000-0000-0000-0000-000000000001")!
    let emitter = ProbeEventEmitter(
      sessionID: "session-1",
      clock: { fixedDate },
      identifier: { fixedUUID },
      writer: { lines.append($0) }
    )

    emitter.emit(.programStarted)
    emitter.emit(.enumerationCompleted)

    XCTAssertEqual(lines.count, 2)
    let decoder = JSONDecoder()
    let first = try decoder.decode(ProbeEvent.self, from: Data(lines[0].utf8))
    let second = try decoder.decode(ProbeEvent.self, from: Data(lines[1].utf8))
    XCTAssertEqual(first.schemaVersion, "phronesis.scanner-probe-event/v1")
    XCTAssertEqual(first.sessionID, "session-1")
    XCTAssertEqual(first.sequence, 1)
    XCTAssertEqual(second.sequence, 2)
    XCTAssertEqual(second.type, .enumerationCompleted)
  }

  func testCapabilityDetailsSortSets() {
    let snapshot = ScannerCapabilitySnapshot(
      functionalUnitType: 3,
      supportedResolutions: [600, 300, 150],
      preferredResolutions: [600, 300],
      supportedBitDepths: [16, 8],
      supportedDocumentTypes: [2, 1],
      currentResolution: 600,
      pixelDataType: 2,
      bitDepth: 8,
      supportsDuplex: true,
      duplexEnabled: false,
      reverseFeederPageOrder: false,
      documentLoaded: true,
      physicalWidth: 8.5,
      physicalHeight: 14
    )
    let details = snapshot.eventDetails()
    XCTAssertEqual(details.supportedResolutions, [150, 300, 600])
    XCTAssertEqual(details.supportedBitDepths, [8, 16])
    XCTAssertTrue(details.supportsDuplex == true)
  }
}
