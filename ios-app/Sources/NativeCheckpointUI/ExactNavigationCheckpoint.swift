import NativeParityDomain
import SwiftUI

public enum ExactNavigationAccessibility {
    public static let root = "exact-navigation-root"
    public static let state = "exact-navigation-state"
    public static let approve = "exact-navigation-approve"
}

public enum DispatchStatus: String, Equatable {
    case accepted = "ACCEPTED"
    case duplicate = "CHECKPOINT_DUPLICATE_DISPATCH"
}

public struct DispatchReceipt: Equatable {
    public let status: DispatchStatus
    public let operationID: String
}

public protocol NavigationEffectPort: AnyObject {
    func dispatch(_ command: NavigationCommand) -> DispatchReceipt
}

public final class RecordingNavigationEffectPort: NavigationEffectPort {
    private var consumedOperationIDs: Set<String> = []
    public private(set) var commands: [NavigationCommand] = []

    public init() {}

    public func dispatch(_ command: NavigationCommand) -> DispatchReceipt {
        guard consumedOperationIDs.insert(command.operationID).inserted else {
            return DispatchReceipt(status: .duplicate, operationID: command.operationID)
        }
        commands.append(command)
        return DispatchReceipt(status: .accepted, operationID: command.operationID)
    }
}

public final class ExactNavigationCheckpointController {
    private let gate: NavigationGate
    private let effectPort: NavigationEffectPort

    public var state: GateState { gate.state }

    public init(gate: NavigationGate, effectPort: NavigationEffectPort) {
        self.gate = gate
        self.effectPort = effectPort
    }

    @discardableResult
    public func propose(operationID: String, targetPageID: String, sourceGeneration: Int64) -> Bool {
        gate.propose(
            NavigationProposal(
                operationID: operationID,
                targetPageID: targetPageID,
                sourceGeneration: sourceGeneration
            )
        )
    }

    @discardableResult
    public func approve(operationID: String) -> Bool {
        guard let command = gate.approve(operationID: operationID) else { return false }
        return effectPort.dispatch(command).status == .accepted
    }

    public func pageIdentityChanged(pageID: String, generation: Int64) {
        gate.pageIdentityChanged(pageID: pageID, generation: generation)
    }

    @discardableResult
    public func callbackAndObserve(
        operationID: String,
        accepted: Bool,
        landedPageID: String
    ) -> GateState {
        guard gate.platformCallback(operationID: operationID, accepted: accepted) else {
            return gate.state
        }
        return gate.verify(operationID: operationID, landedPageID: landedPageID)
    }
}

public struct ExactNavigationCheckpointView: View {
    private let state: GateState
    private let onApprove: () -> Void

    public init(state: GateState, onApprove: @escaping () -> Void) {
        self.state = state
        self.onApprove = onApprove
    }

    public var body: some View {
        VStack {
            Text("State: \(state.rawValue)")
                .accessibilityIdentifier(ExactNavigationAccessibility.state)
            Button("Approve", action: onApprove)
                .accessibilityIdentifier(ExactNavigationAccessibility.approve)
        }
        .accessibilityIdentifier(ExactNavigationAccessibility.root)
    }
}
