#====================================================================================================
# START - Testing Protocol - DO NOT EDIT OR REMOVE THIS SECTION
#====================================================================================================

# THIS SECTION CONTAINS CRITICAL TESTING INSTRUCTIONS FOR BOTH AGENTS
# BOTH MAIN_AGENT AND TESTING_AGENT MUST PRESERVE THIS ENTIRE BLOCK

# Communication Protocol:
# If the `testing_agent` is available, main agent should delegate all testing tasks to it.
#
# You have access to a file called `test_result.md`. This file contains the complete testing state
# and history, and is the primary means of communication between main and the testing agent.
#
# Main and testing agents must follow this exact format to maintain testing data. 
# The testing data must be entered in yaml format Below is the data structure:
# 
## user_problem_statement: {problem_statement}
## backend:
##   - task: "Task name"
##     implemented: true
##     working: true  # or false or "NA"
##     file: "file_path.py"
##     stuck_count: 0
##     priority: "high"  # or "medium" or "low"
##     needs_retesting: false
##     status_history:
##         -working: true  # or false or "NA"
##         -agent: "main"  # or "testing" or "user"
##         -comment: "Detailed comment about status"
##
## frontend:
##   - task: "Task name"
##     implemented: true
##     working: true  # or false or "NA"
##     file: "file_path.js"
##     stuck_count: 0
##     priority: "high"  # or "medium" or "low"
##     needs_retesting: false
##     status_history:
##         -working: true  # or false or "NA"
##         -agent: "main"  # or "testing" or "user"
##         -comment: "Detailed comment about status"
##
## metadata:
##   created_by: "main_agent"
##   version: "1.0"
##   test_sequence: 0
##   run_ui: false
##
## test_plan:
##   current_focus:
##     - "Task name 1"
##     - "Task name 2"
##   stuck_tasks:
##     - "Task name with persistent issues"
##   test_all: false
##   test_priority: "high_first"  # or "sequential" or "stuck_first"
##
## agent_communication:
##     -agent: "main"  # or "testing" or "user"
##     -message: "Communication message between agents"

# Protocol Guidelines for Main agent
#
# 1. Update Test Result File Before Testing:
#    - Main agent must always update the `test_result.md` file before calling the testing agent
#    - Add implementation details to the status_history
#    - Set `needs_retesting` to true for tasks that need testing
#    - Update the `test_plan` section to guide testing priorities
#    - Add a message to `agent_communication` explaining what you've done
#
# 2. Incorporate User Feedback:
#    - When a user provides feedback that something is or isn't working, add this information to the relevant task's status_history
#    - Update the working status based on user feedback
#    - If a user reports an issue with a task that was marked as working, increment the stuck_count
#    - Whenever user reports issue in the app, if we have testing agent and task_result.md file so find the appropriate task for that and append in status_history of that task to contain the user concern and problem as well 
#
# 3. Track Stuck Tasks:
#    - Monitor which tasks have high stuck_count values or where you are fixing same issue again and again, analyze that when you read task_result.md
#    - For persistent issues, use websearch tool to find solutions
#    - Pay special attention to tasks in the stuck_tasks list
#    - When you fix an issue with a stuck task, don't reset the stuck_count until the testing agent confirms it's working
#
# 4. Provide Context to Testing Agent:
#    - When calling the testing agent, provide clear instructions about:
#      - Which tasks need testing (reference the test_plan)
#      - Any authentication details or configuration needed
#      - Specific test scenarios to focus on
#      - Any known issues or edge cases to verify
#
# 5. Call the testing agent with specific instructions referring to test_result.md
#
# IMPORTANT: Main agent must ALWAYS update test_result.md BEFORE calling the testing agent, as it relies on this file to understand what to test next.

#====================================================================================================
# END - Testing Protocol - DO NOT EDIT OR REMOVE THIS SECTION
#====================================================================================================

user_problem_statement: |
  (Session 3, June 11 2026) Strict test-center -> exam-session filtering on BookingPage:
  Test Center row shows real center name + ID; after selecting a test center the Exam
  Session row must show ONLY that center's sessions (user chose STRICT mode B). Verify
  whole live SVP flow with real login.

frontend:
  - task: "BookingPage strict center->session filtering + session counts + city-all bucket"
    implemented: true
    working: true
    file: "frontend/src/pages/exam/BookingPage.tsx"
    stuck_count: 0
    priority: "high"
    needs_retesting: false
    status_history:
      - working: true
        agent: "main"
        comment: |
          Added sessionCenterIds map (resolved via /exam-sessions/:id details),
          strict filteredSessions (real-{id} -> only matching sessions; city-all ->
          only undisclosed sessions), per-center "Sessions: N"/"No confirmed sessions"
          labels, auto-select prefers real center with confirmed sessions
          (centerAutoPickedRef), no-center-sessions-note, siteId="" for city-all.
          VERIFIED LIVE (real OTP login): Rajshahi 16/06 default=city-all Sessions:1;
          Pabna #201 -> empty session row + note + Site ID 201; back to city-all ->
          session reappears. 23/23 vitest, tsc clean.

  - task: "api.ts single-flight token refresh (fixes SVP session revocation race)"
    implemented: true
    working: true
    file: "frontend/src/lib/api.ts"
    stuck_count: 0
    priority: "high"
    needs_retesting: false
    status_history:
      - working: true
        agent: "main"
        comment: |
          SVP rotates refresh token on every refresh + revokes session on reuse.
          Parallel 401s previously fired concurrent refreshes -> random "Session
          revoked" logouts. Now all callers share one in-flight refresh promise.
          Verified live: full booking-page load with expired access token survived.

  - task: "ReservationsPage shows full real center name via resolver"
    implemented: true
    working: true
    file: "frontend/src/pages/exam/ReservationsPage.tsx"
    stuck_count: 0
    priority: "high"
    needs_retesting: false
    status_history:
      - working: true
        agent: "main"
        comment: "Wired resolver in prior session; unchanged this session."

  - task: "ReservationFlowPage shows full real center name via resolver"
    implemented: true
    working: true
    file: "frontend/src/pages/exam/ReservationFlowPage.tsx"
    stuck_count: 0
    priority: "high"
    needs_retesting: false
    status_history:
      - working: true
        agent: "main"
        comment: "Wired resolver in prior session; unchanged this session."

  - task: "TestCenterBrowsePage shows resolved names + center IDs"
    implemented: true
    working: true
    file: "frontend/src/pages/exam/TestCenterBrowsePage.tsx"
    stuck_count: 0
    priority: "high"
    needs_retesting: false
    status_history:
      - working: true
        agent: "main"
        comment: "Already wired in prior iteration."

  - task: "TestCenterAvailablePage shows resolved names in selects + city panel"
    implemented: true
    working: true
    file: "frontend/src/pages/exam/TestCenterAvailablePage.tsx"
    stuck_count: 0
    priority: "high"
    needs_retesting: false
    status_history:
      - working: true
        agent: "main"
        comment: "Already strict per center key; unchanged this session."

  - task: "BookingPage shows resolved center names in selects + summary"
    implemented: true
    working: true
    file: "frontend/src/pages/exam/BookingPage.tsx"
    stuck_count: 0
    priority: "high"
    needs_retesting: false
    status_history:
      - working: true
        agent: "main"
        comment: "Re-verified live this session alongside strict filtering."

metadata:
  created_by: "main_agent"
  version: "1.2"
  test_sequence: 3
  run_ui: true

test_plan:
  current_focus:
    - "BookingPage strict center->session filtering + session counts + city-all bucket"
    - "api.ts single-flight token refresh (fixes SVP session revocation race)"
  stuck_tasks: []
  test_all: false
  test_priority: "high_first"

agent_communication:
  - agent: "main"
    message: |
      Session 3: strict mode B implemented + LIVE verified with real SVP OTP login.
      Center dropdown shows real names + Site IDs + per-center session counts; selecting
      a real center shows only its confirmed sessions (live: empty + note since SVP hides
      identity pre-booking); explicit "Other {city} sessions" bucket keeps booking possible.
      Also fixed token-refresh race that revoked SVP sessions. 23/23 vitest, tsc clean.
      No backend (FastAPI) changes. Edge functions unchanged.
      LIVE FULL BOOKING after strict changes: Create Hold #3844770 (session 1556481) ->
      Reservation confirmed #4260588 via UI buttons (unpaid draft, no money spent).
  - agent: "main"
    message: |
      Session 3 final UX (user direction): Test Center dropdown = ONLY real centers
      "Name (Site #ID)" (counts/city-all bucket/CityCentersPanel removed from BookingPage).
      Selected center shows sessions available at it (undisclosed sessions bookable there,
      site_id sent at booking); sessions resolved to OTHER centers excluded + note.
      LIVE verified: Pabna #201 -> "Pabna TTC (Site #201) | Session 1", Site ID 201.
      24/24 vitest, tsc clean.
