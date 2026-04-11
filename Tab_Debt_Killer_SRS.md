**SOFTWARE REQUIREMENTS SPECIFICATION**

**Tab Debt Killer**

*Chrome Extension --- Intelligent Tab Management & Resurfacing*

Version 1.0 (Draft)

Prepared for: Tab Debt Killer Development Team

Date: April 11, 2026

Classification: Confidential

**Revision History**

  ------------- --------------- --------------- -----------------------------
  **Version**   **Date**        **Author**      **Description**

  1.0           Apr 12, 2026    Development     Initial SRS draft
                                Team            
  ------------- --------------- --------------- -----------------------------

**Table of Contents**

**1. Introduction**

**1.1 Purpose**

This Software Requirements Specification (SRS) document describes the
functional and non-functional requirements for Tab Debt Killer, a Google
Chrome browser extension. It is intended to serve as the definitive
reference for the development team, QA engineers, and stakeholders
throughout the product lifecycle.

**1.2 Product Overview**

Tab Debt Killer is a Chrome extension that solves the widespread problem
of unmanageable browser tab accumulation --- commonly known as \"tab
debt.\" It automatically organizes open tabs into named groups, saves
and restores full browser sessions, and intelligently resurfaces
forgotten tabs based on what the user is currently researching or
typing.

The extension operates entirely within the browser with no external
server communication in v1, making it private by design.

**1.3 Scope**

Version 1.0 of Tab Debt Killer includes the following capability
domains:

-   Automatic tab clustering and group naming

-   One-click session save and restore

-   A session management sidebar

-   Intelligent tab resurfacing via content-script input monitoring

-   Freemium licensing enforcement (up to 5 saved sessions on the free
    tier)

The following are explicitly out of scope for v1:

-   Cross-device sync

-   AI/LLM-based tab summarization

-   Team or multi-user session sharing

-   Firefox or Safari support

-   Mobile browser support

**1.4 Definitions and Acronyms**

  ---------------- ------------------------------------------------------
  **Term /         **Definition**
  Acronym**        

  Tab Debt         The accumulation of a large number of open browser
                   tabs that the user can no longer effectively manage.

  Session          A named, timestamped snapshot of all open tabs and
                   their group assignments in a browser window.

  Tab Group        A Chrome-native feature (chrome.tabGroups) that
                   visually clusters tabs under a labeled, colored
                   header.

  Resurfacing      The act of proactively suggesting a previously saved
                   or open tab to the user based on contextual relevance.

  TF-IDF           Term Frequency-Inverse Document Frequency --- a
                   lightweight text relevance scoring algorithm used for
                   tab matching.

  MV3              Manifest Version 3 --- the current Chrome extension
                   manifest format required by Google.

  Service Worker   The MV3 replacement for background pages; runs
                   episodically and handles tab and storage events.

  SRS              Software Requirements Specification --- this document.

  FR               Functional Requirement

  NFR              Non-Functional Requirement
  ---------------- ------------------------------------------------------

**1.5 References**

-   Chrome Extension Manifest V3 documentation ---
    https://developer.chrome.com/docs/extensions/mv3/

-   chrome.tabs API ---
    https://developer.chrome.com/docs/extensions/reference/tabs/

-   chrome.tabGroups API ---
    https://developer.chrome.com/docs/extensions/reference/tabGroups/

-   chrome.storage API ---
    https://developer.chrome.com/docs/extensions/reference/storage/

-   Lemon Squeezy licensing API --- https://docs.lemonsqueezy.com/

**2. Overall Description**

**2.1 Product Perspective**

Tab Debt Killer is a standalone Chrome extension. It integrates with the
Chrome browser through the extension APIs and does not depend on any
external web service in v1. All data (sessions, group metadata,
settings) is persisted in chrome.storage.local on the user\'s device.

The extension\'s three UI surfaces are: (1) a toolbar popup for quick
actions, (2) a side panel for session management, and (3) a
non-intrusive content-script overlay for tab resurfacing.

**2.2 User Classes and Characteristics**

  ---------------- ------------------------------------------------------
  **User Class**   **Description**

  Primary ---      A professional who routinely maintains 20-80+ browser
  Knowledge Worker tabs across multiple research threads, projects, or
                   clients. Comfortable with browser extensions. Values
                   speed and minimal friction.

  Secondary ---    A university or school student who opens many
  Student          reference tabs during research but frequently loses
                   track of them. May use the extension on shared
                   devices.

  Secondary ---    A software developer who separates tab contexts by
  Developer        project or ticket. Likely to discover the extension
                   via Product Hunt or Dev.to.

  Tertiary --- Pro Any user who upgrades to the paid tier. Has higher
  Subscriber       volume needs: more than 5 sessions, scheduled
                   restores, and export capabilities.
  ---------------- ------------------------------------------------------

**2.3 Operating Environment**

-   Google Chrome version 114 or higher (Manifest V3 tabGroups API
    stable since v114)

-   Windows 10/11, macOS 12+, Linux (Ubuntu 20.04+, Debian 11+)

-   Minimum 4 GB RAM (browser constraint, not extension-specific)

-   No internet connection required for core functionality in v1

-   Internet required only for license key validation (Pro tier)

**2.4 Assumptions and Dependencies**

-   The chrome.tabGroups API is available and enabled in the user\'s
    Chrome installation.

-   chrome.storage.local quota is sufficient (\~10 MB) for storing up to
    200 sessions of average size.

-   Users grant the required permissions (tabs, tabGroups, storage,
    scripting, sidePanel) on installation.

-   The Lemon Squeezy licensing API is available when a user attempts to
    activate a Pro license key.

-   Users are on Chromium-based browsers only; no polyfills for Firefox
    WebExtensions are included.

**2.5 Constraints**

-   Manifest V3 restricts background scripts to service workers, which
    are terminated after inactivity and cannot maintain long-lived
    connections.

-   Content scripts cannot directly call chrome.tabGroups; all grouping
    operations must be delegated to the service worker via
    chrome.runtime.sendMessage.

-   chrome.storage.local is not encrypted; sensitive data should not be
    stored (and none is).

-   The Chrome Web Store review process adds 1-3 business days to any
    release cycle.

**3. Functional Requirements**

**3.1 Auto Tab Grouping**

**3.1.1 Clustering Algorithm**

The extension shall cluster tabs in the active window by their
normalized hostname on demand and on a configurable schedule.

  --------- ------------------------------ ---------------- --------------
  **ID**    **Requirement**                **Priority**     **Acceptance
                                                            Criterion**

  FR-001    The system shall extract the   Must Have        Given 5 GitHub
            hostname from each tab\'s URL,                  tabs, all
            strip the \'www.\' prefix, and                  share cluster
            use the primary subdomain as                    key
            the cluster key.                                \'github\'.

  FR-002    Tabs with the same cluster key Must Have        After
            shall be grouped using                          grouping, all
            chrome.tabs.group().                            GitHub tabs
                                                            appear under
                                                            one Chrome tab
                                                            group.

  FR-003    Groups containing only one tab Must Have        Single-tab
            shall not be created.                           hostnames
                                                            remain
                                                            ungrouped.

  FR-004    Each group shall be            Must Have        A group of
            automatically named using the                   github.com
            cluster key (capitalized first                  tabs is named
            letter).                                        \'Github\'.

  FR-005    Each group shall be assigned a Should Have      Same hostname
            color from Chrome\'s available                  always
            palette, deterministically                      receives the
            mapped from the cluster key                     same color
            string.                                         across
                                                            sessions.

  FR-006    The user shall be able to      Must Have        Clicking
            trigger auto-grouping via a                     \'Group Tabs\'
            toolbar popup button.                           in the popup
                                                            executes the
                                                            clustering
                                                            algorithm.

  FR-007    The user shall be able to      Could Have       Setting
            configure auto-grouping to run                  threshold to
            automatically when tab count                    10 triggers
            exceeds a configurable                          auto-group
            threshold (default: 10 tabs).                   when the 11th
                                                            tab opens.
  --------- ------------------------------ ---------------- --------------

**3.2 Session Save and Restore**

**3.2.1 Saving a Session**

  --------- ------------------------------ ---------------- ----------------
  **ID**    **Requirement**                **Priority**     **Acceptance
                                                            Criterion**

  FR-008    The user shall be able to save Must Have        Clicking \'Save
            all open tabs in the current                    Session\'
            window as a named session with                  persists all
            one click.                                      tabs and groups
                                                            to storage.

  FR-009    The system shall auto-generate Must Have        Default name
            a session name using the                        matches pattern
            pattern: \'\<most frequent                      without user
            hostname\> --- \<date\>\'                       input.
            (e.g., \'Github --- Apr 12,                     
            2026\').                                        

  FR-010    The user shall be able to      Must Have        A text field in
            provide a custom session name                   the popup allows
            before saving.                                  overriding the
                                                            auto-generated
                                                            name.

  FR-011    Each session shall store:      Must Have        Stored session
            session ID (timestamp), name,                   JSON contains
            save timestamp, tab URL list,                   all specified
            tab titles, and group metadata                  fields.
            (name, color).                                  

  FR-012    Free tier users shall be       Must Have        6th save attempt
            limited to a maximum of 5                       shows upgrade
            saved sessions. Attempting to                   modal, does not
            save a 6th session shall                        save.
            prompt an upgrade notice.                       

  FR-013    Pro users shall have no        Must Have        Pro user can
            session save limit.                             save session 6,
                                                            7, \... without
                                                            restriction.
  --------- ------------------------------ ---------------- ----------------

**3.2.2 Restoring a Session**

  --------- ------------------------------ ---------------- --------------
  **ID**    **Requirement**                **Priority**     **Acceptance
                                                            Criterion**

  FR-014    The user shall be able to      Must Have        All saved tab
            restore a session by opening                    URLs open as
            all its tabs in the current                     tabs in the
            window.                                         active window.

  FR-015    The user shall be able to      Must Have        A \'Restore in
            restore a session in a new                      new window\'
            window.                                         option creates
                                                            a new Chrome
                                                            window with
                                                            the session
                                                            tabs.

  FR-016    On restore, the system shall   Must Have        Restored tabs
            re-create the original tab                      are grouped
            groups with their saved names                   and colored
            and colors.                                     identically to
                                                            the saved
                                                            state.

  FR-017    If a saved URL returns an HTTP Must Have        Broken URLs
            error on restore, the tab                       open (showing
            shall open to the URL anyway;                   error page)
            no silent failures.                             rather than
                                                            being skipped.
  --------- ------------------------------ ---------------- --------------

**3.3 Session Management Sidebar**

  --------- ------------------------------ ---------------- --------------------------
  **ID**    **Requirement**                **Priority**     **Acceptance Criterion**

  FR-018    The extension shall provide a  Must Have        Side panel opens via the
            Chrome Side Panel (sidePanel                    extension action or
            API) for session management.                    chrome.sidePanel.open().

  FR-019    The sidebar shall list all     Must Have        Each session row displays
            saved sessions, showing: name,                  all four data points.
            save date, tab count, and a                     
            preview of up to 3 tab                          
            favicons.                                       

  FR-020    Sessions shall be listed in    Must Have        Latest saved session
            reverse chronological order                     appears at the top of the
            (most recent first).                            list.

  FR-021    The user shall be able to      Must Have        Double-clicking the
            rename any saved session                        session name makes it
            inline.                                         editable; pressing Enter
                                                            saves the new name.

  FR-022    The user shall be able to      Must Have        Delete icon shows a
            delete a saved session with a                   confirmation before
            confirmation prompt.                            removing the session from
                                                            storage.

  FR-023    The sidebar shall provide a    Must Have        Typing \'notion\' shows
            search field that filters                       only sessions containing a
            sessions by name or by tab                      Notion tab.
            title/URL content.                              

  FR-024    Expanding a session row shall  Should Have      Clicking the expand
            reveal a list of all tabs in                    chevron shows tab details.
            that session with title,                        
            favicon, and URL.                               
  --------- ------------------------------ ---------------- --------------------------

**3.4 Tab Resurfacing Engine**

  --------- ------------------------------ ---------------- --------------
  **ID**    **Requirement**                **Priority**     **Acceptance
                                                            Criterion**

  FR-025    The content script shall       Must Have        Input events
            monitor text input events on                    on any page
            \<input\> and \<textarea\>                      trigger the
            elements across all pages.                      matching
                                                            pipeline.

  FR-026    Resurfacing shall activate     Must Have        Queries
            only when the user has typed                    shorter than 5
            at least 5 characters.                          characters
                                                            produce no
                                                            surfacing UI.

  FR-027    The system shall tokenize the  Must Have        Typing
            input text and compare tokens                   \'webpack
            against saved tab titles,                       config\'
            URLs, and meta descriptions                     scores tabs
            using keyword overlap scoring.                  with
                                                            \'webpack\' or
                                                            \'config\' in
                                                            the title.

  FR-028    The system shall also compare  Should Have      An open but
            against currently open                          forgotten tab
            (unsaved) tab titles.                           is surfaced
                                                            even if not
                                                            part of a
                                                            saved session.

  FR-029    If any tab scores above a      Must Have        Notification
            relevance threshold (minimum 2                  appears when
            matching tokens), the system                    score \>= 2
            shall display a resurfacing                     matching
            notification.                                   tokens.

  FR-030    The resurfacing notification   Must Have        Overlay does
            shall be a non-blocking                         not intercept
            overlay positioned at the                       clicks outside
            bottom-right of the viewport,                   itself; max 3
            showing at most 3 suggestions.                  tabs shown.

  FR-031    Each suggestion shall show the Must Have        Suggestion row
            tab\'s favicon, title                           renders all
            (truncated to 50 chars), and                    three
            source (open tab or session                     elements.
            name).                                          

  FR-032    Clicking a suggestion shall    Must Have        Clicking the
            open the corresponding tab (or                  suggestion
            restore and focus it if from a                  navigates the
            session).                                       browser to the
                                                            relevant tab.

  FR-033    The user shall be able to      Must Have        Overlay
            dismiss the overlay with an X                   disappears on
            button or by pressing Escape.                   X click or
                                                            Escape key.

  FR-034    The overlay shall auto-dismiss Must Have        Overlay fades
            after 8 seconds of no                           out after 8
            interaction.                                    seconds if
                                                            untouched.

  FR-035    The user shall be able to      Must Have        Disabling
            disable tab resurfacing                         resurfacing in
            entirely from the extension                     settings stops
            settings.                                       content script
                                                            from surfacing
                                                            overlays.
  --------- ------------------------------ ---------------- --------------

**3.5 Settings**

  --------- ------------------------------ ---------------- ------------------------------
  **ID**    **Requirement**                **Priority**     **Acceptance Criterion**

  FR-036    The extension shall provide a  Must Have        Settings icon in popup opens
            settings page accessible from                   chrome://extensions/?options
            the popup.                                      for this extension.

  FR-037    Settings shall include:        Must Have        All four settings are
            resurfacing on/off, auto-group                  persisted in
            threshold, resurfacing                          chrome.storage.sync.
            sensitivity (token match                        
            count), overlay dismiss                         
            timeout.                                        

  FR-038    Settings shall include a       Must Have        Entering a valid Lemon Squeezy
            license key input field for                     key activates Pro features.
            Pro tier activation.                            

  FR-039    Settings shall be synced       Should Have      Changing settings on one
            across the user\'s Chrome                       device reflects on another
            profile via                                     device logged into same Chrome
            chrome.storage.sync.                            profile.
  --------- ------------------------------ ---------------- ------------------------------

**4. Non-Functional Requirements**

**4.1 Performance**

  --------- ------------------------------ ---------------- ----------------------------
  **ID**    **Requirement**                **Priority**     **Acceptance Criterion**

  NFR-001   Auto-grouping of up to 100     Must Have        Measured via
            tabs shall complete in under 2                  performance.now() in the
            seconds.                                        service worker; p95 \<
                                                            2000ms.

  NFR-002   Session save (up to 200 tabs)  Must Have        chrome.storage.local.set()
            shall complete in under 500ms.                  resolves within 500ms for a
                                                            200-tab session.

  NFR-003   The resurfacing scoring        Must Have        Input handler measured at \<
            pipeline shall complete in                      100ms for a library of 100
            under 100ms per keystroke to                    sessions x 20 tabs.
            avoid perceptible lag.                          

  NFR-004   The extension popup shall      Must Have        Measured from click to first
            render to interactive in under                  interactive state via
            200ms.                                          Lighthouse extension audit.

  NFR-005   The extension\'s total memory  Should Have      Chrome Task Manager shows
            footprint shall not exceed 20                   extension memory usage \< 20
            MB during normal operation.                     MB with 50 sessions stored.
  --------- ------------------------------ ---------------- ----------------------------

**4.2 Reliability**

  --------- ------------------------------ ---------------- ----------------------
  **ID**    **Requirement**                **Priority**     **Acceptance
                                                            Criterion**

  NFR-006   Session data shall not be lost Must Have        chrome.storage.local
            if the browser crashes                          write is atomic; no
            mid-save.                                       partial session is
                                                            committed.

  NFR-007   The service worker shall       Must Have        Tab events continue to
            re-initialize correctly after                   be handled correctly
            Chrome terminates it due to                     after a 30-minute idle
            inactivity.                                     period.

  NFR-008   The content script shall not   Must Have        All content script
            throw unhandled exceptions                      code is wrapped in
            that disrupt the host page.                     try/catch; zero
                                                            unhandled exceptions
                                                            in production logs.
  --------- ------------------------------ ---------------- ----------------------

**4.3 Security and Privacy**

  --------- ------------------------------ ---------------- -------------------------
  **ID**    **Requirement**                **Priority**     **Acceptance Criterion**

  NFR-009   No tab URLs, titles, or        Must Have        Network inspector shows
            session data shall be                           zero outbound requests
            transmitted to any external                     from the extension
            server in v1.                                   (except license
                                                            validation).

  NFR-010   The extension shall not        Must Have        manifest.json lists
            request permissions beyond                      exactly the five
            those required: tabs,                           specified permissions.
            tabGroups, storage, scripting,                  
            sidePanel.                                      

  NFR-011   License key validation shall   Must Have        Lemon Squeezy API call
            occur over HTTPS only.                          uses https:// protocol.

  NFR-012   The extension shall declare a  Must Have        manifest.json includes
            Content Security Policy (CSP)                   content_security_policy
            in the manifest prohibiting                     disabling unsafe-eval and
            eval() and inline scripts.                      unsafe-inline.

  NFR-013   User settings and session data Must Have        Code review confirms no
            stored in chrome.storage shall                  PII beyond URLs/titles is
            not include passwords, form                     captured or stored.
            values, or PII beyond URLs and                  
            page titles.                                    
  --------- ------------------------------ ---------------- -------------------------

**4.4 Usability**

  --------- ------------------------------ ---------------- --------------
  **ID**    **Requirement**                **Priority**     **Acceptance
                                                            Criterion**

  NFR-014   A new user shall be able to    Must Have        Usability
            save their first session                        test: 5/5 new
            within 60 seconds of                            users complete
            installing the extension,                       first save
            without reading any                             within 60
            documentation.                                  seconds.

  NFR-015   The resurfacing overlay shall  Must Have        Overlay is
            not cover primary page content                  positioned in
            or action buttons.                              the
                                                            bottom-right
                                                            corner at
                                                            z-index
                                                            2147483647.

  NFR-016   All interactive elements shall Should Have      Tab navigation
            have visible focus indicators                   reaches all
            for keyboard navigation.                        buttons and
                                                            inputs; focus
                                                            ring is
                                                            visible.

  NFR-017   The extension UI shall         Should Have      Manual test at
            function correctly at both                      both zoom
            100% and 150% browser zoom                      levels shows
            levels.                                         no layout
                                                            breakage.
  --------- ------------------------------ ---------------- --------------

**4.5 Maintainability**

  --------- ------------------------------ ---------------- -----------------
  **ID**    **Requirement**                **Priority**     **Acceptance
                                                            Criterion**

  NFR-018   The codebase shall achieve a   Should Have      Jest coverage
            minimum of 70% unit test                        report shows \>=
            coverage on business logic                      70% for
            modules (grouping algorithm,                    src/grouping.js
            scoring engine).                                and
                                                            src/scoring.js.

  NFR-019   The project shall use Vite     Must Have        Running npm run
            with vite-plugin-web-extension                  dev enables
            for builds, enabling                            extension
            hot-reload during development.                  hot-reload in
                                                            Chrome.

  NFR-020   All modules shall be           Should Have      100% of exported
            documented with JSDoc                           functions have
            comments.                                       JSDoc \@param and
                                                            \@returns
                                                            annotations.
  --------- ------------------------------ ---------------- -----------------

**5. System Architecture**

**5.1 Component Overview**

The extension is composed of four runtime components:

  ----------------- ------------------------------------------------------
  **Component**     **Description**

  Service Worker    The MV3 background script. Handles all chrome.tabs and
  (background.js)   chrome.tabGroups API calls. Manages session
                    persistence in chrome.storage.local. Processes
                    messages from popup and content scripts.

  Toolbar Popup     The small UI that appears when the user clicks the
  (popup.html /     extension icon. Provides quick-access buttons: Group
  popup.js)         Tabs, Save Session, Open Sidebar. Communicates with
                    the service worker via chrome.runtime.sendMessage.

  Side Panel        The persistent side panel for session browsing,
  (sidebar.html /   search, rename, delete, and restore. Also communicates
  sidebar.js)       with the service worker for all data operations.

  Content Script    Injected into every page. Monitors input events, runs
  (content.js)      the TF-IDF scoring pipeline against sessions fetched
                    from storage, and renders the resurfacing overlay DOM
                    element.
  ----------------- ------------------------------------------------------

**5.2 Data Flow**

User types in a web page input → Content Script tokenizes input →
Content Script fetches sessions from chrome.storage.local → Scoring
engine computes relevance → If score threshold met, overlay renders →
User clicks suggestion → Content Script sends message to service worker
→ Service worker opens or restores the tab.

**5.3 Storage Schema**

**5.3.1 chrome.storage.local**

  -------------------- ------------------------------------------------------
  **Key**              **Schema**

  sessions             Array\<Session\>. Each Session: { id: number, name:
                       string, savedAt: number, tabs: Tab\[\], groups:
                       Group\[\] }

  tab_metadata_cache   Object\<tabId, { title: string, url: string,
                       description: string }\>. Ephemeral cache for open tab
                       metadata used by the resurfacing engine.
  -------------------- ------------------------------------------------------

**5.3.2 chrome.storage.sync**

  ---------------- ------------------------------------------------------
  **Key**          **Schema**

  settings         { resurfacingEnabled: boolean, autoGroupThreshold:
                   number, tokenMatchThreshold: number, overlayDismissMs:
                   number }

  license          { key: string, tier: \'free\' \| \'pro\', validatedAt:
                   number }
  ---------------- ------------------------------------------------------

**6. External Interface Requirements**

**6.1 Chrome Extension APIs**

  ---------------------------- ------------------------------------- -----------------
  **API**                      **Usage**                             **Notes**

  chrome.tabs                  Query, group, ungroup, open, and      Requires \'tabs\'
                               focus tabs.                           permission.

  chrome.tabGroups             Create, update, and query tab groups. Requires
                                                                     \'tabGroups\'
                                                                     permission.
                                                                     Available since
                                                                     Chrome 89.

  chrome.storage.local         Persist sessions and tab metadata     \~10 MB quota.
                               cache.                                Async API.

  chrome.storage.sync          Persist user settings and license     8 KB per item,
                               info.                                 100 KB total.
                                                                     Syncs across
                                                                     Chrome profile.

  chrome.sidePanel             Open and control the session          Requires
                               management side panel.                \'sidePanel\'
                                                                     permission.
                                                                     Available since
                                                                     Chrome 114.

  chrome.scripting             Inject content scripts dynamically if Requires
                               needed.                               \'scripting\'
                                                                     permission.

  chrome.runtime.sendMessage   IPC between popup/content script and  Standard MV3
                               service worker.                       messaging
                                                                     pattern.
  ---------------------------- ------------------------------------- -----------------

**6.2 Lemon Squeezy Licensing API**

The Pro license key validation uses the Lemon Squeezy Licenses API.

  ---------------- ------------------------------------------------------
  **Attribute**    **Detail**

  Endpoint         https://api.lemonsqueezy.com/v1/licenses/validate

  Method           POST

  Request body     { license_key: string, instance_name: string }

  Success response { valid: true, license_key: { status: \'active\' },
                   meta: { \... } }

  Failure response { valid: false, error: string }

  Called when      User submits a license key on the settings page.

  Retry policy     3 retries with exponential backoff (1s, 2s, 4s). Fails
                   gracefully --- remains on free tier if API is
                   unreachable.
  ---------------- ------------------------------------------------------

**7. Monetization Requirements**

**7.1 Tier Definitions**

  ----------------- ------------------------------------- -----------------
  **Feature**       **Free Tier**                         **Pro Tier
                                                          (\$4.99/mo or
                                                          \$29/yr)**

  Saved sessions    Up to 5                               Unlimited

  Tab resurfacing   Yes                                   Yes

  Auto-grouping     Yes                                   Yes

  Session search    Yes                                   Yes

  Session export    No                                    Yes
  (JSON/Markdown)                                         

  Scheduled session No                                    Yes
  restore                                                 

  Priority support  No                                    Yes
  ----------------- ------------------------------------- -----------------

**7.2 Upgrade Flow Requirements**

  --------- ------------------------------ ---------------- --------------
  **ID**    **Requirement**                **Priority**     **Acceptance
                                                            Criterion**

  MR-001    When a free-tier user hits the Must Have        Modal renders
            5-session limit, a modal shall                  on the 6th
            appear explaining the limit                     save attempt
            and offering a direct link to                   with a working
            the upgrade page.                               upgrade CTA
                                                            link.

  MR-002    The settings page shall        Must Have        User can paste
            include a license key                           a Lemon
            activation field.                               Squeezy key
                                                            and click
                                                            Activate.

  MR-003    On successful activation, the  Must Have        Session count
            UI shall immediately reflect                    limit is
            Pro-tier access without                         removed
            requiring an extension reload.                  immediately
                                                            after
                                                            successful key
                                                            validation.

  MR-004    License tier shall persist     Must Have        Pro status is
            across browser restarts.                        retained after
                                                            Chrome is
                                                            closed and
                                                            reopened.
  --------- ------------------------------ ---------------- --------------

**8. Development Milestones**

  --------------- ------------------------------------- -----------------
  **Milestone**   **Deliverables**                      **Target**

  M1 --- Project  Vite + MV3 project scaffold,          Day 1
  Setup           manifest.json, hot-reload working in  
                  Chrome.                               

  M2 --- Core     FR-001 through FR-007 implemented and Day 3
  Grouping        manually tested.                      

  M3 --- Session  FR-008 through FR-017 implemented.    Day 5
  Save/Restore    Sessions persist across browser       
                  restart.                              

  M4 --- Sidebar  FR-018 through FR-024 implemented.    Day 7
  UI              Side panel renders and is functional. 

  M5 ---          FR-025 through FR-035 implemented.    Day 9
  Resurfacing     Overlay appears on relevant input.    
  Engine                                                

  M6 --- Settings FR-036 through FR-039, MR-001 through Day 11
  & Licensing     MR-004 implemented.                   

  M7 --- QA &     NFRs validated, edge cases handled,   Day 13
  Polish          manifest permissions audited.         

  M8 --- Chrome   Production build zipped and           Day 14
  Web Store       submitted. Store listing with         
  Submission      screenshots live.                     
  --------------- ------------------------------------- -----------------

**9. Acceptance Criteria Summary**

The product is considered ready for Chrome Web Store submission when all
of the following conditions are met:

1.  All Must Have functional requirements (FR-001 through FR-039) pass
    manual QA testing.

2.  All Must Have non-functional requirements (NFR-001 through NFR-013)
    are verified.

3.  The extension loads without errors on Chrome 114, 120, and the
    latest stable release.

4.  Zero unhandled JavaScript exceptions are thrown in background,
    popup, sidebar, or content script contexts during a 30-minute
    exploratory test session.

5.  The resurfacing overlay does not interfere with form submissions or
    primary page interactions on Google Docs, Gmail, Notion, and GitHub.

6.  Extension bundle size (unpacked) does not exceed 500 KB.

7.  Privacy review confirms no external data transmission beyond license
    validation.

8.  The Chrome Web Store listing includes at least 3 screenshots, a
    privacy policy URL, and a complete description.

**10. Appendix A --- File Structure Reference**

The following is the canonical file structure for the v1 codebase:

  -------------------------- ------------------------------------------------------
  **File / Directory**       **Purpose**

  manifest.json              Extension manifest (MV3). Declares permissions, entry
                             points, and CSP.

  src/background.js          Service worker. All chrome.tabs / tabGroups operations
                             and storage writes.

  src/popup/popup.html       Toolbar popup markup.

  src/popup/popup.js         Toolbar popup logic. Sends messages to background.js.

  src/sidebar/sidebar.html   Side panel markup.

  src/sidebar/sidebar.js     Side panel logic. Session list, search, rename,
                             delete, restore.

  src/content.js             Content script. Input monitoring, TF-IDF scoring,
                             overlay rendering.

  src/scoring.js             Pure JS module: tokenize() and score() functions. Unit
                             tested.

  src/grouping.js            Pure JS module: cluster() function for hostname-based
                             grouping. Unit tested.

  src/storage.js             Thin wrapper over chrome.storage.local and .sync with
                             typed helpers.

  src/settings.html +        Options page for user preferences and license key
  settings.js                activation.

  assets/icons/              Extension icons: 16px, 48px, 128px PNG files.

  tests/                     Jest unit tests for scoring.js and grouping.js.

  vite.config.js             Vite build configuration using
                             vite-plugin-web-extension.
  -------------------------- ------------------------------------------------------
