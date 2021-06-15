// Express routes for handling business accounts

import { Router } from "express";
import { User, Transaction, Business } from "../dao/models.js";
import EventEmitter from "events";
import { nanoid, customAlphabet } from "nanoid";
import { log } from "../util/log.js";

export const router = Router();
export const events = new EventEmitter();

router.post("/api/business", async (req, res) => {
  // Create a new business, requires web auth from a user,
  // they will become the owner automatically.
  if (!req.headers.authorization) return res.status(401).json({"error": "Missing auth header"});

  // Check the body is correct
  if (!req.body.friendly_name) return res.status(400).json({"error": "Missing friendly name"});

  // Attempt to find the calling user
  const user = await User.findOne({"web.access_token": req.headers.authorization});
  if (!user) return res.status(401).json({"error": "Invalid access token"});

  // Check the business name isn't already in use
  if (await Business.findOne({"friendly_name": req.body.friendly_name})) return res.status(400).json({"error": "This business name already exists"});

  // Check the user doesn't have more than 5 businesses
  if (await Business.find({"owner_id": User.id}).length >= 5) return res.status(400).json({"error": "Per-user business quota exceeded"});

  // Create the business
  const business = new Business({
    "id": nanoid(8),
    "owner_id": user.id,
    "friendly_name": req.body.friendly_name,
    "credits": 0
  })

  await business.save();

  log.info(`created new business with ID: ${business.id} - ${business.friendly_name}`);
  events.emit("new_business", business);

  res.json(business);
})

router.get("/api/business", async (req, res) => {
  // Get a list of businesses
  const businesses = await Business.find();
  let safe = [];

  // Only show public information, this is a public endpoint.
  for (const business of businesses) {
    safe.push({
      "id": business.id,
      "friendly_name": business.friendly_name,
      "owner_id": business.owner_id
    });
  }

  res.json(safe);
})

router.get("/api/business/:id", async (req, res) => {
  // Get specific business with all information (if authorised)
  const business = await Business.findOne({"id": req.params.id});
  if (!business) return res.status(404).json({"error": "Invalid business"});

  if (!req.headers.authorization) {
    // Return public information if the user isn't authenticated.
    return res.json({
      "id": business.id,
      "friendly_name": business.friendly_name,
      "owner_id": business.owner_id
    })
  }

  // Attempt to find the user
  const user = await User.findOne({"web.access_token": req.headers.authorization});
  if (!user) return res.status(401).json({"error": "Invalid access token"});
  if (user.id != business.owner_id) return res.status(401).json({"error": "You don't own this business."});

  // The user is authorised, send all information.
  res.json(business);
})

// Get businesses owned by a user
router.get("/api/users/:id/businesses", async (req, res) => {
  const businesses = await Business.find({"owner_id": req.params.id});
  let safe = [];
  let authenticated = false;

  // Check for authentication 
  if (req.headers.authorization) {
    const user = await User.findOne({"web.access_token": req.headers.authorization});
    if (user) {
      if (user.id == req.params.id) authenticated = true;
    }
  }

  for (const business of businesses) {
    let data = {
      "id": business.id,
      "friendly_name": business.friendly_name,
      "owner_id": business.owner_id
    }

    if (authenticated) data['credits'] = business.credits;

    safe.push(data);
  }

  res.json(safe);
})