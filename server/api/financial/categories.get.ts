import { useDb } from '../../utils/db'

export default defineEventHandler(() => {
  const db = useDb()
  const categories = db.prepare('SELECT * FROM expense_categories ORDER BY name').all()
  return categories
})
