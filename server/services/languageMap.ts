// Maps file extensions to language names and colors for the 3D city
export const LANGUAGE_MAP: Record<string, { language: string; color: string }> = {
  // JavaScript / TypeScript
  '.js': { language: 'JavaScript', color: '#f0db4f' },
  '.jsx': { language: 'React JSX', color: '#61dafb' },
  '.ts': { language: 'TypeScript', color: '#3178c6' },
  '.tsx': { language: 'React TSX', color: '#61dafb' },
  '.mjs': { language: 'JavaScript', color: '#f0db4f' },
  '.cjs': { language: 'JavaScript', color: '#f0db4f' },

  // Web
  '.html': { language: 'HTML', color: '#e34c26' },
  '.htm': { language: 'HTML', color: '#e34c26' },
  '.css': { language: 'CSS', color: '#264de4' },
  '.scss': { language: 'SCSS', color: '#cd6799' },
  '.sass': { language: 'Sass', color: '#cd6799' },
  '.less': { language: 'Less', color: '#1d365d' },
  '.vue': { language: 'Vue', color: '#42b883' },
  '.svelte': { language: 'Svelte', color: '#ff3e00' },

  // Python
  '.py': { language: 'Python', color: '#3776ab' },
  '.pyx': { language: 'Cython', color: '#3776ab' },
  '.pyi': { language: 'Python Stub', color: '#3776ab' },

  // Java / JVM
  '.java': { language: 'Java', color: '#b07219' },
  '.kt': { language: 'Kotlin', color: '#A97BFF' },
  '.kts': { language: 'Kotlin Script', color: '#A97BFF' },
  '.scala': { language: 'Scala', color: '#c22d40' },
  '.groovy': { language: 'Groovy', color: '#4298b8' },
  '.clj': { language: 'Clojure', color: '#db5855' },

  // C-family
  '.c': { language: 'C', color: '#555555' },
  '.h': { language: 'C Header', color: '#555555' },
  '.cpp': { language: 'C++', color: '#f34b7d' },
  '.cc': { language: 'C++', color: '#f34b7d' },
  '.hpp': { language: 'C++ Header', color: '#f34b7d' },
  '.cs': { language: 'C#', color: '#178600' },

  // Systems
  '.rs': { language: 'Rust', color: '#dea584' },
  '.go': { language: 'Go', color: '#00ADD8' },
  '.swift': { language: 'Swift', color: '#F05138' },
  '.m': { language: 'Objective-C', color: '#438eff' },

  // Scripting
  '.rb': { language: 'Ruby', color: '#CC342D' },
  '.php': { language: 'PHP', color: '#4F5D95' },
  '.pl': { language: 'Perl', color: '#0298c3' },
  '.lua': { language: 'Lua', color: '#000080' },
  '.sh': { language: 'Shell', color: '#89e051' },
  '.bash': { language: 'Bash', color: '#89e051' },
  '.zsh': { language: 'Zsh', color: '#89e051' },
  '.fish': { language: 'Fish', color: '#89e051' },
  '.ps1': { language: 'PowerShell', color: '#012456' },

  // Data / Config
  '.json': { language: 'JSON', color: '#a0a0a0' },
  '.yaml': { language: 'YAML', color: '#cb171e' },
  '.yml': { language: 'YAML', color: '#cb171e' },
  '.toml': { language: 'TOML', color: '#9c4221' },
  '.xml': { language: 'XML', color: '#0060ac' },
  '.ini': { language: 'INI', color: '#a0a0a0' },
  '.env': { language: 'Env', color: '#a0a0a0' },

  // Markup / Docs
  '.md': { language: 'Markdown', color: '#083fa1' },
  '.mdx': { language: 'MDX', color: '#083fa1' },
  '.rst': { language: 'reStructuredText', color: '#141414' },
  '.tex': { language: 'LaTeX', color: '#3D6117' },
  '.txt': { language: 'Text', color: '#a0a0a0' },

  // Database
  '.sql': { language: 'SQL', color: '#e38c00' },
  '.prisma': { language: 'Prisma', color: '#2D3748' },
  '.graphql': { language: 'GraphQL', color: '#e535ab' },
  '.gql': { language: 'GraphQL', color: '#e535ab' },

  // DevOps
  '.dockerfile': { language: 'Dockerfile', color: '#384d54' },
  '.tf': { language: 'Terraform', color: '#5C4EE5' },
  '.hcl': { language: 'HCL', color: '#5C4EE5' },

  // Other
  '.r': { language: 'R', color: '#198CE7' },
  '.dart': { language: 'Dart', color: '#00B4AB' },
  '.ex': { language: 'Elixir', color: '#6e4a7e' },
  '.exs': { language: 'Elixir', color: '#6e4a7e' },
  '.erl': { language: 'Erlang', color: '#B83998' },
  '.hs': { language: 'Haskell', color: '#5e5086' },
  '.elm': { language: 'Elm', color: '#60B5CC' },
  '.wasm': { language: 'WebAssembly', color: '#654FF0' },
  '.zig': { language: 'Zig', color: '#ec915c' },
  '.nim': { language: 'Nim', color: '#ffc200' },
  '.v': { language: 'V', color: '#5D87BF' },
};

export function getLanguageInfo(filename: string): { language: string; color: string } {
  const ext = filename.substring(filename.lastIndexOf('.')).toLowerCase();

  // Special cases for files without standard extensions
  const basename = filename.split('/').pop()?.toLowerCase() || '';
  if (basename === 'dockerfile') return LANGUAGE_MAP['.dockerfile'];
  if (basename === 'makefile') return { language: 'Makefile', color: '#427819' };
  if (basename === 'cmakelists.txt') return { language: 'CMake', color: '#064F8C' };

  return LANGUAGE_MAP[ext] || { language: 'Other', color: '#8b8b8b' };
}

// Estimate lines of code from file size (bytes)
// Average ~40 bytes per line is a reasonable heuristic
export function estimateLinesOfCode(sizeBytes: number): number {
  return Math.max(1, Math.round(sizeBytes / 40));
}
