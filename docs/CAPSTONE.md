# Research support
Collect actual events only after implementation and use. Seed jobs never count as research results.

| Metric | Definition |
|---|---|
| Order processing time | Accepted quotation timestamp minus request creation |
| Turnaround time | Completed timestamp minus job creation |
| Late completion rate | Completed after committed dueAt / completed jobs with a deadline |
| Approval wait | Sum of proof-submitted to decision intervals, treating undecided intervals separately |
| Revision count | Count of REVISION decisions per job/item |
| Queue length | Number of jobs in defined queued/production states at sampling time |
| Scheduling acceptance | Accepted recommendations / actionable recommendations, advanced phase only |
| Scheduling override | Recorded override actor, reason and timestamp, advanced phase only |

Snapshot committed deadlines and record later changes so deadline edits do not hide delays. Report sample period, denominator and missing data. Separate cancelled/open jobs from completed turnaround statistics. Use pseudonymous IDs and aggregated exports; exclude customer names, contacts and artwork. Define research access and retention before collecting pilot data. Do not claim causal improvement from a dashboard or a small uncontrolled sample.

Advanced scheduling is explainable scoring, not AI: eligibility (approval/payment/material/machine) first, then deadline slack and rush priority, duration and machine workload; store reasons. Owner override remains possible and auditable.
