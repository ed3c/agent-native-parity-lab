package dev.ed3c.nativeparity.checkpoint

import dev.ed3c.nativeparity.GateState
import dev.ed3c.nativeparity.NavigationCommand
import dev.ed3c.nativeparity.NavigationGate
import kotlinx.serialization.json.Json
import kotlinx.serialization.json.jsonObject
import kotlinx.serialization.json.jsonPrimitive
import kotlin.test.Test
import kotlin.test.assertEquals
import kotlin.test.assertFalse
import kotlin.test.assertTrue

class ExactNavigationCheckpointTest {
    private val fixture = Json.parseToJsonElement(
        checkNotNull(javaClass.getResource("/exact-navigation/checkpoint.json")).readText(),
    ).jsonObject

    private val operationId = fixture.getValue("operation_id").jsonPrimitive.content
    private val initialPageId = fixture.getValue("initial_page_id").jsonPrimitive.content
    private val targetPageId = fixture.getValue("target_page_id").jsonPrimitive.content
    private val mismatchedPageId = fixture.getValue("mismatched_page_id").jsonPrimitive.content
    private val initialGeneration = fixture.getValue("initial_generation").jsonPrimitive.content.toLong()
    private val staleGeneration = fixture.getValue("stale_generation").jsonPrimitive.content.toLong()

    private fun subject(): Pair<ExactNavigationCheckpointController, RecordingNavigationEffectPort> {
        val port = RecordingNavigationEffectPort()
        return ExactNavigationCheckpointController(
            NavigationGate(initialPageId, initialGeneration),
            port,
        ) to port
    }

    @Test
    fun exactApprovalDispatchesOnceAndAppliesMatchingPostcondition() {
        val (controller, port) = subject()
        assertTrue(controller.propose(operationId, targetPageId, initialGeneration))
        assertTrue(controller.approve(operationId))
        assertEquals(GateState.APPLIED, controller.callbackAndObserve(operationId, true, targetPageId))
        assertEquals(1, port.commands.size)
    }

    @Test
    fun dispatchWithoutApprovalIsRejected() {
        val (controller, port) = subject()
        assertFalse(controller.approve(operationId))
        assertEquals(GateState.DENIED, controller.state)
        assertEquals(0, port.commands.size)
    }

    @Test
    fun stalePageGenerationRejectsApproval() {
        val (controller, port) = subject()
        controller.propose(operationId, targetPageId, initialGeneration)
        controller.pageIdentityChanged("page-a-reloaded", staleGeneration)
        assertFalse(controller.approve(operationId))
        assertEquals(GateState.PREEMPTED, controller.state)
        assertEquals(0, port.commands.size)
    }

    @Test
    fun mismatchedPostconditionBecomesUnknown() {
        val (controller, port) = subject()
        controller.propose(operationId, targetPageId, initialGeneration)
        controller.approve(operationId)
        assertEquals(GateState.UNKNOWN, controller.callbackAndObserve(operationId, true, mismatchedPageId))
        assertEquals(1, port.commands.size)
    }

    @Test
    fun recordingPortRejectsPlantedDuplicateEffect() {
        val port = RecordingNavigationEffectPort()
        val command = NavigationCommand(operationId, targetPageId)
        assertEquals(DispatchStatus.ACCEPTED, port.dispatch(command).status)
        val duplicate = port.dispatch(command)
        assertEquals(DispatchStatus.CHECKPOINT_DUPLICATE_DISPATCH, duplicate.status)
        assertEquals("CHECKPOINT_DUPLICATE_DISPATCH", duplicate.status.name)
        assertEquals(1, port.commands.size)
    }

    @Test
    fun accessibilityIdentifiersMatchTheSharedCheckpoint() {
        assertEquals("exact-navigation", fixture.getValue("checkpoint_id").jsonPrimitive.content)
        assertEquals("exact-navigation-root", ExactNavigationAccessibility.ROOT)
        assertEquals("exact-navigation-state", ExactNavigationAccessibility.STATE)
        assertEquals("exact-navigation-approve", ExactNavigationAccessibility.APPROVE)
    }
}
