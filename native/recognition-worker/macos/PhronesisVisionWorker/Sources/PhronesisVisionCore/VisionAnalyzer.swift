import Foundation
import CoreML
import Vision

public struct TextEvidence: Codable, Equatable, Sendable {
    public let text: String
    public let confidence: Float
    public let x: Double
    public let y: Double
    public let width: Double
    public let height: Double

    public init(text: String, confidence: Float, x: Double, y: Double, width: Double, height: Double) {
        self.text = text
        self.confidence = confidence
        self.x = x
        self.y = y
        self.width = width
        self.height = height
    }
}

public struct VisionAnalysis: Codable, Equatable, Sendable {
    public let schemaVersion: String
    public let ocr: [TextEvidence]
    public let featurePrint: String

    public init(schemaVersion: String = "phronesis.vision-analysis.v1", ocr: [TextEvidence], featurePrint: String) {
        self.schemaVersion = schemaVersion
        self.ocr = ocr
        self.featurePrint = featurePrint
    }
}

public struct CardRegionSuggestion: Codable, Equatable, Sendable {
    public let order: Int
    public let x: Double
    public let y: Double
    public let width: Double
    public let height: Double
    public let rotationDegrees: Int
    public let confidence: Float

    public init(order: Int = 0, x: Double, y: Double, width: Double, height: Double,
                rotationDegrees: Int, confidence: Float) {
        self.order = order
        self.x = x
        self.y = y
        self.width = width
        self.height = height
        self.rotationDegrees = rotationDegrees
        self.confidence = confidence
    }
}

public struct VisionRegionDetection: Codable, Equatable, Sendable {
    public let schemaVersion: String
    public let coordinateOrigin: String
    public let regions: [CardRegionSuggestion]

    public init(schemaVersion: String = "phronesis.vision-regions.v1",
                coordinateOrigin: String = "TOP_LEFT", regions: [CardRegionSuggestion]) {
        self.schemaVersion = schemaVersion
        self.coordinateOrigin = coordinateOrigin
        self.regions = regions
    }
}

public enum VisionAnalyzerError: Error, CustomStringConvertible {
    case imageNotReadable
    case cpuComputeDeviceUnavailable
    case featurePrintUnavailable
    case featurePrintArchiveInvalid

    public var description: String {
        switch self {
        case .imageNotReadable: return "image could not be read"
        case .cpuComputeDeviceUnavailable: return "CPU compute device is unavailable"
        case .featurePrintUnavailable: return "Vision did not produce a feature print"
        case .featurePrintArchiveInvalid: return "feature print archive is invalid"
        }
    }
}

public final class VisionAnalyzer: @unchecked Sendable {
    public init() {}

    public func analyze(imageURL: URL) throws -> VisionAnalysis {
        guard imageURL.isFileURL else { throw VisionAnalyzerError.imageNotReadable }
        let textRequest = VNRecognizeTextRequest()
        textRequest.recognitionLevel = .accurate
        textRequest.usesLanguageCorrection = false
        textRequest.recognitionLanguages = ["en-US"]
        let featureRequest = VNGenerateImageFeaturePrintRequest()
        try Self.configureCpuExecution(textRequest)
        try Self.configureCpuExecution(featureRequest)
        let handler = VNImageRequestHandler(url: imageURL, orientation: .up)
        try handler.perform([textRequest, featureRequest])

        let evidence = (textRequest.results ?? []).compactMap { observation -> TextEvidence? in
            guard let candidate = observation.topCandidates(1).first else { return nil }
            let box = observation.boundingBox
            return TextEvidence(text: candidate.string, confidence: candidate.confidence,
                                x: box.origin.x, y: box.origin.y,
                                width: box.size.width, height: box.size.height)
        }
        guard let feature = featureRequest.results?.first as? VNFeaturePrintObservation else {
            throw VisionAnalyzerError.featurePrintUnavailable
        }
        let archive = try NSKeyedArchiver.archivedData(withRootObject: feature, requiringSecureCoding: true)
        return VisionAnalysis(ocr: evidence, featurePrint: archive.base64EncodedString())
    }

    public func distance(queryArchive: String, referenceArchive: String) throws -> Float {
        let query = try decodeFeaturePrint(queryArchive)
        let reference = try decodeFeaturePrint(referenceArchive)
        var distance: Float = 0
        try query.computeDistance(&distance, to: reference)
        return distance
    }

    public func detectRegions(imageURL: URL) throws -> VisionRegionDetection {
        guard imageURL.isFileURL else { throw VisionAnalyzerError.imageNotReadable }
        let request = VNDetectRectanglesRequest()
        request.maximumObservations = 24
        request.minimumAspectRatio = 0.45
        request.maximumAspectRatio = 1.0
        request.minimumSize = 0.08
        request.minimumConfidence = 0.60
        request.quadratureTolerance = 25
        let handler = VNImageRequestHandler(url: imageURL, orientation: .up)
        try handler.perform([request])
        let candidates = (request.results ?? []).map { observation in
            let box = observation.boundingBox
            return CardRegionSuggestion(
                x: box.minX,
                y: 1.0 - box.maxY,
                width: box.width,
                height: box.height,
                rotationDegrees: box.width > box.height ? 90 : 0,
                confidence: observation.confidence
            )
        }
        return VisionRegionDetection(regions: Self.filterAndOrderRegions(candidates))
    }

    @discardableResult
    static func configureCpuExecution(_ request: VNRequest) throws -> MLComputeDevice {
        guard let cpu = MLComputeDevice.allComputeDevices.first(where: { device in
            if case .cpu = device { return true }
            return false
        }) else {
            throw VisionAnalyzerError.cpuComputeDeviceUnavailable
        }
        request.setComputeDevice(cpu, for: .main)
        return cpu
    }

    public static func filterAndOrderRegions(_ candidates: [CardRegionSuggestion]) -> [CardRegionSuggestion] {
        let valid = candidates.filter { region in
            region.x >= 0 && region.y >= 0 && region.width > 0 && region.height > 0 &&
                region.x + region.width <= 1.000_001 && region.y + region.height <= 1.000_001 &&
                region.confidence >= 0 && region.confidence <= 1
        }
        let confidenceOrdered = valid.sorted {
            if $0.confidence != $1.confidence { return $0.confidence > $1.confidence }
            if $0.y != $1.y { return $0.y < $1.y }
            return $0.x < $1.x
        }
        var deduplicated: [CardRegionSuggestion] = []
        for candidate in confidenceOrdered where !deduplicated.contains(where: { intersectionOverUnion(candidate, $0) >= 0.80 }) {
            deduplicated.append(candidate)
        }
        let withoutContainers = deduplicated.filter { candidate in
            let contained = deduplicated.filter { other in
                other != candidate && area(candidate) > area(other) * 1.5 && containsCenter(candidate, other)
            }
            return contained.count < 2
        }
        let verticalOrder = withoutContainers.sorted {
            if centerY($0) != centerY($1) { return centerY($0) < centerY($1) }
            return $0.x < $1.x
        }
        var rows: [[CardRegionSuggestion]] = []
        for candidate in verticalOrder {
            if let last = rows.indices.last {
                let rowCenter = rows[last].map(centerY).reduce(0, +) / Double(rows[last].count)
                let rowHeight = rows[last].map(\.height).reduce(0, +) / Double(rows[last].count)
                let tolerance = max(0.03, min(candidate.height, rowHeight) * 0.40)
                if abs(centerY(candidate) - rowCenter) <= tolerance {
                    rows[last].append(candidate)
                    continue
                }
            }
            rows.append([candidate])
        }
        let readingOrder = rows.flatMap { row in
            row.sorted { lhs, rhs in
                if lhs.x != rhs.x { return lhs.x < rhs.x }
                return lhs.y < rhs.y
            }
        }
        return readingOrder.enumerated().map { index, region in
            CardRegionSuggestion(order: index, x: region.x, y: region.y, width: region.width,
                                 height: region.height, rotationDegrees: region.rotationDegrees,
                                 confidence: region.confidence)
        }
    }

    private static func area(_ region: CardRegionSuggestion) -> Double { region.width * region.height }
    private static func centerY(_ region: CardRegionSuggestion) -> Double { region.y + region.height / 2 }
    private static func containsCenter(_ outer: CardRegionSuggestion, _ inner: CardRegionSuggestion) -> Bool {
        let x = inner.x + inner.width / 2
        let y = inner.y + inner.height / 2
        return x >= outer.x && x <= outer.x + outer.width && y >= outer.y && y <= outer.y + outer.height
    }
    private static func intersectionOverUnion(_ lhs: CardRegionSuggestion, _ rhs: CardRegionSuggestion) -> Double {
        let width = max(0, min(lhs.x + lhs.width, rhs.x + rhs.width) - max(lhs.x, rhs.x))
        let height = max(0, min(lhs.y + lhs.height, rhs.y + rhs.height) - max(lhs.y, rhs.y))
        let intersection = width * height
        let union = area(lhs) + area(rhs) - intersection
        return union > 0 ? intersection / union : 0
    }

    private func decodeFeaturePrint(_ encoded: String) throws -> VNFeaturePrintObservation {
        guard let data = Data(base64Encoded: encoded),
              let value = try NSKeyedUnarchiver.unarchivedObject(ofClass: VNFeaturePrintObservation.self, from: data)
        else { throw VisionAnalyzerError.featurePrintArchiveInvalid }
        return value
    }
}
