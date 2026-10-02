export const DEFAULT_SERVER_URL = 'http://localhost:5173';

export function loadCliConfig(options = {}, environment = process.env) {
  const hasOption = options.serverUrl !== undefined;
  const hasEnvironmentValue = environment.CODESENSE_API_URL !== undefined;
  const configuredUrl = hasOption
    ? options.serverUrl
    : hasEnvironmentValue
      ? environment.CODESENSE_API_URL
      : DEFAULT_SERVER_URL;

  if (typeof configuredUrl !== 'string' || !configuredUrl.trim()) {
    throw new Error('The server URL must be a non-empty URL.');
  }

  let parsedUrl;
  try {
    parsedUrl = new URL(configuredUrl.trim());
  } catch {
    throw new Error(`Invalid server URL: "${configuredUrl}". Use an origin such as http://localhost:5173.`);
  }

  if (parsedUrl.protocol !== 'http:' && parsedUrl.protocol !== 'https:') {
    throw new Error('The server URL must use http or https.');
  }
  if (parsedUrl.username || parsedUrl.password || parsedUrl.search || parsedUrl.hash || parsedUrl.pathname !== '/') {
    throw new Error('The server URL must be an origin without credentials, path, query, or fragment.');
  }

  return {
    serverUrl: parsedUrl.origin,
    analysisEndpoint: new URL('/api/analyze', parsedUrl.origin).toString(),
    source: hasOption ? 'command option' : hasEnvironmentValue ? 'CODESENSE_API_URL' : 'default',
  };
}