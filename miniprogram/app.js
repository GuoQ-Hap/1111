App({
  onLaunch() {
    if (!wx.cloud) {
      wx.showModal({
        title: '初始化失败',
        content: '当前基础库不支持云开发，请升级微信或开发者工具。',
        showCancel: false
      });
      return;
    }

    const cloudEnv = '';

    wx.cloud.init({
      env: cloudEnv || undefined,
      traceUser: true
    });
  }
});
