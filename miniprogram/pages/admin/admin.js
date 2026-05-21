const { call, toast } = require('../../utils/cloud')

const emptyForm = {
  title: '',
  author: '',
  publisher: '',
  category: '',
  isbn: '',
  total: 1,
  summary: ''
}

const formatDate = value => {
  if (!value) return ''
  const date = new Date(value)
  const y = date.getFullYear()
  const m = `${date.getMonth() + 1}`.padStart(2, '0')
  const d = `${date.getDate()}`.padStart(2, '0')
  return `${y}-${m}-${d}`
}

const statusText = status => ({
  borrowed: '借阅中',
  pendingReturn: '待确认',
  returned: '已归还'
}[status] || status)

Page({
  data: {
    user: {},
    isAdmin: false,
    tab: 'books',
    recordStatus: 'pendingReturn',
    form: { ...emptyForm },
    books: [],
    users: [],
    records: []
  },

  onShow() {
    this.bootstrap()
  },

  async bootstrap() {
    try {
      const { result } = await call('login')
      const user = result.user || {}
      getApp().globalData.user = user
      const isAdmin = user.role === 'admin'
      this.setData({ user, isAdmin })
      if (isAdmin) {
        this.loadCurrentTab()
      }
    } catch (err) {
      console.error(err)
      toast('管理员信息加载失败')
    }
  },

  switchTab(event) {
    this.setData({ tab: event.currentTarget.dataset.tab }, () => this.loadCurrentTab())
  },

  loadCurrentTab() {
    if (!this.data.isAdmin) return
    if (this.data.tab === 'books') this.loadBooks()
    if (this.data.tab === 'users') this.loadUsers()
    if (this.data.tab === 'returns') this.loadRecords('pendingReturn')
    if (this.data.tab === 'records') this.loadRecords(this.data.recordStatus)
  },

  onInput(event) {
    const { field } = event.currentTarget.dataset
    this.setData({
      [`form.${field}`]: event.detail.value
    })
  },

  async loadBooks() {
    try {
      const { result } = await call('books', { action: 'list' })
      this.setData({ books: result.books || [] })
    } catch (err) {
      console.error(err)
      toast('图书列表加载失败')
    }
  },

  async saveBook() {
    const form = {
      ...this.data.form,
      total: Number(this.data.form.total)
    }
    if (!form.title || !form.author || !form.total) {
      toast('请填写书名、作者和馆藏数量')
      return
    }

    try {
      await call('books', {
        action: 'create',
        book: form
      })
      toast('保存成功', 'success')
      this.setData({ form: { ...emptyForm } })
      this.loadBooks()
    } catch (err) {
      console.error(err)
      toast(err.message || '保存失败')
    }
  },

  deleteBook(event) {
    const { id, title } = event.currentTarget.dataset
    wx.showModal({
      title: '删除图书',
      content: `确定删除《${title}》吗？`,
      success: async res => {
        if (!res.confirm) return
        try {
          await call('books', {
            action: 'delete',
            id
          })
          toast('删除成功', 'success')
          this.loadBooks()
        } catch (err) {
          console.error(err)
          toast(err.message || '删除失败')
        }
      }
    })
  },

  async loadUsers() {
    try {
      const { result } = await call('users', { action: 'list' })
      this.setData({ users: result.users || [] })
    } catch (err) {
      console.error(err)
      toast('用户列表加载失败')
    }
  },

  async setUserRole(event) {
    const { id, role } = event.currentTarget.dataset
    try {
      await call('users', {
        action: 'setRole',
        userId: id,
        role
      })
      toast('角色已更新', 'success')
      if (id === this.data.user._id) {
        this.bootstrap()
        return
      }
      this.loadUsers()
    } catch (err) {
      console.error(err)
      toast(err.message || '角色更新失败')
    }
  },

  switchRecordStatus(event) {
    this.setData({ recordStatus: event.currentTarget.dataset.status }, () => {
      this.loadRecords(this.data.recordStatus)
    })
  },

  async loadRecords(status) {
    try {
      const { result } = await call('borrow', {
        action: 'allRecords',
        status
      })
      const records = (result.records || []).map(item => ({
        ...item,
        borrowedAtText: formatDate(item.borrowedAt),
        dueAtText: formatDate(item.dueAt),
        requestedReturnAtText: formatDate(item.requestedReturnAt),
        returnedAtText: formatDate(item.returnedAt),
        statusText: statusText(item.status)
      }))
      this.setData({ records })
    } catch (err) {
      console.error(err)
      toast('借阅记录加载失败')
    }
  },

  async confirmReturn(event) {
    try {
      await call('borrow', {
        action: 'confirmReturn',
        recordId: event.currentTarget.dataset.id
      })
      toast('已确认归还', 'success')
      this.loadRecords(this.data.tab === 'returns' ? 'pendingReturn' : this.data.recordStatus)
      if (this.data.tab === 'books') this.loadBooks()
    } catch (err) {
      console.error(err)
      toast(err.message || '确认失败')
    }
  },

  async initData() {
    try {
      await call('initData')
      toast('示例数据已写入', 'success')
      this.loadBooks()
    } catch (err) {
      console.error(err)
      toast('初始化失败')
    }
  }
})
