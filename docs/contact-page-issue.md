<img width="603" height="1311" alt="IMG_0197" src="https://github.com/user-attachments/assets/23f77c13-9e60-4bd9-b3cc-8a430838805e" />
Book Your Inspection/Contact page has formatting alignment issues. Below is a proposed fix by Codex with reasoning attached in an 
effort to streamline the PR process. 
- Title: fix(contact): prevent layout overflow on Book Your Inspection page (mobile)
- Description:
    - Problem: On narrow viewports the booking form/calendar pushes content off-screen or causes layout breakage.
    - Reproduction: Visit /contact on small viewport (e.g., iPhone X 375px).
    - Fixes:
        - Wrapped calendar grid in an overflow-x-auto wrapper so it scrolls horizontally on narrow screens instead of forcing overflow.
        - Added max-width:100% and box-sizing to btn-primary and btn-secondary to avoid pushing parent containers.
        - (Optional) added break-word utility for long strings.

Why these files are the place to look

• app/contact/page.tsx defines the two-column layout at large sizes (grid lg:grid-cols-5) and places the form in lg:col-span-3. If something inside the form has a minimum width or an element that doesn’t wrap, it will push or overflow this grid.

• app/contact/contact-form.tsx contains several sub-layouts that commonly produce overflow on small screens:

• The calendar uses a 7-column grid (grid-cols-7) which can trigger overflow on narrow containers if the grid cell sizes or paddings are too large.

• The right-hand “available dates” block uses lg:w-64 — okay on desktop but may interact with other flex/grid rules.

• The step indicator uses max-w-2xl mx-auto which sets fixed limits and centering that can look off inside a column layout.

• app/globals.css contains .btn-primary / .form-input / other utilities. Large horizontal paddings on .btn-primary (.px-5) or fixed paddings on inputs can contribute to overflow on narrow devices.


2. Common layout issues to check (so you can verify)

• Unbreakable text (long strings) that don’t wrap in inputs/buttons — inspect with browser devtools; add overflow-wrap or break-words if needed.

• A wide grid (calendar grid-cols-7) or fixed widths (min-w, lg:w-64) that force a horizontal scroll or push content off-screen.

• Buttons with large horizontal padding inside narrow columns (btn-primary px-5) — these can wrap or overflow.

• Any embedded iframe / images without max-w-full that could overflow.


3. Minimal, low-risk patch you can try (I’ll give the exact code edits — you can paste into the GitHub web editor or run locally)


A. Make the calendar (the 7-column day grid) horizontally scrollable on narrow screens so it won’t break the page layout. Edit app/contact/contact-form.tsx at the calendar rendering (around the grid with “grid grid-cols-7 gap-1 text-center”) — wrap it in an overflow wrapper and ensure the inner grid can shrink:

Replace the calendar block

with this (conceptual — exact formatting to paste):

Why: on narrow viewports, the outer wrapper will allow horizontal scrolling rather than forcing the rest of the page to overflow. The min-w gives the grid a reasonable width so day cells remain tappable/readable.


B. Prevent buttons from causing overflow — small global tweak in app/globals.css:Add these properties to .btn-primary and .btn-secondary so they can’t push outside containers:

.btn-primary { @apply inline-flex items-center justify-center gap-2 px-5 py-3 bg-accent-500 text-white font-semibold rounded-lg; max-width:100%; box-sizing:border-box; }.btn-secondary { @apply inline-flex items-center justify-center gap-2 px-5 py-3 bg-white text-primary-700 font-semibold rounded-lg border-2 border-primary-500; max-width:100%; box-sizing:border-box; }

(If you prefer Tailwind utility inlined: add the classes max-w-full and box-border where applicable; here we keep it in the global alias.)


C. Add wrapping for long text (optional but useful). In globals.css add:.break-words { overflow-wrap:break-word; word-break:break-word; }

And apply className=“break-words” to any text blocks that may contain long strings (for example the “propertyAccess” textarea label area or any customer-submitted fields).

Those three changes are conservative, targeted, and safe to test.
