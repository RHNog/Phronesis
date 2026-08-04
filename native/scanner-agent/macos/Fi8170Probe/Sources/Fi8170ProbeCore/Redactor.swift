import Foundation

public enum Redactor {
  public static func safeDeviceName(_ value: String?) -> String {
    guard let value else { return "unnamed-scanner" }
    var result = value.trimmingCharacters(in: .whitespacesAndNewlines)
    result = replacing(
      pattern: #"(?i)\b(serial|s/n|sn)\s*[:#=\-]?\s*[a-z0-9\-]+"#,
      in: result,
      with: "$1:<redacted>"
    )
    result = replacing(
      pattern: #"\b[0-9A-Fa-f]{12,}\b"#,
      in: result,
      with: "<redacted-id>"
    )
    return result.isEmpty ? "unnamed-scanner" : result
  }

  public static func safeMessage(_ value: String) -> String {
    var result = value
    result = replacing(
      pattern: #"(?i)\b(serial|s/n|sn)\s*[:#=\-]?\s*[a-z0-9\-]+"#,
      in: result,
      with: "$1:<redacted>"
    )
    result = replacing(
      pattern: #"(?:/Users|/Volumes|/private|/var|/tmp)/[^\s,;]+"#,
      in: result,
      with: "<redacted-path>"
    )
    return result
  }

  public static func safeBasename(_ url: URL) -> String {
    let name = url.lastPathComponent
    return name.isEmpty ? "unnamed-file" : safeDeviceName(name)
  }

  private static func replacing(pattern: String, in value: String, with replacement: String)
    -> String
  {
    guard let expression = try? NSRegularExpression(pattern: pattern) else {
      return value
    }
    let range = NSRange(value.startIndex..<value.endIndex, in: value)
    return expression.stringByReplacingMatches(
      in: value,
      options: [],
      range: range,
      withTemplate: replacement
    )
  }
}
