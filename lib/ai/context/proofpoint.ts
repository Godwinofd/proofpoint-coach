/**
 * Proofpoint product positioning context.
 * Injected into lesson generation, roleplay, and evaluation prompts.
 */

export const proofpointContext = `
## Proofpoint Product Positioning

### Company Overview
Proofpoint is a leading cybersecurity company focused on people-centric security — protecting organisations from threats that target their employees rather than their infrastructure.

Headquarters: Sunnyvale, California
Annual Revenue: ~$1B+
Key markets: Enterprise (1,000+ employees), Financial Services, Healthcare, Government, Manufacturing

### Core Product Portfolio

#### Email Security & Threat Protection
- **Proofpoint Email Protection:** Industry-leading inbound/outbound email filtering; blocks phishing, malware, spam
- **Targeted Attack Protection (TAP):** URL and attachment sandboxing; detects zero-day threats; provides Very Attacked People (VAP) visibility
- **TRAP (Threat Response Auto-Pull):** Automatically retracts malicious emails from inboxes post-delivery
- **Email Fraud Defence:** DMARC authentication; stops domain spoofing and BEC

#### Information & Cloud Protection
- **Proofpoint DLP:** Data loss prevention across email, cloud, and endpoint; classifies and blocks sensitive data exfiltration
- **Insider Threat Management (ITM):** Detects malicious and negligent insider behaviour; integrates with HR offboarding workflows
- **Cloud App Security Broker (CASB):** Visibility and control over SaaS applications (Microsoft 365, Google Workspace, Salesforce)

#### Security Awareness Training
- **Proofpoint Security Awareness Training (PSAT):** Phishing simulations; role-based training; behaviour-change measurement
- **Nexus People Risk Explorer:** Maps employee risk levels; prioritises training for highest-risk individuals

### Key Differentiators
1. **People-centric approach:** Focuses on Very Attacked People (VAPs) — the specific employees most targeted
2. **Threat intelligence at scale:** Analyses 2.6 billion emails per day; largest email threat intelligence dataset in the industry
3. **Integrated platform:** Single platform spanning threat protection, compliance, and security awareness
4. **DMARC leadership:** Market leader in email authentication / anti-spoofing
5. **German language support:** Full German-language platform; local data residency options (important for DSGVO)

### Ideal Customer Profile (ICP)
- 1,000–50,000 employees
- Industries: Financial services, manufacturing, healthcare, government, professional services
- Pain points: Frequent phishing attacks, failed compliance audits, DLP gaps, security awareness gaps
- IT buyer: CISO, IT Security Manager (IT-Sicherheitsmanager), IT Leiter
- Economic buyer: CIO, CFO (procurement approval)

### Key Value Propositions by Pain Point
| Pain Point | Proofpoint Answer |
|---|---|
| Employees clicking phishing links | TAP + PSAT phishing simulations |
| Data leaving via email | DLP for email |
| Malicious insider risk | ITM with user activity monitoring |
| CEO/CFO impersonation fraud | Email Fraud Defence / DMARC |
| Microsoft 365 not enough | TAP catches what Microsoft misses; post-delivery remediation via TRAP |
| Compliance (DSGVO, BSI) | Encryption, archiving, audit trails |
`
