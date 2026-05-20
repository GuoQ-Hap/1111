const cloud = require('wx-server-sdk');

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
});

const db = cloud.database();
const collection = db.collection('exam_seats');

exports.main = async (event) => {
  const name = String(event.name || '').trim();
  const idCard = String(event.idCard || '').trim().toUpperCase();

  if (!name || !isValidIdCard(idCard)) {
    return {
      success: false,
      message: '请输入正确的姓名和身份证号。'
    };
  }

  try {
    const result = await collection
      .where({
        name,
        idCard,
        enabled: true
      })
      .limit(1)
      .get();

    if (!result.data.length) {
      return {
        success: false,
        message: '未查询到考场信息，请核对姓名和身份证号。'
      };
    }

    const record = result.data[0];

    return {
      success: true,
      data: {
        name: record.name,
        examSite: record.examSite,
        examRoom: record.examRoom,
        seatNo: record.seatNo,
        examTime: record.examTime || '',
        address: record.address || ''
      }
    };
  } catch (error) {
    console.error('queryExamSeat failed', error);
    return {
      success: false,
      message: '查询服务暂时不可用，请稍后再试。'
    };
  }
};

function isValidIdCard(value) {
  return /(^\d{15}$)|(^\d{17}[\dX]$)/.test(value);
}
