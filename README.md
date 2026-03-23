# Hadolint LSP

A Language Server Protocol implementation for Hadolint, the Dockerfile linter.

## Installation

```bash
npx @sankalpmukim/hadolint-lsp
```

Or install globally:

```bash
npm install -g @sankalpmukim/hadolint-lsp
```

## OpenCode Integration

To use hadolint-lsp with OpenCode, add it to your `opencode.json` configuration file:

### Local Configuration

Add to your project-local `opencode.json`:

```json
{
  "$schema": "https://opencode.ai/config.json",
  "lsp": {
    "hadolint": {
      "command": ["npx", "-y", "@sankalpmukim/hadolint-lsp", "--stdio"],
      "extensions": ["Dockerfile", "dockerfile"]
    }
  }
}
```

### Global Configuration

Add to your global OpenCode config (usually at `~/.config/opencode/opencode.json`):

```json
{
  "$schema": "https://opencode.ai/config.json",
  "lsp": {
    "hadolint": {
      "command": ["npx", "-y", "@sankalpmukim/hadolint-lsp", "--stdio"],
      "extensions": ["Dockerfile", "dockerfile"]
    }
  }
}
```

If you have installed @sankalpmukim/hadolint-lsp globally, you can use:

```json
{
  "$schema": "https://opencode.ai/config.json",
  "lsp": {
    "hadolint": {
      "command": ["hadolint-lsp", "--stdio"],
      "extensions": ["Dockerfile", "dockerfile"]
    }
  }
}
```

### Notes

- The LSP server communicates via stdio, so the `--stdio` flag is important
- The `extensions` array specifies which file extensions the LSP should handle
- OpenCode will automatically start the LSP server when you open a Dockerfile
- Make sure `hadolint` is available in your PATH (see Requirements section)

## Requirements

This LSP server requires [hadolint](https://github.com/hadolint/hadolint) to be installed and available in your PATH.

Install hadolint:

```bash
# On macOS
brew install hadolint

# On Linux
wget -O /usr/local/bin/hadolint https://github.com/hadolint/hadolint/releases/latest/download/hadolint-Linux-x86_64
chmod +x /usr/local/bin/hadolint

# Or using Docker (but LSP will not work with Docker)
docker pull hadolint/hadolint
```

## Usage

### Editor Integration

#### VS Code

Create or edit `.vscode/settings.json`:

```json
{
  "dockerfile.languageserver": {
    "dockerfile-language-server-node": {
      "command": "@sankalpmukim/hadolint-lsp"
    }
  }
}
```

Or use with Docker extension that supports LSP.

#### Vim/Neovim

With [nvim-lspconfig](https://github.com/neovim/nvim-lspconfig):

```lua
require'lspconfig'.hadolint_lsp.setup{
  cmd = { "@sankalpmukim/hadolint-lsp" },
  filetypes = { "dockerfile" },
  root_dir = require('lspconfig').util.root_pattern(".hadolint.yaml"),
}
```

#### Emacs

With [lsp-mode](https://github.com/emacs-lsp/lsp-mode):

```elisp
(use-package lsp-mode
  :config
  (lsp-register-client
    (make-lsp-client :new-connection (lsp-stdio-connection "@sankalpmukim/hadolint-lsp")
                     :major-modes '(dockerfile-mode)
                     :server-id 'hadolint-lsp)))
```

### Features

- Real-time Dockerfile linting
- Diagnostic highlighting
- Error, warning, info, and style level detection
- Supports all Hadolint rules
- Respects inline ignore pragmas (`# hadolint ignore=DLxxxx`)

## Configuration

The LSP server respects Hadolint configuration files:
- `.hadolint.yaml` in the project root
- `$XDG_CONFIG_HOME/hadolint.yaml`
- `$HOME/.config/hadolint.yaml`
- `$HOME/.hadolint.yaml`

Example `.hadolint.yaml`:

```yaml
failure-threshold: warning
ignored:
  - DL3008
override:
  error:
    - DL3006
  warning:
    - DL3015
```

## Testing

Run the test suite:

```bash
npm test
```

The test suite covers:
- Hadolint integration
- Severity mapping
- Diagnostic generation
- Package structure validation
- Executable verification

All tests should pass (17 total tests as of v0.1.0).

## Development

```bash
# Install dependencies
npm install

# Run tests
npm test

# Run in development mode
node src/index.js --stdio
```

## CI/CD

This project uses GitHub Actions for continuous integration and deployment.

- **Tests run automatically** on every push and pull request
- **Auto-publish to npm** when creating a GitHub release
- **Status badges** will appear at the top of this README

For detailed setup instructions, see [CI_CD.md](./CI_CD.md).

### Adding NPM Token

To enable auto-publishing, add `NPM_TOKEN` secret to GitHub:

1. Create a Granular Access Token at https://www.npmjs.com/settings/tokens
   - Organization: `@sankalpmukim`
   - Access level: Publish
   - Enable 2FA bypass
2. Go to https://github.com/sankalpmukim/hadolint-lsp/settings/secrets/actions/new
3. Name: `NPM_TOKEN`, paste token
4. Create release to publish: `git tag v0.1.1 && git push origin v0.1.1`

### Creating Releases

```bash
# Bump version
npm version patch

# Create and push tag (triggers publish)
git push origin v$(node -p "require('./package.json').version")
```

## License

GPL-3.0

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## Related

- [Hadolint](https://github.com/hadolint/hadolint) - The Dockerfile linter
- [Language Server Protocol](https://microsoft.github.io/language-server-protocol/)
