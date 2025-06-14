Hello 

##Issue
This pull request serves as a placeholder for Issue ==> https://github.com/AIxBlock-2023/awesome-ai-dev-platform-opensource/issues/47

The API endpoint "/api/organizations/{Orgaizatio-ID}/memberships" is vulnerable to Insecure Direct Object Reference (IDOR), allowing authenticated users to view any user's data by manipulating the "{Orgaizatio-ID}" value.

##To Reproduce
Steps to reproduce the behavior:

   1- Go to 'https://app.aixblock.io/api/organizations/{Orgaizatio-ID}/memberships?page=1&page_size=9&project_id=&search='
   2- Click on 'Enter any 4 digit integer e.g 6754'
   3- Check the 'Server Response'

##Business Risk

   1- Exposure of Any Organization information
   2- Exposure of Any Organization Admin PII
   3- Exposure of User Email Address, Phone number, Username, Full name, UUID & UID. 

##Expected behavior

A clear and concise description of what you expected to happen.

Ensure SessionID and UserID matches the Organization ID before returning a 200 OK and Organization information.

Otherwise (i.e if the SessionID & UserID does not match the OrganizationID) Return 401 Unauthorized value.
