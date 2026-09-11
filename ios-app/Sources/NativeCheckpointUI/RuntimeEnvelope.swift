import Foundation
import NativeParityDomain
import CryptoKit

public enum RuntimeEnvelope {
    public static let runtimeClassHost = "HOST"
    public static let runtimeClassEmulator = "EMULATOR"
    public static let runtimeClassSimulator = "SIMULATOR"

    private static let acceptedEvents = [
        "navigation_requested",
        "navigation_approved",
        "navigation_dispatched",
        "navigation_verified",
    ]

    public static func sha256Hex(_ text: String) -> String {
        let digest = SHA256.hash(data: Data(text.utf8))
        return digest.map { String(format: "%02x", $0) }.joined()
    }

    public static func acceptedJSON(
        subject: String,
        platform: String,
        fixtureSha256: String,
        operationID: String,
        destination: String,
        runtimeClass: String
    ) -> String {
        let events = acceptedEvents.enumerated().map { index, name -> String in
            let sequence = index + 1
            let payload =
                "{\"name\":\"\(name)\",\"operationId\":\"\(operationID)\",\"destination\":\"\(destination)\",\"sequence\":\(sequence)}"
            let payloadSha = sha256Hex(payload)
            return "{\"sequence\":\(sequence),\"name\":\"\(name)\",\"operation_id\":\"\(operationID)\",\"destination\":\"\(destination)\",\"payload_sha256\":\"\(payloadSha)\"}"
        }.joined(separator: ",")
        return "{\"subject\":\"\(subject)\",\"platform\":\"\(platform)\",\"runtime_class\":\"\(runtimeClass)\",\"fixture_sha256\":\"\(fixtureSha256)\",\"checkpoint_id\":\"exact-navigation.v1\",\"events\":[\(events)],\"result\":\"ACCEPTED\",\"effect_count\":1}"
    }

    public static func rejectedJSON(
        subject: String,
        platform: String,
        fixtureSha256: String,
        operationID: String,
        destination: String,
        eventName: String,
        runtimeClass: String
    ) -> String {
        let payload =
            "{\"name\":\"\(eventName)\",\"operationId\":\"\(operationID)\",\"destination\":\"\(destination)\",\"sequence\":1}"
        let event =
            "{\"sequence\":1,\"name\":\"\(eventName)\",\"operation_id\":\"\(operationID)\",\"destination\":\"\(destination)\",\"payload_sha256\":\"\(sha256Hex(payload))\"}"
        return "{\"subject\":\"\(subject)\",\"platform\":\"\(platform)\",\"runtime_class\":\"\(runtimeClass)\",\"fixture_sha256\":\"\(fixtureSha256)\",\"checkpoint_id\":\"exact-navigation.v1\",\"events\":[\(event)],\"result\":\"REJECTED\",\"effect_count\":0}"
    }

    public static func unknownJSON(
        subject: String,
        platform: String,
        fixtureSha256: String,
        operationID: String,
        requestedDestination: String,
        observedDestination: String,
        runtimeClass: String
    ) -> String {
        let names = [
            "navigation_requested",
            "navigation_approved",
            "navigation_dispatched",
            "navigation_callback_mismatch",
        ]
        let events = names.enumerated().map { index, name -> String in
            let sequence = index + 1
            let destination = name == "navigation_callback_mismatch" ? observedDestination : requestedDestination
            let payload =
                "{\"name\":\"\(name)\",\"operationId\":\"\(operationID)\",\"destination\":\"\(destination)\",\"sequence\":\(sequence)}"
            return "{\"sequence\":\(sequence),\"name\":\"\(name)\",\"operation_id\":\"\(operationID)\",\"destination\":\"\(destination)\",\"payload_sha256\":\"\(sha256Hex(payload))\"}"
        }.joined(separator: ",")
        return "{\"subject\":\"\(subject)\",\"platform\":\"\(platform)\",\"runtime_class\":\"\(runtimeClass)\",\"fixture_sha256\":\"\(fixtureSha256)\",\"checkpoint_id\":\"exact-navigation.v1\",\"events\":[\(events)],\"result\":\"UNKNOWN\",\"effect_count\":1}"
    }
}

public struct ExactNavigationRuntimeProbe {
    public let fixtureSha256: String
    public let operationID: String
    public let initialPageID: String
    public let targetPageID: String
    public let mismatchedPageID: String
    public let initialGeneration: Int64
    public let staleGeneration: Int64

    public init(
        fixtureSha256: String,
        operationID: String,
        initialPageID: String,
        targetPageID: String,
        mismatchedPageID: String,
        initialGeneration: Int64,
        staleGeneration: Int64
    ) {
        self.fixtureSha256 = fixtureSha256
        self.operationID = operationID
        self.initialPageID = initialPageID
        self.targetPageID = targetPageID
        self.mismatchedPageID = mismatchedPageID
        self.initialGeneration = initialGeneration
        self.staleGeneration = staleGeneration
    }

    public func emitAccepted(
        subject: String = "IOS_NATIVE",
        platform: String = "ios",
        runtimeClass: String = RuntimeEnvelope.runtimeClassHost
    ) -> String {
        let port = RecordingNavigationEffectPort()
        let controller = ExactNavigationCheckpointController(
            gate: NavigationGate(initialPageID: initialPageID, initialGeneration: initialGeneration),
            effectPort: port
        )
        precondition(
            controller.propose(
                operationID: operationID,
                targetPageID: targetPageID,
                sourceGeneration: initialGeneration
            )
        )
        precondition(controller.approve(operationID: operationID))
        precondition(
            controller.callbackAndObserve(
                operationID: operationID,
                accepted: true,
                landedPageID: targetPageID
            ) == .applied
        )
        precondition(port.commands.count == 1)
        return RuntimeEnvelope.acceptedJSON(
            subject: subject,
            platform: platform,
            fixtureSha256: fixtureSha256,
            operationID: operationID,
            destination: targetPageID,
            runtimeClass: runtimeClass
        )
    }

    public func emitDuplicateRejected(
        subject: String = "IOS_NATIVE",
        platform: String = "ios",
        runtimeClass: String = RuntimeEnvelope.runtimeClassHost
    ) -> String {
        let port = RecordingNavigationEffectPort()
        let command = NavigationCommand(operationID: operationID, targetPageID: targetPageID)
        precondition(port.dispatch(command).status == .accepted)
        precondition(port.dispatch(command).status == .duplicate)
        return RuntimeEnvelope.rejectedJSON(
            subject: subject,
            platform: platform,
            fixtureSha256: fixtureSha256,
            operationID: operationID,
            destination: targetPageID,
            eventName: "duplicate_dispatch_rejected",
            runtimeClass: runtimeClass
        )
    }

    public func emitStaleRejected(
        subject: String = "IOS_NATIVE",
        platform: String = "ios",
        runtimeClass: String = RuntimeEnvelope.runtimeClassHost
    ) -> String {
        let port = RecordingNavigationEffectPort()
        let controller = ExactNavigationCheckpointController(
            gate: NavigationGate(initialPageID: initialPageID, initialGeneration: initialGeneration),
            effectPort: port
        )
        _ = controller.propose(
            operationID: operationID,
            targetPageID: targetPageID,
            sourceGeneration: initialGeneration
        )
        controller.pageIdentityChanged(pageID: "page-a-reloaded", generation: staleGeneration)
        precondition(!controller.approve(operationID: operationID))
        precondition(port.commands.isEmpty)
        return RuntimeEnvelope.rejectedJSON(
            subject: subject,
            platform: platform,
            fixtureSha256: fixtureSha256,
            operationID: operationID,
            destination: targetPageID,
            eventName: "stale_approval_rejected",
            runtimeClass: runtimeClass
        )
    }

    public func emitCallbackMismatchUnknown(
        subject: String = "IOS_NATIVE",
        platform: String = "ios",
        runtimeClass: String = RuntimeEnvelope.runtimeClassHost
    ) -> String {
        let port = RecordingNavigationEffectPort()
        let controller = ExactNavigationCheckpointController(
            gate: NavigationGate(initialPageID: initialPageID, initialGeneration: initialGeneration),
            effectPort: port
        )
        precondition(
            controller.propose(
                operationID: operationID,
                targetPageID: targetPageID,
                sourceGeneration: initialGeneration
            )
        )
        precondition(controller.approve(operationID: operationID))
        precondition(
            controller.callbackAndObserve(
                operationID: operationID,
                accepted: true,
                landedPageID: mismatchedPageID
            ) == .unknown
        )
        return RuntimeEnvelope.unknownJSON(
            subject: subject,
            platform: platform,
            fixtureSha256: fixtureSha256,
            operationID: operationID,
            requestedDestination: targetPageID,
            observedDestination: mismatchedPageID,
            runtimeClass: runtimeClass
        )
    }
}
