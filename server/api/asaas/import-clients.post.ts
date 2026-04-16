import { listarClientesAsaas } from '../../utils/asaas'
import { useDb, generateId } from '../../utils/db'

export default defineEventHandler(async () => {
  const db = useDb()
  
  try {
    const asaasClients = await listarClientesAsaas()
    const imported: string[] = []
    const skipped: string[] = []
    const errors: string[] = []

    for (const asaasClient of asaasClients.data) {
      const existingClient = await db
        .from('clients')
        .select('id, name, asaas_customer_id')
        .eq('asaas_customer_id', asaasClient.id)
        .single()

      if (existingClient.data) {
        skipped.push(asaasClient.name)
        continue
      }

      const { error } = await db
        .from('clients')
        .insert({
          id: generateId(),
          name: asaasClient.name,
          email: asaasClient.email || null,
          phone: asaasClient.phone || null,
          document: asaasClient.cpfCnpj || null,
          asaas_customer_id: asaasClient.id,
          status: 'active',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })

      if (error) {
        errors.push(`${asaasClient.name}: ${error.message}`)
      } else {
        imported.push(asaasClient.name)
      }
    }

    return {
      success: true,
      message: `Importação concluída!`,
      imported: imported.length,
      skipped: skipped.length,
      errors: errors.length,
      details: {
        importedClients: imported,
        skippedClients: skipped,
        errorClients: errors,
      }
    }
  } catch (error: any) {
    throw createError({
      statusCode: error.statusCode || 500,
      message: error.message || 'Erro ao importar clientes do Asaas'
    })
  }
})