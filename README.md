# 考场查询微信小程序

原生微信小程序 + 微信云开发实现。考生输入姓名和身份证号后，通过云函数查询云数据库中的考点、考场和座位号。

## 目录结构

```text
miniprogram/                 小程序前端
cloudfunctions/queryExamSeat 查询云函数
database/                    示例数据
```

## 使用步骤

1. 使用微信开发者工具导入本目录。
2. 在 `project.config.json` 中把 `appid` 改为你的小程序 AppID。
3. 开通云开发。可在 `miniprogram/app.js` 的 `cloudEnv` 中填写环境 ID；不填时使用开发者工具当前云环境。
4. 创建云数据库集合 `exam_seats`。
5. 导入 `database/exam_seats.sample.json`，或按相同字段导入正式考生数据。
6. 右键 `cloudfunctions/queryExamSeat`，选择“上传并部署：云端安装依赖”。
7. 在开发者工具中编译运行。

## 数据字段

| 字段 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `name` | string | 是 | 考生姓名 |
| `idCard` | string | 是 | 身份证号，建议统一大写 X |
| `examSite` | string | 是 | 考点名称 |
| `examRoom` | string | 是 | 考场 |
| `seatNo` | string | 是 | 座位号 |
| `examTime` | string | 否 | 考试时间 |
| `address` | string | 否 | 考点地址 |
| `enabled` | boolean | 是 | 是否允许查询 |

## 数据库权限建议

集合 `exam_seats` 建议设置为“仅云函数可读写”，不要开放小程序端直接读权限。前端只调用 `queryExamSeat` 云函数，云函数只返回必要的考试信息，不返回身份证号。
