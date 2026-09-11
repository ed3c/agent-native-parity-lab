import Foundation
import NativeParityDomain

let gate = NavigationGate(initialPageID: "page-a", initialGeneration: 1)
let proposal = NavigationProposal(operationID: "nav-001", targetPageID: "page-b", sourceGeneration: 1)
precondition(gate.propose(proposal))
let command = gate.approve(operationID: "nav-001")!
precondition(gate.platformCallback(operationID: command.operationID, accepted: true))
precondition(gate.verify(operationID: command.operationID, landedPageID: "page-b") == .applied)

let evidence: [String: Any] = [
    "schema_version": 1,
    "scenario_id": "confirmed-navigation",
    "transitions": gate.transitions.map(\.rawValue),
    "final_state": gate.state.rawValue,
    "dispatch_count": gate.dispatchCount,
    "effect": [
        "operation_id": command.operationID,
        "type": "NAVIGATE",
        "target": command.targetPageID,
    ],
    "platform": "ios",
]

let data = try JSONSerialization.data(withJSONObject: evidence, options: [.sortedKeys])
FileHandle.standardOutput.write(data)
