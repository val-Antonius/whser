# Test Cases Documentation

Based on `docs/SYSTEM_PROMPT.md`, this document contains test cases for 11 modules.
Each module has 18 test cases: 6 Positive, 6 Negative, and 6 Edge.

## 1. POS Module (Transaction Management)

| TC ID | Skenario | Input | Expected Output | Actual Output | Status |
|---|---|---|---|---|---|
| POS-001 | Create standard Wash & Iron order | `customer_id`: "CUST-001", `service`: "WASH_IRON_REG", `weight`: 5.5, `payment`: "CASH" | Order created with status "RECEIVED", Receipt generated, Payment status "PAID" | | |
| POS-002 | Create Dry Clean order (Unit based) | `customer_id`: "CUST-002", `service`: "DRY_CLEAN_SUIT", `qty`: 2, `payment`: "QRIS" | Order created, Total price calc based on unit price * 2, Status "RECEIVED" | | |
| POS-003 | Create Order with Deposit | `customer_id`: "CUST-003", `total`: 50000, `payment_amount`: 25000, `payment_type`: "DEPOSIT" | Order created, Payment Status "PARTIAL", Balance due 25000 | | |
| POS-004 | Add New Customer during POS | `name`: "Budi", `phone`: "08123456789", `address`: "Jl. Merdeka 1" | Customer "Budi" created, ID assigned, auto-selected in current POS session | | |
| POS-005 | Apply Manual Discount (if supported) | `subtotal`: 100000, `discount_amount`: 10000, `auth_pin`: "1234" | Total becomes 90000, Audit log records discount by user | | |
| POS-006 | Reprint Receipt for Past Order | `order_number`: "ORD-2024-001" | Receipt printed matching original transaction logic | | |
| POS-007 | Create Order with Negative Weight | `weight`: -5.0 | Error: "Weight must be greater than 0" | | |
| POS-008 | Create Order without Service Selected | `service`: null, `weight`: 3.0 | Error: "Please select a service type" | | |
| POS-009 | Payment Amount Less than Total (Non-Deposit) | `total`: 50000, `payment`: 40000, `type`: "FULL_PAYMENT" | Error: "Insufficnt payment amount for full payment" | | |
| POS-010 | Invalid Customer Phone Number | `phone`: "abc-123" | Error: "Invalid phone number format" | | |
| POS-011 | Create Order with Deactivated Customer | `customer_id`: "CUST-BANNED" | Error: "Customer is inactive/banned. Cannot create order." | | |
| POS-012 | Zero Price Override without Auth | `price_override`: 0, `auth`: null | Error: "Authorization required for price override" | | |
| POS-013 | Order with 0.001 kg weight | `weight`: 0.001 | System handles precision or enforces Min Weight rule (e.g. min 3kg charge) | | |
| POS-014 | Maximum Integer Weight | `weight`: 999999 | System rejects or processes if valid, checking storage DB limits | | |
| POS-015 | Special Characters in Notes | `notes`: "DROP <script>alert(1)</script>" | Order created, notes sanitized to Safe String, no XSS execution | | |
| POS-016 | 100 Order Items in single transaction | `items`: [Item1...Item100] | Order created successfully, Receipt prints all items correctly or paged | | |
| POS-017 | Rapid Double Click on Submit | Action: Click Submit 2x fast | Only 1 order created (idempotency check), no duplicate billing | | |
| POS-018 | Network Disconnect during Payment | Action: Submit -> Disconnect Wifi | System shows "Connection Error", Order not finalized until reconnected | | |

## 2. Service Module (Workflow Engine)

| TC ID | Skenario | Input | Expected Output | Actual Output | Status |
|---|---|---|---|---|---|
| SVC-001 | Start "Washing" Job | `order_id`: "ORD-001", `job`: "WASH", `status`: "WAITING" -> "IN_PROGRESS" | Job status updates to "IN_PROGRESS", Timestamp recorded, Operator ID logged | | |
| SVC-002 | Complete "Washing" Job | `order_id`: "ORD-001", `job`: "WASH", `status`: "IN_PROGRESS" -> "COMPLETED" | Job status "COMPLETED", Next job (e.g. DRY) becomes "WAITING" | | |
| SVC-003 | Mark Order as Ready for QC | All jobs "COMPLETED" | Order status updates to "READY_FOR_QC" automatically | | |
| SVC-004 | Assign Operator to Job | `job_id`: "JOB-123", `operator_id`: "STAFF-01" | Job assigned to STAFF-01, locked for other users | | |
| SVC-005 | Log Manual Consumable Usage | `job_id`: "JOB-123", `item`: "Detergent", `qty`: 50ml | Inventory deducted, Cost recorded against Job | | |
| SVC-006 | View Service Blueprint | `service_type`: "WASH_IRON_REG" | Displays flow: WASH -> DRY -> IRON -> FOLD -> QC | | |
| SVC-007 | Skip "Washing" Invalid Transition | `status`: "WAITING", Target: "COMPLETED" (skipping "IN_PROGRESS") | Error: "Invalid status transition. Must be In Progress first." | | |
| SVC-008 | Start "Ironing" before "Washing" done | `job`: "IRON", Dependency "WASH" is "IN_PROGRESS" | Error: "Dependency 'WASH' not completed" | | |
| SVC-009 | Complete Job without Operator | `operator_id`: null | Error: "Operator assignment required to complete job" | | |
| SVC-010 | Invalid Job ID | `job_id`: "NON-EXISTENT" | Error: "Job not found" | | |
| SVC-011 | Access Job of Another Branch | `job_branch`: "B-02", `user_branch`: "B-01" | Error: "Unauthorized access to branch data" | | |
| SVC-012 | Update Status on Closed Order | `order_status`: "CLOSED", Action: Start Job | Error: "Cannot modify jobs for closed order" | | |
| SVC-013 | Concurrent Job Start | Two operators start same job simultaneously | First request succeeds, second fails with "Job already locked/in-progress" | | |
| SVC-014 | Zero Duration Job | Start -> Immediate Complete (0s) | Warning or Block depending on config, Log timestamp difference | | |
| SVC-015 | Max Note Length on Job | `notes`: String(5000 chars) | System truncates or validation error "Max 1000 chars" | | |
| SVC-016 | QC Fail Loop | QC Fail -> Reprocess -> QC Fail -> Reprocess | System tracks multiple reprocess cycles, status history highlights loop | | |
| SVC-017 | Operator Delete | Operator User Deleted while Job Active | Job remains valid, Operator name preserved in history or "Unknown" | | |
| SVC-018 | Service Type Change Mid-Process | Action: Change Service Wait -> Express | Logic to re-calculate SLA, potentially reset/re-map jobs | | |

## 3. Order Module (Lifecycle Manager)

| TC ID | Skenario | Input | Expected Output | Actual Output | Status |
|---|---|---|---|---|---|
| ORD-001 | Order Status Lifecycle: Received to Closed | Steps: Received->Processing->QC->Ready->PickedUp->Closed | All transitions succeed, timestamps logged, Final status "CLOSED" | | |
| ORD-002 | Search Order by Number | `query`: "ORD-2024-001" | Returns exact order details | | |
| ORD-003 | Filter Orders by Status | `status`: "READY_FOR_PICKUP" | Returns list of orders only in that status | | |
| ORD-004 | View Order Detail | `order_id`: "ORD-001" | Shows items, timeline, payment info, customer info | | |
| ORD-005 | Cancel Order (Authorized) | `reason`: "Customer request", `auth`: "Admin" | Status "CANCELLED", Inventory allocated reversed (if any) | | |
| ORD-006 | Estimate SLA Time | `service`: "EXPRESS", `created`: 10:00 | Returns SLA Target: 14:00 (4 hours) | | |
| ORD-007 | Cancel Completed Order | `status`: "COMPLETED" | Error: "Cannot cancel completed order. Use Refund/Void instead." | | |
| ORD-008 | Order Number Duplicate | Force create existing ID (backend) | Error: "Unique Constraint Violation" | | |
| ORD-009 | Search with Empty Query | `query`: "" | Returns default list (e.g. recent orders) or "Please enter query" | | |
| ORD-010 | Invalid Status Update | Manual API call status: "INVALID_STATE" | Error: "Invalid status value" | | |
| ORD-011 | View Order Non-Existent | `id`: "999999" | Error: "Order not found" | | |
| ORD-012 | SLA Calculation for Past Date | `created_at`: "2020-01-01" | System calculates based on rules, flagged as Overdue immediately | | |
| ORD-013 | 10,000 Orders Query | List all orders (pagination test) | Returns page 1 (50 items), Load time < 200ms | | |
| ORD-014 | Order with SQL Injection in Note | `note`: "'; DROP TABLE orders; --" | Text saved literally, no SQL executed | | |
| ORD-015 | Leap Year SLA Calculation | `date`: "2024-02-29" | SLA adds hours/days correctly crossing Feb-Mar boundary | | |
| ORD-016 | Cross-Timezone Order | Server UTC, User GMT+7 | Dates displayed correctly in User Local Time | | |
| ORD-017 | Unicode Characters in Order | `customer`: "名前 Name" | Saved and displayed correctly (UTF-8 support) | | |
| ORD-018 | Update SLA manually | `new_sla`: "+2 hours", `reason`: "Machine breakdown" | SLA updated, audit log records reason | | |

## 4. Inventory Module

| TC ID | Skenario | Input | Expected Output | Actual Output | Status |
|---|---|---|---|---|---|
| INV-001 | Add New Item | `name`: "Detergent A", `sku`: "DET-001", `unit`: "L", `min_stock`: 10 | Item created in master data | | |
| INV-002 | Stock In (Purchase) | `sku`: "DET-001", `qty`: +100, `cost`: 500000 | Stock = 100, Moving Avg Cost calculated, Transaction Logged | | |
| INV-003 | Stock Out (Usage) | `sku`: "DET-001", `qty`: -5, `reason`: "Usage" | Stock = 95, Transaction Logged | | |
| INV-004 | Low Stock Alert | `stock`: 100, `out`: 95, `min`: 10 | Stock = 5, Alert "Low Stock: Detergent A" triggered | | |
| INV-005 | View Stock Mutation Report | `period`: "This Month" | Shows Opening, In, Out, Closing balance correctly | | |
| INV-006 | Edit Item Details | `sku`: "DET-001", Update `name`: "Super Detergent" | Name updated, ID/SKU remains same | | |
| INV-007 | Stock Out more than Balance | `balance`: 10, `out`: 15 | Error: "Insufficient stock. Current: 10" (unless negative stock allowed) | | |
| INV-008 | Add Duplicate SKU | `sku`: "EXISTING-001" | Error: "SKU already exists" | | |
| INV-009 | Negative Price input | `cost`: -5000 | Error: "Cost cannot be negative" | | |
| INV-010 | Invalid Unit Type | `unit`: "UNKNOWN_TYPE" | Error: "Select valid unit (kg, l, pcs)" | | |
| INV-011 | Delete Item with Transactions | `id`: "USED-ITEM" | Error: "Cannot delete item with history. Deactivate instead." | | |
| INV-012 | Zero Qty Adjustment | `qty`: 0 | Error: "Quantity cannot be zero" | | |
| INV-013 | Decimal Precision Storage | `qty`: 1.123456 | System stores to defined precision (e.g. 2 or 3 decimals), rounds display | | |
| INV-014 | High Volume Transaction | Add 1,000,000 units | System handles large number, total cost calculation handles overflow protection | | |
| INV-015 | Concurrent Stock Updates | User A In +10, User B Out -5 | Final balance reflects +5 accurately (Row Locking) | | |
| INV-016 | Special Characters in SKU | `sku`: "DET/001#A" | accepted or rejected based on regex, URL safe encoding in API | | |
| INV-017 | Cost Attribution Service Link | Link Item X to Service Y (0.1/kg) | Service Y order creates est. consumption of Item X | | |
| INV-018 | Bulk Import Items | Upload CSV with 50 items | All valid items created, report errors for invalid rows | | |

## 5. Dashboard (Admin) Module

| TC ID | Skenario | Input | Expected Output | Actual Output | Status |
|---|---|---|---|---|---|
| ADM-001 | View Daily Sales Widget | Open Dashboard | Shows correct Total Sales for T-0 (Today) | | |
| ADM-002 | View Order Status Summary | Open Dashboard | Shows Count of Received, Processing, Ready, etc. | | |
| ADM-003 | Date Range Filter | Select "Last 7 Days" | Metrics update to show data from T-7 to T-0 | | |
| ADM-004 | View Throughput (Kg) | Open Dashboard | Shows Total Weight processed today | | |
| ADM-005 | Popular Services Chart | Open Dashboard | Pie/Bar chart shows service distribution | | |
| ADM-006 | Click "View All Orders" Link | Click Link | Navigates to /admin/orders | | |
| ADM-007 | Future Date Selection | Select "Next Month" | Shows 0 data (or projected if implemented), No Crashes | | |
| ADM-008 | Invalid Date Range | Start: "2024-12-31", End: "2024-01-01" | Error: "Start date must be before End date" | | |
| ADM-009 | Dashboard Access without Login | Access /admin/dashboard | Redirect to /login or 403 Forbidden | | |
| ADM-010 | Data Delay Check | Create Order -> Refresh Dashboard | New order reflected immediately (Time < 1s) | | |
| ADM-011 | Broken Widget API | Mock API 500 error | Widget shows "Failed to load" gracefully, Page remains usable | | |
| ADM-012 | Negative Sales Data | DB contains negative amount | Dashboard handles subtractively or displays alert | | |
| ADM-013 | High Scale Data Visualization | 1000 orders today | Charts render correctly, no UI lag | | |
| ADM-014 | Mobile View Responsiveness | View on 375px width | Widgets stack vertically, readable | | |
| ADM-015 | Empty State (No Data) | New Install / No Orders | Shows 0 values, friendly "No data" message, no broken graphs | | |
| ADM-016 | Browser Zoom 200% | Zoom in | Layout adjusts, text readable | | |
| ADM-017 | Rapid Refresh | F5 10 times | System handles load, API uses caching if applicable | | |
| ADM-018 | Dark Mode Toggle | Switch Theme | Colors invert correctly, charts remain legible | | |

## 6. Customer Module

| TC ID | Skenario | Input | Expected Output | Actual Output | Status |
|---|---|---|---|---|---|
| CST-001 | Create Customer | `name`, `phone` | Saved successfully | | |
| CST-002 | Search Customer | `query`: "Budi" | Returns "Budi" record | | |
| CST-003 | Update Preference | `pref`: "No starch" | Preference saved, shows on next order | | |
| CST-004 | View History | `customer_id`: "CUST-01" | List of past orders displayed | | |
| CST-005 | Calculate Total Spend | Auto-calc | Shows sum of all PAO orders | | |
| CST-006 | Deactivate Customer | Action: Set Status Inactive | Status Inactive, blocked from new orders | | |
| CST-007 | Duplicate Phone Number | `phone`: "Existing Number" | Error: "Phone number already registered" | | |
| CST-008 | Missing Mandatory Field | `name`: "" | Error: "Name is required" | | |
| CST-009 | Invalid Email Format | `email`: "budi@" | Error: "Invalid email" | | |
| CST-010 | Delete Active Customer | Action: Delete | Error: "Cannot delete customer with order history" | | |
| CST-011 | Note too long | `note`: 2000 chars | Error or Truncate | | |
| CST-012 | Search SQL Injection | `query`: "' OR '1'='1" | No data leak, Sanitized query | | |
| CST-013 | Emoji in Name | `name`: "Budi 😃" | Saved correctly (UTF8mb4) | | |
| CST-014 | Very Long Name | `name`: 255 chars | Layout handles wrapping, DB accepts | | |
| CST-015 | Customer with 1000 Orders | View History | History paginates, no timeout | | |
| CST-016 | Merge Customers (if supported) | Merge A into B | Orders transfer, A becomes inactive | | |
| CST-017 | Phone Number Formatting | `phone`: "081-234" | Auto-format to "081234" or standard format | | |
| CST-018 | Export Customer List | Action: Export CSV | Download file, contains all data | | |

## 7. Dashboard Owner Module (Post-Operational)

| TC ID | Skenario | Input | Expected Output | Actual Output | Status |
|---|---|---|---|---|---|
| OWN-001 | View Monthly Report | `period`: "Oct 2024" | Shows consolidated Revenue, Expenses, Profit | | |
| OWN-002 | Drill Down to Week | Click "Week 1" | Shows breakdown for that week | | |
| OWN-003 | View SLA Compliance | Widget | Shows % of on-time orders | | |
| OWN-004 | Compare Periods | "Oct" vs "Sep" | Visual comparison of key metrics | | |
| OWN-005 | View Product Performance | Sort by Margin | Shows highest margin services | | |
| OWN-006 | Export PDF Report | Click Export | PDF generated with charts and tables | | |
| OWN-007 | View Future Period | Period > Current Date | Shows "Data not yet available" or Projection | | |
| OWN-008 | Invalid Comparison | Compare "Day" vs "Year" | Error/Warning: "Incompatible periods" | | |
| OWN-009 | Access Restricted Data | Modify URL to admin section | Access allowed (Owner has full access) or denied if role strict | | |
| OWN-010 | Metric Calculation Error | Data missing for calc | Shows "N/A" or "Insufficient Data" | | |
| OWN-011 | Graph Rendering Fail | Bad data points | Graceful error in widget | | |
| OWN-012 | No Snapshots Available | First login | Shows "No metrics generated yet. Please wait for period end." | | |
| OWN-013 | Large Dataset Analysis | Year-to-Date on 10k orders | Calculation finishes < 3s, Dashboard loads | | |
| OWN-014 | Currency Precision | High value totals | Formatted correctly (Rp 1.500.000,00) | | |
| OWN-015 | Tablet View | iPad Portrait | Grid adjusts to 2 cols, touch targets sizable | | |
| OWN-016 | Login Timeout | Idle 30 mins | Redirect to Login on action | | |
| OWN-017 | Print Print Layout | Ctrl+P | Layout simplifies for A4 printing | | |
| OWN-018 | Widget Reordering | Drag & Drop | Order persists after refresh | | |

## 8. Snapshot Module

| TC ID | Skenario | Input | Expected Output | Actual Output | Status |
|---|---|---|---|---|---|
| SNP-001 | Auto-Create Daily Snapshot | Time: 00:00 | Snapshot created for T-1, Status "LOCKED" | | |
| SNP-002 | Manual Snapshot Trigger | Action: "Create Snapshot Now" | Snapshot created current state, marked "MANUAL" | | |
| SNP-003 | Verify Data Freezing | Edit Order in closed period | Snapshot data remains unchanged | | |
| SNP-004 | View Snapshot List | Page Load | List of generated snapshots by date | | |
| SNP-005 | Snapshot Metadata Check | View Details | Shows Order Count, Rev, Date Range | | |
| SNP-006 | Unlock Snapshot (Restricted) | Action: Unlock | Requires Owner Auth, logs event | | |
| SNP-007 | Create Snapshot Duplicate | Trigger manual on existing period | Error: "Snapshot already exists for this period" | | |
| SNP-008 | Snapshot Empty Period | No orders today | Snapshot created with 0 values | | |
| SNP-009 | Snapshot during Active Writes | Write ops happening | DB Transaction ensures read consistency | | |
| SNP-010 | Delete Snapshot | Action: Delete | Error: "Snapshots are immutable audit records" | | |
| SNP-011 | Corrupt Data Handling | Metric calc fails | Transaction rolls back, Snapshot not created, Alert sent | | |
| SNP-012 | Future Date Snapshot | Date: Tomorrow | Error: "Cannot snapshot future period" | | |
| SNP-013 | Regenerate Snapshot | Action: Force Regen | Updates metrics based on corrected data (Audit Logged) | | |
| SNP-014 | Snapshot Retention | Check old snapshots | Data from 1 year ago still accessible | | |
| SNP-015 | Large Data Snapshot | 5000 orders in period | Job completes < 10s, no timeout | | |
| SNP-016 | Partial Data | System crash mid-day | Snapshot captures available data, flags "Potential Data Loss" if detected | | |
| SNP-017 | Timezone Boundary | 23:59 vs 00:01 | Orders assigned to correct operational day | | |
| SNP-018 | API Access to Snapshot | GET /api/snapshots/latest | Returns JSON data for external integration | | |

## 9. Task Management Module

| TC ID | Skenario | Input | Expected Output | Actual Output | Status |
|---|---|---|---|---|---|
| TSK-001 | Create Task from Recommendation | Select Rec -> "Create Task" | Task form pre-filled, Source linked | | |
| TSK-002 | Assign Task to Admin | `assignee`: "Admin", `due`: "Tomorrow" | Admin notified, Task status "OPEN" | | |
| TSK-003 | Update Task Status | `status`: "IN_PROGRESS" | Timeline updated | | |
| TSK-004 | Complete Task with Note | `status`: "DONE", `result`: "SOP Updated" | Task Closed, Result recorded | | |
| TSK-005 | View Task List | Filter: "My Tasks" | Shows only assigned tasks | | |
| TSK-006 | Reopen Task | Action: Reopen | Status "OPEN", History log added | | |
| TSK-007 | Create Task without Due Date | `due`: null | Allowed or Default set (depending on rule) | | |
| TSK-008 | Assign to Deleted User | `user_id`: "deleted" | Error: "User not found" | | |
| TSK-009 | Empty Description | `desc`: "" | Error: "Description required" | | |
| TSK-010 | Edit Completed Task | Action: Edit | Error: "Cannot edit completed task" | | |
| TSK-011 | Verify Owner-Admin Flow | Owner creates -> Admin views | Admin sees task in Operational Dashboard | | |
| TSK-012 | Filter by Priority | `priority`: "HIGH" | Returns High priority tasks | | |
| TSK-013 | Overdue Task Handling | Date > Due Date | Visual indicator (Red), Status "OVERDUE" | | |
| TSK-014 | Task Attachment | Upload: Image | Image saved and linked to task | | |
| TSK-015 | Max Description Length | 5000 chars | Truncated or Error | | |
| TSK-016 | Concurrent Edit | Two users edit same task | Last write wins or Version Conflict error | | |
| TSK-017 | Link multiple Insights | Select 2 insights | Task linked to both references | | |
| TSK-018 | Delete Task (Owner only) | Action: Delete | Success, soft delete in DB | | |

## 10. Insight Module (LLM)

| TC ID | Skenario | Input | Expected Output | Actual Output | Status |
|---|---|---|---|---|---|
| INS-001 | Generate Insight for Period | `period`: "Oct W1", `metrics`: {...} | List of textual insights generated | | |
| INS-002 | Verify Metric Context | Insight text | Contains actual numbers from metrics (not hallucinations) | | |
| INS-003 | Severity Classification | Significant drop in Rev | Insight tagged "CRITICAL" | | |
| INS-004 | Drill Down Link | Click Insight | Navigates to relevant chart/data | | |
| INS-005 | Insight History | View previous period | Shows historical insights | | |
| INS-006 | Manual Insight Override | Edit text | Text updated, marked "Edited" | | |
| INS-007 | LLM Service Unavailable | Ollama Down | Fallback to rule-based insights or "Analysis Unavailable" message | | |
| INS-008 | Empty Metric Set | No data | Insight: "No data available for analysis" | | |
| INS-009 | Hallucination Check | Input: Sales=100 | Insight should NOT say "Sales increased to 1000" | | |
| INS-010 | Gibberish LLM Output | Mock response validation | System filters or formats raw output | | |
| INS-011 | Cross-Period Insight | Compare W1 vs W2 | Insight mentions trend direction (Up/Down) | | |
| INS-012 | Ignore Insight | Action: Hide/Archives | Insight removed from main view | | |
| INS-013 | Insight Formatting | Markdown in text | Rendered correctly (Bold, Bullet points) | | |
| INS-014 | Long Text Generation | LLM outputs 2000 words | UI handles scrolling/truncation | | |
| INS-015 | Sensitive Data Check | Prompt Injection Attempt | System sanitizes prompt before sending to LLM | | |
| INS-016 | Rate Limit LLM | Rapid requests | Queueing system or "Please wait" | | |
| INS-017 | Language Check | Prompt: Indonesian | Output in Indonesian language | | |
| INS-018 | Feedback Loop | Mark "Not Useful" | Log feedback for prompt tuning | | |

## 11. Recommendations Module (LLM)

| TC ID | Skenario | Input | Expected Output | Actual Output | Status |
|---|---|---|---|---|---|
| REC-001 | Generate Recs from Insights | Insight: "High Rewash Rate" | Rec: "Check Machine Filter / Staff Training" | | |
| REC-002 | Actionable Check | Rec Text | Starts with verb (Check, Update, Review) | | |
| REC-003 | Link to Task | Click "Make Task" | Opens Task Create with Rec content | | |
| REC-004 | Categorization | Rec Attributes | Category: "Maintenance" or "Staffing" | | |
| REC-005 | Reject Recommendation | Action: Dismiss | Rec removed from list | | |
| REC-006 | Prioritization | High Severity Insight | Rec marked "URGENT" | | |
| REC-007 | Irrelevant Recommendation | "Buy Spaceship" | User dismisses, system logs irrelevant count | | |
| REC-008 | Duplicate Recommendations | Recurring issue | System groups or marks "Recurring" | | |
| REC-009 | No Insights Flow | No insights | Zero User Recommendations | | |
| REC-010 | Conflicting Recs | "Increase Price" & "Decrease Price" | User decision required, show both | | |
| REC-011 | Recommendation Constraints | Rule: No IoT suggestions | Output respects negative constraints | | |
| REC-012 | Verify Source Link | Check Rec ID | Links back to triggering Insight ID | | |
| REC-013 | Bulk Accept | Select All -> Create Tasks | Multiple tasks created | | |
| REC-014 | LLM Timeout | Analysis takes > 30s | UI shows "Generating..." then Error/Retry | | |
| REC-015 | Custom Recommendation | User adds manual rec | Saved to list alongside AI recs | | |
| REC-016 | Edit Recommendation | Edit text | Text updated before Task creation | | |
| REC-017 | Impact Estimation | Rec metadata | "Potential Savings: High" (if supported) | | |
| REC-018 | Recommendation Formatting | List format | Rendered as readable list | | |
