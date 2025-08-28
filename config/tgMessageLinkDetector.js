const axios = require("axios");

const TOKEN = "6238483226:AAGqfmihU3eWu478Q2uNPqqP0QfD3kOCAM8"; // tokenni .env ichida saqlashni maslahat beraman

/**
 * Telegram message linkdan rasmni olish
 * @param {string} link - Telegram message link (https://t.me/c/2558543778/249)
 * @returns {Promise<Stream>} - Rasm oqimi (stream) qaytaradi
 */

async function tgMessageLinkDetector(link) {
  if (!link) throw new Error("Link kerak");

  // Linkdan chat_id va message_id ajratib olish
  const parts = link.split("/");
  const chatId = `-100${parts[4]}`; // -1002558543778
  const msgId = parts[5]; // 249

  // Lekin oddiy holda getChatMessage ishlatiladi
  const msg = await axios
    .get(`https://api.telegram.org/bot${TOKEN}/forwardMessage`, {
      params: { chat_id: 1115496160, message_id: msgId, from_chat_id: chatId },
    })
    .catch(() => null);

  if (!msg) {
    throw new Error("Xabarni olib bo‘lmadi (bot kanal/guruhda emasmi?)");
  }

  const message = msg.data.result;
  if (!message.photo) {
    throw new Error("❌ Bu xabarda rasm yo‘q");
  }

  // Eng katta sifatdagi rasmni olish
  const fileId = message.photo[message.photo.length - 1].file_id;

  // File path olish
  const fileResp = await axios.get(
    `https://api.telegram.org/bot${TOKEN}/getFile`,
    { params: { file_id: fileId } }
  );

  const filePath = fileResp.data.result.file_path;

  // Telegram fayl URL
  const fileUrl = `https://api.telegram.org/file/bot${TOKEN}/${filePath}`;

  // STEP 4. Forward qilingan xabarni o‘chirib tashlash
  await axios
    .get(`https://api.telegram.org/bot${TOKEN}/deleteMessage`, {
      params: {
        chat_id: 1115496160,
        message_id: msg.data.result.message_id,
      },
    })
    .catch(() => {});

  // Stream qaytarish
  const imgStream = await axios.get(fileUrl, { responseType: "stream" });
  return imgStream.data;
}

module.exports = tgMessageLinkDetector;
