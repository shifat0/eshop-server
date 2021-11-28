const express = require("express");
const router = express.Router();
const { User } = require("../models/user");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

// Get Method

// getting all users
router.get("/", async (req, res) => {
  const userList = await User.find().select("-passwordHash"); // getting json excluding password

  if (!userList) res.send(500).json({ success: false });
  res.status(200).send(userList);
});

// getting user with _id
router.get("/:id", async (req, res) => {
  const user = await User.findById(req.params.id).select("-passwordHash"); // getting json excluding password

  if (!user)
    return res.status(500).json({
      success: false,
      message: "The user with the given id is not found",
    });
  res.status(200).send(user);
});

// getting total user count
router.get(`/get/count`, async (req, res) => {
  const userCount = await User.countDocuments();
  if (!userCount) res.status(500).json({ success: false });
  res.send({ userCount: userCount });
});

// Post Method
router.post("/", async (req, res) => {
  const user = await new User({
    name: req.body.name,
    email: req.body.email,
    passwordHash: bcrypt.hashSync(req.body.password, 10),
    phone: req.body.phone,
    street: req.body.street,
    apartment: req.body.apartment,
    city: req.body.city,
    zip: req.body.zip,
    country: req.body.country,
    isAdmin: req.body.isAdmin,
  }).save();

  if (!user) return res.status(400).send("User cannot be created");
  res.status(200).send(user);
});

// user authentication
router.post("/login", async (req, res) => {
  const user = await User.findOne({ email: req.body.email });

  if (!user) return res.status(400).send("The user is not found");

  // matching password with db
  if (user && bcrypt.compareSync(req.body.password, user.passwordHash)) {
    // token for user
    // sign takes 3 parameter
    const token = jwt.sign(
      // sending data with token so that hacker cant edit admin
      {
        userId: user.id,
        isAdmin: user.isAdmin,
      },
      `${process.env.secret}`, // secret key of jsonwebtoken
      { expiresIn: "1d" }
    );
    return res.status(200).send({ user: user.email, token: token });
  } else return res.status(400).send("password is wrong!");
});

// Delete Method
router.delete("/:id", (req, res) => {
  User.findByIdAndRemove(req.params.id)
    .then((user) => {
      if (user)
        return res
          .status(200)
          .json({ success: true, message: "User is deleted successfully" });
      else
        return res
          .status(404)
          .json({ success: false, message: "User is not found" });
    })
    .catch((err) => {
      return res.status(400).json({ success: false, error: err });
    });
});

module.exports = router;
