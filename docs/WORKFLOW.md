# Job and commercial state machines

Proposed authoritative transitions. Reject any unlisted transition. Each accepted change writes immutable history and audit with actor, timestamp and reason.

OrderRequest and Quotation exist before a Job. Order request starts NEW; quotation lifecycle is DRAFT -> ISSUED -> ACCEPTED / DECLINED / CHANGES_REQUESTED / EXPIRED. A new quotation version can replace a declined/change-requested/expired offer. This separates pre-order states from accepted production work.

The brief's NEW and QUOTATION labels appear in the order-request UI; they are not redundant accepted-job states. On acceptance, create the numbered job in WAITING_FOR_PAYMENT if its stored deposit policy requires it, otherwise QUEUED.

| From                       | To                         | Actor and guard                                                                                                |
| -------------------------- | -------------------------- | -------------------------------------------------------------------------------------------------------------- |
| WAITING_FOR_PAYMENT        | QUEUED                     | Server after required recorded deposit; authorized admin waiver requires reason/audit                          |
| QUEUED                     | DESIGNING                  | Assigned staff/admin starts layout                                                                             |
| QUEUED                     | APPROVED_FOR_PRODUCTION    | Server only when every item is marked proof-not-required by snapshotted service policy and payment gate passes |
| DESIGNING                  | AWAITING_CUSTOMER_APPROVAL | Staff submits current validated proof(s)                                                                       |
| AWAITING_CUSTOMER_APPROVAL | REVISION_REQUESTED         | Owning customer requests revision with comment                                                                 |
| REVISION_REQUESTED         | DESIGNING                  | Assigned staff begins revision                                                                                 |
| AWAITING_CUSTOMER_APPROVAL | APPROVED_FOR_PRODUCTION    | Server after all proof-required items have current exact-version approval and payment gate passes              |
| APPROVED_FOR_PRODUCTION    | PRINTING                   | Assigned staff/admin; recheck current approvals and payment policy atomically                                  |
| PRINTING                   | FINISHING                  | Assigned staff/admin                                                                                           |
| FINISHING                  | QUALITY_CHECK              | Assigned staff/admin                                                                                           |
| QUALITY_CHECK              | READY_FOR_PICKUP           | Assigned staff/admin; checks passed                                                                            |
| QUALITY_CHECK              | PRINTING or FINISHING      | Authorized staff/admin records failed QC and rework reason; unchanged approved artwork                         |
| READY_FOR_PICKUP           | COMPLETED                  | Authorized handover; balance zero unless owner/admin explicitly authorizes credit with audit                   |
| APPROVED_FOR_PRODUCTION    | DESIGNING                  | Owner/admin explicit reopen before printing; reason required, approval pointers cleared                        |
| Any nonterminal job state  | CANCELLED                  | Owner/admin; reason required; handle material/payment disposition explicitly                                   |

COMPLETED and CANCELLED are terminal. Reprints become linked new jobs. Cancellation never deletes payment history or automatically claims a provider refund. Record actual manual refund separately.

No skipping approval for custom artwork. For mixed-item jobs, production gate checks every required item. When some proofs are approved and others pending, remain awaiting approval; one revision request places job into revision work without destroying approvals of unchanged items.

A stale proof decision or status request returns 409 with current version. Customer decisions are one-way events, not staff-editable fields. Uploading a new version invalidates eligibility of superseded pending proofs. An approved version remains immutable.

## Configuration

MVP fixes protected state semantics while allowing display labels, default durations and optional finishing configuration. Arbitrary owner-defined transition graphs are deferred: customization cannot remove security, payment or proof gates. Record this limitation in business settings.

## Notification events

Issue quote, submit proof, request revision, approve proof, begin printing, ready for pickup, due soon/overdue and low stock produce outbox events in the same transaction. Worker delivery is deduplicated and retried; notification failure must not roll back a completed approval.
