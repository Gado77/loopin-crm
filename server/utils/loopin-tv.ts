import { useRuntimeConfig } from '#imports'

/**
 * Notifica o Loopin.tv sobre uma mudança de status de um cliente
 * 
 * @param clientId ID do cliente no CRM (que é o mesmo ID do advertiser no Loopin.tv)
 * @param action Ação a ser tomada pelo Loopin.tv ('activate' | 'pause')
 */
export async function notifyLoopinTv(clientId: string, action: 'activate' | 'pause'): Promise<boolean> {
  const config = useRuntimeConfig()
  const functionUrl = process.env.LOOPIN_TV_FUNCTIONS_URL || 'https://sxsmirhqbslmvyesikgg.supabase.co/functions/v1'
  const serviceKey = process.env.LOOPIN_TV_SERVICE_ROLE_KEY
  
  if (!serviceKey) {
    console.warn('[notifyLoopinTv] LOOPIN_TV_SERVICE_ROLE_KEY não configurada. Ignorando notificação.')
    return false
  }

  try {
    console.log(`[notifyLoopinTv] Enviando ação '${action}' para o cliente ${clientId}...`)
    
    // A função edge 'sync-advertiser-status' ainda será criada no Loopin.tv
    const response = await fetch(`${functionUrl}/sync-advertiser-status`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${serviceKey}`,
      },
      body: JSON.stringify({
        clientId,
        action
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error(`[notifyLoopinTv] Erro (HTTP ${response.status}):`, errorText)
      return false
    }

    console.log(`[notifyLoopinTv] Sucesso: Loopin.tv notificado (${action}) para ${clientId}`)
    return true
  } catch (err: any) {
    console.error('[notifyLoopinTv] Falha de rede ao notificar Loopin.tv:', err.message)
    return false
  }
}
