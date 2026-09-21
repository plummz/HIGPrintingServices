# PostgreSQL / Prisma logical data model

> Module 1 is now implemented. This document also describes future modules; see [MODULE_1.md](MODULE_1.md) for implemented scope, validation and limitations.

Full logical model proposal. The Module 1 identity/business subset is implemented in `prisma/schema.prisma` and its initial migration. Later slices remain planned.

## Conventions

UUID primary keys. All business-owned rows carry businessId. Parent tables expose a unique (businessId,id) key; dependent relations use composite foreign keys including businessId. A global UUID alone does not enforce tenant consistency. Auth library identity/session tables are global and isolated from business DTOs.

Use timestamptz for instants; business timeZone defaults to Asia/Manila for the demo. Use Decimal(18,2) for currency amounts, Decimal(18,6) for rates, dimensions and material quantities; currency is stored with commercial snapshots. Never use binary floats for money. Define line rounding to currency minor units before summing; apply discount then tax using explicit stored policy. MVP PHP uses two decimal places.

Archive products/customers rather than cascading deletion into financial or approval history. Personal-data retention/anonymization must preserve necessary accounting/audit relationships without retaining unrelated personal details.

## Identity and configuration

| Prisma model               | Fields and relationships                                                                                                      |
| -------------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| User + library auth models | Library-managed identity, credentials/accounts, sessions, verification/reset records; no custom token/password implementation |
| Business                   | id, name, slug(unique), timeZone, currency, contact, address, hours, logoFileId, active                                       |
| Membership                 | businessId, userId, role OWNER/ADMIN/STAFF/CUSTOMER, active; unique(businessId,userId)                                        |
| PermissionGrant            | businessId, membershipId, permission, allowed; unique(businessId,membershipId,permission)                                     |
| Invitation                 | businessId, intended role/permissions, invited email, library-supported token digest/expiry, consumedAt, invitedBy            |
| BusinessSettings           | businessId(unique), numberingPrefix, tax policy, deposit policy, receipt text, permitted production configuration             |
| JobNumberCounter           | businessId, year, nextValue; unique(businessId,year); atomic transaction allocation                                           |

Last-owner changes are serialized. Customers cannot self-select staff roles or attach themselves to arbitrary existing customer records.

## Customer and commercial records

| Model             | Fields and relationships                                                                                                                                        |
| ----------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Customer          | businessId, id, name, phone, optional email/address/notes, optional membershipId(unique per business), archivedAt, createdAt                                    |
| Product           | businessId, name, category, description, active, requiresProof, pricingMethod                                                                                   |
| PriceRule         | businessId, productId, method, rate, unit, optional width/height, effective dates, revision                                                                     |
| QuantityTier      | businessId, priceRuleId, minQuantity, maxQuantity, rate; reject overlaps                                                                                        |
| AddOn             | businessId, name, chargeMethod, rate, active                                                                                                                    |
| OrderRequest      | businessId, customerId, description, desiredDueAt, status, createdAt                                                                                            |
| OrderItem         | businessId, orderRequestId, productId, specification, dimensions, unit, quantity                                                                                |
| Quotation         | businessId, orderRequestId, customerId, currentVersionId, status                                                                                                |
| QuotationVersion  | businessId, quotationId, version, currency, subtotal, discount, tax, total, expiresAt, estimatedDueAt, notes, createdBy; unique(businessId,quotationId,version) |
| QuotationLine     | businessId, quotationVersionId, productId(optional), descriptionSnapshot, pricingMethodSnapshot, dimensions/unit, quantity, unitRate, amount                    |
| QuotationAddOn    | businessId, quotationLineId, label/rate/quantity/amount snapshots                                                                                               |
| QuotationDecision | businessId, quotationVersionId, customerId, action, comment, createdAt; accepted version immutable                                                              |

Editing an issued quotation creates a new version. Customer decision requires the current unexpired version. Accepting a version and creating the job occur in one serialized transaction with an idempotency key and unique acceptedQuotationVersionId. Never take a submitted total as authoritative. Custom quotation amounts are entered only by authorized staff and calculated on server.

Support fixed, piece/page, area, size, tier and custom pricing; dimensions must include units. Normalize area using exact conversion factors before applying stored rate/rounding. Allow multiple job items; each item snapshots its price/specification and proof requirement.

## Jobs, files and approval

| Model          | Fields and relationships                                                                                                                                                                                         |
| -------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Job            | businessId, customerId, acceptedQuotationVersionId(unique), jobNumber, state, priority, dueAt, estimatedMinutes, assignedMembershipId, machineId(optional), lockVersion, createdAt; unique(businessId,jobNumber) |
| JobItem        | businessId, jobId, productId(optional), description/specification snapshots, dimensions/unit, quantity, requiresProof, approvedProofId(optional), lineTotal                                                      |
| JobStatusEvent | businessId, jobId, fromState, toState, actorMembershipId or verified customerId, reason, createdAt                                                                                                               |
| FileAsset      | businessId, jobId/orderRequestId, random storageKey(unique), originalDisplayName, detectedMime, bytes, sha256, state QUARANTINED/VALIDATED/REJECTED, uploader identity, createdAt                                |
| ProofVersion   | businessId, jobItemId, version, fileAssetId(unique), createdBy, createdAt; unique(businessId,jobItemId,version)                                                                                                  |
| ProofDecision  | businessId, proofVersionId, customerId, action APPROVE/REVISION, comment, createdAt; unique(businessId,proofVersionId)                                                                                           |
| JobNote        | businessId, jobId, authorMembershipId, visibility INTERNAL/CUSTOMER, body, createdAt                                                                                                                             |
| TrackingToken  | businessId, jobId, digest(unique), expiresAt, revokedAt, createdAt                                                                                                                                               |
| Machine        | businessId, name, capabilities, active, availableFrom                                                                                                                                                            |

Proof decision is immutable. A revision starts a new proof version. The job item's approvedProofId must reference its own proof, enforced with matching jobItemId in the composite relation. FileAsset linkage and tenant checks ensure that proof content belongs to the correct job, not merely the same business.

Uploading later work cannot replace an approved asset. If an approved design needs change before production, perform an explicit owner/admin reopen action with reason, clear the active approval pointer and block printing until a new version is approved. Preserve the historical approval. After production begins, use a separate reprint job rather than replacing the active production proof.

## Ledgers, delivery and audit

| Model             | Fields and relationships                                                                                                                                                         |
| ----------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| PaymentEntry      | businessId, jobId, amount, kind PAYMENT/REFUND/REVERSAL, reversesEntryId(optional), method, reference, recordedBy, occurredAt, idempotencyKey; unique(businessId,idempotencyKey) |
| InventoryItem     | businessId, name, category, unit, cachedQuantity, reorderLevel, unitCost, supplier, lastRestockedAt, notes                                                                       |
| InventoryMovement | businessId, itemId, jobId(optional), type, signedQuantity, reason, actor, createdAt, idempotencyKey                                                                              |
| Notification      | businessId, recipientMembershipId, type, resource reference, readAt, createdAt                                                                                                   |
| PushSubscription  | businessId, membershipId, endpoint and encrypted subscription material, createdAt, revokedAt                                                                                     |
| OutboxEvent       | businessId, kind, minimal payload, dedupeKey(unique), availableAt, attempts, processedAt                                                                                         |
| AuditEvent        | businessId, actor identity, action, resourceType/id, redacted before/after, requestId, createdAt                                                                                 |
| IdempotencyRecord | businessId, actorId, operation, key, requestHash, result reference, expiresAt; unique(businessId,actorId,operation,key)                                                          |

Payment entries are append-only. Corrections create reversal records. Serialized job-level checks prevent duplicate refunds and excess payments (MVP disallows overpayments); balances derive from accepted quote plus ledger. Refund state must not imply a partially refunded job was fully refunded.

Inventory quantity and its movement are updated in one transaction with a row lock or conditional update preventing negative stock. Movement ledger is authoritative; cached quantity is reconciled. Job consumption, stock change and audit must commit together.

## PostgreSQL constraints and indexing

Use migration SQL for checks not represented in Prisma: positive quantity, nonnegative price/amount, valid time ranges, distinct permitted ledger signs and referential constraints. Put unique constraints on decisions, numbering, idempotency and proof versions. Constrain accepted quotation/job/customer consistency.

Indexes: Job(businessId,state,dueAt), Job(businessId,assignedMembershipId,state), Customer(businessId,phone), QuotationVersion(businessId,quotationId,version), PaymentEntry(businessId,jobId,occurredAt), InventoryMovement(businessId,itemId,createdAt), Notification(businessId,recipientMembershipId,readAt), AuditEvent(businessId,createdAt). Search uses bounded pagination and normalized indexed fields.

State change + history + audit + outbox use a single transaction. Use optimistic lockVersion for UI conflicts; retry serialization conflicts only with bounded retries and idempotency. Object storage cannot join DB transactions: quarantine/upload, validate, finalize DB linkage and remove orphaned uploads asynchronously. No network calls inside a DB transaction.

Future scheduling tables (Recommendation, Override, StageEstimate) are deferred until the MVP works.
