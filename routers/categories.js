const { Category } = require("../models/category");
const express = require("express");
const router = express.Router();

// Get Method

// getting all categories
router.get("/", async (req, res) => {
  const categoryList = await Category.find();

  if (!categoryList) res.send(500).json({ success: false });
  res.status(200).send(categoryList);
});

// getting category with _id
router.get("/:id", async (req, res) => {
  const category = await Category.findById(req.params.id);

  if (!category)
    return res.status(500).json({
      success: false,
      message: "The category with the given id is not found",
    });
  res.status(200).send(category);
});

// Post Method
router.post("/", async (req, res) => {
  const category = await new Category({
    name: req.body.name,
    icon: req.body.icon,
    color: req.body.color,
  }).save();

  if (!category) return res.status(400).send("Category cannot be created");
  res.status(200).send(category);
});

// Update Method
router.put("/:id", async (req, res) => {
  const category = await Category.findByIdAndUpdate(
    req.params.id,
    {
      name: req.body.name,
      icon: req.body.icon,
      color: req.body.color,
    },
    { new: true } // show the updated info on load
  );
  if (!category) return res.status(400).send("Category cannot be created");
  res.status(200).send(category);
});

// Delete Method
router.delete("/:id", (req, res) => {
  Category.findByIdAndRemove(req.params.id)
    .then((category) => {
      if (category)
        return res
          .status(200)
          .json({ success: true, message: "Category is deleted successfully" });
      else
        return res
          .status(404)
          .json({ success: false, message: "Category is not found" });
    })
    .catch((err) => {
      return res.status(400).json({ success: false, error: err });
    });
});

module.exports = router;
