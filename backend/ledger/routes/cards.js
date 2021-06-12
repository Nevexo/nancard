// Express Routers for Card management

import { Router } from "express";
import { User, Card } from "../dao/models.js";
import EventEmitter from "events";
import { nanoid, customAlphabet } from "nanoid";

export const router = Router();
export const events = new EventEmitter();

// Get a card for a specific user
router.get("/api/users/:id/cards", async (req, res) => {
  const user = await User.findOne({"id": req.params.id})

  if (!user) return res.status(404).json({"error": "Invalid User"});
  if (req.headers.authorization != user.web.access_token) return res.status(401).json({"error": "Invalid access token"});
  
  const cards = await Card.find({"user_id": req.params.id});
  
  res.json(cards);
})

// Create a new card
router.post("/api/cards", async (req, res) => {
  if (!req.body.user) return res.status(400).json({"error": "Missing user ID"})
  if (!/^(\d{4}|\d{6})$/.test(req.body.pin)) return res.status(400).json({"error": "Invalid pin format"});
  if (!req.body.disk_id) return res.status(400).json({"error": "Missing disk ID"})

  const user = await User.findOne({id: req.body.user});
  if (!user) return res.status(404).json({"error": "Invalid user"});
  if (user.pin != req.body.pin) return res.status(401).json({"error": "Invalid pin number"});

  // Check the disk ID doesn't already have a card
  if (await Card.findOne({"disk_id": req.body.disk_id})) return res.status(400).json({"error": "This disk has already been assigned a card."});

  // Create the new card
  const card = new Card({
    "id": nanoid(8),
    "user_id": req.body.user,
    "disk_id": req.body.disk_id,
    "rolling_code": nanoid(10),
    "enabled": true
  });
  await card.save();

  res.json(card);

  // Emit new card event
  events.emit("new_card_created", {"id": card.id});
})

// Delete a card
router.delete("/api/cards/:id", async (req, res) => {
  const card = await Card.findOne({id: req.params.id});
  if (!card) return res.status(404).json({"error": "Card does not exist"});

  const user = await User.findOne({id: card.user_id});
  if (!user) {
    console.error(`Orphaned nancard? Card ID: ${card.id} has no user?`);
    return res.status(500).json({"error": "Orphaned card."});
  }

  // Check authorization header against user
  if (req.headers.authorization != user.web.access_token) return res.status(401).json({"error": "Invalid access token"});

  // Delete the card
  await Card.deleteOne({"id": card.id});
  res.sendStatus(204);
  
  events.emit("card_deleted", {id: card.id});
})