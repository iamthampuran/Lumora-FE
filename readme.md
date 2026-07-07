# Lumora API

Lumora is a robust ASP.NET Core 8 Web API designed to streamline event and studio management. It connects consumers with photography/videography studios, facilitating event inquiries, bookings, secure payments (RazorPay), and media gallery deliveries.

## 🚀 Features

- **User Management:** Distinct profiles for Consumers and Studios, along with Employee role management.
- **Inquiry & Booking Workflow:** Seamless lifecycle from event inquiry submission to approval and rejection.
- **Financial Transactions:** Integrated payment tracking mapped to specific inquiries and events using RazorPay.
- **Media Delivery:** Gallery management with external provider links and status tracking (Draft, Published, etc.).
- **Review System:** Post-event reviews and ratings linked directly to inquiries.

## 🛠️ Tech Stack

- **Framework:** .NET 8 / ASP.NET Core Web API
- **Database:** PostgreSQL
- **ORM:** Entity Framework Core 8
- **Architecture:** Clean Architecture (Domain, Application, Infrastructure, API)
- **Containerization:** Docker & Docker Compose

## 🏗️ Architecture Overview

The solution follows Clean Architecture principles to enforce separation of concerns:

- **`Lumora.Domain`**: Contains enterprise logic, entities (Event, Inquiry, Payment, Gallery), enums, value objects, and base entities (implementing Soft Deletes). Has no external dependencies.
- **`Lumora.Application`**: Contains business logic, interfaces (Contracts), and DTOs.
- **`Lumora.Infrastructure`**: Contains database context (`AppDbContext`), EF Core configurations, migrations, and implementations of interfaces (e.g., `GenericRepository`, `UnitOfWork`).
- **`Lumora.Api`**: The presentation layer containing API Controllers, Swagger configuration, and Dependency Injection setup.

## 📋 Prerequisites

Before you begin, ensure you have the following installed:

- [.NET 8.0 SDK](https://dotnet.microsoft.com/download/dotnet/8.0)
- [Docker Desktop](https://www.docker.com/products/docker-desktop) (for running the PostgreSQL database)
- An IDE like Visual Studio 2022, JetBrains Rider, or VS Code.

## 🚦 Getting Started

### 1. Database Setup (Docker)

Lumora uses a Dockerized PostgreSQL database for local development.

1. Open a terminal in the root directory.
2. Spin up the database container:
   ```bash
   docker-compose up -d
   ```
