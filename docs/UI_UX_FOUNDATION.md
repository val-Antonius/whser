### PHASE 2.5: UI/UX FOUNDATION & INTERNATIONALIZATION (INSERT BEFORE PHASE 3)

**Objective**: Establish professional, consistent UI/UX and Indonesian localization before building analytics

**Rationale**: 
- Prevent technical debt accumulation
- Establish design patterns for Phase 3-6
- Ensure professional presentation for thesis
- Maintain development momentum with fresh context

#### Sub-Phase 2.5.1: Design System Setup
**Goal**: Establish UI library and design tokens
**Tasks**:
- Choose UI library (recommendation: shadcn/ui or Mantine)
- Setup design tokens (colors, spacing, typography)
- Create global layout components
- Setup navigation system (breadcrumb, back button)

**Why this library**:

- shadcn/ui: Tailwind-based, customizable, modern, production-ready
- Mantine: Comprehensive, professional, built-in hooks
- Ant Design: Enterprise-grade, extensive components

**Deliverable**: Design system foundation

#### Sub-Phase 2.5.2: Global Navigation & Layout
**Goal**: Consistent navigation across all pages
**Tasks**:

- Create global navigation component
- Implement breadcrumb system
- Add "back" button logic
- Create consistent page header component
- Setup sidebar navigation (persistent)

**Pattern to establish**:
tsx// Global Layout Pattern
<AppLayout role="admin">
  <Breadcrumb path={['Dashboard', 'POS', 'New Order']} />
  <PageHeader 
    title="Create Order"
    backButton={true}
    actions={[...]}
  />
  <PageContent>
    {children}
  </PageContent>
</AppLayout>

**Deliverable**: Navigation system that is consistent

#### Sub-Phase 2.5.3: Component Refactoring
**Goal**: Refactor existing pages with new design system
**Tasks**:
- Refactor landing page (role selector) - maintain quality
- Refactor Admin Dashboard - match landing page quality
- Refactor POS module UI
- Refactor Service Management UI
- Refactor Inventory UI
- Refactor Customer Management UI
- Ensure visual consistency

**Approach**:

- one module per iteration
- Test after refactor
- Update checkpoint after refactor

**Deliverable**: Consistent, professional UI for all operational pages

#### Sub-Phase 2.5.4: Internationalization (i18n)
**Goal**: all text in Bahasa Indonesia
**Tasks**:

- Translate all UI strings to Indonesian
- Handle contextual translations (proper terminology)
- Test all pages

**Translation Context Guidelines**:
json{
  "roles": {
    "admin": "Admin",
    "owner": "Pemilik"
  },
  "modules": {
    "pos": "Kasir",
    "service_management": "Manajemen Layanan",
    "inventory": "Inventori",
    "customers": "Pelanggan"
  },
  "actions": {
    "create_order": "Buat Pesanan",
    "save": "Simpan",
    "cancel": "Batal",
    "back": "Kembali"
  },
  "order_status": {
    "RECEIVED": "Diterima",
    "IN_WASH": "Sedang Dicuci",
    "COMPLETED": "Selesai"
    // etc - dengan konteks laundry yang tepat
  }
}
**Deliverable**: Aplikasi full Bahasa Indonesia with proper terminology

#### Sub-Phase 2.5.5: Testing & Polish
**Goal**: Ensure everything works after refactor
**Tasks**:
- Test all workflows end-to-end
- Check responsive design
- Verify navigation consistency
- Validate translations
- Fix any visual bugs
- Update documentation

**Deliverable**: Production-ready UI/UX  for Operational App

**Checkpoint**: Professional, consistent, Indonesian-language UI for entire Operational Application