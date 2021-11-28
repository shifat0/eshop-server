const { Order } = require("../models/order");
const express = require("express");
const { OrderItem } = require("../models/order-item");
const router = express.Router();

// *** Get Method ***
router.get("/", async (req, res) => {
  const orderList = await Order.find()
    .populate("user", "name")
    .sort({ dateOrdered: -1 });

  if (!orderList) res.status(500).json({ success: true });

  res.send(orderList);
});

router.get("/:id", async (req, res) => {
  const orderList = await Order.findById(req.params.id)
    .populate("user", "name")
    .populate({
      path: "orderItems",
      populate: { path: "product", populate: "category" },
    }); // getting details of product inside orderItems and inside product getting category details

  if (!orderList) res.status(500).json({ success: true });

  res.send(orderList);
});

router.get("/get/totalSales", async (req, res) => {
  const totalSales = await Order.aggregate([
    { $group: { _id: null, totalsales: { $sum: "$totalPrice" } } },
  ]);
  if (!totalSales)
    return res.status(400).send("The order sales cannot be generated");

  res.status(200).send({ totalsales: totalSales.pop().totalsales });
});

// getting total user count
router.get(`/get/orderCount`, async (req, res) => {
  const orderCount = await Order.countDocuments();
  if (!orderCount) res.status(500).json({ success: false });
  res.send({ orderCount: orderCount });
});

// getting userOrderlist
router.get("/get/userOrders/:userId", async (req, res) => {
  const userOrderList = await Order.find({ user: req.params.userId })
    .populate({
      path: "orderItems",
      populate: { path: "product", populate: "category" },
    })
    .sort({ dateOrdered: -1 });

  if (!userOrderList) res.status(500).json({ success: true });

  res.send(userOrderList);
});

// *** Post Method ***
router.post("/", async (req, res) => {
  const orderItemIds = Promise.all(
    // resolving 2 promises into 1 promise
    req.body.orderItems.map(async (orderItem) => {
      let newOrderItem = new OrderItem({
        quantity: orderItem.quantity,
        product: orderItem.product,
      });
      newOrderItem = await newOrderItem.save();
      return newOrderItem._id;
    })
  );

  const orderItemIdsResolve = await orderItemIds;

  // calculating total price of orders inside server not taking from the server
  const totalPrices = await Promise.all(
    orderItemIdsResolve.map(async (orderItemId) => {
      const orderItem = await OrderItem.findById(orderItemId).populate(
        "product",
        "price"
      );
      const totalPrice = orderItem.product.price * orderItem.quantity;
      return totalPrice;
    })
  );
  const totalPrice = totalPrices.reduce((a, b) => a + b, 0);

  const order = await new Order({
    orderItems: orderItemIdsResolve,
    shippingAddress1: req.body.shippingAddress1,
    shippingAddress2: req.body.shippingAddress2,
    city: req.body.city,
    zip: req.body.zip,
    country: req.body.country,
    phone: req.body.phone,
    status: req.body.status,
    totalPrice: totalPrice,
    user: req.body.user,
    dateOrdered: req.body.dateOrdered,
  }).save();

  if (!order) return res.status(400).send("Order cannot be created");
  res.status(200).send(order);
});

// *** Update Method ***
router.put("/:id", async (req, res) => {
  const order = await Order.findByIdAndUpdate(
    req.params.id,
    {
      status: req.body.status,
    },
    { new: true } // show the updated info on load
  );
  if (!order) return res.status(400).send("Order status cannot be updated");
  res.status(200).send(order);
});

// *** Delete Method ***
router.delete("/:id", (req, res) => {
  Order.findByIdAndRemove(req.params.id)
    .then(async (order) => {
      if (order) {
        await order.orderItems.map(async (orderItem) => {
          await OrderItem.findByIdAndRemove(orderItem);
        });
        return res
          .status(200)
          .json({ success: true, message: "Order is deleted successfully" });
      } else
        return res
          .status(404)
          .json({ success: false, message: "Order is not found" });
    })
    .catch((err) => {
      return res.status(400).json({ success: false, error: err });
    });
});

module.exports = router;
