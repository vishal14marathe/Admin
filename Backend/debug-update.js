const http = require("http");

async function debugUpdate() {
  console.log("🐛 Debugging Update Policy\n");

  // 1. Login
  console.log("1. Logging in...");
  const loginRes = await makeRequest("POST", "/api/auth/login", null, {
    email: "admin@example.com",
    password: "Admin@123",
  });

  if (loginRes.status !== 200) {
    console.log("Login failed:", loginRes.data);
    return;
  }

  const token = loginRes.data.token;
  console.log("✅ Login successful, token received\n");

  // 2. Get existing policies
  console.log("2. Getting existing policies...");
  const policiesRes = await makeRequest("GET", "/api/policies", token);

  if (policiesRes.status !== 200 || !policiesRes.data.data.policies.length) {
    console.log("No policies found. Creating one first...");

    // Create a policy first
    const createRes = await makeRequest("POST", "/api/policies", token, {
      title: "Debug Update Policy " + Date.now(),
      content: "Content for debug update",
      type: "privacy_policy",
      status: "draft",
    });

    if (createRes.status !== 201) {
      console.log("Failed to create policy:", createRes.data);
      return;
    }

    var policyId = createRes.data.data.policy._id;
    console.log("Created policy ID:", policyId);
  } else {
    var policyId = policiesRes.data.data.policies[0]._id;
    console.log("Using existing policy ID:", policyId);
  }

  // 3. Test update with minimal data
  console.log("\n3. Testing update with status change...");
  const updateData = {
    status: "published",
    metaDescription: "Updated via debug script",
  };

  console.log("Update URL: PATCH /api/policies/" + policyId);
  console.log("Update data:", updateData);

  const updateRes = await makeRequest(
    "PATCH",
    `/api/policies/${policyId}`,
    token,
    updateData,
  );

  console.log("\nUpdate Response:");
  console.log("Status:", updateRes.status);
  console.log("Response:", JSON.stringify(updateRes.data, null, 2));

  if (updateRes.status === 200) {
    console.log("\n🎉 Update successful!");
    console.log("New status:", updateRes.data.data.policy.status);
  } else {
    console.log("\n❌ Update failed");
  }
}

function makeRequest(method, path, token, body) {
  return new Promise((resolve) => {
    const options = {
      hostname: "localhost",
      port: 5000,
      path: path,
      method: method,
      headers: {
        "Content-Type": "application/json",
      },
    };

    if (token) {
      options.headers.Authorization = `Bearer ${token}`;
    }

    const req = http.request(options, (res) => {
      let data = "";
      res.on("data", (chunk) => (data += chunk));
      res.on("end", () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(data) });
        } catch {
          resolve({ status: res.statusCode, data: data });
        }
      });
    });

    req.on("error", (error) => {
      resolve({ error: error.message });
    });

    if (body) {
      req.write(JSON.stringify(body));
    }

    req.end();
  });
}

debugUpdate();
