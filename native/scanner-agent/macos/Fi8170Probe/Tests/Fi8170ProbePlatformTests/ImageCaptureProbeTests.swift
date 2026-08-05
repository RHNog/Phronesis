import ImageCaptureCore
import XCTest

@testable import Fi8170ProbePlatform

final class ImageCaptureProbeTests: XCTestCase {
  func testBrowserMaskIncludesScannerAndLocalUSBBits() {
    let mask = ImageCaptureProbe.localScannerBrowserMask.rawValue

    XCTAssertNotEqual(mask & ICDeviceTypeMask.scanner.rawValue, 0)
    XCTAssertNotEqual(mask & ICDeviceLocationTypeMask.local.rawValue, 0)
  }
}
