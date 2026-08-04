import Foundation
import XCTest

@testable import Fi8170ProbeCore

final class RedactorTests: XCTestCase {
  func testRedactsSerialAndLongHardwareIdentifiers() {
    XCTAssertEqual(
      Redactor.safeDeviceName("fi-8170 Serial: ABC123456789"),
      "fi-8170 Serial:<redacted>"
    )
    XCTAssertEqual(
      Redactor.safeDeviceName("fi-8170 0123456789ABCDEF"),
      "fi-8170 <redacted-id>"
    )
  }

  func testRedactsAbsolutePathsFromMessages() {
    let message = Redactor.safeMessage("failed at /Users/operator/private/file.jpg")
    XCTAssertEqual(message, "failed at <redacted-path>")
  }

  func testBasenameNeverExposesParentPath() {
    let url = URL(fileURLWithPath: "/private/tmp/session/frame-1.jpg")
    XCTAssertEqual(Redactor.safeBasename(url), "frame-1.jpg")
  }

  func testBasenameRedactsEmbeddedSerial() {
    let url = URL(fileURLWithPath: "/private/tmp/session/scan-serial-ABC123456789.jpg")
    XCTAssertEqual(Redactor.safeBasename(url), "scan-serial:<redacted>.jpg")
  }
}
