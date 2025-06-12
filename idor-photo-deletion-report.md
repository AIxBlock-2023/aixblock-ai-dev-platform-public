# IDOR Vulnerability Report — Avatar Deletion Endpoint

## Summary

An Insecure Direct Object Reference (IDOR) vulnerability was discovered in the `/api/users/:userId/avatar` endpoint. This allows any authenticated user to delete another user’s profile picture by changing the `userId` in the request URL.

---

## Steps to Reproduce

1. Create two user accounts: **Account A** and **Account B**.
2. Upload different profile pictures for each account.
3. Log in as **Account A**.
4. Intercept and send the following request:

DELETE /api/users/{userId}/avatar HTTP/2
Host: app.aixblock.io


Replace `{userId}` with the ID of **Account B**.

Result: Account B’s profile photo is deleted by Account A without authorization errors.

---

## Expected Behavior

The backend should enforce proper authorization checks so that:

- Users can only delete **their own photo**
- Attempting to delete another user’s photo should result in a **403 Forbidden** response.

---

## Security Impact

This issue allows any authenticated user to perform unauthorized actions on other users’ data. It violates user trust and can cause:

- Visual identity disruption
- Potential abuse in a multi-user environment

---

## Suggested Fix

- Add an authorization check to the avatar deletion endpoint that verifies:
  - `request.user.id === params.userId`
- Reject the request with appropriate HTTP status (e.g., 403) if the IDs do not match.

---

## Environment

- Tested using: Chrome browser + Burp Suite
- Endpoint affected: `DELETE /api/users/:userId/avatar`
- Backend version possibly affected: `aixblock-core v0.0.8`

---

## Reported by

@0XZAMAJ

---

Let me know if additional details or logs are needed. I’m happy to help clarify or test more if needed.
