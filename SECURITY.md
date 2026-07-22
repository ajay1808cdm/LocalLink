# Security Policy

## Supported Versions

The following table outlines the currently supported versions of LocalLink that receive security updates:

| Version | Supported          |
| ------- | ------------------ |
| 1.x.x   | :white_check_mark: |
| < 1.0   | :x:                |

## Defensive Security Testing Scope

This project undergoes regular defensive security testing focusing on:
- Authentication & Authorization
- Input Validation
- Token Handling
- Safe Configuration

Please ensure that tests do **not**:
- Exploit vulnerabilities directly on production infrastructure.
- Perform destructive acts (e.g. DoS).

## Reporting a Vulnerability

If you discover a security vulnerability in this project, please report it safely. Do not create a public issue. Instead, send an email to the project maintainers with the details of the vulnerability, including steps to reproduce it safely.

We will endeavor to respond to your report as soon as possible and coordinate a fix.
