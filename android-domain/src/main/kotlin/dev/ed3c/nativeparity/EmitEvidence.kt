package dev.ed3c.nativeparity

fun main() {
    val gate = NavigationGate(initialPageId = "page-a", initialGeneration = 1)
    val proposal = NavigationProposal("nav-001", "page-b", 1)
    check(gate.propose(proposal))
    val command = checkNotNull(gate.approve("nav-001"))
    check(gate.platformCallback(command.operationId, accepted = true))
    check(gate.verify(command.operationId, landedPageId = "page-b") == GateState.APPLIED)

    val transitions = gate.transitions.joinToString(",") { "\"${it.name}\"" }
    print(
        """{"schema_version":1,"scenario_id":"confirmed-navigation","transitions":[$transitions],"final_state":"${gate.state.name}","dispatch_count":${gate.dispatchCount},"effect":{"operation_id":"${command.operationId}","type":"NAVIGATE","target":"${command.targetPageId}"},"platform":"android"}""",
    )
}
