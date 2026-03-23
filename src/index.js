const {
  createConnection,
  TextDocuments,
  Diagnostic,
  DiagnosticSeverity,
  ProposedFeatures,
  InitializeParams,
  DidChangeConfigurationNotification,
  CompletionItem,
  CompletionItemKind,
  TextDocumentPositionParams,
  TextDocumentSyncKind,
  InitializeResult
} = require('vscode-languageserver/node');

const {
  TextDocument
} = require('vscode-languageserver-textdocument');

const { spawn } = require('child_process');
const { readFileSync, unlinkSync, writeFileSync, existsSync } = require('fs');
const { tmpdir } = require('os');
const { join } = require('path');

const connection = createConnection(ProposedFeatures.all);
const documents = new TextDocuments(TextDocument);

let hasConfigurationCapability = false;
let hasWorkspaceFolderCapability = false;

connection.onInitialize((params) => {
  const capabilities = params.capabilities;
  hasConfigurationCapability = !!(
    capabilities.workspace && !!capabilities.workspace.configuration
  );
  hasWorkspaceFolderCapability = !!(
    capabilities.workspace && !!capabilities.workspace.workspaceFolders
  );

  const result = {
    capabilities: {
      textDocumentSync: TextDocumentSyncKind.Incremental,
      completionProvider: {
        resolveProvider: true
      }
    }
  };
  return result;
});

connection.onInitialized(() => {
  if (hasConfigurationCapability) {
    connection.client.register(
      DidChangeConfigurationNotification.type,
      undefined
    );
  }
});

async function runHadolint(content) {
  return new Promise((resolve, reject) => {
    const tmpFile = join(tmpdir(), `hadolint-lsp-${Date.now()}`);
    writeFileSync(tmpFile, content, 'utf-8');

    const hadolint = spawn('hadolint', ['--format', 'json', tmpFile], {
      stdio: ['ignore', 'pipe', 'pipe']
    });

    let stdout = '';
    let stderr = '';

    hadolint.stdout.on('data', (data) => {
      stdout += data.toString();
    });

    hadolint.stderr.on('data', (data) => {
      stderr += data.toString();
    });

    hadolint.on('close', (code) => {
      try {
        if (existsSync(tmpFile)) {
          unlinkSync(tmpFile);
        }
      } catch (e) {
      }

      if (stdout) {
        try {
          const results = JSON.parse(stdout);
          const diagnostics = results.map((result) => {
            const severity = mapSeverity(result.level);
            return {
              range: {
                start: { line: result.line - 1, character: 0 },
                end: { line: result.line - 1, character: 100 }
              },
              severity: severity,
              code: result.code,
              message: result.message,
              source: 'hadolint'
            };
          });
          resolve(diagnostics);
        } catch (e) {
          resolve([]);
        }
      } else {
        resolve([]);
      }
    });

    hadolint.on('error', (err) => {
      try {
        if (existsSync(tmpFile)) {
          unlinkSync(tmpFile);
        }
      } catch (e) {
      }
      resolve([]);
    });
  });
}

function mapSeverity(level) {
  switch (level.toLowerCase()) {
    case 'error':
      return DiagnosticSeverity.Error;
    case 'warning':
      return DiagnosticSeverity.Warning;
    case 'info':
      return DiagnosticSeverity.Information;
    case 'style':
      return DiagnosticSeverity.Hint;
    default:
      return DiagnosticSeverity.Warning;
  }
}

documents.onDidChangeContent(async (change) => {
  const text = change.document.getText();
  const diagnostics = await runHadolint(text);
  connection.sendDiagnostics({
    uri: change.document.uri,
    diagnostics
  });
});

documents.listen(connection);

connection.onCompletion(
  (_textDocumentPosition) => {
    return [];
  }
);

connection.onCompletionResolve(
  (item) => {
    return item;
  }
);

connection.listen();
