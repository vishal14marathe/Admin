const http = require('http');

async function testCreatePolicy() {
  console.log('🧪 Testing Policy Creation\n');
  
  // 1. Login
  console.log('1. Logging in...');
  const loginData = {
    email: 'admin@example.com',
    password: 'Admin@123'
  };
  
  const loginRes = await makeRequest('POST', '/api/auth/login', null, loginData);
  
  if (loginRes.status !== 200) {
    console.log('❌ Login failed:', loginRes.data);
    return;
  }
  
  const token = loginRes.data.token;
  console.log('✅ Login successful\n');
  
  // 2. Create Policy
  console.log('2. Creating policy...');
  const policyData = {
    title: 'Test Privacy Policy ' + Date.now(),
    content: 'This is test content for privacy policy.',
    type: 'privacy_policy',
    status: 'draft'
  };
  
  const policyRes = await makeRequest('POST', '/api/policies', token, policyData);
  
  console.log('Status:', policyRes.status);
  console.log('Response:', JSON.stringify(policyRes.data, null, 2));
  
  if (policyRes.status === 201) {
    console.log('\n🎉 SUCCESS! Policy created');
    console.log('Policy ID:', policyRes.data.data.policy._id);
    console.log('Title:', policyRes.data.data.policy.title);
    console.log('Slug:', policyRes.data.data.policy.slug);
  } else {
    console.log('\n❌ Failed to create policy');
  }
}

function makeRequest(method, path, token, body) {
  return new Promise((resolve) => {
    const options = {
      hostname: 'localhost',
      port: 5000,
      path: path,
      method: method,
      headers: {
        'Content-Type': 'application/json'
      }
    };
    
    if (token) {
      options.headers.Authorization = `Bearer ${token}`;
    }
    
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(data) });
        } catch {
          resolve({ status: res.statusCode, data: data });
        }
      });
    });
    
    req.on('error', (error) => {
      resolve({ error: error.message });
    });
    
    if (body) {
      req.write(JSON.stringify(body));
    }
    
    req.end();
  });
}

testCreatePolicy();