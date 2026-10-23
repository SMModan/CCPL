# Comprehensive Cleaning

Website and lead CRM for Comprehensive Cleaning Pty Ltd. The public site and the CRM are one app in `client`. The public pages use the Sodexo layout.

The public copy does not invent clients, years in business, or certificates. Phone, photography, and the privacy and terms pages are waiting on the company.

## Run

Node.js 22 or newer.

```bash
npm install --prefix server
npm install --prefix client
npm test
npm run dev
```

The site is http://127.0.0.1:5173 . The CRM is http://127.0.0.1:5173/crm . The API is http://127.0.0.1:4000.

The public site is photographic, service-led, and built around the approved blue star logo.

## CRM

Pipeline: New, Contacted, Qualified, Site Assessment, Proposal / Quote, Won, Lost, Not Suitable.

Demo sign-in, local only:

- david.simpson@comprehensivecleaning.local / Assessment-2026
- operations@comprehensivecleaning.local / Pipeline-2026

Set `ADMIN_PASSWORD` and `SALES_PASSWORD` before any shared deployment. Sample leads can be removed from the Leads screen. Website enquiries are stored immediately. The acknowledgement email is queued until an email account is connected.
