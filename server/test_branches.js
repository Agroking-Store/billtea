const axios = require('axios');
const jwt = require('jsonwebtoken');

const token = jwt.sign({ companyId: 'd18a6efb-f40a-4a3a-a916-48e1930710cf', id: '123' }, 'supersecret', { expiresIn: '1h' });

axios.get('http://127.0.0.1:5000/api/v1/branches', { headers: { Authorization: `Bearer ${token}` } })
  .then(res => console.log(JSON.stringify(res.data, null, 2)))
  .catch(err => console.log(err.response ? err.response.data : err.message));
