Hello

##Issue
This pull request serves as a placeholder for Issue ==> https://github.com/AIxBlock-2023/awesome-ai-dev-platform-opensource/issues/50

HTML injection is a type of injection vulnerability that occurs when a user is able to control an input point and is able to inject arbitrary HTML code into a vulnerable web application.

AIxBlock application service allows the execution of arbitrary HTML Injection payload on AIxBlock mail service through the "invited new members" email notification template.

##See below for screenshot.
https://drive.google.com/drive/folders/1IJAtg8wJoQKJ2MzKimP938f6CFeMOnZg?usp=sharing

##To Reproduce
Steps to reproduce the behavior:

- Go to "https://app.aixblock.io/user/organization'
- Go to Account Settings --> Organizations --> Add Member
- Scroll down to 'User Name' field and enter the payload (<\h1\>test.com<\/h1\> (please remove \)
- Enter the Victim's email address and forward


##Expected behavior
A clear and concise description of what you expected to happen.

- Form field should should be sanitized against meta characters
- Ensure the application logic also prevent the executions of injected payloads

