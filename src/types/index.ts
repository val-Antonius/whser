// ============================================================================
// TYPESCRIPT TYPE DEFINITIONS
// ============================================================================
// Purpose: Type definitions for all database entities
// ============================================================================

// ============================================================================
// USER TYPES
// ============================================================================

export enum UserRole {
    ADMIN = 'admin',
    OWNER = 'owner',
}

export interface User {
    id: number;
    name: string;
    email: string;
    role: UserRole;
    is_active: boolean;
    created_at: Date;
    updated_at: Date;
}

// ============================================================================
// CUSTOMER TYPES
// ============================================================================

export enum CustomerSegment {
    REGULAR = 'regular',
    VIP = 'vip',
    CORPORATE = 'corporate',
    DORMITORY = 'dormitory',
    HOTEL = 'hotel',
}

export interface CustomerPreferences {
    preferred_detergent?: string;
    allergies?: string;
    billing_cycle?: string;
    preferred_service?: string;
    bulk_discount?: boolean;
    pickup_schedule?: string;
    sla_strict?: boolean;
    quality_priority?: string;
    express_only?: boolean;
    [key: string]: any;
}

export interface Customer {
    id: number;
    customer_number: string;
    name: string;
    phone?: string;
    email?: string;
    address?: string;
    segment: CustomerSegment;
    is_active: boolean;
    preferences?: string | CustomerPreferences; // JSON string or parsed object
    notes?: string;
    created_at: Date;
    updated_at: Date;
    created_by?: number;
    loyalty_tier?: LoyaltyTier;
    total_lifetime_value?: number;
    risk_score?: number;
}

// ============================================================================
// SERVICE TYPES
// ============================================================================

export enum ServiceType {
    REGULAR = 'regular',
    EXPRESS = 'express',
    DRY_CLEAN = 'dry_clean',
    IRON_ONLY = 'iron_only',
    WASH_ONLY = 'wash_only',
}

export enum UnitType {
    KG = 'kg',
    PIECE = 'piece',
}

export interface Service {
    id: number;
    service_code: string;
    service_name: string;
    description?: string;
    service_type: ServiceType;
    unit_type: UnitType;
    base_price: number;
    minimum_charge?: number;
    estimated_hours: number;
    express_hours?: number;
    is_active: boolean;
    created_at: Date;
    updated_at: Date;
}

export interface ServiceProcess {
    id: number;
    service_id: number;
    process_name: string;
    process_order: number;
    estimated_duration_minutes: number;
    depends_on_process_id?: number;
    is_required: boolean;
    description?: string;
    created_at: Date;
    updated_at: Date;
}

// ============================================================================
// ORDER TYPES
// ============================================================================

export enum OrderStatus {
    RECEIVED = 'received',
    WAITING_FOR_PROCESS = 'waiting_for_process',
    IN_WASH = 'in_wash',
    IN_DRY = 'in_dry',
    IN_IRON = 'in_iron',
    IN_FOLD = 'in_fold',
    READY_FOR_QC = 'ready_for_qc',
    QC_FAILED = 'qc_failed',
    COMPLETED = 'completed',
    READY_FOR_PICKUP = 'ready_for_pickup',
    CLOSED = 'closed',
    CANCELLED = 'cancelled',
}

export enum PaymentStatus {
    UNPAID = 'unpaid',
    PARTIAL = 'partial',
    PAID = 'paid',
}

export enum PaymentMethod {
    CASH = 'cash',
    TRANSFER = 'transfer',
    CARD = 'card',
    OTHER = 'other',
}

export enum OrderPriority {
    REGULAR = 'regular',
    EXPRESS = 'express',
}

export interface Order {
    id: number;
    order_number: string;
    customer_id: number;
    service_id: number;
    estimated_weight?: number;
    actual_weight?: number;
    quantity?: number;
    unit_type: UnitType;
    estimated_price: number;
    final_price?: number;
    discount_amount: number;
    payment_status: PaymentStatus;
    paid_amount: number;
    payment_method?: PaymentMethod;
    current_status: OrderStatus;
    priority: OrderPriority;
    estimated_completion?: Date;
    actual_completion?: Date;
    sla_breach: boolean;
    special_instructions?: string;
    exception_notes?: string;
    is_rewash: boolean;
    original_order_id?: number;
    created_at: Date;
    updated_at: Date;
    created_by?: number;
    completed_by?: number;
}

export interface OrderItem {
    id: number;
    order_id: number;
    item_description: string;
    quantity: number;
    unit_price?: number;
    total_price?: number;
    notes?: string;
    created_at: Date;
}

export enum JobStatus {
    PENDING = 'pending',
    IN_PROGRESS = 'in_progress',
    COMPLETED = 'completed',
    FAILED = 'failed',
    SKIPPED = 'skipped',
}

export interface OrderJob {
    id: number;
    order_id: number;
    service_process_id: number;
    job_name: string;
    job_order: number;
    status: JobStatus;
    estimated_duration_minutes?: number;
    actual_start_time?: Date;
    actual_end_time?: Date;
    actual_duration_minutes?: number;
    assigned_to?: number;
    exception_occurred: boolean;
    exception_reason?: string;
    created_at: Date;
    updated_at: Date;
}

export interface OrderStatusLog {
    id: number;
    order_id: number;
    previous_status?: string;
    new_status: string;
    changed_at: Date;
    changed_by?: number;
    reason?: string;
    notes?: string;
}

// ============================================================================
// INVENTORY TYPES
// ============================================================================

export enum InventoryCategory {
    DETERGENT = 'detergent',
    SOFTENER = 'softener',
    BLEACH = 'bleach',
    PLASTIC = 'plastic',
    HANGER = 'hanger',
    PACKAGING = 'packaging',
    SUPPLIES = 'supplies',
    OTHER = 'other',
}

export enum InventoryUnitOfMeasure {
    LITER = 'liter',
    KG = 'kg',
    PIECE = 'piece',
    BOTTLE = 'bottle',
    BOX = 'box',
}

export interface InventoryItem {
    id: number;
    item_code: string;
    item_name: string;
    description?: string;
    category: InventoryCategory;
    unit_of_measure: InventoryUnitOfMeasure;
    current_stock: number;
    minimum_stock: number;
    reorder_quantity?: number;
    unit_cost?: number;
    last_purchase_price?: number;
    is_active: boolean;
    created_at: Date;
    updated_at: Date;
}

export enum TransactionType {
    STOCK_IN = 'stock_in',
    STOCK_OUT = 'stock_out',
    ADJUSTMENT = 'adjustment',
    CONSUMPTION = 'consumption',
    WASTE = 'waste',
    LOSS = 'loss',
}

// Type alias for inventory transaction type
export type InventoryTransactionType = TransactionType;
export const InventoryTransactionType = TransactionType;

export interface InventoryTransaction {
    id: number;
    inventory_item_id: number;
    transaction_type: TransactionType;
    quantity: number;
    stock_before: number;
    stock_after: number;
    unit_cost?: number;
    total_cost?: number;
    reference_number?: string;
    reason_code?: string;
    notes?: string;
    order_id?: number;
    transaction_date: Date;
    created_by?: number;
}

export interface InventoryConsumption {
    id: number;
    order_id: number;
    inventory_item_id: number;
    estimated_quantity?: number;
    actual_quantity?: number;
    variance?: number;
    unit_cost?: number;
    total_cost?: number;
    created_at: Date;
    updated_at: Date;
}

// ============================================================================
// ANALYTICS TYPES (Phase 3)
// ============================================================================

export enum PeriodType {
    DAILY = 'daily',
    WEEKLY = 'weekly',
    MONTHLY = 'monthly',
}

export interface DataSnapshot {
    id: number;
    snapshot_name: string;
    period_type: PeriodType;
    period_start: Date;
    period_end: Date;
    snapshot_date: Date;
    is_locked: boolean;
    total_orders?: number;
    total_revenue?: number;
    metadata?: string;
    created_by?: number;
}

export enum SignificanceLevel {
    NORMAL = 'normal',
    ATTENTION = 'attention',
    CRITICAL = 'critical',
}

export interface AnalyticalMetric {
    id: number;
    snapshot_id: number;
    metric_name: string;
    metric_value?: number;
    baseline_value?: number;
    variance?: number;
    variance_percentage?: number;
    significance_level: SignificanceLevel;
    metadata?: string;
    created_at: Date;
}

export enum InsightSource {
    SYSTEM = 'system',
    LLM = 'llm',
    MANUAL = 'manual',
}

export interface Insight {
    id: number;
    snapshot_id: number;
    statement: string;
    severity: SignificanceLevel;
    metrics_involved?: string | string[];
    generated_by: InsightSource;
    llm_confidence?: number;
    is_actionable: boolean;
    created_at: Date;
    created_by?: number;
}

export enum RecommendationCategory {
    SOP = 'sop',
    STAFFING = 'staffing',
    CAPACITY = 'capacity',
    PRICING = 'pricing',
    INVENTORY = 'inventory',
    OTHER = 'other',
}

export enum RecommendationUrgency {
    LOW = 'low',
    MEDIUM = 'medium',
    HIGH = 'high',
}

export enum RecommendationStatus {
    PENDING = 'pending',
    ACCEPTED = 'accepted',
    REJECTED = 'rejected',
    COMPLETED = 'completed',
}

export interface Recommendation {
    id: number;
    insight_id: number;
    action: string;
    category: RecommendationCategory;
    urgency: RecommendationUrgency;
    rationale?: string;
    generated_by: InsightSource;
    status: RecommendationStatus;
    created_at: Date;
}

export enum TaskPriority {
    LOW = 'low',
    MEDIUM = 'medium',
    HIGH = 'high',
}

export enum TaskStatus {
    OPEN = 'open',
    IN_PROGRESS = 'in_progress',
    RESOLVED = 'resolved',
    CANCELLED = 'cancelled',
}

export interface Task {
    id: number;
    title: string;
    description?: string;
    insight_id?: number;
    recommendation_id?: number;
    assigned_to: number;
    created_by: number;
    priority: TaskPriority;
    status: TaskStatus;
    due_date?: Date;
    created_at: Date;
    started_at?: Date;
    completed_at?: Date;
    completion_notes?: string;
    completion_period_id?: number;
    updated_at: Date;
}

// ============================================================================
// API RESPONSE TYPES
// ============================================================================

export interface ApiResponse<T = any> {
    success: boolean;
    data?: T;
    error?: string;
    message?: string;
}

export interface PaginatedResponse<T = any> {
    success: boolean;
    data: T[];
    pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    };
}

// ============================================================================
// FORM INPUT TYPES
// ============================================================================

export interface CreateOrderInput {
    customer_id: number;
    service_id: number;
    estimated_weight?: number;
    quantity?: number;
    unit_type: UnitType;
    priority: OrderPriority;
    payment_status: PaymentStatus;
    paid_amount?: number;
    payment_method?: PaymentMethod;
    special_instructions?: string;
    created_by: number;
}

export interface UpdateOrderStatusInput {
    order_id: number;
    new_status: OrderStatus;
    changed_by: number;
    reason?: string;
    notes?: string;
}

export interface CreateCustomerInput {
    name: string;
    phone?: string;
    email?: string;
    address?: string;
    segment?: CustomerSegment;
    preferences?: CustomerPreferences;
    notes?: string;
    created_by: number;
}

export interface StockTransactionInput {
    inventory_item_id: number;
    transaction_type: TransactionType;
    quantity: number;
    unit_cost?: number;
    reference_number?: string;
    reason_code?: string;
    notes?: string;
    order_id?: number;
    created_by: number;
}

// ============================================================================
// PHASE 2.4: ADVANCED CUSTOMER FEATURES
// ============================================================================

export enum LoyaltyTier {
    STANDARD = 'Standard',
    SILVER = 'Silver',
    GOLD = 'Gold',
    PLATINUM = 'Platinum',
}

export enum ContractType {
    CORPORATE = 'Corporate',
    HOTEL = 'Hotel',
    DORMITORY = 'Dormitory',
    OTHER = 'Other',
}

export enum BillingCycle {
    PER_ORDER = 'PerOrder',
    MONTHLY = 'Monthly',
    WEEKLY = 'Weekly',
}

export interface CustomerContract {
    id: number;
    customer_id: number;
    contract_type: ContractType;
    start_date: Date | string;
    end_date: Date | string;
    is_active: boolean;
    sla_modifier_hours: number;
    price_modifier_percent: number;
    billing_cycle: BillingCycle;
    terms_and_conditions?: string;
    created_at: Date;
    updated_at: Date;
}

export enum LoyaltyChangeType {
    ORDER = 'Order',
    BONUS = 'Bonus',
    ADJUSTMENT = 'Adjustment',
    PENALTY = 'Penalty',
    TIER_CHANGE = 'TierChange',
}

export interface CustomerLoyaltyHistory {
    id: number;
    customer_id: number;
    order_id?: number;
    change_type: LoyaltyChangeType;
    points_earned: number;
    new_tier?: LoyaltyTier;
    description?: string;
    created_at: Date;
}

export enum ComplaintCategory {
    DAMAGE = 'Damage',
    DELAY = 'Delay',
    SERVICE_QUALITY = 'Service Quality',
    BILLING = 'Billing',
    OTHER = 'Other',
}

export enum ComplaintSeverity {
    LOW = 'Low',
    MEDIUM = 'Medium',
    HIGH = 'High',
    CRITICAL = 'Critical',
}

export enum ComplaintStatus {
    OPEN = 'Open',
    IN_PROGRESS = 'In Progress',
    RESOLVED = 'Resolved',
    DISMISSED = 'Dismissed',
}

export interface CustomerComplaint {
    id: number;
    customer_id: number;
    order_id?: number;
    category: ComplaintCategory;
    severity: ComplaintSeverity;
    description: string;
    status: ComplaintStatus;
    resolution_notes?: string;
    resolved_at?: Date;
    created_by?: number;
    created_at: Date;
    updated_at: Date;
}
