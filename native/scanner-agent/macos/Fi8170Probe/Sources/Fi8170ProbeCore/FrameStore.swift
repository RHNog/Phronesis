import CryptoKit
import Foundation

public struct FrameReceipt: Codable, Equatable {
  public let sourceName: String
  public let committedName: String
  public let sha256: String
  public let byteCount: Int
  public let frameSequence: Int
}

public enum FrameIngestResult: Equatable {
  case committed(FrameReceipt)
  case duplicate(FrameReceipt)
}

public protocol FrameCommitting {
  var stagingDirectory: URL { get }
  func commit(sourceURL: URL, sequence: Int) throws -> FrameReceipt
  func finalize() throws
}

public enum FrameStoreError: Error, Equatable, CustomStringConvertible {
  case outputIsNotDirectory
  case sourceOutsideStaging
  case sourceMissing
  case unableToRead
  case unableToPromote
  case stagingNotEmpty

  public var description: String {
    switch self {
    case .outputIsNotDirectory:
      return "The explicit output path is not a directory."
    case .sourceOutsideStaging:
      return "The scanner returned a file outside the session staging directory."
    case .sourceMissing:
      return "The scanner transfer file does not exist."
    case .unableToRead:
      return "The scanner transfer file could not be read and hashed."
    case .unableToPromote:
      return "The scanner transfer file could not be atomically promoted."
    case .stagingNotEmpty:
      return "The staging directory still contains incomplete artifacts."
    }
  }
}

public final class AtomicFrameStore: FrameCommitting {
  public let stagingDirectory: URL
  public let outputDirectory: URL

  private let fileManager: FileManager

  public init(
    outputDirectory: URL,
    sessionID: String,
    fileManager: FileManager = .default
  ) throws {
    self.fileManager = fileManager
    self.outputDirectory = outputDirectory.standardizedFileURL

    var isDirectory: ObjCBool = false
    if fileManager.fileExists(atPath: self.outputDirectory.path, isDirectory: &isDirectory) {
      guard isDirectory.boolValue else {
        throw FrameStoreError.outputIsNotDirectory
      }
    } else {
      try fileManager.createDirectory(
        at: self.outputDirectory,
        withIntermediateDirectories: true
      )
    }

    let safeSession =
      sessionID
      .lowercased()
      .replacingOccurrences(of: #"[^a-z0-9\-]"#, with: "-", options: .regularExpression)
    self.stagingDirectory = self.outputDirectory
      .appendingPathComponent(".fi8170-probe-staging-\(safeSession)", isDirectory: true)
    try fileManager.createDirectory(
      at: stagingDirectory,
      withIntermediateDirectories: false
    )
  }

  public func commit(sourceURL: URL, sequence: Int) throws -> FrameReceipt {
    let source = sourceURL.standardizedFileURL
    let stagingPath = stagingDirectory.standardizedFileURL.path + "/"
    guard source.path.hasPrefix(stagingPath) else {
      throw FrameStoreError.sourceOutsideStaging
    }
    guard fileManager.fileExists(atPath: source.path) else {
      throw FrameStoreError.sourceMissing
    }

    let digest = try Self.sha256(url: source)
    let pathExtension = source.pathExtension.lowercased()
    let suffix = pathExtension.isEmpty ? "" : ".\(pathExtension)"
    let base = String(format: "frame-%06d", sequence)
    var destination = outputDirectory.appendingPathComponent(base + suffix)
    var collisionIndex = 0

    if fileManager.fileExists(atPath: destination.path) {
      destination = outputDirectory.appendingPathComponent("\(base)-\(digest.prefix(8))\(suffix)")
    }
    while fileManager.fileExists(atPath: destination.path) {
      collisionIndex += 1
      destination = outputDirectory.appendingPathComponent(
        "\(base)-\(digest.prefix(8))-\(collisionIndex)\(suffix)"
      )
    }

    do {
      try fileManager.moveItem(at: source, to: destination)
    } catch {
      throw FrameStoreError.unableToPromote
    }

    guard
      let attributes = try? fileManager.attributesOfItem(atPath: destination.path),
      let size = attributes[.size] as? NSNumber
    else {
      throw FrameStoreError.unableToRead
    }

    return FrameReceipt(
      sourceName: Redactor.safeBasename(source),
      committedName: Redactor.safeBasename(destination),
      sha256: digest,
      byteCount: size.intValue,
      frameSequence: sequence
    )
  }

  public func finalize() throws {
    let contents = try fileManager.contentsOfDirectory(
      at: stagingDirectory,
      includingPropertiesForKeys: nil
    )
    guard contents.isEmpty else {
      throw FrameStoreError.stagingNotEmpty
    }
    try fileManager.removeItem(at: stagingDirectory)
  }

  public static func sha256(url: URL) throws -> String {
    guard let handle = try? FileHandle(forReadingFrom: url) else {
      throw FrameStoreError.unableToRead
    }
    defer {
      try? handle.close()
    }

    var hasher = SHA256()
    do {
      while let chunk = try handle.read(upToCount: 1024 * 1024), !chunk.isEmpty {
        hasher.update(data: chunk)
      }
    } catch {
      throw FrameStoreError.unableToRead
    }
    return hasher.finalize().map { String(format: "%02x", $0) }.joined()
  }
}

public final class FrameIngestor {
  private let store: FrameCommitting
  private var receiptsBySource: [String: FrameReceipt] = [:]
  private var nextSequence = 1

  public init(store: FrameCommitting) {
    self.store = store
  }

  public func ingest(sourceURL: URL) throws -> FrameIngestResult {
    let key = sourceURL.standardizedFileURL.path
    if let receipt = receiptsBySource[key] {
      return .duplicate(receipt)
    }
    let receipt = try store.commit(sourceURL: sourceURL, sequence: nextSequence)
    receiptsBySource[key] = receipt
    nextSequence += 1
    return .committed(receipt)
  }

  public var committedCount: Int {
    receiptsBySource.count
  }

  public func finalize() throws {
    try store.finalize()
  }
}
