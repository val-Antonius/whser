# INITIALIZATION PROMPT: LAUNDRY MANAGEMENT PLATFORM DEVELOPMENT

---
**File Purpose**: This document defines the development roadmap, implementation sequence, and technical specifications for building the laundry management platform.

**Usage Context**: Follow this document sequentially. Each phase builds upon the previous. All completed work must be documented in `CHECKPOINT.md`.

---

## PROJECT CONTEXT

You are now initializing the development of a comprehensive laundry business management platform. This is a thesis/final project prototype with two distinct applications:

1. **Operational Application**: Real-time workflow management for daily laundry operations
2. **Post-Operational Analytics Dashboard**: Period-based analytical insights and managerial task management

## TECHNICAL ENVIRONMENT

### Already Configured
- **Framework**: Next.js with TypeScript (project initialized)
- **Database**: MySQL (accessible via MySQL Workbench)
- **LLM**: Gemma 3 4B (downloaded, running via Ollama locally)

### To Be Configured
- Database schema and connections
- API routes and business logic
- UI components and layouts
- LLM integration wrapper

## PROJECT SCOPE

### Business Context
- **Industry**: Laundry service business
- **Scale**: Single business location
- **Users**: 2 roles only
  - **Admin**: Operates daily workflow (Operational Application)
  - **Owner**: Reviews analytics and manages tasks (Post-Operational Dashboard)
- **Authentication**: None required (role-based access only)

### Core Philosophy
This system is designed around three fundamental truths:

1. **Order is King**: Everything revolves around order lifecycle
2. **Humans Decide, System Supports**: AI assists, never replaces human judgment
3. **Separate Thinking Modes**: Operations (reactive) vs Analytics (reflective)

## DEVELOPMENT PHASES

### PHASE 1: OPERATIONAL APPLICATION (START HERE)

**Objective**: Build complete daily operations management system

#### Module Sequence

##### 1.1 Database Foundation
**Tasks**:
- Design complete database schema
- Create all operational tables:
  - customers
  - orders
  - order_items
  - order_jobs
  - services
  - service_processes
  - inventory_items
  - inventory_transactions
  - inventory_consumption
  - order_status_log
  - users (admin/owner)
- Implement foreign key relationships
- Create indexes for performance
- Add initial seed data (services, inventory items, test users)

**Deliverable**: Complete MySQL schema with sample data

##### 1.2 User Role System
**Tasks**:
- Create users table with role field
- Build role-based routing logic
- Admin → Operational Application routes
- Owner → Post-Operational Dashboard routes
- Simple role selector for prototype

**Deliverable**: Working role-based navigation

##### 1.3 POS Module (Core Features)
**Tasks**:
- Customer search/create interface
- Service selection dropdown
- Weight/quantity input
- Price calculation display
- Order creation with unique number generation
- Payment status recording
- Receipt generation (printable view)
- Order list view with filters

**Critical Flow**:
```
Customer arrives → Search/create customer → Select service → 
Input weight → Calculate price → Record payment → Create order → 
Order handed to Service Management
```

**Deliverable**: Functional POS interface with order creation

##### 1.4 Service Management Module (Core Features)
**Tasks**:
- Service type definition interface
- Service blueprint configuration (process steps)
- Order queue dashboard
- Status update interface
- Process job tracking
- SLA calculation logic
- Order detail view with history
- Status transition validation

**Critical Flow**:
```
Order received → Decompose to jobs → Queue jobs → 
Operator starts job → Job completes → Next job → 
All jobs done → Ready for QC → QC pass → Order completed
```

**Deliverable**: Complete workflow management system

##### 1.5 Customer Management Module (Core)
**Tasks**:
- Customer list with search
- Customer profile page
- Transaction history display
- Customer preferences storage
- Customer notes (persistent)
- Active/inactive status toggle

**Deliverable**: Customer database with history tracking

##### 1.6 Inventory Management Module (Core)
**Tasks**:
- Inventory item master data interface
- Stock in/out recording form
- Current stock level display
- Minimum stock alerts
- Stock movement history
- Simple consumption recording

**Deliverable**: Basic inventory tracking system

##### 1.7 Operational Dashboard (Core Metrics)
**Tasks**:
- Today's order summary
- Active orders count
- Completed orders count
- Revenue summary (daily/weekly/monthly)
- Service breakdown chart
- Order status distribution
- Quick access to pending tasks (later phase)

**Deliverable**: Real-time operational metrics dashboard

##### 1.8 Integration & Flow Testing
**Tasks**:
- Test complete order lifecycle
- Verify status transitions
- Check data consistency
- Validate audit logging
- Fix integration bugs

**Deliverable**: Working end-to-end operational system

### PHASE 2: OPERATIONAL APPLICATION ENHANCEMENT

**Objective**: Add advanced features to operational modules

#### Enhancement Sequence

##### 2.1 Advanced POS Features
- Order cancellation with authorization
- Partial payment handling
- Deposit management
- Transaction void with reason
- Combined/split order handling
- Complex pricing rules
- Minimum charge enforcement

##### 2.2 Advanced Service Management
- Exception handling interface (stain treatment, delays)
- Batch processing logic
- Priority order marking
- Digital checklist per process
- Rewash/redo as cost event
- SLA breach alerts
- Order aging reports

##### 2.3 Advanced Inventory Features
- Service-based consumption estimation
- Variance analysis (ideal vs actual)
- Cost attribution to orders
- Waste/loss tracking with reasons
- Inventory bundling
- Usage reports per period
- Role restrictions for adjustments

##### 2.4 Enhanced Operational Dashboard
- SLA compliance rate
- Rewash/redo rate
- Contribution margin per service
- Productivity proxy indicators
- Capacity utilization metrics
- Complaint trend signals

**Checkpoint**: Full-featured operational system ready for daily use

### PHASE 3: POST-OPERATIONAL ANALYTICS FOUNDATION

**Objective**: Build period-based analytical system

#### Module Sequence

##### 3.1 Data Snapshot System
**Tasks**:
- Create snapshot tables (data_snapshots, analytical_metrics)
- Build snapshot creation logic
- Period definition (daily/weekly/monthly)
- Manual snapshot trigger interface (owner only)
- Snapshot locking mechanism
- Snapshot history view

**Key Logic**:
```sql
-- Example snapshot creation
INSERT INTO data_snapshots (period_start, period_end, snapshot_date, locked)
VALUES ('2024-01-01', '2024-01-07', NOW(), true);

-- Copy operational data to analytical tables
INSERT INTO analytical_order_data 
SELECT * FROM orders 
WHERE created_at BETWEEN '2024-01-01' AND '2024-01-07';
```

**Deliverable**: Working data freezing mechanism

##### 3.2 Analytical Metric Engine
**Tasks**:
- Build metric calculation functions
- Implement baseline comparison logic
- Create metrics:
  - SLA compliance rate
  - Order aging distribution
  - Rewash/reprocess rate
  - Exception frequency
  - Contribution margin
  - Inventory variance
  - Productivity proxy
  - Capacity utilization proxy
- Store calculated metrics in database
- Metric history tracking

**Example Calculation**:
```javascript
const slaComplianceRate = {
  current: completedOnTime / totalOrders,
  baseline: previousPeriodCompliance,
  variance: currentRate - baselineRate,
  significance: Math.abs(variance) > 0.05 ? 'significant' : 'normal'
};
```

**Deliverable**: Automated metric calculation system

##### 3.3 Post-Operational Dashboard UI
**Tasks**:
- Period selector interface
- Metric display cards
- Comparison charts (current vs baseline)
- Trend visualization
- Drill-down to supporting data (read-only)
- Export reports functionality

**Deliverable**: Analytics dashboard with calculated metrics

##### 3.4 Manual Insight Creation
**Tasks**:
- Insight creation form (owner only)
- Insight list view
- Severity level assignment
- Metric linking
- Insight history

**Note**: This is pre-LLM. Owner manually writes insights based on metrics.

**Deliverable**: Insight management system (manual mode)

**Checkpoint**: Post-operational analytics works without AI

### PHASE 4: LLM INTEGRATION (GEMMA 3 4B)

**Objective**: Automate insight and recommendation generation

#### Integration Sequence

##### 4.1 Ollama API Wrapper
**Tasks**:
- Create API client for Ollama
- Test connection to Gemma 3 4B
- Implement retry logic
- Error handling
- Response parsing utilities

**Example Code**:
```typescript
// lib/ollama-client.ts
export async function generateInsight(metrics: AnalyticalMetrics) {
  try {
    const response = await fetch('http://localhost:11434/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'gemma:4b',
        prompt: buildInsightPrompt(metrics),
        stream: false
      })
    });
    return await response.json();
  } catch (error) {
    console.error('Ollama API error:', error);
    return null; // Fallback: manual insight mode
  }
}
```

**Deliverable**: Working Ollama connection

##### 4.2 Insight Generation Prompts
**Tasks**:
- Design prompt template for insight generation
- Include metric context, baseline, variance
- Request structured output (JSON)
- Test with various metric scenarios
- Refine prompts for clarity

**Prompt Template**:
```typescript
const insightPrompt = `
You are analyzing laundry business operational data.

Period: ${period}
Metrics:
- SLA Compliance: ${slaRate}% (Baseline: ${slaBaseline}%, Variance: ${slaVariance}%)
- Rewash Rate: ${rewashRate}% (Baseline: ${rewashBaseline}%, Variance: ${rewashVariance}%)
- Order Aging: ${agingData}

Generate insights in JSON format:
{
  "insights": [
    {
      "statement": "Clear statement of finding",
      "severity": "normal|attention|critical",
      "metrics_involved": ["metric1", "metric2"]
    }
  ]
}

Focus on:
1. Significant deviations (>5% variance)
2. Operational impact
3. Actionable findings
`;
```

**Deliverable**: Reliable insight generation via LLM

##### 4.3 Recommendation Generation
**Tasks**:
- Design recommendation prompt template
- Link recommendations to insights
- Categorize recommendations (SOP, staffing, capacity, pricing)
- Add urgency levels
- Ensure recommendations are actionable

**Prompt Template**:
```typescript
const recommendationPrompt = `
Based on this insight: "${insight.statement}"

Generate actionable recommendations in JSON format:
{
  "recommendations": [
    {
      "action": "Specific action to take",
      "category": "SOP|staffing|capacity|pricing",
      "urgency": "low|medium|high",
      "rationale": "Why this recommendation"
    }
  ]
}

Constraints:
- Recommendations must be executable by humans
- No automated system changes
- Focus on process improvements
`;
```

**Deliverable**: Recommendation engine via LLM

##### 4.4 LLM Response Validation
**Tasks**:
- Parse and validate LLM JSON output
- Handle malformed responses
- Sanitize text content
- Store LLM-generated content with source flag
- Implement manual override capability

**Deliverable**: Robust LLM integration with fallbacks

##### 4.5 Fallback Mechanisms
**Tasks**:
- Rule-based insight generation (backup)
- Manual insight creation always available
- LLM status indicator in UI
- Graceful degradation when Ollama unavailable

**Deliverable**: System works even if LLM fails

**Checkpoint**: Automated insight generation with AI assistance

### PHASE 5: TASK MANAGEMENT SYSTEM

**Objective**: Convert insights/recommendations into executable tasks

#### Task System Sequence

##### 5.1 Task Creation
**Tasks**:
- Create tasks table (with assignments)
- Task creation form in Post-Operational Dashboard
- Link task to insight/recommendation
- Set task priority and deadline
- Owner assigns to Admin

**Database Schema**:
```sql
CREATE TABLE tasks (
  id INT PRIMARY KEY AUTO_INCREMENT,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  insight_id INT,
  recommendation_id INT,
  assigned_to INT, -- admin user_id
  created_by INT,  -- owner user_id
  priority ENUM('low', 'medium', 'high'),
  status ENUM('open', 'in_progress', 'resolved'),
  due_date DATE,
  created_at DATETIME,
  completed_at DATETIME,
  completion_notes TEXT,
  FOREIGN KEY (insight_id) REFERENCES insights(id),
  FOREIGN KEY (recommendation_id) REFERENCES recommendations(id)
);
```

**Deliverable**: Task creation interface for Owner

##### 5.2 Task View in Operational Application
**Tasks**:
- Add "Tasks" tab in Admin interface
- Display assigned tasks
- Show task priority and deadline
- Task detail view with context (linked insight)
- Status update interface
- Completion notes form

**UI Flow for Admin**:
```
Login as Admin → Operational Dashboard → 
Tasks Tab → See assigned tasks → 
Click task → View details and context → 
Start work → Update status → 
Complete with notes
```

**Deliverable**: Task management for Admin

##### 5.3 Task Management Page in Post-Operational Dashboard
**Tasks**:
- Task list view (all tasks)
- Filter by status/priority
- Task creation button
- Task assignment interface
- Task completion tracking
- Task effectiveness metrics (later: did it improve metrics?)

**Deliverable**: Complete task oversight for Owner

##### 5.4 Task Effectiveness Tracking
**Tasks**:
- Link completed task to next period metrics
- Before/after comparison
- Effectiveness indicator
- Task history per recommendation type

**Logic**:
```typescript
// When task completed, mark period
task.completion_period = currentPeriod;

// In next period analysis, compare metrics
const taskEffectiveness = {
  task_id: task.id,
  metric_before: previousPeriodMetric,
  metric_after: currentPeriodMetric,
  improvement: (metricAfter - metricBefore) / metricBefore,
  effective: improvement > 0.05 // 5% improvement threshold
};
```

**Deliverable**: Closed-loop learning system

**Checkpoint**: Complete task management system operational

### PHASE 6: POLISH & FINALIZATION

**Objective**: Production-ready prototype

#### Final Steps

##### 6.1 Cross-Module Integration Testing
- Test all workflows end-to-end
- Verify data consistency across modules
- Check audit trail completeness
- Validate role-based access
- Fix any integration bugs

##### 6.2 UI/UX Refinement
- Consistent design system
- Responsive layouts
- Loading states
- Error messages
- Success confirmations
- Helpful tooltips

##### 6.3 Error Handling & Edge Cases
- Database connection failures
- Ollama unavailability
- Invalid user inputs
- Concurrent data modifications
- Data recovery mechanisms

##### 6.4 Documentation
- System architecture diagram
- Database schema documentation
- API endpoint documentation
- User guide (Admin role)
- User guide (Owner role)
- Developer setup guide

##### 6.5 Demo Data Generation
- Create realistic sample data
- Multiple order scenarios
- Various service types
- Historical data for analytics
- Demonstration script

**Final Deliverable**: Complete, demonstrable laundry management platform

---

## CHECKPOINT DOCUMENTATION REQUIREMENTS

After completing each phase/sub-phase, update `CHECKPOINT.md` with:

### Checkpoint Entry Format
```markdown
## Phase X.Y: [Feature Name]

**Status**: ✅ Complete | 🚧 In Progress | ⏸️ Blocked

**Completed Date**: YYYY-MM-DD

**Files Created:**
- path/to/file1.ts - Description
- path/to/file2.tsx - Description

**Files Modified:**
- path/to/existing.ts - What changed

**Database Changes:**
- New tables: [list]
- Schema modifications: [list]
- Seed data added: [list]

**Functionality Added:**
- Feature 1 description
- Feature 2 description

**Testing Completed:**
- [ ] Unit tests pass
- [ ] Integration test scenario 1
- [ ] Manual testing completed
- [ ] Edge cases handled

**Known Issues:**
- Issue 1 (if any)
- Workaround or plan to fix

**Next Steps:**
- What needs to be done next
- Dependencies or blockers

**Notes:**
- Any important decisions made
- Deviations from plan (with justification)
- Performance considerations
```

### Checkpoint Update Cadence
- Update after each sub-phase completion
- Update when blocked and need to pivot
- Update when significant decisions are made
- Final update at end of each major phase

---

## TECHNICAL IMPLEMENTATION GUIDELINES

### Next.js Project Structure
```
/src
  /app
    /api
      /orders
      /services
      /inventory
      /customers
      /analytics
      /insights
      /recommendations
      /tasks
      /ollama
    /admin           # Operational Application
      /pos
      /services
      /inventory
      /customers
      /dashboard
      /tasks
    /owner           # Post-Operational Dashboard
      /analytics
      /insights
      /recommendations
      /tasks
    layout.tsx
    page.tsx         # Role selector
  /components
    /ui
    /charts
    /forms
  /lib
    /db              # MySQL connection
    /ollama          # LLM integration
    /utils
  /types             # TypeScript interfaces
```

### MySQL Connection Setup
```typescript
// lib/db.ts
import mysql from 'mysql2/promise';

export const pool = mysql.createPool({
  host: 'localhost',
  user: 'your_mysql_user',
  password: 'your_mysql_password',
  database: 'laundry_management',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

export async function query(sql: string, params?: any[]) {
  const [results] = await pool.execute(sql, params);
  return results;
}
```

### API Route Pattern
```typescript
// app/api/orders/route.ts
import { query } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  try {
    const orders = await query('SELECT * FROM orders ORDER BY created_at DESC');
    return NextResponse.json({ success: true, data: orders });
  } catch (error) {
    console.error('Database error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch orders' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    // Validation
    if (!body.customer_id || !body.service_id) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }
    
    // Create order
    const result = await query(
      'INSERT INTO orders (customer_id, service_id, weight, price, status) VALUES (?, ?, ?, ?, ?)',
      [body.customer_id, body.service_id, body.weight, body.price, 'RECEIVED']
    );
    
    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    console.error('Order creation error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create order' },
      { status: 500 }
    );
  }
}
```

### TypeScript Interfaces
```typescript
// types/index.ts

export interface Order {
  id: number;
  order_number: string;
  customer_id: number;
  service_id: number;
  weight: number;
  price: number;
  status: OrderStatus;
  payment_status: PaymentStatus;
  created_at: Date;
  completed_at?: Date;
}

export enum OrderStatus {
  RECEIVED = 'RECEIVED',
  WAITING_FOR_PROCESS = 'WAITING_FOR_PROCESS',
  IN_WASH = 'IN_WASH',
  IN_DRY = 'IN_DRY',
  IN_IRON = 'IN_IRON',
  READY_FOR_QC = 'READY_FOR_QC',
  COMPLETED = 'COMPLETED',
  CLOSED = 'CLOSED'
}

export enum PaymentStatus {
  UNPAID = 'UNPAID',
  PARTIAL = 'PARTIAL',
  PAID = 'PAID'
}

export interface Insight {
  id: number;
  period_id: number;
  statement: string;
  severity: 'normal' | 'attention' | 'critical';
  metrics_involved: string[];
  generated_by: 'system' | 'llm' | 'manual';
  created_at: Date;
}

export interface Task {
  id: number;
  title: string;
  description: string;
  insight_id?: number;
  recommendation_id?: number;
  assigned_to: number;
  created_by: number;
  priority: 'low' | 'medium' | 'high';
  status: 'open' | 'in_progress' | 'resolved';
  due_date: Date;
  created_at: Date;
  completed_at?: Date;
  completion_notes?: string;
}
```

## FIRST STEPS CHECKLIST

When you begin development, follow this sequence:

### Step 1: Database Setup
- [ ] Create MySQL database named `laundry_management`
- [ ] Run schema creation scripts
- [ ] Insert seed data (services, inventory items, test users)
- [ ] Verify connection from Next.js

### Step 2: Project Configuration
- [ ] Install required npm packages (`mysql2`, `@types/mysql2`, etc.)
- [ ] Configure database connection in `lib/db.ts`
- [ ] Set up environment variables (`.env.local`)
- [ ] Test database connection

### Step 3: Basic Routing
- [ ] Create role selector page (root `/`)
- [ ] Create `/admin` route (Operational Application)
- [ ] Create `/owner` route (Post-Operational Dashboard)
- [ ] Implement basic navigation

### Step 4: First Module - POS
- [ ] Create customers API routes
- [ ] Create orders API routes
- [ ] Build POS UI
- [ ] Test order creation flow

### Step 5: Iterative Development
- Follow the phase sequence outlined above
- Test each module before moving to next
- Keep operational system working at all times

## SUCCESS METRICS

Your implementation is on track when:

### Technical Metrics
- [ ] Zero database connection errors
- [ ] All API endpoints return proper status codes
- [ ] No unhandled exceptions in console
- [ ] Page load times < 2 seconds
- [ ] All TypeScript types properly defined

### Functional Metrics
- [ ] Can create order from scratch to completion
- [ ] Status changes log properly
- [ ] Inventory consumption tracked correctly
- [ ] Analytics snapshot works reliably
- [ ] LLM generates valid insights 80%+ of the time
- [ ] Tasks flow between Owner and Admin seamlessly

### User Experience Metrics
- [ ] Admin can complete daily workflow without confusion
- [ ] Owner can understand insights without technical knowledge
- [ ] Error messages are helpful, not cryptic
- [ ] System responds within 1 second for most actions
- [ ] No data loss during normal operations

## IMPORTANT REMINDERS

1. **Start with Phase 1**: Do not jump ahead to analytics or LLM integration
2. **Test incrementally**: Each feature should work before building the next
3. **Database first**: Get schema right early; changing later is costly
4. **Order is king**: Every decision should consider order lifecycle
5. **Human in loop**: Never auto-execute business-critical decisions
6. **LLM is optional**: System must work even if Gemma fails
7. **Separate contexts**: Keep operational and analytical interfaces distinct
8. **Audit everything**: Log all status changes and important actions

## GETTING HELP

When you need clarification:
- Ask about specific implementation details
- Request code examples for complex logic
- Clarify business rules when ambiguous
- Propose solutions and ask for validation

## NOW BEGIN

You have complete context. Start with Phase 1.1: Database Foundation.

Create the complete MySQL schema, explain your design decisions, and provide the SQL scripts to create all tables.

After database is ready, we'll proceed to build the operational application module by module.

Good luck building a system that real laundry businesses could actually use!

---

## FOR CURSOR AI AGENT

### Implementation Protocol
1. **Read both documents** (SYSTEM_PROMPT.md and INITIALIZATION_PROMPT.md) completely
2. **Acknowledge understanding** of the architecture and constraints
3. **Ask clarifying questions** if anything is ambiguous
4. **Propose implementation plan** for current phase before coding
5. **Generate complete code** with all necessary files
6. **Update CHECKPOINT.md** after each completion
7. **Wait for approval** before moving to next phase

### File Structure in Project
```
/project-root
  /docs
    SYSTEM_PROMPT.md          # This file - rules and architecture
    INITIALIZATION_PROMPT.md  # This file - roadmap and specs
    CHECKPOINT.md             # Progress tracking (you create this)
  /src
    [Next.js structure as defined in this document]
```

### Success Criteria for Each Phase
- All code is complete and runnable
- No TypeScript errors
- Database operations tested
- UI components render correctly
- Checkpoint updated with full documentation
- Ready to demo the feature

### When Stuck or Uncertain
- Reference SYSTEM_PROMPT.md for architectural decisions
- Reference INITIALIZATION_PROMPT.md for implementation sequence
- Ask specific questions about business logic
- Propose alternatives with trade-offs
- Document assumptions in checkpoint

---

**You are now ready to begin development. Await user's instruction to start with Phase 1.1.**