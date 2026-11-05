# Documentation

Start with the [README](../README.md) for the product tour, then pick the document that matches your
task.

| Document | Read it when you need to… |
| --- | --- |
| [ARCHITECTURE](ARCHITECTURE.md) | understand the files, rig contract, state model and snapshot/audio pipelines |
| [REPRODUCTION](REPRODUCTION.md) | rebuild the project from scratch, or hand it to another agent |
| [DESIGN](DESIGN.md) | change colours, typography, layout or character proportions |
| [ANIMATION](ANIMATION.md) | tune idle motion, blinks, expressions or the reaction |
| [COAT](COAT.md) | understand or tune the fur and feather shell system |
| [AUDIO](AUDIO.md) | change synthesized sounds or the audio graph |
| [TESTING](TESTING.md) | run, extend or debug the four verification layers |
| [DEPLOYMENT](DEPLOYMENT.md) | publish, update or roll back the live site |
| [DECISIONS](DECISIONS.md) | understand why something is built the way it is |
| [ACCESSIBILITY](ACCESSIBILITY.md) | audit keyboard, screen-reader or motion behaviour |
| [PERFORMANCE](PERFORMANCE.md) | profile draw calls, memory or snapshot cost |
| [PRIVACY](PRIVACY.md) | explain storage, URLs and network requests |
| [FAQ](FAQ.md) | answer a product question quickly |
| [ROADMAP](ROADMAP.md) | see what is next and what is deliberately out of scope |
| [CREDITS](CREDITS.md) | attribution, session metadata and toolchain |

## Quick commands

```bash
npm start              # serve on :4173
npm test               # engine + repository
npm run test:browser   # headless Chrome
npm run verify         # all of the above
npm run shots          # regenerate assets/
```

The handoff for the next coding agent is [../AGENTS.md](../AGENTS.md), not this index.
