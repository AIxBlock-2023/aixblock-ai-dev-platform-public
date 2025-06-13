# 📎 Placeholder PR for Issue: Open Redirect via `next` Parameter

This pull request serves as a **placeholder** for the reported **Open Redirect** vulnerability affecting the login endpoint:

### 🔍 Vulnerability Summary

- **Type:** Open Redirect
- **Severity:** Medium
- **CVSS Score:** 6.1
- **Endpoint Affected:** `/user/login/?next=`
- **PoC:** https://app.aixblock.io/user/login/?next=https://evil.com

### ⚠️ Impact

- Credential theft via phishing
- Session/token hijacking
- Abuse in phishing campaigns using trusted domain

### ✅ Expected Fix

- Reject full URLs in `next`
- Only allow relative internal paths like `/dashboard`
- Use whitelist-based redirect resolver

### 🔐 Submitted By

Submitted as a security placeholder PR to comply with project contribution rules by a **bug hunter**.

🔗 **Issue link**: [#54](https://github.com/AIxBlock-2023/awesome-ai-dev-platform-opensource/issues/54)
