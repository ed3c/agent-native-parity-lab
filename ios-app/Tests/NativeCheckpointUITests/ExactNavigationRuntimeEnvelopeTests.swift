import Foundation
import NativeParityDomain
import XCTest
@testable import NativeCheckpointUI

final class ExactNavigationRuntimeEnvelopeTests: XCTestCase {
    private lazy var fixtureURL: URL = {
        var root = URL(fileURLWithPath: #filePath)
        for _ in 0..<4 { root.deleteLastPathComponent() }
        return root.appendingPathComponent("fixtures/exact-navigation/checkpoint.json")
    }()

    private lazy var fixtureText: String = {
        try! String(contentsOf: fixtureURL, encoding: .utf8)
    }()

    private lazy var fixture: CheckpointFixture = {
        try! JSONDecoder().decode(CheckpointFixture.self, from: Data(fixtureText.utf8))
    }()

    private struct CheckpointFixture: Decodable {
        let operationID: String
        let initialPageID: String
        let targetPageID: String
        let mismatchedPageID: String
        let initialGeneration: Int64
        let staleGeneration: Int64

        enum CodingKeys: String, CodingKey {
            case operationID = "operation_id"
            case initialPageID = "initial_page_id"
            case targetPageID = "target_page_id"
            case mismatchedPageID = "mismatched_page_id"
            case initialGeneration = "initial_generation"
            case staleGeneration = "stale_generation"
        }
    }

    private lazy var probe: ExactNavigationRuntimeProbe = {
        ExactNavigationRuntimeProbe(
            fixtureSha256: RuntimeEnvelope.sha256Hex(fixtureText),
            operationID: fixture.operationID,
            initialPageID: fixture.initialPageID,
            targetPageID: fixture.targetPageID,
            mismatchedPageID: fixture.mismatchedPageID,
            initialGeneration: fixture.initialGeneration,
            staleGeneration: fixture.staleGeneration
        )
    }()

    func testEmitsAcceptedRuntimeEnvelope() throws {
        let json = probe.emitAccepted()
        XCTAssertTrue(json.contains("\"subject\":\"IOS_NATIVE\""))
        XCTAssertTrue(json.contains("\"platform\":\"ios\""))
        XCTAssertTrue(json.contains("\"checkpoint_id\":\"exact-navigation.v1\""))
        XCTAssertTrue(json.contains("\"result\":\"ACCEPTED\""))
        XCTAssertTrue(json.contains("\"effect_count\":1"))
        if let path = ProcessInfo.processInfo.environment["RUNTIME_ENVELOPE_OUT"] {
            try FileManager.default.createDirectory(
                at: URL(fileURLWithPath: path).deletingLastPathComponent(),
                withIntermediateDirectories: true
            )
            try json.write(toFile: path, atomically: true, encoding: .utf8)
        }
    }

    func testControlEnvelopesMatchComparatorExpectations() throws {
        let duplicate = probe.emitDuplicateRejected()
        XCTAssertTrue(duplicate.contains("\"result\":\"REJECTED\""))
        let stale = probe.emitStaleRejected()
        XCTAssertTrue(stale.contains("\"result\":\"REJECTED\""))
        let unknown = probe.emitCallbackMismatchUnknown()
        XCTAssertTrue(unknown.contains("\"result\":\"UNKNOWN\""))
        if let path = ProcessInfo.processInfo.environment["RUNTIME_CONTROLS_OUT"] {
            let payload = """
            {
              "duplicate_dispatch": \(duplicate),
              "stale_approval": \(stale),
              "callback_destination_mismatch": \(unknown)
            }
            """
            try FileManager.default.createDirectory(
                at: URL(fileURLWithPath: path).deletingLastPathComponent(),
                withIntermediateDirectories: true
            )
            try payload.write(toFile: path, atomically: true, encoding: .utf8)
        }
    }
}
