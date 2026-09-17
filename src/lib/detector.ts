export interface LanguageInfo {
  id: string;
  name: string;
  extension: string;
  standard: string;
}

export const SUPPORTED_LANGUAGES: LanguageInfo[] = [
  { id: 'javascript', name: 'JavaScript', extension: '.js', standard: 'ES2024' },
  { id: 'typescript', name: 'TypeScript', extension: '.ts', standard: 'v5.x' },
  { id: 'python', name: 'Python', extension: '.py', standard: 'v3.12' },
  { id: 'java', name: 'Java', extension: '.java', standard: 'JDK 21' },
  { id: 'csharp', name: 'C#', extension: '.cs', standard: '.NET 8' },
  { id: 'cpp', name: 'C++', extension: '.cpp', standard: 'C++20' },
  { id: 'go', name: 'Go', extension: '.go', standard: 'v1.22' },
  { id: 'rust', name: 'Rust', extension: '.rs', standard: 'Edition 2021' },
  { id: 'php', name: 'PHP', extension: '.php', standard: 'v8.3' },
  { id: 'ruby', name: 'Ruby', extension: '.rb', standard: 'v3.3' },
  { id: 'swift', name: 'Swift', extension: '.swift', standard: 'v5.10' },
  { id: 'kotlin', name: 'Kotlin', extension: '.kt', standard: 'v2.0' }
];

export function detectLanguage(code: string): string {
  if (!code || !code.trim()) return 'javascript';
  const c = code.trim();

  // Python: def, elif, import, from ... import, print(, self, __init__, colon after def/if/for
  if (
    /(\bdef\s+\w+\s*\(|\belif\b|\bfrom\s+\w+\s+import\b|\bself\b|__init__|print\(|#\s*.*)/.test(c) &&
    !/[{};]/.test(c)
  ) {
    return 'python';
  }
  if (/\b(def|class)\s+\w+.*:\s*$/.test(c) || /\bimport\s+[\w.]+\s*$/.test(c)) {
    return 'python';
  }

  // Rust: fn, pub fn, let mut, impl, struct, match, println!, -> Result, &mut, use std::
  if (/\b(fn\s+\w+|pub\s+fn|let\s+mut|println!|impl\s+\w+|use\s+std::|match\s+\w+\s*\{|->\s*(Result|Option))\b/.test(c)) {
    return 'rust';
  }

  // Go: package main, func, fmt.Print, :=, chan, go func, struct {
  if (/\b(package\s+\w+|func\s+\w+|fmt\.Print|chan\s+\w+|go\s+func)\b|:=/.test(c)) {
    return 'go';
  }

  // PHP: <?php, $this, echo, function ... $, namespace
  if (/<\?php|\$[a-zA-Z_\x80-\xff][a-zA-Z0-9_\x80-\xff]*\s*=|echo\s+['"]|->\w+\(/.test(c)) {
    return 'php';
  }

  // C++: #include <iostream>, #include <vector>, std::cout, std::endl, using namespace std;, template<
  if (/#include\s*<|std::cout|std::endl|std::vector|using\s+namespace\s+std;|\btemplate\s*</.test(c)) {
    return 'cpp';
  }

  // C#: using System;, Console.WriteLine, namespace, public class, async Task, get; set
  if (/using\s+System\b|Console\.WriteLine|async\s+Task|get;\s*set;|public\s+class\s+\w+\s*:\s*\w+/.test(c)) {
    return 'csharp';
  }

  // Java: public static void main, System.out.println, public class, implements, extends, @Override
  if (/public\s+static\s+void\s+main|System\.out\.print|@Override|public\s+class\s+\w+|implements\s+\w+|package\s+[a-z0-9_.]+;/.test(c)) {
    return 'java';
  }

  // Kotlin: fun main, val , var , data class, companion object, println(
  if (/\bfun\s+\w+|data\s+class\b|companion\s+object\b|\bval\s+\w+\s*:\s*[A-Z]/.test(c)) {
    return 'kotlin';
  }

  // Swift: import SwiftUI, import UIKit, struct ... : View, func, guard let, @State, @Binding
  if (/import\s+(SwiftUI|UIKit)|struct\s+\w+\s*:\s*View|guard\s+let\b|@State|@Binding/.test(c)) {
    return 'swift';
  }

  // Ruby: def ... end, puts, require_relative, attr_accessor, elsif
  if (/(\bdef\s+\w+[\s\S]*?\bend\b|puts\s+['"]|attr_accessor|require_relative)/.test(c)) {
    return 'ruby';
  }

  // TypeScript vs JavaScript:
  // TypeScript markers: interface, type Name =, : string, : number, : boolean, : void, as const, <T>
  if (
    /\b(interface\s+\w+|type\s+\w+\s*=|readonly\s+\w+|enum\s+\w+|declare\s+\w+)\b|:\s*(string|number|boolean|any|void|unknown|never|Record<|Array<|Promise<)|\bas\s+const\b/.test(c)
  ) {
    return 'typescript';
  }

  // Fallback default: JavaScript
  return 'javascript';
}
