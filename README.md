# Billaro

A comprehensive guide on how to set up the Billaro project (both frontend and backend) along with the database on any new system.

## Table of Contents
1. [Prerequisites](#1-prerequisites)
2. [Installing Node.js](#2-installing-nodejs)
3. [Installing PostgreSQL](#3-installing-postgresql)
4. [Setting up the Database](#4-setting-up-the-database)
5. [Environment Variables Setup (.env)](#5-environment-variables-setup-env)
6. [Backend (Server) Setup](#6-backend-server-setup)
7. [Frontend (Client) Setup](#7-frontend-client-setup)
8. [Accessing the Application](#8-accessing-the-application)

---

## 1. Prerequisites
Before starting, ensure you have a terminal (Command Prompt, PowerShell, or macOS/Linux Terminal) and a code editor (like [VS Code](https://code.visualstudio.com/)) installed on your system.

---

## 2. Installing Node.js
Node.js is required to run the JavaScript code for both the server and the client.

1. Go to the official Node.js website: [https://nodejs.org/](https://nodejs.org/)
2. Download the **LTS (Long Term Support)** version (v18, v20, or newer).
3. Run the downloaded installer and follow the default prompts (keep clicking Next until finished).
4. Verify the installation by opening a new terminal window and running the following commands:
   ```bash
   node -v
   npm -v
   ```
   *These commands should print the installed versions of Node and npm. If they don't, restart your computer and try again.*

---

## 3. Installing PostgreSQL
PostgreSQL is the database used by the backend.

1. Go to the official PostgreSQL download page: [https://www.postgresql.org/download/](https://www.postgresql.org/download/)
2. Select your operating system and download the interactive installer.
3. Run the installer.
4. **Crucial Steps During Installation**:
   - It will ask you to set a password for the default `postgres` user. **Remember this password!** (e.g., `admin123`).
   - Keep the default port as `5432` (or carefully note it down if the installer changes it, like `5433`).
   - Ensure the option to install **pgAdmin** (the graphical interface for managing PostgreSQL) is checked.

---

## 4. Setting up the Database
Now we need to create an empty database for the application to use.

1. Open **pgAdmin** (which was installed in the previous step).
2. Connect to your local PostgreSQL server in pgAdmin by entering the password you set during installation.
3. In the left sidebar, right-click on **Databases** -> hover over **Create** -> click **Database...**
4. In the "Database" name field, type exactly: `billaro`
5. Click **Save**. You now have an empty database ready.

---

## 5. Environment Variables Setup (.env)
The backend needs a file containing configuration secrets (like your database password) so it can connect to the database securely.

1. Navigate to the `server` folder inside the project.
2. In the `server` folder, create a new file and name it exactly `.env` (don't forget the dot at the beginning).
3. Open this `.env` file in your code editor and copy-paste the following lines:

```env
# Billaro Server Environment
PORT=5000

# PostgreSQL Database Connection
# Format: postgresql://<USERNAME>:<PASSWORD>@localhost:<PORT>/<DATABASE_NAME>?schema=public
DATABASE_URL="postgresql://postgres:YOUR_PASSWORD_HERE@localhost:5432/billaro?schema=public"

# JWT Secrets for Authentication
JWT_SECRET=indux_billaro_super_secret_key_2024
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=30d

# File Upload Directory
UPLOAD_DIR=./uploads
```

4. **Connecting your DB**: Look at the `DATABASE_URL` line. You MUST replace `YOUR_PASSWORD_HERE` with the actual password you created for PostgreSQL in Step 3.
   - *Example:* If your password is `mysecretpassword`, the line should look like this:
     `DATABASE_URL="postgresql://postgres:mysecretpassword@localhost:5432/billaro?schema=public"`
   - *Note:* If your PostgreSQL installed on port `5433` instead of `5432`, change the `5432` to `5433` in that URL as well.
5. Save the file.

---

## 6. Backend (Server) Setup
Now we will install the backend code, connect it to the database, and create the required tables.

1. Open your terminal.
2. Navigate to the `server` directory using the `cd` command:
   ```bash
   cd path/to/Billaro/server
   ```
3. Install all required backend packages:
   ```bash
   npm install
   ```
4. Generate the Prisma Client (this prepares the database bridge for the code):
   ```bash
   npm run prisma:generate
   ```
5. Run the Database Migrations. This is a very important step. It will read your `.env` file, connect to the `billaro` database, and automatically create all the necessary tables:
   ```bash
   npm run prisma:migrate
   ```
   *(If prompted to name the migration, you can just press Enter or type "init".)*
6. *(Optional)* If the project has initial seed data to populate the DB, run:
   ```bash
   npm run prisma:seed
   ```
7. Start the backend development server:
   ```bash
   npm run start:dev
   ```
8. You should see logs in the terminal saying the Nest application successfully started. **Leave this terminal open and running.**

---

## 7. Frontend (Client) Setup
1. Open a **new, separate terminal window** (keep the backend one running).
2. Navigate to the `client` directory:
   ```bash
   cd path/to/Billaro/client
   ```
3. Install all required frontend packages:
   ```bash
   npm install
   ```
4. Start the frontend Next.js server:
   ```bash
   npm run dev
   ```

---

## 8. Accessing the Application
- Open your web browser (Chrome, Firefox, etc.).
- Go to [http://localhost:3000](http://localhost:3000) to view and interact with the application UI.
- (The backend API is running silently in the background at `http://localhost:5000`).

You are now successfully running the entire Billaro application locally!
