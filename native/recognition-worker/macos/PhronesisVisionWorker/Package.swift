// swift-tools-version: 6.2
import PackageDescription

let package = Package(
    name: "PhronesisVisionWorker",
    platforms: [.macOS(.v14)],
    products: [
        .library(name: "PhronesisVisionCore", targets: ["PhronesisVisionCore"]),
        .executable(name: "phronesis-vision-worker", targets: ["PhronesisVisionWorkerCLI"]),
    ],
    targets: [
        .target(name: "PhronesisVisionCore"),
        .executableTarget(name: "PhronesisVisionWorkerCLI", dependencies: ["PhronesisVisionCore"]),
        .testTarget(name: "PhronesisVisionCoreTests", dependencies: ["PhronesisVisionCore"]),
    ]
)
