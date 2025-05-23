// services/robosellService.js
const axios = require("axios");

const loginUrl = "https://api.robosell.uz/api/v2/auth/login";
const refreshUrl = "https://api.robosell.uz/api/v2/auth/login/refresh";
const branchId = "8446";

const phone = "+998940790101";
const password = "940790101";

let accessToken = "";
let refreshToken = "";
let shopId = "";

async function login() {
  const response = await axios.post(loginUrl, { phone, password });
  accessToken = response.data.access;
  refreshToken = response.data.refresh;
  shopId = response.data.shop;
  console.log("✅ Login success");
}

async function refreshTokens() {
  const response = await axios.get(`${refreshUrl}?refresh=${refreshToken}`);
  accessToken = response.data.access;
  refreshToken = response.data.refresh;
  console.log("🔁 Tokens refreshed");
}

async function getCategories() {
  const url = `https://api.robosell.uz/api/v2/webapp/category/list/${shopId}?branch_ids=${branchId}`;

  try {
    const response = await axios.get(url, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });
    return response.data;
  } catch (err) {
    if (err.response?.status === 401) {
      console.warn("⚠️ Token expired, refreshing...");
      await refreshTokens();
      return await getCategories(); // Retry after refresh
    } else {
      throw err;
    }
  }
}

async function getCustomers({ limit = 100, offset = 0 } = {}) {
  const url = `https://api.robosell.uz/api/v2/customer/list/${shopId}?limit=${limit}&offset=${offset}`;

  try {
    const response = await axios.get(url, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });
    return response.data;
  } catch (err) {
    if (err.response?.status === 401) {
      console.warn("⚠️ Token expired, refreshing...");
      await refreshTokens();
      return await getCustomers(); // Retry after refresh
    } else {
      throw err;
    }
  }
}

// Tizim ishga tushganda login qilib qo'yamiz
(async () => {
  try {
    await login();
  } catch (e) {
    console.error("❌ Initial login failed:", e.message);
  }
})();

module.exports = { getCategories, getCustomers };
