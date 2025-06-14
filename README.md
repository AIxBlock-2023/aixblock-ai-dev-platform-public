
### **Describe the bug**

The server at `https://app.aixblock.io/static?v=` reflects the `Origin` header in the `Access-Control-Allow-Origin` response, and includes `Access-Control-Allow-Credentials: true`. This behavior allows any attacker-controlled origin to send authenticated requests to the server if the victim is logged in.

Despite returning a 404 response, the browser accepts the CORS response with credentials, confirming a misconfiguration that could lead to session probing, CSRF, or data exfiltration from accessible endpoints.

----------

### **To Reproduce**

1.  Log in to `https://app.aixblock.io` using a valid user account in Chrome
    
2.  Open Chrome DevTools → Console
    
3.  Paste and execute the following script:

`fetch("https://app.aixblock.io/static?v=", { method: "GET", credentials: "include" })
.then(res => { console.log("Status:", res.status); console.log("Access-Control-Allow-Origin:", res.headers.get("Access-Control-Allow-Origin")); return res.text();
})
.then(body => console.log("Response Body (truncated):", body.slice(0, 300)))
.catch(err => console.error("Error:", err));` 

4.  Observe that the response includes:
    
    -   Reflected `Access-Control-Allow-Origin`
        
    -   `Access-Control-Allow-Credentials: true`
        
    -   HTML content (even if 404)
        

----------

### **Expected behavior**

A strict CORS policy should only reflect or allow origins that are explicitly whitelisted (e.g., `app.aixblock.io`). Untrusted origins should not receive credentialed responses. Session cookies should not be included in cross-origin requests.

----------

### **Screenshots**

_See attached screenshots of response headers and console output._  
![Image](https://github.com/user-attachments/assets/02066059-48d4-4458-8e31-eb1662e289fa)

----------

### **Desktop (please complete the following information):**

-   OS: Windows 10
    
-   Browser: Chrome
    
-   Version: 137.0.0.0 (latest test environment)
    

----------

### **Smartphone (please complete the following information):**

-   Device: N/A
    
-   OS: N/A
    
-   Browser: N/A
    
-   Version: N/A
    

----------

### **Additional context**

-   Vulnerability may extend to other endpoints beyond `/static?v=`
    
-   Even though the endpoint returns a 404 status, the fact that it returns valid CORS headers and session cookies confirms that the policy is misconfigured.
    
-   This could be exploited for:
    
    -   Session validation probing
        
    -   Data extraction (if sensitive content is available on other endpoints)
        
    -   CSRF chain attacks, depending on endpoint logic
