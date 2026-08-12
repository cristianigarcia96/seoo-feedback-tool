// Brand colors used via inline styles. Gotcha #3 in the brief: arbitrary-value
// Tailwind bracket classes (bg-[#7C3AED]) silently failed in the sandboxed
// prototype. A real JIT build handles them fine, but keeping these as explicit
// inline values removes the whole class of risk and documents intent.

export const VIOLET = "#7C3AED";
export const VIOLET_DARK = "#5B21B6";
export const EMERALD = "#059669";

export const TEXT_PRESETS = {
  heading: { fontSize: 20, fontWeight: 700, label: "Heading" },
  subhead: { fontSize: 14, fontWeight: 600, label: "Subhead" },
  body: { fontSize: 12, fontWeight: 400, label: "Body" },
} as const;
