const port = process.env.PORT || 3000
const express = require('express')
const app = express()


app.use('/', require('./router'))


const appStart = () => {
  app.listen(port, () => {
    console.log(`App is now running on port ${port}`)
  })
}

module.exports = {
  appStart
}