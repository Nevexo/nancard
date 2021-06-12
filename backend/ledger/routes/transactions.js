// Express Routers for managing transactions

import { Router } from "express";
import { User, Transaction } from "../dao/models.js";
import EventEmitter from "events";
import { nanoid, customAlphabet } from "nanoid";

export const router = Router();
export const events = new EventEmitter();

router.get("/api/users/:id/transactions", async (req, res) => {
  const user = await User.findOne({"id": req.params.id});
  if (!user) return res.status(404).json({"error": "Invalid user specified"});

  const TargetTransactions = await Transaction.find({"target": user.id});
  const InitTransactions = await Transaction.find({"initator": user.id});

  const transactions = {
    "target": TargetTransactions || [],
    "initated": InitTransactions || []
  }

  res.json(transactions)
})