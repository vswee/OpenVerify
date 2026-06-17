

# OpenVerify Terms of Service

**Effective date:** [Insert date]  
**Last updated:** [Insert date]

These Terms of Service govern access to and use of OpenVerify, an identity verification service for Trinidad and Tobago onboarding and KYC flows.

By creating an account, using the dashboard, integrating the API, creating a deployment, sending a user to OpenVerify, or otherwise using the service, you agree to these Terms.

If you are an individual completing verification because a business sent you to OpenVerify, the parts of these Terms that apply to end users also apply to you.

This is a serious identity verification product, not a novelty form with a camera button. Use it accordingly.

---

## 1. Definitions

In these Terms:

- **OpenVerify**, **we**, **us**, or **our** means [Insert legal company name], the operator of the OpenVerify service.
- **Service** means the OpenVerify website, dashboard, hosted verification flow, API, integrations, webhooks, documentation, and related services.
- **Customer** means a business, organisation, or person that creates an OpenVerify account or uses OpenVerify to request identity verification.
- **Admin** means a user authorised to manage a Customer account, deployments, integrations, or verification records.
- **Super Admin** means a system-level OpenVerify administrative user with access to all accounts, deployments, verification records, and platform settings.
- **End User** means a person who is asked by a Customer to complete identity verification through OpenVerify.
- **Deployment** means a Customer-created configuration used to organise verification sessions, API credentials, webhook settings, and verification records.
- **Verification Session** means a specific identity verification attempt by an End User.
- **Verification Data** means information collected, submitted, generated, or processed during verification, including ID card images, selfie images, extracted data, scores, statuses, logs, and review notes.
- **Webhook** means an automated callback sent by OpenVerify to a Customer endpoint with a verification event or result.

---

## 2. The Service

OpenVerify allows Customers to add an identity verification step to their onboarding, KYC, application, membership, access, or compliance workflows.

The Service may include:

- Admin account creation and authentication.
- Deployment creation and management.
- Unique API credentials per deployment.
- Hosted End User verification flows.
- Trinidad and Tobago ID card capture and validation.
- Selfie capture and face comparison.
- Electoral register matching.
- IP geolocation proximity scoring.
- Automated verification scoring.
- Manual review tools.
- Webhook delivery.
- Super Admin oversight.
- Audit logs and security controls.

OpenVerify currently supports only supported versions of the Trinidad and Tobago national identification card. Other identity documents are not supported unless we expressly add them.

---

## 3. Account Registration

To use the Customer dashboard or API, you must create an account.

You agree to provide accurate account information and keep it up to date.

The first account created in the system may automatically receive Super Admin access. Later accounts may be assigned Admin or other roles based on system configuration, invitation, or approval.

You are responsible for all activity under your account, including actions taken by your Admins, reviewers, employees, contractors, agents, systems, and integrations.

You must keep login credentials, API keys, webhook secrets, and other access credentials secure.

---

## 4. Customer Responsibilities

Customers are responsible for how they use OpenVerify.

You agree that you will:

1. Use OpenVerify only for lawful and appropriate identity verification purposes.
2. Have a valid reason to request identity verification from each End User.
3. Provide clear notice to End Users before sending them to OpenVerify.
4. Explain why verification is required and how the result will be used.
5. Obtain any consent, authority, or legal basis required for your use case.
6. Use Verification Data only for the purpose disclosed to the End User.
7. Limit access to Verification Data to authorised personnel.
8. Protect dashboard accounts, API keys, webhook secrets, and exported data.
9. Keep webhook endpoints secure and available.
10. Review verification outcomes responsibly.
11. Avoid relying blindly on automated scores where human judgement or legal review is required.
12. Comply with all applicable laws, regulations, rules, and industry obligations.

OpenVerify provides verification signals and status results. It does not replace your legal, compliance, risk, or decision-making obligations.

---

## 5. End User Responsibilities

End Users must provide accurate, current, and genuine information when completing verification.

End Users must not:

- Submit someone else’s ID card without authority.
- Submit fake, altered, stolen, or misleading documents.
- Submit a selfie of another person.
- Attempt to bypass image, face, device, or fraud checks.
- Interfere with the verification flow.
- Abuse, attack, scrape, reverse engineer, or overload the Service.

If an End User does not want to complete verification through OpenVerify, they should stop the process and contact the Customer that requested verification.

---

## 6. Deployment and API Credentials

Each deployment may have unique public and secret credentials.

Customers must:

- Store secret keys securely.
- Never expose secret API keys in frontend code, public repositories, mobile apps, screenshots, logs, or client-side bundles.
- Rotate credentials if compromise is suspected.
- Restrict deployment usage to approved origins and systems.
- Keep webhook URLs and receiving systems secure.
- Validate webhook signatures before trusting results.

We may suspend or revoke credentials if we reasonably believe they have been exposed, abused, misused, or used in breach of these Terms.

---

## 7. Verification Results and Scores

OpenVerify may generate verification results using a combination of automated and manual checks.

These may include:

- ID card layout confidence.
- OCR confidence.
- Face match score.
- Electoral register match confidence.
- IP geolocation proximity.
- Image quality checks.
- Manual reviewer decisions.

Verification statuses may include:

- `created`
- `started`
- `processing`
- `verified`
- `needs_review`
- `rejected`
- `resubmission_requested`
- `expired`
- `cancelled`
- `error`

A `verified` result means that the submitted verification passed OpenVerify checks according to the applicable deployment configuration and scoring rules. It does not guarantee that the person is free from fraud risk or that the Customer should approve every related application, account, transaction, or request.

A `needs_review` result means the system could not automatically complete verification with sufficient confidence.

A `rejected` result means the verification failed according to the applicable checks or manual review outcome.

Customers remain responsible for final decisions made using OpenVerify results.

---

## 8. Manual Review

OpenVerify may allow authorised Admins, reviewers, or Super Admins to manually review Verification Data.

Manual review may include inspecting:

- ID card image.
- Selfie image.
- Extracted text.
- Face comparison result.
- Electoral register match result.
- IP geolocation result.
- Score breakdown.
- Technical metadata.
- Audit history.

Manual reviewers must make decisions carefully, fairly, and consistently. They must not use Verification Data for unrelated purposes.

OpenVerify may log all manual review actions, including reviewer identity, timestamp, previous status, new status, and reason.

---

## 9. Webhooks

OpenVerify may send webhook events to Customer-configured endpoints.

Customers are responsible for:

- Providing correct webhook URLs.
- Keeping receiving systems available.
- Validating webhook signatures.
- Rejecting stale or invalid webhook requests.
- Handling duplicate webhook events safely.
- Maintaining their own logs and reconciliation processes.

OpenVerify may retry failed webhook deliveries but does not guarantee that every webhook will be delivered successfully in all circumstances.

Customers should use the dashboard or API to reconcile verification status where necessary. Apparently even webhooks, those tiny messengers of modernity, can fall into a ditch.

---

## 10. Privacy and Data Protection

Our Privacy Policy explains how OpenVerify collects, uses, stores, shares, protects, and deletes personal information.

By using OpenVerify, Customers agree to comply with applicable privacy and data protection laws, including Trinidad and Tobago data protection requirements where applicable.

Customers must not use OpenVerify unless they have the required authority, consent, lawful basis, and notices for their use of Verification Data.

Customers must handle Verification Data as sensitive information and must not export, copy, disclose, retain, or reuse it unnecessarily.

If a Customer receives a request from an End User about access, correction, deletion, dispute, complaint, or challenge of a verification result, the Customer must respond responsibly and cooperate with OpenVerify where needed.

---

## 11. Data Retention and Deletion

OpenVerify may retain Verification Data for as long as reasonably necessary to provide the Service, comply with legal or contractual obligations, resolve disputes, maintain audit logs, detect fraud, improve security, or enforce agreements.

Default retention periods may include:

- Raw ID card and selfie images: usually 30 to 90 days.
- Failed or abandoned verification assets: usually 7 to 30 days.
- Verification metadata and results: usually 1 to 3 years.
- Audit logs: usually 3 to 7 years.

Actual retention may vary depending on Customer configuration, contract terms, legal requirements, operational needs, or security concerns.

Customers must not retain exported Verification Data for longer than necessary for their disclosed purpose, unless they have a lawful reason to do so.

---

## 12. Security

OpenVerify uses reasonable technical and organisational safeguards designed to protect the Service and Verification Data.

These may include:

- Account authentication.
- Role-based access controls.
- Private object storage.
- Short-lived signed file access.
- API key hashing.
- Webhook signing.
- Audit logging.
- Encryption in transit.
- Restricted service credentials.
- Monitoring and rate limiting.

Customers are responsible for securing their own systems, accounts, API keys, devices, employees, contractors, networks, webhook endpoints, and downstream uses of Verification Data.

No online service can be guaranteed perfectly secure. Anyone promising perfect security is either confused, marketing something, or both.

---

## 13. Prohibited Uses

You must not use OpenVerify to:

- Break the law.
- Violate privacy, data protection, consumer protection, employment, financial, anti-discrimination, or other applicable obligations.
- Verify people without proper notice, consent, authority, or lawful basis.
- Build unrelated biometric databases.
- Track, profile, or surveil people outside the disclosed verification purpose.
- Harass, intimidate, exploit, or discriminate against people.
- Submit fake, stolen, altered, or unauthorised documents.
- Attempt to reverse engineer, scrape, attack, overload, probe, or bypass the Service.
- Share API keys or credentials publicly.
- Resell the Service unless expressly authorised in writing.
- Use the Service for high-risk, regulated, or legally sensitive decisions without appropriate review and safeguards.

We may suspend or terminate access if we believe the Service is being misused.

---

## 14. Availability and Changes

We aim to provide a reliable Service, but we do not guarantee uninterrupted or error-free operation.

The Service may be unavailable because of:

- Maintenance.
- Infrastructure issues.
- Third-party provider failures.
- Security incidents.
- Network problems.
- Legal or compliance requirements.
- Misconfiguration by Customers.

We may change, improve, limit, suspend, or discontinue parts of the Service from time to time.

Where reasonable, we will give notice of material changes that affect Customer use of the Service.

---

## 15. Beta or Test Features

OpenVerify may offer beta, test, preview, or experimental features.

These features may be incomplete, unreliable, inaccurate, changed, restricted, or removed at any time.

Customers should not rely on beta features for high-risk production decisions unless we expressly agree otherwise in writing.

---

## 16. Fees and Payment

Fees, billing terms, usage limits, and payment schedules will be set out in an order form, invoice, pricing page, or separate agreement.

Unless otherwise agreed:

- Fees are due as stated on the invoice or order form.
- Fees are non-refundable except where required by law or expressly agreed.
- We may suspend access for overdue payment.
- Taxes, duties, and bank charges are the Customer’s responsibility.

If no paid plan has been agreed, access may be limited, temporary, trial-only, or beta-only.

---

## 17. Intellectual Property

OpenVerify and its software, interfaces, workflows, documentation, designs, branding, API, dashboard, and related materials are owned by OpenVerify or its licensors.

These Terms do not transfer ownership of OpenVerify intellectual property to Customers or End Users.

Customers retain ownership of their own business data and materials.

End Users retain rights they have in their personal information, subject to the processing required to provide the Service and comply with applicable obligations.

Customers may use OpenVerify documentation and integration materials only to integrate with and use the Service as permitted by these Terms.

---

## 18. Feedback

If you provide suggestions, ideas, feature requests, bug reports, or other feedback, we may use that feedback without restriction or compensation.

We are not required to treat feedback as confidential unless we separately agree in writing.

---

## 19. Third-Party Services

OpenVerify may depend on third-party services for hosting, storage, databases, OCR, face comparison, email, monitoring, analytics, security, geolocation, or other operational functions.

We are not responsible for third-party services outside our reasonable control.

Customers are responsible for any third-party systems they connect to OpenVerify, including webhook receivers, onboarding platforms, CRMs, customer databases, and internal tools.

---

## 20. Suspension and Termination

We may suspend or terminate access to OpenVerify if:

- You breach these Terms.
- You fail to pay fees when due.
- Your use creates security, privacy, legal, operational, or reputational risk.
- Your API credentials are exposed or abused.
- You use the Service unlawfully or without proper authority.
- We are required to do so by law or regulatory obligation.
- Continued access could harm OpenVerify, Customers, End Users, or others.

Customers may stop using OpenVerify at any time, subject to any payment, retention, deletion, or contractual obligations.

Termination does not automatically delete all retained records where continued retention is required for legal, audit, fraud prevention, security, dispute, or operational reasons.

---

## 21. Disclaimers

OpenVerify is provided on an **as is** and **as available** basis, to the maximum extent permitted by law.

We do not warrant that:

- The Service will be uninterrupted or error-free.
- Every verification result will be correct.
- Every fraudulent submission will be detected.
- Every legitimate user will be automatically approved.
- OCR, face comparison, geolocation, or register matching will always be accurate.
- The Service will meet every Customer legal, regulatory, or business requirement.

Customers must apply their own judgement, policies, and legal review when using verification results.

---

## 22. Limitation of Liability

To the maximum extent permitted by law, OpenVerify will not be liable for indirect, incidental, special, consequential, exemplary, or punitive damages, or for loss of profits, revenue, goodwill, data, business opportunity, or anticipated savings.

To the maximum extent permitted by law, OpenVerify’s total liability for claims arising out of or relating to the Service will not exceed the amount paid by the Customer to OpenVerify for the Service during the three months before the event giving rise to the claim, or [Insert amount], whichever is greater.

Nothing in these Terms limits liability that cannot lawfully be limited.

---

## 23. Indemnity

Customers agree to indemnify and hold harmless OpenVerify, its directors, officers, employees, contractors, affiliates, and service providers from claims, losses, damages, liabilities, costs, and expenses arising from:

- Customer misuse of the Service.
- Customer breach of these Terms.
- Customer failure to provide proper notice, consent, authority, or lawful basis.
- Customer use of verification results.
- Customer systems, webhook endpoints, integrations, or data handling.
- Customer violation of law or third-party rights.
- Unauthorised access caused by Customer credential exposure or poor security practices.

---

## 24. Confidentiality

Non-public information about OpenVerify, its systems, pricing, security controls, API credentials, and business operations may be confidential.

Customers must not disclose confidential OpenVerify information except as needed to use the Service or as required by law.

OpenVerify will treat Customer non-public information as confidential and use it only to provide, secure, support, improve, and administer the Service, or as otherwise permitted by these Terms, the Privacy Policy, or a separate agreement.

---

## 25. Notices

We may send notices through:

- The dashboard.
- Email.
- Website notices.
- Account notifications.
- Other reasonable contact methods.

Customers are responsible for keeping contact details accurate.

---

## 26. Changes to These Terms

We may update these Terms from time to time.

If changes are material, we will take reasonable steps to notify Customers.

Continued use of the Service after updated Terms take effect means you accept the updated Terms.

The version published on our website is the current version.

---

## 27. Governing Law and Disputes

These Terms are governed by the laws of Trinidad and Tobago, unless another governing law is agreed in writing.

The courts of Trinidad and Tobago will have jurisdiction over disputes arising from or relating to these Terms or the Service, unless a separate written agreement states otherwise.

Before starting formal proceedings, the parties should try to resolve disputes in good faith. Civilisation occasionally rewards this, though not often enough.

---

## 28. Contact

For questions about these Terms, contact:

**OpenVerify Legal Contact**  
**Email:** [Insert legal contact email]  
**Address:** [Insert postal address]

---

## 29. Legal Review Notice

These Terms are a working draft for product development and should be reviewed by a qualified Trinidad and Tobago attorney before public launch or production use.