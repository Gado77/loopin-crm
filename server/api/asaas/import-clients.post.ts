import { listarClientesAsaas } from '../../utils/asaas'
import { criarClienteAsaas } from '../../utils/asaas'
import { useDb, generateId } from '../../utils/db'

export default defineEventHandler(async (event) => {
  const db = useDb()
  const body = await readBody(event).catch(() => ({}))
  const mode = body.mode || 'import' // 'import' ou 'sync'
  
  try {
    console.log('[Import] Iniciando importacao de clientes do Asaas...')
    const asaasClients = await listarClientesAsaas()
    console.log(`[Import] Encontrados ${asaasClients.data.length} clientes no Asaas`)
    
    const imported: string[] = []
    const skipped: string[] = []
    const errors: string[] = []

    for (const asaasClient of asaasClients.data) {
      // Verifica se já tem o ID do Asaas
      const existingByAsaasId = await db
        .from('clients')
        .select('id, name, asaas_customer_id')
        .eq('asaas_customer_id', asaasClient.id)
        .single()

      if (existingByAsaasId.data) {
        skipped.push(`${asaasClient.name} (já vinculado)`)
        continue
      }

      // Verifica se já existe cliente com mesmo email
      if (asaasClient.email) {
        const existingByEmail = await db
          .from('clients')
          .select('id, name, email, asaas_customer_id')
          .eq('email', asaasClient.email)
          .single()

        if (existingByEmail.data) {
          // Vincular cliente existente ao Asaas
          await db
            .from('clients')
            .update({ asaas_customer_id: asaasClient.id })
            .eq('id', existingByEmail.data.id)
          
          skipped.push(`${asaasClient.name} (vincular ao existente: ${existingByEmail.data.name})`)
          continue
        }
      }

      // Importar novo cliente com todos os dados
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

    console.log(`[Import] Concluído: ${imported.length} importados, ${skipped.length} vinculados, ${errors.length} erros`)
    
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
    console.error('[Import] Erro:', error)
    throw createError({
      statusCode: error.statusCode || 500,
      message: error.message || 'Erro ao importar clientes do Asaas'
    })
  }
})