const express = require("express");
const router = express.Router();

const PostController = require("./controllers/PostController");

router.get("/post", PostController.index);
router.get("/post/:id", PostController.show);
router.post("/post", PostController.create);
router.delete("/post/:id", PostController.remove);

module.exports = router;
