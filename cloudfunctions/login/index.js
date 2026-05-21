const cloud = require('wx-server-sdk')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })

const db = cloud.database()

exports.main = async () => {
  const { OPENID } = cloud.getWXContext()
  const now = new Date()
  const userRef = db.collection('users').where({ openid: OPENID })
  const existed = await userRef.get()
  const adminCount = await db.collection('users').where({ role: 'admin' }).count()

  if (existed.data.length) {
    const user = existed.data[0]
    const role = adminCount.total === 0 ? 'admin' : (user.role || 'user')
    await db.collection('users').doc(user._id).update({
      data: {
        role,
        lastLoginAt: now
      }
    })
    return {
      user: {
        ...user,
        role,
        lastLoginAt: now
      }
    }
  }

  const user = {
    openid: OPENID,
    nickName: '',
    role: adminCount.total === 0 ? 'admin' : 'user',
    createdAt: now,
    lastLoginAt: now
  }
  const { _id } = await db.collection('users').add({ data: user })
  return {
    user: {
      _id,
      ...user
    }
  }
}
