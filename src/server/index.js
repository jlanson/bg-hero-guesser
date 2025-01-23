const express = require('express')
const app = express()
const port = 5000

const roomRoutes = require('./routes/roomRoutes');

app.get('/', (req, res) => {
  res.send('Hello World!')
})

app.use('api/rooms',roomRoutes);

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})
