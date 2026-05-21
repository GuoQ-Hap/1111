const call = (name, data = {}) => wx.cloud.callFunction({ name, data })

const toast = (title, icon = 'none') => {
  wx.showToast({ title, icon })
}

module.exports = {
  call,
  toast
}
