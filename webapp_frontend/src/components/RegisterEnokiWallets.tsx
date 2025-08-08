import { useEffect } from 'react'
import { useSuiClientContext } from '@mysten/dapp-kit'
import { isEnokiNetwork, registerEnokiWallets } from '@mysten/enoki'

// Registers Enoki wallets (Google) for the current network/client
export default function RegisterEnokiWallets() {
  const { client, network } = useSuiClientContext()

  useEffect(() => {
    if (!isEnokiNetwork(network)) return

    const { unregister } = registerEnokiWallets({
      apiKey: 'enoki_public_da74b7bcded6cab783272e31da4853bb',
      providers: {
        google: {
          clientId: '36098691154-3j95ku5omvh399otb0id12q542st42c9.apps.googleusercontent.com',
        },
      },
      client,
      network,
    })

    return unregister
  }, [client, network])

  return null
}


