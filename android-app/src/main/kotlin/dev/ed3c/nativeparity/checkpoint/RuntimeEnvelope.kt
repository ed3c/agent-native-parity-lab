package dev.ed3c.nativeparity.checkpoint

import java.security.MessageDigest

private val ACCEPTED_EVENTS =
    listOf(
        "navigation_requested",
        "navigation_approved",
        "navigation_dispatched",
        "navigation_verified",
    )

object RuntimeEnvelope {
    fun sha256Hex(text: String): String {
        val digest = MessageDigest.getInstance("SHA-256").digest(text.toByteArray(Charsets.UTF_8))
        return digest.joinToString("") { each -> "%02x".format(each) }
    }

    fun acceptedJson(
        subject: String,
        platform: String,
        fixtureSha256: String,
        operationId: String,
        destination: String,
    ): String {
        val events =
            ACCEPTED_EVENTS.mapIndexed { index, name ->
                val sequence = index + 1
                val payload =
                    """{"name":"$name","operationId":"$operationId","destination":"$destination","sequence":$sequence}"""
                """{"sequence":$sequence,"name":"$name","operation_id":"$operationId","destination":"$destination","payload_sha256":"${sha256Hex(payload)}"}"""
            }.joinToString(",")
        return """{"subject":"$subject","platform":"$platform","fixture_sha256":"$fixtureSha256","checkpoint_id":"exact-navigation.v1","events":[$events],"result":"ACCEPTED","effect_count":1}"""
    }

    fun rejectedJson(
        subject: String,
        platform: String,
        fixtureSha256: String,
        operationId: String,
        destination: String,
        eventName: String,
    ): String {
        val payload =
            """{"name":"$eventName","operationId":"$operationId","destination":"$destination","sequence":1}"""
        val event =
            """{"sequence":1,"name":"$eventName","operation_id":"$operationId","destination":"$destination","payload_sha256":"${sha256Hex(payload)}"}"""
        return """{"subject":"$subject","platform":"$platform","fixture_sha256":"$fixtureSha256","checkpoint_id":"exact-navigation.v1","events":[$event],"result":"REJECTED","effect_count":0}"""
    }

    fun unknownJson(
        subject: String,
        platform: String,
        fixtureSha256: String,
        operationId: String,
        requestedDestination: String,
        observedDestination: String,
    ): String {
        val events =
            listOf(
                "navigation_requested",
                "navigation_approved",
                "navigation_dispatched",
                "navigation_callback_mismatch",
            ).mapIndexed { index, name ->
                val sequence = index + 1
                val destination = if (name == "navigation_callback_mismatch") observedDestination else requestedDestination
                val payload =
                    """{"name":"$name","operationId":"$operationId","destination":"$destination","sequence":$sequence}"""
                """{"sequence":$sequence,"name":"$name","operation_id":"$operationId","destination":"$destination","payload_sha256":"${sha256Hex(payload)}"}"""
            }.joinToString(",")
        return """{"subject":"$subject","platform":"$platform","fixture_sha256":"$fixtureSha256","checkpoint_id":"exact-navigation.v1","events":[$events],"result":"UNKNOWN","effect_count":1}"""
    }
}

class ExactNavigationRuntimeProbe(
    private val fixtureSha256: String,
    private val operationId: String,
    private val initialPageId: String,
    private val targetPageId: String,
    private val mismatchedPageId: String,
    private val initialGeneration: Long,
    private val staleGeneration: Long,
) {
    fun emitAccepted(subject: String = "ANDROID_NATIVE", platform: String = "android"): String {
        val port = RecordingNavigationEffectPort()
        val controller =
            ExactNavigationCheckpointController(
                dev.ed3c.nativeparity.NavigationGate(initialPageId, initialGeneration),
                port,
            )
        check(controller.propose(operationId, targetPageId, initialGeneration))
        check(controller.approve(operationId))
        check(controller.callbackAndObserve(operationId, true, targetPageId) == dev.ed3c.nativeparity.GateState.APPLIED)
        check(port.commands.size == 1)
        return RuntimeEnvelope.acceptedJson(subject, platform, fixtureSha256, operationId, targetPageId)
    }

    fun emitDuplicateRejected(subject: String = "ANDROID_NATIVE", platform: String = "android"): String {
        val port = RecordingNavigationEffectPort()
        val command = dev.ed3c.nativeparity.NavigationCommand(operationId, targetPageId)
        check(port.dispatch(command).status == DispatchStatus.ACCEPTED)
        check(port.dispatch(command).status == DispatchStatus.CHECKPOINT_DUPLICATE_DISPATCH)
        return RuntimeEnvelope.rejectedJson(
            subject,
            platform,
            fixtureSha256,
            operationId,
            targetPageId,
            "duplicate_dispatch_rejected",
        )
    }

    fun emitStaleRejected(subject: String = "ANDROID_NATIVE", platform: String = "android"): String {
        val port = RecordingNavigationEffectPort()
        val controller =
            ExactNavigationCheckpointController(
                dev.ed3c.nativeparity.NavigationGate(initialPageId, initialGeneration),
                port,
            )
        controller.propose(operationId, targetPageId, initialGeneration)
        controller.pageIdentityChanged("page-a-reloaded", staleGeneration)
        check(!controller.approve(operationId))
        check(port.commands.isEmpty())
        return RuntimeEnvelope.rejectedJson(
            subject,
            platform,
            fixtureSha256,
            operationId,
            targetPageId,
            "stale_approval_rejected",
        )
    }

    fun emitCallbackMismatchUnknown(subject: String = "ANDROID_NATIVE", platform: String = "android"): String {
        val port = RecordingNavigationEffectPort()
        val controller =
            ExactNavigationCheckpointController(
                dev.ed3c.nativeparity.NavigationGate(initialPageId, initialGeneration),
                port,
            )
        check(controller.propose(operationId, targetPageId, initialGeneration))
        check(controller.approve(operationId))
        check(
            controller.callbackAndObserve(operationId, true, mismatchedPageId) ==
                dev.ed3c.nativeparity.GateState.UNKNOWN,
        )
        return RuntimeEnvelope.unknownJson(
            subject,
            platform,
            fixtureSha256,
            operationId,
            targetPageId,
            mismatchedPageId,
        )
    }
}
