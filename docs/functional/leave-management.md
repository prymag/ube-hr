# Leave Management

### 1. TL;DR

**Feature Name:** Leave Management

**Goal:** Allow employees to request time off, and managers/admins to approve or reject those requests. Tracks leave balances and history.

**Actors:**

- Employee — submits, cancels own requests
- Manager — approves/rejects requests for their team
- Admin / Super Admin — full control over all requests

**Core Flow:**

1. Employee submits a leave request (type, dates, reason)
2. System validates balance and date conflicts
3. Manager/Admin reviews and approves or rejects
4. On approval, balance is deducted; employee notified
5. Employee may cancel before or after approval (within rules)

**Key Rules:**

- Cannot request more days than available balance
- Cannot submit overlapping requests for the same employee
- Cancellation of approved leave restores balance
- Past-date requests require admin approval
- Manager can only act on requests within their team

---

### 2. Workflow (State Machine)

**States:** `PENDING` → `APPROVED` | `REJECTED` | `CANCELLED`

| From       | To          | Action                                         |
| ---------- | ----------- | ---------------------------------------------- |
| _(none)_   | `PENDING`   | Employee submits request                       |
| `PENDING`  | `APPROVED`  | Manager/Admin approves                         |
| `PENDING`  | `REJECTED`  | Manager/Admin rejects                          |
| `PENDING`  | `CANCELLED` | Employee cancels before decision               |
| `APPROVED` | `CANCELLED` | Employee cancels (if cancellation window open) |
| `APPROVED` | `CANCELLED` | Admin force-cancels                            |

---

### 3. Key Entities

**LeaveRequest**

- `id`, `employeeId`, `leaveTypeId`
- `startDate`, `endDate`, `totalDays` (computed)
- `reason?: string`
- `status: PENDING | APPROVED | REJECTED | CANCELLED`
- `reviewedBy?: userId`, `reviewedAt?: datetime`
- `reviewNote?: string`
- `createdAt`, `cancelledAt?`

**LeaveBalance**

- `id`, `employeeId`, `leaveTypeId`, `year`
- `totalDays`, `usedDays`, `remainingDays` (computed)

**LeaveType**

- `id`, `name` (e.g. Annual, Sick, Unpaid)
- `requiresApproval: boolean`
- `allowsNegativeBalance: boolean` _(Assumption)_

---

### 4. Business Rules

- `totalDays` = count of working days between `startDate` and `endDate` (excludes weekends; public holidays TBD — _Assumption: excluded_)
- Balance check: `remainingDays >= totalDays` unless `allowsNegativeBalance = true`
- Overlap check: no other non-`CANCELLED`/non-`REJECTED` request for same employee covers same date range
- Only `PENDING` requests can be approved/rejected
- Only `PENDING` or `APPROVED` requests can be cancelled
- Cancelling an `APPROVED` request restores `usedDays`
- Managers can only approve/reject requests of employees in their team
- Admins can act on any request
- _Assumption: past-date requests are allowed but flagged; admin approval required_

---

### 5. Edge Cases

- Employee submits a request that spans a public holiday — day count may differ from calendar days
- Employee cancels mid-leave (leave already partially taken) — _Assumption: cancellation only allowed for future-starting leaves_
- Manager is also the employee (self-approval) — _Assumption: not allowed; escalates to Admin_
- Two requests submitted simultaneously for overlapping dates (race condition) — requires DB-level uniqueness check
- Leave type deleted after request submitted — soft-delete only; existing requests unaffected
- Year boundary (e.g. Dec 28–Jan 3) — _Assumption: split across yearly balances by date_

---

### 6. Example Scenarios

**1. Standard approval**
Employee requests 3 days Annual Leave (has 10 remaining) → Manager approves → balance drops to 7, status = `APPROVED`

**2. Insufficient balance**
Employee requests 5 days, has 3 remaining, `allowsNegativeBalance = false` → submission rejected immediately with error

**3. Cancellation restores balance**
Employee has approved 5-day leave, cancels before start date → status = `CANCELLED`, balance restored by 5 days

**4. Rejection with note**
Manager rejects a request with note "Team conflict during sprint" → status = `REJECTED`, employee sees note, balance unchanged

---

### 7. Actions / API

| Method | Endpoint                      | Actor          | Description                      |
| ------ | ----------------------------- | -------------- | -------------------------------- |
| `POST` | `/leave-requests`             | Employee       | Submit new request               |
| `GET`  | `/leave-requests`             | All            | List requests (filtered by role) |
| `GET`  | `/leave-requests/:id`         | All            | Get single request               |
| `POST` | `/leave-requests/:id/approve` | Manager/Admin  | Approve with optional note       |
| `POST` | `/leave-requests/:id/reject`  | Manager/Admin  | Reject with required note        |
| `POST` | `/leave-requests/:id/cancel`  | Employee/Admin | Cancel request                   |
| `GET`  | `/leave-balances`             | Employee/Admin | View balances by year            |
| `GET`  | `/leave-types`                | All            | List available leave types       |
