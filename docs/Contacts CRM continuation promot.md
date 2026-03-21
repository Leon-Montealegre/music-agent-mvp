Context: Music Release Management App — Phase 3 CRM Contacts

I'm building a personal release management dashboard for an electronic music artist. The app is fully live on the cloud (Node.js/Express backend + Next.js frontend + PostgreSQL + Cloudflare R2). Auth, multi-tenancy, releases, collections, and distribution entries are all working.

What the app tracks today:

Every release or collection has "distribution entries" — individual actions like uploading to a platform, submitting to a label, or pitching to a promo blog. Each entry can have contacts attached to it (e.g. "A&R at Anjuna named Sophie", added directly on that specific submission). Those contacts are stored as raw, loose text tied to each individual entry — they are not a shared resource. If Sophie appears in 10 submissions, there are 10 separate copies of her name.

The problem — why we need the CRM:

Right now contacts are completely duplicated across entries. There is no concept of a "person" in the system — only strings that happen to repeat. This means:

If Sophie changes her email, I have to find and update every single submission entry manually.

There is no way to see "all submissions involving Sophie" in one place.

There is no history, follow-up reminders, or response tracking per contact.

The existing Contacts page in the app is a read-only, client-side aggregation that just deduplicates by name visually — it does not write anything back, it cannot be edited, and it is purely cosmetic.

What Phase 3 CRM needs to do:

Replace the current per-entry loose contact strings with a proper shared contacts store, backed by the existing contacts table and entry_contacts join table already defined in the PostgreSQL schema. The key principle is: one person = one row. Contacts are first-class entities that exist independently of any submission.

Concretely this means:

Shared contact store — Create, edit, and delete contacts as standalone entities. Editing a contact's name or email updates it everywhere it is linked automatically (because all entries reference the same row by UUID).

Contact picker on entry pages — When adding a contact to a label submission or promo entry, the user searches and selects from their existing contacts list instead of typing free text. They can also create a new contact inline.

Contact detail view — From the Contacts page, click a contact to see all submissions and promo deals they are linked to, with status (Pending / Interested / Signed / Passed / No Reply).

Follow-up reminders — Each submission entry can have an optional follow-up date. Overdue follow-ups surface as a badge on the home page.

Label response tracking — Each submit-type distribution entry gets a response status field: No Reply / Passed / Interested / Signed.

What stays the same:

The distribution entries model, release/collection structure, and all existing endpoints are untouched.

The contacts table and entry_contacts join table already exist in the schema — no schema invention needed, just implement the backend routes and frontend UI against them.

Your job:
Design and implement this feature step by step. Start with the smallest working slice: the backend CRUD endpoints for the contacts table, then the contact picker on an entry page, then the upgraded Contacts page. Work one small step at a time and explain what each step does before writing code.

