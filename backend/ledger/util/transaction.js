// Transaction Utilities

import { nanoid, customAlphabet } from "nanoid";

import { User, Transaction } from '../dao/models.js';

export const credit_user = async (userId, credits, description) => {
  // Credit the user from the system, this may only be called internally
  // and must not be exposed under any APIs.

  const user = await User.findOne({id: userId});
  if (!user) throw "InvalidUser";

  // Create the transaction
  const transaction = new Transaction({
    id: nanoid(8),
    credits: credits,
    initator: 0,
    target: user.id,
    type: 3, // SYSTEM-USER
    description: description
  });

  await transaction.save();

  // Credit the users account
  user.credits += credits;
  user.markModified("credits");
  await user.save();

  return true;
}