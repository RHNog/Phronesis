import Foundation

public enum ProbeCommand: String, Codable, CaseIterable {
  case list
  case probe
  case scan
}

public enum ProbeExitCode: Int32 {
  case success = 0
  case usage = 2
  case deviceNotFound = 3
  case sessionFailure = 4
  case scanFailure = 5
  case timedOut = 124
  case cancelled = 130
}

public struct ProbeOptions: Equatable {
  public let command: ProbeCommand
  public let deviceQuery: String
  public let outputDirectory: URL?
  public let allowPhysicalScan: Bool
  public let discoveryTimeout: TimeInterval
  public let sessionTimeout: TimeInterval
  public let scanTimeout: TimeInterval

  public init(
    arguments: [String],
    currentDirectory: URL = URL(fileURLWithPath: FileManager.default.currentDirectoryPath)
  ) throws {
    guard let first = arguments.first, let command = ProbeCommand(rawValue: first.lowercased())
    else {
      throw ProbeOptionsError.missingOrInvalidCommand
    }

    var deviceQuery = "fi-8170"
    var outputDirectory: URL?
    var allowPhysicalScan = false
    var discoveryTimeout: TimeInterval = 5
    var sessionTimeout: TimeInterval = 15
    var scanTimeout: TimeInterval = 180
    var index = 1

    while index < arguments.count {
      let argument = arguments[index]
      switch argument {
      case "--device-query":
        deviceQuery = try Self.value(after: argument, arguments: arguments, index: &index)
      case "--output-directory":
        let path = try Self.value(after: argument, arguments: arguments, index: &index)
        let expanded = NSString(string: path).expandingTildeInPath
        if expanded.hasPrefix("/") {
          outputDirectory = URL(fileURLWithPath: expanded, isDirectory: true)
        } else {
          outputDirectory = currentDirectory.appendingPathComponent(expanded, isDirectory: true)
        }
      case "--allow-physical-scan":
        allowPhysicalScan = true
      case "--discovery-timeout":
        discoveryTimeout = try Self.timeout(after: argument, arguments: arguments, index: &index)
      case "--session-timeout":
        sessionTimeout = try Self.timeout(after: argument, arguments: arguments, index: &index)
      case "--scan-timeout":
        scanTimeout = try Self.timeout(after: argument, arguments: arguments, index: &index)
      default:
        throw ProbeOptionsError.unknownOption(argument)
      }
      index += 1
    }

    let trimmedQuery = deviceQuery.trimmingCharacters(in: .whitespacesAndNewlines)
    guard !trimmedQuery.isEmpty else {
      throw ProbeOptionsError.emptyDeviceQuery
    }

    if command != .scan, outputDirectory != nil || allowPhysicalScan {
      throw ProbeOptionsError.scanOnlyOption
    }
    if command == .scan, outputDirectory == nil {
      throw ProbeOptionsError.outputDirectoryRequired
    }
    if command == .scan, !allowPhysicalScan {
      throw ProbeOptionsError.physicalScanConsentRequired
    }

    self.command = command
    self.deviceQuery = trimmedQuery
    self.outputDirectory = outputDirectory?.standardizedFileURL
    self.allowPhysicalScan = allowPhysicalScan
    self.discoveryTimeout = discoveryTimeout
    self.sessionTimeout = sessionTimeout
    self.scanTimeout = scanTimeout
  }

  private static func value(
    after option: String,
    arguments: [String],
    index: inout Int
  ) throws -> String {
    let valueIndex = index + 1
    guard valueIndex < arguments.count else {
      throw ProbeOptionsError.missingValue(option)
    }
    index = valueIndex
    return arguments[valueIndex]
  }

  private static func timeout(
    after option: String,
    arguments: [String],
    index: inout Int
  ) throws -> TimeInterval {
    let raw = try value(after: option, arguments: arguments, index: &index)
    guard let value = TimeInterval(raw), value > 0, value <= 3600 else {
      throw ProbeOptionsError.invalidTimeout(option)
    }
    return value
  }
}

public enum ProbeOptionsError: Error, Equatable, CustomStringConvertible {
  case missingOrInvalidCommand
  case unknownOption(String)
  case missingValue(String)
  case emptyDeviceQuery
  case invalidTimeout(String)
  case scanOnlyOption
  case outputDirectoryRequired
  case physicalScanConsentRequired

  public var description: String {
    switch self {
    case .missingOrInvalidCommand:
      return "Expected one command: list, probe, or scan."
    case .unknownOption(let option):
      return "Unknown option: \(option)."
    case .missingValue(let option):
      return "Missing value for \(option)."
    case .emptyDeviceQuery:
      return "Device query cannot be empty."
    case .invalidTimeout(let option):
      return "\(option) must be greater than zero and no more than 3600 seconds."
    case .scanOnlyOption:
      return "Physical scan options are valid only with the scan command."
    case .outputDirectoryRequired:
      return "scan requires --output-directory."
    case .physicalScanConsentRequired:
      return "scan requires --allow-physical-scan."
    }
  }
}
