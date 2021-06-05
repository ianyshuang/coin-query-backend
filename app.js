const port = process.env.PORT || 3000
const express = require('express')
const app = express()


app.use('/', require('./router'))
app.get('/', (req, res) => {
  return res.status(200).json({ message: 'hello world' })
})

const appStart = () => {
  app.listen(port, () => {
    console.log(`App is now running on port ${port}`)
  })
}

module.exports = {
  appStart
}