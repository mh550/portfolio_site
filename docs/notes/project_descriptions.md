# Project Descriptions

> Source notes, cleaned up from voice transcription. Working reference for portfolio content — not published copy.

---

## MAXX Potential

### 1. Linear Adoption — QA/Engineering issue tracking + agentic bug workflow

When I came onto the project, QA was a scattered system: issues were tracked across various Google Sheets, with each team member keeping their own sheet, filing bugs in their own columns with whatever information they chose to track. Our lead engineer also wasn't marking issues as completed — instead, it was our job to identify which issues had been resolved in the new build, retest those features, and make sure statuses were updated. There was no tracking of when issues moved across states, and no categories, tags, or other tooling.

From my previous role at Builder Clarity, I'd learned about issue-tracking software, and I pushed to adopt **Linear** as our tool. Linear had several advantages:

- A very good API
- Strong user experience
- Comments, status history, and a full timeline per issue
- Git integration
- Crucially, an **MCP server**, plus community-built CLI tools

Because our lead engineer was already using Claude Code for a lot of this work — in fact, manually converting issues from our spreadsheet into markdown in order to triage and fix bugs — I figured Linear would let him do those same actions, but *fetch* and *update* issues directly from his agentic AI development workflow.

This was very successful. The team became much more organized and was able to automate much of the bug-fixing process across **filing, triage, and implementation**:

- **Bug filing and triage became fully automated.** Duplicates are automatically identified — instead of creating a new issue, a comment is appended to the existing one.
- **Triage** attempts to identify the root cause of each issue and gives the developer the key context needed to decide how the fix should be approached.

**Outcome (from profile):** doubled sprint throughput; cut bug-filing time by ~80%.

### 2. Migration Adoption — database migration tracking

Early on with this team, I noticed migrations weren't tracked at all. The development database was created by pulling the schema and data from remote, then seeding the database from that state. When developers were concurrently working on different features, they'd end up with development databases based on different versions of the production database. We ended up with conflicts in our migrations — and on more than one occasion, it cost us hours of debugging.

*(Note: original transcription cut off here. Resolution/approach to be filled in — what migration tooling/process was introduced.)*

### 3. React Native & Full-Stack Development — paint estimator app

I worked on full-stack development for a paint company. We built an application that lets estimators quickly determine how much a paint job would cost by breaking a job down hierarchically:

- A job is broken into **areas / rooms**
- Each area is broken into multiple **features** (paint, carpentry, etc.)
- Each feature is broken into multiple **tasks**

I joined this project at go-live with little React Native experience — beyond a simple preview mobile app for a side project. Despite that, I was able to:

- Establish development paradigms for the team
- Get my head around complex React Native concepts like `KeyboardAvoidingView`, which requires different implementations across platforms
- Consolidate features and functionality into simpler, more reusable modules

---

## Builder Clarity

### 1. GoHighLevel ↔ JobTread Integration

I built an integration between **GoHighLevel** and **JobTread** to provide a white-glove CRM implementation for our customers. It solved a gap where users couldn't seamlessly move CRM contacts and opportunities into JobTread at the appropriate pipeline stage.

I studied both APIs, then crafted an integration using **Supabase** as the backend to bridge the two platforms. I leveraged existing tooling within both platforms — including GoHighLevel's automation tools — to ship a quick proof of concept built on existing features, then built my own features where needed.

At its core, this was an **ETL challenge** across both platforms, paired with a **deduplication challenge**. I started by mapping out the data structures in each platform.

**JobTread data model:**

- Each *tenant* is an **organization**; each organization has many internal users.
- Each organization has many **customers/accounts**.
- Customers/accounts have many **locations**; locations have many **jobs**.
- Customers/accounts also have many **contacts**.
- Each job has one location. Each location has one customer. Each location has one contact.
- Each contact can have one **user** — the associated user object for that contact when they access the platform (e.g., to sign a form).
- Each contact has an email and phone number, but both are **custom fields** in JobTread.

**GoHighLevel data model:**

- Each *tenant* is a **subaccount** (the agency is the parent account).
- Each subaccount has many internal users.
- Each organization has many **contacts** and many **opportunities**.
- Each opportunity has one contact.
- An opportunity moves through multiple **pipeline stages**.

**The sync logic:** When a GoHighLevel opportunity reaches a certain pipeline stage (a different stage ID per tenant), we want to find or create a **customer, contact, location, and job** in JobTread.

Originally I attempted to match a GoHighLevel contact to a JobTread *customer*, since we'd already spent a lot of time on the integration design and needed a proof of concept for our customers. But to make the integration robust and time-saving, I decided to map a JobTread *contact* to a GoHighLevel contact instead.

The **find-or-create logic used a waterfall** of match conditions: first match on phone number, then email, then name. I implemented this find-or-create logic for JobTread customers first (the parent structure), then contacts, then locations, then jobs. The JobTread location's contact was set to the contact found or created in the previous steps.

From this foundation I built more features. The design let me leverage automations **either direction** — actions from GHL → JobTread, or from JobTread → GHL.

### 2. RingCentral ↔ JobTread Integration

Using **Zapier**, I built an integration between **RingCentral** and **JobTread**. The core need was a unified customer communication thread, so that JobTread users could see all communication with a customer made by anyone at the company.

Implementation: I matched the phone numbers from inbound/outbound calls and texts to JobTread contacts. If multiple contacts matched a number, the integration logged the communication to each one.

I used JobTread's **comment-thread API endpoint**, creating a single thread for overall customer communications and appending call summaries, transcriptions, and action items as comments.
