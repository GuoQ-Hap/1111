const cloud = require('wx-server-sdk')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })

const db = cloud.database()
const normalizeKeyword = value => String(value || '').trim()

const getCurrentUser = async () => {
  const { OPENID } = cloud.getWXContext()
  const { data } = await db.collection('users').where({ openid: OPENID }).limit(1).get()
  return data[0]
}

const assertAdmin = async () => {
  const user = await getCurrentUser()
  if (!user || user.role !== 'admin') {
    throw new Error('仅管理员可操作')
  }
  return user
}

const listBooks = async event => {
  const keyword = normalizeKeyword(event.keyword)
  const onlyAvailable = Boolean(event.onlyAvailable)
  const { data } = await db.collection('books').orderBy('createdAt', 'desc').limit(100).get()
  const lowerKeyword = keyword.toLowerCase()
  const books = data.filter(book => {
    const matchedKeyword = !lowerKeyword || [book.title, book.author, book.isbn]
      .some(value => String(value || '').toLowerCase().includes(lowerKeyword))
    const matchedStock = !onlyAvailable || book.available > 0
    return matchedKeyword && matchedStock
  }).slice(0, 50)

  return { books }
}

const getBook = async event => {
  const { data } = await db.collection('books').doc(event.id).get()
  return { book: data }
}

const createBook = async event => {
  await assertAdmin()
  const book = event.book || {}
  const total = Number(book.total)
  if (!book.title || !book.author || !Number.isInteger(total) || total <= 0) {
    throw new Error('图书信息不完整')
  }

  const now = new Date()
  return db.collection('books').add({
    data: {
      title: book.title,
      author: book.author,
      publisher: book.publisher || '',
      category: book.category || '未分类',
      isbn: book.isbn || '',
      total,
      available: total,
      summary: book.summary || '',
      createdAt: now,
      updatedAt: now
    }
  })
}

const deleteBook = async event => {
  await assertAdmin()
  if (!event.id) {
    throw new Error('缺少图书 ID')
  }

  const active = await db.collection('borrowRecords').where({
    bookId: event.id,
    status: db.command.in(['borrowed', 'pendingReturn'])
  }).count()

  if (active.total > 0) {
    throw new Error('该书仍有未完成借阅，不能删除')
  }

  await db.collection('books').doc(event.id).remove()
  return { ok: true }
}

exports.main = async event => {
  if (event.action === 'list') return listBooks(event)
  if (event.action === 'detail') return getBook(event)
  if (event.action === 'create') return createBook(event)
  if (event.action === 'delete') return deleteBook(event)
  throw new Error('未知的图书操作')
}
