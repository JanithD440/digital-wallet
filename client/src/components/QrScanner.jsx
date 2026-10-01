import { useEffect, useRef, useState } from 'react'
import { Html5Qrcode } from 'html5-qrcode'
import { Camera, CameraOff, Loader2 } from 'lucide-react'

const REGION_ID = 'qr-reader'

export default function QrScanner({ onDecoded }) {
  const scannerRef = useRef(null)
  const handledRef = useRef(false)
  const [scanning, setScanning] = useState(false)
  const [starting, setStarting] = useState(false)
  const [error, setError] = useState('')

  const stop = async () => {
    const scanner = scannerRef.current
    scannerRef.current = null
    if (!scanner) return
    try {
      await scanner.stop()
    } catch {
      /* already stopped */
    }
    try {
      scanner.clear()
    } catch {
      /* nothing to clear */
    }
    setScanning(false)
  }

  const start = async () => {
    setError('')
    setStarting(true)
    handledRef.current = false

    try {
      const scanner = new Html5Qrcode(REGION_ID)
      scannerRef.current = scanner

      await scanner.start(
        { facingMode: 'environment' },
        {
          fps: 10,
          qrbox: (w, h) => {
            const size = Math.floor(Math.min(w, h) * 0.7)
            return { width: size, height: size }
          },
        },
        async (text) => {
          if (handledRef.current) return
          handledRef.current = true
          await stop()
          onDecoded(text)
        },
        () => {}
      )
      setScanning(true)
    } catch {
      scannerRef.current = null
      setError('Could not open the camera. Please allow camera permission and close other apps using the camera.')
    }

    setStarting(false)
  }

  useEffect(() => {
    return () => {
      stop()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div>
      {!scanning && (
        <div className="grid place-items-center rounded-2xl border border-dashed border-white/15 bg-white/5 px-6 py-14 text-center">
          <div className="grid h-14 w-14 place-items-center rounded-2xl bg-linear-to-br from-indigo-500 to-fuchsia-500">
            <Camera className="h-7 w-7 text-white" />
          </div>
          <p className="mt-4 max-w-xs text-sm text-white/60">
            Point your camera at a Digital Wallet QR code. The card is saved to your wallet automatically.
          </p>
          <button onClick={start} disabled={starting} className="btn-primary mt-6 !w-auto px-8">
            {starting ? <Loader2 className="h-5 w-5 animate-spin" /> : <Camera className="h-4 w-4" />}
            Start camera
          </button>
        </div>
      )}

      <div id={REGION_ID} className="w-full overflow-hidden rounded-2xl" />

      {scanning && (
        <button onClick={stop} className="btn-ghost mx-auto mt-4">
          <CameraOff className="h-4 w-4" /> Stop camera
        </button>
      )}

      {error && <p className="mt-4 rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-300">{error}</p>}
    </div>
  )
}