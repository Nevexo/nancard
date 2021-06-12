// NaNcard Ledger API

import mongoose from "mongoose";
import express from "express";
import bodyParser from "body-parser";

import { User, Card, Business, AccessPass, Transaction } from "./dao/models.js";

import * as UserRouter from './routes/users.js';
import * as CardRouter from './routes/cards.js';
import * as TransactionRouter from './routes/transactions.js'

import * as OnboardingUtil from './util/onboarding.js';

const app = express();
app.use(bodyParser.json());
app.use(UserRouter.router);
app.use(CardRouter.router);
app.use(TransactionRouter.router);

UserRouter.events.on("new_user", (data) => {
  OnboardingUtil.new_user(data.id);
})

const main = async () => {
  await mongoose.connect(process.env.MONGO_URL || "mongodb://localhost/nancard", {
    useNewUrlParser: true,
    useUnifiedTopology: true
  });

  app.listen(3000);

  // const user = new User({
  //   "id": "abc123",
  //   "username": "big cheese",
  //   "credits": 0,
  //   "web": {
  //     "activation_token": "123456"
  //   },
  //   "staff_member": true,
  // })
  
  // await user.save();

  // const user = await User.find({"id": "abc123"})
  // console.dir(user);
}

main();