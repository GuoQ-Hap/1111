Page({
  data: {
    name: '',
    idCard: '',
    loading: false,
    result: null,
    error: ''
  },

  onNameInput(event) {
    this.setData({
      name: event.detail.value,
      error: '',
      result: null
    });
  },

  onIdCardInput(event) {
    const value = event.detail.value.toUpperCase();
    this.setData({
      idCard: value,
      error: '',
      result: null
    });
  },

  async onQuery() {
    const name = this.data.name.trim();
    const idCard = this.data.idCard.trim().toUpperCase();

    if (!name) {
      this.setData({ error: '请输入姓名' });
      return;
    }

    if (!this.isValidIdCard(idCard)) {
      this.setData({ error: '请输入正确的身份证号' });
      return;
    }

    this.setData({
      loading: true,
      error: '',
      result: null
    });

    try {
      const response = await wx.cloud.callFunction({
        name: 'queryExamSeat',
        data: {
          name,
          idCard
        }
      });

      const payload = response.result || {};

      if (!payload.success) {
        this.setData({
          error: payload.message || '未查询到考场信息，请核对姓名和身份证号。',
          result: null
        });
        return;
      }

      this.setData({
        result: payload.data,
        error: ''
      });
    } catch (error) {
      this.setData({
        error: '查询服务暂时不可用，请稍后再试。',
        result: null
      });
    } finally {
      this.setData({ loading: false });
    }
  },

  onReset() {
    this.setData({
      name: '',
      idCard: '',
      loading: false,
      result: null,
      error: ''
    });
  },

  isValidIdCard(value) {
    return /(^\d{15}$)|(^\d{17}[\dX]$)/.test(value);
  }
});
