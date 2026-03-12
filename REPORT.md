# Conceptual Report: SecureNote Application

## 1. JS Engine vs. Runtime
The execution of JavaScript in this project operates within two distinct environments:

* **Frontend (Client-Side):** The React application is processed by the **Browser Runtime** (e.g., Chrome, Firefox). A **JS Engine** (such as Chrome's V8 Engine) compiles the JavaScript source code into machine code for execution on the local machine. Furthermore, the Browser Runtime provides Web APIs, such as `fetch()` for network requests and `document` for DOM manipulation.
* **Backend (Server-Side):** The Express.js application executes within the **Node.js Runtime**, which also utilizes the V8 Engine. However, Node.js diverges from the browser context by excluding Web APIs (lacking `window` or `document` objects) and instead provisioning System-level APIs. Examples include the `fs` module for file system operations (e.g., interacting with `notes.json`) and the `http` module for establishing network servers.

## 2. DOM (Document Object Model) and Rendering Mechanisms
This architecture utilizes **React.js** for UI development, relying on a rendering abstraction known as the **Virtual DOM**:

Upon state mutations triggered by user input or asynchronous data fetching, React refrains from directly mutating the Real DOM. Instead, it constructs a new Virtual DOM Tree in memory. This structure is evaluated against the preceding Virtual DOM state through a heuristic algorithm (Diffing) to calculate the precise operational changes required. Finally, React applies only these specific mutations to the Real DOM (Reconciliation). This algorithmic optimization minimizes render-blocking operations and ensures high-performance UI responsiveness.

## 3. HTTP/HTTPS Protocols & Request/Response Cycle
Initiating the "Save Document" action executes the following network communication sequence:
1.  **Request:** The client utilizes the `fetch()` API to issue an HTTP `POST` request to the server endpoint.
2.  **Headers:** The request payload includes the following metadata:
    * `Content-Type: application/json`
    * `X-Data-Source: <local/pockethost>` (Directs the backend multiplexer).
    * `Authorization: <DYNAMIC_TOKEN>` (Token context varies based on the active routing mode).
3.  **Response:** The backend extracts the token. If acting as a proxy to PocketHost, it dynamically injects the `Bearer` prefix and forwards the request. Upon validation, the system commits the transaction and returns a `201 Created` status. If validation fails, it issues a `401 Unauthorized` status, prompting the frontend to render a notification UI.

**The Imperative of HTTPS in Production:**
While HTTP is permissible for local development, HTTPS is strictly mandated in production environments. HTTPS enforces Transport Layer Security (TLS), encrypting all bidirectional traffic. Operating over plain HTTP transmits authorization tokens and application payloads as plaintext, exposing the infrastructure to Man-in-the-Middle (MitM) interception.

## 4. Environment Variables and Security Posture
The local `SECRET_TOKEN` is strictly isolated within a `.env` file on the backend server. The backend runtime operates in a secure, remote environment where source code and configuration files remain inaccessible to external actors.

**Consequences of Client-Side Secret Exposure:** Embedding secrets within the frontend source code compiles them into the distribution bundle downloaded by every client browser. Any entity could extract the tokens by inspecting the source code or intercepting payload headers via browser Developer Tools. This exposure compromises the authorization layer entirely.

## 5. Architectural Bonus: Hybrid Data Persistence & Proxy Middleware
To fulfill the Bonus Challenges, the system implements a **Dynamic Data Routing** architecture:
* **Public Mode (Local FS):** Persists data temporarily via the `fs` module into a local `notes.json` file.
* **Instructor Mode (PocketHost API):** Integrates with a PocketHost instance for persistent data storage. 

**Middleware Optimization (Schema Compliance):** The Express.js backend acts as an intelligent proxy. To ensure compatibility with the upstream PocketHost database, the backend automatically intercepts incoming requests, injects necessary schema fields (e.g., `user_id: 2`), and standardizes the OAuth 2.0 `Bearer` token format. This decouples the client application from the rigid schema requirements of the external database.

## 6. Cloud Deployment Process (Bonus Challenge)
The application utilizes a decoupled architecture for deployment, ensuring adherence to HTTPS protocols:
* **Frontend Deployment (Vercel):** The React application is deployed via Vercel. Continuous Deployment (CD) is integrated directly with the GitHub repository. The environment variable `VITE_API_URL` is configured securely to route HTTP requests to the production backend. Vercel automatically provisions an SSL/TLS certificate.
* **Backend Deployment (Render):** The Express.js runtime is deployed as a Web Service on Render. Environment variables (`PORT`, `SECRET_TOKEN`) are injected via the Render environment configuration panel, ensuring secrets remain strictly outside of the version control system.