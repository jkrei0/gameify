# API routes

Successful responses return a 200 HTTP status code, and a json response with an optional `success` property. A basic response will look like this:
```js
{
    success: true, /* (optional) */
    /* Possibly additional fields */
}
```

All routes have a standard error response. A failed request will return a 400 or 500 HTTP status code. **EITHER (not both)**, an `error: 'string'` property **OR** a `success: false` property will be included,  A basic error response will look like this:
```js
{
    error: 'reason for error', /* If a reason is available */
    success: false, /* If no reason is available */
    /* Possibly additional fields */
}
```

Response fields defined in these docs are assumed to be included only on successful responses, unless marked otherwise, and will include the respective fields above unless marked otherwise.

- Request/response parameters in `[brackets]` are optional and may/might not be included.
- Routes that require authorization require that `username` and `sessionKey` fields be included in the request. This can be accessed from `localStorage.getItem('accountName')` and `localStorage.getItem('accountSessionKey')`.
- Routes marked as "available cross-origin" send an `Access-Control-Allow-Origin: *` header in the response (all others do not).

### `/api/account/request`
**Requires authorization**: No

**Description**: Send an account request

**Request parameters**:
- `username`: Requested username
- `name`: The name of the person/org requesting the account
- `email`: The email of the requester
- `reason`: A couple sentences explaining the request

**Response**: No extra fields

### `/api/games-store/change-password`
**Requires authorization**: Yes

**Description**: Change the password for an account

**Request parameters**:
- `password`: The user's current password
- `new_password`: The user's new password

**Response**: No extra fields

### `/api/games-store/login.js`
**Requires authorization**: No

**Description**: Login to an account

**Request parameters**:
- `username`: The user's username
- `password`: The user's password

**Response**:
- `sessionKey`: If login is successful, the session key for the user

### `/api/games-store/list-games`
**Requires authorization**: Yes

**Description**: List all of the (cloud-saved) games for a user

**Request parameters**: No extra fields

**Response**:
- `games`: An array of games saved to the user's account

### `/api/games-store/load-game` *(available cross-origin)*
**Requires authorization**: No

**Description**: Get data for a game saved to the cloud

**Request parameters**:
- `username`: The owner of the game
- `title`: The title (name) of the game

**Response**:
- `data`: The game data
- `timestamp`: When the game was last uploaded

### `/api/games-store/save-game`
**Requires authorization**: Yes

**Description**: Save a game to the cloud

**Request parameters**:
- `title`: The title (name) of the game
- `[data]`: The game data (do not include if `delete` is `true`)
- `[delete]`: If `true`, deletes an existing cloud save

**Response**: No extra fields

### `/api/integrations/github-callback`
**Requires authorization**: Yes

**Description**: Callback from GitHub, exchange a code for an access token and save it

**Request parameters**:
- `code`: The code returned from GitHub

**Response**: No extra fields

### `/api/integrations/github-details`
**Requires authorization**: Yes

**Description**: Get user details from GitHub

**Request parameters**:
- `query`: What details to fetch. If blank/undefined, only integration status is fetched.
- `query.user`: Include github user details
- `query.repo`: Include a list of the user's github repos

**Response**:
- `integration`: If the user has enabled github integration
- `user`: An object including user details
- `user.login`: The username of the connected github account
- `user.name`: The name of the connected github account
- `user.avatar_url`: A URL to the user's avatar
- `repos`: An array of repo objects
- `repos[].id`: Repository ID
- `repos[].name`: The name of the repo
- `repos[].full_name`: The full name of the repo
- `repos[].owner`: The github username of the repo owner
- `repos[].permissions`: Permissions available for that repo

### `/api/integrations/github-load-game`
**Requires authorization**: Yes

**Description**: Load a game from a GitHub repo

**Request parameters**:
- `repo`: The name of the github repo (`'gh_user/repo_name'`)
- `[url]`: The url to the git repository (currently not used)

**Response**:
- `data`: The game data, incluing object, file, and integration data
- `data.objects`: Object data
- `data.files`: Files in the project
- `data.integration`: Information about github and other project integrations

### `/api/integrations/github-push-game`
**Requires authorization**: Yes

**Description**: Push a change to the game's GitHub repo

**Request parameters**:
- `repo`: The name of the github repo (`'gh_user/repo_name'`)
- `[url]`: The url to the git repository (currently not used)
- `message`: The commit message
- `data`: Updated game data (including `objects`, `files`, and `integrations` properties)

**Response**:
- `[branch]`: If there's a merge conflict, changes are pushed to a new branch instead, and the branch name is returned.
