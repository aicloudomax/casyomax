const router = require("express").Router();
const { registerDevice } = require("../controllers/deviceController");

router.post("/register", registerDevice);

module.exports = router;
