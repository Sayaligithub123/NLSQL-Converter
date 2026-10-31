# ASD-STE100 - System/Software Description

## 1. Document Control

- Project Name: NLSQL Converter / NL2SQL AI Database Assistant
- Document Type: System Description
- Version: 1.0
- Date: 2026-10-17
- Status: Draft / Project Overview
- Scope: Frontend + backend + AI-assisted database querying system

---

## 2. Purpose

The system is designed to let users interact with company databases using natural language instead of writing SQL manually. A user can connect to a MySQL database, ask plain-English questions, and receive either generated SQL or direct query results from the database. The application is intended to reduce the need for technical SQL expertise while maintaining controlled access, identity management, and traceability of database activity.

The solution combines:

- a secure authentication layer,
- saved database connection metadata,
- schema inspection for MySQL databases,
- AI-driven SQL generation using a Gemini-based model,
- execution of generated SQL against the connected database,
- query history and API-key management for operational usage.

---

## 3. System Goals

### 3.1 Primary Goals

1. Allow non-technical users to query databases using natural language.
2. Translate natural-language questions into valid SQL statements.
3. Execute those queries safely against connected MySQL databases.
4. Provide a secure login experience with role-based user management.
5. Maintain a history of queries for accountability and analysis.
6. Support multiple database connections and user-managed access.
7. Enable controlled integration with external systems via API keys.

### 3.2 Secondary Goals

1. Reduce dependency on SQL specialists for routine reporting questions.
2. Improve data accessibility for business teams and analysts.
3. Keep sensitive database credentials out of persistent storage.
4. Support local development and cloud-ready deployment patterns.
5. Provide a simple web-based user interface for end users.

---

## 4. Scope

### 4.1 In Scope

- User registration, login, password reset, and profile management
- MongoDB-backed user storage and authentication
- JWT-based authorization
- Database connection testing and saving
- MySQL schema inspection
- AI-based natural-language-to-SQL conversion
- Result execution and returned table data
- Query history tracking
- API key generation and revocation
- Web UI for dashboard, auth, connection management, and assistant access

### 4.2 Out of Scope

- Full database administration features beyond connection management
- Multi-DB vendor support beyond MySQL in the current implementation
- Advanced RBAC enforcement beyond user ownership checks and roles
- Full enterprise audit, observability, and compliance frameworks
- Production-grade deployment orchestration or Kubernetes setup

---

## 5. System Overview

The project consists of a frontend application and a backend API service.

### 5.1 Frontend

The frontend is implemented with React, TypeScript, and Vite. It provides:

- login and registration screens,
- forgot/reset password flow,
- dashboard view,
- database connection management,
- natural-language assistant interface,
- query history and settings pages,
- JWT-based protected route handling.

### 5.2 Backend

The backend is implemented with FastAPI and Python. It exposes a REST API and handles:

- authentication and token validation,
- database connection security and validation,
- schema extraction from selected MySQL databases,
- AI conversion of natural language to SQL,
- SQL execution using SQLAlchemy / PyMySQL,
- storage of metadata in MongoDB,
- query history and API-key lifecycle management.

### 5.3 Data Stores

- MongoDB: stores users, database connections, query history, and API keys.
- MySQL: stores the live business data queried by the assistant.

### 5.4 External AI Dependency

The AI layer relies on a Gemini API key to transform natural-language questions into SQL. If the API key is missing, the system will log the condition and the chatbot functionality will be unavailable.

---

## 6. User Roles and Actors

### 6.1 End User

An authenticated user who:

- logs in,
- connects to a database,
- submits natural-language questions,
- views query results and history,
- manages profile and security settings.

### 6.2 Administrator / Manager

A user with elevated or default managerial access who may:

- create accounts,
- manage database connections,
- monitor usage and query history,
- create or revoke API keys.

### 6.3 System Components

- Frontend client
- FastAPI backend
- MongoDB database
- MySQL source database
- Gemini language model service

---

## 7. Functional Architecture

### 7.1 Authentication and Identity

The system authenticates users through a JWT-based flow. Passwords are stored as hashes, and users can:

- register,
- log in,
- authenticate using Google sign-in,
- change password,
- initiate password reset,
- fetch their current profile.

### 7.2 Database Connection Management

Users can validate database credentials without saving them, then connect and store connection metadata after a successful test. Stored metadata includes database host, port, schema name, username, and status. The password itself is not persisted.

### 7.3 Natural Language Query Flow

For each query:

1. The user selects a saved connection.
2. The system loads the connection ownership and user permissions.
3. The backend reads the database schema using the supplied database password.
4. The question and schema are sent to the Gemini-based NL-to-SQL engine.
5. SQL is generated and validated.
6. The SQL is executed against the target database.
7. Results and execution details are returned to the UI.
8. Query history is saved for future review.

### 7.4 Query History and API Key Management

The system stores previous user queries with metadata such as:

- question,
- generated SQL,
- row count,
- execution success/failure,
- time taken,
- database used.

API keys can also be created and revoked for programmatic or external use while masking the actual secret after creation.

---

## 8. API Interface Summary

Base path: /api

### 8.1 Health and System Status

| Method | Endpoint | Auth | Purpose |
|---|---|---|---|
| GET | /api/health | No | Checks service health and Gemini configuration state |

### 8.2 Authentication Endpoints

| Method | Endpoint | Auth | Purpose |
|---|---|---|---|
| POST | /api/auth/register | No | Create account and return JWT |
| POST | /api/auth/login | No | Authenticate user and return JWT |
| POST | /api/auth/google | No | Google-based sign-in or registration |
| GET | /api/auth/me | Yes | Get current authenticated user |
| PUT | /api/auth/profile | Yes | Update user profile data |
| POST | /api/auth/change-password | Yes | Change user password |
| POST | /api/auth/forgot-password | No | Request password reset token |
| POST | /api/auth/reset-password | No | Complete password reset flow |
| GET | /api/auth/db-status | No | Check MongoDB status |
| POST | /api/auth/seed-demo | No | Create demo user for development/testing |

### 8.3 Database Connection Endpoints

| Method | Endpoint | Auth | Purpose |
|---|---|---|---|
| POST | /api/databases/test-connection | No | Validate MySQL credentials without saving |
| POST | /api/databases/connect | Yes | Test and save database metadata |
| GET | /api/databases/ | Yes | List all saved connections for current user |
| DELETE | /api/databases/{connection_id} | Yes | Remove a saved connection if owned by user |

### 8.4 Chat and Schema Endpoints

| Method | Endpoint | Auth | Purpose |
|---|---|---|---|
| POST | /api/chat/query | Yes | Main NL-to-SQL flow |
| POST | /api/chat/schema/{connection_id} | Yes | Fetch schema for a connected database |
| GET | /api/chat/history | Yes | Retrieve query history for the user |

### 8.5 API Key Management Endpoints

| Method | Endpoint | Auth | Purpose |
|---|---|---|---|
| GET | /api/api-keys | Yes | List API keys |
| POST | /api/api-keys | Yes | Create new API key |
| DELETE | /api/api-keys/{key_id} | Yes | Revoke an API key |

---

## 9. Security Considerations

The system applies several control measures:

- Passwords are hashed using a secure password hashing method.
- JWT-based authorization is used to protect routes.
- Database passwords are not stored in MongoDB.
- User ownership checks are enforced when accessing saved connections and keys.
- API keys are stored as hashes, and the raw key is returned only once.
- CORS is enabled for local frontend development origins.
- Reset tokens are used for password recovery flows.

---

## 10. Operational Characteristics

### 10.1 Deployment Model

The project is structured for local development and small-to-medium production deployments. The backend runs with FastAPI and operates against MongoDB and a target MySQL instance.

### 10.2 Environment Configuration

The backend relies on environment configuration for:

- MongoDB URI and database name,
- JWT secret,
- access token lifetime,
- Gemini API key,
- CORS origins.

### 10.3 Runtime Characteristics

- Backend server listens on port 8000 by default.
- Frontend runs on port 5173 in the Vite development setup.
- API docs are available via Swagger at /docs.

---

## 11. Non-Functional Requirements

### 11.1 Availability

The service should remain available for authenticated users, including a fallback or resilient startup path when MongoDB is not immediately available during development.

### 11.2 Security

The system should avoid leaking credentials, protect route access, and maintain safe token handling.

### 11.3 Usability

The application should provide a straightforward UI for non-technical users to connect databases and ask questions naturally.

### 11.4 Maintainability

The project uses modular router-based API organization and clear separation between authentication, database handling, AI chat, and API management.

---

## 12. Expected Business Value

This project addresses the business problem of enabling data access without requiring SQL expertise. It supports faster business reporting, lower dependence on technical users, and safer operational patterns by keeping credentials transient and validating access against user ownership.

---

## 13. Acceptance Summary

The solution is considered successful if it can:

1. register and authenticate users securely,
2. validate and save database connections safely,
3. inspect MySQL schemas,
4. convert natural language questions into valid SQL,
5. execute generated SQL and return results,
6. preserve query history,
7. provide secure API-key management,
8. run as a usable local web application.

---

## 14. Conclusion

The NLSQL Converter is an AI-assisted natural-language-to-SQL platform designed to simplify database interaction for end users while preserving security, user ownership, and system control. It is structured as a modern web application with a React frontend, FastAPI backend, MongoDB persistence, and AI-based SQL generation for a MySQL-first workflow.
