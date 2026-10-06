# SikaPOS (Akoma Commerce Cloud) — Privacy Policy (Draft for Review)

> **DOCUMENT STATUS:** DRAFT — FOR INTERNAL LEGAL & STAKEHOLDER REVIEW ONLY.  
> **DO NOT PUBLISH OR LINK IN PRODUCTION NAVIGATION UNTIL EXPLICITLY APPROVED.**  
> **Applicable Jurisdiction:** Republic of Ghana (Data Protection Act, 2012 — Act 843)  
> **Last Updated:** October 6, 2026  

---

## 1. Introduction

This Privacy Policy describes how **Mastermade Solutions** ("we", "us", or "our"), trading as **SikaPOS** (part of the **Akoma Commerce Cloud** platform), collects, processes, stores, and protects personal data and commercial records when merchants, store managers, cashiers, and consumers interact with our point-of-sale software, mobile applications, and cloud services (collectively, the "Platform").

We are committed to processing personal data lawfully, fairly, and transparently in strict compliance with the **Data Protection Act, 2012 (Act 843)** of Ghana, guidelines issued by the **Data Protection Commission (DPC)** of Ghana, and relevant telecommunications standards.

---

## 2. Who We Are

* **Data Controller / Data Processor:** **Mastermade Solutions** operates as:
  * A **Data Controller** regarding merchant account information, store owner identity verification, billing, and platform security logs.
  * A **Data Processor** acting on behalf of registered retail merchants when handling cashier till credentials, inventory data, and retail sales receipts generated at countertop registers.
* **Registered Entity Name:** Mastermade Solutions
* **Company Registration Number:** [Registration in progress / Registrar General's Department details to be updated upon finalization]
* **Registered Office / Operations:** [Physical address in Accra, Ghana to be finalized]
* **DPC Registration Status:** [Data Protection Commission filing pending final entity registration]
* **Data Protection Contact:** `privacy@mastermadesolutions.com` (Alternative: `support@sikapos.com`)

---

## 3. Information We Collect

Based on an audit of the current SikaPOS codebase (Phase 0–3 Schema & Authentication Services), we collect the following categories of data:

### A. Merchant & Store Owner Information *(Currently Implemented)*
* **Identity Data:** Full legal name, Ghana Card reference (where submitted for merchant verification).
* **Contact Data:** Primary mobile phone number (Ghana mobile network format: MTN, Telecel, AT), email address.
* **Authentication Credentials:** Salted and cryptographically hashed passwords (PBKDF2/SHA-256; plain text passwords are never stored).
* **Phone Verification Records:** One-Time Password (OTP) verification attempts, network carrier identifier, request timestamps, and cooldown periods.

### B. Business & Branch Location Data *(Currently Implemented)*
* **Commercial Entity Data:** Business legal entity name, trade name, commercial category (e.g., Provision & Supermarket, Pharmacy & OTC, Boutique & Fashion, Electronics & Repairs).
* **Outlet Location:** Physical outlet name, physical street address, region of operation within Ghana, and GhanaPost GPS Digital Address (e.g., `GA-183-9024`).
* **Tax Profile:** Tax registration status, Ghana Revenue Authority (GRA) Taxpayer Identification Number (TIN / Ghana Card PIN), and applicable statutory levies (VAT, NHIL, GETFund, COVID-19 Health Recovery Levy).

### C. Cashier & Staff Till Data *(Currently Implemented)*
* **Staff Profiles:** Cashier full name, mobile telephone number, outlet branch assignment, role permissions (`user_roles`, `branch_users`).
* **Till Fast-Switch Credentials:** Salted 4-digit numeric PIN hashes (`pin_hash`, `pin_salt`) used for rapid station unlock and cashier shift handover.

### D. Transaction & Point-of-Sale Records *(Currently Implemented)*
* **Sales Records:** Sequential receipt numbers, transaction timestamps, items purchased (SKU, barcode, item name, unit price, quantity), tax components, discounts, and grand totals formatted in Ghanaian Cedis (`GH₵`).
* **Payment Classification:** Payment method signal selected at checkout (`cash`, `momo` [Mobile Money], `card`). *Note: SikaPOS logs transaction reference signals and payment provider statuses, not private financial account PINs.*
* **Retail Customer Data:** *(Currently Optional / Future Phase)* Customer phone number or name where entered for digital e-receipt issuance or store credit.

### E. Hardware Terminal & Device Telemetry *(Currently Implemented)*
* **Device Registry:** Hardware terminal identifier (`device_identifier`), device name (e.g., "Counter Till #01"), device category (`pos_terminal`, `tablet`, `mobile`, `desktop`), hardware model, operating system user-agent.
* **Health & Sync Status:** Terminal heartbeat timestamps, last sync timestamp, network connectivity mode (`online`, `pending`, `offline`).

### F. Security, Audit & Technical Logs *(Currently Implemented)*
* **Security Audit Trail:** IP address, user-agent string, action codes (e.g., merchant login, password change, tax profile modification, drawer void), entity identifiers, and audit timestamp.
* **Local Storage Cache:** Client-side Web Storage (`localStorage`) storing transient authentication session tokens and cached catalog items for offline operation.

---

## 4. How We Use Information

We process personal and transactional data for the following legitimate purposes:
1. **Service Delivery:** Providing multi-tenant POS terminal software, catalog management, barcode lookup, and receipt generation.
2. **Account Security & Verification:** Authenticating merchants and cashiers via OTP phone verification and PIN hashing.
3. **Tax & Regulatory Compliance:** Calculating statutory VAT/NHIL/GETFund levies accurately for merchant accounting.
4. **Offline Resilience:** Queueing transactions locally on POS terminals during cellular or broadband outages and synchronizing automatically once reconnected.
5. **Fraud Prevention & Audit:** Maintaining tamper-evident audit logs of sensitive till events, shift closures, and permission changes.

---

## 5. Legal Basis for Processing (Ghana Act 843)

Under Section 20 of the Ghana Data Protection Act, 2012 (Act 843), our processing is grounded upon:
* **Consent (Section 20(1)):** Explicit consent obtained from merchants during signup and OTP telephone verification.
* **Contractual Necessity (Section 20(2)(a)):** Necessary for the performance of the merchant service agreement and checkout terminal operations.
* **Legal Obligation (Section 20(2)(b)):** Compliance with statutory tax computation, electronic commerce requirements, and record-keeping mandates.
* **Legitimate Interests (Section 20(2)(d)):** Ensuring cybersecurity, preventing countertop fraud, and maintaining business continuity.

---

## 6. Business, Product and Inventory Data

* **Catalog Ownership:** Product names, SKUs, wholesale cost prices, and inventory stock counts belong to the merchant tenant and are segregated via strict multi-tenant database isolation.
* **Cross-Tenant Privacy:** No tenant or store owner may access or view product catalogs, margins, or transaction logs belonging to another merchant.

---

## 7. Payment Information & Mobile Money

* **Mobile Money (MTN MoMo, Telecel Cash, AT Money):** We facilitate payment signals and receipt recording. We do **not** collect, store, or view customer Mobile Money wallet secret PINs.
* **Card Payments (Gh-Link, Visa, Mastercard):** Future integrated card transactions are handled via licensed Bank of Ghana Payment Service Providers (PSPs) compliant with PCI-DSS standards. Cardholder PANs and CVVs never traverse or persist in our database.

---

## 8. Authentication and Security

* **Cryptographic Storage:** Passwords and PINs are salted and hashed using industry-standard one-way cryptographic algorithms.
* **Session Management:** Web and terminal API sessions are managed via server-authoritative encrypted Bearer tokens with strict expiration timeouts.
* **Role-Based Access Control (RBAC):** Cashiers have access restricted strictly to their assigned branch tills and cannot view business-wide financial profit reports or tax administration screens.

---

## 9. Offline Storage and Synchronization

* SikaPOS is built with an **offline-first architecture** designed for Ghanaian network conditions.
* During connectivity interruptions, transactions, receipt numbers, and line items are stored securely in local device storage.
* Once the device detects active internet connectivity, offline transactions are uploaded sequentially to the cloud server and reconciled. Merchants are responsible for ensuring that physical POS devices remain password-protected against unauthorized physical inspection while offline.

---

## 10. Cookies, Web Storage, and Telemetry

* **Local Storage:** Used exclusively for storing session authentication tokens, theme configurations, and offline catalog cache.
* **Tracking & Analytics:** SikaPOS does **not** sell merchant or consumer data to third-party ad networks or tracking brokers. Minimal operational performance telemetry is collected solely to detect crash errors.

---

## 11. Third-Party Service Providers

To operate our cloud infrastructure and telecommunication interfaces, we partner with:
* **SMS & OTP Providers:** Licensed Ghanaian telecommunications aggregators and SMS gateways for delivering OTP login verification codes.
* **Cloud Hosting:** Cloud infrastructure hosting servers, databases, and continuous encrypted backups.
* **Mapping / Geolocation:** Digital address verification services for GhanaPost GPS formatting.

*All third-party service providers are bound by strict confidentiality and data protection agreements consistent with Act 843.*

---

## 12. Data Sharing and Disclosure

We do not sell, rent, or trade personal data. We only disclose personal information under the following circumstances:
1. **To Law Enforcement or Regulators:** When strictly compelled by a lawful court order, subpoena, or statutory warrant under Ghanaian law.
2. **Business Transfers:** In the event of a merger, acquisition, or restructuring, subject to equivalent privacy safeguards.
3. **With Explicit Consent:** When a merchant expressly authorizes an integration (e.g., third-party accounting software or delivery logistics).

---

## 13. Data Retention

* **Merchant Account Data:** Retained for the duration of the active subscription plus a statutory archive period of [6 YEARS] to satisfy Ghanaian tax and commercial accounting obligations.
* **Audit & Security Logs:** Stored for [12 MONTHS] for forensic verification and cybersecurity maintenance, after which records are rotated or anonymized.
* **OTP Verification Codes:** Expire within 5 to 10 minutes and records are purged after verification lifecycle completion.

---

## 14. International Data Transfers

Where cloud servers, disaster-recovery replicas, or backup instances reside outside the borders of the Republic of Ghana, we ensure compliance with **Section 47 of Act 843**. Transfers are executed only to jurisdictions providing an adequate level of data protection or pursuant to standard contractual clauses ensuring equivalent safeguards.

---

## 15. User Rights Under Ghana Act 843

Under the Data Protection Act, 2012, merchants, cashiers, and consumers possess the following fundamental rights:
1. **Right of Access (Section 35):** Request confirmation and a copy of personal data held about you.
2. **Right to Rectification (Section 33):** Request immediate correction of inaccurate, incomplete, or misleading data.
3. **Right to Erasure / De-registration (Section 39):** Request deletion of personal records where processing is no longer supported by law or contract.
4. **Right to Object to Processing (Section 34):** Object to processing likely to cause unwarranted damage or distress, or for direct marketing.
5. **Right to Lodge a Complaint:** You have the statutory right to file a complaint with the **Data Protection Commission (DPC)** of Ghana (`www.dataprotection.org.gh`) if you believe your rights have been infringed.

---

## 16. Technical and Organisational Security Measures

In accordance with **Section 28 of Act 843**, we implement:
* TLS 1.3 encryption in transit for all communications between POS devices and cloud API servers.
* Database-level multi-tenant isolation ensuring organizational boundaries are strictly enforced in application middleware and SQL queries.
* Daily encrypted database backups.
* Least-privilege access controls for engineering staff accessing server environments.

---

## 17. Children's Privacy

SikaPOS is a commercial retail platform intended strictly for adult business operators, merchants, and authorized employees aged 18 and above. We do not knowingly collect personal data from minors.

---

## 18. Merchant Responsibilities (Data Controller Hand-Off)

As a merchant using SikaPOS:
* You are the primary **Data Controller** regarding personal details you collect from your retail customers (e.g., customer mobile numbers entered for promotional discounts or loyalty points).
* You must inform your customers of the purpose for which you capture their phone numbers at checkout and obtain appropriate consent where required by Act 843.
* You are responsible for safeguarding cashier PINs and preventing unauthorized physical access to logged-in POS countertop terminals.

---

## 19. Changes to This Privacy Policy

We may periodically revise this Privacy Policy to reflect system enhancements, legal updates, or DPC directives. We will notify merchants of material revisions via in-app notification or email prior to changes taking effect.

---

## 20. Contact Information and Inquiries

For privacy inquiries, data subject access requests, or regulatory questions regarding Mastermade Solutions:

* **Entity:** Mastermade Solutions (trading as SikaPOS)
* **Data Protection Contact:** `privacy@mastermadesolutions.com` / `support@sikapos.com`
* **Phone Support:** +233 24 000 0000
* **Postal / Physical Address:** [Registered office address in Accra, Ghana to be finalized upon registration completion]
* **Data Protection Commission Ghana Reference:** [DPC registration to be filed upon formal company registration]

---

> **END OF PRIVACY POLICY DRAFT**  
> *Awaiting final company registration details before production deployment.*
