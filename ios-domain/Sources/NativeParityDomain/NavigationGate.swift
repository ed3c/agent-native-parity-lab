public enum GateState: String, Equatable, Sendable {
    case idle = "IDLE"
    case waitingForConfirmation = "WAITING_FOR_CONFIRMATION"
    case executing = "EXECUTING"
    case verifying = "VERIFYING"
    case applied = "APPLIED"
    case denied = "DENIED"
    case preempted = "PREEMPTED"
    case unknown = "UNKNOWN"
}

public struct NavigationProposal: Equatable, Sendable {
    public let operationID: String
    public let targetPageID: String
    public let sourceGeneration: Int64

    public init(operationID: String, targetPageID: String, sourceGeneration: Int64) {
        self.operationID = operationID
        self.targetPageID = targetPageID
        self.sourceGeneration = sourceGeneration
    }
}

public struct NavigationCommand: Equatable, Sendable {
    public let operationID: String
    public let targetPageID: String

    public init(operationID: String, targetPageID: String) {
        self.operationID = operationID
        self.targetPageID = targetPageID
    }
}

public final class NavigationGate {
    public private(set) var state: GateState = .idle
    public private(set) var currentPageID: String
    public private(set) var currentGeneration: Int64
    public private(set) var dispatchCount = 0
    public private(set) var transitions: [GateState] = [.idle]

    private var proposal: NavigationProposal?
    private var dispatchedOperations: Set<String> = []

    public init(initialPageID: String, initialGeneration: Int64) {
        currentPageID = initialPageID
        currentGeneration = initialGeneration
    }

    @discardableResult
    public func propose(_ candidate: NavigationProposal) -> Bool {
        let canStart = state == .idle || state == .applied || state == .denied || state == .preempted
        guard canStart else { return false }
        guard candidate.sourceGeneration == currentGeneration,
              !dispatchedOperations.contains(candidate.operationID) else {
            move(to: .denied)
            return false
        }
        proposal = candidate
        move(to: .waitingForConfirmation)
        return true
    }

    public func approve(operationID: String) -> NavigationCommand? {
        guard state == .waitingForConfirmation,
              let pending = proposal,
              pending.operationID == operationID else {
            if state != .applied && state != .preempted { move(to: .denied) }
            return nil
        }
        guard pending.sourceGeneration == currentGeneration else {
            proposal = nil
            move(to: .preempted)
            return nil
        }
        guard dispatchedOperations.insert(operationID).inserted else {
            move(to: .denied)
            return nil
        }

        dispatchCount += 1
        move(to: .executing)
        return NavigationCommand(operationID: operationID, targetPageID: pending.targetPageID)
    }

    @discardableResult
    public func platformCallback(operationID: String, accepted: Bool) -> Bool {
        guard state == .executing, proposal?.operationID == operationID else { return false }
        move(to: accepted ? .verifying : .unknown)
        return accepted
    }

    @discardableResult
    public func verify(operationID: String, landedPageID: String) -> GateState {
        guard state == .verifying,
              let pending = proposal,
              pending.operationID == operationID else {
            if state != .unknown { move(to: .unknown) }
            return state
        }

        if landedPageID == pending.targetPageID {
            currentPageID = landedPageID
            move(to: .applied)
        } else {
            move(to: .unknown)
        }
        proposal = nil
        return state
    }

    public func userInput() {
        if state == .waitingForConfirmation {
            proposal = nil
            move(to: .preempted)
        }
    }

    public func pageIdentityChanged(pageID: String, generation: Int64) {
        currentPageID = pageID
        currentGeneration = generation
        if state == .waitingForConfirmation {
            proposal = nil
            move(to: .preempted)
        }
    }

    private func move(to next: GateState) {
        state = next
        transitions.append(next)
    }
}
