# Optional 3D garment mockups

This is an on-demand design workflow, not a live website feature. Work intake routes an approved request to the production designer and creative-tools coordinator. The coordinator guides the shirt 3D artist and fit/size reviewer; the UX design head reviews the result before the main session approves a public export.

## Inputs required

- Garment type, supplier/style, and the actual size chart with units for every requested size.
- Approved artwork, print method, placement measurements, color reference, and any front/back/sleeve variants.
- A licensed or consented human/mannequin model and the intended presentation view.

If these are missing, prepare a draft concept with explicit assumptions. Do not claim an exact physical fit from an illustrative render. A real garment sample and supplier specifications remain the fit reference.

## App handoff

1. **Antigravity/Gemini:** explore design options or implementation notes using approved, non-private context. The shared repository files can be opened in the IDE; Gemini does not automatically read Claude or Codex role files.
2. **Blender:** the artist prepares a scene plan. The main session builds the garment-on-person scene, retains source `.blend` files, and renders each requested size in a private location. Provide a measurement manifest with units, model and garment dimensions, artwork placement, and scale-reference images.
3. **Fit/size review:** compare every variant with the supplied size chart, measurement manifest, and scale-reference images. State that the review relies on those exports; the reviewer has not independently measured the `.blend` scene. Reject mismatches or misleading camera/pose effects. The coordinator and UX design head review the handoff.
4. **Godot, if requested:** use an approved export such as GLB to prototype an interactive size viewer. Confirm the local installation and test device performance before promising it as a website feature.
5. **Main session:** review the final files after the head reviews and decide which sanitized exports belong in the repository or website. No customer artwork or private human likeness goes into this public repository.

Drafts and private inputs belong under ignored `.local/agent-renders/` or another approved private location. Commit only licensed, approved templates or exports, with a manifest of source, size, license, reviewer, and limitations.
