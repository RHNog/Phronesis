import XCTest
import Vision
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

    func testVisionRequestsBindTheirMainStageToCpu() throws {
        let request = VNRecognizeTextRequest()
        let cpu = try VisionAnalyzer.configureCpuExecution(request)
        XCTAssertEqual(request.computeDevice(for: .main), cpu)
    }

    func testRegionSuggestionsSuppressDuplicatesAndContainingPage() {
        let page = CardRegionSuggestion(x: 0.05, y: 0.05, width: 0.9, height: 0.9, rotationDegrees: 0, confidence: 0.99)
        let first = CardRegionSuggestion(x: 0.10, y: 0.10, width: 0.22, height: 0.30, rotationDegrees: 0, confidence: 0.95)
        let duplicate = CardRegionSuggestion(x: 0.105, y: 0.105, width: 0.22, height: 0.30, rotationDegrees: 0, confidence: 0.80)
        let second = CardRegionSuggestion(x: 0.40, y: 0.11, width: 0.22, height: 0.30, rotationDegrees: 0, confidence: 0.94)
        let ordered = VisionAnalyzer.filterAndOrderRegions([page, second, duplicate, first])
        XCTAssertEqual(ordered.count, 2)
        XCTAssertEqual(ordered.map(\.order), [0, 1])
        XCTAssertEqual(ordered.map(\.x), [0.10, 0.40])
    }

    func testRegionSuggestionsUseTopToBottomReadingOrder() {
        let bottom = CardRegionSuggestion(x: 0.10, y: 0.60, width: 0.22, height: 0.30, rotationDegrees: 0, confidence: 0.9)
        let topRight = CardRegionSuggestion(x: 0.40, y: 0.10, width: 0.22, height: 0.30, rotationDegrees: 0, confidence: 0.9)
        let topLeft = CardRegionSuggestion(x: 0.10, y: 0.11, width: 0.22, height: 0.30, rotationDegrees: 0, confidence: 0.9)
        XCTAssertEqual(VisionAnalyzer.filterAndOrderRegions([bottom, topRight, topLeft]).map(\.x), [0.10, 0.40, 0.10])
    }
}
