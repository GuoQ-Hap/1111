const cloud = require('wx-server-sdk')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })

const db = cloud.database()

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

const listUsers = async () => {
  await assertAdmin()
  const { data } = await db.collection('users').orderBy('createdAt', 'desc').limit(100).get()
  return { users: data }
}

const setRole = async event => {
  await assertAdmin()
  const { userId, role } = event
  if (!userId || !['admin', 'user'].includes(role)) {
    throw new Error('用户角色参数错误')
  }

  const targetRes = await db.collection('users').doc(userId).get()
  const target = targetRes.data
  if (!target) {
    throw new Error('用户不存在')
  }

  if (target.role === 'admin' && role === 'user') {
    const adminCount = await db.collection('users').where({ role: 'admin' }).count()
    if (adminCount.total <= 1) {
      throw new Error('至少保留一名管理员')
    }
  }

  const now = new Date()
  await db.collection('users').doc(userId).update({
    data: {
      role,
      updatedAt: now
    }
  })

  return { ok: true }
}

exports.main = async event => {
  if (event.action === 'list') return listUsers()
  if (event.action === 'setRole') return setRole(event)
  throw new Error('未知的用户操作')
}
