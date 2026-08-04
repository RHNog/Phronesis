// swift-tools-version: 5.10

import PackageDescription

let package = Package(
  name: "Fi8170Probe",
  platforms: [
    .macOS(.v13)
  ],
  products: [
    .library(name: "Fi8170ProbeCore", targets: ["Fi8170ProbeCore"]),
    .executable(name: "fi8170-probe", targets: ["Fi8170ProbeCLI"]),
  ],
  targets: [
    .target(
      name: "Fi8170ProbeCore"
    ),
    .target(
      name: "Fi8170ProbePlatform",
      dependencies: ["Fi8170ProbeCore"],
      linkerSettings: [
        .linkedFramework("ImageCaptureCore")
      ]
    ),
    .executableTarget(
      name: "Fi8170ProbeCLI",
      dependencies: ["Fi8170ProbeCore", "Fi8170ProbePlatform"]
    ),
    .testTarget(
      name: "Fi8170ProbeCoreTests",
      dependencies: ["Fi8170ProbeCore"]
    ),
  ]
)
