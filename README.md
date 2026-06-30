# DecodeLabs — Form Design & Validation Platform

A high-performance, accessible, and responsive user registration and authentication interface built using vanilla semantic HTML5, modern CSS3 custom properties, and robust JavaScript validation.

This project implements an end-to-end client-side validation ecosystem following strict UI/UX safety, semantic hierarchy, and accessibility protocols.

## 🚀 Features

- **Multi-Screen Lifecycle Management:** Fluid transition animations (`fadeUp`) handling account registration, successful data submission payloads, and sign-in modes natively.
- **Strict Password Rule Telemetry:** Real-time character lookahead tracking against regex profiles (`/^(?=.*[A-Z])(?=.*[a-z])(?=.*[0-9])(?=.*[#?!@$%^&*-]).{8,}/`) featuring:
  - 4-Tier visual password strength metric bar.
  - Interactive live requirement list indicators checking off matching criteria instantly.
- **Advanced Dynamic UI Feedback:** Custom validation states using custom CSS styling, color iconography, and granular warning text to enforce approved input formats.
- **Packaged JSON Transmissions:** Validated payloads are bundled cleanly as structured JSON data blocks directly in the client success card panel.
- **A11y (Accessibility) Compliant Architecture:**
  - Active `aria-live="polite"` region alerts ensuring assistive screen-reader technologies announce out-of-context changes.
  - Tethered labels (`for="..."`) and precise error associations utilizing `aria-describedby` tokens.
  - Intercepted form actions that prevent breaking structural failure during input entry.
- **Responsive Layout Design:** Flexible layout grid matching full mobile widths dynamically while suppressing transitions for clients specifying `prefers-reduced-motion`.
