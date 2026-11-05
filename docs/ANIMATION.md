# Animation

Every motion is procedural and deterministic per animal seed. There are no animation clips, mixers
or keyframe files.

## Loop budget

One `requestAnimationFrame` loop. Delta is clamped to 50 ms so a backgrounded tab cannot produce a
jump. Expression targets are damped with an exponential filter:

```
pose[k] = damp(pose[k], target[k], lambda, dt)
damp(current, target, lambda, dt) = current + (target − current) * (1 − e^(−lambda*dt))
```

`lambda = 6` normally, `12` under reduced motion (faster settle, less drifting).

## Idle stack

| Layer | Formula | Notes |
| --- | --- | --- |
| Float | `y = sin(1.45t + seed) * 0.045 * floatAmp` | 30% amplitude with reduced motion |
| Body sway | `rotation.z = sin(1.1t) * 0.012 * floatAmp` | whole group |
| Breath (body) | `scale.y *= 1 + sin(1.9t + 0.4) * 0.014` | subtle chest rise |
| Breath (belly) | `scale = base * (1 + sin(2.1t − 0.3) * 0.028)` | strongest read of breathing |
| Head tilt | `pose.headTilt + sin(1.25t) * 0.035 * floatAmp` | expression overlaid on idle |
| Head nod | `pose.headNod + sin(0.9t) * 0.012` | |
| Ear wiggle | `base + dir * sin((2.3 + tailSpeed*0.18)t + i*1.4) * earAmp` | plus `earLift` asymmetry |
| Tail | `z = sin(tailSpeed t) * tailAmp`, `y = z * 0.4` with `0.6×` speed | |
| Cheeks | base scale × `cheek` | never scales uniformly from 1 |
| Mouth | uniform scale = `cheek`, sleepy rotates +0.25 rad | |
| Waddle | `rotation.z += sin(4.2t) * 0.045`, feet ±0.12 rad | penguin only |

## Blink

`blinkScale(t, seed)` is pure and lives in the engine block.

```
period = 3.4 + (seed % 5) * 0.37
offset = seed * 1.713
phase  = modulo(t + offset, period)
close  = 0.17s, closed = 0.035
open → closed → open using smoothstep on each half
if floor((t + offset) / period) % 6 === 3:
    also dip at phase 0.34  (double blink)
```

Seeds: bear 2, bunny 5, penguin 8, shiba 11. That staggers the pets and avoids synchronized blinking.
Each eye gets `baseScale.y * blink * pose.eyeOpen`; X is multiplied by `pose.eyeScale`. Glints are
hidden whenever `blink <= 0.55`, which prevents highlights floating over a closed lid. A soft blink
tick plays at most once every 2.4 s and only outside reduced motion.

## Expressions

| Expression | Eyes | Head | Ears | Tail | Float | Cheeks |
| --- | --- | --- | --- | --- | --- | --- |
| Happy | open, normal | level | gentle | medium | normal | 100% |
| Sleepy | 12% height | tilt 0.20, nod 0.12 | almost still, drooped | slow, tiny | 45% | 70% |
| Curious | 112%, 6% larger | tilt −0.30, nod −0.06 | one lifted | quick | 110% | 85% |
| Wiggle | open, 5% larger | small tilt | fast | rapid | 150% | 115% |

Poses are interpolated, so changing expression never snaps. `headTilt` rotates Z; `headNod` rotates X.

## Reaction

Triggered by a raycast hit on the active rig or the **React** button.

```
duration = 0.92s, random direction ±1
k      = elapsed / 0.92
jump   = sin(kπ) * 0.82
spin   = easeOutCubic(k) * 2π * dir
squash = 1 + sin(3kπ) * 0.035 * (1 − k)
group.y = bob + jump
group.scale = (squash, 2 − squash, squash)
```

At `k = 1` the reaction flag clears, `rotation.y` returns to 0 and scale to 1. A second click is
ignored while active.

A 22-point additive sparkle burst accompanies the jump. Points start on a ring around y ≈ 1.5 with
random outward velocity and 0.7–1.1 s life, gravity −1.6, and are disabled under reduced motion.

## Audio coupling

| Event | Sound |
| --- | --- |
| Reaction | `boing` (sine 170→520, triangle 520→280, tiny 1400→900) |
| Animal switch / preset apply | `chime` (A5, D6, G6 triangle/sine) |
| Expression / colour / accessory | `pop` (triangle 420→780) |
| Wiggle expression | `wiggle` (two rising sines) |
| Blink | `blink` (1.5 kHz→700 Hz, 70 ms, quiet) |
| Snapshot / share | `chime` or `pop` |

## Rig constraints

- Ear rest rotations differ per animal. `buildAnimal` captures `earBases` before the first frame; the
  loop adds wiggle to the captured base, not to a hard-coded angle.
- Flipper "ears" on the penguin are arms; the captured base keeps their rest splay intact.
- Cheek scale must multiply the stored base scale, otherwise the blush spheres become unit spheres.
- Accessories live under head/neck anchors, so head tilt moves the hat and glasses with the face.

## Reduced motion

- Float amplitude × 0.3; sparkles hidden; damp faster.
- CSS animations and transitions collapse to 0.001 ms.
- The app still supports every interaction; nothing depends on motion to be discoverable.

## Species postures

Each character is posed at build time, before the coat shells are generated, so fur follows the limbs.
The neutral idle still breaths and floats, but the stance stays species-specific.

| Animal | Posture | What moves |
| --- | --- | --- |
| Bear | sits with legs forward, paws on lap | head lift, gentle breathing |
| Bunny | alert periscope, ears swept back, paws tucked | ear twitch, blink |
| Penguin | forward lean, wide feet, flippers out | waddle sway, flipper bounce |
| Shiba | seated haunches, front legs straight, tail curled | head tilt, tail wag |
| Koala | upright cling, arms raised, legs tucked | slow blink, head sway |
| Sun Conure | perched on a wooden branch, feet together | body lean, tail, wing tuck |
| Scottish Fold | cat loaf, paws forward, tail wrapped | slow breathing, sleepy blink |

`applyPosture()` adjusts body/head/limb positions, stores `headRotX/Z`, `earBaseX` and `feet.baseY`,
then the frame loop adds expression tilt to those bases instead of replacing them.

## Grounded feet

The body floats on a sine wave. To keep the contact feet planted, every foot stores its rest Y at build
time. During idle:

```js
foot.position.y = foot.userData.baseY - bob;
```

During a reaction the correction is skipped so the whole pet jumps. The result is a breathing body with
feet that stay visually on the pedestal/desk, rather than a rigid group sliding up and down.

## Strand wind

`STRAND_UNIFORMS` is shared by every strand material: `time`, `breeze`, `length`, `curl`, `clump`,
`cursor`. Each frame updates `time`; pointer moves raycast onto a plane through the character and update
`cursor`. The vertex shader bends each ribbon by height squared, so roots stay anchored and tips move.
Reduced motion does not disable the fur entirely; the breeze default is low and the slider can be set
to zero.
