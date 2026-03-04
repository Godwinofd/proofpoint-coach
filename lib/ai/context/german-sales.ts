/**
 * German B2B sales culture context.
 * Used in roleplay and lesson generation prompts to ensure cultural accuracy.
 */

export const germanSalesContext = `
## German B2B Sales Culture

### Formality & Language
- Always use **"Sie"** (formal you) in business contexts — never "du" unless explicitly invited
- Address by title + surname: "Herr Müller", "Frau Dr. Schmidt", "Herr Direktor Weber"
- Germans value precision and directness in business — avoid vague superlatives
- Written communication should be formal: "Sehr geehrter Herr Müller," (not "Hallo Thomas,")
- Email sign-off: "Mit freundlichen Grüßen" (formal) or "Viele Grüße" (slightly less formal)

### Decision-Making Culture
- German companies have **consensus-driven purchasing** (Konsensentscheidung) — multiple stakeholders must approve
- Typical buying committee: IT-Sicherheitsmanager (technical evaluator), IT-Leiter (IT director), CISO, CFO/Einkauf (procurement/finance)
- Decisions take longer than in the US — expect 3–9 month sales cycles for enterprise
- **Risk aversion is high** — Germans need to feel confident in reliability and vendor stability before committing
- References and case studies from German or DACH companies are highly persuasive
- Proof of Concept (PoC) / Pilotprojekt requests are common and should be welcomed

### Typical IT Security Org Structure (Mittelstand, 1,000–5,000 employees)
- **IT-Leiter / Head of IT:** Overall IT budget owner; technology-focused; cares about integration complexity
- **IT-Sicherheitsmanager / IT Security Manager:** Day-to-day security operations; primary technical contact; evaluates vendors
- **CISO / Chief Information Security Officer:** Strategic security posture; board reporting; risk-focused; at larger enterprises
- **Datenschutzbeauftragter / Data Protection Officer (DPO):** GDPR compliance; involved in any data processing decisions
- **Einkauf / Procurement:** Commercial negotiations; framework agreements; vendor approval lists

### Discovery Questions (Entdeckungsfragen)
Effective German discovery questions:
- "Welche Sicherheitsherausforderungen haben Sie in den letzten 12 Monaten erlebt?"
  (What security challenges have you experienced in the last 12 months?)
- "Wie schützen Sie sich aktuell gegen Phishing-Angriffe?"
  (How are you currently protecting against phishing attacks?)
- "Sind Sie mit der Sichtbarkeit zufrieden, die Sie über Bedrohungen haben?"
  (Are you satisfied with the visibility you have over threats?)
- "Was würde passieren, wenn ein Mitarbeiter auf einen Phishing-Link klickt?"
  (What would happen if an employee clicked a phishing link?)
- "Welche Compliance-Anforderungen müssen Sie erfüllen — BSI, ISO 27001, DSGVO?"
  (Which compliance requirements must you meet?)
- "Wie lange würde es dauern, einen Sicherheitsvorfall zu erkennen?"
  (How long would it take you to detect a security incident?)

### DACH Market Specifics
- **Germany:** Largest market; highly regulated; strong manufacturing base; formal culture
- **Austria (Österreich):** Slightly less formal than Germany; Vienna is the main business hub
- **Switzerland (Schweiz):** Multilingual; financial services dominant; very high security standards; premium pricing accepted
- Key industries: Automotive (Volkswagen, BMW, Mercedes), Chemical (BASF, Bayer), Manufacturing, Banking (Deutsche Bank, Commerzbank), Insurance (Allianz, Munich Re)
- Trade shows: CeBIT successor (DMS EXPO), it-sa (Nuremberg) — Europe's largest IT security trade fair; key networking opportunity

### Sales Conversation Tone
- Be precise and factual — Germans are sceptical of marketing hyperbole
- Lead with technical depth, not features
- Reference specific statistics (e.g., "Wir analysieren täglich 2,6 Milliarden E-Mails")
- Show long-term commitment — mention local offices, German-language support, German data centres
- Avoid aggressive closing techniques — focus on being a trusted advisor (vertrauenswürdiger Berater)
`
