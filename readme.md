自動補番工具
===
可以自動抓取動漫列表，並且去動漫花園載新番
如有任何疑問，可以參考此[部落格](https://blog.bgpsekai.club/newban-auto-downloader-intro)會補充更加詳細的功能

如何使用
---
請先複製專案內的 `.env` 改成 `.env.production` 並設定 OPEN_API=true 和 PORT 指定為你想要的 (可以連接 webui 用)

把 credentials.json (GD上傳用的憑證) 放到 `resource` 資料夾
[取得連結](https://console.developers.google.com/apis/credentials/oauthclient)


如果上面不會用，可以使用[這裡](https://developers.google.com/drive/api/v3/quickstart/nodejs)提供的快捷按鍵
點擊 Enable the Drive API 選擇 Desktop 即可自動產生
![](https://imgur.com/Ul0okcL.jpg)

完成之後即可 `npm run build` 執行編譯並透過 `node build/index.js` 啟動

需要先點擊連結取得授權代碼填入輸入框

![](https://i.imgur.com/ZPfjHkx.png)

完成後填入你想要上傳的資料夾路徑，複製你網址 `https://drive.google.com/drive/u/folders/*` 中的星號部分填入，例如 `1N22VQPtPN6JTi_8maasRxU_oaqecAK28` (不要直接填這個，填你自己的)

![](https://imgur.com/S3GpQQb.jpg)

最後就會開始執行拉