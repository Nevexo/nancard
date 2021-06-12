// Model definitions for mongoose, based on documentation in README.

import mongoose from "mongoose";

const WebAccessSchema = mongoose.Schema({
  "access_token": {type: String, required: false},
  "activation_code": {type: String, required: false}
})

export const User = mongoose.model("User", new mongoose.Schema({
  "id": String,
  "username": String,
  "credits": "number",
  "web": {type: WebAccessSchema, required: true},
  "staff_member": {type: "bool", default: false},
  "enabled": {type: "bool", default: true},
  "pin": String
}))

export const Card = mongoose.model("Card", new mongoose.Schema({
  "id": String,
  "user_id": String,
  "disk_id": "number",
  "rolling_code": String,
  "enabled": {type: "bool", default: true}
}))

export const Business = mongoose.model("Business", new mongoose.Schema({
  "id": String,
  "owner_id": String,
  "friendly_name": String,
  "credits": "number"
}))

export const AccessPass = mongoose.model("AccessPass", new mongoose.Schema({
  "id": String,
  "owner_id": String,
  "business_id": String,
  "friendly_name": String,
  "activation_date": Date,
  "expiration_date": Date,
  "meta": String
}))

export const Transaction = mongoose.model("Transaction", new mongoose.Schema({
  "id": String,
  "credits": "number",
  "initiator": String,
  "target": String,
  "type": "number",
  "description": String
}))