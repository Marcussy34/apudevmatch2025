import { useEffect } from 'react'
import { useSuiClientContext } from '@mysten/dapp-kit'
import { isEnokiNetwork, registerEnokiWallets } from '@mysten/enoki'

// Registers Enoki wallets (Google) for the current network/client
export default function RegisterEnokiWallets() {
  const { client, network } = useSuiClientContext()
  const enokiApiKey = (import.meta as any).env?.VITE_ENOKI_PUBLIC_API_KEY as string | undefined
  const googleClientId = (import.meta as any).env?.VITE_GOOGLE_CLIENT_ID as string | undefined

  useEffect(() => {
    if (!isEnokiNetwork(network)) return
    if (!enokiApiKey || !googleClientId) {
      // eslint-disable-next-line no-console
      console.warn('Missing VITE_ENOKI_PUBLIC_API_KEY or VITE_GOOGLE_CLIENT_ID in your Vite env. Create webapp_frontend/.env with these keys.')
      return
    }

    const { unregister } = registerEnokiWallets({
      apiKey: enokiApiKey,
      providers: {
        google: {
          clientId: googleClientId,
        },
      },
      client,
      network,
    })

    return unregister
  }, [client, network])

  return null
}


