/**
 * Competitor landscape context.
 * Used in roleplay prompts and lesson generation for objection handling.
 */

export const competitorsContext = `
## Competitive Landscape

### Microsoft Defender for Office 365 (MDO)
**Market position:** Bundled with Microsoft 365; default choice for many organisations.
**Strengths:** Included in M365 E3/E5 licensing; familiar IT admin interface; broad platform integration.
**Weaknesses:**
- Reactive rather than proactive; weaker zero-day/unknown threat detection
- No post-delivery email retraction (TRAP equivalent)
- Limited people-risk visibility (no VAP-equivalent)
- Weaker DLP compared to dedicated solutions
- Phishing simulation module (Attack Simulator) is basic
**Displacement play:** "Microsoft is good at known threats. Proofpoint catches what Microsoft misses — we analyse 2.6 billion emails daily and see threats Microsoft hasn't seen yet. We also retract emails after delivery, which Microsoft cannot do."

---

### Mimecast
**Market position:** Long-standing email security vendor; strong in UK and EMEA; recently acquired by Permira.
**Strengths:** Email archiving; business continuity (email spooling during outages); brand awareness in Europe.
**Weaknesses:**
- Major service outage history (January 2021 supply chain breach — Mimecast's own certificate was compromised)
- Weaker threat intelligence compared to Proofpoint
- DLP capabilities are less mature
- Awareness training (Mimecast Awareness Training) is secondary product
**Displacement play:** "Mimecast had a significant security incident in 2021 — their own infrastructure was compromised. When your email security vendor can't protect itself, how can it protect you? Proofpoint has never had a comparable breach."

---

### Barracuda Networks
**Market position:** Mid-market email security; strong with MSPs and SMBs.
**Strengths:** Price-competitive; simple deployment; hardware appliance option.
**Weaknesses:**
- Weaker enterprise scalability
- Limited threat intelligence depth
- Less sophisticated people-risk analytics
- 2023 Barracuda ESG zero-day vulnerability required complete device replacement
**Displacement play:** "Barracuda works well in the mid-market, but enterprise organisations with complex compliance requirements and high attack volumes need the depth of intelligence that Proofpoint provides."

---

### Cisco Secure Email (formerly IronPort)
**Market position:** Legacy enterprise email gateway; often found in large, Cisco-heavy environments.
**Strengths:** Deep Cisco ecosystem integration; strong reputation in network security.
**Weaknesses:**
- Innovation lag — Cisco has underinvested in email security post-IronPort acquisition
- No equivalent to TAP's sandboxing depth
- No security awareness training integration
- Complex management interface
**Displacement play:** "Cisco Secure Email was the gold standard a decade ago. Proofpoint has continued to invest and innovate in email security while Cisco's focus shifted to networking. We're the dedicated specialist; this is our entire business."

---

### Common Objections & Responses
| Objection | Response |
|---|---|
| "We already have Microsoft Defender included in our licence." | "Included doesn't mean sufficient. We see thousands of threats per day that bypass Microsoft. And we can retract emails post-delivery — Microsoft cannot do that." |
| "We're already with Mimecast." | "I understand — Mimecast is a solid choice. Are you aware of their 2021 security incident? I'd be happy to show you how our threat intelligence compares on the specific attack types hitting your industry." |
| "Your price is too high." | "What's the cost of a single ransomware attack or a successful BEC fraud? Our customers typically see ROI within the first year. Would it help if I walked you through a business case?" |
| "We don't have budget this year." | "Understood. Many of our customers started a conversation in Q3 to be ready for Q1 budget. Can we schedule a technical deep-dive so you're informed when budget opens?" |
`
