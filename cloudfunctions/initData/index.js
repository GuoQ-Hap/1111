const cloud = require('wx-server-sdk')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })

const db = cloud.database()

const assertAdmin = async () => {
  const { OPENID } = cloud.getWXContext()
  const { data } = await db.collection('users').where({ openid: OPENID }).limit(1).get()
  if (!data[0] || data[0].role !== 'admin') {
    throw new Error('仅管理员可操作')
  }
}

const books = [
  {
    title: '云开发实战指南',
    author: '微信开放团队',
    publisher: '电子工业出版社',
    category: '技术',
    isbn: '9787123450011',
    total: 6,
    summary: '围绕小程序云开发能力，介绍数据库、云函数、云存储与实际业务落地方式。'
  },
  {
    title: 'JavaScript 语言精粹',
    author: 'Douglas Crockford',
    publisher: '机械工业出版社',
    category: '编程',
    isbn: '9787111222008',
    total: 4,
    summary: '一本帮助开发者理解 JavaScript 核心语言特性的经典读物。'
  },
  {
    title: '人月神话',
    author: 'Frederick P. Brooks Jr.',
    publisher: '清华大学出版社',
    category: '软件工程',
    isbn: '9787302059325',
    total: 3,
    summary: '软件工程管理领域的经典作品，讨论复杂项目中的沟通、估算与组织问题。'
  }
]

exports.main = async () => {
  await assertAdmin()
  const now = new Date()
  const tasks = books.map(async book => {
    const existed = await db.collection('books').where({ isbn: book.isbn }).count()
    if (existed.total > 0) return null
    return db.collection('books').add({
      data: {
        ...book,
        available: book.total,
        createdAt: now,
        updatedAt: now
      }
    })
  })

  await Promise.all(tasks)
  return { ok: true }
}
