### Summary
This is regarding a fix for the vulnerability reported - https://github.com/AIxBlock-2023/awesome-ai-dev-platform-opensource/issues/68

### Patch Suggestion:
The root cause is typically a missing authorization check on the API endpoint. The fix involves adding checks to ensure the requesting user has permission to access the requested data. This change needs to be made by the developers of app.aixblock.io.
