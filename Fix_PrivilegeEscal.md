Hello

This pull request serves as a placeholder for Issue #58.

The file was added to meet the project’s submission requirements.

Remediation guide:

- DO not rely on front-end response before granting user access to sensitive functionalities.

- Ensure Super_Admin functionalities are not accessible to base_users and admins, by checking the permission level tied to the user session cookie or JWToken 

- SUPER_ADMIN RIGHT should be tied to access token and session cookie upon account creation, and it should also be checked when request is sent to any SUPER_ADMIN endpoint.
