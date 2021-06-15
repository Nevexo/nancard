// NaNcard Ledger API

import mongoose from "mongoose";
import express from "express";
import bodyParser from "body-parser";

import { User, Card, Business, AccessPass, Transaction } from "./dao/models.js";

import * as UserRouter from './routes/users.js';
import * as CardRouter from './routes/cards.js';
import * as TransactionRouter from './routes/transactions.js'
import * as BusinessRouter from './routes/business.js'

import * as OnboardingUtil from './util/onboarding.js';
import { log } from "./util/log.js";

const app = express();
app.use(bodyParser.json());
app.use(UserRouter.router);
app.use(CardRouter.router);
app.use(TransactionRouter.router);
app.use(BusinessRouter.router);

UserRouter.events.on("new_user", (data) => {
  OnboardingUtil.new_user(data.id);
})

const main = async () => {
  log.debug("connecting to database")
  await mongoose.connect(process.env.MONGO_URL || "mongodb://localhost/nancard", {
    useNewUrlParser: true,
    useUnifiedTopology: true
  });

  app.listen(process.env.LISTEN_PORT || 3000, () => {
    log.info(`http started listening at ${process.env.LISTEN_PORT || 3000}`)
  });
}

main();