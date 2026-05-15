# Security Policy

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 1.x.x   | :white_check_mark: |
| < 1.0   | :x:                |

## Reporting a Vulnerability

We take the security of project-validator seriously. If you believe you have found a security vulnerability, please **DO NOT** disclose it publicly.

Instead, report it privately to the project maintainers:

- **Email**: contact@coderooz.in
- **GitHub**: [Create a security advisory](https://github.com/coderooz/project-validator/security/advisories/new)

Please include the following information in your report:

- Type of vulnerability
- Full description of the issue
- Steps to reproduce
- Potential impact
- Suggested fix (if any)

### What to expect

1. **Acknowledgment**: We will acknowledge receipt within 48 hours
2. **Assessment**: We will assess the issue within 5 business days
3. **Fix**: We will develop and release a fix based on severity:
   - Critical: 24-48 hours
   - High: within 7 days
   - Medium/Low: next release cycle
4. **Disclosure**: We will coordinate public disclosure with you

## Security Best Practices

When using project-validator:

1. **Keep updated**: Always use the latest version
   ```bash
   npm update @project-validator/cli
   ```

2. **Validate dependencies**: Run regular `pnpm audit` in your projects

3. **Review config files**: Environment files (`.env*`) should be in `.gitignore`
   when used with project-validator's env validation

4. **CI/CD usage**: When running in CI:
   - Use `--json` output for machine-parseable results
   - Store reports in secure artifact storage
   - Do not expose secret values in validation output

## Dependency Security

We use automated tools to monitor dependency vulnerabilities:

- **pnpm audit** runs in CI for every PR
- **Dependabot** is configured for automated updates
- **CodeQL** analysis runs weekly

## Disclosure Policy

We follow coordinated disclosure:

1. Reporter notifies maintainers privately
2. Maintainers develop and test fix
3. Fix is released with advisory
4. Reporter is credited (if desired)
5. Public disclosure after 30 days or after fix release

## Recognition

We thank security researchers who help us keep project-validator safe. Contributors who report valid vulnerabilities will be acknowledged in our security hall of fame (with permission).
