```markdown
# Design System: The Editorial Archivist

## 1. Overview & Creative North Star
The Creative North Star for this design system is **"The Digital Curator."** 

Unlike standard wikis that feel like cold databases, this system is designed to feel like a bespoke, private library. We are moving away from the "app" aesthetic and toward a "high-end editorial" experience. The design breaks the rigid, modular template look through **intentional asymmetry** and **tonal layering**. 

We achieve a premium feel by prioritizing "The Breath"—generous, purposeful whitespace that allows the sophisticated typography to command attention. The layout should feel like a well-composed manuscript: structured, yet organic and effortless.

## 2. Colors & Surface Philosophy
The palette is a sophisticated study in monochromatic depth, punctuated by a singular, muted forest green (`primary`) that acts as the "scholar's ink."

### The "No-Line" Rule
Standard 1px borders are strictly prohibited for sectioning. We define boundaries through **background color shifts** rather than lines. For example, a sidebar or a metadata panel should be distinguished by moving from `surface` to `surface-container-low`, creating a seamless, architectural transition.

### Surface Hierarchy & Nesting
Treat the UI as a series of physical layers—like fine vellum or heavy cardstock stacked upon each other.
- **Base Layer:** `surface` (#f9f9f8)
- **Nested Content (Cards/Notes):** `surface-container-lowest` (#ffffff) to create a soft "lift."
- **Sidebar/Navigation:** `surface-container` (#ebeeed) to provide a grounded, structural feel.

### The "Glass & Gradient" Rule
To elevate the interface beyond a flat template, use **Glassmorphism** for floating elements (like a sticky table of contents). Use `surface` with a 70% opacity and a `20px backdrop-blur`. 

For primary CTAs (e.g., "Create New Page"), apply a subtle linear gradient from `primary` (#4d6453) to `primary_dim` (#415847) at a 135-degree angle. This provides a tactile "soul" to the action buttons that flat colors lack.

## 3. Typography
The typographic soul of this system is the tension between the academic authority of the serif and the modern clarity of the sans-serif.

*   **Display & Headlines (Noto Serif):** These are the "Title Pages." Use `display-lg` for wiki entry titles. The generous scale conveys importance and intellectual weight.
*   **Body (Inter):** All long-form content uses `body-lg`. Inter’s high x-height ensures readability during long research sessions.
*   **Labels & Metadata (Inter):** Small-scale data (tags, dates) should use `label-md` with `0.05rem` letter-spacing to provide a clean, functional contrast to the expressive headings.

## 4. Elevation & Depth
In this system, depth is felt, not seen. We avoid heavy shadows in favor of **Tonal Layering**.

*   **The Layering Principle:** Place a `surface-container-lowest` card on a `surface-container-low` background. This creates a natural "paper-on-table" lift without any artificial CSS effects.
*   **Ambient Shadows:** If an element must float (e.g., a dropdown menu), use a shadow with a 32px blur and 4% opacity, using the `on_surface` color as the shadow tint. It should look like a soft atmospheric occlusion, not a "drop shadow."
*   **The "Ghost Border" Fallback:** If accessibility requires a container boundary, use a **Ghost Border**: `outline_variant` at 15% opacity. It should be barely perceptible, serving as a suggestion of a container rather than a cage.

## 5. Components

### Buttons
*   **Primary:** Gradient fill (`primary` to `primary_dim`), `on_primary` text. Border radius: `sm` (0.125rem) for a sharp, classic look.
*   **Secondary:** Ghost style. No fill, `outline_variant` (15% opacity) border, `primary` text.
*   **Tertiary/Text:** No border or fill. `secondary` text, shifting to `primary` on hover with a `0.2s` ease-in transition.

### Cards & Lists
**Strict Rule:** No horizontal dividers. 
*   Separate list items using `1.5rem` of vertical whitespace. 
*   In metadata lists, use a subtle `surface-container-low` background on hover to indicate interactivity.

### Input Fields
*   **Style:** Minimalist. Only a bottom border using `outline_variant` (20% opacity). 
*   **Focus State:** The bottom border transitions to `primary` (#4d6453) and thickens to 2px. No "glow" or outer rings.

### Chips (Tags)
*   Used for categorizing wiki entries. 
*   **Style:** `surface-container-high` background, `md` (0.375rem) corner radius, `label-md` typography. No borders.

### The "Scholarly Sidebar" (Special Component)
A sticky navigation element using `surface-container-lowest` with a `20px` left-padding to create an asymmetrical "margin note" feel, reminiscent of classic academic manuscripts.

## 6. Do's and Don'ts

### Do:
*   **Embrace Asymmetry:** Align the main body text to a central column but let images or pull-quotes bleed into the right margin.
*   **Prioritize White Space:** If a layout feels "busy," increase the padding. The "Scholar" aesthetic requires room to think.
*   **Use Tonal Shifts:** Use `surface-dim` for footers or secondary information to create a natural visual "end" to a page.

### Don't:
*   **No Pure Blacks:** Never use #000000. Use `on_surface` (#2d3433) for all high-contrast text to keep the look soft and sophisticated.
*   **No Rounded Pills:** Avoid the `full` (9999px) radius for buttons or chips. Stick to `sm` or `md` to maintain the architectural, structured feel.
*   **No Standard Dividers:** Never use a solid 1px line to separate content sections. Use a `32px` or `64px` gap instead.