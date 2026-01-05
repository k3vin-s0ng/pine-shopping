'use client'

import React, { useEffect, useRef, useImperativeHandle } from 'react'
import { useGLTF } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import { Group } from 'three'

export type FloatingHeadHandle = {
  stopAudio: () => void
}

interface FloatingHeadProps {
  audioURL: string | null
  controlRef?: React.Ref<FloatingHeadHandle>
  externalAudioRef?: React.RefObject<HTMLAudioElement | null>
}

export default function FloatingHead({ audioURL, controlRef, externalAudioRef }: FloatingHeadProps) {
  const group = useRef<Group>(null!)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const { scene } = useGLTF('/models/test1/scene.gltf') as any

  useImperativeHandle(controlRef, () => ({
    stopAudio() {
      if (externalAudioRef?.current) {
        externalAudioRef.current.pause();
        externalAudioRef.current.currentTime = 0;
      }
    },
  }), [])

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !audioURL) return;

    audio.pause()  // stop current audio
    audio.src = audioURL
    audio.load()
    audio.volume = 1.0
    audio.muted = false

    const tryPlay = async () => {
      try {
        await audio.play().catch((err) => {
          console.warn("Manual play fallback:", err);
        });
        await audio.play()
      } catch (err) {
        console.warn("Audio autoplay blocked or failed:", err)
      }
    }

    // wait until metadata is loaded before trying to play
    audio.oncanplaythrough = tryPlay

    return () => {
      audio.oncanplaythrough = null
    }
  }, [audioURL])


  useFrame(({ clock }) => {
    const t = clock.getElapsedTime()
    const mouthOpenAmount = Math.abs(Math.sin(t * 4)) * 0.5
    group.current?.children.forEach((child: any) => {
      if (child.morphTargetInfluences && child.morphTargetDictionary) {
        const idx = child.morphTargetDictionary['viseme_aa'] ?? -1
        if (idx >= 0) child.morphTargetInfluences[idx] = mouthOpenAmount
      }
    })
  })

  return <primitive ref={group} object={scene} position={[0, 0.5, -0.4]} scale={0.8} />
}
