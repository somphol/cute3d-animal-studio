# Accessibility

## What is implemented

- **Skip link** to the customizer panel, visible on focus.
- **Focus ring**: 3 px rose outline with 3 px offset on every interactive element via `:focus-visible`.
- **Semantic controls**: real `<button>` elements with `type="button"`, labelled groups, `<label>` around
  each colour input, `<h1>`–`<h4>` hierarchy.
- **State exposure**: animals, expressions, accessories and sound use `aria-pressed`; the mobile sheet
  uses `aria-expanded` + `aria-controls`; toasts are an `aria-live="polite"` region.
- **Labels**: every icon-only or ambiguous control has an explicit `aria-label`, translated with the
  rest of the UI (`data-i18n-aria`).
- **Live language**: switching updates `<html lang>`, the document title, the meta description and the
  Thai font stack.
- **Keyboard**: `1`–`4` characters, `Space` react, `S` snapshot, `L` language, `Esc` closes the mobile
  sheet and self-test. Shortcuts are suppressed while a button, link or input has focus so native
  activation still works.
- **Reduced motion**: CSS transitions collapse; the 3D float drops to 30%; sparkles are disabled.
- **Forced colours**: active cards and toggles get a `Highlight` border.
- **Touch targets**: 40–46 px for topbar controls, 42 px for tool buttons, full-width accessory rows.
- **Contrast**: body ink `#352a2e` on cream ≈ 13:1; secondary `#6c5c61` ≈ 5.9:1; rose-deep links
  `#e8789a` on white ≈ 2.9:1, used only for large/bold text and non-essential links; primary buttons
  use white on `#352a2e` (≈ 13:1).
- **No motion-only information**: every reaction also has a sound (optional) and no state depends on
  animation completing.

## Canvas description

The stage is a labelled region: "Interactive 3D animal studio. Drag to orbit, scroll to zoom, click the
pet to make it react." The active character is also named in an adjacent card with a tagline, so the
canvas is never the only source of identity. The live mesh count is decorative and `aria-hidden` via
its HUD container.

A future improvement is a hidden text description per animal (shape, colour, accessories) updated on
change. This is listed in `ROADMAP.md`.

## Keyboard flow

```
skip link → brand (static) → sound → language → stage (focusable via canvas)
→ pet card React → panel: animals → expressions → colours → accessories → tools → presets
→ footer links
```

The canvas itself is not tabbable, because all actions have buttons; orbit is pointer-only. This is a
deliberate limitation: camera orbit is not essential to operate the studio.

## Testing

- Automated: static checks assert skip link, focus-visible, reduced motion, `aria-pressed` count and
  bilingual aria labels; browser checks assert `aria-pressed`/`aria-expanded` transitions.
- Manual checklist: tab through the panel at 200% zoom; activate every control with Enter/Space; switch
  to Thai and confirm no clipped labels at 320 px width; enable reduced motion and confirm the pet is
  still usable; run VoiceOver and confirm the panel groups are announced.

## Known limitations

- Native colour inputs announce differently across browsers and platforms.
- Thai screen-reader pronunciation depends on the OS voice; the page declares `lang="th"` correctly.
- Emoji in character cards may be read as their Unicode names, which is acceptable because the text
  label follows immediately.
- The orbit gesture has no keyboard equivalent.
