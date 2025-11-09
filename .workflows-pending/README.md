# Pending Workflows

This directory contains GitHub Actions workflow files that need to be manually added to `.github/workflows/` due to permission restrictions.

## Files

### test-suite.yml

Comprehensive Test Suite workflow with 4 stages:
- Unit & Integration Tests
- Security Audit
- End-to-End Tests
- Quality Gate

**To deploy:**
```bash
# Option 1: Grant workflow permissions and push
# Go to Repository Settings → Actions → General → Workflow permissions

# Option 2: Manually copy the file
cp .workflows-pending/test-suite.yml .github/workflows/test-suite.yml
git add .github/workflows/test-suite.yml
git commit -m "ci: Add Test Suite workflow"
git push
```

**Note:** This workflow cannot be pushed automatically because the GitHub App requires 'workflows' permission to create or update workflow files.
