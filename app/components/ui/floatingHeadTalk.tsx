'use client'

import React, { useEffect, useRef, useImperativeHandle } from 'react'
import { useGLTF } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import type { Group } from 'three'
import { Object3D, Euler, Bone, MathUtils } from 'three'

export type FloatingHeadHandle = { stopAudio: () => void }

type Viseme = { at: number; phoneme: string }

interface FloatingHeadProps {
  audioURL: string | null
  controlRef?: React.Ref<FloatingHeadHandle>
  audioEl?: HTMLAudioElement | null
  visemeTimeline?: Viseme[]
  logShapes?: boolean
  position?: [number, number, number]
  scale?: number
  modelPath?: string
  headOnly?: boolean
}

// Set your default model path here
const DEFAULT_MODEL = '/models/ready-player-me/rpm.glb'

// ---- WebAudio cache: one source node per <audio> forever ----
type CacheEntry = {
  ctx: AudioContext
  source: MediaElementAudioSourceNode
  band: BiquadFilterNode
  analyser: AnalyserNode
  data: Uint8Array
}
const MEDIA_NODE_CACHE = new WeakMap<HTMLMediaElement, CacheEntry>()
let GLOBAL_RESUME_LISTENERS_ADDED = false

// Utility: case-insensitive key lookup across all morph targets we find
function buildKeyMaps(scene: Object3D) {
  const seen = new Set<string>()
  const lowerToActual = new Map<string, string>()
  scene.traverse((child: any) => {
    const dict = child?.morphTargetDictionary
    if (!dict) return
    for (const k of Object.keys(dict)) {
      if (seen.has(k)) continue
      seen.add(k)
      const low = k.toLowerCase()
      if (!lowerToActual.has(low)) lowerToActual.set(low, k)
    }
  })
  return { all: Array.from(seen.values()).sort(), lowerToActual }
}
function findAny(lowerToActual: Map<string, string>, names: string[]) {
  for (const n of names) {
    const actual = lowerToActual.get(n.toLowerCase())
    if (actual) return actual
  }
  return null
}

export default function FloatingHeadTalk({
  audioURL,
  controlRef,
  audioEl,
  visemeTimeline,
  logShapes = true,
  position = [0, -2, 2.3],
  scale = 1.2,
  modelPath = DEFAULT_MODEL,
  headOnly = true,
}: FloatingHeadProps) {
  const group = useRef<Group>(null!)
  const { scene } = useGLTF(modelPath) as any

  // WebAudio refs (point at cached nodes)
  const audioCtxRef = useRef<AudioContext | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const freqDataRef = useRef<Uint8Array | null>(null)

  // animation state
  const mouthAmtRef = useRef(0)
  const singleMouthKeyRef = useRef<string | null>(null)
  const jawBoneRef = useRef<Bone | Object3D | null>(null)
  const jawRestRef = useRef<Euler | null>(null)

  // map of actual morph names present in this model
  const shapeMapRef = useRef<{
    jawOpen?: string
    mouthFunnel?: string
    mouthPucker?: string
    eyeBlinkLeft?: string
    eyeBlinkRight?: string
  }>({})

  const blinkRef = useRef({
    nextAt: performance.now() + 1200 + Math.random() * 2200,
    t: 0,
    closing: true,
    active: false,
  })
  const bobRef = useRef({ phase: 0, speakAmt: 0 })
  const timelineRef = useRef<Viseme[] | null>(null)

  useImperativeHandle(
    controlRef,
    () => ({
      stopAudio() {
        if (audioEl) {
          audioEl.pause()
          audioEl.currentTime = 0
        }
      },
    }),
    [audioEl]
  )

  // ----- Scene probe (case-insensitive, and remember the actual key names) -----
  useEffect(() => {
    // broadened candidates across ARKit/VRM/Viseme/random exports
    const JAW_OPEN_ALIASES = [
      'jawOpen','jaw_open','jaw open','jawopen','jaw','mouthOpen','mouth_open','openMouth','open_mouth',
      'viseme_aa','viseme-ah','viseme_a','visemeaa','aa','ah','a','vrc.v_aa','vrc.v_a'
    ]
    const MOUTH_FUNNEL_ALIASES = ['mouthFunnel','mouth_funnel','funnel','viseme_uw','uw','u','vrc.v_ou','vrc.v_u']
    const MOUTH_PUCKER_ALIASES = ['mouthPucker','mouth_pucker','pucker','viseme_oh','oh','o','vrc.v_oh','vrc.v_o']
    const BLINK_L_ALIASES = ['eyeBlinkLeft','eyeblinkleft','blink_l','blinkleft','blink_left','blink']
    const BLINK_R_ALIASES = ['eyeBlinkRight','eyeblinkright','blink_r','blinkright','blink_right','blink']

    const foundBones: string[] = []
    let jawBone: Bone | Object3D | null = null

    const { all: allKeys, lowerToActual } = buildKeyMaps(scene)

    const jawOpenKey    = findAny(lowerToActual, JAW_OPEN_ALIASES)   || null
    const mouthFunnel   = findAny(lowerToActual, MOUTH_FUNNEL_ALIASES) || undefined
    const mouthPucker   = findAny(lowerToActual, MOUTH_PUCKER_ALIASES) || undefined
    const eyeBlinkLeft  = findAny(lowerToActual, BLINK_L_ALIASES) || undefined
    const eyeBlinkRight = findAny(lowerToActual, BLINK_R_ALIASES) || undefined

    // If we didn't find any morphs, try to locate a jaw bone by name patterns
    scene.traverse((child: any) => {
      if (child.isBone) {
        foundBones.push(child.name)
        if (!jawBone && /jaw|mandible|head_low/i.test(child.name)) jawBone = child as Bone
      }
    })

    // choose a single "mouth open" morph if we didn't find a jawOpen
    let singleMouth: string | null = null
    if (!jawOpenKey) {
      singleMouth = findAny(lowerToActual, [
        'mouthopen','mouth_open','openmouth','open_mouth','viseme_aa','aa','ah','a','vrc.v_aa','vrc.v_a'
      ])
    }

    shapeMapRef.current = {
      jawOpen: jawOpenKey ?? undefined,
      mouthFunnel: mouthFunnel,
      mouthPucker: mouthPucker,
      eyeBlinkLeft: eyeBlinkLeft,
      eyeBlinkRight: eyeBlinkRight,
    }
    singleMouthKeyRef.current = singleMouth
    jawBoneRef.current = jawBone
    jawRestRef.current = (jawBone as Object3D | null)?.rotation?.clone?.() ?? null

    // if (logShapes) {
    //   // Use a non-collapsed group so you actually see it
    //   console.group('[FloatingHeadTalk] Probe')
    //   console.log('Morph targets found:', allKeys)
    //   console.log('Resolved keys -> actual:',
    //     { jawOpen: shapeMapRef.current.jawOpen,
    //       mouthFunnel: shapeMapRef.current.mouthFunnel,
    //       mouthPucker: shapeMapRef.current.mouthPucker,
    //       eyeBlinkLeft: shapeMapRef.current.eyeBlinkLeft,
    //       eyeBlinkRight: shapeMapRef.current.eyeBlinkRight,
    //       singleMouth: singleMouthKeyRef.current
    //     })
    //   console.log('Bones:', foundBones)
    //   console.log('Jaw bone:', jawBone ? (jawBone as any).name : 'none')
    //   console.groupEnd()
    //   if (!shapeMapRef.current.jawOpen && !singleMouthKeyRef.current && !jawBone) {
    //     console.warn('[FloatingHeadTalk] No mouth morphs and no jaw bone detected. The model likely has no shape keys or they were stripped on export.')
    //   }
    // }
  }, [scene, logShapes])

  // ----- Audio graph (cached) -----
  useEffect(() => {
    if (!audioEl) return

    let entry = MEDIA_NODE_CACHE.get(audioEl)
    if (!entry) {
      const Ctx = (window.AudioContext || (window as any).webkitAudioContext)
      const ctx: AudioContext = new Ctx()

      const analyser = ctx.createAnalyser()
      analyser.fftSize = 1024
      analyser.smoothingTimeConstant = 0.4

      const band = ctx.createBiquadFilter()
      band.type = 'bandpass'
      band.frequency.value = 900
      band.Q.value = 0.8

      const source = ctx.createMediaElementSource(audioEl) // only once per element
      source.connect(ctx.destination)  // playback
      source.connect(band)             // analysis path
      band.connect(analyser)

      const data = new Uint8Array(analyser.frequencyBinCount)
      entry = { ctx, source, band, analyser, data }
      MEDIA_NODE_CACHE.set(audioEl, entry)

      if (!GLOBAL_RESUME_LISTENERS_ADDED) {
        const resume = async () => { try { await ctx.resume() } catch {} }
        const onInteract = () => { resume() }
        window.addEventListener('pointerdown', onInteract, { passive: true })
        window.addEventListener('keydown', onInteract, { passive: true })
        GLOBAL_RESUME_LISTENERS_ADDED = true
      }
    }

    audioCtxRef.current = entry.ctx
    analyserRef.current = entry.analyser
    freqDataRef.current = entry.data
    return () => {}
  }, [audioEl])

  // Hide head effect
  useEffect(() => {
    if (!headOnly || !scene) return

    // Explicit Ready Player Me names to HIDE:
    const HIDE_EXACT = new Set([
      'Wolf3D_Body',
      'Wolf3D_Outfit_Bottom',
      'Wolf3D_Outfit_Top',
      'Wolf3D_Outfit_Footwear',
      'Wolf3D_Outfit_Overcoat',
    ])

  // Things to KEEP by fuzzy match (case-insensitive)
    const KEEP_REGEX = /(head|face|hair|brow|lash|eye|teeth|tongue|mouth|jaw)/i
    const HIDE_REGEX  = /(body|outfit|torso|arm|hand|leg|foot|shoe|pants|shirt|coat|skirt|dress)/i

    scene.traverse((child: any) => {
      if (!child?.isMesh) return

      const name = (child.name || '').toString()
      const low = name.toLowerCase()

      // RPM explicit hides take priority
      if (HIDE_EXACT.has(name)) {
        child.visible = false
        return
      }

      // Generic rule: if it looks like face bits, keep; if it looks like body/outfit, hide
      const keep = KEEP_REGEX.test(low)
      const hide = HIDE_REGEX.test(low)

      if (hide && !keep) child.visible = false
    })
  }, [scene, headOnly])

  // Try resume when URL changes
  useEffect(() => {
    const resume = async () => {
      if (audioURL && audioCtxRef.current?.state === 'suspended') {
        try { await audioCtxRef.current.resume() } catch {}
      }
    }
    resume()
  }, [audioURL])

  // Prepare timeline if provided
  useEffect(() => {
    if (!visemeTimeline || visemeTimeline.length === 0) {
      timelineRef.current = null
      return
    }
    timelineRef.current = [...visemeTimeline].sort((a, b) => a.at - b.at)
  }, [visemeTimeline])

  // Envelope calibration
  const calibRef = useRef({ done: false, frames: 0, mean: 0 })
  const holdRef = useRef({ openUntil: 0, closeUntil: 0 })

  function setBlendshape(actualName: string | undefined, value: number) {
    if (!group.current || !actualName) return
    const v = MathUtils.clamp(value, 0, 1)
    group.current.traverse((child: any) => {
      const dict = child.morphTargetDictionary
      const inf = child.morphTargetInfluences
      if (!dict || !inf) return
      const idx = dict[actualName]
      if (idx == null) return
      inf[idx] = v
    })
  }

  function applyShapes(shapes: Record<string, number>) {
    if (!group.current) return
    group.current.traverse((child: any) => {
      const dict = child.morphTargetDictionary
      const inf = child.morphTargetInfluences
      if (!dict || !inf) return
      for (const [actualName, val] of Object.entries(shapes)) {
        const idx = dict[actualName]
        if (idx == null) continue
        inf[idx] = MathUtils.clamp(val, 0, 1)
      }
    })
  }

  // map amplitude -> actual keys detected
  function amplitudeToShapes(amount: number): Record<string, number> {
    const a = MathUtils.clamp(amount, 0, 1)
    const out: Record<string, number> = {}
    const { jawOpen, mouthFunnel, mouthPucker } = shapeMapRef.current

    if (jawOpen) {
      out[jawOpen] = a
      if (mouthFunnel) out[mouthFunnel] = Math.max(0, (a - 0.35) * 0.8)
      if (mouthPucker) out[mouthPucker] = Math.max(0, (0.35 - a) * 0.3)
      return out
    }
    if (singleMouthKeyRef.current) {
      out[singleMouthKeyRef.current] = a
      return out
    }
    return out // jaw bone fallback handled separately
  }

  function phonemeToShapes(p: string): Record<string, number> {
    // Use jawOpen if we have it; otherwise singleMouth
    const out: Record<string, number> = {}
    const { jawOpen, mouthFunnel, mouthPucker } = shapeMapRef.current
    const useOpen: string | undefined = jawOpen ?? (singleMouthKeyRef.current ?? undefined)
    const lc = p.toLowerCase()

    const set = (k: string | undefined, v: number) => { if (k) out[k] = v }

    if (/(aa|ah|ao|ae|ey|iy|ow|uw|eh|uh|ay|aw|oy)/.test(lc)) {
      set(useOpen, 0.7); if (mouthFunnel) out[mouthFunnel] = 0.25
    } else if (/(m|b|p)/.test(lc)) {
      set(useOpen, 0.05); if (mouthPucker) out[mouthPucker] = 0.7
    } else if (/(f|v)/.test(lc)) {
      set(useOpen, 0.2); if (mouthFunnel) out[mouthFunnel] = 0.6
    } else if (/(l|th|d|t|s|z|sh|ch|jh|zh)/.test(lc)) {
      set(useOpen, 0.35); if (mouthFunnel) out[mouthFunnel] = 0.2
    } else {
      set(useOpen, 0.3)
    }
    return out
  }

  function lerpShapes(a: Record<string, number>, b: Record<string, number>, t: number) {
    const keys = new Set([...Object.keys(a), ...Object.keys(b)])
    const out: Record<string, number> = {}
    for (const k of keys) {
      const av = a[k] ?? 0, bv = b[k] ?? 0
      out[k] = MathUtils.lerp(av, bv, MathUtils.clamp(t, 0, 1))
    }
    return out
  }

  useFrame((_, dt) => {
    const analyser = analyserRef.current
    const freqData = freqDataRef.current
    const now = performance.now()
    let speakAmount = 0

    if (timelineRef.current && audioEl) {
      const tl = timelineRef.current
      const tms = (audioEl.currentTime || 0) * 1000
      if (tl.length > 0) {
        let i = 0
        while (i + 1 < tl.length && tl[i + 1].at <= tms) i++
        const A = tl[i], B = tl[i + 1] ?? A
        const span = Math.max(1, (B.at - A.at))
        const tt = MathUtils.clamp((tms - A.at) / span, 0, 1)
        const shapes = lerpShapes(phonemeToShapes(A.phoneme), phonemeToShapes(B.phoneme), tt)
        applyShapes(shapes)
        // pull whichever open key we used to estimate amplitude for bobbing
        const openKey = shapeMapRef.current.jawOpen ?? singleMouthKeyRef.current
        speakAmount = openKey ? (shapes[openKey] ?? 0) : 0
      }
    } else if (analyser && freqData) {
      const buffer = freqData.buffer instanceof ArrayBuffer ? freqData.buffer : new ArrayBuffer(freqData.length);
      const safeFreqData = new Uint8Array(buffer, freqData.byteOffset, freqData.length);
      analyser.getByteFrequencyData(safeFreqData);
      let sum = 0;
      for (let i = 0; i < safeFreqData.length; i++) sum += safeFreqData[i];
      const energy = sum / (safeFreqData.length * 255);

      // quick calibration
      if (!calibRef.current.done) {
        calibRef.current.frames++
        calibRef.current.mean += (energy - calibRef.current.mean) * 0.05
        if (calibRef.current.frames > 18) calibRef.current.done = true
      }
      const noise = calibRef.current.done ? calibRef.current.mean : 0.02
      const gate = noise + 0.025
      const targetRaw = Math.max(0, energy - gate)
      const target = Math.min(1, targetRaw * 5.5)

      const prev = mouthAmtRef.current
      const goingUp = target > prev
      if (goingUp && target > 0.02) holdRef.current.openUntil = now + 60
      else if (!goingUp && target < 0.01) holdRef.current.closeUntil = now + 60

      const attack = 0.75, release = 0.18
      const smoothed = prev + (target - prev) * (goingUp ? attack : release)
      mouthAmtRef.current = MathUtils.clamp(smoothed, 0, 0.98)
      speakAmount = mouthAmtRef.current

      const shapes = amplitudeToShapes(speakAmount)
      if (Object.keys(shapes).length) {
        applyShapes(shapes)
      } else {
        // Jaw bone fallback
        const jaw = jawBoneRef.current
        const rest = jawRestRef.current
        if (jaw) {
          const maxOpen = 0.35
          if (rest) (jaw as Object3D).rotation.set(rest.x + speakAmount * maxOpen, rest.y, rest.z)
          else (jaw as Object3D).rotation.x = speakAmount * maxOpen
        }
      }
    }

    // Blink
    const { eyeBlinkLeft, eyeBlinkRight } = shapeMapRef.current
    const blink = blinkRef.current
    if (now >= blink.nextAt && !blink.active) {
      blink.active = true; blink.t = 0; blink.closing = true
    }
    if (blink.active) {
      const speed = 12
      if (blink.closing) { blink.t += speed * dt; if (blink.t >= 1) { blink.t = 1; blink.closing = false } }
      else { blink.t -= speed * dt; if (blink.t <= 0) { blink.t = 0; blink.active = false; blink.nextAt = now + 1600 + Math.random() * 2600 } }
      setBlendshape(eyeBlinkLeft, blink.t)
      setBlendshape(eyeBlinkRight, blink.t)
    }

    // Head bob (amplify a bit if we found no mouth rig so you can see audio is flowing)
    const noMouthRig = !shapeMapRef.current.jawOpen && !singleMouthKeyRef.current && !jawBoneRef.current
    const bobGain = noMouthRig ? 2.2 : 1.0
    bobRef.current.speakAmt = MathUtils.lerp(bobRef.current.speakAmt, speakAmount, 0.2)
    bobRef.current.phase += (0.8 + bobRef.current.speakAmt * 2.0) * dt
    const bob = Math.sin(bobRef.current.phase * Math.PI * 2) * 0.02 * bobRef.current.speakAmt * bobGain
    if (group.current) {
      group.current.rotation.x = bob * 0.35
      group.current.rotation.y = bob * 0.15
      group.current.position.y = position[1] + bob * 0.08
    }
  })

  // Preserve jaw rest on unmount
  useEffect(() => {
    return () => {
      if (jawBoneRef.current && jawRestRef.current) {
        (jawBoneRef.current as Bone | Object3D).rotation.copy(jawRestRef.current)
      }
    }
  }, [])

  // Cache of "has morph" (optional)
  useEffect(() => {
    const has: Record<string, boolean> = {}
    scene.traverse((child: any) => {
      if (child.morphTargetDictionary) {
        Object.keys(child.morphTargetDictionary).forEach(k => (has[k] = true))
      }
    })
    ;(group.current as any)._morphHas = has
  }, [scene])

  return (
    <primitive
      ref={group}
      object={scene}
      position={position as any}
      scale={scale}
    />
  )
}

useGLTF.preload(DEFAULT_MODEL)
