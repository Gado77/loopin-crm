import { criarClienteAsaas } from '../../utils/asaas'
import { useDb } from '../../utils/db'

export default defineEventHandler(async () => {
  const db = useDb()
  
  try {
    console.log('[Sync] Sincronizando clientes do CRM para o Asaas...')
    
    // Buscar clientes do CRM que não têm asaas_customer_id
    const { data: clientsWithoutAsaas, error: fetchError } = await db
      .from('clients')
      .select('id, name, email, phone, document')
      .is('asaas_customer_id', null)

    if (fetchError) {
      throw createError({
        statusCode: 500,
        message: 'Erro ao buscar clientes: ' + fetchError.message
      })
    }

    console.log(`[Sync] Encontrados ${clientsWithoutAsaas?.length || 0} clientes sem vínculo com Asaas`)

    const synced: string[] = []
    const errors: string[] = []

    for (const client of clientsWithoutAsaas || []) {
      try {
        const asaasCustomer = await criarClienteAsaas({
          name: client.name,
          email: client.email || undefined,
          phone: client.phone || undefined,
          cpfCnpj: client.document || undefined,
        })

        // Atualizar cliente com o ID do Asaas
        await db
          .from('clients')
          .update({ asaas_customer_id: asaasCustomer.id })
          .eq('id', client.id)

        synced.push(client.name)
        console.log(`[Sync] Cliente ${client.name} sincronizado com Asaas: ${asaasCustomer.id}`)
      } catch (err: any) {
        errors.push(`${client.name}: ${err.message}`)
        console.error(`[Sync] Erro ao sincronizar ${client.name}:`, err)
      }
    }

    console.log(`[Sync] Concluído: ${synced.length} sincronizados, ${errors.length} erros`)

    return {
      success: true,
      message: `Sincronização concluída!`,
      synced: synced.length,
      errors: errors.length,
      details: {
        syncedClients: synced,
        errorClients: errors,
      }
    }
  } catch (error: any) {
    console.error('[Sync] Erro geral:', error)
    throw createError({
      statusCode: error.statusCode || 500,
      message: error.message || 'Erro ao sincronizar clientes com Asaas'
    })
  }
})