import CryptoKit
import Foundation
import XCTest

@testable import Fi8170ProbeCore

final class FrameStoreTests: XCTestCase {
  private var root: URL!

  override func setUpWithError() throws {
    root = FileManager.default.temporaryDirectory
      .appendingPathComponent("fi8170-probe-tests-\(UUID().uuidString)", isDirectory: true)
    try FileManager.default.createDirectory(at: root, withIntermediateDirectories: true)
  }

  override func tearDownWithError() throws {
    if let root {
      try? FileManager.default.removeItem(at: root)
    }
  }

  func testCommitHashesAndAtomicallyPromotesFrame() throws {
    let store = try AtomicFrameStore(outputDirectory: root, sessionID: "session-1")
    let source = store.stagingDirectory.appendingPathComponent("driver-output.jpg")
    try Data("card-frame".utf8).write(to: source)

    let receipt = try store.commit(sourceURL: source, sequence: 1)
    XCTAssertEqual(receipt.sourceName, "driver-output.jpg")
    XCTAssertEqual(receipt.committedName, "frame-000001.jpg")
    XCTAssertEqual(
      receipt.sha256,
      SHA256.hash(data: Data("card-frame".utf8)).map { String(format: "%02x", $0) }.joined()
    )
    XCTAssertEqual(receipt.byteCount, 10)
    XCTAssertFalse(FileManager.default.fileExists(atPath: source.path))
    XCTAssertTrue(
      FileManager.default.fileExists(
        atPath: root.appendingPathComponent(receipt.committedName).path
      )
    )
    try store.finalize()
    XCTAssertFalse(FileManager.default.fileExists(atPath: store.stagingDirectory.path))
  }

  func testCollisionNeverOverwritesExistingFrame() throws {
    let existing = root.appendingPathComponent("frame-000001.jpg")
    try Data("existing".utf8).write(to: existing)
    let store = try AtomicFrameStore(outputDirectory: root, sessionID: "session-2")
    let source = store.stagingDirectory.appendingPathComponent("new.jpg")
    try Data("new-frame".utf8).write(to: source)

    let receipt = try store.commit(sourceURL: source, sequence: 1)
    XCTAssertNotEqual(receipt.committedName, "frame-000001.jpg")
    XCTAssertEqual(try Data(contentsOf: existing), Data("existing".utf8))
  }

  func testRejectsSourceOutsideSessionStaging() throws {
    let store = try AtomicFrameStore(outputDirectory: root, sessionID: "session-3")
    let outside = root.appendingPathComponent("outside.jpg")
    try Data("outside".utf8).write(to: outside)
    XCTAssertThrowsError(try store.commit(sourceURL: outside, sequence: 1)) { error in
      XCTAssertEqual(error as? FrameStoreError, .sourceOutsideStaging)
    }
  }

  func testIngestorIgnoresDuplicateCallback() throws {
    let store = try AtomicFrameStore(outputDirectory: root, sessionID: "session-4")
    let source = store.stagingDirectory.appendingPathComponent("duplicate.jpg")
    try Data("duplicate".utf8).write(to: source)
    let ingestor = FrameIngestor(store: store)

    guard case .committed(let first) = try ingestor.ingest(sourceURL: source) else {
      return XCTFail("Expected first callback to commit.")
    }
    guard case .duplicate(let second) = try ingestor.ingest(sourceURL: source) else {
      return XCTFail("Expected duplicate callback to be ignored.")
    }
    XCTAssertEqual(first, second)
    XCTAssertEqual(ingestor.committedCount, 1)
  }
}
