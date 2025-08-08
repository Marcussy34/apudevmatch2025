import React, { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ZkLoginService } from '../services/zklogin'

type DeviceEnv = {
  userAgent: string
  platform: string
  language: string
  hardwareConcurrency?: number
  screen?: { width: number; height: number; pixelRatio: number }
  timezoneOffsetMinutes: number
}

type RegistryAction =
  | 'create_device_registry'
  | 'register_device'
  | 'revoke_device'
  | 'suspend_device'
  | 'reactivate_device'
  | 'record_device_access'

function toHex(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer)
  const hex: string[] = []
  for (let i = 0; i < bytes.length; i++) {
    const h = bytes[i].toString(16).padStart(2, '0')
    hex.push(h)
  }
  return hex.join('')
}

function deriveDeviceName(ua: string, platform: string): string {
  const isWindows = /Windows/i.test(platform) || /Windows NT/i.test(ua)
  const isMac = /Mac/i.test(platform) || /Mac OS X/i.test(ua)
  const isAndroid = /Android/i.test(ua)
  const isIOS = /iPhone|iPad|iPod/i.test(ua)
  const os = isWindows ? 'Windows' : isMac ? 'macOS' : isAndroid ? 'Android' : isIOS ? 'iOS' : 'Unknown OS'

  const chrome = /Chrome\/(\d+)/i.exec(ua)
  const edge = /Edg\/(\d+)/i.exec(ua)
  const firefox = /Firefox\/(\d+)/i.exec(ua)
  const safari = /Version\/(\d+).+Safari/i.exec(ua)
  let browser = 'Unknown Browser'
  if (edge) browser = `Edge ${edge[1]}`
  else if (chrome) browser = `Chrome ${chrome[1]}`
  else if (firefox) browser = `Firefox ${firefox[1]}`
  else if (safari) browser = `Safari ${safari[1]}`

  return `${os} · ${browser}`
}

export default function ContractTestHarness() {
  const navigate = useNavigate()
  const [auto, setAuto] = useState(true)
  const [ownerAddress, setOwnerAddress] = useState('')
  const [registryObjectId, setRegistryObjectId] = useState('')
  const [deviceId, setDeviceId] = useState('')
  const [deviceName, setDeviceName] = useState('')
  const [action, setAction] = useState<RegistryAction>('register_device')
  const [packageId, setPackageId] = useState('<package_id_placeholder>')
  const [moduleAddress, setModuleAddress] = useState('grandwarden')
  const [moduleName] = useState('device_registry')

  const deviceEnv: DeviceEnv = useMemo(() => {
    return {
      userAgent: navigator.userAgent,
      platform: (navigator as any).platform ?? 'unknown',
      language: navigator.language,
      hardwareConcurrency: (navigator as any).hardwareConcurrency,
      screen: typeof window !== 'undefined' && window.screen
        ? { width: window.screen.width, height: window.screen.height, pixelRatio: window.devicePixelRatio || 1 }
        : undefined,
      timezoneOffsetMinutes: new Date().getTimezoneOffset(),
    }
  }, [])

  // Auto-collect values on mount
  useEffect(() => {
    const init = async () => {
      try {
        // Owner from stored zkLogin if present
        const stored = ZkLoginService.getStoredUserProfile?.()
        if (stored?.suiAddress) {
          setOwnerAddress(stored.suiAddress)
        }

        // Derive device name from UA
        const derivedName = deriveDeviceName(deviceEnv.userAgent, deviceEnv.platform)
        setDeviceName(derivedName)

        // Deterministic device id (persisted)
        const localKey = 'gw_device_id_v1'
        const existing = localStorage.getItem(localKey)
        if (existing) {
          setDeviceId(existing)
        } else {
          const base = JSON.stringify(deviceEnv)
          const buf = new TextEncoder().encode(base)
          const digest = await crypto.subtle.digest('SHA-256', buf)
          const hex = toHex(digest)
          // use first 32 chars for compact id
          const id = hex.slice(0, 32)
          localStorage.setItem(localKey, id)
          setDeviceId(id)
        }

        // If no owner from profile, synthesize placeholder from deviceId (pad/truncate to 40 hex)
        setOwnerAddress((prev) => {
          if (prev && prev.startsWith('0x')) return prev
          const src = localStorage.getItem('gw_device_id_v1') || '00'.repeat(20)
          const padded = (src + '0'.repeat(40)).slice(0, 40)
          return `0x${padded}`
        })
      } catch {
        // leave defaults
      }
    }
    init()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deviceEnv])

  const payload = useMemo(() => {
    const common = {
      packageId,
      moduleAddress,
      module: moduleName,
      function: action,
    }

    const metadata = {
      simulated: true,
      timestampMs: Date.now(),
      deviceEnv,
    }

    switch (action) {
      case 'create_device_registry':
        return {
          ...common,
          arguments: { owner: ownerAddress },
          metadata,
        }
      case 'register_device':
        return {
          ...common,
          arguments: { device_name: deviceName, device_id: deviceId, owner: ownerAddress },
          metadata,
        }
      case 'revoke_device':
      case 'suspend_device':
      case 'reactivate_device':
        return {
          ...common,
          arguments: { registry_object_id: registryObjectId, device_id: deviceId, caller: ownerAddress },
          metadata,
        }
      case 'record_device_access':
        return {
          ...common,
          arguments: { registry_object_id: registryObjectId, device_id: deviceId },
          metadata,
        }
      default:
        return common
    }
  }, [action, deviceEnv, deviceId, deviceName, moduleAddress, moduleName, ownerAddress, packageId, registryObjectId])

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(JSON.stringify(payload, null, 2))
      alert('Payload copied to clipboard')
    } catch {
      // fallback
    }
  }

  return (
    <div className="w-full max-w-4xl mx-auto p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Contract Test Harness (Local Simulation)</h1>
        <button onClick={() => navigate('/devices')} className="px-3 py-1.5 rounded bg-gray-700 hover:bg-gray-600 text-white">Back to Devices</button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-3 p-4 border rounded-md">
          <h2 className="font-medium">Module Target</h2>
          <label className="block text-sm">Package ID
            <input value={packageId} onChange={e => setPackageId(e.target.value)} className="mt-1 w-full px-2 py-1 border rounded bg-transparent" />
          </label>
          <label className="block text-sm">Module Address
            <input value={moduleAddress} onChange={e => setModuleAddress(e.target.value)} className="mt-1 w-full px-2 py-1 border rounded bg-transparent" />
          </label>
          <label className="block text-sm">Module Name
            <input value={moduleName} disabled className="mt-1 w-full px-2 py-1 border rounded bg-gray-800 text-gray-400" />
          </label>
          <label className="block text-sm">Action
            <select value={action} onChange={e => setAction(e.target.value as RegistryAction)} className="mt-1 w-full px-2 py-1 border rounded bg-transparent">
              <option value="create_device_registry">create_device_registry</option>
              <option value="register_device">register_device</option>
              <option value="revoke_device">revoke_device</option>
              <option value="suspend_device">suspend_device</option>
              <option value="reactivate_device">reactivate_device</option>
              <option value="record_device_access">record_device_access</option>
            </select>
          </label>
        </div>

        <div className="space-y-3 p-4 border rounded-md">
          <h2 className="font-medium">Inputs</h2>
          <div className="flex items-center justify-between">
            <label className="block text-sm">Auto fill
              <input type="checkbox" className="ml-2" checked={auto} onChange={(e) => setAuto(e.target.checked)} />
            </label>
          </div>
          <label className="block text-sm">Owner (zkLogin address simulated)
            <input value={ownerAddress} onChange={e => setOwnerAddress(e.target.value)} disabled={auto} className="mt-1 w-full px-2 py-1 border rounded bg-transparent disabled:opacity-70" />
          </label>
          {(action !== 'create_device_registry') && (
            <label className="block text-sm">Registry Object ID
              <input value={registryObjectId} onChange={e => setRegistryObjectId(e.target.value)} disabled={auto} className="mt-1 w-full px-2 py-1 border rounded bg-transparent disabled:opacity-70" />
            </label>
          )}
          {(action === 'register_device' || action === 'revoke_device' || action === 'suspend_device' || action === 'reactivate_device' || action === 'record_device_access') && (
            <>
              <label className="block text-sm">Device ID
                <input value={deviceId} onChange={e => setDeviceId(e.target.value)} disabled={auto} className="mt-1 w-full px-2 py-1 border rounded bg-transparent disabled:opacity-70" />
              </label>
            </>
          )}
          {action === 'register_device' && (
            <label className="block text-sm">Device Name
              <input value={deviceName} onChange={e => setDeviceName(e.target.value)} disabled={auto} className="mt-1 w-full px-2 py-1 border rounded bg-transparent disabled:opacity-70" />
            </label>
          )}
        </div>
      </div>

      <div className="p-4 border rounded-md">
        <div className="flex items-center justify-between mb-2">
          <h2 className="font-medium">Generated Payload (preview)</h2>
          <button onClick={copy} className="px-3 py-1.5 rounded bg-blue-600 hover:bg-blue-500 text-white">Copy JSON</button>
        </div>
        <pre className="text-sm overflow-auto p-3 bg-black/50 rounded border max-h-96">{JSON.stringify(payload, null, 2)}</pre>
      </div>

      <div className="p-4 border rounded-md">
        <h2 className="font-medium mb-2">Collected Device Environment</h2>
        <pre className="text-sm overflow-auto p-3 bg-black/40 rounded border max-h-64">{JSON.stringify(deviceEnv, null, 2)}</pre>
      </div>
    </div>
  )
}


