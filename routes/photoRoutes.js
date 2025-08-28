const express = require("express");
const tgMessageLinkDetector = require("../config/tgMessageLinkDetector");

const router = express.Router();

// GET /api/photo?link=https://t.me/c/2558543778/249
router.get("/", async (req, res) => {
  try {
    const { link } = req.query;
    if (!link) return res.status(400).send("Link kerak");

    const stream = await tgMessageLinkDetector(link);

    res.setHeader("Content-Type", "image/jpeg");
    stream.pipe(res);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server xatosi: " + err.message);
  }
});

module.exports = router;
