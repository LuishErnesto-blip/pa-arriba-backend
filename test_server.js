const express = require('express');
const cors = require('cors');
const app = express();
const port = 3000;

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
  console.log('GET / recibido');
  res.send('Hola desde el servidor de prueba!');
});

app.post('/test-compras', (req, res) => {
  console.log('POST /test-compras recibido');
  console.log('Body:', req.body);
  res.json({ message: 'POST de prueba exitoso!', data: req.body });
});

app.listen(port, () => {
  console.log(`🚀 Servidor de PRUEBA corriendo en http://localhost:${port}`);
});