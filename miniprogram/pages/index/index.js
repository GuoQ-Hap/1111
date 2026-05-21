const { call, toast } = require('../../utils/cloud')

Page({
  data: {
    keyword: '',
    status: 'all',
    books: [],
    loading: false
  },

  onShow() {
    this.loadBooks()
  },

  onKeywordInput(event) {
    this.setData({ keyword: event.detail.value })
  },

  switchStatus(event) {
    this.setData({ status: event.currentTarget.dataset.status }, () => this.loadBooks())
  },

  async loadBooks() {
    this.setData({ loading: true })
    try {
      const { result } = await call('books', {
        action: 'list',
        keyword: this.data.keyword.trim(),
        onlyAvailable: this.data.status === 'available'
      })
      this.setData({
        books: result.books.map(item => ({
          ...item,
          coverText: (item.title || '书').slice(0, 1)
        }))
      })
    } catch (err) {
      console.error(err)
      toast('图书加载失败')
    } finally {
      this.setData({ loading: false })
    }
  },

  openBook(event) {
    wx.navigateTo({
      url: `/pages/book/book?id=${event.currentTarget.dataset.id}`
    })
  }
})
