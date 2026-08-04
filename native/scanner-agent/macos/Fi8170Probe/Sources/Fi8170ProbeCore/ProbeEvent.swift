import Foundation

public enum ProbeEventType: String, Codable {
  case programStarted = "program.started"
  case usageRejected = "program.usage_rejected"
  case deviceDiscovered = "device.discovered"
  case enumerationCompleted = "device.enumeration_completed"
  case deviceNotFound = "device.not_found"
  case sessionOpening = "session.opening"
  case sessionOpened = "session.opened"
  case capabilityReport = "device.capability_report"
  case scanConsentConfirmed = "scan.consent_confirmed"
  case scanConfigured = "scan.configured"
  case scanStarted = "scan.started"
  case framePersisted = "frame.persisted"
  case duplicateFrameIgnored = "frame.duplicate_ignored"
  case scanCompleted = "scan.completed"
  case sessionClosing = "session.closing"
  case sessionClosed = "session.closed"
  case cancelled = "session.cancelled"
  case failed = "session.failed"
}

public struct ProbeEventDetails: Codable, Equatable {
  public var command: String?
  public var query: String?
  public var message: String?
  public var deviceName: String?
  public var transport: String?
  public var state: String?
  public var sourceName: String?
  public var committedName: String?
  public var sha256: String?
  public var errorDomain: String?
  public var deviceCount: Int?
  public var functionalUnitType: Int?
  public var resolution: Int?
  public var pixelDataType: Int?
  public var bitDepth: Int?
  public var frameSequence: Int?
  public var frameCount: Int?
  public var byteCount: Int?
  public var errorCode: Int?
  public var functionalUnitTypes: [Int]?
  public var supportedResolutions: [Int]?
  public var preferredResolutions: [Int]?
  public var supportedBitDepths: [Int]?
  public var supportedDocumentTypes: [Int]?
  public var supportsDuplex: Bool?
  public var duplexEnabled: Bool?
  public var reverseFeederPageOrder: Bool?
  public var documentLoaded: Bool?
  public var physicalWidth: Double?
  public var physicalHeight: Double?

  public init() {}
}

public struct ProbeEvent: Codable, Equatable {
  public let schemaVersion: String
  public let eventID: String
  public let sessionID: String
  public let sequence: Int
  public let timestamp: String
  public let type: ProbeEventType
  public let details: ProbeEventDetails
}

public final class ProbeEventEmitter {
  public typealias Writer = (String) -> Void

  public let sessionID: String
  private let clock: () -> Date
  private let identifier: () -> UUID
  private let writer: Writer
  private let encoder: JSONEncoder
  private let formatter: ISO8601DateFormatter
  private var nextSequence = 1

  public init(
    sessionID: String = UUID().uuidString.lowercased(),
    clock: @escaping () -> Date = Date.init,
    identifier: @escaping () -> UUID = UUID.init,
    writer: @escaping Writer
  ) {
    self.sessionID = sessionID
    self.clock = clock
    self.identifier = identifier
    self.writer = writer
    self.encoder = JSONEncoder()
    self.encoder.outputFormatting = [.sortedKeys, .withoutEscapingSlashes]
    self.formatter = ISO8601DateFormatter()
    self.formatter.formatOptions = [.withInternetDateTime, .withFractionalSeconds]
  }

  @discardableResult
  public func emit(_ type: ProbeEventType, details: ProbeEventDetails = ProbeEventDetails())
    -> ProbeEvent
  {
    let event = ProbeEvent(
      schemaVersion: "phronesis.scanner-probe-event/v1",
      eventID: identifier().uuidString.lowercased(),
      sessionID: sessionID,
      sequence: nextSequence,
      timestamp: formatter.string(from: clock()),
      type: type,
      details: details
    )
    nextSequence += 1

    if let data = try? encoder.encode(event), let line = String(data: data, encoding: .utf8) {
      writer(line)
    }
    return event
  }
}

public struct ScannerCapabilitySnapshot: Codable, Equatable {
  public let functionalUnitType: Int
  public let supportedResolutions: [Int]
  public let preferredResolutions: [Int]
  public let supportedBitDepths: [Int]
  public let supportedDocumentTypes: [Int]
  public let currentResolution: Int
  public let pixelDataType: Int
  public let bitDepth: Int
  public let supportsDuplex: Bool
  public let duplexEnabled: Bool
  public let reverseFeederPageOrder: Bool
  public let documentLoaded: Bool
  public let physicalWidth: Double
  public let physicalHeight: Double

  public init(
    functionalUnitType: Int,
    supportedResolutions: [Int],
    preferredResolutions: [Int],
    supportedBitDepths: [Int],
    supportedDocumentTypes: [Int],
    currentResolution: Int,
    pixelDataType: Int,
    bitDepth: Int,
    supportsDuplex: Bool,
    duplexEnabled: Bool,
    reverseFeederPageOrder: Bool,
    documentLoaded: Bool,
    physicalWidth: Double,
    physicalHeight: Double
  ) {
    self.functionalUnitType = functionalUnitType
    self.supportedResolutions = supportedResolutions
    self.preferredResolutions = preferredResolutions
    self.supportedBitDepths = supportedBitDepths
    self.supportedDocumentTypes = supportedDocumentTypes
    self.currentResolution = currentResolution
    self.pixelDataType = pixelDataType
    self.bitDepth = bitDepth
    self.supportsDuplex = supportsDuplex
    self.duplexEnabled = duplexEnabled
    self.reverseFeederPageOrder = reverseFeederPageOrder
    self.documentLoaded = documentLoaded
    self.physicalWidth = physicalWidth
    self.physicalHeight = physicalHeight
  }

  public func eventDetails() -> ProbeEventDetails {
    var details = ProbeEventDetails()
    details.functionalUnitType = functionalUnitType
    details.supportedResolutions = supportedResolutions.sorted()
    details.preferredResolutions = preferredResolutions.sorted()
    details.supportedBitDepths = supportedBitDepths.sorted()
    details.supportedDocumentTypes = supportedDocumentTypes.sorted()
    details.resolution = currentResolution
    details.pixelDataType = pixelDataType
    details.bitDepth = bitDepth
    details.supportsDuplex = supportsDuplex
    details.duplexEnabled = duplexEnabled
    details.reverseFeederPageOrder = reverseFeederPageOrder
    details.documentLoaded = documentLoaded
    details.physicalWidth = physicalWidth
    details.physicalHeight = physicalHeight
    return details
  }
}
