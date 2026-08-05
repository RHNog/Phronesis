import Foundation
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

public enum VisionAnalyzerError: Error, CustomStringConvertible {
    case imageNotReadable
    case featurePrintUnavailable
    case featurePrintArchiveInvalid

    public var description: String {
        switch self {
        case .imageNotReadable: return "image could not be read"
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

    private func decodeFeaturePrint(_ encoded: String) throws -> VNFeaturePrintObservation {
        guard let data = Data(base64Encoded: encoded),
              let value = try NSKeyedUnarchiver.unarchivedObject(ofClass: VNFeaturePrintObservation.self, from: data)
        else { throw VisionAnalyzerError.featurePrintArchiveInvalid }
        return value
    }
}
