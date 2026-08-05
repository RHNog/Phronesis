import Foundation
import PhronesisVisionCore

struct ErrorOutput: Encodable { let schemaVersion = "phronesis.vision-error.v1"; let error: String }
struct DistanceOutput: Encodable { let schemaVersion = "phronesis.vision-distance.v1"; let distance: Float }

func emit<T: Encodable>(_ value: T) throws {
    let encoder = JSONEncoder()
    encoder.outputFormatting = [.sortedKeys, .withoutEscapingSlashes]
    FileHandle.standardOutput.write(try encoder.encode(value))
    FileHandle.standardOutput.write(Data([0x0A]))
}

let arguments = Array(CommandLine.arguments.dropFirst())
do {
    let analyzer = VisionAnalyzer()
    switch arguments.first {
    case "analyze" where arguments.count == 2:
        try emit(analyzer.analyze(imageURL: URL(fileURLWithPath: arguments[1])))
    case "distance" where arguments.count == 3:
        try emit(DistanceOutput(distance: try analyzer.distance(queryArchive: arguments[1], referenceArchive: arguments[2])))
    default:
        throw NSError(domain: "PhronesisVisionWorker", code: 64, userInfo: [NSLocalizedDescriptionKey: "usage: phronesis-vision-worker analyze <image> | distance <query-feature> <reference-feature>"])
    }
} catch {
    try? emit(ErrorOutput(error: String(describing: error)))
    exit(1)
}
