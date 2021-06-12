// Express Routers for User management

import { Router } from "express";
import { User } from "../dao/models.js";
import { log } from '../util/log.js';
import EventEmitter from "events";
import { nanoid, customAlphabet } from "nanoid";

export const router = Router();
export const events = new EventEmitter();

// Create a new user
router.post("/api/users", async (req, res) => {
  // Expects {"username": "Minecraft username"}

  if (!req.body.username) return res.status(400).json({"error": "Missing username"});
  if (!req.body.pin) return res.status(400).json({"error": "Missing pin"});

  // Validate pin number
  if (!/^(\d{4}|\d{6})$/.test(req.body.pin)) return res.status(400).json({"error": "Invalid pin format"});

  // Check the user doesn't already exist
  if (await User.exists({"username": req.body.username})) 
  return res.status(400).json({"error": "User already exists"})

  // Create the new user
  const user = new User({
    "id": nanoid(8),
    "username": req.body.username,
    "credits": 0, // Credits may be added automatically when the user_create event fires.
    "web": {
      "activation_code": customAlphabet('1234567890', 6)()
    },
    "staff_member": false,
    "pin": req.body.pin
  })

  await user.save();

  log.info(`creating new user ${user.id} (${user.username})`)

  // Return the user object
  res.status(200).json({
    "user_id": user.id,
    "username": user.username,
    "web_activation_code": user.web.activation_code
  });

  // Emit user event
  events.emit("new_user", {id: user.id});
})

// Delete/close users account
router.delete("/api/users/:id", async (req, res) => {
  // TODO: Delete cards & access passes.
  if (!/^(\d{4}|\d{6})$/.test(req.body.pin)) return res.status(400).json({"error": "Invalid pin format"});
  
  const user = await User.findOne({"id": req.params.id})
  if (!user) return res.status(404).json({"error": "Invalid user"});
  if (user.credits > 0) return res.status(400).json({"error": "User has active credits"})
  if (user.pin != req.body.pin) return res.status(400).json({"error": "Invalid pin number provided"})

  log.info(`deleted user ${user.id} (${user.username})`)

  await User.deleteOne({"id": user.id});
  res.sendStatus(204);

  // Emit user event
  events.emit("user_delete", {id: user.id})
})

// Get user information, returns credit count if authorization matches web access token
router.get("/api/users/:id", async (req, res) => {
  // TODO: Maybe provide transaction history?
  const user = await User.findOne({"id": req.params.id});
  if (!user) return res.status(404).json({"error": "Invalid user"});

  if (!req.headers.authorization) {
    res.json({
      "username": user.username,
      "enabled": user.enabled,
      "staff_member": user.staff_member
    });
  } else {
    if (!user.web.access_token) return res.status(401).json({"error": "This user doesn't have a web access token."})
    if (req.headers.authorization != user.web.access_token) return res.status(401).json({"error": "Invalid web access token"})

    res.json({
      "username": user.username,
      "enabled": user.enabled,
      "staff_member": user.staff_member,
      "credits": user.credits
    })
  }
})