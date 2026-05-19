type SoundType = "move" | "capture" | "check"

let audioCtx: AudioContext | null = null

function getContext(): AudioContext {
  if (!audioCtx) {
    audioCtx = new AudioContext()
  }
  return audioCtx
}

function playTone(frequency: number, duration: number, type: OscillatorType = "sine", volume = 0.3) {
  const ctx = getContext()
  const osc = ctx.createOscillator()
  const gain = ctx.createGain()

  osc.type = type
  osc.frequency.setValueAtTime(frequency, ctx.currentTime)
  gain.gain.setValueAtTime(volume, ctx.currentTime)
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration)

  osc.connect(gain)
  gain.connect(ctx.destination)

  osc.start()
  osc.stop(ctx.currentTime + duration)
}

export function useSound() {
  function playSound(type: SoundType) {
    switch (type) {
      case "move":
        // Short click — high frequency, very short
        playTone(1200, 0.05, "square", 0.15)
        break
      case "capture":
        // Thud — low frequency, slightly longer
        playTone(150, 0.15, "sine", 0.4)
        // Add a second hit for impact
        setTimeout(() => playTone(100, 0.1, "triangle", 0.3), 30)
        break
      case "check":
        // Warning tone — two quick high-pitched pulses
        playTone(880, 0.12, "sawtooth", 0.2)
        setTimeout(() => playTone(1100, 0.15, "sawtooth", 0.2), 130)
        break
    }
  }

  return { playSound }
}
