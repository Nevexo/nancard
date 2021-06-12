// Onboarding manager for new accounts

import { User, Transaction } from "../dao/models.js";
import { credit_user } from "./transaction.js";

export const new_user = async (user_id) => {
  // TODO: Refactor this into a configuration file

  // Give new users 25 credits automatically
  await credit_user(user_id, 25, "Welcome to NaNcard!").catch(error => {
    console.warn(`Failed to give onboarding credits to ${user_id} err:`);
    console.error(error);
  })
}