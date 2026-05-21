const { call, toast } = require('../../utils/cloud')

const formatDate = value => {
  if (!value) return ''
  const date = new Date(value)
  const y = date.getFullYear()
  const m = `${date.getMonth() + 1}`.padStart(2, '0')
  const d = `${date.getDate()}`.padStart(2, '0')
  return `${y}-${m}-${d}`
}

Page({
  data: {
    user: {},
    avatarText: '我',
    status: 'borrowed',
    records: [],
    activeCount: 0
  },

  onShow() {
    const user = getApp().globalData.user || {}
    this.setData({
      user,
      avatarText: (user.nickName || '我').slice(0, 1)
    })
    this.loadRecords()
  },

  switchStatus(event) {
    this.setData({ status: event.currentTarget.dataset.status }, () => this.loadRecords())
  },

  async loadRecords() {
    try {
      const { result } = await call('borrow', {
        action: 'mine',
        status: this.data.status
      })
      const records = result.records.map(item => ({
        ...item,
        borrowedAtText: formatDate(item.borrowedAt),
        dueAtText: formatDate(item.dueAt),
        requestedReturnAtText: formatDate(item.requestedReturnAt),
        returnedAtText: formatDate(item.returnedAt)
      }))
      this.setData({
        records,
        activeCount: result.activeCount
      })
    } catch (err) {
      console.error(err)
      toast('借阅记录加载失败')
    }
  },

  async returnBook(event) {
    try {
      await call('borrow', {
        action: 'return',
        recordId: event.currentTarget.dataset.id
      })
      toast('已提交归还申请', 'success')
      this.loadRecords()
    } catch (err) {
      console.error(err)
      toast(err.message || '归还失败')
    }
  }
})
