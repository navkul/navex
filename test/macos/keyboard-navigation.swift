
// Appended to the production source so the checks can exercise native private state
// without shipping a test control channel in the helper.
extension OverlayRowView {
    var testSummary: String { summaryField.stringValue }
}

extension OverlayApp {
    func runKeyboardChecks() {
        snapshotTimer?.invalidate()
        controlTimer?.invalidate()
        func check(_ condition: @autoclosure () -> Bool, _ message: String) {
            fflush(stdout)
            precondition(condition(), message)
            print("PASS \(message)")
        }
        func snapshot(_ entries: [(String, SessionStatus, Bool)]) -> OverlaySnapshot {
            let payload: [String: Any] = [
                "presentation": ["appDisplayName": "Navex Test", "hotkey": "", "width": 384,
                    "maxVisibleRows": 2, "summaryVisible": true, "summaryMaxLines": 2],
                "items": entries.map { id, status, removable -> [String: Any] in
                    var item: [String: Any] = ["type": "show", "sessionId": id, "displayName": "Agent \(id)",
                        "summary": "A longer summary that uses the available width and wraps cleanly.",
                        "status": status.rawValue, "focusCommand": ["executable": "/usr/bin/true", "args": []]]
                    if removable { item["removeCommand"] = ["executable": "/usr/bin/true", "args": []] }
                    return item
                }
            ]
            return try! decoder.decode(OverlaySnapshot.self, from: JSONSerialization.data(withJSONObject: payload))
        }
        let initial: [(String, SessionStatus, Bool)] = [("II", .done, true), ("I", .active, true), ("III", .active, false), ("IV", .active, true)]
        applySnapshot(raw: "initial", snapshot: snapshot(initial), reason: "test", allowSameRaw: true, shouldRender: false)
        stateStore.replace(with: initial.map { $0.0 })
        showOverlay(reason: "test-passive", autoDismiss: true)
        check(overlayWindow?.isKeyWindow == false, "completion presentation does not take keyboard focus")
        check(selectedTarget == OverlayActionTarget(sessionId: "II", action: .open), "opening selects the first arrow")
        check(completionDismissTimer != nil, "passive presentation starts its dismissal timer")
        func buttons(in view: NSView) -> [NSButton] {
            view.subviews.flatMap { child in (child as? NSButton).map { [$0] } ?? buttons(in: child) }
        }
        check(buttons(in: rowsContainer).allSatisfy { abs($0.frame.width - $0.frame.height) < 0.01 }, "action hit areas are square for circular highlights")
        check(actionTargets().count == 7, "navigation skips unavailable remove actions")
        let activeRow = rowsContainer.subviews.compactMap { $0 as? OverlayRowView }.first { $0.sessionId == "I" }!
        let finishedRow = rowsContainer.subviews.compactMap { $0 as? OverlayRowView }.first { $0.sessionId == "II" }!
        let finishedSummary = finishedRow.testSummary
        var rowFrames = [activeRow.testSummary]
        var headerFrames = [headerSubtitle.stringValue]
        for _ in 0..<4 {
            advanceWorkingAnimation()
            rowFrames.append(activeRow.testSummary)
            headerFrames.append(headerSubtitle.stringValue)
        }
        check(rowFrames == ["Working.", "Working..", "Working...", "Working..", "Working."], "working rows animate forward and back through the full dot cycle")
        check(headerFrames == ["3 agents working.", "3 agents working..", "3 agents working...", "3 agents working..", "3 agents working."], "header and row working animations stay synchronized")
        check(rowsContainer.subviews.contains { $0 === activeRow }, "animation ticks update existing rows without rebuilding layout")
        check(finishedRow.testSummary == finishedSummary, "animation leaves completed summaries intact")
        moveSelection(by: -1)
        check(selectedTarget?.sessionId == "II" && selectedTarget?.action == .open, "up clamps at the first arrow")
        moveSelection(by: 1)
        check(selectedTarget == OverlayActionTarget(sessionId: "II", action: .remove), "down moves from arrow to same-row remove")
        check(completionDismissTimer == nil, "navigation cancels automatic dismissal")
        moveSelection(by: 1)
        check(selectedTarget == OverlayActionTarget(sessionId: "I", action: .open), "down then moves to the next arrow")
        let completed: [(String, SessionStatus, Bool)] = [("V", .done, true), ("II", .done, true), ("I", .done, true), ("III", .active, false), ("IV", .active, true)]
        applySnapshot(raw: "completion", snapshot: snapshot(completed), reason: "test-completion", allowSameRaw: true, shouldRender: true)
        check(selectedTarget == OverlayActionTarget(sessionId: "I", action: .open), "new completions retain selected session and action")
        check(completionDismissTimer == nil, "new completions do not restart timer during navigation")
        let completedRow = rowsContainer.subviews.compactMap { $0 as? OverlayRowView }.first { $0.sessionId == "I" }!
        let completionSummary = completedRow.testSummary
        advanceWorkingAnimation()
        check(completionSummary.hasPrefix("A longer summary") && completedRow.testSummary == completionSummary, "finishing a working row restores its completion summary and stops its animation")
        moveSelection(by: 100)
        check(selectedTarget?.action == .remove, "down clamps at the last available action")
        check(scrollView.contentView.bounds.minY > 0, "navigation scrolls offscreen targets into view")
        moveSelection(by: -100)
        check(scrollView.contentView.bounds.minY == 0, "navigation scrolls back to the first action")
        moveSelection(by: 1)
        executeHotkeyController.handleKeyEvent(pressed: true)
        check(items["II"] == nil, "execute invokes the existing remove action")
        check(selectedTarget == OverlayActionTarget(sessionId: "I", action: .open), "removal selects the next remaining arrow")
        moveSelection(by: 1)
        executeHotkeyController.handleKeyEvent(pressed: true)
        check(items["I"] != nil, "holding execute does not remove another session")
        executeHotkeyController.handleKeyEvent(pressed: false)
        executeHotkeyController.handleKeyEvent(pressed: true)
        check(items["I"] == nil, "release and press executes the newly selected action")
        executeHotkeyController.handleKeyEvent(pressed: false)
        let remaining = orderedItems().map(\.sessionId)
        items.removeValue(forKey: selectedTarget!.sessionId)
        reconcileSelection(previousOrder: remaining)
        check(selectedTarget?.action == .open && items[selectedTarget!.sessionId] != nil, "external removal reconciles to an existing arrow")
        hideOverlay(reason: "test-hidden")
        let beforeHiddenAction = items.count
        handleGlobalExecuteHotkey()
        check(items.count == beforeHiddenAction, "hidden overlay cannot execute")
        showOverlay(reason: "test-manual")
        check(keyboardNavigationActive && completionDismissTimer == nil, "manual opening enters persistent navigation")
        hideOverlay(reason: "test-exit", animated: true)
        check(slidingOut || overlayWindow?.isVisible == false, "explicit hide begins overlay dismissal")
        showOverlay(reason: "test-reopen", animated: true)
        check(selectedTarget?.action == .open, "reopening during exit resets to an arrow")
        moveSelection(by: 1)
        check(slideHost == nil, "interaction settles entry before updating visible targets")
        hideOverlay(reason: "test-finish")
        items.removeAll()
        reconcileSelection(previousOrder: [])
        check(selectedTarget == nil && actionTargets().isEmpty, "empty overlays have no executable target")
        moveSelection(by: 1)
        handleGlobalExecuteHotkey()
        check(selectedTarget == nil, "empty navigation and execution safely do nothing")
        print("Native keyboard checks passed")
    }
}

let app = NSApplication.shared
let delegate = OverlayApp()
app.delegate = delegate
DispatchQueue.main.asyncAfter(deadline: .now() + 0.4) {
    delegate.runKeyboardChecks()
    exit(0)
}
app.run()
