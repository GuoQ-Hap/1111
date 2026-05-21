App({
  globalData: {
    envId: '',
    user: null
  },

  onLaunch() {
    if (!wx.cloud) {
      wx.showModal({
        title: '初始化失败',
        content: '请使用支持云开发的微信开发者工具打开项目',
        showCancel: false
      })
      return
    }

    wx.cloud.init({
      env: this.globalData.envId || undefined,
      traceUser: true
    })

    this.bootstrapUser()
  },

  async bootstrapUser() {
    try {
      const { result } = await wx.cloud.callFunction({ name: 'login' })
      this.globalData.user = result.user
    } catch (err) {
      console.error('login failed', err)
    }
  }
})
