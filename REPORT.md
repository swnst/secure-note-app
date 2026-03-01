# SecureNote: Conceptual Architecture Report

## 1. JS Engine vs. Runtime
[cite_start]The **JavaScript Engine** (e.g., V8 in Chrome and Node.js) is the interpreter and compiler that parses and executes JavaScript code[cite: 44]. However, the code executes in different **Runtime Environments**:
- **Frontend (Browser Runtime):** Executes the UI code. The runtime provides Web APIs like the DOM, `fetch`, and `setTimeout`. [cite_start]It allows JavaScript to interact with the user interface and browser functionalities[cite: 43, 44].
- **Backend (Node.js Runtime):** Executes the server code. [cite_start]Node.js provides non-browser APIs, such as the `fs` module (for our JSON data persistence) and the `http` module, enabling the engine to interact with the operating system and network directly[cite: 43, 44].

## 2. DOM & Virtual DOM
[cite_start]Since this project utilizes React.js for the frontend, it relies on the **Virtual DOM**[cite: 46]. 
[cite_start]Instead of directly manipulating the real HTML DOM structure (which is slow and resource-intensive), React maintains a lightweight representation of the UI in memory (the Virtual DOM)[cite: 46]. When a state changes (e.g., when a new note is fetched or added), React compares the new Virtual DOM with the previous one (a process called "Diffing"). [cite_start]It then calculates the most efficient way to update the actual DOM and applies only those specific changes, resulting in high performance and seamless UI updates without page reloads[cite: 45, 46].

## 3. HTTP/HTTPS Protocol & Communication
[cite_start]When a user clicks "Save Note", the following **Request/Response Cycle** occurs[cite: 47]:
1. **Request:** The browser initiates an HTTP POST request to the backend using the Fetch API.
2. **Headers:** The request includes specific headers:
   - `Content-Type: application/json`: Tells the server the payload format.
   - [cite_start]`Authorization: <user_input_token>`: Transmits the secret token for security validation[cite: 27, 47].
3. **Processing:** The Node.js Express server receives the request, parses the JSON, validates the token via middleware, and saves the data.
4. **Response:** The server returns an HTTP Status Code `201 Created` along with the newly created note object.

[cite_start]**Importance of HTTPS:** Even though HTTP is sufficient for local development, HTTPS is strictly required for production[cite: 48]. HTTPS encrypts the transport layer using TLS. [cite_start]Without it, sensitive data like the `Authorization` header (`SECRET_TOKEN`) and note contents are sent as plain text, making them vulnerable to Man-in-the-Middle (MITM) attacks where attackers can intercept and steal the credentials[cite: 48].

## 4. Environment Variables & Security
[cite_start]The `SECRET_TOKEN` is stored in the backend's `.env` file to enforce strict separation of configuration from source code[cite: 49]. The `.env` file is excluded from version control via `.gitignore`, ensuring secrets are never leaked to public repositories.

[cite_start]**Consequences of Frontend Exposure:** If the `SECRET_TOKEN` were placed in the frontend code, it would be bundled into the static JavaScript files sent to the user's browser[cite: 50]. [cite_start]Anyone could simply open the browser's Developer Tools (Sources tab) or inspect network payloads, extract the token, and gain unauthorized access to create or delete notes on our backend API[cite: 50]. Storing it strictly on the server ensures only authorized operators possess the key.