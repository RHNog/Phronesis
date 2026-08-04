import Foundation
import XCTest

@testable import Fi8170ProbeCore

final class ProbeOptionsTests: XCTestCase {
  func testListUsesSafeDefaults() throws {
    let options = try ProbeOptions(arguments: ["list"])
    XCTAssertEqual(options.command, .list)
    XCTAssertEqual(options.deviceQuery, "fi-8170")
    XCTAssertNil(options.outputDirectory)
    XCTAssertFalse(options.allowPhysicalScan)
  }

  func testScanRequiresOutputAndExplicitConsent() {
    XCTAssertThrowsError(try ProbeOptions(arguments: ["scan"])) { error in
      XCTAssertEqual(error as? ProbeOptionsError, .outputDirectoryRequired)
    }
    XCTAssertThrowsError(
      try ProbeOptions(arguments: ["scan", "--output-directory", "/private/tmp/probe"])
    ) { error in
      XCTAssertEqual(error as? ProbeOptionsError, .physicalScanConsentRequired)
    }
  }

  func testScanAcceptsExplicitOutputAndConsent() throws {
    let options = try ProbeOptions(arguments: [
      "scan",
      "--output-directory", "/private/tmp/probe",
      "--allow-physical-scan",
      "--scan-timeout", "42",
    ])
    XCTAssertEqual(options.command, .scan)
    XCTAssertEqual(options.outputDirectory?.path, "/private/tmp/probe")
    XCTAssertTrue(options.allowPhysicalScan)
    XCTAssertEqual(options.scanTimeout, 42)
  }

  func testPhysicalOptionsAreRejectedOutsideScan() {
    XCTAssertThrowsError(
      try ProbeOptions(arguments: ["probe", "--allow-physical-scan"])
    ) { error in
      XCTAssertEqual(error as? ProbeOptionsError, .scanOnlyOption)
    }
  }

  func testInvalidTimeoutFailsClosed() {
    XCTAssertThrowsError(
      try ProbeOptions(arguments: ["list", "--discovery-timeout", "0"])
    ) { error in
      XCTAssertEqual(error as? ProbeOptionsError, .invalidTimeout("--discovery-timeout"))
    }
  }
}
