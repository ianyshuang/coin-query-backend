const port = process.env.PORT || 80
const express = require('express')
const cors = require('cors')
const apicache = require('apicache')

const app = express()

app.use(cors())

const cache = apicache.middleware
app.use(cache('1 minute'))

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