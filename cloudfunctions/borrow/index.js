const cloud = require('wx-server-sdk')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })

const db = cloud.database()
const _ = db.command

const DAY = 24 * 60 * 60 * 1000

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

const attachUsers = async records => {
  const usersRes = await db.collection('users').limit(100).get()
  const userMap = usersRes.data.reduce((map, user) => {
    map[user.openid] = user
    return map
  }, {})

  return records.map(item => {
    const user = userMap[item.openid] || {}
    return {
      ...item,
      book: item.bookSnapshot,
      user: {
        nickName: user.nickName || '',
        openid: item.openid,
        role: user.role || 'user'
      }
    }
  })
}

const borrowBook = async event => {
  const { OPENID } = cloud.getWXContext()
  const now = new Date()
  const dueAt = new Date(now.getTime() + 30 * DAY)
  const active = await db.collection('borrowRecords').where({
    openid: OPENID,
    bookId: event.bookId,
    status: _.in(['borrowed', 'pendingReturn'])
  }).count()

  if (active.total > 0) {
    throw new Error('这本书已经在借阅中')
  }

  const books = db.collection('books')
  const bookRef = books.doc(event.bookId)
  const bookRes = await bookRef.get()
  const book = bookRes.data

  if (!book || book.available <= 0) {
    throw new Error('当前暂无可借库存')
  }

  const stockRes = await books.where({
    _id: event.bookId,
    available: _.gt(0)
  }).update({
    data: {
      available: _.inc(-1),
      updatedAt: now
    }
  })

  if (!stockRes.stats || stockRes.stats.updated === 0) {
    throw new Error('当前暂无可借库存')
  }

  return db.collection('borrowRecords').add({
    data: {
      openid: OPENID,
      bookId: event.bookId,
      bookSnapshot: {
        title: book.title,
        author: book.author,
        isbn: book.isbn || ''
      },
      status: 'borrowed',
      borrowedAt: now,
      dueAt,
      returnedAt: null
    }
  })
}

const returnBook = async event => {
  const { OPENID } = cloud.getWXContext()
  const recordRef = db.collection('borrowRecords').doc(event.recordId)
  const recordRes = await recordRef.get()
  const record = recordRes.data

  if (!record || record.openid !== OPENID || record.status !== 'borrowed') {
    throw new Error('借阅记录不可归还')
  }

  const now = new Date()
  const returnRes = await db.collection('borrowRecords').where({
    _id: event.recordId,
    openid: OPENID,
    status: 'borrowed'
  }).update({
    data: {
      status: 'pendingReturn',
      requestedReturnAt: now
    }
  })

  if (!returnRes.stats || returnRes.stats.updated === 0) {
    throw new Error('借阅记录不可归还')
  }

  return { ok: true }
}

const confirmReturn = async event => {
  const admin = await assertAdmin()
  const recordRef = db.collection('borrowRecords').doc(event.recordId)
  const recordRes = await recordRef.get()
  const record = recordRes.data

  if (!record || record.status !== 'pendingReturn') {
    throw new Error('归还申请不可确认')
  }

  const now = new Date()
  const returnRes = await db.collection('borrowRecords').where({
    _id: event.recordId,
    status: 'pendingReturn'
  }).update({
    data: {
      status: 'returned',
      returnedAt: now,
      confirmedReturnAt: now,
      confirmedBy: admin.openid
    }
  })

  if (!returnRes.stats || returnRes.stats.updated === 0) {
    throw new Error('归还申请不可确认')
  }

  await db.collection('books').doc(record.bookId).update({
    data: {
      available: _.inc(1),
      updatedAt: now
    }
  })

  return { ok: true }
}

const mine = async event => {
  const { OPENID } = cloud.getWXContext()
  const status = event.status || 'borrowed'
  const [recordsRes, activeRes] = await Promise.all([
    db.collection('borrowRecords').where({
      openid: OPENID,
      status
    }).orderBy('borrowedAt', 'desc').limit(50).get(),
    db.collection('borrowRecords').where({
      openid: OPENID,
      status: _.in(['borrowed', 'pendingReturn'])
    }).count()
  ])

  return {
    activeCount: activeRes.total,
    records: recordsRes.data.map(item => ({
      ...item,
      book: item.bookSnapshot
    }))
  }
}

const allRecords = async event => {
  await assertAdmin()
  const status = event.status || 'all'
  const query = status === 'all'
    ? db.collection('borrowRecords')
    : db.collection('borrowRecords').where({ status })
  const { data } = await query.orderBy('borrowedAt', 'desc').limit(100).get()
  return { records: await attachUsers(data) }
}

exports.main = async event => {
  if (event.action === 'borrow') return borrowBook(event)
  if (event.action === 'return') return returnBook(event)
  if (event.action === 'confirmReturn') return confirmReturn(event)
  if (event.action === 'mine') return mine(event)
  if (event.action === 'allRecords') return allRecords(event)
  throw new Error('未知的借阅操作')
}
