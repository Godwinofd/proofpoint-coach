/**
 * Cybersecurity domain knowledge context.
 * Injected into lesson generation and roleplay prompts.
 */

export const cybersecurityContext = `
## Cybersecurity Domain Knowledge

### Core Threat Categories
- **Phishing (Phishing-Angriffe):** Social engineering via deceptive emails, credential harvesting, spear-phishing targeting executives (CEO-Betrug / Business Email Compromise – BEC)
- **Ransomware:** Malware encrypting corporate data; double-extortion attacks (data theft + encryption); common delivery via phishing emails
- **Insider Threats (Insider-Bedrohungen):** Malicious or negligent employees exfiltrating sensitive data; highest risk during offboarding
- **Identity Attacks (Identitätsangriffe):** Credential theft, account takeover (ATO), MFA bypass, session hijacking
- **Data Loss Prevention (Datenverlustprävention / DLP):** Preventing sensitive data leaving the organisation via email, cloud uploads, USB
- **Business Email Compromise (BEC / Geschäfts-E-Mail-Kompromittierung):** Impersonation of executives or suppliers to trigger fraudulent wire transfers
- **Advanced Persistent Threats (APT):** Nation-state actors, long-dwell-time attacks, supply chain compromise
- **Cloud Security (Cloud-Sicherheit):** Misconfigured S3 buckets, SaaS data exposure, shadow IT risks

### Key Frameworks & Standards
- **NIST Cybersecurity Framework:** Identify, Protect, Detect, Respond, Recover
- **ISO 27001:** International information security management standard; common requirement in German enterprise procurement
- **BSI Grundschutz:** German Federal Office for Information Security baseline protection; highly relevant in DACH market
- **GDPR / DSGVO:** European data protection regulation; data breach notification within 72 hours; major compliance driver in Germany
- **NIS2 Directive:** EU directive expanding cybersecurity obligations; effective 2024; covers critical infrastructure sectors

### SOC & Security Operations
- Security Operations Centre (SOC / Sicherheitsoperationszentrum)
- SIEM (Security Information and Event Management)
- EDR / XDR (Endpoint / Extended Detection and Response)
- Mean Time to Detect (MTTD) / Mean Time to Respond (MTTR)
- Threat Intelligence (Bedrohungsintelligenz)
- Incident Response (Incident-Response / Vorfallsreaktion)

### German-Specific Context
- Germany is the largest economy in Europe and a primary target for industrial espionage (Wirtschaftsspionage)
- Manufacturing (Industrie 4.0), automotive, chemicals, and financial services are high-value targets
- German companies are highly regulated; compliance is a primary purchasing driver
- BSI and DSGVO compliance are non-negotiable for enterprise IT decision-makers
`
