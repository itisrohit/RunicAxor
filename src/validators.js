const supportedLanguages = ['python', 'nodejs']; // Extend this as needed

function validateCodeExecutionRequest(code, language) {
  if (!code || typeof code !== 'string') {
    return 'Code must be provided and must be a string';
  }

  if (!supportedLanguages.includes(language)) {
    return `Language "${language}" is not supported`;
  }

  return null; // No errors
}

module.exports = { validateCodeExecutionRequest };