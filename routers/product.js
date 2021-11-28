const express = require("express");
const mongoose = require("mongoose");
const router = express.Router();
const { Product } = require("../models/product");
const { Category } = require("../models/category");
const multer = require("multer");

// *** For image upload ***
const FILE_TYPE_MAP = {
  "image/png": "png",
  "image/jpeg": "jpeg",
  "image/jpg": "jpg",
};
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const isValid = FILE_TYPE_MAP[file.mimetype];
    let uploadError = new Error("invalid image type");
    if (isValid) uploadError = null;
    cb(uploadError, "public/uploads");
  },
  filename: function (req, file, cb) {
    const filename = file.originalname.split(" ").join("-");
    const extension = FILE_TYPE_MAP[file.mimetype];
    cb(null, `${filename}-${Date.now()}.${extension}`);
  },
});

const upload = multer({ storage: storage });

// *** Get Method ***
router.get(`/`, async (req, res) => {
  // products filtering with categories
  let filter = {};
  if (req.query.categories)
    filter = { category: req.query.categories.split(",") };

  // getting product list
  const productList = await Product.find(filter).populate("category");
  if (!productList) res.status(500).json({ success: false });
  res.send(productList);
});

// getting product with id
router.get(`/:id`, async (req, res) => {
  const product = await Product.findById(req.params.id).populate("category"); // populate for show details of category collection
  if (!product) res.status(500).json({ success: false });
  res.send(product);
});

// getting total product count
router.get(`/get/count`, async (req, res) => {
  const productCount = await Product.countDocuments();
  if (!productCount) res.status(500).json({ success: false });
  res.send({ productCount: productCount });
});

// getting featured product count
router.get(`/get/featured/:count`, async (req, res) => {
  const count = req.params.count ? req.params.count : 0;
  const products = await Product.find({ isFeatured: true }).limit(+count);
  if (!products) res.status(500).json({ success: false });
  res.send(products);
});

// *** Post Method ***
router.post(`/`, upload.single("image"), async (req, res) => {
  // validating category if category exists
  const category = await Category.findById(req.body.category);
  if (!category) return res.status(400).send("Invalid Category");

  const file = req.file;
  if (!file) return res.status(400).send("Invalid File");

  const filename = req.file.filename; // uploaded image name
  const basePath = `${req.protocol}://${req.get("host")}/public/uploads/`;
  // posting prooduct
  const product = await new Product({
    name: req.body.name,
    description: req.body.description,
    richDescription: req.body.richDescription,
    image: `${basePath}${filename}`, //"http://localhost:5000/public/upload"
    brand: req.body.brand,
    price: req.body.price,
    category: req.body.category,
    countInStock: req.body.countInStock,
    rating: req.body.rating,
    numReviews: req.body.numReviews,
    isFeatured: req.body.isFeatured,
  }).save();
  // saving product to database

  if (!product) return res.status(400).send("The Product cannot be created");
  res.status(200).send(product);
});

// Update Method
router.put("/:id", upload.single("image"), async (req, res) => {
  // validating _id of product and category
  if (!mongoose.isValidObjectId(req.params.id))
    res.status(400).send("Invalid Product Id");

  // validating category if category exists
  const category = await Category.findById(req.body.category);
  if (!category) return res.status(400).send("Invalid Category");

  // validating product
  const product = await Product.findById(req.params.id);
  if (!product) return res.status(400).send("Invalid Product");

  const file = req.file;
  let imagePath;

  if (file) {
    const filename = file.filename;
    const basePath = `${req.protocol}://${req.get("host")}/public/uploads/`;
    imagePath = `${basePath}${filename}`;
  } else imagePath = product.image;

  // updating product
  const updatedProduct = await Product.findByIdAndUpdate(
    req.params.id,
    {
      name: req.body.name,
      description: req.body.description,
      richDescription: req.body.richDescription,
      image: imagePath,
      brand: req.body.brand,
      price: req.body.price,
      category: req.body.category,
      countInStock: req.body.countInStock,
      rating: req.body.rating,
      numReviews: req.body.numReviews,
      isFeatured: req.body.isFeatured,
    },
    { new: true } // show the updated info on load
  ).populate("category"); // populate for show details of category collection

  if (!updatedProduct) return res.status(400).send("Product cannot be updated");
  res.status(200).send(updatedProduct);
});

// updating image gallery
router.put(
  "/galleryImages/:id",
  upload.array("images", 20),
  async (req, res) => {
    // validating _id of product
    if (!mongoose.isValidObjectId(req.params.id))
      res.status(400).send("Invalid Product Id");

    const files = req.files;
    const basePath = `${req.protocol}://${req.get("host")}/public/uploads/`;
    let imagesPaths = [];

    if (files) {
      files.map((file) => imagesPaths.push(`${basePath}${file.filename}`));
    }

    // updating product
    const updatedProduct = await Product.findByIdAndUpdate(
      req.params.id,
      {
        images: imagesPaths,
      },
      { new: true } // show the updated info on load
    ).populate("category"); // populate for show details of category collection

    if (!updatedProduct)
      return res.status(400).send("Product cannot be updated");
    res.status(200).send(updatedProduct);
  }
);

// Delete Method
router.delete("/:id", (req, res) => {
  Product.findByIdAndRemove(req.params.id)
    .then((product) => {
      if (product)
        return res
          .status(200)
          .json({ success: true, message: "Product is deleted successfully" });
      else
        return res
          .status(404)
          .json({ success: false, message: "Product is not found" });
    })
    .catch((err) => {
      return res.status(400).json({ success: false, error: err });
    });
});

module.exports = router;
