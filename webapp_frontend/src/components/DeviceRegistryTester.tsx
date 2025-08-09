import { useEffect, useMemo, useState } from 'react'
import { useCurrentAccount, useSignAndExecuteTransaction, useSuiClient } from '@mysten/dapp-kit'
import { Transaction } from '@mysten/sui/transactions'
import { v4 as uuidv4 } from 'uuid'

const PACKAGE_ID = '0xda0d195bf027d7991d602b196d3e0ad5e8c4e167a8beb9d9a8b0f6d33b4ce723'
const MODULE = 'device_registry'

export default function DeviceRegistryTester() {
  const client = useSuiClient()
  const currentAccount = useCurrentAccount()
  const { mutateAsync: signAndExecute } = useSignAndExecuteTransaction()

  const [registryId, setRegistryId] = useState('')
  const [deviceName, setDeviceName] = useState('')
  const [deviceId, setDeviceId] = useState('')
  const [ownerAddr, setOwnerAddr] = useState('')
  const [busy, setBusy] = useState(false)
  const [lastDigest, setLastDigest] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const resolvedOwner = useMemo(() => ownerAddr || currentAccount?.address || '', [ownerAddr, currentAccount])
  
  // Auto-derive device fields
  const deviceEnv = useMemo(() => ({
    userAgent: navigator.userAgent,
    platform: (navigator as any).platform ?? 'unknown',
  }), [])

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

  function toHex(buffer: ArrayBuffer): string {
    const bytes = new Uint8Array(buffer)
    const hex: string[] = []
    for (let i = 0; i < bytes.length; i++) hex.push(bytes[i].toString(16).padStart(2, '0'))
    return hex.join('')
  }

  useEffect(() => {
    if (currentAccount?.address) setOwnerAddr(currentAccount.address)
    setDeviceName(deriveDeviceName(deviceEnv.userAgent, deviceEnv.platform))

    const localKey = 'gw_device_id_v1'
    const existing = localStorage.getItem(localKey)
    if (existing) setDeviceId(existing)
    else {
      const base = JSON.stringify({ ua: deviceEnv.userAgent, p: deviceEnv.platform })
      const buf = new TextEncoder().encode(base)
      crypto.subtle.digest('SHA-256', buf).then((digest) => {
        const id = toHex(digest).slice(0, 32)
        localStorage.setItem(localKey, id)
        setDeviceId(id)
      }).catch(() => {
        const fallback = Math.random().toString(16).slice(2).padEnd(32, '0').slice(0, 32)
        localStorage.setItem(localKey, fallback)
        setDeviceId(fallback)
      })
    }
  }, [currentAccount, deviceEnv])

  const handleRegister = async () => {
    if (!resolvedOwner) { setError('Missing owner address'); return }
    setError(null); setBusy(true); setLastDigest(null)
    try {
      // Try to find existing registry if no ID provided
      let registryObjectId = registryId
      if (!registryObjectId) {
        const typeStr = `${PACKAGE_ID}::${MODULE}::DeviceRegistry`
        const resp = await client.getOwnedObjects({
          owner: resolvedOwner,
          filter: { StructType: typeStr },
          options: { showType: true },
        })
        registryObjectId = (resp.data?.[0] as any)?.data?.objectId || (resp.data?.[0] as any)?.objectId || ''
      }

      const tx = new Transaction()
      // Create device info
      const deviceInfo = tx.moveCall({
        target: `${PACKAGE_ID}::${MODULE}::register_device`,
        arguments: [
          tx.pure.string(deviceName),
          tx.pure.string(deviceId),
          tx.pure.address(resolvedOwner),
        ],
      })

      let regArg: any
      let createdNew = false
      if (registryObjectId) {
        regArg = tx.object(registryObjectId)
      } else {
        // Create a new registry in this transaction
        regArg = tx.moveCall({
          target: `${PACKAGE_ID}::${MODULE}::create_device_registry`,
          arguments: [tx.pure.address(resolvedOwner)],
        })
        createdNew = true
      }

      // Add device into registry
      tx.moveCall({
        target: `${PACKAGE_ID}::${MODULE}::add_device_to_registry`,
        arguments: [regArg, deviceInfo],
      })

      // If we created a new registry, ensure it ends owned by the user
      if (createdNew) {
        tx.transferObjects([regArg], tx.pure.address(resolvedOwner))
      }

      const res = await signAndExecute({ transaction: tx, chain: 'sui:testnet' })
      // eslint-disable-next-line no-console
      console.debug('register result', res)
      // @ts-ignore
      const digest = res?.digest || res?.effects?.transactionDigest || null
      setLastDigest(digest)
    } catch (e: any) {
      setError(e?.message || String(e))
    } finally { setBusy(false) }
  }

  const regenDeviceId = () => {
    const now = Date.now().toString(16)
    const rand = Math.random().toString(16).slice(2)
    const id = (now + rand).padEnd(32, '0').slice(0, 32)
    localStorage.setItem('gw_device_id_v1', id)
    setDeviceId(id)
  }

  return (
    <div className="flex-1 flex items-start justify-center p-4">
      <div className="w-full max-w-2xl cyber-border rounded-xl p-6">
        <h2 className="text-xl font-semibold text-cyber-100 mb-4">Device Registry Tester</h2>

        <div className="grid grid-cols-1 gap-4">
          <div>
            <label className="block text-sm text-cyber-300 mb-1">Owner (connected)</label>
            <input className="cyber-input w-full" value={resolvedOwner} disabled />
            <p className="text-xs text-cyber-500 mt-1">Pulled from your connected zkLogin address.</p>
          </div>

          <div>
            <label className="block text-sm text-cyber-300 mb-1">Registry Object ID</label>
            <input
              className="cyber-input w-full"
              placeholder="0x... (existing DeviceRegistry object)"
              value={registryId}
              onChange={(e) => setRegistryId(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-cyber-300 mb-1">Device Name (derived)</label>
              <input className="cyber-input w-full" value={deviceName} disabled />
            </div>
            <div>
              <label className="block text-sm text-cyber-300 mb-1">Device ID (deterministic)</label>
              <div className="flex gap-2">
                <input className="cyber-input w-full" value={deviceId} disabled />
                <button className="cyber-button-secondary" onClick={regenDeviceId} type="button">Recompute</button>
              </div>
            </div>
          </div>
        </div>

        {error && <p className="text-sm text-red-400 mt-3">{error}</p>}
        {lastDigest && <p className="text-sm text-green-400 mt-3">Tx: {lastDigest}</p>}

        <div className="mt-6 flex gap-3">
          <button className="cyber-button" onClick={handleRegister} disabled={busy}>
            {busy ? 'Submitting…' : 'Register Device'}
          </button>
        </div>

        <p className="text-xs text-cyber-500 mt-4">Note: The connected zkLogin address must have testnet SUI for gas, unless you wire up sponsored transactions.</p>
      </div>
    </div>
  )
}


