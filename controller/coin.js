module.exports = {
  getCoinMarket: async (req, res, next) => {
    const { dynamoClient } = global
    let { page } = req.params
    page = parseInt(page)
    
    if (page < 1) {
      return res.status(400).send()
    }

    const fiveMin = 1000 * 60 * 5 // CoinMarket 更新的頻率為五分鐘
    const now = new Date()
    const nearest = Math.round(now.getTime() / fiveMin) * fiveMin // 取得距離目前最近的 XX:X5 分的 timestamp
    const fetchItems = 3 // 預設要從最近的時間往前取幾個 market item
    
    // 一次發出多個 get item 並使用 (不 await 進而加快 total time)
    // 並使用 Promise.all() 來取得所有回傳結果
    const promiseList = []
    for (let i = 0; i < fetchItems; i++) {
      let time = nearest - i * fiveMin
      let promise = dynamoClient.get({
        TableName: 'CoinMarket',
        Key: { time: time, page: page }
      }).promise()
      promiseList.push(promise)
    }
    
    await Promise.all(promiseList)
      .then(values => {
        // 取出有東西的 item 並 sort in descending order with time
        let items = values.map(v => v.Item).filter(v => v)
        items.sort((prev, next) => next.time - prev.time)

        // 根據是否有 item 回傳錯誤訊息 or 資料
        if (items.length === 0) {
          return res.status(500).json({ message: 'no coin market information available' })
        } else {
          return res.status(200).json(items[0].coinMarket)
        }
      })
      .catch(error => {
        console.log(error)
        return res.status(500).json({ message: error.message })
      })
  }
}