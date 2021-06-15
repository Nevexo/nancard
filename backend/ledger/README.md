# NaNcard Ledger

The central service for storing account information, transactions & temporary passes.

## TODO

- Business accounts
- Access passes
- User initated transactions
- Business initated transactions
- WebSockets for live information

## Schemas

### User

Users are linked to a player on the Minecraft server, their username is picked up by a player detector
(or typed in by hand)

Web access tokens are used by the web interface (stored in a cookie) - the activation code is cycled every time
the user uses an ATM, this code can be entered into the web interface to link a browser to the user. Once the activation code
is used, the access token is cycled and sent to the frontend once. It can then be used until the activation code is used once more.

`
{
  "id": string (random 8-digit string)
  "username": string (minecraft username)
  "credits": integer (number of credits the user has)
  "web": {
    "access_token": string (random 24-character access token for web interface)
    "activation_code": string (6-digit for activating the web interface, cycled every ATM-use)
  },
  "staff_member": bool (is this user a nancard admin)
  "enabled": bool (is this account enabled)
  "pin": string (4-digit pin for the user)
}
`

### Card

Each user can have multiple cards, these are ComputerCraft disks, meaning they're assigned a single-use number.
Each card also has a rolling code that cycles everytime it's used to reduce the chance of fraud.

A file called "NANCARD_DEFINITION" is written to the disk and read by any nancard terminal, see the non-backend documentation
for more information on this. Once a card is activated the rolling code is updated and must be written back to the disk.

If a card is lost, it should be disabled on the API. This definition is the API schema, not necessarily what's stored in NANCARD_DEFINITION.

`
{
  "id": string (random 8-digit string)
  "user_id": string (user ID)
  "disk_id": integer (the computercraft disk ID)
  "rolling_code": string (random 10-character rolling code)
  "enabled": bool (is this card allowed to be used)
}
`

NOTE: NaNcard 2 supports contactless payments (where enabled) - these payments are not linked to a specific card, and will not
require a rolling_code update.

### Business

A user can have a business assigned to their account, this can be used to take/make payments.
The business is a seperate user that the owner can transfer credits to/from

Business accounts cannot have cards assigned to them. To access the credits, the owner must transfer their
business credits to their personal account and use a card assigned to them.

`
{
  "id": string (random 8-digit string)
  "owner_id": string (user ID)
  "friendly_name": string (name used for this business in UIs)
  "credits": integer (number of credits this business currently has)
}
`

### Access Pass

NaNcard 2 supports temporary access, such as passes to the theme park, access to hotel rooms etc.
A nancard can be used to access these passes, each user can have only one pass per business.

I.e. one hotel pass and one theme park admission.

`
{
  "id": string (random 8-digit string)
  "owner_id": string (user ID)
  "business_id": string (business ID this access pass is created for)
  "friendly_name": string (a UI-friendly name for this pass (i.e. NaNparks Admission))
  "activation_date": Date (date/time this pass starts operating)
  "expiration_date": Date (date/time this pass expires)
  "meta": string (additional data the pass-handler can use (i.e. hotels might use this for room number))
}
`

### Transaction

Each transaction in the nancard ledger will follow this schema#
Transactions remain in the ledger forever, even if either/both account(s) is/are closed.

`
{
  "id": string (random 24-digit string)
  "credits": integer (positive, negative or zero number of credits transfered)
  "initiator": string (user-id/business-id creating this transaction)
  "target": string (user-id/business-id of recipent/purchaser)
  "type": integer (type of transaction, see below)
  "description": string (additional information about this transaction)
}

#### Transaction Types

1. USER-USER - A transfer between two users.
2. BUSINESS-USER - A transaction between a business and user, initiated by the business.
3. SYSTEM-USER - A transaction from the nancard service to the user (i.e. inital crediting, promotions etc.)

## API Endpoints - Users

### POST /api/users

Create a new user

JSON: `{"username": "Minecraft Username", "pin": "4-digit pin number"}`

Success Expect: 200 OK

`json
{
  "user_id": "random 8-digit user ID",
  "username": "username provided",
  "web_activation_code": "6-digit activation code for web interface"
}`

Failure Expect: 400 BAD REQUEST, see human-readable error in JSON body.

### DELETE /api/users/:id

Delete a specified user (by ID), requires pin number. The user must have
zero credits.

JSON: `{"pin": "4-digit pin number"}

Success Expect: 204 NO CONTENT

Failure Expect: 404 NOT FOUND


### GET /api/users/:id

Get information for a user, provide web access token for additional information.

No token JSON: `{"username": "username", "enabled": boolean, "staff_member": boolean}`

Token JSON: User Schema

Success Expect: 200 OK

Failure Expect: 404 NOT FOUND / 401 UNAUTHORIZED

## API Endpoints - Cards

### GET /api/users/:id/cards

Get all cards linked to this user, requires web access token

JSON: `[{card object}]`

Success Expect: 200 OK (possibly empty array)

Failure Expect: 404 NOT FOUND / 401 UNAUTHORIZED

### POST /api/cards

Create a card for a user, requires an account pin number.

JSON `{"user": "user ID", "disk_id": "computercraft disk number", "pin": "account pin number"}

Success Expect: 200 OK (card in body)

Failure Expect: 401 UNAUTHORIZED / 400 BAD REQUEST

### DELETE /api/cards/:id

Delete a specific card, requires web authentication

Success Expect: 204 NO CONTENT

Failure Expect: 401 UNAUTHORIZED / 400 BAD REQUEST / 500 INTERNAL SERVER ERROR

## API Endpoints - Transactions

### GET /api/users/:id/transactions

Get a list of transactions for a specific user, requires authorization from
web or card rolling code

JSON: `{"initated": [{Transaction}], "target": [{Transaction}]}`

Where initated transactions are created by the user, target and transactions
created by users/businesses that effect this user.

## API Endpoints - Businesses

### POST /api/business

Create a new business, requires web authorization for a user.

JSON: `{"friendly_name": "Unique friendly name for business"}`

Success Expect: 200 OK + Business information

Failure Expect: 401 UNAUTHORIZED / 400 BAD REQUEST

### GET /api/business

Get all businesses

Success: Expect 200 OK + JSON array

### GET /api/business/:id

Get a specific business information, provide authorization header for
credits count 

Success Expect: 200 OK + JSON

Failure expect: 404/401/400

### GET /api/users/:user_id/businsses

Get a list of businesses for a user, provide authorization header for
credits count

Success expect: 200 OK + JSON array

Failure expect: 400/404/401

