const { call, toast } = require('../../utils/cloud')

Page({
  data: {
    id: '',
    book: null,
    submitting: false
  },

  onLoad(options) {
    this.setData({ id: options.id })
    this.loadBook()
  },

  async loadBook() {
    try {
      const { result } = await call('books', {
        action: 'detail',
        id: this.data.id
      })
      this.setData({
        book: {
          ...result.book,
          coverText: (result.book.title || '书').slice(0, 1)
        }
      })
    } catch (err) {
      console.error(err)
      toast('图书详情加载失败')
    }
  },

  async borrowBook() {
    this.setData({ submitting: true })
    try {
      await call('borrow', {
        action: 'borrow',
        bookId: this.data.id
      })
      toast('借阅成功', 'success')
      await this.loadBook()
    } catch (err) {
      console.error(err)
      toast(err.message || '借阅失败')
    } finally {
      this.setData({ submitting: false })
    }
  }
})
