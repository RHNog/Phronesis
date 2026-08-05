import XCTest
@testable import PhronesisVisionCore

final class VisionAnalyzerTests: XCTestCase {
    func testOutputContractsRemainVersioned() {
        let analysis = VisionAnalysis(ocr: [], featurePrint: "fixture")
        XCTAssertEqual(analysis.schemaVersion, "phronesis.vision-analysis.v1")
        XCTAssertEqual(analysis.ocr, [])
    }

    func testInvalidFeatureArchiveFailsClosed() {
        XCTAssertThrowsError(try VisionAnalyzer().distance(queryArchive: "not-base64", referenceArchive: "also-invalid"))
    }
}
